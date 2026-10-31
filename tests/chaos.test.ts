import { it, expect } from 'vitest';
import { runSimulation } from '../packages/chaos/src/simulation';
it('converges across 3/8/16 devices, duplicate replay, 60% packet loss and reordered deltas', () => {
  for (const n of [3, 8, 16])
    for (const seed of [42, 127, 2026]) {
      const r = runSimulation(seed, n, 120, 0.6);
      expect(r.created).toBe(120);
      expect(r.preserved).toBe(120);
      expect(r.loss).toBe(0);
      expect(r.duplicateEffects).toBe(0);
      expect(r.converged).toBe(true);
      expect(r.baselineDiscarded).toBeGreaterThan(0);
    }
});
