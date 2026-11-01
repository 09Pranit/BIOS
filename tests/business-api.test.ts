import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { createApp } from '../apps/hub/src/app';
import { HubStore, SESSION_TTL_MS } from '../apps/hub/src/store';
import { makeOp, materialize, signOperation, type Op } from '../packages/sync-core/src/index';

let store: HubStore, server: Server, url: string;
type Identity = ReturnType<HubStore['enroll']>;

async function start(demo = true) {
  server = createApp(store, demo).listen(0, '127.0.0.1');
  await once(server, 'listening');
  url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}

const closeServer = () => new Promise<void>((resolve) => server.close(() => resolve()));

beforeEach(async () => {
  store = new HubStore(':memory:', randomBytes(32).toString('hex'));
  await start();
});

afterEach(async () => {
  await closeServer();
  store.close();
  vi.unstubAllEnvs();
});

async function request(
  identity: Identity | undefined,
  path: string,
  method = 'GET',
  body?: unknown,
  key?: string,
) {
  const response = await fetch(url + path, {
    method,
    headers: {
      ...(identity ? { Authorization: `Bearer ${identity.token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(key ? { 'Idempotency-Key': key } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  expect(response.headers.get('content-type')).toContain('application/json');
  const data = await response.json();
  return { response, data };
}

const childBody = (name = 'Example Child') => ({
  name,
  dob: '2019-04-15',
  guardian: 'Example Guardian',
  class: 'Class 2',
  village: 'Dhareri',
  consent: true,
});

async function createChild(identity: Identity, name?: string, key = randomUUID()) {
  const result = await request(identity, '/api/children', 'POST', childBody(name), key);
  expect([200, 201]).toContain(result.response.status);
  expect(result.data.record.id).toEqual(expect.any(String));
  expect(result.data.version).toEqual(expect.any(String));
  return result.data;
}

async function upload(identity: Identity, ops: Op[]) {
  return request(identity, '/api/sync', 'POST', { protocol: 1, ops, cursor: 0, limit: 64 });
}

describe('manual database HTTP API', () => {
  it('renews an expired device during the online grace period without reopening other routes', async () => {
    const identity = store.enroll('Returning worker', 'Reviewer');
    store.db.prepare('UPDATE devices SET expires=? WHERE id=?').run(Date.now() - 1000, identity.deviceId);
    expect((await request(identity, '/api/session')).response.status).toBe(401);
    const renewal = await request(identity, '/api/session/renew', 'POST', {});
    expect(renewal.response.status).toBe(200);
    expect(renewal.data.expires).toBeGreaterThan(Date.now());
    expect(renewal.data.expires).toBeLessThanOrEqual(Date.now() + SESSION_TTL_MS);
    expect((await request(identity, '/api/session')).response.status).toBe(200);
  });

  it('authenticates database queries and exposes session and database metadata', async () => {
    expect((await request(undefined, '/api/children')).response.status).toBe(401);
    const identity = store.enroll('Reviewer', 'Reviewer');
    expect(identity.expires).toBeLessThanOrEqual(Date.now() + SESSION_TTL_MS);
    const session = await request(identity, '/api/session');
    expect(session.response.status).toBe(200);
    expect(session.data).toMatchObject({
      role: identity.role,
      deviceId: identity.deviceId,
      schoolId: identity.schoolId,
    });
    const database = await request(identity, '/api/database');
    expect(database.response.status).toBe(200);
    expect(database.data.schemaVersion).toBeGreaterThanOrEqual(1);
    expect(database.data.engine).toEqual(expect.any(String));
    expect(database.data.counts).toEqual(expect.any(Object));
    expect(database.data.storageBytes).toBeGreaterThanOrEqual(0);
  });

  it('atomically creates a child and replays a retry without duplicating its operations', async () => {
    const identity = store.enroll('Reviewer', 'Reviewer');
    const key = randomUUID();
    const first = await createChild(identity, undefined, key);
    const count = store.all().length;
    expect(first.operationIds.length).toBeGreaterThan(0);
    expect(first.replayed).toBe(false);
    const second = await createChild(identity, undefined, key);
    expect(second.replayed).toBe(true);
    expect(second.record).toEqual(first.record);
    expect(second.operationIds).toEqual(first.operationIds);
    expect(store.all()).toHaveLength(count);
    const changed = await request(identity, '/api/children', 'POST', childBody('Different Child'), key);
    expect(changed.response.status).toBe(409);
    expect(store.all()).toHaveLength(count);
    const missingKey = await request(identity, '/api/children', 'POST', childBody());
    expect(missingKey.response.status).toBe(400);
    expect(store.all()).toHaveLength(count);
    const list = await request(identity, '/api/children');
    expect(list.data.total).toBe(1);
    expect(list.data.records[0]).toMatchObject({ record: { id: first.record.id }, version: first.version });
    expect(list.data.records[0].updatedAt).toBeDefined();
  });

  it('uses version checks for corrections, archive and restore without losing historical values', async () => {
    const identity = store.enroll('Reviewer', 'Reviewer');
    const child = await createChild(identity);
    const path = `/api/children/${encodeURIComponent(child.record.id)}`;
    const updated = await request(
      identity,
      path,
      'PATCH',
      { baseVersion: child.version, name: 'Corrected Child' },
      randomUUID(),
    );
    expect(updated.response.status).toBe(200);
    expect(updated.data.record.name).toBe('Corrected Child');
    expect(updated.data.version).not.toBe(child.version);
    const count = store.all().length;
    const stale = await request(
      identity,
      path,
      'PATCH',
      { baseVersion: child.version, name: 'Stale overwrite' },
      randomUUID(),
    );
    expect(stale.response.status).toBe(409);
    expect(store.all()).toHaveLength(count);
    const archived = await request(
      identity,
      path + '/archive',
      'POST',
      { baseVersion: updated.data.version },
      randomUUID(),
    );
    expect(archived.response.status).toBe(200);
    expect(archived.data.record.deleted).toBe(true);
    expect((await request(identity, '/api/children')).data.total).toBe(0);
    const restored = await request(
      identity,
      path + '/restore',
      'POST',
      { baseVersion: archived.data.version },
      randomUUID(),
    );
    expect(restored.response.status).toBe(200);
    expect(restored.data.record.deleted).toBe(false);
    expect((await request(identity, path)).data.record.name).toBe('Corrected Child');
    const names = store.all().filter((op) => op.entityId === child.record.id && op.field === 'name');
    expect(names.map((op) => op.value)).toEqual(['Example Child', 'Corrected Child']);
  });

  it('rejects malformed manual records and supports bounded searchable lists', async () => {
    const identity = store.enroll('Reviewer', 'Reviewer');
    for (const patch of [{ dob: '2019-02-30' }, { dob: '9999-01-01' }, { consent: false }, { class: ' ' }]) {
      const result = await request(
        identity,
        '/api/children',
        'POST',
        { ...childBody(), ...patch },
        randomUUID(),
      );
      expect([400, 422]).toContain(result.response.status);
    }
    expect(store.all()).toHaveLength(0);
    await createChild(identity, 'First Child');
    const second = await createChild(identity, 'Second Child');
    const filtered = await request(identity, '/api/children?q=Second&limit=1&offset=0');
    expect(filtered.response.status).toBe(200);
    expect(filtered.data.total).toBe(1);
    expect(filtered.data.records.map((entry: any) => entry.record.id)).toEqual([second.record.id]);
    expect((await request(identity, '/api/children?limit=201')).response.status).toBe(400);
    expect((await request(identity, '/api/children/unknown-child')).response.status).toBe(404);
    expect((await request(identity, '/api/unknown-endpoint')).response.status).toBe(404);
  });

  it('keeps server manual-entry counters independent from an enrolled device pending offline work', async () => {
    const identity = store.enroll('Reviewer', 'Reviewer');
    const pending = await signOperation(
      makeOp([], identity.deviceId, identity.actorId, 'offline-child', 'name', 'Offline Child'),
      identity.token,
    );
    const child = await createChild(identity);
    const result = await upload(identity, [pending]);
    expect(result.response.status).toBe(200);
    expect(result.data.accepted).toContain(pending.opId);
    expect(
      store
        .all()
        .filter((op) => op.entityId === child.record.id)
        .every((op) => op.opId !== pending.opId),
    ).toBe(true);
    expect(materialize(store.all()).entities['offline-child'].name).toBe('Offline Child');
    expect(materialize(store.all()).entities[child.record.id].name).toBe('Example Child');
  });
});

describe('attendance, assessments, and clinical data', () => {
  it('serves original learning content and stores a checked progress event idempotently', async () => {
    const identity = store.enroll('Teacher', 'Teacher'),
      child = await createChild(identity);
    const content = await request(identity, '/api/library');
    expect(content.data.lessons.length).toBeGreaterThan(0);
    expect(content.data.lessons[0].answer).toBeUndefined();
    const key = randomUUID(),
      body = { lessonId: 'division', childId: child.record.id, answer: 1 };
    const result = await request(identity, '/api/learning/progress', 'POST', body, key);
    expect(result.response.status).toBe(201);
    expect(result.data.record.progress[0].correct).toBe(true);
    const count = store.all().length;
    expect((await request(identity, '/api/learning/progress', 'POST', body, key)).data.replayed).toBe(true);
    expect(store.all()).toHaveLength(count);
    const query = await request(identity, '/api/learning/progress');
    expect(query.data.total).toBe(1);
    expect(
      (await request(identity, '/api/learning/progress', 'POST', { ...body, answer: 99 }, randomUUID()))
        .response.status,
    ).toBe(400);
  });
  it('records consent withdrawal without erasing history after clinical entry is removed', async () => {
    const identity = store.enroll('Reviewer', 'Reviewer'),
      child = await createChild(identity),
      path = '/api/children/' + child.record.id;
    const withdrawal = await request(
      identity,
      path,
      'PATCH',
      { baseVersion: child.version, consent: false },
      randomUUID(),
    );
    expect(withdrawal.response.status).toBe(200);
    const count = store.all().length;
    expect(
      (
        await request(
          identity,
          path + '/visits',
          'POST',
          { date: '2020-01-01', note: 'New visit' },
          randomUUID(),
        )
      ).response.status,
    ).toBe(404);
    expect(store.all()).toHaveLength(count);
    expect((await request(identity, path)).data.record.consent).toBe(false);
  });
  it('persists attendance batches, requires prior versions to correct marks, and rejects stale batches', async () => {
    const identity = store.enroll('Teacher', 'Teacher');
    const child = await createChild(identity);
    const childId = child.record.id;
    const date = '2020-01-01';
    const first = await request(
      identity,
      '/api/attendance',
      'PUT',
      { date, marks: [{ childId, status: 'present' }] },
      randomUUID(),
    );
    expect([200, 201]).toContain(first.response.status);
    const rows = (await request(identity, `/api/attendance?date=${date}`)).data.rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ childId, status: 'present' });
    expect(rows[0].version).toEqual(expect.any(String));
    const noVersion = await request(
      identity,
      '/api/attendance',
      'PUT',
      { date, marks: [{ childId, status: 'absent' }] },
      randomUUID(),
    );
    expect(noVersion.response.status).toBe(409);
    const changed = await request(
      identity,
      '/api/attendance',
      'PUT',
      {
        date,
        marks: [{ childId, status: 'absent' }],
        baseVersions: { [childId]: rows[0].version },
      },
      randomUUID(),
    );
    expect(changed.response.status).toBe(200);
    const count = store.all().length;
    const stale = await request(
      identity,
      '/api/attendance',
      'PUT',
      {
        date,
        marks: [{ childId, status: 'late' }],
        baseVersions: { [childId]: rows[0].version },
      },
      randomUUID(),
    );
    expect(stale.response.status).toBe(409);
    expect(store.all()).toHaveLength(count);
    const current = await request(identity, `/api/attendance?date=${date}`);
    expect(current.data.rows[0].status).toBe('absent');
    expect(current.data.summary).toEqual(expect.any(Object));
  });

  it('stores a zero assessment score and rejects invalid or missing scores without appending records', async () => {
    const identity = store.enroll('Teacher', 'Teacher');
    const child = await createChild(identity);
    const assessment = { title: 'Fractions', attempt: 1, scores: [{ childId: child.record.id, score: 0 }] };
    const created = await request(identity, '/api/assessments', 'PUT', assessment, randomUUID());
    expect([200, 201]).toContain(created.response.status);
    const records = (await request(identity, '/api/assessments')).data.records;
    expect(records).toHaveLength(1);
    expect(records[0].record.score).toBe(0);
    const count = store.all().length;
    for (const score of [undefined, '0', -1, 101]) {
      const invalid = await request(
        identity,
        '/api/assessments',
        'PUT',
        {
          ...assessment,
          attempt: 2,
          scores: [{ childId: child.record.id, score }],
        },
        randomUUID(),
      );
      expect([400, 422]).toContain(invalid.response.status);
    }
    expect(store.all()).toHaveLength(count);
  });

  it('removes clinical endpoints while preserving existing records', async () => {
    const identity = store.enroll('Reviewer', 'Reviewer');
    const child = await createChild(identity);
    const count = store.all().length;
    for (const endpoint of ['visits', 'growth', 'vaccinations']) {
      const result = await request(
        identity,
        `/api/children/${child.record.id}/${endpoint}`,
        'POST',
        {},
        randomUUID(),
      );
      expect(result.response.status).toBe(404);
    }
    expect((await request(identity, '/api/health/events')).response.status).toBe(404);
    expect(store.all()).toHaveLength(count);
    expect((await request(identity, '/api/children/' + child.record.id)).data.record).toEqual(child.record);
  });
});

describe('causal review and production enrollment', () => {
  it('resolves only the reviewed frontier, preserves both originals, and replays safely', async () => {
    const reviewer = store.enroll('Reviewer', 'Reviewer');
    const other = store.enroll('Second Reviewer', 'Reviewer');
    const child = await createChild(reviewer);
    const observed = store.all();
    const a = await signOperation(
      makeOp(observed, reviewer.deviceId, reviewer.actorId, child.record.id, 'name', 'First account'),
      reviewer.token,
    );
    const b = await signOperation(
      makeOp(observed, other.deviceId, other.actorId, child.record.id, 'name', 'Second account'),
      other.token,
    );
    expect((await upload(reviewer, [a])).response.status).toBe(200);
    expect((await upload(other, [b])).response.status).toBe(200);
    const conflicts = (await request(reviewer, '/api/conflicts')).data.conflicts;
    const conflict = conflicts.find(
      (entry: any) => entry.entityId === child.record.id && entry.field === 'name',
    );
    expect(conflict).toBeDefined();
    const expectedOpIds = conflict.versions.map((op: Op) => op.opId);
    const path = `/api/conflicts/${encodeURIComponent(conflict.id)}/resolve`;
    const stale = await request(
      reviewer,
      path,
      'POST',
      { value: 'First account', expectedOpIds: [a.opId, 'missing:1'] },
      randomUUID(),
    );
    expect(stale.response.status).toBe(409);
    const key = randomUUID();
    const body = {
      value: 'First account',
      expectedOpIds,
      reason: 'Reviewed both accounts with the guardian',
    };
    const resolved = await request(reviewer, path, 'POST', body, key);
    expect(resolved.response.status).toBe(200);
    const count = store.all().length;
    const replay = await request(reviewer, path, 'POST', body, key);
    expect(replay.response.status).toBe(200);
    expect(replay.data.replayed).toBe(true);
    expect(store.all()).toHaveLength(count);
    expect((await request(reviewer, '/api/conflicts')).data.conflicts).toHaveLength(0);
    expect(
      (await request(reviewer, `/api/children/${encodeURIComponent(child.record.id)}`)).data.record.name,
    ).toBe('First account');
    expect(store.all().some((op) => op.opId === a.opId)).toBe(true);
    expect(store.all().some((op) => op.opId === b.opId)).toBe(true);
  });

  it('bootstraps one administrator and honors a single-use invitation role instead of client role claims', async () => {
    await closeServer();
    vi.stubEnv('BOOTSTRAP_TOKEN', randomBytes(24).toString('hex'));
    await start(false);
    const enrollment = (body: unknown) => request(undefined, '/api/enroll', 'POST', body);
    const bootstrap = await enrollment({
      actor: 'First Admin',
      role: 'Teacher',
      code: process.env.BOOTSTRAP_TOKEN,
    });
    expect([200, 201]).toContain(bootstrap.response.status);
    expect(bootstrap.data.role).toBe('Hub Admin');
    const admin = bootstrap.data as Identity;
    const again = await enrollment({
      actor: 'Second Admin',
      role: 'Hub Admin',
      code: process.env.BOOTSTRAP_TOKEN,
    });
    expect(again.response.status).toBe(403);
    const invitation = await request(admin, '/api/admin/invitations', 'POST', {
      role: 'Teacher',
      ttlHours: 24,
    });
    expect([200, 201]).toContain(invitation.response.status);
    expect(invitation.data.code).toEqual(expect.any(String));
    const enrolled = await enrollment({
      actor: 'Invited Teacher',
      role: 'Hub Admin',
      code: invitation.data.code,
    });
    expect([200, 201]).toContain(enrolled.response.status);
    expect(enrolled.data.role).toBe('Teacher');
    expect(
      (await enrollment({ actor: 'Replay User', role: 'Teacher', code: invitation.data.code })).response
        .status,
    ).toBe(403);
    expect(
      (await enrollment({ actor: 'Unknown User', role: 'Teacher', code: 'invalid-code' })).response.status,
    ).toBe(403);
    expect((await enrollment({ actor: 'Missing Code', role: 'Teacher' })).response.status).toBe(403);
    const denied = await request(enrolled.data, '/api/admin/invitations', 'POST', {
      role: 'Hub Admin',
      ttlHours: 24,
    });
    expect(denied.response.status).toBe(403);
  });
});
