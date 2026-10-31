import { describe, expect, it } from 'vitest';
import { batches, causalOrder, makeOp, materialize, union, type Op } from '../packages/sync-core/src/index';
import { type Field } from '../packages/sync-core/src/policy';

const edit = (
  device: string,
  field: Field,
  value: unknown,
  observed: Op[] = [],
  kind: Op['kind'] = 'set',
  entityId = 'audit-child',
  now = Date.parse('2026-10-31T12:00:00.000Z'),
) => makeOp(observed, device, device, entityId, field, value, kind, 'child', now);

describe('merge contracts for independent offline replicas', () => {
  it.each([
    ['name', 'Asha'],
    ['dob', '2018-01-01'],
    ['gender', 'female'],
    ['guardian', 'Kiran'],
    ['phone', '+91 98765 43210'],
    ['consent', false],
    ['attendance', 'present'],
    ['score', 0],
    ['doseStatus', 'Recorded'],
    ['allergy', 'Penicillin'],
    ['prescription', 'Reviewed by clinician'],
    ['village', 'Dhareri'],
    ['class', 'Class 2'],
  ] as const)('accepts equal concurrent %s values while preserving both operations', (field, value) => {
    const log = [edit('north', field, value), edit('south', field, value)];
    const merged = materialize(log);
    expect(merged.conflicts).toEqual([]);
    expect(merged.entities['audit-child'][field]).toEqual(value);
    expect(merged.operations).toBe(2);
    expect(union(log)).toEqual(log);
  });

  it('merges different fields on the same record without discarding either edit', () => {
    const baseline = edit('original', 'name', 'Asha');
    const name = edit('north', 'name', 'Asha Kaur', [baseline]);
    const guardian = edit('south', 'guardian', 'Kiran Kaur', [baseline]);
    const merged = materialize([guardian, baseline, name, guardian]);
    expect(merged.conflicts).toEqual([]);
    expect(merged.entities['audit-child']).toMatchObject({
      name: 'Asha Kaur',
      guardian: 'Kiran Kaur',
      hasConflict: false,
    });
    expect(merged.operations).toBe(3);
  });

  it('keeps a record conflict explicit while still merging independent useful data', () => {
    const allergyA = edit('north', 'allergy', 'Penicillin');
    const allergyB = edit('south', 'allergy', 'No known allergies');
    const visit = edit('clinic', 'visits', { date: '2020-01-01', note: 'Follow-up recorded' }, [], 'add');
    const merged = materialize([allergyB, visit, allergyA]);
    expect(merged.conflicts).toHaveLength(1);
    expect(merged.conflicts[0]).toMatchObject({ entityId: 'audit-child', field: 'allergy' });
    expect(merged.conflicts[0].reason.length).toBeGreaterThan(0);
    expect(merged.conflicts[0].versions.map((op) => op.opId).sort()).toEqual(
      [allergyA.opId, allergyB.opId].sort(),
    );
    expect(merged.entities['audit-child']).toMatchObject({ allergy: null, hasConflict: true });
    expect(merged.entities['audit-child'].visits).toHaveLength(1);
    expect(merged.operations).toBe(3);
  });

  it('does not let a clock 100 years ahead win a concurrent clinical value', () => {
    const early = edit('slow-clock', 'prescription', 'Plan A', [], 'set', 'audit-child', 0);
    const future = edit('fast-clock', 'prescription', 'Plan B', [], 'set', 'audit-child', 3_153_600_000_000);
    const merged = materialize([future, early]);
    expect(merged.conflicts).toHaveLength(1);
    expect(merged.conflicts[0].versions.map((op) => op.value).sort()).toEqual(['Plan A', 'Plan B']);
    expect(merged.entities['audit-child'].prescription).toBeNull();
  });

  it('accepts a causally observed correction even when the local clock rolls backward', () => {
    const first = edit('fast-clock', 'score', 50, [], 'set', 'audit-child', 3_153_600_000_000);
    const correction = edit('slow-clock', 'score', 60, [first], 'set', 'audit-child', 1);
    const merged = materialize([correction, first]);
    expect(merged.conflicts).toEqual([]);
    expect(merged.entities['audit-child'].score).toBe(60);
    expect(merged.operations).toBe(2);
  });

  it('cannot erase an unseen third alternative by resolving only the first two', () => {
    const a = edit('north', 'dob', '2018-01-01');
    const b = edit('south', 'dob', '2019-01-01');
    const offline = edit('unseen', 'dob', '2020-01-01');
    const review = edit('reviewer', 'dob', '2018-01-01', [a, b], 'resolve');
    const merged = materialize([a, b, review, offline]);
    expect(merged.conflicts).toHaveLength(1);
    expect(merged.conflicts[0].versions.map((op) => op.opId).sort()).toEqual(
      [review.opId, offline.opId].sort(),
    );
    expect(merged.entities['audit-child'].dob).toBeNull();
    expect(merged.operations).toBe(4);
    const jointReview = edit('joint-reviewer', 'dob', '2019-06-15', [a, b, review, offline], 'resolve');
    const resolved = materialize([a, b, review, offline, jointReview]);
    expect(resolved.conflicts).toEqual([]);
    expect(resolved.entities['audit-child'].dob).toBe('2019-06-15');
    expect(resolved.operations).toBe(5);
    expect(union([a, b, review, offline, jointReview])).toEqual(
      expect.arrayContaining([a, b, review, offline, jointReview]),
    );
  });

  it('accepts concurrent reviews of the same chosen value and keeps the original alternatives', () => {
    const a = edit('north', 'attendance', 'present');
    const b = edit('south', 'attendance', 'absent');
    const reviewedA = edit('reviewer-a', 'attendance', 'late', [a, b], 'resolve');
    const reviewedB = edit('reviewer-b', 'attendance', 'late', [a, b], 'resolve');
    const log = union([a, b], [reviewedA, reviewedB]);
    const merged = materialize(log);
    expect(merged.conflicts).toEqual([]);
    expect(merged.entities['audit-child'].attendance).toBe('late');
    expect(log).toHaveLength(4);
    expect(log).toEqual(expect.arrayContaining([a, b, reviewedA, reviewedB]));
  });

  it('presents disagreeing concurrent delete/edit reviews as a fresh explicit conflict', () => {
    const original = edit('original', 'name', 'Asha');
    const deletion = edit('north', 'deleted', true, [original], 'delete');
    const change = edit('south', 'name', 'Asha Kaur', [original]);
    const unresolved = materialize([original, deletion, change]);
    expect(unresolved.conflicts).toHaveLength(1);
    expect(unresolved.conflicts[0].field).toBe('deleted');
    expect(unresolved.conflicts[0].versions).toEqual(expect.arrayContaining([deletion, change]));
    const keepDeleted = edit('reviewer-a', 'deleted', true, [original, deletion, change], 'resolve');
    const keepRecord = edit('reviewer-b', 'deleted', false, [original, deletion, change], 'resolve');
    const all = [original, deletion, change, keepDeleted, keepRecord];
    const merged = materialize(all);
    expect(merged.conflicts).toHaveLength(1);
    expect(merged.conflicts[0].versions).toEqual(expect.arrayContaining([keepDeleted, keepRecord]));
    expect(merged.entities['audit-child'].deleted).toBeNull();
    expect(merged.operations).toBe(5);
    const finalReview = edit('reviewer-c', 'deleted', false, all, 'resolve');
    expect(materialize([...all, finalReview]).conflicts).toEqual([]);
    expect(materialize([...all, finalReview]).entities['audit-child'].name).toBe('Asha Kaur');
    expect(materialize([...all, finalReview]).operations).toBe(6);
  });

  it('does not treat a deletion of another record as a conflict with an independent edit', () => {
    const deletion = edit('north', 'deleted', true, [], 'delete', 'child-one');
    const change = edit('south', 'name', 'Asha', [], 'set', 'child-two');
    const merged = materialize([deletion, change]);
    expect(merged.conflicts).toEqual([]);
    expect(merged.entities['child-one'].deleted).toBe(true);
    expect(merged.entities['child-two'].name).toBe('Asha');
  });

  it('converges to the same conflicts and resolved state under every order and duplicate delivery', () => {
    const a = edit('north', 'score', 0);
    const b = edit('south', 'score', 90);
    const review = edit('reviewer', 'score', 0, [a, b], 'resolve');
    const late = edit('unseen', 'score', 75);
    const log = [a, b, review, late];
    const expected = materialize(log);
    const permutations = <T>(values: T[]): T[][] =>
      values.length
        ? values.flatMap((v, i) => permutations(values.filter((_, j) => i !== j)).map((p) => [v, ...p]))
        : [[]];
    for (const delivered of permutations(log)) {
      expect(materialize([...delivered, ...delivered, a])).toEqual(expected);
      expect(materialize([...delivered, ...delivered, a]).operations).toBe(4);
    }
    expect(expected.conflicts).toHaveLength(1);
    const finalReview = edit('joint-reviewer', 'score', 0, log, 'resolve');
    const resolved = materialize([...log, finalReview]);
    expect(resolved.conflicts).toEqual([]);
    expect(resolved.entities['audit-child'].score).toBe(0);
    expect(resolved.operations).toBe(5);
  });
});

describe('documented boundaries of automatic domain merging', () => {
  it('deduplicates replay of an event ID but preserves two independently entered identical events', () => {
    const value = { name: 'School health record', date: '2020-01-01', batch: 'B-1', site: 'Clinic' };
    const a = edit('north', 'doses', value, [], 'add');
    const b = edit('south', 'doses', value, [], 'add');
    const merged = materialize([a, b, a, b]);
    expect(merged.operations).toBe(2);
    expect(merged.entities['audit-child'].doses).toHaveLength(2);
    expect(merged.conflicts).toEqual([]);
  });

  it('retains separate record IDs even if their names and birth dates match', () => {
    const log = ['child-one', 'child-two'].flatMap((entityId, index) => {
      const name = edit(`worker-${index}`, 'name', 'Asha Kaur', [], 'set', entityId);
      return [name, edit(`worker-${index}`, 'dob', '2018-01-01', [name], 'set', entityId)];
    });
    const merged = materialize(log);
    expect(Object.keys(merged.entities)).toHaveLength(2);
    expect(merged.conflicts).toEqual([]);
    expect(merged.operations).toBe(4);
  });

  it('merges concurrent inventory deltas without enforcing a nonnegative balance', () => {
    const initial = edit('store', 'stock', 1, [], 'increment');
    const a = edit('north', 'stock', -1, [initial], 'increment');
    const b = edit('south', 'stock', -1, [initial], 'increment');
    const merged = materialize([initial, a, b, a]);
    expect(merged.operations).toBe(3);
    expect(merged.entities['audit-child'].stock).toBe(-1);
    expect(merged.conflicts).toEqual([]);
  });
});

describe('causal transfer ordering', () => {
  it('sends an 80-operation chain in parent order across 32-operation transfer chunks', () => {
    const history: Op[] = [];
    for (let i = 0; i < 80; i++) history.push(edit('writer', 'score', i, history));
    const lexicalOrder = union(history);
    expect(lexicalOrder.findIndex((operation) => operation.opId === 'writer:10')).toBeLessThan(
      lexicalOrder.findIndex((operation) => operation.opId === 'writer:2'),
    );
    const ordered = causalOrder(lexicalOrder.reverse());
    expect(ordered.map((operation) => operation.opId)).toEqual(history.map((operation) => operation.opId));
    const chunks = batches(ordered, 48_000, 32);
    expect(chunks.map((chunk) => chunk.length)).toEqual([32, 32, 16]);
    const received = new Set<string>();
    for (const chunk of chunks)
      for (const operation of chunk) {
        expect(operation.deps.every((parentId) => received.has(parentId))).toBe(true);
        received.add(operation.opId);
      }
    expect(received.size).toBe(80);
  });

  it('orders a branching history deterministically after arbitrary replay and delivery order', () => {
    const root = edit('root', 'name', 'Asha');
    const a = edit('north', 'guardian', 'Kiran', [root]);
    const b = edit('south', 'village', 'Dhareri', [root]);
    const joint = edit('reviewer', 'class', 'Class 2', [root, a, b]);
    const independent = edit('independent', 'name', 'Another child', [], 'set', 'another-child');
    const history = [root, a, b, joint, independent];
    const expected = causalOrder(history);
    expect(causalOrder([joint, b, independent, a, root, b, joint])).toEqual(expected);
    expect(causalOrder(history.slice().reverse())).toEqual(expected);
    expect(expected).toHaveLength(5);
    const position = new Map(expected.map((operation, index) => [operation.opId, index]));
    for (const operation of expected)
      for (const parentId of operation.deps)
        expect(position.get(parentId)).toBeLessThan(position.get(operation.opId)!);
  });

  it('accepts parents already acknowledged by the receiver without retransmitting them', () => {
    const root = edit('root', 'name', 'Asha');
    const update = edit('writer', 'name', 'Asha Kaur', [root]);
    const child = edit('writer', 'guardian', 'Kiran', [root, update]);
    expect(causalOrder([child, update], [root.opId])).toEqual([update, child]);
    expect(causalOrder([child], new Set([root.opId, update.opId]))).toEqual([child]);
  });

  it('does not mutate an input array or its dependency arrays', () => {
    const parent = edit('root', 'name', 'Asha');
    const child = edit('writer', 'name', 'Asha Kaur', [parent]);
    const input = [child, parent];
    const before = structuredClone(input);
    causalOrder(input);
    expect(input).toEqual(before);
  });

  it('counts repeated references to one parent once', () => {
    const parent = edit('root', 'name', 'Asha');
    const child = edit('writer', 'guardian', 'Kiran', [parent]);
    const repeated = { ...child, deps: [parent.opId, parent.opId] };
    expect(causalOrder([repeated, parent])).toEqual([parent, repeated]);
  });

  it('rejects an operation identity collision instead of dropping an alternative', () => {
    const operation = edit('writer', 'name', 'Asha');
    expect(() => causalOrder([operation, { ...operation, value: 'Different account' }])).toThrow(
      /Operation identity collision/,
    );
  });

  it('rejects missing parents instead of returning only the independent valid operations', () => {
    const parent = edit('root', 'name', 'Asha');
    const child = edit('writer', 'name', 'Asha Kaur', [parent]);
    const independent = edit('independent', 'name', 'Another child', [], 'set', 'another-child');
    expect(() => causalOrder([independent, child])).toThrow(`Missing operation dependency: ${parent.opId}`);
  });

  it('rejects self-dependencies even if the operation ID appears in known IDs', () => {
    const original = edit('writer', 'name', 'Asha');
    const invalid = { ...original, deps: [original.opId] };
    expect(() => causalOrder([invalid], [invalid.opId])).toThrow(/cannot depend on itself/);
  });

  it('rejects a dependency cycle even if a valid independent operation can be ordered', () => {
    const a = edit('north', 'name', 'Asha');
    const b = edit('south', 'name', 'Asha Kaur');
    const independent = edit('independent', 'name', 'Another child', [], 'set', 'another-child');
    expect(() =>
      causalOrder([independent, { ...a, deps: [b.opId] }, { ...b, deps: [a.opId] }], [a.opId, b.opId]),
    ).toThrow(/dependency cycle/);
  });

  it('accepts an empty transfer', () => {
    expect(causalOrder([])).toEqual([]);
    expect(causalOrder([], ['already-known:1'])).toEqual([]);
  });
});
