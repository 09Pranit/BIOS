import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { randomBytes } from 'node:crypto';
import { HubStore } from '../apps/hub/src/store';
import { createApp } from '../apps/hub/src/app';
import { makeOp, signOperation, SCHOOL, type Op } from '../packages/sync-core/src/index';
let store: HubStore, server: Server, url: string;
beforeEach(async () => {
  store = new HubStore(':memory:', randomBytes(32).toString('hex'));
  server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  url = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  store.close();
});
const signed = async (identity: any, field: any, value: any, log: Op[] = [], kind: any = 'set') =>
  signOperation(
    makeOp(log, identity.deviceId, identity.actorId, 'child', field, value, kind),
    identity.token,
  );
const sync = async (i: any, ops: Op[] = [], cursor = 0) =>
  fetch(url + '/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + i.token },
    body: JSON.stringify({ protocol: 1, ops, cursor, limit: 2 }),
  });
describe('transactional hub & protocol', () => {
  it('durably deduplicates a replayed batch', async () => {
    const i = store.enroll('Teacher', 'Reviewer'),
      op = await signed(i, 'name', 'Demo');
    for (let n = 0; n < 5; n++) {
      const r = await sync(i, [op]);
      expect(r.ok).toBe(true);
      expect((await r.json()).accepted).toEqual([op.opId]);
    }
    expect(store.all()).toHaveLength(1);
  });
  it('rejects a school mismatch and missing authorization', async () => {
    const i = store.enroll('Teacher', 'Reviewer'),
      op = await signed(i, 'name', 'Demo');
    expect((await sync(i, [{ ...op, schoolId: 'unauthorized-school' }])).status).toBe(403);
    expect((await sync({ token: 'fake' }, [op])).status).toBe(401);
    expect(store.all()).toHaveLength(0);
  });
  it('supports signed forwarding for a backup without exposing original credentials', async () => {
    const a = store.enroll('Original', 'Reviewer'),
      b = store.enroll('New device', 'Reviewer'),
      op = await signed(a, 'name', 'Restored');
    expect((await sync(b, [op])).ok).toBe(true);
    const forged = { ...op, opId: a.deviceId + ':2', counter: 2, value: 'Forged' };
    expect((await sync(b, [forged])).ok).toBe(false);
    expect(store.all()).toHaveLength(1);
  });
  it('quarantines a future clock instead of discarding its payload', async () => {
    const i = store.enroll('Worker', 'Reviewer');
    let op = await signed(i, 'name', 'Future');
    op = await signOperation({ ...op, hlc: { ...op.hlc, physical: Date.now() + 86400000 } }, i.token);
    const r = await (await sync(i, [op])).json();
    expect(r.quarantined).toHaveLength(1);
    expect(store.all()).toHaveLength(0);
    const q = store.db.prepare('SELECT body FROM quarantine').get() as any;
    expect(store.decrypt(q.body).value).toBe('Future');
  });
  it('encrypts stored personal fields', async () => {
    const i = store.enroll('Worker', 'Reviewer'),
      op = await signed(i, 'name', 'SensitiveExample');
    store.ingest([op]);
    const row = store.db.prepare('SELECT body FROM operations').get() as any;
    expect(row.body).not.toContain('SensitiveExample');
    expect(store.decrypt(row.body)).toEqual(op);
  });
  it('rejects unauthorized clinical writes by a teacher', async () => {
    const i = store.enroll('Teacher', 'Teacher'),
      op = await signed(i, 'prescription', 'Needs review');
    expect((await sync(i, [op])).ok).toBe(false);
    expect(store.all()).toHaveLength(0);
  });
  it('rolls back the whole batch on an invalid signature', async () => {
    const i = store.enroll('Worker', 'Reviewer'),
      a = await signed(i, 'name', 'A'),
      b = await signed(i, 'guardian', 'B', [a]);
    expect(() => store.ingest([a, { ...b, value: 'tampered' }])).toThrow('signature');
    expect(store.all()).toHaveLength(0);
  });
  it('resumes from a committed pull cursor without missing operations', async () => {
    const i = store.enroll('Worker', 'Reviewer');
    let log: Op[] = [];
    for (let n = 0; n < 9; n++) log.push(await signed(i, 'visits', { n }, log, 'add'));
    store.ingest(log);
    const first = store.pull(0, SCHOOL, 2),
      second = store.pull(first.cursor, SCHOOL, 2);
    expect(first.ops).toHaveLength(2);
    expect(second.ops).toHaveLength(2);
    expect(new Set([...first.ops, ...second.ops].map((o) => o.opId)).size).toBe(4);
    let cursor = second.cursor,
      all = [...first.ops, ...second.ops];
    while (true) {
      const page = store.pull(cursor, SCHOOL, 2);
      all.push(...page.ops);
      cursor = page.cursor;
      if (!page.more) break;
    }
    expect(new Set(all.map((o) => o.opId)).size).toBe(9);
  });
  it('revokes an old identity on recovery; quarantines forwarded revoked-device work', async () => {
    const old = store.enroll('Old', 'Reviewer'),
      pending = await signed(old, 'name', 'Offline edit');
    const r = await fetch(url + '/api/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recovery: old.recovery, actor: 'New' }),
    });
    expect(r.ok).toBe(true);
    const fresh = await r.json();
    expect((await sync(old, [pending])).status).toBe(403);
    const replay = await (await sync(fresh, [pending])).json();
    expect(replay.quarantined).toHaveLength(1);
    expect(store.all()).toHaveLength(0);
  });
  it('bundle signature rejects a changed payload and accepts exact replay', async () => {
    const i = store.enroll('Worker', 'Reviewer'),
      op = await signed(i, 'name', 'Bundle');
    store.ingest([op]);
    const headers = { Authorization: 'Bearer ' + i.token, 'Content-Type': 'application/json' },
      bundle = await (await fetch(url + '/api/bundle', { headers })).json();
    expect(store.verify(bundle.payload, bundle.signature)).toBe(true);
    bundle.payload.school = 'forged';
    const r = await fetch(url + '/api/bundle', { method: 'POST', headers, body: JSON.stringify(bundle) });
    expect(r.status).toBe(400);
  });
});
