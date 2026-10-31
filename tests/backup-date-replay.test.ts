import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { HubStore } from '../apps/hub/src/store';
import { Vault } from '../apps/pwa/src/lib/vault';
import { makeOp, OpSchema, signOperation } from '../packages/sync-core/src/index';
import {
  AttendanceBatchSchema,
  ChildCreateSchema,
  ChildUpdateSchema,
  GrowthSchema,
  VaccinationSchema,
  VisitSchema,
  validateDomainOperation,
} from '../packages/sync-core/src/domain';
import type { Field } from '../packages/sync-core/src/policy';

const vaults: Vault[] = [];
const stores: HubStore[] = [];
const recordedAt = Date.parse('2026-10-31T20:00:00.000Z');

function hub() {
  const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
  stores.push(store);
  return store;
}

afterEach(async () => {
  for (const vault of vaults.splice(0)) await vault.destroy();
  for (const store of stores.splice(0)) store.close();
  vi.useRealTimers();
});

describe('deterministic calendar validation during operation replay', () => {
  it.each<[Field, unknown]>([
    ['dob', '2026-11-01'],
    ['visits', { date: '2026-11-01', note: 'Routine check' }],
    ['doses', { date: '2026-11-01', name: 'Routine vaccination' }],
    ['growth', { date: '2026-11-01', weight: 24, height: 120 }],
    ['attempts', { date: '2026-11-01', score: 0 }],
    ['progress', { date: '2026-11-01' }],
  ])('replays the same %s value after the receiving device clock moves backwards', (field, value) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));
    const operation = makeOp(
      [],
      'date-device',
      'Date author',
      'child',
      field,
      value,
      field === 'dob' ? 'set' : 'add',
      'child',
      recordedAt,
    );
    vi.setSystemTime(new Date('2026-10-30T12:00:00.000Z'));
    expect(OpSchema.parse(operation)).toEqual(operation);
  });

  it('allows the author calendar at UTC+14 but rejects dates beyond that operation day', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T00:00:00.000Z'));
    const physical = Date.parse('2026-10-31T10:00:00.000Z');
    expect(validateDomainOperation({ field: 'dob', value: '2026-11-01', hlc: { physical } })).toEqual([]);
    expect(validateDomainOperation({ field: 'dob', value: '2026-11-02', hlc: { physical } })).toEqual([
      { path: ['value'], message: 'The date cannot be after the operation was recorded' },
    ]);
    expect(
      validateDomainOperation({ field: 'visits', value: { date: '2026-11-02' }, hlc: { physical } })[0].path,
    ).toEqual(['value', 'date']);
    expect(validateDomainOperation({ field: 'dob', value: '2026-11-01' })).toEqual([
      { path: ['value'], message: 'The date cannot be in the future' },
    ]);
  });

  it.each([NaN, Infinity, Number.MAX_SAFE_INTEGER, 8_640_000_000_000_000, -1])(
    'returns a validation issue for unsupported operation timestamp %s without throwing',
    (physical) => {
      expect(validateDomainOperation({ field: 'dob', value: '2020-01-01', hlc: { physical } })).toEqual([
        { path: ['hlc', 'physical'], message: 'Operation clock is outside the supported date range' },
      ]);
    },
  );

  it('keeps future-date rejection for manual entry across child, attendance, and health forms', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T12:00:00.000Z'));
    const date = '2026-11-02';
    const examples: [
      (
        | typeof ChildCreateSchema
        | typeof ChildUpdateSchema
        | typeof AttendanceBatchSchema
        | typeof VisitSchema
        | typeof GrowthSchema
        | typeof VaccinationSchema
      ),
      unknown,
    ][] = [
      [
        ChildCreateSchema,
        { name: 'Example child', dob: date, village: 'Village', class: 'Class 1', consent: true },
      ],
      [ChildUpdateSchema, { dob: date }],
      [AttendanceBatchSchema, { date, marks: [{ childId: 'child', status: 'present' }] }],
      [VisitSchema, { date, note: 'Routine check' }],
      [GrowthSchema, { date, weight: 24, height: 120 }],
      [VaccinationSchema, { date, name: 'Routine vaccination', batch: 'B1', site: 'Clinic' }],
    ];
    for (const [schema, value] of examples) expect(schema.safeParse(value).success).toBe(false);
  });

  it('restores a dated signed backup on a replacement device whose clock is earlier', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));
    const store = hub();
    const source = new Vault('dated-source-' + randomUUID());
    vaults.push(source);
    await source.create('111111', store.enroll('Dated source', 'Reviewer'));
    await source.write('dated-child', 'dob', '2026-11-01');
    const backup = await source.export('dated-backup-passphrase');
    vi.setSystemTime(new Date('2026-10-31T12:00:00.000Z'));
    const target = new Vault('dated-target-' + randomUUID());
    vaults.push(target);
    await target.create('999999', store.enroll('Dated target', 'Reviewer'));
    expect(await target.import(backup, 'dated-backup-passphrase')).toBe(1);
    expect(target.view.entities['dated-child'].dob).toBe('2026-11-01');
    expect(target.pending[0].signature).toBe(source.pending[0].signature);
  });

  it('still quarantines signed raw-sync operations whose author clock is ahead of the hub', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T12:00:00.000Z'));
    const store = hub();
    const identity = store.enroll('Fast author clock', 'Reviewer');
    const operation = await signOperation(
      makeOp(
        [],
        identity.deviceId,
        identity.actorId,
        'dated-child',
        'dob',
        '2026-11-01',
        'set',
        'child',
        Date.parse('2026-11-01T12:00:00.000Z'),
      ),
      identity.token,
    );
    const result = store.ingest([operation]);
    expect(result.accepted).toHaveLength(0);
    expect(result.quarantined).toEqual([
      { opId: operation.opId, reason: 'Clock is over five minutes ahead' },
    ]);
    expect(store.all()).toHaveLength(0);
    const row = store.db.prepare('SELECT body FROM quarantine WHERE op_id=?').get(operation.opId) as {
      body: string;
    };
    expect(store.decrypt(row.body)).toEqual(operation);
  });

  it('rejects a raw signed future date beyond its normal author clock without committing records', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-31T12:00:00.000Z'));
    const store = hub();
    const identity = store.enroll('Normal author clock', 'Reviewer');
    const base = makeOp([], identity.deviceId, identity.actorId, 'dated-child', 'dob', '2020-01-01');
    const operation = await signOperation({ ...base, value: '2026-11-03' }, identity.token);
    expect(() => store.ingest([operation])).toThrow(/date cannot be after the operation/i);
    expect(store.all()).toHaveLength(0);
    expect(store.db.prepare('SELECT COUNT(*) AS n FROM quarantine').get()).toMatchObject({ n: 0 });
  });
});
