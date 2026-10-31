import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { SyncSchema, OpSchema, SCHOOL } from '../../../packages/sync-core/src/index.js';
import { HubStore, HttpError, hash } from './store.js';
import { installBusinessRoutes } from './business.js';
import { siteRobotsHeaders } from './site.js';
export function createApp(store: HubStore, demo = true) {
  const app = express();
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5)
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5.');
  if (proxyHops) app.set('trust proxy', proxyHops);
  app.disable('x-powered-by');
  app.use(siteRobotsHeaders);
  app.use((_req, res, next) => {
    res.setHeader('X-Request-Id', randomUUID());
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'"],
          'img-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          // Safari otherwise upgrades localhost HTTP assets to HTTPS, even
          // when the developer server is intentionally listening over HTTP.
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.use(cors({ origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '2mb' }));
  app.use(
    '/api',
    rateLimit({ windowMs: 60000, limit: 500, standardHeaders: 'draft-8', legacyHeaders: false }),
  );
  app.get('/api/health', (_req, res) =>
    res.json({
      status: 'ok',
      service: 'Smriva',
      protocol: 1,
      demo,
      enrollment: {
        demo,
        bootstrapAvailable:
          Boolean(process.env.BOOTSTRAP_TOKEN) &&
          !store.db
            .prepare("SELECT 1 FROM devices WHERE role='Hub Admin' AND parent_device IS NULL LIMIT 1")
            .get(),
      },
      features: [
        'encrypted-sqlite',
        'offline-sync',
        'manual-record-api',
        'versioned-edits',
        'invitations',
        'audit',
      ],
    }),
  );
  const authLimiter = rateLimit({
    windowMs: 600000,
    limit: demo ? 200 : 12,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  app.post('/api/enroll', authLimiter, (req, res) => {
    if (typeof req.body?.code !== 'string' || !req.body.code.trim())
      throw new HttpError(
        403,
        'ENROLLMENT_CODE_REQUIRED',
        'Enter a valid enrollment code issued by your hub administrator.',
      );
    const v = z
      .object({
        actor: z.string().trim().min(2).max(60),
        role: z.enum(['Teacher', 'Health Worker', 'Reviewer', 'Hub Admin']),
        code: z.string().min(1).max(200),
      })
      .parse(req.body);
    const bootstrap = process.env.BOOTSTRAP_TOKEN;
    const demoCodes = [process.env.DEMO_ENROLLMENT_CODE ?? 'setusync-demo-2026', 'kuka-demo-2026'];
    if (demo && demoCodes.includes(v.code)) return res.status(201).json(store.enroll(v.actor, v.role));
    if (
      bootstrap &&
      bootstrap.length >= 24 &&
      timingSafeEqual(Buffer.from(hash(v.code)), Buffer.from(hash(bootstrap)))
    ) {
      if (store.db.prepare("SELECT 1 FROM devices WHERE role='Hub Admin' AND internal=0 LIMIT 1").get())
        throw new HttpError(
          403,
          'BOOTSTRAP_CLOSED',
          'The first administrator is already provisioned. Request a one-time enrollment invitation.',
        );
      return res.status(201).json(store.bootstrap(v.actor));
    }
    return res.status(201).json(store.consumeInvitation(v.code, v.actor));
  });
  app.post('/api/recover', authLimiter, (req, res) => {
    const v = z.object({ recovery: z.string().min(16), actor: z.string().min(2).max(60) }).parse(req.body);
    res.json(store.recover(v.recovery, v.actor));
  });
  app.use('/api', (req: any, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer /, '') ?? '',
      device = store.authorize(token),
      renewing = req.method === 'POST' && req.path === '/session/renew',
      renewalGrace = 30 * 86400000;
    if (!device || (device.expires < Date.now() && (!renewing || device.expires < Date.now() - renewalGrace)))
      return res.status(401).json({ error: 'Device session expired. Recover or enroll online.' });
    if (device.revoked)
      return res
        .status(403)
        .json({ error: 'Device revoked. Local work is preserved; contact your hub administrator.' });
    req.device = device;
    next();
  });
  app.post('/api/sync', (req: any, res) => {
    const v = SyncSchema.parse(req.body),
      device = req.device;
    for (const op of v.ops) {
      if (op.schoolId !== device.school)
        return res.status(403).json({ error: 'School does not match this device' });
    }
    const result = store.ingest(v.ops, device.school),
      pull = store.pull(v.cursor, device.school, v.limit);
    store.db.prepare('UPDATE devices SET last_seen=? WHERE id=?').run(Date.now(), device.id);
    res.json({ protocol: 1, ...result, ...pull, checkpoint: Date.now() });
  });
  app.get('/api/summary', (req: any, res) => res.json(store.summary(req.device.school)));
  app.post('/api/devices/:id/revoke', (req: any, res) => {
    res.json(store.revokeDevice(req.device, req.params.id));
  });
  app.get('/api/bundle', (req: any, res) => {
    const payload = {
      format: 'setusync-hub-bundle',
      version: 1,
      school: req.device.school,
      created: Date.now(),
      encrypted: store.encrypt(store.all(req.device.school)),
    };
    res.json({ payload, signature: store.sign(payload) });
  });
  app.post('/api/bundle', (req: any, res) => {
    const { payload, signature } = req.body;
    if (
      !payload ||
      typeof signature !== 'string' ||
      !store.verify(payload, signature) ||
      payload.school !== req.device.school
    )
      return res.status(400).json({ error: 'Bundle signature or school invalid' });
    const ops = z.array(OpSchema).parse(store.decrypt(payload.encrypted));
    res.json(store.ingest(ops, req.device.school));
  });
  installBusinessRoutes(app, store);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found', code: 'NOT_FOUND' }));
  app.use((error: any, _req: any, res: any, _next: any) => {
    const status =
      error instanceof z.ZodError
        ? 400
        : error instanceof HttpError
          ? error.status
          : error.status === 413
            ? 413
            : error instanceof SyntaxError
              ? 400
              : 500;
    res.status(status).json({
      error:
        error instanceof z.ZodError
          ? 'Validation failed. Correct the highlighted fields.'
          : status === 500
            ? 'The hub could not complete this request. Your acknowledged records remain stored.'
            : (error.message ?? 'Request failed'),
      code:
        error instanceof HttpError
          ? error.code
          : error instanceof z.ZodError
            ? 'VALIDATION_FAILED'
            : status === 500
              ? 'INTERNAL_ERROR'
              : 'REQUEST_ERROR',
      requestId: res.getHeader('X-Request-Id'),
      ...(error instanceof z.ZodError
        ? { details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) }
        : {}),
    });
  });
  return app;
}

