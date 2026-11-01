import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { randomBytes } from 'node:crypto';
import { Vault } from '../apps/pwa/src/lib/vault';
import { HubStore } from '../apps/hub/src/store';
import { createApp } from '../apps/hub/src/app';
import { seedOperations, seedConflictOperations } from '../packages/content/seed';
import { digest, union, makeOp, signOperation, materialize } from '../packages/sync-core/src/index';
let store: HubStore,
  server: Server,
  instances: Vault[] = [];
const nativeFetch = globalThis.fetch;
beforeEach(async () => {
  store = new HubStore(':memory:', randomBytes(32).toString('hex'));
  server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${(server.address() as any).port}`;
  vi.stubGlobal('fetch', (path: any, options: any) => nativeFetch(new URL(path, origin), options));
});
afterEach(async () => {
  for (const v of instances) await v.destroy();
  instances = [];
  vi.unstubAllGlobals();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  store.close();
});
async function device(name: string) {
  const v = new Vault('test-' + name + '-' + randomBytes(4).toString('hex'));
  instances.push(v);
  await v.create('123456', store.enroll(name, 'Reviewer'));
  return v;
}
describe('encrypted local durability and real HTTP synchronization', () => {
  it('adds demo conflicts to an existing failed-sync workspace without changing 35 pending writes', async () => {
    store.ingest(
      seedOperations().filter((op) => op.deviceId === 'seed'),
      undefined,
      true,
    );
    const a = await device('Existing demo');
    await a.sync();
    for (let i = 0; i < 35; i++) await a.write(`local-score-${i}`, 'score', i, 'set', 'assessment');
    await a.saveEntryDrafts({ 'unfinished-note': 'Preserve my draft' });
    const pending = structuredClone(a.pending);
    const before = structuredClone(a.state!);
    store.db.exec('DELETE FROM devices');
    await expect(a.sync()).rejects.toThrow('Device session expired');
    expect(await a.ensureDemoConflicts(false)).toBe(0);
    expect(await a.ensureDemoConflicts(true)).toBe(6);
    expect(await a.ensureDemoConflicts(true)).toBe(0);
    expect(a.pending).toEqual(pending);
    expect(a.state!.identity).toEqual(before.identity);
    expect(a.state!.acked).toEqual(before.acked);
    expect(a.state!.cursor).toBe(before.cursor);
    expect(a.state!.lastSync).toBe(before.lastSync);
    expect(a.state!.entryDrafts).toEqual(before.entryDrafts);
    expect(a.state!.ops.filter((op) => !op.deviceId.startsWith('seed-conflict-'))).toEqual(before.ops);
    a.lock();
    await a.unlock('123456');
    expect(a.pending).toEqual(pending);
    expect(a.view.conflicts).toHaveLength(3);
    const conflict = a.view.conflicts[0];
    await a.write(conflict.entityId, 'score', 80, 'resolve', 'assessment');
    expect(await a.ensureDemoConflicts(true)).toBe(0);
    expect(a.view.conflicts).toHaveLength(2);
    expect(a.pending).toHaveLength(36);
    expect(a.state!.ops.filter((op) => op.deviceId.startsWith('seed-conflict-'))).toEqual(
      seedConflictOperations(),
    );
  });
  it('keeps doctor entries separate from students and preserves concurrent visits through reload and sync', async () => {
    const a = await device('Doctor A');
    const b = await device('Doctor B');
    const value = {
      patientName: 'Example Patient',
      date: '2020-01-01',
      time: '09:30',
      purpose: 'Routine consultation',
    };
    await a.write('doctor-entry-a', 'doctorEntry', value, 'add', 'doctor-entry');
    await b.write('doctor-entry-b', 'doctorEntry', { ...value, purpose: 'Follow-up' }, 'add', 'doctor-entry');
    await expect(
      a.write('invalid-entry', 'doctorEntry', { ...value, time: '25:99' }, 'add', 'doctor-entry'),
    ).rejects.toThrow();
    const reopened = new Vault(a.name);
    instances.push(reopened);
    await reopened.unlock('123456');
    expect(reopened.view.entities['doctor-entry-a'].doctorEntry[0]).toMatchObject(value);
    expect(JSON.stringify(await reopened.db.vault.get('state'))).not.toContain('Example Patient');
    await reopened.sync();
    await b.sync();
    await reopened.sync();
    await reopened.sync();
    expect(reopened.state!.ops.filter((op) => op.field === 'doctorEntry')).toHaveLength(2);
    expect(reopened.view.entities['doctor-entry-b'].doctorEntry[0].purpose).toBe('Follow-up');
    expect(Object.values(reopened.view.entities).filter((record) => record.type === 'child')).toHaveLength(0);
    expect(reopened.view.conflicts).toHaveLength(0);
    expect(await digest(reopened.state!.ops)).toBe(await digest(b.state!.ops));
  });
  it('keeps offline writes available after expiry and renews the session on sync', async () => {
    const identity = store.enroll('Expired offline device', 'Reviewer'),
      expired = Date.now() - 1000,
      a = new Vault('test-expired-' + randomBytes(4).toString('hex'));
    instances.push(a);
    store.db.prepare('UPDATE devices SET expires=? WHERE id=?').run(expired, identity.deviceId);
    identity.expires = expired;
    await a.create('123456', identity);

    await a.write('offline-child', 'name', 'Saved while the hub session was expired');
    expect(a.view.entities['offline-child'].name).toBe('Saved while the hub session was expired');
    expect(a.pending).toHaveLength(1);

    await a.sync();
    expect(a.state!.identity.expires).toBeGreaterThan(Date.now());
    expect(a.pending).toHaveLength(0);
    expect(store.all()).toHaveLength(1);
  });
  it('keeps incompatible stale-tab edits concurrent until an observed review resolves them', async () => {
    const a = await device('Stale semantic edits');
    await a.write('child', 'dob', '2018-03-01');
    const b = new Vault(a.name);
    instances.push(b);
    await b.unlock('123456');
    const first = await a.write('child', 'dob', '2019-04-15'),
      second = await b.write('child', 'dob', '2020-06-10');
    expect(second.counter).toBeGreaterThan(first.counter);
    expect(second.deps).not.toContain(first.opId);
    expect(b.view.conflicts).toHaveLength(1);
    expect(b.view.conflicts[0].versions.map((op) => op.value).sort()).toEqual(['2019-04-15', '2020-06-10']);
    await a.unlock('123456');
    expect(a.view.conflicts).toHaveLength(1);
    const resolution = await a.write('child', 'dob', '2019-04-15', 'resolve');
    expect(resolution.deps).toEqual(expect.arrayContaining([first.opId, second.opId]));
    expect(a.view.conflicts).toHaveLength(0);
    expect(a.view.entities.child.dob).toBe('2019-04-15');
  });
  it('chains same-tab queued edits while preserving unseen competing edits in a batch', async () => {
    const a = await device('Observed queued edits');
    const [first, second] = await Promise.all([
      a.write('child', 'dob', '2019-04-15'),
      a.write('child', 'dob', '2020-06-10'),
    ]);
    expect(second.deps).toContain(first.opId);
    expect(a.view.conflicts).toHaveLength(0);
    expect(a.view.entities.child.dob).toBe('2020-06-10');
    const b = new Vault(a.name);
    instances.push(b);
    await b.unlock('123456');
    await a.write('child:2026-10-31', 'attendance', 'present', 'set', 'attendance');
    await b.writeMany([
      { entityId: 'child:2026-10-31', field: 'attendance', value: 'absent', type: 'attendance' },
      { entityId: 'child', field: 'guardian', value: 'Synthetic caregiver' },
    ]);
    expect(b.view.conflicts).toHaveLength(1);
    expect(b.view.conflicts[0].field).toBe('attendance');
    const batch = b.state!.ops.slice(-2);
    expect(batch[1].deps).toContain(batch[0].opId);
  });
  it('preserves changes and drafts from stale tabs, including legacy rows without a revision', async () => {
    const a = await device('Shared tabs'),
      raw = (await a.db.vault.get('state'))!;
    await a.db.vault.put({ id: raw.id, sealed: raw.sealed });
    const b = new Vault(a.name);
    instances.push(b);
    await b.unlock('123456');
    await a.write('child-a', 'name', 'First tab child');
    await a.saveEntryDrafts({ 'score|child-a': '24' });
    await b.write('child-b', 'name', 'Second tab child');
    await b.saveEntryDrafts({ 'score|child-b': '58' });
    // Exporting from the stale first tab must include the other tab’s committed data.
    const backup = await a.export('shared-backup-passphrase'),
      restored = await device('Shared tab backup');
    await restored.import(backup, 'shared-backup-passphrase');
    expect(restored.view.entities['child-a'].name).toBe('First tab child');
    expect(restored.view.entities['child-b'].name).toBe('Second tab child');
    expect(restored.state!.entryDrafts).toEqual({ 'score|child-a': '24', 'score|child-b': '58' });
    expect(a.state!.ops.map((op) => op.counter)).toEqual([1, 2]);
    expect((await a.db.vault.get('state'))!.revision).toBeGreaterThan(0);
    await a.sync();
    expect(store.all()).toHaveLength(2);
    expect(a.pending).toHaveLength(0);
  });
  it('serializes concurrent intents across three tabs without losing operations or reusing counters', async () => {
    const a = await device('Concurrent tabs'),
      b = new Vault(a.name),
      c = new Vault(a.name);
    instances.push(b, c);
    await Promise.all([b.unlock('123456'), c.unlock('123456')]);
    await Promise.all(
      [a, b, c].flatMap((tab, index) =>
        Array.from({ length: 5 }, (_, n) =>
          tab.write(`child-${index}-${n}`, 'name', `Tab ${index} child ${n}`),
        ),
      ),
    );
    await a.unlock('123456');
    expect(a.state!.ops).toHaveLength(15);
    expect(new Set(a.state!.ops.map((op) => op.opId)).size).toBe(15);
    expect(a.state!.ops.map((op) => op.counter).sort((x, y) => x - y)).toEqual(
      Array.from({ length: 15 }, (_, n) => n + 1),
    );
    expect(Object.keys(a.view.entities)).toHaveLength(15);
    await Promise.all([a.sync(), b.sync(), c.sync()]);
    expect(store.all()).toHaveLength(15);
    expect(store.summary(a.state!.identity.schoolId).quarantined).toHaveLength(0);
    expect((await a.db.vault.get('state'))!.revision).toBeGreaterThanOrEqual(16);
  });
  it('keeps a committed save encrypted and locked when the transaction finishes after a lock', async () => {
    const a = await device('Lock during commit');
    let committed!: () => void, release!: () => void;
    const atCommit = new Promise<void>((resolve) => (committed = resolve)),
      gate = new Promise<void>((resolve) => (release = resolve)),
      transaction = a.db.transaction.bind(a.db),
      spy = vi.spyOn(a.db, 'transaction').mockImplementationOnce(((...args: any[]) =>
        (transaction as any)(...args).then(async (result: unknown) => {
          committed();
          await gate;
          return result;
        })) as any);
    const save = a.write('locked-child', 'name', 'Durably saved before lock');
    await atCommit;
    a.lock();
    release();
    await save;
    expect(a.key).toBeUndefined();
    expect(a.state).toBeUndefined();
    spy.mockRestore();
    await a.unlock('123456');
    expect(a.view.entities['locked-child'].name).toBe('Durably saved before lock');
  });
  it('does not finish an unlock after the user has locked the workspace again', async () => {
    const a = await device('Cancelled unlock');
    a.lock();
    let reached!: () => void, release!: () => void;
    const atRead = new Promise<void>((resolve) => (reached = resolve)),
      gate = new Promise<void>((resolve) => (release = resolve)),
      get = a.db.vault.get.bind(a.db.vault),
      spy = vi.spyOn(a.db.vault, 'get').mockImplementationOnce((async (key: any) => {
        const value = await get(key);
        reached();
        await gate;
        return value;
      }) as any);
    const unlocking = a.unlock('123456');
    await atRead;
    a.lock();
    release();
    await expect(unlocking).rejects.toThrow('workspace was locked');
    expect(a.key).toBeUndefined();
    expect(a.state).toBeUndefined();
    spy.mockRestore();
  });
  it('cancels in-flight workspace creation without replacing or publishing keys', async () => {
    const a = new Vault('test-create-cancel-' + randomBytes(4).toString('hex'));
    instances.push(a);
    let reached!: () => void, release!: () => void;
    const atTransaction = new Promise<void>((resolve) => (reached = resolve)),
      gate = new Promise<void>((resolve) => (release = resolve)),
      transaction = a.db.transaction.bind(a.db),
      spy = vi.spyOn(a.db, 'transaction').mockImplementationOnce((async (...args: any[]) => {
        reached();
        await gate;
        return (transaction as any)(...args);
      }) as any);
    const creating = a.create('123456', store.enroll('Cancelled setup', 'Reviewer'));
    await atTransaction;
    a.lock();
    release();
    await expect(creating).rejects.toThrow('workspace was locked');
    expect(a.key).toBeUndefined();
    expect(a.state).toBeUndefined();
    expect(await a.exists()).toBe(false);
    spy.mockRestore();
  });
  it('allows only one concurrent creator to commit the same browser workspace', async () => {
    const a = new Vault('test-create-race-' + randomBytes(4).toString('hex')),
      b = new Vault(a.name);
    instances.push(a, b);
    const outcomes = await Promise.allSettled([
      a.create('123456', store.enroll('First setup', 'Reviewer')),
      b.create('654321', store.enroll('Second setup', 'Reviewer')),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
    const winner = outcomes[0].status === 'fulfilled' ? a : b,
      pin = winner === a ? '123456' : '654321';
    await winner.write('created-child', 'name', 'Only accepted setup');
    await winner.unlock(pin);
    expect(winner.view.entities['created-child'].name).toBe('Only accepted setup');
  });
  it('keeps encrypted keys, unsynced operations and drafts unchanged after an incorrect PIN', async () => {
    const a = await device('PIN preservation');
    await a.write('unsynced-child', 'name', 'Saved only on this device');
    await a.saveEntryDrafts({ 'score|unsynced-child': '37' });
    const keysBefore = await a.db.meta.get('keys'),
      stateBefore = await a.db.vault.get('state'),
      reopened = new Vault(a.name);
    instances.push(reopened);
    await expect(reopened.unlock('000000')).rejects.toThrow(
      'Incorrect PIN. Use the PIN chosen when setting up this browser.',
    );
    expect(reopened.key).toBeUndefined();
    expect(reopened.state).toBeUndefined();
    expect(await reopened.db.meta.get('keys')).toEqual(keysBefore);
    expect(await reopened.db.vault.get('state')).toEqual(stateBefore);

    await reopened.unlock('123456');
    expect(reopened.view.entities['unsynced-child'].name).toBe('Saved only on this device');
    expect(reopened.pending).toHaveLength(1);
    expect(reopened.state!.entryDrafts?.['score|unsynced-child']).toBe('37');
  });
  it('distinguishes damaged encrypted state after a valid PIN without replacing its wrapped key', async () => {
    const a = await device('State corruption');
    await a.write('child', 'name', 'Preserved encrypted record');
    const keysBefore = await a.db.meta.get('keys'),
      saved = (await a.db.vault.get('state'))!;
    const changed = saved.sealed.data[0] === 'A' ? 'B' : 'A',
      damaged = { ...saved, sealed: { ...saved.sealed, data: changed + saved.sealed.data.slice(1) } };
    await a.db.vault.put(damaged);
    a.lock();
    await expect(a.unlock('123456')).rejects.toThrow(
      'The PIN unlocked your key, but the encrypted workspace could not be read.',
    );
    expect(a.key).toBeUndefined();
    expect(a.state).toBeUndefined();
    expect(await a.db.meta.get('keys')).toEqual(keysBefore);
    expect(await a.db.vault.get('state')).toEqual(damaged);
  });
  it('commits offline writes and pending operations together across reload', async () => {
    const a = await device('A');
    await a.write('child', 'name', 'Offline child');
    const reopened = new Vault(a.name);
    instances.push(reopened);
    await reopened.unlock('123456');
    expect(reopened.view.entities.child.name).toBe('Offline child');
    expect(reopened.pending).toHaveLength(1);
    const raw = await reopened.db.vault.get('state');
    expect(JSON.stringify(raw)).not.toContain('Offline child');
  });
  it('two isolated devices preserve independent records and explicit attendance/score conflicts', async () => {
    const a = await device('A'),
      b = await device('B');
    await a.write('child:2026-10-31', 'attendance', 'present', 'set', 'attendance');
    await b.write('child:2026-10-31', 'attendance', 'absent', 'set', 'attendance');
    await a.write('attempt', 'score', 70, 'set', 'assessment');
    await b.write('attempt', 'score', 90, 'set', 'assessment');
    await a.write('other-a', 'name', 'A');
    await b.write('other-b', 'name', 'B');
    await a.sync();
    await b.sync();
    await a.sync();
    expect(a.view.conflicts).toHaveLength(2);
    expect(a.view.entities['other-a'].name).toBe('A');
    expect(a.view.entities['other-b'].name).toBe('B');
    expect(await digest(a.state!.ops)).toBe(await digest(b.state!.ops));
  });
  it('retries a dropped acknowledgement after server commit without duplicate effects', async () => {
    const a = await device('A');
    await a.write('child', 'visits', { note: 'One visit' }, 'add');
    await expect(a.sync({ dropAfterCommit: true })).rejects.toThrow('acknowledgement lost');
    expect(store.all()).toHaveLength(1);
    expect(a.pending).toHaveLength(1);
    await a.sync();
    expect(a.pending).toHaveLength(0);
    expect(a.view.entities.child.visits).toHaveLength(1);
    expect(store.all()).toHaveLength(1);
  });
  it('reopens after an interrupted pull and resumes from the atomically stored cursor', async () => {
    const author = store.enroll('Author', 'Reviewer');
    let log: any[] = [];
    for (let n = 0; n < 75; n++)
      log.push(
        await signOperation(
          makeOp(log, author.deviceId, author.actorId, 'child', 'visits', { n }, 'add'),
          author.token,
        ),
      );
    store.ingest(log);
    const a = await device('A');
    await expect(
      a.sync({
        afterChunk: async () => {
          throw new Error('Cable pulled');
        },
      }),
    ).rejects.toThrow('Cable pulled');
    expect(a.state!.cursor).toBe(32);
    const reopened = new Vault(a.name);
    instances.push(reopened);
    await reopened.unlock('123456');
    expect(reopened.state!.cursor).toBe(32);
    const r = await reopened.sync();
    expect(r.received).toBe(43);
    expect(reopened.state!.ops).toHaveLength(75);
  });
  it('backup restores unsynced signed operations to a different authorized device and forwards them safely', async () => {
    const a = await device('A');
    await a.write('child', 'name', 'Never synced');
    const backup = await a.export('long-passphrase'),
      b = await device('B');
    await expect(b.import(backup, 'wrong-passphrase')).rejects.toThrow('Incorrect password');
    expect(b.state!.ops).toHaveLength(0);
    await b.import(backup, 'long-passphrase');
    expect(b.pending).toHaveLength(1);
    await b.sync();
    expect(store.all()).toHaveLength(1);
    expect(b.view.entities.child.name).toBe('Never synced');
  });
  it('surfaces storage-full failure without confirming or adding the operation', async () => {
    const a = await device('A'),
      before = await a.db.vault.get('state'),
      spy = vi
        .spyOn(a.db.vault, 'put')
        .mockRejectedValueOnce(Object.assign(new Error('quota'), { name: 'QuotaExceededError' }));
    await expect(a.write('child', 'name', 'Not saved')).rejects.toThrow('storage is full');
    expect(a.state!.ops).toHaveLength(0);
    expect(await a.db.vault.get('state')).toEqual(before);
    spy.mockRestore();
    await a.write('child', 'name', 'Saved after storage recovered');
    await a.sync();
    expect(a.pending).toHaveLength(0);
    expect(store.all()).toHaveLength(1);
  });
  it('persists encrypted unfinished entry drafts without adding accepted sync operations', async () => {
    const a = await device('Draft worker');
    await a.saveEntryDrafts({
      'assessment-title': 'Fractions',
      'assessment-attempt': '2',
      'score|child-001': '105',
    });
    const reopened = new Vault(a.name);
    instances.push(reopened);
    await reopened.unlock('123456');
    expect(reopened.state!.entryDrafts?.['score|child-001']).toBe('105');
    expect(reopened.state!.entryDrafts?.['assessment-title']).toBe('Fractions');
    expect(reopened.pending).toHaveLength(0);
    expect(reopened.state!.ops).toHaveLength(0);
    expect(JSON.stringify(await reopened.db.vault.get('state'))).not.toContain('Fractions');
    const backup = await reopened.export('draft-passphrase'),
      other = await device('Restored drafts');
    await other.import(backup, 'draft-passphrase');
    expect(other.state!.entryDrafts?.['score|child-001']).toBe('105');
    expect(other.pending).toHaveLength(0);
    await other.saveEntryDrafts({ 'score|child-001': '42' });
    await expect(other.import(backup, 'draft-passphrase')).rejects.toThrow('different unfinished scores');
    expect(other.state!.entryDrafts?.['score|child-001']).toBe('42');
    await reopened.saveEntryDrafts({ 'score|child-001': null });
    expect(reopened.state!.entryDrafts?.['score|child-001']).toBeUndefined();
  });
});
