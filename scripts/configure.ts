import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { databasePath } from '../apps/hub/src/config';
import { dirname, join } from 'node:path';
if (existsSync('.env'))
  throw new Error(
    'An .env file already exists. It was not overwritten. Edit it deliberately or preserve a copy before configuring a new hub.',
  );
const path = databasePath(),
  keyPath = join(dirname(path), 'demo-hub.key');
const key = existsSync(keyPath) ? readFileSync(keyPath, 'utf8').trim() : randomBytes(32).toString('hex');
if (!/^[a-f0-9]{64}$/i.test(key))
  throw new Error(
    'The existing hub key is not valid. Preserve the database and investigate before proceeding.',
  );
const values = {
  PORT: '3001',
  HOST: '127.0.0.1',
  DATABASE_PATH: path.replace(/\\/g, '/'),
  HUB_ENCRYPTION_KEY: key,
  DEMO_JUDGE_MODE: 'false',
  SEED_DEMO_DATA: 'false',
  BOOTSTRAP_TOKEN: randomBytes(32).toString('base64url'),
  ALLOWED_ORIGIN: 'http://localhost:5173',
  SITE_URL: '',
};
writeFileSync(
  '.env',
  Object.entries(values)
    .map(([name, value]) => name + '=' + JSON.stringify(value))
    .join('\n') + '\n',
  { mode: 0o600, flag: 'wx' },
);
console.log('Created .env with private local hub keys. No secrets were printed.');
console.log(
  'Open .env privately, use BOOTSTRAP_TOKEN once in the enrollment-code field to create the first Hub Admin, then issue role-bound invitations from Hub database → Enrollment.',
);
console.log(
  'Existing database/key files were preserved. New hubs start with an empty database. Use HTTPS before accessing this hub outside localhost.',
);
