import { mkdirSync, writeFileSync } from 'node:fs';
import { runSimulation } from './simulation';
const results = [3, 8, 16].flatMap((devices) =>
  [42, 127, 2026].map((seed) => {
    const { replicas, ...r } = runSimulation(seed, devices, 240, 0.6);
    if (!r.converged || r.loss || r.duplicateEffects)
      throw new Error('Invariant failed: ' + JSON.stringify(r));
    return r;
  }),
);
console.table(
  results.map((r) => ({
    seed: r.seed,
    devices: r.devices,
    created: r.created,
    preserved: r.preserved,
    lost: r.loss,
    conflicts: r.conflicts,
    duplicates: r.duplicateEffects,
    'CPU ms': r.duration,
    'payload B': r.bytes,
    'LWW dropped events': r.baselineDiscarded,
  })),
);
mkdirSync('docs', { recursive: true });
mkdirSync('apps/pwa/public', { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  scope:
    'Deterministic in-process simulation; not network latency or packet-level benchmark. Forced final reconnect after 12 lossy rounds.',
  results,
};
writeFileSync('docs/benchmark-results.json', JSON.stringify(report, null, 2));
writeFileSync('apps/pwa/public/benchmark-results.json', JSON.stringify(report, null, 2));
console.log(
  'Zero loss in these tested runs. All replicas converged. Results saved to docs/benchmark-results.json',
);
