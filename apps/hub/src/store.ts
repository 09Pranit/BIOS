import { DatabaseSync } from 'node:sqlite';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  OpSchema,
  SCHOOL,
  canonical,
  materialize,
  signingBody,
  makeOp,
  ancestry,
  causalOrder,
  type Op,
  type Conflict,
} from '../../../packages/sync-core/src/index';
import type { Field } from '../../../packages/sync-core/src/policy';
import { migrateHub, HUB_SCHEMA_VERSION } from './migrations';

export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
export type Role = 'Teacher' | 'Health Worker' | 'Reviewer' | 'Hub Admin';
export type Device = {
  id: string;
  school: string;
  actor: string;
  role: Role;
  token_hash: string;
  recovery_hash: string;
  expires: number;
  revoked: number | null;
  last_seen: number;
  signing_secret: string;
  internal: number;
  parent_device: string | null;
};
export type Change = {
  entityId: string;
  entityType: Op['entityType'];
  field: Field;
  value: Op['value'];
  kind?: Op['kind'];
};
export type ExpectedVersion = { entityId: string; version: string };
export type RecordEnvelope = { record: Record<string, any>; version: string; updatedAt: number };
const roles: Role[] = ['Teacher', 'Health Worker', 'Reviewer', 'Hub Admin'];
const emptyVersion = hash(canonical([]));

export class HubStore {
  db: DatabaseSync;
  key: Buffer;
  private transactionDepth = 0;
  constructor(path: string, keyHex: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    if (!/^[a-f0-9]{64}$/i.test(keyHex)) throw new Error('Hub encryption key must be 32 bytes of hex');
    this.key = Buffer.from(keyHex, 'hex');
    this.db = new DatabaseSync(path);
    this.db
      .exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS operations(seq INTEGER PRIMARY KEY AUTOINCREMENT,op_id TEXT UNIQUE NOT NULL,school TEXT NOT NULL,device TEXT NOT NULL,body TEXT NOT NULL,checksum TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS quarantine(op_id TEXT PRIMARY KEY,school TEXT NOT NULL,body TEXT NOT NULL,reason TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY,school TEXT NOT NULL,actor TEXT NOT NULL,role TEXT NOT NULL,token_hash TEXT NOT NULL,recovery_hash TEXT NOT NULL,expires INTEGER NOT NULL,revoked INTEGER,last_seen INTEGER,signing_secret TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,device TEXT,event TEXT,time INTEGER);
    `);
    migrateHub(this.db, SCHOOL);
    this.transaction(() => {
      for (const row of this.db
        .prepare('SELECT op_id,body FROM quarantine WHERE checksum IS NULL')
        .all() as any[])
        this.db
          .prepare('UPDATE quarantine SET checksum=? WHERE op_id=?')
          .run(hash(canonical(this.decrypt(row.body))), row.op_id);
      for (const row of this.db.prepare('SELECT DISTINCT school FROM operations').all() as any[])
        this.refreshProjection(row.school);
    });
  }
  private transaction<T>(action: () => T): T {
    const outer = this.transactionDepth === 0;
    if (outer) this.db.exec('BEGIN IMMEDIATE');
    this.transactionDepth++;
    try {
      const value = action();
      if (outer) this.db.exec('COMMIT');
      return value;
    } catch (error) {
      if (outer) this.db.exec('ROLLBACK');
      throw error;
    } finally {
      this.transactionDepth--;
    }
  }
  encrypt(value: unknown) {
    const iv = randomBytes(12),
      cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from('KUKA:hub:v1'));
    const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
    return JSON.stringify({
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      body: body.toString('base64'),
    });
  }
  decrypt(body: string) {
    const value = JSON.parse(body),
      cipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(value.iv, 'base64'));
    cipher.setAAD(Buffer.from('KUKA:hub:v1'));
    cipher.setAuthTag(Buffer.from(value.tag, 'base64'));
    return JSON.parse(
      Buffer.concat([cipher.update(Buffer.from(value.body, 'base64')), cipher.final()]).toString(),
    );
  }
  private enrollInSchool(actor: string, role: string, school: string) {
    actor = actor.trim();
    if (actor.length < 1 || actor.length > 100 || !roles.includes(role as Role))
      throw new HttpError(400, 'INVALID_ENROLLMENT', 'Enter a worker name and a supported role.');
    const id = 'device-' + randomBytes(8).toString('hex'),
      token = randomBytes(32).toString('hex'),
      recovery = randomBytes(18).toString('base64url'),
      expires = Date.now() + 7 * 86400000;
    this.db
      .prepare(
        'INSERT INTO devices(id,school,actor,role,token_hash,recovery_hash,expires,last_seen,signing_secret) VALUES(?,?,?,?,?,?,?,?,?)',
      )
      .run(id, school, actor, role, hash(token), hash(recovery), expires, Date.now(), this.encrypt(token));
    return { deviceId: id, actorId: actor, role: role as Role, token, recovery, expires, schoolId: school };
  }
  enroll(actor: string, role: string) {
    return this.transaction(() => this.enrollInSchool(actor, role, SCHOOL));
  }
  authorize(token: string) {
    return this.db.prepare('SELECT * FROM devices WHERE token_hash=? AND internal=0').get(hash(token)) as
      Device | undefined;
  }
  bootstrap(actor: string) {
    return this.transaction(() => {
      if (this.db.prepare("SELECT 1 FROM devices WHERE role='Hub Admin' AND internal=0 LIMIT 1").get())
        throw new HttpError(
          409,
          'ALREADY_BOOTSTRAPPED',
          'A hub administrator has already been created. Use an invitation or recovery code.',
        );
      const identity = this.enrollInSchool(actor, 'Hub Admin', SCHOOL);
      this.audit(identity.deviceId, 'administrator-bootstrapped', {}, SCHOOL);
      return identity;
    });
  }
  createInvitation(role: string, school: string, ttl = 24 * 3600000, createdBy?: string) {
    if (
      !roles.includes(role as Role) ||
      !school ||
      !Number.isFinite(ttl) ||
      ttl < 1000 ||
      ttl > 30 * 86400000
    )
      throw new HttpError(
        400,
        'INVALID_INVITATION',
        'Select a supported role and an expiry between one second and 30 days.',
      );
    return this.transaction(() => {
      const code = 'invite-' + randomBytes(24).toString('base64url'),
        expires = Date.now() + Math.floor(ttl);
      this.db
        .prepare(
          'INSERT INTO invitations(code_hash,school,role,expires,created_by,created_at) VALUES(?,?,?,?,?,?)',
        )
        .run(hash(code), school, role, expires, createdBy ?? null, Date.now());
      this.audit(createdBy ?? 'system', 'invitation-created', { role, expires }, school);
      return { code, role: role as Role, expires, schoolId: school };
    });
  }
  consumeInvitation(code: string, actor: string) {
    return this.transaction(() => {
      const invitation = this.db
        .prepare('SELECT * FROM invitations WHERE code_hash=?')
        .get(hash(code)) as any;
      if (!invitation || invitation.consumed_at || invitation.expires <= Date.now())
        throw new HttpError(403, 'INVALID_INVITATION', 'Invitation is invalid, expired, or already used.');
      const identity = this.enrollInSchool(actor, invitation.role, invitation.school);
      this.db
        .prepare(
          'UPDATE invitations SET consumed_at=?,consumed_device=? WHERE code_hash=? AND consumed_at IS NULL',
        )
        .run(Date.now(), identity.deviceId, hash(code));
      this.audit(identity.deviceId, 'invitation-consumed', { role: invitation.role }, invitation.school);
      return identity;
    });
  }
  recover(recovery: string, actor: string) {
    return this.transaction(() => {
      const old = this.db
        .prepare('SELECT * FROM devices WHERE recovery_hash=? AND revoked IS NULL AND internal=0')
        .get(hash(recovery)) as Device | undefined;
      if (!old) throw new HttpError(403, 'INVALID_RECOVERY', 'Recovery code is invalid or revoked.');
      const identity = this.enrollInSchool(actor, old.role, old.school),
        revoked = Date.now();
      this.db
        .prepare('UPDATE devices SET revoked=? WHERE id=? OR parent_device=?')
        .run(revoked, old.id, old.id);
      this.audit(identity.deviceId, 'device-recovered', { previousDevice: old.id }, old.school);
      return identity;
    });
  }
  revokeDevice(source: Device, targetId: string) {
    return this.transaction(() => {
      const actor = this.db.prepare('SELECT * FROM devices WHERE id=? AND internal=0').get(source.id) as
        Device | undefined;
      if (!actor || actor.school !== source.school)
        throw new HttpError(403, 'DEVICE_FORBIDDEN', 'Unknown or mismatched device.');
      if (actor.revoked) throw new HttpError(403, 'DEVICE_REVOKED', 'This device has been revoked.');
      const now = Date.now();
      if (actor.expires < now) throw new HttpError(401, 'SESSION_EXPIRED', 'Device session expired.');
      if (!['Reviewer', 'Hub Admin'].includes(actor.role))
        throw new HttpError(403, 'ROLE_REQUIRED', 'Reviewer or hub administrator required.');
      const target = this.db
        .prepare('SELECT * FROM devices WHERE id=? AND school=? AND internal=0')
        .get(targetId, actor.school) as Device | undefined;
      if (!target) throw new HttpError(404, 'DEVICE_NOT_FOUND', 'Device not found in this workspace.');
      if (actor.role === 'Reviewer' && target.role === 'Hub Admin')
        throw new HttpError(
          403,
          'ADMIN_REQUIRED',
          'Only a hub administrator may revoke an administrator device.',
        );
      if (target.role === 'Hub Admin' && !target.revoked && target.expires >= now) {
        const active = Number(
          (
            this.db
              .prepare(
                "SELECT COUNT(*) AS n FROM devices WHERE school=? AND role='Hub Admin' AND internal=0 AND revoked IS NULL AND expires>=?",
              )
              .get(actor.school, now) as any
          ).n,
        );
        if (active <= 1)
          throw new HttpError(
            409,
            'LAST_ADMINISTRATOR',
            'The last active hub administrator cannot be revoked. Provision another administrator first.',
          );
      }
      const result = this.db
        .prepare(
          'UPDATE devices SET revoked=? WHERE school=? AND (id=? OR parent_device=?) AND revoked IS NULL',
        )
        .run(now, actor.school, target.id, target.id);
      if (result.changes)
        this.audit(
          actor.id,
          'device-revoked',
          { deviceId: target.id, role: target.role, revokedDevices: Number(result.changes) },
          actor.school,
        );
      return {
        ok: true,
        deviceId: target.id,
        revoked: target.revoked ?? now,
        alreadyRevoked: Boolean(target.revoked),
      };
    });
  }
  ingest(input: Op[], school = SCHOOL, trustedSeed = false) {
    return this.transaction(() => {
      const accepted: string[] = [],
        quarantined: { opId: string; reason: string }[] = [];
      const committed = new Map(this.all(school).map((op) => [op.opId, op]));
      let ordered: Op[];
      try {
        // A complete batch may arrive in any order. Across batches, require
        // parents to be durable before acknowledging their descendants.
        ordered = causalOrder(
          input.map((op) => OpSchema.parse(op)),
          committed.keys(),
        );
      } catch (error) {
        if (error instanceof Error && /operation identity collision/i.test(error.message))
          throw new HttpError(
            409,
            'OPERATION_ID_COLLISION',
            'Operation identity collision: this ID already contains different content.',
          );
        if ((error as { code?: string }).code === 'MISSING_DEPENDENCY')
          throw new HttpError(
            409,
            'MISSING_DEPENDENCY',
            'An earlier operation has not reached the hub. Send its causal parents before retrying; no changes were committed.',
          );
        if ((error as { code?: string }).code === 'INVALID_CAUSAL_HISTORY')
          throw new HttpError(
            409,
            'INVALID_CAUSAL_HISTORY',
            'An operation cannot depend on itself or a causal cycle. No changes were committed.',
          );
        throw error;
      }
      const acceptedTypes = new Map<string, Op['entityType']>();
      const storedType = this.db.prepare(
        'SELECT entity_type FROM materialized_records WHERE school=? AND entity_id=?',
      );
      for (const op of ordered) {
        if (op.schoolId !== school) throw new HttpError(403, 'SCHOOL_ACCESS_DENIED', 'School access denied');
        const sum = hash(canonical(op)),
          existing = this.db.prepare('SELECT checksum FROM operations WHERE op_id=?').get(op.opId) as any;
        const queued = this.db
          .prepare('SELECT checksum,body FROM quarantine WHERE op_id=?')
          .get(op.opId) as any;
        if (
          (existing && existing.checksum !== sum) ||
          (queued && (queued.checksum ?? hash(canonical(this.decrypt(queued.body)))) !== sum)
        )
          throw new HttpError(
            409,
            'OPERATION_ID_COLLISION',
            'Operation identity collision: this ID already contains different content.',
          );
        if (existing) {
          accepted.push(op.opId);
          continue;
        }
        const device = this.db.prepare('SELECT * FROM devices WHERE id=?').get(op.deviceId) as
          Device | undefined;
        if (op.deviceId !== 'seed' && (!device || device.school !== school))
          throw new HttpError(403, 'UNKNOWN_AUTHOR', 'Unknown operation author');
        if (op.deviceId === 'seed' && !trustedSeed)
          throw new HttpError(403, 'SEED_UPLOAD_FORBIDDEN', 'Seed operations cannot be uploaded');
        if (device) {
          const expected = createHmac('sha256', this.decrypt(device.signing_secret))
            .update(signingBody(op))
            .digest('hex');
          if (op.actorId !== device.actor || op.signature !== expected)
            throw new HttpError(403, 'INVALID_SIGNATURE', 'Operation signature or author is invalid');
          if (
            device.role === 'Teacher' &&
            ['doses', 'doseStatus', 'growth', 'visits', 'allergy', 'prescription', 'stock'].includes(op.field)
          )
            throw new HttpError(403, 'ROLE_FORBIDDEN', 'Health field requires a health worker');
          if (device.role === 'Health Worker' && ['attendance', 'score'].includes(op.field))
            throw new HttpError(403, 'ROLE_FORBIDDEN', 'School field requires a teacher');
        }
        const parent = device?.parent_device
          ? (this.db.prepare('SELECT revoked FROM devices WHERE id=?').get(device.parent_device) as any)
          : null;
        const reason =
          op.hlc.physical > Date.now() + 300000
            ? 'Clock is over five minutes ahead'
            : device?.revoked || parent?.revoked
              ? 'Device revoked; offline time cannot be trusted'
              : null;
        if (reason) {
          this.db
            .prepare('INSERT OR IGNORE INTO quarantine(op_id,school,body,reason,checksum) VALUES(?,?,?,?,?)')
            .run(op.opId, school, this.encrypt(op), reason, sum);
          quarantined.push({ opId: op.opId, reason });
          continue;
        }
        const establishedType =
          acceptedTypes.get(op.entityId) ??
          (storedType.get(school, op.entityId) as { entity_type: Op['entityType'] } | undefined)?.entity_type;
        if (establishedType && establishedType !== op.entityType)
          throw new HttpError(
            409,
            'ENTITY_TYPE_MISMATCH',
            'This record ID is already assigned to a different entity type. Use a distinct ID; no changes were committed.',
          );
        const observed: Op[] = [],
          seen = new Set<string>(),
          dependencies = [...op.deps];
        while (dependencies.length) {
          const id = dependencies.pop()!;
          if (seen.has(id)) continue;
          seen.add(id);
          const parentOp = committed.get(id);
          // A parent in this request may have been quarantined. Its child must
          // remain unacknowledged too, rather than entering an incomplete DAG.
          if (!parentOp)
            throw new HttpError(
              409,
              'MISSING_DEPENDENCY',
              'A causal parent is missing or quarantined. No changes were committed; the pending operations must be reviewed before retrying.',
            );
          observed.push(parentOp);
          dependencies.push(...parentOp.deps);
        }
        if (
          op.kind !== 'resolve' &&
          materialize(observed).conflicts.some(
            (conflict) =>
              conflict.entityId === op.entityId &&
              (conflict.field === op.field || conflict.field === 'deleted' || op.field === 'deleted'),
          )
        )
          throw new HttpError(
            409,
            'REVIEW_REQUIRED',
            'This operation observed competing versions. Resolve them explicitly in the Conflict inbox; no changes were committed.',
          );
        this.db
          .prepare('INSERT INTO operations(op_id,school,device,body,checksum) VALUES(?,?,?,?,?)')
          .run(op.opId, school, op.deviceId, this.encrypt(op), sum);
        committed.set(op.opId, op);
        acceptedTypes.set(op.entityId, op.entityType);
        if (queued) this.db.prepare('DELETE FROM quarantine WHERE op_id=?').run(op.opId);
        accepted.push(op.opId);
      }
      if (accepted.length) this.refreshProjection(school);
      return { accepted, quarantined };
    });
  }
  private refreshProjection(school: string) {
    const rows = this.db
        .prepare('SELECT seq,body FROM operations WHERE school=? ORDER BY seq')
        .all(school) as any[],
      log = rows.map((row) => this.decrypt(row.body)) as Op[];
    const state = materialize(log),
      before = ancestry(log);
    this.db.prepare('DELETE FROM materialized_records WHERE school=?').run(school);
    this.db.prepare('DELETE FROM conflict_projection WHERE school=?').run(school);
    const recordInsert = this.db.prepare(
      'INSERT INTO materialized_records(school,entity_id,entity_type,body,version,deleted,updated_at,updated_seq) VALUES(?,?,?,?,?,?,?,?)',
    );
    for (const record of Object.values(state.entities)) {
      const entityOps = log.filter((op) => op.entityId === record.id),
        heads = entityOps
          .filter((a) => !entityOps.some((b) => a.opId !== b.opId && before(a, b)))
          .map((op) => op.opId)
          .sort();
      const updatedAt = Math.max(0, ...entityOps.map((op) => op.hlc.physical));
      const updatedSeq = Math.max(
        0,
        ...rows.filter((_, i) => log[i].entityId === record.id).map((row) => Number(row.seq)),
      );
      recordInsert.run(
        school,
        record.id,
        record.type,
        this.encrypt(record),
        hash(canonical(heads)),
        record.deleted === true ? 1 : 0,
        updatedAt,
        updatedSeq,
      );
    }
    const conflictInsert = this.db.prepare(
      'INSERT INTO conflict_projection(school,conflict_id,entity_id,body,updated_at) VALUES(?,?,?,?,?)',
    );
    for (const conflict of state.conflicts)
      conflictInsert.run(school, conflict.id, conflict.entityId, this.encrypt(conflict), Date.now());
  }
  getRecord(id: string, school = SCHOOL): RecordEnvelope | null {
    const row = this.db
      .prepare('SELECT body,version,updated_at FROM materialized_records WHERE school=? AND entity_id=?')
      .get(school, id) as any;
    return row
      ? { record: this.decrypt(row.body), version: row.version, updatedAt: Number(row.updated_at) }
      : null;
  }
  listRecords(options: {
    school: string;
    type?: string;
    includeDeleted?: boolean;
    search?: string;
    offset?: number;
    limit?: number;
  }) {
    const offset = Math.max(0, Math.floor(options.offset ?? 0)),
      limit = Math.max(1, Math.min(200000, Math.floor(options.limit ?? 50)));
    const rows = this.db
      .prepare(
        'SELECT body,version,updated_at FROM materialized_records WHERE school=? AND (? IS NULL OR entity_type=?) AND (?=1 OR deleted=0) ORDER BY entity_id',
      )
      .all(
        options.school,
        options.type ?? null,
        options.type ?? null,
        options.includeDeleted ? 1 : 0,
      ) as any[];
    let records: RecordEnvelope[] = rows.map((row) => ({
      record: this.decrypt(row.body),
      version: row.version,
      updatedAt: Number(row.updated_at),
    }));
    const terms = (options.search ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length)
      records = records.filter(({ record }) =>
        terms.every((term) => canonical(record).toLowerCase().includes(term)),
      );
    return { records: records.slice(offset, offset + limit), total: records.length, offset, limit };
  }
  listConflicts(school = SCHOOL): Conflict[] {
    return (
      this.db
        .prepare('SELECT body FROM conflict_projection WHERE school=? ORDER BY conflict_id')
        .all(school) as any[]
    ).map((row) => this.decrypt(row.body));
  }
  entityVersion(id: string, school = SCHOOL) {
    return (
      (
        this.db
          .prepare('SELECT version FROM materialized_records WHERE school=? AND entity_id=?')
          .get(school, id) as any
      )?.version ?? emptyVersion
    );
  }
  replayCommand(deviceId: string, requestId: string, fingerprint: string) {
    const source = this.db.prepare('SELECT school FROM devices WHERE id=? AND internal=0').get(deviceId) as
      { school: string } | undefined;
    if (!source) return null;
    const receipt = this.db
      .prepare('SELECT fingerprint,body FROM command_receipts WHERE school=? AND device=? AND request_id=?')
      .get(source.school, deviceId, requestId) as any;
    if (!receipt) return null;
    if (receipt.fingerprint !== fingerprint)
      throw new HttpError(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This request ID was already used for different input.',
      );
    return { ...this.decrypt(receipt.body), replayed: true } as {
      operationIds: string[];
      entityIds: string[];
      replayed: boolean;
    };
  }
  command(
    device: any,
    requestId: string,
    fingerprint: string,
    changes: Change[],
    expected?: ExpectedVersion | ExpectedVersion[],
  ) {
    return this.transaction(() => {
      const id = device.id ?? device.deviceId,
        source = this.db.prepare('SELECT * FROM devices WHERE id=? AND internal=0').get(id) as
          Device | undefined;
      if (!source || source.school !== (device.school ?? device.schoolId))
        throw new HttpError(403, 'DEVICE_FORBIDDEN', 'Unknown or mismatched device.');
      if (source.revoked) throw new HttpError(403, 'DEVICE_REVOKED', 'This device has been revoked.');
      if (source.expires < Date.now()) throw new HttpError(401, 'SESSION_EXPIRED', 'Device session expired.');
      if (
        !requestId ||
        requestId.length > 200 ||
        !fingerprint ||
        fingerprint.length > 512 ||
        !changes.length ||
        changes.length > 1000
      )
        throw new HttpError(400, 'INVALID_COMMAND', 'A request ID and 1–1000 changes are required.');
      const receipt = this.db
        .prepare('SELECT fingerprint,body FROM command_receipts WHERE school=? AND device=? AND request_id=?')
        .get(source.school, source.id, requestId) as any;
      if (receipt) {
        if (receipt.fingerprint !== fingerprint)
          throw new HttpError(
            409,
            'IDEMPOTENCY_CONFLICT',
            'This request ID was already used for different input.',
          );
        return { ...this.decrypt(receipt.body), replayed: true } as {
          operationIds: string[];
          entityIds: string[];
          replayed: boolean;
        };
      }
      for (const baseline of expected ? (Array.isArray(expected) ? expected : [expected]) : [])
        if (this.entityVersion(baseline.entityId, source.school) !== baseline.version)
          throw new HttpError(
            409,
            'VERSION_CONFLICT',
            'The record changed after it was loaded. Refresh and review the current versions.',
          );
      const current = this.listConflicts(source.school);
      for (const change of changes)
        if (
          (change.kind ?? 'set') === 'set' &&
          current.some((conflict) => conflict.entityId === change.entityId && conflict.field === change.field)
        )
          throw new HttpError(
            409,
            'REVIEW_REQUIRED',
            'This field has competing versions. Resolve it in the Conflict inbox.',
          );
      let writer = this.db
        .prepare('SELECT * FROM devices WHERE parent_device=? AND internal=1')
        .get(source.id) as Device | undefined;
      if (!writer) {
        const writerId = 'hub-' + randomBytes(8).toString('hex'),
          secret = randomBytes(32).toString('hex');
        this.db
          .prepare(
            'INSERT INTO devices(id,school,actor,role,token_hash,recovery_hash,expires,last_seen,signing_secret,internal,parent_device) VALUES(?,?,?,?,?,?,?,?,?,1,?)',
          )
          .run(
            writerId,
            source.school,
            source.actor,
            source.role,
            hash(randomBytes(32).toString('hex')),
            hash(randomBytes(32).toString('hex')),
            source.expires,
            Date.now(),
            this.encrypt(secret),
            source.id,
          );
        writer = this.db.prepare('SELECT * FROM devices WHERE id=?').get(writerId) as Device;
      }
      const log = this.all(source.school),
        ops: Op[] = [],
        secret = this.decrypt(writer.signing_secret);
      for (const change of changes) {
        const operation = OpSchema.parse({
          ...makeOp(
            log,
            writer.id,
            writer.actor,
            change.entityId,
            change.field,
            change.value,
            change.kind ?? 'set',
            change.entityType,
          ),
          schoolId: source.school,
        });
        const op = {
          ...operation,
          signature: createHmac('sha256', secret).update(signingBody(operation)).digest('hex'),
        };
        ops.push(op);
        log.push(op);
      }
      const ingested = this.ingest(ops, source.school);
      if (ingested.quarantined.length)
        throw new HttpError(
          409,
          'COMMAND_QUARANTINED',
          'The command could not be accepted; no changes were committed.',
        );
      const result = {
        operationIds: ops.map((op) => op.opId),
        entityIds: [...new Set(ops.map((op) => op.entityId))],
        replayed: false,
      };
      this.db
        .prepare(
          'INSERT INTO command_receipts(school,device,request_id,fingerprint,body,created_at) VALUES(?,?,?,?,?,?)',
        )
        .run(source.school, source.id, requestId, fingerprint, this.encrypt(result), Date.now());
      this.audit(
        source.id,
        'manual-command',
        { requestId, operationIds: result.operationIds, entityIds: result.entityIds },
        source.school,
      );
      return result;
    });
  }
  audit(device: any, event: string, details: unknown = {}, school?: string) {
    const id = typeof device === 'string' ? device : (device.id ?? device.deviceId ?? 'system'),
      tenant = school ?? device.school ?? device.schoolId ?? SCHOOL;
    const time = Date.now(),
      result = this.db
        .prepare('INSERT INTO audit(device,event,time,school,body) VALUES(?,?,?,?,?)')
        .run(id, event.slice(0, 160), time, tenant, this.encrypt(details));
    return { id: Number(result.lastInsertRowid), deviceId: id, event, time };
  }
  listAudit(school = SCHOOL, limit = 100) {
    return (
      this.db
        .prepare('SELECT id,device,event,time,body FROM audit WHERE school=? ORDER BY id DESC LIMIT ?')
        .all(school, Math.max(1, Math.min(500, Math.floor(limit)))) as any[]
    ).map((row) => ({
      id: Number(row.id),
      deviceId: row.device,
      event: row.event,
      time: Number(row.time),
      details: row.body ? this.decrypt(row.body) : {},
    }));
  }
  pull(cursor: number, school = SCHOOL, limit = 32) {
    const rows = this.db
      .prepare('SELECT seq,body FROM operations WHERE school=? AND seq>? ORDER BY seq LIMIT ?')
      .all(school, cursor, limit) as any[];
    const ops: Op[] = [];
    let bytes = 0,
      next = cursor;
    for (const row of rows) {
      const op = this.decrypt(row.body),
        n = Buffer.byteLength(JSON.stringify(op));
      if (ops.length && bytes + n > 48000) break;
      ops.push(op);
      bytes += n;
      next = Number(row.seq);
    }
    const more = Boolean(
      this.db.prepare('SELECT 1 FROM operations WHERE school=? AND seq>? LIMIT 1').get(school, next),
    );
    return { ops, cursor: next, more };
  }
  all(school = SCHOOL): Op[] {
    return (
      this.db.prepare('SELECT body FROM operations WHERE school=? ORDER BY seq').all(school) as any[]
    ).map((row) => this.decrypt(row.body));
  }
  summary(school = SCHOOL) {
    const ops = this.all(school);
    return {
      operations: ops.length,
      conflicts: this.listConflicts(school).length,
      records: Number(
        (this.db.prepare('SELECT COUNT(*) AS n FROM materialized_records WHERE school=?').get(school) as any)
          .n,
      ),
      schemaVersion: HUB_SCHEMA_VERSION,
      devices: this.db
        .prepare('SELECT id,actor,role,expires,revoked,last_seen FROM devices WHERE school=? AND internal=0')
        .all(school),
      quarantined: this.db.prepare('SELECT op_id,reason FROM quarantine WHERE school=?').all(school),
      root: hash(canonical(ops.sort((a, b) => a.opId.localeCompare(b.opId)))),
    };
  }
  sign(value: unknown) {
    return createHmac('sha256', this.key).update(canonical(value)).digest('hex');
  }
  verify(value: unknown, signature: string) {
    const a = Buffer.from(this.sign(value)),
      b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  close() {
    this.db.close();
  }
}
export function loadHubKey(path: string, demo: boolean) {
  if (process.env.HUB_ENCRYPTION_KEY) return process.env.HUB_ENCRYPTION_KEY;
  if (!demo) throw new Error('Set HUB_ENCRYPTION_KEY outside demo mode');
  mkdirSync(dirname(path), { recursive: true });
  const file = dirname(path) + '/demo-hub.key';
  if (!existsSync(file)) writeFileSync(file, randomBytes(32).toString('hex'), { mode: 0o600 });
  return readFileSync(file, 'utf8').trim();
}
