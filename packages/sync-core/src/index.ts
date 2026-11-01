import { z } from 'zod';
import { policies, reasonFor, type Field } from './policy.js';
import { validateDomainOperation } from './domain.js';
export { policies, reasonFor } from './policy.js';
export const SCHOOL = 'kuka-demo-school';
export const HlcSchema = z.object({
  physical: z.number().int().nonnegative(),
  logical: z.number().int().nonnegative(),
  nodeId: z.string().min(1),
});
export type HLC = z.infer<typeof HlcSchema>;
export const OpSchema = z
  .object({
    opId: z.string().min(1).max(200),
    actorId: z.string().min(1).max(100),
    deviceId: z.string().min(1).max(100),
    schoolId: z.string().min(1),
    entityId: z.string().min(1).max(200),
    entityType: z.enum(['child', 'attendance', 'assessment', 'lesson', 'stock', 'doctor-entry']),
    field: z.enum(Object.keys(policies) as [Field, ...Field[]]),
    kind: z.enum(['set', 'add', 'remove', 'increment', 'resolve', 'delete', 'resurrect']),
    value: z.json(),
    deps: z.array(z.string()).max(10000),
    hlc: HlcSchema,
    schemaVersion: z.literal(1),
    counter: z.number().int().positive(),
    signature: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
  })
  .superRefine((o, ctx) => {
    if ((o.field === 'doctorEntry') !== (o.entityType === 'doctor-entry'))
      ctx.addIssue({ code: 'custom', message: 'Doctor entries require their own record type' });
    for (const issue of validateDomainOperation(o)) ctx.addIssue({ code: 'custom', ...issue });
    if (o.opId !== `${o.deviceId}:${o.counter}`)
      ctx.addIssue({ code: 'custom', message: 'Operation ID must bind device and counter' });
    if (o.hlc.nodeId !== o.deviceId) ctx.addIssue({ code: 'custom', message: 'Clock identity mismatch' });
    const strategy = policies[o.field][0];
    if (strategy === 'register' && !['set', 'resolve'].includes(o.kind))
      ctx.addIssue({ code: 'custom', message: 'Invalid register operation' });
    if (strategy === 'grow-set' && o.kind !== 'add')
      ctx.addIssue({ code: 'custom', message: 'Append-only field' });
    if (strategy === 'or-set' && !['add', 'remove'].includes(o.kind))
      ctx.addIssue({ code: 'custom', message: 'Invalid set operation' });
    if (
      strategy === 'pn-counter' &&
      (o.kind !== 'increment' || typeof o.value !== 'number' || !Number.isFinite(o.value))
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid counter delta' });
    if (strategy === 'tombstone' && !['delete', 'resurrect', 'resolve'].includes(o.kind))
      ctx.addIssue({ code: 'custom', message: 'Invalid tombstone' });
    if (o.field === 'attendance' && !['present', 'absent', 'late', 'excused'].includes(String(o.value)))
      ctx.addIssue({ code: 'custom', message: 'Invalid attendance status' });
    if (o.field === 'score' && (typeof o.value !== 'number' || o.value < 0 || o.value > 100))
      ctx.addIssue({ code: 'custom', message: 'Score must be between 0 and 100' });
    if (
      [
        'name',
        'guardian',
        'village',
        'class',
        'phone',
        'gender',
        'allergy',
        'prescription',
        'doseStatus',
      ].includes(o.field) &&
      (typeof o.value !== 'string' || o.value.length > 1000)
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid text field' });
    if (
      o.field === 'dob' &&
      (typeof o.value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(o.value) ||
        !Number.isFinite(Date.parse(o.value)))
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid date of birth' });
    if (o.field === 'consent' && typeof o.value !== 'boolean')
      ctx.addIssue({ code: 'custom', message: 'Consent must be an explicit boolean' });
    if (o.field === 'deleted' && typeof o.value !== 'boolean')
      ctx.addIssue({ code: 'custom', message: 'Invalid deletion state' });
    if (o.field === 'growth') {
      const v = o.value as any;
      if (
        !v ||
        typeof v.weight !== 'number' ||
        v.weight <= 0 ||
        v.weight > 200 ||
        typeof v.height !== 'number' ||
        v.height < 20 ||
        v.height > 220
      )
        ctx.addIssue({ code: 'custom', message: 'Growth measurement outside accepted storage range' });
    }
  });
export type Op = z.infer<typeof OpSchema>;
export const compareOpsByClock = (a: Op, b: Op) =>
  a.hlc.physical - b.hlc.physical || a.hlc.logical - b.hlc.logical || a.opId.localeCompare(b.opId);
export const SyncSchema = z.object({
  protocol: z.literal(1),
  ops: z.array(OpSchema).max(64),
  cursor: z.number().int().nonnegative(),
  limit: z.number().int().min(1).max(64).default(32),
});
export function tick(previous: HLC | undefined, nodeId: string, now = Date.now(), remote?: HLC): HLC {
  const p = Math.max(now, previous?.physical ?? 0, remote?.physical ?? 0);
  const l =
    p === previous?.physical && p === remote?.physical
      ? Math.max(previous.logical, remote.logical) + 1
      : p === previous?.physical
        ? previous.logical + 1
        : p === remote?.physical
          ? remote.logical + 1
          : 0;
  return { physical: p, logical: l, nodeId };
}
export function union(...logs: Op[][]): Op[] {
  const map = new Map<string, Op>();
  for (const op of logs.flat()) {
    const existing = map.get(op.opId);
    if (existing && canonical(existing) !== canonical(op))
      throw new Error(`Operation identity collision: ${op.opId}`);
    map.set(op.opId, op);
  }
  return [...map.values()].sort((a, b) => a.opId.localeCompare(b.opId));
}
export class CausalHistoryError extends Error {
  constructor(
    readonly code: 'MISSING_DEPENDENCY' | 'INVALID_CAUSAL_HISTORY',
    message: string,
  ) {
    super(message);
    this.name = 'CausalHistoryError';
  }
}
/**
 * Order a complete transfer before splitting it into resumable batches. Parents
 * outside the transfer must already be known by the receiver. Invalid histories
 * fail as a whole rather than silently omitting operations from the transfer.
 */
export function causalOrder(input: Op[], knownIds: Iterable<string> = []): Op[] {
  const operations = union(input),
    byId = new Map(operations.map((operation) => [operation.opId, operation])),
    known = new Set(knownIds),
    remainingParents = new Map<string, number>(),
    children = new Map<string, Op[]>();
  for (const operation of operations) {
    let count = 0;
    for (const parentId of new Set(operation.deps)) {
      if (parentId === operation.opId)
        throw new CausalHistoryError(
          'INVALID_CAUSAL_HISTORY',
          `Operation cannot depend on itself: ${operation.opId}`,
        );
      if (byId.has(parentId)) {
        count++;
        const dependents = children.get(parentId) ?? [];
        dependents.push(operation);
        children.set(parentId, dependents);
      } else if (!known.has(parentId))
        throw new CausalHistoryError(
          'MISSING_DEPENDENCY',
          `Missing operation dependency: ${parentId} (required by ${operation.opId})`,
        );
    }
    remainingParents.set(operation.opId, count);
  }
  // union sorts IDs, so both the initial queue and each parent's dependents have
  // a deterministic order independent of delivery order.
  const ready = operations.filter((operation) => remainingParents.get(operation.opId) === 0),
    ordered: Op[] = [];
  for (let index = 0; index < ready.length; index++) {
    const operation = ready[index];
    ordered.push(operation);
    for (const child of children.get(operation.opId) ?? []) {
      const count = remainingParents.get(child.opId)! - 1;
      remainingParents.set(child.opId, count);
      if (count === 0) ready.push(child);
    }
  }
  if (ordered.length !== operations.length)
    throw new CausalHistoryError(
      'INVALID_CAUSAL_HISTORY',
      'Operation dependency cycle: transfer requires an acyclic history',
    );
  return ordered;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
export function ancestry(log: Op[]) {
  const map = new Map(log.map((o) => [o.opId, o]));
  return (a: Op, b: Op) => {
    const seen = new Set<string>(),
      todo = [...b.deps];
    while (todo.length) {
      const id = todo.pop()!;
      if (id === a.opId) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      todo.push(...(map.get(id)?.deps ?? []));
    }
    return false;
  };
}
export type Conflict = { id: string; entityId: string; field: string; reason: string; versions: Op[] };
export type Materialized = {
  entities: Record<string, Record<string, any>>;
  conflicts: Conflict[];
  operations: number;
};
export function materialize(input: Op[]): Materialized {
  const log = union(input),
    before = ancestry(log),
    groups = new Map<string, Op[]>(),
    entities: Materialized['entities'] = {},
    conflicts: Conflict[] = [];
  for (const op of log) {
    const key = op.entityId + '|' + op.field;
    groups.set(key, [...(groups.get(key) ?? []), op]);
    entities[op.entityId] ??= { id: op.entityId, type: op.entityType };
  }
  for (const [key, ops] of groups) {
    const { entityId, field } = ops[0],
      strategy = policies[field][0];
    const frontier = ops.filter((a) => !ops.some((b) => a.opId !== b.opId && before(a, b)));
    let value: any;
    if (strategy === 'grow-set')
      value = ops.map((o) => ({
        opId: o.opId,
        ...(typeof o.value === 'object' && o.value !== null && !Array.isArray(o.value)
          ? o.value
          : { value: o.value }),
      }));
    else if (strategy === 'or-set')
      value = [
        ...new Set(
          ops
            .filter(
              (o) =>
                o.kind === 'add' &&
                !ops.some(
                  (r) => r.kind === 'remove' && canonical(r.value) === canonical(o.value) && before(o, r),
                ),
            )
            .map((o) => String(o.value)),
        ),
      ].sort();
    else if (strategy === 'pn-counter') value = ops.reduce((sum, o) => sum + Number(o.value), 0);
    else {
      let alternatives = frontier;
      if (field === 'attendance' && frontier.length === 1 && frontier[0].kind === 'set') {
        const boundary = ops
            .filter(
              (op) =>
                op.kind === 'resolve' &&
                frontier.every((current) => op.opId === current.opId || before(op, current)),
            )
            .sort(compareOpsByClock)
            .at(-1),
          latestByDevice = new Map<string, Op>();
        for (const op of boundary
          ? [boundary, ...ops.filter((candidate) => before(boundary, candidate))]
          : ops) {
          const previous = latestByDevice.get(op.deviceId);
          if (!previous || op.counter > previous.counter) latestByDevice.set(op.deviceId, op);
        }
        const deviceAlternatives = [...latestByDevice.values()];
        if (new Set(deviceAlternatives.map((op) => canonical(op.value))).size > 1)
          alternatives = deviceAlternatives;
      }
      const values = [...new Set(alternatives.map((o) => canonical(o.value)))];
      if (values.length > 1) {
        conflicts.push({ id: key, entityId, field, reason: reasonFor(field), versions: alternatives });
        value = null;
      } else value = frontier[0]?.value;
    }
    entities[entityId][field] = value;
  }
  for (const [id, entity] of Object.entries(entities)) {
    const deletes = log.filter((o) => o.entityId === id && o.field === 'deleted');
    const frontier = deletes.filter((a) => !deletes.some((b) => before(a, b)));
    const active = frontier.filter((o) => o.value === true);
    const competitors = log.filter(
      (o) => o.entityId === id && o.field !== 'deleted' && active.some((d) => !before(o, d) && !before(d, o)),
    );
    if (active.length && competitors.length && !conflicts.some((c) => c.id === id + '|deleted'))
      conflicts.push({
        id: id + '|deleted',
        entityId: id,
        field: 'deleted',
        reason: reasonFor('deleted'),
        versions: union(active, competitors),
      });
    entity.hasConflict = conflicts.some((c) => c.entityId === id);
  }
  conflicts.sort((a, b) => a.id.localeCompare(b.id));
  return { entities, conflicts, operations: log.length };
}
export function frontier(log: Op[]): string[] {
  const referenced = new Set(log.flatMap((o) => o.deps));
  return log
    .filter((o) => !referenced.has(o.opId))
    .map((o) => o.opId)
    .sort();
}
export function makeOp(
  log: Op[],
  deviceId: string,
  actorId: string,
  entityId: string,
  field: Field,
  value: any,
  kind: Op['kind'] = 'set',
  entityType: Op['entityType'] = 'child',
  now = Date.now(),
): Op {
  const mine = log.filter((o) => o.deviceId === deviceId),
    counter = Math.max(0, ...mine.map((o) => o.counter)) + 1;
  const last = log.reduce<HLC | undefined>(
    (p, o) =>
      !p || o.hlc.physical > p.physical || (o.hlc.physical === p.physical && o.hlc.logical > p.logical)
        ? o.hlc
        : p,
    undefined,
  );
  return OpSchema.parse({
    opId: `${deviceId}:${counter}`,
    deviceId,
    actorId,
    schoolId: SCHOOL,
    entityId,
    entityType,
    field,
    value,
    kind,
    counter,
    deps: frontier(log),
    hlc: tick(last, deviceId, now),
    schemaVersion: 1,
  });
}
export function batches(ops: Op[], maxBytes = 48000, maxCount = 32): Op[][] {
  const chunks: Op[][] = [];
  let chunk: Op[] = [],
    size = 2;
  for (const op of ops) {
    const n = new TextEncoder().encode(JSON.stringify(op)).length + 1;
    if (n > maxBytes) throw new Error('Operation exceeds transfer limit');
    if (chunk.length && (size + n > maxBytes || chunk.length >= maxCount)) {
      chunks.push(chunk);
      chunk = [];
      size = 2;
    }
    chunk.push(op);
    size += n;
  }
  if (chunk.length) chunks.push(chunk);
  return chunks;
}
export async function digest(ops: Op[]) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(union(ops))));
  return [...new Uint8Array(bytes)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export function signingBody(op: Op) {
  const { signature, ...body } = op;
  return canonical(body);
}
export async function signOperation(op: Op, secret: string): Promise<Op> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingBody(op)));
  return {
    ...op,
    signature: [...new Uint8Array(signature)].map((n) => n.toString(16).padStart(2, '0')).join(''),
  };
}
