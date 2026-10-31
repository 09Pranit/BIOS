import { createHash } from 'node:crypto';
import { createApp } from '../apps/hub/src/app';
import { HubStore } from '../apps/hub/src/store';
import { seedOperations } from '../packages/content/seed';

if (process.env.VERCEL) process.env.TRUST_PROXY_HOPS ??= '1';

const key =
  process.env.HUB_ENCRYPTION_KEY ??
  createHash('sha256').update(process.env.VERCEL_PROJECT_ID ?? 'smriva-vercel-demo').digest('hex');
const store = new HubStore(':memory:', key);
store.ingest(seedOperations(), undefined, true);

export default createApp(store, true);
