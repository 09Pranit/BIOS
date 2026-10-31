import type { Express, Request } from 'express';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { canonical, type Op } from '../../../packages/sync-core/src/index.js';
import type { Field } from '../../../packages/sync-core/src/policy.js';
import {
  ChildCreateSchema,
  ChildUpdateSchema,
  AttendanceBatchSchema,
  AssessmentBatchSchema,
  VisitSchema,
  GrowthSchema,
  VaccinationSchema,
  ResolutionSchema,
  PaginationSchema,
  CalendarDateSchema,
} from '../../../packages/sync-core/src/domain.js';
import { HubStore, HttpError } from './store.js';
import { lessons } from '../../../packages/content/lessons.js';

type AuthRequest = Request & { device: any };
type Change = {
  entityId: string;
  entityType: Op['entityType'];
  field: Field;
  value: Op['value'];
  kind?: Op['kind'];
};
type Expected = { entityId: string; version: string };
const versionMap = z.record(z.string(), z.string().min(1));
const roleSchema = z.enum(['Teacher', 'Health Worker', 'Reviewer', 'Hub Admin']);
const reviewers = ['Reviewer', 'Hub Admin'];
const can = (device: any, roles: string[]) => {
  if (!roles.includes(device.role))
    throw new HttpError(403, 'ROLE_REQUIRED', 'Your role cannot perform this action.');
};
const hash = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
const keyFor = (req: Request) => {
  const key = req.get('Idempotency-Key');
  if (!key || !/^[A-Za-z0-9_.:-]{1,128}$/.test(key))
    throw new HttpError(
      400,
      'IDEMPOTENCY_KEY_REQUIRED',
      'Send a unique Idempotency-Key header for this write; reuse it only when retrying the same request.',
    );
  return key;
};
const pagination = (req: Request) =>
  PaginationSchema.parse({ limit: req.query.limit, offset: req.query.offset, q: req.query.q });
const entityType = z.enum(['child', 'attendance', 'assessment', 'lesson', 'stock']);
const fingerprintFor = (req: Request) =>
  hash({ method: req.method, path: req.originalUrl.split('?')[0], body: req.body });

export function installBusinessRoutes(app: Express, store: HubStore) {
  app.use('/api', (req: any, res, next) => {
    if (
      ['POST', 'PUT', 'PATCH'].includes(req.method) &&
      req.get('Idempotency-Key') &&
      /^\/api\/(children|attendance|assessments|conflicts|learning)(\/|$)/.test(req.originalUrl)
    ) {
      const receipt = store.replayCommand(req.device.id, keyFor(req), fingerprintFor(req));
      if (receipt) {
        const records = receipt.entityIds.map((id) => store.getRecord(id, req.device.school));
        if (req.originalUrl.startsWith('/api/conflicts/'))
          return res.json({
            ...receipt,
            record: records[0],
            conflicts: store.listConflicts(req.device.school),
          });
        return res.json({ ...records[0], ...receipt, records });
      }
    }
    next();
  });
  const child = (id: string, school: string, options: { archived?: boolean; consent?: boolean } = {}) => {
    const data = store.getRecord(id, school);
    if (!data || data.record.type !== 'child')
      throw new HttpError(404, 'CHILD_NOT_FOUND', 'Child record not found in this workspace.');
    if (data.record.deleted && !options.archived)
      throw new HttpError(409, 'CHILD_ARCHIVED', 'Restore this child before entering new records.');
    if (options.consent && data.record.consent !== true)
      throw new HttpError(
        403,
        'CONSENT_REQUIRED',
        'This child needs an affirmative shared-record consent decision before new entries are recorded.',
      );
    return data;
  };
  const command = (req: AuthRequest, changes: Change[], expected?: Expected | Expected[]) =>
    store.command(req.device, keyFor(req), fingerprintFor(req), changes, expected);
  const expectedFor = (
    id: string,
    versions: Record<string, string>,
    childId: string,
    school: string,
  ): Expected => {
    if (store.getRecord(id, school) && !versions[childId])
      throw new HttpError(
        409,
        'BASE_VERSION_REQUIRED',
        `Read the existing record before changing it. Supply baseVersions for child ${childId}.`,
      );
    return { entityId: id, version: versions[childId] ?? store.entityVersion(id, school) };
  };

  app.get('/api/session', (req: any, res) =>
    res.json({
      deviceId: req.device.id,
      actorId: req.device.actor,
      role: req.device.role,
      schoolId: req.device.school,
      expires: req.device.expires,
    }),
  );
  app.post('/api/session/renew', (req: any, res) => {
    const expires = Date.now() + 7 * 86400000;
    store.db
      .prepare('UPDATE devices SET expires=?,last_seen=? WHERE id=?')
      .run(expires, Date.now(), req.device.id);
    store.audit(req.device.id, 'session-renewed', { expires }, req.device.school);
    res.json({ expires });
  });
  app.get('/api/capabilities', (req: any, res) =>
    res.json({
      protocol: 1,
      manualEntry: true,
      roles: ['Teacher', 'Health Worker', 'Reviewer', 'Hub Admin'],
      role: req.device.role,
      idempotencyHeader: 'Idempotency-Key',
      optimisticConcurrency: 'baseVersion',
      encryptedAtRest: true,
      quantumComputing: false,
    }),
  );
  app.get('/api/database', (req: any, res) => {
    const school = req.device.school,
      count = (sql: string) => Number((store.db.prepare(sql).get(school) as any)?.n ?? 0);
    const pages = Number((store.db.prepare('PRAGMA page_count').get() as any)?.page_count ?? 0),
      pageSize = Number((store.db.prepare('PRAGMA page_size').get() as any)?.page_size ?? 0);
    res.json({
      engine: 'SQLite WAL',
      schemaVersion: Number((store.db.prepare('PRAGMA user_version').get() as any)?.user_version ?? 0),
      counts: {
        operations: count('SELECT count(*) n FROM operations WHERE school=?'),
        children: store.listRecords({ school, type: 'child', includeDeleted: false, offset: 0, limit: 1 })
          .total,
        records: store.listRecords({ school, includeDeleted: true, offset: 0, limit: 1 }).total,
        conflicts: store.listConflicts(school).length,
        quarantined: count('SELECT count(*) n FROM quarantine WHERE school=?'),
        devices: Number(
          (
            store.db
              .prepare('SELECT count(*) n FROM devices WHERE school=? AND parent_device IS NULL')
              .get(school) as any
          )?.n ?? 0,
        ),
      },
      storageBytes: pages * pageSize,
    });
  });
  app.get('/api/children', (req: any, res) => {
    const p = pagination(req),
      result = store.listRecords({
        school: req.device.school,
        type: 'child',
        search: p.q,
        includeDeleted: req.query.includeDeleted === 'true',
        limit: 200000,
        offset: 0,
      });
    const rows = result.records.filter(
      (item: any) =>
        (!req.query.class || item.record.class === req.query.class) &&
        (!req.query.village || item.record.village === req.query.village),
    );
    res.json({
      records: rows.slice(p.offset, p.offset + p.limit),
      total: rows.length,
      offset: p.offset,
      limit: p.limit,
    });
  });
  app.get('/api/children/:id', (req: any, res) =>
    res.json(child(req.params.id, req.device.school, { archived: true })),
  );
  app.post('/api/children', (req: any, res) => {
    const data = ChildCreateSchema.parse(req.body),
      key = keyFor(req),
      id = 'child-' + hash({ device: req.device.id, key }).slice(0, 24);
    const changes = Object.entries(data).map(([field, value]) => ({
      entityId: id,
      entityType: 'child' as const,
      field: field as Field,
      value,
      kind: 'set' as const,
    }));
    const result = command(req, changes, { entityId: id, version: hash([]) });
    res.status(result.replayed ? 200 : 201).json({ ...store.getRecord(id, req.device.school), ...result });
  });
  app.patch('/api/children/:id', (req: any, res) => {
    const { baseVersion, ...fields } = z
        .object({ baseVersion: z.string().min(1) })
        .passthrough()
        .parse(req.body),
      data = ChildUpdateSchema.parse(fields);
    child(req.params.id, req.device.school);
    const result = command(
      req,
      Object.entries(data).map(([field, value]) => ({
        entityId: req.params.id,
        entityType: 'child',
        field: field as Field,
        value,
        kind: 'set',
      })),
      { entityId: req.params.id, version: baseVersion },
    );
    res.json({ ...store.getRecord(req.params.id, req.device.school), ...result });
  });
  for (const [action, value] of [
    ['archive', true],
    ['restore', false],
  ] as const)
    app.post('/api/children/:id/' + action, (req: any, res) => {
      const { baseVersion } = z
          .object({ baseVersion: z.string().min(1) })
          .strict()
          .parse(req.body),
        existing = child(req.params.id, req.device.school, { archived: true });
      if (existing.record.hasConflict)
        throw new HttpError(
          409,
          'CONFLICT_REVIEW_REQUIRED',
          'Resolve the child’s competing values before archiving or restoring.',
        );
      const result = command(
        req,
        [
          {
            entityId: req.params.id,
            entityType: 'child',
            field: 'deleted',
            value,
            kind: value ? 'delete' : 'resurrect',
          },
        ],
        { entityId: req.params.id, version: baseVersion },
      );
      res.json({ ...store.getRecord(req.params.id, req.device.school), ...result });
    });
  app.get('/api/attendance', (req: any, res) => {
    const date = CalendarDateSchema.parse(req.query.date),
      p = pagination(req),
      children = store
        .listRecords({
          school: req.device.school,
          type: 'child',
          search: p.q,
          includeDeleted: false,
          limit: 200000,
          offset: 0,
        })
        .records.filter((r: any) => !req.query.class || r.record.class === req.query.class);
    const rows = children.map(({ record }: any) => {
      const id = `${record.id}:${date}`,
        entry = store.getRecord(id, req.device.school);
      return {
        childId: record.id,
        name: record.name,
        class: record.class,
        village: record.village,
        date,
        status: entry?.record.attendance ?? null,
        hasConflict: Boolean(entry?.record.hasConflict),
        version: entry?.version ?? store.entityVersion(id, req.device.school),
      };
    });
    const summary = Object.fromEntries(
      ['present', 'absent', 'late', 'excused'].map((status) => [
        status,
        rows.filter((r: any) => r.status === status).length,
      ]),
    );
    res.json({
      rows: rows.slice(p.offset, p.offset + p.limit),
      total: rows.length,
      date,
      summary: {
        ...summary,
        unmarked: rows.filter((r: any) => r.status === null && !r.hasConflict).length,
        conflicts: rows.filter((r: any) => r.hasConflict).length,
      },
      offset: p.offset,
      limit: p.limit,
    });
  });
  app.put('/api/attendance', (req: any, res) => {
    can(req.device, ['Teacher', ...reviewers]);
    const { baseVersions = {}, ...body } = z
        .object({ baseVersions: versionMap.optional() })
        .passthrough()
        .parse(req.body),
      data = AttendanceBatchSchema.parse(body);
    const changes: Change[] = [],
      expected: Expected[] = [];
    for (const mark of data.marks) {
      child(mark.childId, req.device.school, { consent: true });
      const id = `${mark.childId}:${data.date}`;
      changes.push({
        entityId: id,
        entityType: 'attendance',
        field: 'attendance',
        value: mark.status,
        kind: 'set',
      });
      expected.push(expectedFor(id, baseVersions, mark.childId, req.device.school));
    }
    const result = command(req, changes, expected);
    res.json({ ...result, records: changes.map((c) => store.getRecord(c.entityId, req.device.school)) });
  });
  app.get('/api/assessments', (req: any, res) => {
    const p = pagination(req),
      result = store.listRecords({
        school: req.device.school,
        type: 'assessment',
        search: p.q,
        includeDeleted: false,
        limit: 200000,
        offset: 0,
      });
    const records = result.records.filter(
      (r: any) =>
        (!req.query.title || r.record.id.includes(':' + req.query.title + ':attempt-')) &&
        (!req.query.attempt || r.record.id.endsWith(':attempt-' + req.query.attempt)),
    );
    res.json({
      records: records.slice(p.offset, p.offset + p.limit),
      total: records.length,
      limit: p.limit,
      offset: p.offset,
    });
  });
  app.put('/api/assessments', (req: any, res) => {
    can(req.device, ['Teacher', ...reviewers]);
    const { baseVersions = {}, ...body } = z
        .object({ baseVersions: versionMap.optional() })
        .passthrough()
        .parse(req.body),
      data = AssessmentBatchSchema.parse(body);
    const changes: Change[] = [],
      expected: Expected[] = [];
    for (const score of data.scores) {
      child(score.childId, req.device.school, { consent: true });
      const id = `${score.childId}:${data.title}:attempt-${data.attempt}`;
      changes.push({
        entityId: id,
        entityType: 'assessment',
        field: 'score',
        value: score.score,
        kind: 'set',
      });
      expected.push(expectedFor(id, baseVersions, score.childId, req.device.school));
    }
    const result = command(req, changes, expected);
    res.json({ ...result, records: changes.map((c) => store.getRecord(c.entityId, req.device.school)) });
  });
  for (const [route, field, schema] of [
    ['visits', 'visits', VisitSchema],
    ['growth', 'growth', GrowthSchema],
    ['vaccinations', 'doses', VaccinationSchema],
  ] as const)
    app.post('/api/children/:id/' + route, (req: any, res) => {
      can(req.device, ['Health Worker', ...reviewers]);
      child(req.params.id, req.device.school, { consent: true });
      const data = schema.parse(req.body),
        value = field === 'visits' ? { ...data, worker: req.device.actor } : data;
      const result = command(req, [
        { entityId: req.params.id, entityType: 'child', field, value, kind: 'add' },
      ]);
      res
        .status(result.replayed ? 200 : 201)
        .json({ ...store.getRecord(req.params.id, req.device.school), ...result });
    });
  app.get('/api/health/events', (req: any, res) => {
    const p = pagination(req),
      records = req.query.childId
        ? [child(String(req.query.childId), req.device.school, { archived: true })]
        : store.listRecords({
            school: req.device.school,
            type: 'child',
            includeDeleted: false,
            limit: 200000,
            offset: 0,
          }).records;
    const events = records
      .flatMap(({ record }: any) =>
        ['visits', 'growth', 'doses'].flatMap((kind) =>
          (record[kind] ?? []).map((event: any) => ({
            ...event,
            kind,
            childId: record.id,
            childName: record.name,
          })),
        ),
      )
      .filter((e: any) => !req.query.kind || e.kind === req.query.kind)
      .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)) || a.opId.localeCompare(b.opId));
    res.json({
      events: events.slice(p.offset, p.offset + p.limit),
      total: events.length,
      limit: p.limit,
      offset: p.offset,
    });
  });
  app.get('/api/conflicts', (req: any, res) =>
    res.json({ conflicts: store.listConflicts(req.device.school) }),
  );
  app.post('/api/conflicts/:id/resolve', (req: any, res) => {
    const data = ResolutionSchema.parse(req.body),
      conflict = store.listConflicts(req.device.school).find((c) => c.id === req.params.id);
    if (!conflict)
      throw new HttpError(
        404,
        'CONFLICT_NOT_FOUND',
        'This conflict is no longer open. Refresh the record before continuing.',
      );
    if (canonical([...data.expectedOpIds].sort()) !== canonical(conflict.versions.map((o) => o.opId).sort()))
      throw new HttpError(
        409,
        'CONFLICT_CHANGED',
        'The conflict has new alternatives. Review all current versions before resolving it.',
      );
    const result = command(
      req,
      [
        {
          entityId: conflict.entityId,
          entityType: conflict.versions[0].entityType,
          field: conflict.field as Field,
          value: data.value,
          kind: 'resolve',
        },
      ],
      { entityId: conflict.entityId, version: store.entityVersion(conflict.entityId, req.device.school) },
    );
    store.audit(
      req.device.id,
      'conflict-resolved',
      { conflictId: conflict.id, alternatives: data.expectedOpIds, reason: data.reason ?? '' },
      req.device.school,
    );
    res.json({
      ...result,
      record: store.getRecord(conflict.entityId, req.device.school),
      conflicts: store.listConflicts(req.device.school),
    });
  });
  app.get('/api/records', (req: any, res) => {
    const p = pagination(req),
      type = req.query.type ? entityType.parse(req.query.type) : undefined;
    res.json(
      store.listRecords({
        school: req.device.school,
        type,
        search: p.q,
        includeDeleted: req.query.includeDeleted === 'true',
        limit: p.limit,
        offset: p.offset,
      }),
    );
  });
  app.get('/api/library', (_req, res) =>
    res.json({
      lessons: lessons.map(({ answer, ...lesson }) => ({
        ...lesson,
        author: 'Smriva project',
        license: 'CC-BY-4.0',
        offline: true,
      })),
    }),
  );
  app.get('/api/learning/progress', (req: any, res) => {
    const p = pagination(req);
    res.json(
      store.listRecords({
        school: req.device.school,
        type: 'lesson',
        search: p.q,
        includeDeleted: false,
        limit: p.limit,
        offset: p.offset,
      }),
    );
  });
  app.post('/api/learning/progress', (req: any, res) => {
    const data = z
        .object({
          lessonId: z.string().min(1).max(80),
          childId: z.string().min(1).max(100).optional(),
          answer: z.number().int().min(0),
        })
        .strict()
        .parse(req.body),
      lesson = lessons.find((l) => l.id === data.lessonId);
    if (!lesson)
      throw new HttpError(404, 'LESSON_NOT_FOUND', 'Choose a bundled lesson from the learning library.');
    if (data.answer >= lesson.options.length)
      throw new HttpError(400, 'INVALID_ANSWER', 'Select one of the lesson’s answer options.');
    if (data.childId) child(data.childId, req.device.school, { consent: true });
    const id = data.childId ? `${data.childId}:lesson:${lesson.id}` : `lesson-${lesson.id}`;
    const result = command(req, [
      {
        entityId: id,
        entityType: 'lesson',
        field: 'progress',
        kind: 'add',
        value: {
          lesson: lesson.id,
          childId: data.childId ?? null,
          answer: data.answer,
          correct: data.answer === lesson.answer,
          date: new Date().toISOString().slice(0, 10),
        },
      },
    ]);
    res.status(result.replayed ? 200 : 201).json({ ...store.getRecord(id, req.device.school), ...result });
  });
  app.get('/api/devices', (req: any, res) =>
    res.json({
      devices: store.db
        .prepare(
          'SELECT id,actor,role,expires,revoked,last_seen FROM devices WHERE school=? AND parent_device IS NULL ORDER BY last_seen DESC',
        )
        .all(req.device.school),
    }),
  );
  app.post('/api/admin/invitations', (req: any, res) => {
    can(req.device, ['Hub Admin']);
    const data = z
      .object({
        role: roleSchema,
        ttlHours: z
          .number()
          .int()
          .min(1)
          .max(24 * 30)
          .default(24),
      })
      .strict()
      .parse(req.body);
    const invite = store.createInvitation(
      data.role,
      req.device.school,
      data.ttlHours * 3600000,
      req.device.id,
    );
    res.status(201).json(invite);
  });
  app.get('/api/admin/audit', (req: any, res) => {
    can(req.device, reviewers);
    const p = pagination(req);
    res.json({ events: store.listAudit(req.device.school, p.limit) });
  });
  app.get('/api/admin/quarantine', (req: any, res) => {
    can(req.device, reviewers);
    const p = pagination(req),
      rows = store.db
        .prepare('SELECT op_id,reason,body FROM quarantine WHERE school=? ORDER BY op_id LIMIT ? OFFSET ?')
        .all(req.device.school, p.limit, p.offset) as any[];
    res.json({
      items: rows.map((row) => ({ opId: row.op_id, reason: row.reason, operation: store.decrypt(row.body) })),
    });
  });
  app.post('/api/admin/quarantine/:id/review', (req: any, res) => {
    can(req.device, reviewers);
    const data = z
      .object({ decision: z.literal('retain'), note: z.string().trim().min(3).max(1000) })
      .strict()
      .parse(req.body);
    if (
      !store.db
        .prepare('SELECT 1 FROM quarantine WHERE school=? AND op_id=?')
        .get(req.device.school, req.params.id)
    )
      throw new HttpError(404, 'QUARANTINE_NOT_FOUND', 'Quarantined operation not found.');
    store.audit(req.device.id, 'quarantine-reviewed', { opId: req.params.id, ...data }, req.device.school);
    res.json({
      retained: true,
      opId: req.params.id,
      message: 'Original operation remains encrypted in quarantine; review was added to the audit trail.',
    });
  });
}
