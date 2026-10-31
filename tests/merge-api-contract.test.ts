import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { createApp } from '../apps/hub/src/app';
import { HubStore } from '../apps/hub/src/store';
import { Vault } from '../apps/pwa/src/lib/vault';
import { makeOp, signOperation, type Op } from '../packages/sync-core/src/index';
import { exportBackup } from '../packages/sync-core/src/crypto';
import type { Field } from '../packages/sync-core/src/policy';

type Identity = ReturnType<HubStore['enroll']>;
let store: HubStore, server: Server, origin: string;
let vaults: Vault[];
const nativeFetch = globalThis.fetch;

beforeEach(async () => {
  store = new HubStore(':memory:', randomBytes(32).toString('hex'));
  vaults = [];
  server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  vi.stubGlobal('fetch', (path: string | URL, options?: RequestInit) =>
    nativeFetch(new URL(path, origin), options),
  );
});

afterEach(async () => {
  for (const vault of vaults) await vault.destroy();
  vi.unstubAllGlobals();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  store.close();
});

async function request(identity: Identity, path: string, body?: unknown, key?: string, method = 'POST') {
  const response = await fetch(origin + path, {
    method,
    headers: {
      Authorization: `Bearer ${identity.token}`,
      'Content-Type': 'application/json',
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { response, data: await response.json() };
}

const signed = (
  identity: Identity,
  observed: Op[],
  value: Op['value'],
  field: Field = 'name',
  kind: Op['kind'] = 'set',
) =>
  signOperation(
    makeOp(observed, identity.deviceId, identity.actorId, 'contract-child', field, value, kind),
    identity.token,
  );

async function conflict(field: Field = 'name') {
  const a = store.enroll('First account author', 'Reviewer');
  const b = store.enroll('Second account author', 'Reviewer');
  const originals = await Promise.all([
    signed(a, [], 'First account', field),
    signed(b, [], 'Second account', field),
  ]);
  store.ingest(originals);
  expect(store.listConflicts()).toHaveLength(1);
  return { a, b, originals, review: store.listConflicts()[0] };
}

async function localReviewer() {
  const vault = new Vault('merge-contract-' + randomUUID());
  vaults.push(vault);
  await vault.create('123456', store.enroll('Local reviewer', 'Reviewer'));
  await vault.sync();
  expect(vault.view.conflicts).toHaveLength(1);
  return vault;
}

describe('merge review contract across HTTP and encrypted local entry', () => {
  it('rejects a review after a third independent alternative arrives and commits no receipt', async () => {
    const { a, originals, review } = await conflict();
    const third = store.enroll('Third offline author', 'Reviewer');
    const unseen = await signed(third, [], 'Third account');
    store.ingest([unseen]);
    const key = randomUUID();
    const result = await request(
      a,
      `/api/conflicts/${encodeURIComponent(review.id)}/resolve`,
      {
        value: 'First account',
        expectedOpIds: originals.map((op) => op.opId),
      },
      key,
    );
    expect(result.response.status).toBe(409);
    expect(result.data.code).toBe('CONFLICT_CHANGED');
    expect(store.all()).toHaveLength(3);
    expect(
      store
        .listConflicts()[0]
        .versions.map((op) => op.value)
        .sort(),
    ).toEqual(['First account', 'Second account', 'Third account']);
    expect(store.db.prepare('SELECT 1 FROM command_receipts WHERE request_id=?').get(key)).toBeUndefined();
  });

  it('keeps a late offline edit in conflict with a resolution that did not observe it', async () => {
    const { a, originals } = await conflict();
    const late = store.enroll('Late offline author', 'Reviewer');
    const unseen = await signed(late, [], 'Late offline account');
    const resolution = await signed(a, originals, 'Reviewed account', 'name', 'resolve');
    store.ingest([unseen]);
    const result = await request(a, '/api/sync', { protocol: 1, ops: [resolution], cursor: 0, limit: 32 });
    expect(result.response.status).toBe(200);
    expect(store.listConflicts()).toHaveLength(1);
    expect(
      store
        .listConflicts()[0]
        .versions.map((op) => op.value)
        .sort(),
    ).toEqual(['Late offline account', 'Reviewed account']);
    expect(store.all()).toHaveLength(4);
    expect(store.all().map((op) => op.opId)).toEqual(expect.arrayContaining(originals.map((op) => op.opId)));
  });

  it('blocks a normal HTTP correction on an open conflict even with the latest record version', async () => {
    const { a } = await conflict();
    const version = store.entityVersion('contract-child');
    const result = await request(
      a,
      '/api/children/contract-child',
      {
        name: 'Unreviewed overwrite',
        baseVersion: version,
      },
      randomUUID(),
      'PATCH',
    );
    expect(result.response.status).toBe(409);
    expect(result.data.code).toBe('REVIEW_REQUIRED');
    expect(store.all()).toHaveLength(2);
    expect(store.listConflicts()).toHaveLength(1);
  });

  it('enforces the original author domain role for clinical conflict resolution', async () => {
    const { originals, review } = await conflict('allergy');
    const teacher = store.enroll('School-only teacher', 'Teacher');
    const result = await request(
      teacher,
      `/api/conflicts/${encodeURIComponent(review.id)}/resolve`,
      {
        value: 'First account',
        expectedOpIds: originals.map((op) => op.opId),
      },
      randomUUID(),
    );
    expect(result.response.status).toBe(403);
    expect(result.data.code).toBe('ROLE_FORBIDDEN');
    expect(store.all()).toHaveLength(2);
    expect(store.listConflicts()).toHaveLength(1);
    expect(store.db.prepare('SELECT COUNT(*) AS n FROM devices WHERE internal=1').get()).toMatchObject({
      n: 0,
    });
  });

  it('replays a completed review without repeating operations or its audit decision', async () => {
    const { a, originals, review } = await conflict();
    const path = `/api/conflicts/${encodeURIComponent(review.id)}/resolve`;
    const body = { value: 'Reviewed account', expectedOpIds: originals.map((op) => op.opId) };
    const key = randomUUID();
    expect((await request(a, path, body, key)).response.status).toBe(200);
    const result = await request(a, path, body, key);
    expect(result.response.status).toBe(200);
    expect(result.data.replayed).toBe(true);
    expect(store.all()).toHaveLength(3);
    expect(store.listConflicts()).toHaveLength(0);
    expect(store.listAudit().filter((entry) => entry.event === 'conflict-resolved')).toHaveLength(1);
  });

  it('requires explicit review before a normal encrypted local write can replace known alternatives', async () => {
    await conflict();
    const vault = await localReviewer();
    await expect(vault.write('contract-child', 'name', 'Unreviewed overwrite')).rejects.toThrow(
      /review|conflict/i,
    );
    expect(vault.state!.ops).toHaveLength(2);
    expect(vault.view.conflicts).toHaveLength(1);
    await vault.write('contract-child', 'name', 'Reviewed account', 'resolve');
    expect(vault.view.conflicts).toHaveLength(0);
    expect(vault.state!.ops).toHaveLength(3);
  });

  it('rejects the entire local entry batch if one ordinary edit would absorb an observed conflict', async () => {
    await conflict();
    const vault = await localReviewer();
    await expect(
      vault.writeMany([
        { entityId: 'other-child', field: 'name', value: 'Valid separate child' },
        { entityId: 'contract-child', field: 'name', value: 'Unreviewed overwrite' },
      ]),
    ).rejects.toThrow(/review|conflict/i);
    expect(vault.state!.ops).toHaveLength(2);
    expect(vault.view.entities['other-child']).toBeUndefined();
    expect(vault.view.conflicts).toHaveLength(1);
  });

  it('does not let a signed ordinary sync operation silently absorb both known alternatives', async () => {
    const { a, originals } = await conflict();
    const overwrite = await signed(a, originals, 'Unreviewed overwrite');
    const result = await request(a, '/api/sync', { protocol: 1, ops: [overwrite], cursor: 0, limit: 32 });
    expect([200, 409]).toContain(result.response.status);
    expect(store.listConflicts()).toHaveLength(1);
    expect(store.all().map((op) => op.opId)).toEqual(expect.arrayContaining(originals.map((op) => op.opId)));
  });

  it('accepts a legitimate offline correction which only observed one side of the server conflict', async () => {
    const { a, originals } = await conflict();
    const correction = await signed(a, [originals[0]], 'First author correction');
    const result = await request(a, '/api/sync', { protocol: 1, ops: [correction], cursor: 0, limit: 32 });
    expect(result.response.status).toBe(200);
    expect(store.all()).toHaveLength(3);
    expect(
      store
        .listConflicts()[0]
        .versions.map((op) => op.value)
        .sort(),
    ).toEqual(['First author correction', 'Second account']);
  });

  it('allows an unrelated field correction without concealing the existing conflict', async () => {
    const { a, originals } = await conflict();
    const unrelated = await signed(a, originals, 'Dhareri', 'village');
    const result = await request(a, '/api/sync', { protocol: 1, ops: [unrelated], cursor: 0, limit: 32 });
    expect(result.response.status).toBe(200);
    expect(store.getRecord('contract-child')?.record.village).toBe('Dhareri');
    expect(store.listConflicts()).toHaveLength(1);
    expect(store.listConflicts()[0].field).toBe('name');
  });

  it('accepts complete sequential batches even when the dependent operation is listed first', async () => {
    const author = store.enroll('Out of order sender', 'Reviewer');
    const first = await signed(author, [], 'First account');
    const second = await signed(author, [first], 'Sequential correction');
    const result = await request(author, '/api/sync', {
      protocol: 1,
      ops: [second, first],
      cursor: 0,
      limit: 32,
    });
    expect(result.response.status).toBe(200);
    expect(store.all()).toHaveLength(2);
    expect(store.listConflicts()).toHaveLength(0);
    expect(store.getRecord('contract-child')?.record.name).toBe('Sequential correction');
  });

  it('rejects an incomplete causal history until its missing parent arrives, then accepts a safe retry', async () => {
    const author = store.enroll('Interrupted sender', 'Reviewer');
    const first = await signed(author, [], 'First account');
    const second = await signed(author, [first], 'Sequential correction');
    const incomplete = await request(author, '/api/sync', {
      protocol: 1,
      ops: [second],
      cursor: 0,
      limit: 32,
    });
    expect(incomplete.response.status).toBe(409);
    expect(incomplete.data.code).toBe('MISSING_DEPENDENCY');
    expect(store.all()).toHaveLength(0);
    expect(
      (await request(author, '/api/sync', { protocol: 1, ops: [first], cursor: 0, limit: 32 })).response
        .status,
    ).toBe(200);
    expect(
      (await request(author, '/api/sync', { protocol: 1, ops: [second], cursor: 0, limit: 32 })).response
        .status,
    ).toBe(200);
    expect(store.all()).toHaveLength(2);
    expect(store.getRecord('contract-child')?.record.name).toBe('Sequential correction');
  });

  it('rejects a signed self-parent instead of acknowledging an unmaterializable value', async () => {
    const author = store.enroll('Invalid causal sender', 'Reviewer');
    const draft = makeOp([], author.deviceId, author.actorId, 'contract-child', 'name', 'Valid payload');
    const cyclic = await signOperation({ ...draft, deps: [draft.opId] }, author.token);
    const result = await request(author, '/api/sync', { protocol: 1, ops: [cyclic], cursor: 0, limit: 32 });
    expect(result.response.status).toBe(409);
    expect(result.data.code).toBe('INVALID_CAUSAL_HISTORY');
    expect(store.all()).toHaveLength(0);
  });

  it('rejects a signed dependency cycle atomically rather than hiding both values', async () => {
    const a = store.enroll('Cycle sender A', 'Reviewer');
    const b = store.enroll('Cycle sender B', 'Reviewer');
    const first = makeOp([], a.deviceId, a.actorId, 'contract-child', 'name', 'First account');
    const second = makeOp([], b.deviceId, b.actorId, 'contract-child', 'name', 'Second account');
    const cyclic = await Promise.all([
      signOperation({ ...first, deps: [second.opId] }, a.token),
      signOperation({ ...second, deps: [first.opId] }, b.token),
    ]);
    const result = await request(a, '/api/sync', { protocol: 1, ops: cyclic, cursor: 0, limit: 32 });
    expect(result.response.status).toBe(409);
    expect(result.data.code).toBe('INVALID_CAUSAL_HISTORY');
    expect(store.all()).toHaveLength(0);
  });

  it('requires explicit review before a normal restore absorbs a known delete-versus-edit conflict', async () => {
    const deleter = store.enroll('Archiving worker', 'Reviewer');
    const editor = store.enroll('Offline correcting worker', 'Reviewer');
    const initial = await signed(editor, [], 'Original account');
    const deletion = await signed(deleter, [initial], true, 'deleted', 'delete');
    const edit = await signed(editor, [initial], 'Concurrent correction');
    store.ingest([initial, deletion, edit]);
    expect(store.listConflicts()[0].field).toBe('deleted');
    const restore = await signed(deleter, store.all(), false, 'deleted', 'resurrect');
    const result = await request(deleter, '/api/sync', { protocol: 1, ops: [restore], cursor: 0, limit: 32 });
    expect(result.response.status).toBe(409);
    expect(result.data.code).toBe('REVIEW_REQUIRED');
    expect(store.listConflicts()).toHaveLength(1);
    expect(store.all()).toHaveLength(3);
  });

  it('does not acknowledge a descendant when its parent in the same batch is quarantined', async () => {
    const revoked = store.enroll('Revoked source', 'Reviewer');
    const current = store.enroll('Forwarding source', 'Reviewer');
    const parent = await signed(revoked, [], 'Preserved pending parent');
    const child = await signed(current, [parent], 'Dependent correction');
    store.db.prepare('UPDATE devices SET revoked=? WHERE id=?').run(Date.now(), revoked.deviceId);
    const result = await request(current, '/api/sync', {
      protocol: 1,
      ops: [child, parent],
      cursor: 0,
      limit: 32,
    });
    expect(result.response.status).toBe(409);
    expect(result.data.code).toBe('MISSING_DEPENDENCY');
    expect(store.all()).toHaveLength(0);
    // The whole failed request rolled back. The forwarding device still owns
    // both signed pending payloads and can preserve/export them for review.
    expect(store.summary().quarantined).toHaveLength(0);
  });

  it('allows an ordinary correction after concurrent authors agreed on the same value', async () => {
    const a = store.enroll('Agreeing author A', 'Reviewer');
    const b = store.enroll('Agreeing author B', 'Reviewer');
    const originals = await Promise.all([signed(a, [], 'Same account'), signed(b, [], 'Same account')]);
    store.ingest(originals);
    expect(store.listConflicts()).toHaveLength(0);
    const correction = await signed(a, originals, 'Sequential correction');
    const result = await request(a, '/api/sync', { protocol: 1, ops: [correction], cursor: 0, limit: 32 });
    expect(result.response.status).toBe(200);
    expect(store.all()).toHaveLength(3);
    expect(store.listConflicts()).toHaveLength(0);
    expect(store.getRecord('contract-child')?.record.name).toBe('Sequential correction');
  });

  it('rejects two different signed payloads with one operation ID without accepting either', async () => {
    const author = store.enroll('Colliding source', 'Reviewer');
    const first = await signed(author, [], 'First account');
    const collision = await signOperation({ ...first, value: 'Different payload' }, author.token);
    const result = await request(author, '/api/sync', {
      protocol: 1,
      ops: [first, collision],
      cursor: 0,
      limit: 32,
    });
    expect(result.response.status).toBe(409);
    expect(result.data.code).toBe('OPERATION_ID_COLLISION');
    expect(store.all()).toHaveLength(0);
  });

  it('rejects an encrypted backup that would absorb known alternatives without explicit review', async () => {
    const { a, originals } = await conflict();
    const vault = await localReviewer();
    await vault.saveEntryDrafts({ 'score|existing-child': '42' });
    const before = await vault.db.vault.get('state');
    const overwrite = await signed(a, originals, 'Unreviewed backup overwrite');
    const password = 'merge-contract-backup-passphrase';
    const backup = await exportBackup(
      {
        ops: [overwrite],
        entryDrafts: { 'score|imported-child': '89' },
      },
      password,
    );
    await expect(vault.import(backup, password)).rejects.toThrow(/review|conflict/i);
    expect(vault.state!.ops).toHaveLength(2);
    expect(vault.view.conflicts).toHaveLength(1);
    expect(vault.state!.entryDrafts).toEqual({ 'score|existing-child': '42' });
    expect(await vault.db.vault.get('state')).toEqual(before);
  });

  it('imports an explicitly reviewed encrypted backup while preserving both original alternatives', async () => {
    const { a, originals } = await conflict();
    const vault = await localReviewer();
    const resolution = await signed(a, originals, 'Reviewed backup account', 'name', 'resolve');
    const password = 'merge-contract-backup-passphrase';
    const backup = await exportBackup({ ops: [...originals, resolution] }, password);
    expect(await vault.import(backup, password)).toBe(3);
    expect(vault.view.conflicts).toHaveLength(0);
    expect(vault.view.entities['contract-child'].name).toBe('Reviewed backup account');
    expect(vault.state!.ops.map((op) => op.opId)).toEqual(
      expect.arrayContaining(originals.map((op) => op.opId)),
    );
    expect(vault.state!.ops).toHaveLength(3);
    await vault.unlock('123456');
    expect(vault.view.entities['contract-child'].name).toBe('Reviewed backup account');
    expect(vault.state!.ops).toHaveLength(3);
  });

  it('rejects an encrypted backup with a signed causal cycle before changing the local record', async () => {
    await conflict();
    const vault = await localReviewer();
    const author = store.enroll('Invalid backup author', 'Reviewer');
    const draft = makeOp([], author.deviceId, author.actorId, 'contract-child', 'village', 'Dhareri');
    const cyclic = await signOperation({ ...draft, deps: [draft.opId] }, author.token);
    const before = await vault.db.vault.get('state');
    const password = 'merge-contract-backup-passphrase';
    const backup = await exportBackup({ ops: [cyclic] }, password);
    await expect(vault.import(backup, password)).rejects.toMatchObject({ code: 'INVALID_CAUSAL_HISTORY' });
    expect(vault.state!.ops).toHaveLength(2);
    expect(vault.view.conflicts).toHaveLength(1);
    expect(await vault.db.vault.get('state')).toEqual(before);
  });

  it('keeps a form correction concurrent with a remote edit received after the form was opened', async () => {
    const author = store.enroll('Original author', 'Reviewer');
    const initial = await signed(author, [], 'Original account');
    store.ingest([initial]);
    const vault = new Vault('merge-contract-form-' + randomUUID());
    vaults.push(vault);
    await vault.create('123456', store.enroll('Form author', 'Reviewer'));
    await vault.sync();
    const formObserved = vault.state!.ops.slice();
    const remote = await signed(author, [initial], 'Remote correction');
    store.ingest([remote]);
    await vault.sync();
    expect(vault.view.entities['contract-child'].name).toBe('Remote correction');
    await vault.writeMany(
      [{ entityId: 'contract-child', field: 'name', value: 'Correction from the open form' }],
      formObserved,
    );
    const local = vault.state!.ops.find((op) => op.deviceId === vault.state!.identity.deviceId)!;
    expect(local.deps).toContain(initial.opId);
    expect(local.deps).not.toContain(remote.opId);
    expect(vault.view.conflicts).toHaveLength(1);
    await vault.sync();
    expect(store.listConflicts()).toHaveLength(1);
    expect(
      store
        .listConflicts()[0]
        .versions.map((op) => op.value)
        .sort(),
    ).toEqual(['Correction from the open form', 'Remote correction']);
    expect(store.all()).toHaveLength(3);
  });
});
