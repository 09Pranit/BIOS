import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import {
  createKeys,
  unlockKey,
  seal,
  open,
  exportBackup,
  importBackup,
  type Sealed,
} from '../../../../packages/sync-core/src/crypto';
import {
  OpSchema,
  makeOp,
  union,
  materialize,
  batches,
  causalOrder,
  CausalHistoryError,
  ancestry,
  frontier,
  signOperation,
  type Op,
} from '../../../../packages/sync-core/src/index';
import type { Field } from '../../../../packages/sync-core/src/policy';
import { getActiveWorkspaceName, rememberActiveWorkspace } from './workspaces';
import { timeoutSignal } from './platform';
export type Identity = {
  deviceId: string;
  actorId: string;
  token: string;
  role: string;
  recovery: string;
  expires: number;
  schoolId: string;
};
export type Report = {
  sent: number;
  received: number;
  bytes: number;
  duration: number;
  checkpoint: number;
  chunks: number;
};
type State = {
  identity: Identity;
  ops: Op[];
  acked: string[];
  cursor: number;
  lastSync: number;
  report: Report | null;
  quarantined: { opId: string; reason: string }[];
  entryDrafts?: Record<string, string>;
};
type Meta = { id: string; salt: string; wrapped: Sealed };
type SavedState = { id: string; sealed: Sealed; revision?: number };
class LocalDB extends Dexie {
  meta!: Table<Meta, string>;
  vault!: Table<SavedState, string>;
  constructor(name: string) {
    super('kuka-' + name);
    this.version(1).stores({ meta: 'id', vault: 'id' });
  }
}
export class Vault {
  db: LocalDB;
  key?: CryptoKey;
  state?: State;
  busy = false;
  tail: Promise<any> = Promise.resolve();
  private generation = 0;
  constructor(public name = 'main') {
    this.db = new LocalDB(name);
  }
  async exists() {
    return Boolean(await this.db.meta.get('keys'));
  }
  async create(pin: string, identity: Identity) {
    const generation = this.generation;
    if (await this.exists()) throw new Error('Workspace already exists; unlock it instead');
    const keys = await createKeys(pin);
    const state: State = {
      identity,
      ops: [],
      acked: [],
      cursor: 0,
      lastSync: 0,
      report: null,
      quarantined: [],
    };
    const sealed = await seal(keys.key, state);
    this.assertGeneration(generation);
    await this.db.transaction('rw', this.db.meta, this.db.vault, async () => {
      if ((await this.db.meta.get('keys')) || (await this.db.vault.get('state')))
        throw new Error('Workspace already exists; unlock it instead');
      this.assertGeneration(generation);
      await this.db.meta.add({ id: 'keys', salt: keys.salt, wrapped: keys.wrapped });
      await this.db.vault.add({ id: 'state', sealed, revision: 1 });
    });
    this.assertGeneration(generation);
    this.key = keys.key;
    this.state = state;
  }
  async unlock(pin: string) {
    this.lock();
    const generation = this.generation;
    if (!globalThis.crypto?.subtle)
      throw new Error(
        'Secure encryption is unavailable. Open this app on localhost or HTTPS in a supported browser.',
      );
    const meta = await this.db.meta.get('keys'),
      saved = await this.db.vault.get('state');
    if (!meta || !saved) throw new Error('No local workspace. Enroll this device first.');
    let key: CryptoKey;
    try {
      key = await unlockKey(pin, meta.salt, meta.wrapped);
    } catch {
      throw new Error(
        'Incorrect PIN. Use the PIN chosen when setting up this browser. Your encrypted records are unchanged.',
      );
    }
    let state: State;
    try {
      state = await open<State>(key, saved.sealed);
    } catch {
      throw new Error(
        'The PIN unlocked your key, but the encrypted workspace could not be read. Keep this workspace and recover synchronized records.',
      );
    }
    this.assertGeneration(generation);
    this.key = key;
    this.state = state;
  }
  lock() {
    this.generation++;
    this.key = undefined;
    this.state = undefined;
  }
  private assertGeneration(generation: number) {
    if (this.generation !== generation)
      throw new Error('The workspace was locked while this action was finishing. Unlock it to continue.');
  }
  private assertSession(generation: number, key: CryptoKey | undefined): asserts key is CryptoKey {
    this.assertGeneration(generation);
    if (!key || this.key !== key || !this.state) throw new Error('Unlock this workspace');
  }
  /** Re-read the encrypted database, including changes committed by another browser tab. */
  private readCurrent(): Promise<State> {
    const generation = this.generation,
      key = this.key;
    const run = this.tail.then(async () => {
      this.assertSession(generation, key);
      const saved = await this.db.vault.get('state');
      if (!saved)
        throw new Error(
          'The encrypted workspace is missing. Keep this browser’s data and recover from a backup.',
        );
      const state = await open<State>(key, saved.sealed);
      this.assertSession(generation, key);
      this.state = state;
      return state;
    });
    this.tail = run.catch(() => {});
    return run;
  }
  private change<T>(fn: (s: State, observedOps: Op[]) => T | Promise<T>): Promise<T> {
    const generation = this.generation,
      key = this.key;
    const run = this.tail.then(async () => {
      this.assertSession(generation, key);
      // Reading another tab’s committed bytes is necessary for safe storage, but is
      // not evidence that this tab’s user observed those edits. Keep that causal
      // boundary fixed across retries; earlier queued writes in this tab are included.
      const observedOps = this.state!.ops.slice();
      for (let attempt = 0; attempt < 20; attempt++) {
        const saved = await this.db.vault.get('state');
        if (!saved)
          throw new Error(
            'The encrypted workspace is missing. Keep this browser’s data and recover from a backup.',
          );
        // Crypto stays outside the transaction. A short atomic compare-and-swap prevents
        // stale tabs overwriting each other, including browsers without navigator.locks.
        const next = await open<State>(key, saved.sealed);
        this.assertSession(generation, key);
        const result = await fn(next, observedOps),
          sealed = await seal(key, next);
        this.assertSession(generation, key);
        let committed: boolean;
        try {
          committed = await this.db.transaction('rw', this.db.vault, async () => {
            const current = await this.db.vault.get('state');
            if (
              !current ||
              current.sealed.iv !== saved.sealed.iv ||
              current.sealed.data !== saved.sealed.data ||
              (current.revision ?? 0) !== (saved.revision ?? 0)
            )
              return false;
            this.assertSession(generation, key);
            await this.db.vault.put({ id: 'state', sealed, revision: (saved.revision ?? 0) + 1 });
            return true;
          });
        } catch (e: any) {
          if (e.name?.includes('Quota'))
            throw new Error(
              'Device storage is full. This change was not saved. Export a backup and free space.',
            );
          throw e;
        }
        if (!committed) continue;
        // A lock may happen just after the durable commit. Keep that successful save,
        // but never resurrect plaintext or an unlocked UI from an older session.
        if (this.generation === generation && this.key === key) this.state = next;
        return result;
      }
      throw new Error(
        'Another tab is changing this workspace. Wait a moment and retry. This change was not saved.',
      );
    });
    this.tail = run.catch(() => {});
    return run;
  }
  get view() {
    return materialize(this.state?.ops ?? []);
  }
  get pending() {
    const acked = new Set(this.state?.acked);
    return (
      this.state?.ops.filter(
        (o) =>
          o.deviceId !== 'seed' &&
          !acked.has(o.opId) &&
          !this.state?.quarantined.some((q) => q.opId === o.opId),
      ) ?? []
    );
  }
  private assertExplicitReview(observed: Op[], entityId: string, field: Field, kind: Op['kind']) {
    const conflicts = materialize(observed).conflicts.filter((conflict) => conflict.entityId === entityId);
    if (
      conflicts.some((conflict) =>
        conflict.field === 'deleted'
          ? field !== 'deleted' || kind !== 'resolve'
          : conflict.field === field && kind !== 'resolve',
      )
    )
      throw new Error("Review this record's conflicts before correcting its details.");
  }
  async write(
    entityId: string,
    field: Field,
    value: any,
    kind: Op['kind'] = 'set',
    type: Op['entityType'] = 'child',
  ) {
    return this.change(async (s, observedOps) => {
      this.assertExplicitReview(observedOps, entityId, field, kind);
      const op = await signOperation(
        {
          ...makeOp(s.ops, s.identity.deviceId, s.identity.actorId, entityId, field, value, kind, type),
          deps: frontier(observedOps),
        },
        s.identity.token,
      );
      s.ops = union(s.ops, [op]);
      return op;
    });
  }
  async writeMany(
    values: { entityId: string; field: Field; value: any; kind?: Op['kind']; type?: Op['entityType'] }[],
    observedAtStart?: readonly Op[],
  ) {
    return this.change(async (s, observedOps) => {
      // Long-lived forms retain the log they actually displayed. Background sync
      // must not make an unseen remote edit look like an observed predecessor.
      let causalLog = observedAtStart ? union([...observedAtStart]) : observedOps.slice();
      for (const v of values) {
        this.assertExplicitReview(causalLog, v.entityId, v.field, v.kind ?? 'set');
        const op = await signOperation(
          {
            ...makeOp(
              s.ops,
              s.identity.deviceId,
              s.identity.actorId,
              v.entityId,
              v.field,
              v.value,
              v.kind ?? 'set',
              v.type ?? 'child',
            ),
            deps: frontier(causalLog),
          },
          s.identity.token,
        );
        s.ops = union(s.ops, [op]);
        causalLog = union(causalLog, [op]);
      }
    });
  }
  async request(path: string, body?: unknown, signal?: AbortSignal) {
    if (!this.state) throw new Error('Workspace locked');
    const r = await fetch('/api/' + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.state.identity.token },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ?? timeoutSignal(15000),
    });
    const value = await r.json();
    if (!r.ok) {
      const detail = Array.isArray(value.details)
        ? value.details.map((item: any) => [item.path, item.message].filter(Boolean).join(': ')).join('; ')
        : '';
      throw new Error(detail || value.error || 'Hub request failed');
    }
    return value;
  }
  async saveEntryDrafts(values: Record<string, string | null>) {
    return this.change((state) => {
      state.entryDrafts ??= {};
      for (const [key, value] of Object.entries(values)) {
        if (value === null) delete state.entryDrafts[key];
        else {
          if (key.length > 300 || value.length > 1000) throw new Error('Draft exceeds the supported size.');
          state.entryDrafts[key] = value;
        }
      }
    });
  }
  async renewSession() {
    const generation = this.generation,
      key = this.key;
    const result = await this.request('session/renew', {});
    this.assertSession(generation, key);
    const expires = z.number().int().positive().parse(result.expires);
    await this.change((state) => {
      state.identity.expires = expires;
    });
    return expires;
  }
  async sync(
    options: { signal?: AbortSignal; afterChunk?: () => Promise<void>; dropAfterCommit?: boolean } = {},
  ): Promise<Report> {
    if (this.busy) throw new Error('A synchronization is already running');
    if (!this.state) throw new Error('Workspace locked');
    const generation = this.generation,
      key = this.key;
    this.busy = true;
    const start = performance.now();
    let sent = 0,
      received = 0,
      bytes = 0,
      chunks = 0;
    try {
      await this.readCurrent();
      if (this.state!.identity.expires < Date.now()) await this.renewSession();
      const pending = this.pending,
        pendingIds = new Set(pending.map((op) => op.opId));
      // Only order outgoing operations. An interrupted pull can legitimately
      // leave a local prefix whose remaining ancestry will arrive on resume.
      const push = batches(
        causalOrder(
          pending,
          this.state!.ops.filter((op) => !pendingIds.has(op.opId)).map((op) => op.opId),
        ),
      );
      if (!push.length) push.push([]);
      let more = true,
        index = 0;
      while (index < push.length || more) {
        this.assertSession(generation, key);
        const ops = push[index] ?? [],
          body = { protocol: 1, ops, cursor: this.state!.cursor, limit: 32 };
        const result = await this.request('sync', body, options.signal);
        this.assertSession(generation, key);
        bytes +=
          new TextEncoder().encode(JSON.stringify(body)).length +
          new TextEncoder().encode(JSON.stringify(result)).length;
        if (options.dropAfterCommit)
          throw new Error('Injected failure: hub committed, acknowledgement lost. Retry is safe.');
        const incoming = z.array(OpSchema).parse(result.ops);
        await this.change((s) => {
          s.ops = union(s.ops, incoming);
          s.acked = [...new Set([...s.acked, ...result.accepted, ...incoming.map((o) => o.opId)])];
          s.cursor = Math.max(s.cursor, result.cursor);
          s.quarantined = [
            ...new Map([...s.quarantined, ...result.quarantined].map((q) => [q.opId, q])).values(),
          ];
        });
        sent += ops.length;
        received += incoming.length;
        chunks++;
        index++;
        more = result.more;
        await options.afterChunk?.();
      }
      const report = {
        sent,
        received,
        bytes,
        duration: Math.round(performance.now() - start),
        checkpoint: Date.now(),
        chunks,
      };
      await this.change((s) => {
        s.lastSync = report.checkpoint;
        s.report = report;
      });
      return report;
    } finally {
      this.busy = false;
    }
  }
  async export(password: string) {
    const state = await this.readCurrent();
    try {
      causalOrder(state.ops);
    } catch (error) {
      if (error instanceof CausalHistoryError && error.code === 'MISSING_DEPENDENCY')
        throw new Error(
          'This device has an unfinished sync. Finish syncing in Sync Center, then export the backup again. Your local records are unchanged.',
        );
      throw new Error(
        'This workspace has an invalid change history. Keep this device and contact your hub administrator before exporting. Your local records are unchanged.',
      );
    }
    return exportBackup(
      {
        ops: state.ops,
        entryDrafts: state.entryDrafts ?? {},
        sourceDevice: state.identity.deviceId,
        createdAt: Date.now(),
      },
      password,
    );
  }
  async import(value: unknown, password: string) {
    const generation = this.generation,
      key = this.key;
    const result = await importBackup<any>(value, password);
    this.assertSession(generation, key);
    const parsed = z
      .object({
        ops: z.array(OpSchema),
        entryDrafts: z.record(z.string().max(300), z.string().max(1000)).optional(),
      })
      .safeParse(result);
    if (!parsed.success)
      throw new Error(
        'The backup contains unsupported or invalid records. Update Smriva on both devices and export the backup again. No records were imported.',
      );
    const { ops, entryDrafts: drafts = {} } = parsed.data;
    if (ops.some((o) => o.schoolId !== this.state?.identity.schoolId))
      throw new Error('Backup belongs to another school');
    await this.change((s) => {
      const combined = union(s.ops, ops),
        existingIds = new Set(s.ops.map((op) => op.opId)),
        before = ancestry(combined);
      try {
        causalOrder(combined);
      } catch (error) {
        if (error instanceof CausalHistoryError && error.code === 'MISSING_DEPENDENCY')
          throw new Error(
            'This backup is missing earlier changes. Finish syncing on the original device, export a new backup, then try again. No records were imported.',
          );
        throw error;
      }
      // Import is another entry point for immutable operations; a backup must
      // not bypass the same review rule used by local forms and the hub.
      for (const operation of ops)
        if (!existingIds.has(operation.opId))
          this.assertExplicitReview(
            combined.filter((parent) => before(parent, operation)),
            operation.entityId,
            operation.field,
            operation.kind,
          );
      if (
        Object.entries(drafts).some(
          ([key, value]) => s.entryDrafts?.[key] !== undefined && s.entryDrafts[key] !== value,
        )
      ) {
        const hasScores = [...Object.keys(drafts), ...Object.keys(s.entryDrafts ?? {})].some((key) =>
          key.startsWith('score|'),
        );
        throw new Error(
          hasScores
            ? 'This backup contains different unfinished scores. Complete or clear the local score drafts before importing. Nothing was changed.'
            : 'This backup contains different unfinished entries. Complete or clear the local drafts before importing. Nothing was changed.',
        );
      }
      s.entryDrafts = { ...s.entryDrafts, ...drafts };
      s.ops = combined;
    });
    return ops.length;
  }
  async destroy() {
    this.lock();
    await this.db.delete();
    this.db = new LocalDB(this.name);
  }
}
export async function enroll(actor: string, role: string, code = 'setusync-demo-2026'): Promise<Identity> {
  const r = await fetch('/api/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, role, code }),
    signal: timeoutSignal(10000),
  });
  if (!r.headers.get('content-type')?.includes('application/json'))
    throw new Error('The hub API is unavailable on this deployment. Refresh after the deployment finishes.');
  const result = await r.json();
  if (!r.ok) throw new Error(result.error);
  return result;
}
export let vault = new Vault(getActiveWorkspaceName());
/** Switch only the active pointer; every previous encrypted database remains intact. */
export async function activateWorkspace(next: Vault, label?: string) {
  if (next === vault) return;
  if (vault.busy) throw new Error('Wait for synchronization to finish before switching workspaces.');
  await vault.tail;
  if (vault.busy) throw new Error('Wait for synchronization to finish before switching workspaces.');
  rememberActiveWorkspace(next.name, label);
  vault.lock();
  vault.db.close();
  vault = next;
}
export function download(name: string, data: unknown) {
  const a = document.createElement('a'),
    url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
