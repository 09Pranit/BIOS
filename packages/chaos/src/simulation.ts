import { makeOp, union, materialize, canonical, type Op } from '../../sync-core/src/index';
export type ChaosResult = {
  seed: number;
  devices: number;
  created: number;
  preserved: number;
  conflicts: number;
  loss: number;
  duplicateEffects: number;
  converged: boolean;
  bytes: number;
  fullStateBytes: number;
  duration: number;
  dropped: number;
  deliveries: number;
  baselineDiscarded: number;
  replicas: Op[][];
};
export function runSimulation(seed = 42, devices = 8, operations = 240, loss = 0.6): ChaosResult {
  let state = seed >>> 0;
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const start = performance.now(),
    replicas: Op[][] = Array.from({ length: devices }, () => []);
  let hub: Op[] = [],
    bytes = 0,
    dropped = 0,
    deliveries = 0;
  for (let i = 0; i < operations; i++) {
    const d = i % devices,
      id = 'child-' + (i % 20),
      field =
        i % 5 === 0
          ? 'dob'
          : i % 5 === 1
            ? 'tags'
            : i % 5 === 2
              ? 'visits'
              : i % 5 === 3
                ? 'growth'
                : 'score';
    const value =
      field === 'dob'
        ? `2018-${String((d % 12) + 1).padStart(2, '0')}-01`
        : field === 'tags'
          ? 'support-' + (i % 3)
          : field === 'score'
            ? i % 101
            : field === 'growth'
              ? { event: i, date: '2026-10-31', weight: 18 + (i % 30), height: 110 + (i % 50) }
              : { event: i, date: '2026-10-31' };
    replicas[d].push(
      makeOp(
        replicas[d],
        `chaos-${d}`,
        'Worker ' + d,
        id,
        field,
        value,
        ['tags', 'visits', 'growth'].includes(field) ? 'add' : 'set',
        'child',
        1793400000000 + Math.floor(random() * 10000),
      ),
    );
  }
  const all = union(...replicas);
  // Partitioned rounds: dropped packets are retryable, with duplicate and reordered delivery.
  for (let round = 0; round < 12; round++)
    for (let d = 0; d < devices; d++) {
      if (random() < loss) {
        dropped++;
        continue;
      }
      const known = new Set(hub.map((o) => o.opId)),
        delta = replicas[d].filter((o) => !known.has(o.opId));
      bytes += new TextEncoder().encode(JSON.stringify(delta)).length;
      deliveries++;
      hub = union(hub, random() < 0.5 ? delta.slice().reverse() : delta);
      if (random() < 0.4) hub = union(hub, delta);
      const local = new Set(replicas[d].map((o) => o.opId)),
        pull = hub.filter((o) => !local.has(o.opId));
      bytes += new TextEncoder().encode(JSON.stringify(pull)).length;
      replicas[d] = union(replicas[d], pull);
    }
  // Eventual connectivity is an explicit assumption, not a claim to heal permanent partitions.
  for (let d = 0; d < devices; d++) {
    const known = new Set(hub.map((o) => o.opId)),
      delta = replicas[d].filter((o) => !known.has(o.opId));
    bytes += new TextEncoder().encode(JSON.stringify(delta)).length;
    hub = union(hub, delta);
  }
  for (let d = 0; d < devices; d++) {
    const known = new Set(replicas[d].map((o) => o.opId)),
      delta = hub.filter((o) => !known.has(o.opId));
    bytes += new TextEncoder().encode(JSON.stringify(delta)).length;
    replicas[d] = union(replicas[d], delta);
  }
  const result = materialize(hub),
    naive = new Map<string, Op>();
  for (const o of all) {
    const k = o.entityId + '|' + o.field,
      p = naive.get(k);
    if (!p || o.hlc.physical > p.hlc.physical) naive.set(k, o);
  }
  const required = all.filter((o) => ['visits', 'growth', 'tags'].includes(o.field)),
    preservedByNaive = required.filter((o) => naive.get(o.entityId + '|' + o.field)?.opId === o.opId).length;
  return {
    seed,
    devices,
    created: all.length,
    preserved: hub.length,
    loss: all.filter((o) => !hub.some((h) => h.opId === o.opId)).length,
    conflicts: result.conflicts.length,
    duplicateEffects: materialize(union(hub, hub)).operations - result.operations,
    converged: replicas.every((r) => canonical(materialize(r)) === canonical(result)),
    bytes,
    fullStateBytes: new TextEncoder().encode(JSON.stringify(all)).length * devices * 12,
    duration: Math.round((performance.now() - start) * 100) / 100,
    dropped,
    deliveries,
    baselineDiscarded: required.length - preservedByNaive,
    replicas,
  };
}
