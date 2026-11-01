import 'dotenv/config';
import { resolve } from 'node:path';
import { createApp } from './app';
import { HubStore, loadHubKey } from './store';
import { seedDoctorOperations, seedOperations } from '../../../packages/content/seed';
import { databasePath } from './config';
import { installSiteRoutes } from './site';
import { accessAddresses, createHubServer, serverSettings } from './server';
const settings = serverSettings(
  process.argv.includes('--lan') ? { ...process.env, HOST: '0.0.0.0' } : process.env,
);
const demo = process.env.DEMO_JUDGE_MODE !== 'false',
  path = databasePath();
const store = new HubStore(path, loadHubKey(path, demo));
if (demo && process.env.SEED_DEMO_DATA !== 'false')
  store.ingest(store.all().length ? seedDoctorOperations() : seedOperations(), undefined, true);
const app = createApp(store, demo);
installSiteRoutes(app, { distDir: resolve('dist'), siteUrl: process.env.SITE_URL });
const server = createHubServer(app, settings);
server.listen(settings.port, settings.host, () => {
  console.log('Smriva hub ready:');
  for (const address of accessAddresses(settings)) console.log('  ' + address);
  if (!settings.tls && ['0.0.0.0', '::'].includes(settings.host))
    console.log(
      'Other devices need trusted HTTPS for encrypted workspaces and offline installation. See docs/DEVICE_SUPPORT.md.',
    );
});
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `Port ${settings.port} is already in use. Open the running app, or choose another PORT.`
      : `The hub could not start (${error.code ?? 'network error'}). Check HOST, PORT and TLS configuration.`,
  );
  store.close();
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () =>
    server.close(() => {
      store.close();
      process.exit(0);
    }),
  );
