import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  makeOp,
  union,
  materialize,
  tick,
  OpSchema,
  batches,
  canonical,
  signOperation,
  digest,
  type Op,
} from '../packages/sync-core/src/index';
import { policies } from '../packages/sync-core/src/policy';
import {
  exportBackup,
  importBackup,
  createKeys,
  unlockKey,
  seal,
  open,
} from '../packages/sync-core/src/crypto';
const op = (device: string, field: any, value: any, log: Op[] = [], kind: any = 'set') =>
  makeOp(log, device, device, 'child', field, value, kind);
describe('causal domain policies', () => {
  it.each([
    'name',
    'dob',
    'gender',
    'guardian',
    'phone',
    'attendance',
    'score',
    'doseStatus',
    'allergy',
    'prescription',
    'consent',
    'village',
    'class',
  ] as const)('retains incompatible concurrent %s alternatives', (field) => {
    const [a, b] =
      field === 'score'
        ? [40, 90]
        : field === 'consent'
          ? [true, false]
          : field === 'attendance'
            ? ['present', 'absent']
            : field === 'dob'
              ? ['2018-01-01', '2019-01-01']
              : ['first', 'second'];
    const log = [op('a', field, a), op('b', field, b)],
      s = materialize(log);
    expect(s.conflicts).toHaveLength(1);
    expect(s.conflicts[0].versions.map((o) => o.value)).toEqual([a, b]);
    expect(s.entities.child[field]).toBeNull();
  });
  it('does not confuse a later HLC with a causal successor', () => {
    const a = op('a', 'dob', '2018-01-01'),
      b = {
        ...op('b', 'dob', '2019-01-01'),
        hlc: { physical: Date.now() + 100000, logical: 0, nodeId: 'b' },
      };
    expect(materialize([a, b]).conflicts).toHaveLength(1);
  });
  it('accepts sequential corrections and preserves originals', () => {
    const a = op('a', 'name', 'Old'),
      b = op('a', 'name', 'Corrected', [a]);
    const s = materialize([b, a]);
    expect(s.conflicts).toHaveLength(0);
    expect(s.entities.child.name).toBe('Corrected');
    expect(s.operations).toBe(2);
  });
  it('concurrent resolutions conflict again; a joint review converges', () => {
    const base = [op('a', 'dob', '2018-01-01'), op('b', 'dob', '2019-01-01')];
    const a = op('a', 'dob', '2018-01-01', base, 'resolve'),
      b = op('b', 'dob', '2019-01-01', base, 'resolve');
    const merged = union(base, [a, b]);
    expect(materialize(merged).conflicts[0].versions).toHaveLength(2);
    const final = op('a', 'dob', '2018-06-01', merged, 'resolve');
    expect(materialize([...merged, final]).conflicts).toHaveLength(0);
    expect(materialize([...merged, final]).operations).toBe(5);
  });
  it('preserves delete versus concurrent edit, then permits resurrection', () => {
    const a = op('a', 'deleted', true, [], 'delete'),
      b = op('b', 'name', 'Still here');
    expect(materialize([a, b]).conflicts[0].field).toBe('deleted');
    const c = op('a', 'deleted', false, [a, b], 'resolve');
    expect(materialize([a, b, c]).conflicts).toHaveLength(0);
    expect(materialize([a, b, c]).entities.child.name).toBe('Still here');
  });
  it('unions visits and separate attempt records without duplicate effects', () => {
    const a = op('a', 'visits', { note: 'A' }, [], 'add'),
      b = op('b', 'visits', { note: 'B' }, [], 'add');
    const s = materialize([a, b, a]);
    expect(s.entities.child.visits).toHaveLength(2);
    expect(s.operations).toBe(2);
    expect(s.conflicts).toHaveLength(0);
  });
  it('OR-set removes observed adds while concurrent adds survive', () => {
    const a = op('a', 'tags', 'support', [], 'add'),
      r = op('a', 'tags', 'support', [a], 'remove'),
      b = op('b', 'tags', 'support', [], 'add');
    expect(materialize([a, r]).entities.child.tags).toEqual([]);
    expect(materialize([a, r, b]).entities.child.tags).toEqual(['support']);
  });
  it('PN operation counter is idempotent', () => {
    const a = op('a', 'stock', 10, [], 'increment'),
      b = op('b', 'stock', -3, [], 'increment');
    expect(materialize([a, b, a]).entities.child.stock).toBe(7);
  });
  it('rejects impossible scores, malformed dates, and operation identity forgery', () => {
    expect(() => op('a', 'score', 101)).toThrow();
    expect(() => op('a', 'dob', 'banana')).toThrow();
    const a = op('a', 'name', 'A');
    expect(() => OpSchema.parse({ ...a, opId: 'forged' })).toThrow();
    expect(() => union([a], [{ ...a, value: 'tampered' }])).toThrow();
  });
  it('paginates by encoded bytes as well as operation count', () => {
    const ops = Array.from({ length: 12 }, (_, i) => op('d' + i, 'guardian', 'x'.repeat(800)));
    const chunks = batches(ops, 2500, 5);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.flat()).toEqual(ops);
    for (const chunk of chunks)
      expect(new TextEncoder().encode(JSON.stringify(chunk)).length).toBeLessThanOrEqual(2500);
  });
});
describe('algebraic convergence · 100 randomized runs each', () => {
  const arbitrary = fc
    .array(fc.tuple(fc.integer({ min: 0, max: 8 }), fc.integer({ min: -30, max: 30 })), { maxLength: 35 })
    .map((rows) =>
      rows.map(([device, n], i) =>
        makeOp([], `d-${device}-${i}`, 'Worker', 'child', 'stock', n, 'increment'),
      ),
    );
  it('union is commutative, associative, and idempotent', () =>
    fc.assert(
      fc.property(arbitrary, (ops) => {
        const a = ops.filter((_, i) => i % 3 === 0),
          b = ops.filter((_, i) => i % 3 === 1 || i % 5 === 0),
          c = ops.filter((_, i) => i % 3 === 2 || i % 7 === 0);
        expect(union(a, b)).toEqual(union(b, a));
        expect(union(union(a, b), c)).toEqual(union(a, union(b, c)));
        expect(union(a, a)).toEqual(union(a));
      }),
      { numRuns: 100 },
    ));
  it('arbitrary reorder and duplicate delivery preserve every operation and its meaning', () =>
    fc.assert(
      fc.property(arbitrary, fc.integer(), (ops, seed) => {
        const delivered = ops
          .slice()
          .sort((a, b) => ((a.counter + seed) % 7) - ((b.counter + seed) % 7))
          .reverse();
        expect(materialize([...delivered, ...ops])).toEqual(materialize(ops));
        expect(materialize(ops).operations).toBe(ops.length);
      }),
      { numRuns: 100 },
    ));
  it('HLC stays monotonic across clock resets, drift, and receives', () =>
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 2000000000 }), { minLength: 1, maxLength: 100 }),
        (times) => {
          let last = tick(undefined, 'a', 0);
          for (const now of times) {
            const next = tick(last, 'a', now, { physical: Math.floor(now / 2), logical: 5, nodeId: 'b' });
            expect(
              next.physical > last.physical ||
                (next.physical === last.physical && next.logical > last.logical),
            ).toBe(true);
            last = next;
          }
        },
      ),
      { numRuns: 100 },
    ));
  it('policy registry classifies every critical field for review', () => {
    for (const f of ['dob', 'allergy', 'prescription', 'score', 'deleted', 'attendance', 'gender'] as const)
      expect(policies[f][1]).toBe('NEEDS_REVIEW');
  });
});
describe('authenticated encryption & backup', () => {
  it('wraps a random data key; round trip survives reopening', async () => {
    const keys = await createKeys('123456'),
      encrypted = await seal(keys.key, { name: 'Synthetic child' }),
      key = await unlockKey('123456', keys.salt, keys.wrapped);
    expect(await open(key, encrypted)).toEqual({ name: 'Synthetic child' });
    await expect(unlockKey('999999', keys.salt, keys.wrapped)).rejects.toThrow();
  });
  it('uses unique AES-GCM nonces and rejects tampered ciphertext', async () => {
    const keys = await createKeys('123456'),
      a = await seal(keys.key, { x: 1 }),
      b = await seal(keys.key, { x: 1 });
    expect(a.iv).not.toBe(b.iv);
    await expect(open(keys.key, { ...a, data: a.data.slice(0, -4) + 'AAAA' })).rejects.toThrow();
  });
  it('restores an encrypted backup and rejects a wrong password', async () => {
    const original = [op('a', 'name', 'Demo')],
      backup = await exportBackup(original, 'long-passphrase');
    expect(await importBackup(backup, 'long-passphrase')).toEqual(original);
    await expect(importBackup(backup, 'wrong-password')).rejects.toThrow('Incorrect password');
  });
  it('digest is independent of replay/order and signatures bind the full operation', async () => {
    const a = op('a', 'name', 'Demo'),
      b = op('b', 'name', 'Other');
    expect(await digest([a, b, a])).toBe(await digest([b, a]));
    const signed = await signOperation(a, 'secret');
    expect(signed.signature).toHaveLength(64);
    expect((await signOperation({ ...a, value: 'tampered' }, 'secret')).signature).not.toBe(signed.signature);
  });
});
