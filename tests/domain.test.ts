import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AssessmentBatchSchema,
  AttendanceBatchSchema,
  CalendarDateSchema,
  ChildCreateSchema,
  ChildUpdateSchema,
  GrowthSchema,
  PaginationSchema,
  ResolutionSchema,
  VaccinationSchema,
  VisitSchema,
  validateDomainOperation,
} from '../packages/sync-core/src/domain';
import { seedOperations } from '../packages/content/seed';
import { runSimulation } from '../packages/chaos/src/simulation';

const child = {
  name: 'Example Child',
  dob: '2019-04-15',
  class: 'Class 2',
  village: 'Dhareri',
  consent: true,
};

afterEach(() => vi.useRealTimers());

describe('manual child validation', () => {
  it('requires affirmative consent, trims entry, and supports a missing phone or guardian', () => {
    expect(ChildCreateSchema.parse({ ...child, name: ' Example Child ' })).toEqual({
      ...child,
      guardian: '',
    });
    for (const consent of [undefined, false, 'true', 1])
      expect(ChildCreateSchema.safeParse({ ...child, consent }).success).toBe(false);
    expect(ChildCreateSchema.safeParse({ ...child, phone: '+91 98765 43210' }).success).toBe(true);
    expect(ChildCreateSchema.safeParse({ ...child, phone: 'not a number' }).success).toBe(false);
  });

  it('rejects missing identifiers, unexpected fields, and impossible or future birth dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T12:00:00Z'));
    for (const dob of ['2026-02-30', '2019-02-29', '2026-13-01', '2026-11-01', '31/10/2026'])
      expect(ChildCreateSchema.safeParse({ ...child, dob }).success).toBe(false);
    expect(ChildCreateSchema.safeParse({ ...child, dob: '2024-02-29' }).success).toBe(true);
    expect(ChildCreateSchema.safeParse({ ...child, dob: '2026-10-31' }).success).toBe(true);
    for (const field of ['name', 'class', 'village'])
      expect(ChildCreateSchema.safeParse({ ...child, [field]: ' ' }).success).toBe(false);
    expect(ChildCreateSchema.safeParse({ ...child, nationalId: 'unrequested' }).success).toBe(false);
  });

  it('allows explicit consent withdrawal without accepting an empty or invalid update', () => {
    expect(ChildUpdateSchema.parse({ consent: false })).toEqual({ consent: false });
    expect(ChildUpdateSchema.parse({ guardian: '' })).toEqual({ guardian: '' });
    for (const value of [{}, { name: ' ' }, { dob: '2019-02-30' }, { consent: 'false' }, { id: 'x' }])
      expect(ChildUpdateSchema.safeParse(value).success).toBe(false);
  });

  it('validates calendar leap years instead of normalizing invalid dates', () => {
    for (const date of ['0000-01-01', '1900-02-29', '2024-04-31', '2024-2-01', '2024-01-01T00:00:00Z'])
      expect(CalendarDateSchema.safeParse(date).success).toBe(false);
    for (const date of ['2000-02-29', '2024-02-29', '2026-12-31'])
      expect(CalendarDateSchema.safeParse(date).success).toBe(true);
  });
});

describe('batch data entry', () => {
  it('requires complete unique attendance marks and a valid date', () => {
    const marks = [
      { childId: 'child-1', status: 'present' },
      { childId: 'child-2', status: 'excused' },
    ];
    expect(AttendanceBatchSchema.parse({ date: '2020-01-01', marks }).marks).toHaveLength(2);
    expect(AttendanceBatchSchema.safeParse({ date: '2020-01-01', marks: [] }).success).toBe(false);
    expect(AttendanceBatchSchema.safeParse({ date: '2020-02-30', marks }).success).toBe(false);
    expect(AttendanceBatchSchema.safeParse({ date: '2020-01-01', marks: [marks[0], marks[0]] }).success).toBe(
      false,
    );
    expect(
      AttendanceBatchSchema.safeParse({ date: '2020-01-01', marks: [{ childId: 'child-1', status: 'yes' }] })
        .success,
    ).toBe(false);
  });

  it('preserves zero assessment scores and rejects missing, nonnumeric, or out-of-range scores', () => {
    const assessment = { title: 'Fractions', attempt: 1, scores: [{ childId: 'child-1', score: 0 }] };
    expect(AssessmentBatchSchema.parse(assessment).scores[0].score).toBe(0);
    for (const score of [undefined, '', '0', -1, 101, Infinity, NaN])
      expect(
        AssessmentBatchSchema.safeParse({ ...assessment, scores: [{ childId: 'child-1', score }] }).success,
      ).toBe(false);
    for (const attempt of [0, 1.5, 101, '1'])
      expect(AssessmentBatchSchema.safeParse({ ...assessment, attempt }).success).toBe(false);
    expect(AssessmentBatchSchema.safeParse({ ...assessment, title: ' ' }).success).toBe(false);
    expect(
      AssessmentBatchSchema.safeParse({ ...assessment, scores: [...assessment.scores, ...assessment.scores] })
        .success,
    ).toBe(false);
  });
});

describe('health events and conflict review', () => {
  it('requires a visit date and note while the server supplies the worker identity', () => {
    expect(VisitSchema.parse({ date: '2020-01-01', note: ' Routine check ' }).note).toBe('Routine check');
    expect(VisitSchema.safeParse({ note: 'Incomplete' }).success).toBe(false);
    expect(VisitSchema.safeParse({ date: '2020-01-01', note: ' ' }).success).toBe(false);
    expect(VisitSchema.safeParse({ date: '2020-01-01', note: 'Check', worker: 'spoofed' }).success).toBe(
      false,
    );
  });

  it('stores finite growth measurements in kg/cm and distinguishes missing MUAC from zero', () => {
    const growth = { date: '2020-01-01', weight: 24.5, height: 120 };
    expect(GrowthSchema.parse(growth)).toEqual(growth);
    expect(GrowthSchema.safeParse({ ...growth, muac: null }).success).toBe(true);
    expect(GrowthSchema.safeParse({ ...growth, muac: 15.5 }).success).toBe(true);
    for (const entry of [
      { weight: 0 },
      { weight: 201 },
      { height: 19 },
      { height: 221 },
      { muac: 0 },
      { muac: 61 },
      { weight: '24' },
      { height: Infinity },
    ])
      expect(GrowthSchema.safeParse({ ...growth, ...entry }).success).toBe(false);
  });

  it('requires enough detail to identify a manually entered vaccination event', () => {
    const dose = { name: 'School health record', date: '2020-01-01', batch: 'B-1', site: 'Village clinic' };
    expect(VaccinationSchema.safeParse(dose).success).toBe(true);
    for (const key of ['name', 'date', 'batch', 'site'])
      expect(VaccinationSchema.safeParse({ ...dose, [key]: '' }).success).toBe(false);
  });

  it('requires distinct reviewed operation IDs and preserves a chosen false or zero value', () => {
    for (const value of [false, 0, '2018-01-01'])
      expect(ResolutionSchema.parse({ value, expectedOpIds: ['a:1', 'b:1'] }).value).toEqual(value);
    for (const expectedOpIds of [[], ['a:1'], ['a:1', 'a:1']])
      expect(ResolutionSchema.safeParse({ value: 0, expectedOpIds }).success).toBe(false);
    expect(ResolutionSchema.safeParse({ expectedOpIds: ['a:1', 'b:1'] }).success).toBe(false);
  });
});

describe('query and immutable log validation', () => {
  it('bounds pagination and safely parses decimal query strings', () => {
    expect(PaginationSchema.parse({})).toEqual({ limit: 50, offset: 0 });
    expect(PaginationSchema.parse({ limit: '20', offset: '0', q: ' Example ' })).toEqual({
      limit: 20,
      offset: 0,
      q: 'Example',
    });
    for (const limit of ['', '1e2', '1.5', '0', '201', true, ['20']])
      expect(PaginationSchema.safeParse({ limit }).success).toBe(false);
    for (const offset of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, 'no'])
      expect(PaginationSchema.safeParse({ offset }).success).toBe(false);
  });

  it('rejects unsafe operation field values with paths usable by OpSchema superRefine', () => {
    for (const operation of [
      { field: 'dob', value: '2024-02-30' },
      { field: 'score', value: '0' },
      { field: 'score', value: Infinity },
      { field: 'consent', value: 'true' },
      { field: 'attendance', value: 'yes' },
      { field: 'visits', value: { date: '2024-02-30' } },
      { field: 'growth', value: { weight: 24, height: 120, muac: 0 } },
      { field: 'doses', value: { date: 'not a date' } },
    ]) {
      const issues = validateDomainOperation(operation);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every((issue) => issue.path[0] === 'value')).toBe(true);
    }
    expect(validateDomainOperation({ field: 'score', value: 0 })).toEqual([]);
  });

  it('keeps legacy seed logs and minimal generic append events replayable', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T12:00:00Z'));
    for (const operation of seedOperations()) expect(validateDomainOperation(operation)).toEqual([]);
    for (const value of [{ note: 'A' }, { n: 1 }, { event: 1, date: '2026-10-31' }])
      expect(validateDomainOperation({ field: 'visits', value })).toEqual([]);
    const simulation = runSimulation(42, 3, 30, 0.6);
    for (const operation of simulation.replicas.flat())
      expect(validateDomainOperation(operation)).toEqual([]);
    expect(VisitSchema.safeParse({ note: 'A' }).success).toBe(false);
  });
});
