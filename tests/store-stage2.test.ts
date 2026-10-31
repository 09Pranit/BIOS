import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, createCipheriv } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { HubStore, HttpError, hash, type Change } from '../apps/hub/src/store';
import { HUB_SCHEMA_VERSION } from '../apps/hub/src/migrations';
import { makeOp, signOperation, canonical, SCHOOL, type Op } from '../packages/sync-core/src/index';

let store: HubStore;
const opened: HubStore[] = [],
  folders: string[] = [];
const key = () => randomBytes(32).toString('hex');
const newStore = (path = ':memory:', secret = key()) => {
  const value = new HubStore(path, secret);
  opened.push(value);
  return value;
};
const folder = () => {
  const path = mkdtempSync(join(tmpdir(), 'setusync-store-'));
  folders.push(path);
  return path;
};
const device = (actor = 'Worker', role = 'Reviewer') => {
  const identity = store.enroll(actor, role);
  return { identity, row: store.authorize(identity.token)! };
};
const change = (
  entityId: string,
  value: string,
  field: Change['field'] = 'name',
  kind?: Change['kind'],
): Change => ({ entityId, entityType: 'child', field, value, kind });
beforeEach(() => {
  store = newStore();
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const value of opened.splice(0)) {
    try {
      value.close();
    } catch {}
  }
  for (const path of folders.splice(0)) {
    if (!resolve(path).startsWith(resolve(tmpdir()) + sep)) throw new Error('Unsafe temporary cleanup path');
    rmSync(path, { recursive: true, force: true });
  }
});

describe('stage 2 durable records and manual commands', () => {
  it('uses an independent signed hub writer so offline counters cannot collide with manual entry', async () => {
    const { identity, row } = device();
    const offline = await signOperation(
      makeOp([], identity.deviceId, identity.actorId, 'offline-child', 'name', 'Offline child'),
      identity.token,
    );
    const result = store.command(row, 'manual-1', hash('manual-1'), [change('manual-child', 'Manual child')]);
    expect(result.replayed).toBe(false);
    expect(result.operationIds).toHaveLength(1);
    expect(result.operationIds[0].startsWith(identity.deviceId + ':')).toBe(false);
    store.ingest([offline]);
    expect(store.getRecord('offline-child')?.record.name).toBe('Offline child');
    expect(store.getRecord('manual-child')?.record.name).toBe('Manual child');
    expect(store.all()).toHaveLength(2);
    expect(store.summary().devices).toHaveLength(1);
    const writer = store.db.prepare('SELECT * FROM devices WHERE internal=1').get() as any;
    expect(writer.parent_device).toBe(identity.deviceId);
    expect(writer.signing_secret).not.toContain(identity.token);
  });
  it('persists command receipts and encrypted projections across restart', () => {
    const path = join(folder(), 'hub.sqlite'),
      secret = key();
    store = newStore(path, secret);
    const { row } = device();
    const first = store.command(row, 'durable-command', hash('same'), [change('child', 'Restart survives')]);
    const before = store.entityVersion('child');
    store.command(row, 'second-command', hash('second'), [change('child', 'Later correction')], {
      entityId: 'child',
      version: before,
    });
    store.close();
    store = newStore(path, secret);
    const replay = store.command(
      row,
      'durable-command',
      hash('same'),
      [change('child', 'Restart survives')],
      { entityId: 'child', version: before },
    );
    expect(replay).toEqual({ ...first, replayed: true });
    expect(store.replayCommand(row.id, 'durable-command', hash('same'))).toEqual({
      ...first,
      replayed: true,
    });
    expect(store.replayCommand(row.id, 'missing-request', hash('same'))).toBeNull();
    expect(() => store.replayCommand(row.id, 'durable-command', hash('different'))).toThrow(
      'different input',
    );
    expect(store.getRecord('child')?.record.name).toBe('Later correction');
    expect(store.all()).toHaveLength(2);
    expect(() =>
      store.command(row, 'durable-command', hash('different'), [change('child', 'Wrong')]),
    ).toThrow(HttpError);
    try {
      store.command(row, 'durable-command', hash('different'), [change('child', 'Wrong')]);
    } catch (e) {
      expect((e as HttpError).status).toBe(409);
      expect((e as HttpError).code).toBe('IDEMPOTENCY_CONFLICT');
    }
    const stored = store.db
      .prepare('SELECT body FROM materialized_records WHERE entity_id=?')
      .get('child') as any;
    expect(stored.body).not.toContain('Later correction');
    expect(store.decrypt(stored.body).name).toBe('Later correction');
  });
  it('checks every expected version before applying a transactional batch', () => {
    const { row } = device();
    store.command(row, 'create', hash('create'), [change('one', 'One'), change('two', 'Two')]);
    const baseline = [
      { entityId: 'one', version: store.entityVersion('one') },
      { entityId: 'two', version: store.entityVersion('two') },
    ];
    store.command(row, 'update-two', hash('two'), [change('two', 'Changed two')], baseline[1]);
    const count = store.all().length;
    expect(() =>
      store.command(
        row,
        'stale-batch',
        hash('batch'),
        [change('one', 'Wrong one'), change('two', 'Wrong two')],
        baseline,
      ),
    ).toThrow('record changed');
    expect(store.all()).toHaveLength(count);
    expect(store.getRecord('one')?.record.name).toBe('One');
    expect(store.getRecord('two')?.record.name).toBe('Changed two');
    expect(
      store.db.prepare('SELECT 1 FROM command_receipts WHERE request_id=?').get('stale-batch'),
    ).toBeUndefined();
  });
  it('blocks normal writes to conflicts and keeps original alternatives after a causal resolution', async () => {
    const a = device('Worker A'),
      b = device('Worker B');
    const first = await signOperation(
      makeOp([], a.identity.deviceId, a.identity.actorId, 'child', 'name', 'First account'),
      a.identity.token,
    );
    const second = await signOperation(
      makeOp([], b.identity.deviceId, b.identity.actorId, 'child', 'name', 'Second account'),
      b.identity.token,
    );
    store.ingest([first, second]);
    expect(store.listConflicts()).toHaveLength(1);
    const version = store.entityVersion('child');
    expect(() =>
      store.command(a.row, 'unsafe', hash('unsafe'), [change('child', 'Overwrite')], {
        entityId: 'child',
        version,
      }),
    ).toThrow('Conflict inbox');
    store.command(a.row, 'review', hash('review'), [change('child', 'Reviewed account', 'name', 'resolve')], {
      entityId: 'child',
      version,
    });
    expect(store.listConflicts()).toHaveLength(0);
    expect(store.all()).toHaveLength(3);
    expect(store.getRecord('child')?.record.name).toBe('Reviewed account');
  });
  it('rolls back a complete manual batch and its writer when a role check fails', () => {
    const { row } = device('Teacher', 'Teacher');
    expect(() =>
      store.command(row, 'bad-role', hash('bad-role'), [
        change('child', 'Valid name'),
        change('child', 'Restricted', 'prescription'),
      ]),
    ).toThrow('health worker');
    expect(store.all()).toHaveLength(0);
    expect(store.getRecord('child')).toBeNull();
    expect((store.db.prepare('SELECT COUNT(*) AS n FROM devices WHERE internal=1').get() as any).n).toBe(0);
    expect(
      store.db.prepare('SELECT 1 FROM command_receipts WHERE request_id=?').get('bad-role'),
    ).toBeUndefined();
  });
  it('queries/searches/paginates encrypted materializations and retains tombstones', () => {
    const { row } = device();
    store.command(row, 'new', hash('new'), [
      change('a', 'Aarohi Kaur'),
      change('a', 'Dhareri', 'village'),
      change('b', 'Kabir Singh'),
      change('b', 'Baran', 'village'),
      change('c', 'Meher Kaur'),
    ]);
    expect(store.listRecords({ school: SCHOOL, type: 'child', search: 'aarohi DHARERI' }).total).toBe(1);
    expect(store.listRecords({ school: SCHOOL, offset: 1, limit: 1 }).records[0].record.id).toBe('b');
    const versionA = store.entityVersion('a');
    store.command(row, 'other', hash('other'), [change('b', 'Other correction')]);
    expect(store.entityVersion('a')).toBe(versionA);
    store.command(row, 'delete', hash('delete'), [
      { entityId: 'b', entityType: 'child', field: 'deleted', value: true, kind: 'delete' },
    ]);
    expect(store.listRecords({ school: SCHOOL }).total).toBe(2);
    expect(store.listRecords({ school: SCHOOL, includeDeleted: true }).total).toBe(3);
    expect(store.getRecord('b')?.record.deleted).toBe(true);
    expect(store.listRecords({ school: 'other-school' }).total).toBe(0);
    expect(store.getRecord('a', 'other-school')).toBeNull();
  });
  it('allows internally requested report batches beyond the public pagination limit', () => {
    const { row } = device();
    store.command(
      row,
      'many-records',
      hash('many-records'),
      Array.from({ length: 205 }, (_, i) =>
        change('record-' + String(i).padStart(3, '0'), 'Synthetic child ' + i),
      ),
    );
    expect(store.listRecords({ school: SCHOOL, type: 'child', limit: 200000 }).records).toHaveLength(205);
    expect(store.listRecords({ school: SCHOOL, type: 'child', limit: 50 }).records).toHaveLength(50);
  });
  it('never accepts different content under a quarantined operation ID', async () => {
    const { identity } = device();
    const future = await signOperation(
      makeOp(
        [],
        identity.deviceId,
        identity.actorId,
        'child',
        'name',
        'Original future payload',
        'set',
        'child',
        Date.now() + 600000,
      ),
      identity.token,
    );
    expect(store.ingest([future]).quarantined).toHaveLength(1);
    const replacement = await signOperation(
      { ...future, value: 'Replacement', hlc: { ...future.hlc, physical: Date.now() } },
      identity.token,
    );
    expect(() => store.ingest([replacement])).toThrow('identity collision');
    expect(store.all()).toHaveLength(0);
    const queued = store.db.prepare('SELECT body,checksum FROM quarantine').get() as any;
    expect(store.decrypt(queued.body).value).toBe('Original future payload');
    expect(queued.checksum).toBe(hash(canonical(future)));
    expect(store.ingest([future]).quarantined).toHaveLength(1);
    vi.spyOn(Date, 'now').mockReturnValue(future.hlc.physical);
    expect(store.ingest([future]).accepted).toEqual([future.opId]);
    expect(store.db.prepare('SELECT 1 FROM quarantine').get()).toBeUndefined();
    expect(store.getRecord('child')?.record.name).toBe('Original future payload');
  });
  it('rejects signed entity type changes and rolls back the whole batch without hiding original records', async () => {
    const { identity } = device();
    const original = await signOperation(
      makeOp([], identity.deviceId, identity.actorId, 'stable-child', 'name', 'Original child'),
      identity.token,
    );
    store.ingest([original]);
    const independent = await signOperation(
      makeOp([original], identity.deviceId, identity.actorId, 'new-child', 'name', 'Uncommitted child'),
      identity.token,
    );
    const mismatch = await signOperation(
      makeOp(
        [original, independent],
        identity.deviceId,
        identity.actorId,
        'stable-child',
        'score',
        85,
        'set',
        'assessment',
      ),
      identity.token,
    );
    try {
      store.ingest([independent, mismatch]);
      throw new Error('Expected entity type rejection');
    } catch (error) {
      expect((error as HttpError).status).toBe(409);
      expect((error as HttpError).code).toBe('ENTITY_TYPE_MISMATCH');
    }
    expect(store.all()).toHaveLength(1);
    expect(store.getRecord('stable-child')?.record).toMatchObject({ type: 'child', name: 'Original child' });
    expect(store.getRecord('new-child')).toBeNull();
    const first = await signOperation(
      makeOp([original], identity.deviceId, identity.actorId, 'batch-child', 'name', 'First type'),
      identity.token,
    );
    const conflicting = await signOperation(
      makeOp(
        [original, first],
        identity.deviceId,
        identity.actorId,
        'batch-child',
        'score',
        50,
        'set',
        'assessment',
      ),
      identity.token,
    );
    expect(() => store.ingest([first, conflicting])).toThrow('different entity type');
    expect(store.all()).toHaveLength(1);
    expect(store.getRecord('batch-child')).toBeNull();
  });
  it('does not let quarantined-only operations reserve an entity type', async () => {
    const a = device('Future source'),
      b = device('Current source');
    const future = await signOperation(
      makeOp(
        [],
        a.identity.deviceId,
        a.identity.actorId,
        'shared-id',
        'score',
        70,
        'set',
        'assessment',
        Date.now() + 600000,
      ),
      a.identity.token,
    );
    const accepted = await signOperation(
      makeOp([], b.identity.deviceId, b.identity.actorId, 'shared-id', 'name', 'Valid current child'),
      b.identity.token,
    );
    const result = store.ingest([future, accepted]);
    expect(result.quarantined.map((item) => item.opId)).toEqual([future.opId]);
    expect(result.accepted).toEqual([accepted.opId]);
    expect(store.getRecord('shared-id')?.record).toMatchObject({
      type: 'child',
      name: 'Valid current child',
    });
    expect((store.db.prepare('SELECT COUNT(*) AS n FROM quarantine').get() as any).n).toBe(1);
  });
});

describe('stage 2 provisioning and recovery', () => {
  it('prevents reviewer escalation and last-administrator lockout', () => {
    const admin = store.bootstrap('Only administrator'),
      adminRow = store.authorize(admin.token)!,
      reviewer = device('Reviewer account');
    expect(() => store.revokeDevice(reviewer.row, admin.deviceId)).toThrow('Only a hub administrator');
    expect(() => store.revokeDevice(adminRow, admin.deviceId)).toThrow('last active hub administrator');
    expect(store.authorize(admin.token)?.revoked).toBeNull();
    const second = store.enroll('Second administrator', 'Hub Admin');
    const result = store.revokeDevice(adminRow, second.deviceId);
    expect(result.ok).toBe(true);
    expect(store.authorize(second.token)?.revoked).toBeTruthy();
    expect(() => store.revokeDevice(adminRow, admin.deviceId)).toThrow('last active hub administrator');
  });
  it('revokes the parent and internal writers atomically with an encrypted audit and safe replay', () => {
    const admin = store.bootstrap('Administrator'),
      adminRow = store.authorize(admin.token)!,
      target = device('Target worker');
    store.command(target.row, 'target-write', hash('target-write'), [change('child', 'Kept record')]);
    store.db.exec(
      "CREATE TRIGGER fail_revoke_audit BEFORE INSERT ON audit WHEN NEW.event='device-revoked' BEGIN SELECT RAISE(ABORT,'Injected audit failure'); END;",
    );
    expect(() => store.revokeDevice(adminRow, target.identity.deviceId)).toThrow('Injected audit failure');
    expect(store.authorize(target.identity.token)?.revoked).toBeNull();
    expect(
      (
        store.db
          .prepare('SELECT revoked FROM devices WHERE parent_device=?')
          .get(target.identity.deviceId) as any
      ).revoked,
    ).toBeNull();
    store.db.exec('DROP TRIGGER fail_revoke_audit');
    const first = store.revokeDevice(adminRow, target.identity.deviceId),
      second = store.revokeDevice(adminRow, target.identity.deviceId);
    expect(first.alreadyRevoked).toBe(false);
    expect(second.alreadyRevoked).toBe(true);
    expect(second.revoked).toBe(first.revoked);
    expect(
      (
        store.db
          .prepare('SELECT revoked FROM devices WHERE parent_device=?')
          .get(target.identity.deviceId) as any
      ).revoked,
    ).toBe(first.revoked);
    expect(store.listAudit().filter((event) => event.event === 'device-revoked')).toHaveLength(1);
    expect(store.getRecord('child')?.record.name).toBe('Kept record');
    const audit = store.db.prepare("SELECT body FROM audit WHERE event='device-revoked'").get() as any;
    expect(audit.body).not.toContain(target.identity.deviceId);
  });
  it('preserves role and school boundaries when revoking devices', () => {
    const reviewer = device('Reviewer account'),
      target = device('Ordinary worker', 'Teacher');
    expect(store.revokeDevice(reviewer.row, target.identity.deviceId).ok).toBe(true);
    const teacher = device('Teacher account', 'Teacher');
    expect(() => store.revokeDevice(teacher.row, reviewer.identity.deviceId)).toThrow(
      'Reviewer or hub administrator',
    );
    const foreign = store.enroll('Foreign worker', 'Teacher');
    store.db.prepare('UPDATE devices SET school=? WHERE id=?').run('other-school', foreign.deviceId);
    try {
      store.revokeDevice(reviewer.row, foreign.deviceId);
      throw new Error('Expected not found');
    } catch (error) {
      expect((error as HttpError).status).toBe(404);
    }
    expect(() => store.revokeDevice(reviewer.row, 'unknown-device')).toThrow('not found');
    const oldAdmin = store.enroll('Expired administrator', 'Hub Admin');
    store.db.prepare('UPDATE devices SET expires=0 WHERE id=?').run(oldAdmin.deviceId);
    const activeAdmin = store.enroll('Only live administrator', 'Hub Admin');
    expect(() => store.revokeDevice(store.authorize(activeAdmin.token)!, activeAdmin.deviceId)).toThrow(
      'last active hub administrator',
    );
  });
  it('bootstraps one administrator and consumes role-bound hashed invitations once', () => {
    const admin = store.bootstrap('First Admin');
    expect(admin.role).toBe('Hub Admin');
    expect(() => store.bootstrap('Second Admin')).toThrow('already been created');
    const invite = store.createInvitation('Teacher', SCHOOL, 60000, admin.deviceId),
      identity = store.consumeInvitation(invite.code, 'Invited teacher');
    expect(identity.role).toBe('Teacher');
    expect(identity.schoolId).toBe(SCHOOL);
    expect(() => store.consumeInvitation(invite.code, 'Another teacher')).toThrow('already used');
    const row = store.db.prepare('SELECT code_hash FROM invitations').get() as any;
    expect(row.code_hash).toBe(hash(invite.code));
    expect(row.code_hash).not.toBe(invite.code);
    const expired = store.createInvitation('Health Worker', SCHOOL, 1000);
    store.db.prepare('UPDATE invitations SET expires=0 WHERE code_hash=?').run(hash(expired.code));
    expect(() => store.consumeInvitation(expired.code, 'Too late')).toThrow('expired');
    const events = store.listAudit();
    expect(events.some((event) => event.event === 'invitation-consumed')).toBe(true);
    expect(events.some((event) => event.event === 'administrator-bootstrapped')).toBe(true);
  });
  it('recovers atomically, consumes the previous code and revokes internal writers too', () => {
    const { identity, row } = device('Original worker');
    store.command(row, 'before-loss', hash('before-loss'), [change('child', 'Acknowledged data')]);
    const count = (store.db.prepare('SELECT COUNT(*) AS n FROM devices').get() as any).n;
    store.db.exec(
      "CREATE TRIGGER fail_revoke BEFORE UPDATE OF revoked ON devices BEGIN SELECT RAISE(ABORT,'Injected revoke failure'); END;",
    );
    expect(() => store.recover(identity.recovery, 'Replacement')).toThrow('Injected revoke failure');
    expect((store.db.prepare('SELECT COUNT(*) AS n FROM devices').get() as any).n).toBe(count);
    expect(
      (store.db.prepare('SELECT revoked FROM devices WHERE id=?').get(identity.deviceId) as any).revoked,
    ).toBeNull();
    store.db.exec('DROP TRIGGER fail_revoke');
    const recovered = store.recover(identity.recovery, 'Replacement');
    expect(recovered.role).toBe(identity.role);
    expect(() => store.recover(identity.recovery, 'Second replacement')).toThrow('invalid or revoked');
    expect(
      (store.db.prepare('SELECT revoked FROM devices WHERE parent_device=?').get(identity.deviceId) as any)
        .revoked,
    ).toBeTruthy();
    expect(store.getRecord('child')?.record.name).toBe('Acknowledged data');
    expect(store.authorize(recovered.token)?.revoked).toBeNull();
  });
  it('migrates an original database in place and reconstructs encrypted projections', () => {
    const path = join(folder(), 'legacy.sqlite'),
      secret = key(),
      db = new DatabaseSync(path);
    db.exec(
      `CREATE TABLE operations(seq INTEGER PRIMARY KEY AUTOINCREMENT,op_id TEXT UNIQUE NOT NULL,school TEXT NOT NULL,device TEXT NOT NULL,body TEXT NOT NULL,checksum TEXT NOT NULL); CREATE TABLE quarantine(op_id TEXT PRIMARY KEY,school TEXT NOT NULL,body TEXT NOT NULL,reason TEXT NOT NULL); CREATE TABLE devices(id TEXT PRIMARY KEY,school TEXT NOT NULL,actor TEXT NOT NULL,role TEXT NOT NULL,token_hash TEXT NOT NULL,recovery_hash TEXT NOT NULL,expires INTEGER NOT NULL,revoked INTEGER,last_seen INTEGER,signing_secret TEXT NOT NULL); CREATE TABLE audit(id INTEGER PRIMARY KEY,device TEXT,event TEXT,time INTEGER);`,
    );
    const operation = makeOp([], 'seed', 'Synthetic seed', 'legacy-child', 'name', 'Preserved legacy child'),
      iv = randomBytes(12),
      cipher = createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
    cipher.setAAD(Buffer.from('KUKA:hub:v1'));
    const data = Buffer.concat([cipher.update(JSON.stringify(operation)), cipher.final()]);
    const encrypted = JSON.stringify({
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      body: data.toString('base64'),
    });
    db.prepare('INSERT INTO operations(op_id,school,device,body,checksum) VALUES(?,?,?,?,?)').run(
      operation.opId,
      SCHOOL,
      'seed',
      encrypted,
      hash(canonical(operation)),
    );
    db.prepare('INSERT INTO audit(device,event,time) VALUES(?,?,?)').run(
      'legacy-device',
      'legacy-event',
      Date.now(),
    );
    db.close();
    store = newStore(path, secret);
    expect((store.db.prepare('PRAGMA user_version').get() as any).user_version).toBe(HUB_SCHEMA_VERSION);
    expect(store.getRecord('legacy-child')?.record.name).toBe('Preserved legacy child');
    expect((store.db.prepare('SELECT body FROM operations').get() as any).body).toBe(encrypted);
    expect(store.listAudit()[0].event).toBe('legacy-event');
    expect(store.all()).toHaveLength(1);
  });
});
