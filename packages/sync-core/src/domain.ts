import { z } from 'zod';

const shortText = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => shortText(max).min(1, 'This field is required');

/** A calendar date, without JavaScript's automatic rollover of impossible days. */
export const CalendarDateSchema = z.string().superRefine((value, ctx) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    ctx.addIssue({ code: 'custom', message: 'Use a calendar date in YYYY-MM-DD format' });
    return;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    value.startsWith('0000-') ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    ctx.addIssue({ code: 'custom', message: 'Enter a real calendar date' });
});

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const PastDateSchema = CalendarDateSchema.refine((date) => date <= today(), {
  message: 'The date cannot be in the future',
});

export const EntityIdSchema = requiredText(200);
export const DoctorEntrySchema = z
  .object({
    patientName: shortText(80).min(2, 'Enter a patient name with at least two characters'),
    date: CalendarDateSchema,
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time'),
    purpose: requiredText(1000),
  })
  .strict();
export const PhoneSchema = shortText(32).refine(
  (value) => {
    if (value === '') return true;
    const digits = value.replace(/\D/g, '');
    return /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  },
  { message: 'Enter a phone number with 7–15 digits, or leave it empty' },
);

const childFields = {
  name: shortText(80).min(2, 'Name must contain at least 2 characters'),
  dob: PastDateSchema,
  guardian: shortText(80),
  phone: PhoneSchema,
  gender: shortText(40),
  class: requiredText(80),
  village: requiredText(100),
  consent: z.boolean(),
};

/** New records need an affirmative consent decision; withdrawal is an explicit update. */
export const ChildCreateSchema = z
  .object({
    ...childFields,
    guardian: childFields.guardian.default(''),
    phone: childFields.phone.optional(),
    gender: childFields.gender.optional(),
    consent: z.literal(true, { error: 'Explicit consent is required to create a record' }),
  })
  .strict();

export const ChildUpdateSchema = z
  .object(childFields)
  .partial()
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Provide at least one field to update',
  });

export const AttendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);
export const AttendanceMarkSchema = z
  .object({ childId: EntityIdSchema, status: AttendanceStatusSchema })
  .strict();

function uniqueChildren(rows: { childId: string }[], ctx: z.RefinementCtx, key: 'marks' | 'scores') {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (seen.has(row.childId))
      ctx.addIssue({
        code: 'custom',
        path: [key, index, 'childId'],
        message: 'A child can appear only once in a batch',
      });
    seen.add(row.childId);
  });
}

export const AttendanceBatchSchema = z
  .object({ date: PastDateSchema, marks: z.array(AttendanceMarkSchema).min(1).max(1000) })
  .strict()
  .superRefine((value, ctx) => uniqueChildren(value.marks, ctx, 'marks'));

export const ScoreSchema = z.number().min(0).max(100);
export const AssessmentScoreSchema = z.object({ childId: EntityIdSchema, score: ScoreSchema }).strict();
export const AssessmentBatchSchema = z
  .object({
    title: requiredText(60),
    attempt: z.number().int().min(1).max(100),
    scores: z.array(AssessmentScoreSchema).min(1).max(1000),
  })
  .strict()
  .superRefine((value, ctx) => uniqueChildren(value.scores, ctx, 'scores'));

export const VisitSchema = z.object({ date: PastDateSchema, note: requiredText(1000) }).strict();

export const WeightSchema = z.number().gt(0).max(200);
export const HeightSchema = z.number().min(20).max(220);
export const MuacSchema = z.number().min(3).max(60);
export const GrowthSchema = z
  .object({
    date: PastDateSchema,
    weight: WeightSchema,
    height: HeightSchema,
    muac: MuacSchema.nullable().optional(),
  })
  .strict();

export const VaccinationSchema = z
  .object({
    name: requiredText(100),
    date: PastDateSchema,
    batch: requiredText(80),
    site: requiredText(100),
  })
  .strict();

export const ResolutionSchema = z
  .object({
    value: z.json(),
    expectedOpIds: z.array(EntityIdSchema).min(2).max(1000),
    reason: requiredText(1000).optional(),
  })
  .strict()
  .refine((value) => new Set(value.expectedOpIds).size === value.expectedOpIds.length, {
    path: ['expectedOpIds'],
    message: 'Conflict operation IDs must be unique',
  });

// Coerce only decimal query strings, never booleans, empty strings or arrays.
const queryInteger = (min: number, max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value),
    z.number().int().min(min).max(max),
  );
export const PaginationSchema = z
  .object({
    limit: queryInteger(1, 200).default(50),
    offset: queryInteger(0, Number.MAX_SAFE_INTEGER).default(0),
    q: shortText(200).optional(),
  })
  .strict();

export type ChildCreate = z.infer<typeof ChildCreateSchema>;
export type ChildUpdate = z.infer<typeof ChildUpdateSchema>;
export type AttendanceBatch = z.infer<typeof AttendanceBatchSchema>;
export type AssessmentBatch = z.infer<typeof AssessmentBatchSchema>;
export type Visit = z.infer<typeof VisitSchema>;
export type Growth = z.infer<typeof GrowthSchema>;
export type Vaccination = z.infer<typeof VaccinationSchema>;
export type Resolution = z.infer<typeof ResolutionSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type DomainIssue = { path: (string | number)[]; message: string };

const logText = z.string().max(1000);
const logObject = z.object({}).catchall(z.json());
const logValues: Record<string, z.ZodType> = {
  doctorEntry: DoctorEntrySchema,
  name: logText,
  guardian: logText,
  phone: logText,
  gender: logText,
  class: logText,
  village: logText,
  allergy: logText,
  prescription: logText,
  doseStatus: logText,
  dob: CalendarDateSchema,
  consent: z.boolean(),
  deleted: z.boolean(),
  attendance: AttendanceStatusSchema,
  score: ScoreSchema,
  stock: z.number(),
  tags: logText,
  visits: logObject.extend({
    date: CalendarDateSchema.optional(),
    note: logText.optional(),
    worker: logText.optional(),
  }),
  doses: logObject.extend({
    date: CalendarDateSchema.optional(),
    name: logText.optional(),
    batch: logText.optional(),
    site: logText.optional(),
  }),
  growth: logObject.extend({
    date: CalendarDateSchema.optional(),
    weight: WeightSchema,
    height: HeightSchema,
    muac: MuacSchema.nullable().optional(),
  }),
  attempts: logObject.extend({
    date: CalendarDateSchema.optional(),
    score: ScoreSchema.optional(),
  }),
  progress: logObject.extend({ date: CalendarDateSchema.optional() }),
};

/**
 * Value checks for immutable operation replay. Append events remain extensible so
 * older logs and generic sync simulations can replay; manual entry uses the
 * richer business schemas above to require complete records.
 */
export function validateDomainOperation(operation: {
  field: string;
  value: unknown;
  hlc?: { physical: number };
}): DomainIssue[] {
  const schema = logValues[operation.field];
  if (!schema) return [];
  const parsed = schema.safeParse(operation.value);
  if (!parsed.success)
    return parsed.error.issues.map((issue) => ({
      path: ['value', ...issue.path.map((part) => (typeof part === 'number' ? part : String(part)))],
      message: issue.message,
    }));
  const date =
    operation.field === 'dob'
      ? (operation.value as string)
      : operation.value && typeof operation.value === 'object' && 'date' in operation.value
        ? (operation.value.date as unknown)
        : undefined;
  if (typeof date !== 'string') return [];
  let latestDate = today();
  if (operation.hlc) {
    // A signed operation must replay identically on a different device or after
    // its clock changes. UTC+14 is the latest civil date an author can observe;
    // the hub separately quarantines operation clocks over five minutes ahead.
    const physical = operation.hlc.physical;
    const latest = new Date(physical + 14 * 60 * 60 * 1000);
    if (
      !Number.isFinite(physical) ||
      physical < 0 ||
      !Number.isFinite(latest.getTime()) ||
      latest.getUTCFullYear() > 9999
    )
      return [{ path: ['hlc', 'physical'], message: 'Operation clock is outside the supported date range' }];
    latestDate = latest.toISOString().slice(0, 10);
  }
  if (date > latestDate)
    return [
      {
        path: operation.field === 'dob' ? ['value'] : ['value', 'date'],
        message: operation.hlc
          ? 'The date cannot be after the operation was recorded'
          : 'The date cannot be in the future',
      },
    ];
  return [];
}
