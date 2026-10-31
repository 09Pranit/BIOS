import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { HubStore } from '../apps/hub/src/store';
import { Vault } from '../apps/pwa/src/lib/vault';
import { makeOp, signOperation } from '../packages/sync-core/src/index';
import { exportBackup, seal } from '../packages/sync-core/src/crypto';

let store: HubStore;
let vaults: Vault[];

beforeEach(() => {
  store = new HubStore(':memory:', randomBytes(32).toString('hex'));
  vaults = [];
});

afterEach(async () => {
  for (const vault of vaults) await vault.destroy();
  store.close();
});

async function device(name: string, pin = '123456') {
  const vault = new Vault('backup-transfer-' + randomUUID());
  vaults.push(vault);
  await vault.create(pin, store.enroll(name, 'Reviewer'));
  return vault;
}

describe('portable encrypted workspace backups', () => {
  it('restores multilingual unsynchronized records into a new identity with a different device PIN', async () => {
    const source = await device('Source teacher', '111111');
    await source.write('multilingual-child', 'name', 'अमनਪ੍ਰੀਤ ਕੌਰ');
    await source.write('multilingual-child', 'guardian', 'किरण / ਕਿਰਨ');
    await source.saveEntryDrafts({ 'assessment-title': 'ਪੜ੍ਹਾਈ · गणित', 'score|multilingual-child': '73' });
    // Existing backups may have short passphrases. Restore must not impose the
    // policy used when creating a new backup, or confuse it with the device PIN.
    const backup = JSON.parse(JSON.stringify(await source.export('old-pass')));
    const target = await device('Replacement teacher', '999999');
    const targetDevice = target.state!.identity.deviceId;
    expect(await target.import(backup, 'old-pass')).toBe(2);
    expect(target.state!.identity.deviceId).toBe(targetDevice);
    expect(target.pending.map((op) => op.deviceId)).toEqual([
      source.state!.identity.deviceId,
      source.state!.identity.deviceId,
    ]);
    expect(target.view.entities['multilingual-child'].name).toBe('अमनਪ੍ਰੀਤ ਕੌਰ');
    expect(target.state!.entryDrafts).toEqual(source.state!.entryDrafts);
    target.lock();
    await target.unlock('999999');
    expect(target.view.entities['multilingual-child'].guardian).toBe('किरण / ਕਿਰਨ');
    expect(target.pending).toHaveLength(2);
  });

  it('restores a complete history whose file order puts descendants before their parents', async () => {
    const source = await device('Source worker');
    for (let n = 0; n < 12; n++) await source.write(`child-${n}`, 'name', `Child number ${n}`);
    const backup = await exportBackup({ ops: [...source.state!.ops].reverse() }, 'transfer-passphrase');
    const target = await device('Target worker');
    expect(await target.import(backup, 'transfer-passphrase')).toBe(12);
    expect(target.state!.ops).toEqual(source.state!.ops);
    expect(Object.keys(target.view.entities)).toHaveLength(12);
  });

  it('restores an unfinished assessment title and attempt before any scores have been entered', async () => {
    const source = await device('Assessment source');
    await source.saveEntryDrafts({ 'assessment-title': 'Fractions', 'assessment-attempt': '3' });
    const backup = await source.export('transfer-passphrase');
    const target = await device('Assessment target');
    expect(await target.import(backup, 'transfer-passphrase')).toBe(0);
    expect(target.state!.entryDrafts).toEqual({ 'assessment-title': 'Fractions', 'assessment-attempt': '3' });
    target.lock();
    await target.unlock('123456');
    expect(target.state!.entryDrafts?.['assessment-title']).toBe('Fractions');
  });

  it('keeps different local unfinished assessment details instead of replacing them during restore', async () => {
    const source = await device('Different assessment source');
    await source.saveEntryDrafts({ 'assessment-title': 'Fractions', 'assessment-attempt': '3' });
    await source.write('restored-child', 'name', 'Imported child');
    const backup = await source.export('transfer-passphrase');
    const target = await device('Different assessment target');
    await target.saveEntryDrafts({ 'assessment-title': 'Reading', 'assessment-attempt': '1' });
    const before = await target.db.vault.get('state');
    await expect(target.import(backup, 'transfer-passphrase')).rejects.toThrow(/unfinished|draft/i);
    expect(await target.db.vault.get('state')).toEqual(before);
    expect(target.state!.entryDrafts).toEqual({ 'assessment-title': 'Reading', 'assessment-attempt': '1' });
    expect(target.state!.ops).toHaveLength(0);
  });

  it('does not export a portable backup while an interrupted pull is missing causal parents', async () => {
    const source = await device('Interrupted pull source');
    const identity = source.state!.identity;
    const parent = await signOperation(
      makeOp([], identity.deviceId, identity.actorId, 'child', 'name', 'Original name'),
      identity.token,
    );
    const child = await signOperation(
      makeOp([parent], identity.deviceId, identity.actorId, 'child', 'guardian', 'Caregiver'),
      identity.token,
    );
    source.state!.ops = [child];
    const saved = (await source.db.vault.get('state'))!;
    await source.db.vault.put({ ...saved, sealed: await seal(source.key!, source.state) });
    const before = await source.db.vault.get('state');
    await expect(source.export('transfer-passphrase')).rejects.toThrow(/sync|incomplete|missing/i);
    expect(await source.db.vault.get('state')).toEqual(before);
    expect(source.state!.ops).toEqual([child]);
  });

  it('rejects an older incomplete backup without altering local records or drafts', async () => {
    const target = await device('Existing target');
    await target.write('existing-child', 'name', 'Keep this child');
    await target.saveEntryDrafts({ 'score|existing-child': '88' });
    const identity = store.enroll('Older source', 'Reviewer');
    const parent = await signOperation(
      makeOp([], identity.deviceId, identity.actorId, 'restored-child', 'name', 'Older child'),
      identity.token,
    );
    const child = await signOperation(
      makeOp([parent], identity.deviceId, identity.actorId, 'restored-child', 'guardian', 'Older caregiver'),
      identity.token,
    );
    const backup = await exportBackup(
      { ops: [child], entryDrafts: { 'score|restored-child': '41' } },
      'transfer-passphrase',
    );
    const before = await target.db.vault.get('state');
    await expect(target.import(backup, 'transfer-passphrase')).rejects.toThrow(/sync|incomplete|missing/i);
    expect(await target.db.vault.get('state')).toEqual(before);
    expect(target.state!.ops).toHaveLength(1);
    expect(target.state!.entryDrafts).toEqual({ 'score|existing-child': '88' });
  });

  it('rejects another school atomically while keeping the replacement device identity', async () => {
    const source = await device('Other school source');
    await source.write('other-child', 'name', 'Another school child');
    const backup = await source.export('transfer-passphrase');
    const target = await device('Current school target');
    target.state!.identity.schoolId = 'different-school';
    const saved = (await target.db.vault.get('state'))!;
    await target.db.vault.put({ ...saved, sealed: await seal(target.key!, target.state) });
    const before = await target.db.vault.get('state');
    await expect(target.import(backup, 'transfer-passphrase')).rejects.toThrow(/another school/i);
    expect(await target.db.vault.get('state')).toEqual(before);
    expect(target.state!.identity.schoolId).toBe('different-school');
    expect(target.state!.ops).toHaveLength(0);
  });
});
