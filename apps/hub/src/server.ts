import { createServer as httpServer } from 'node:http';
import { createServer as httpsServer, type ServerOptions } from 'node:https';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import type { Express } from 'express';

export function serverSettings(env: NodeJS.ProcessEnv = process.env) {
  const port = Number(env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be between 1 and 65535.');
  const host = env.HOST?.trim() || '127.0.0.1';
  const certFile = env.TLS_CERT_FILE?.trim();
  const keyFile = env.TLS_KEY_FILE?.trim();
  const pfxFile = env.TLS_PFX_FILE?.trim();
  if (pfxFile && (certFile || keyFile))
    throw new Error('Choose TLS_PFX_FILE or the PEM certificate/key pair, not both.');
  if (Boolean(certFile) !== Boolean(keyFile))
    throw new Error('Set both TLS_CERT_FILE and TLS_KEY_FILE to enable HTTPS.');
  const tls: ServerOptions | undefined = pfxFile
    ? { pfx: readFileSync(pfxFile), passphrase: env.TLS_PFX_PASSPHRASE }
    : certFile && keyFile
      ? { cert: readFileSync(certFile), key: readFileSync(keyFile) }
      : undefined;
  return { port, host, tls };
}

export function createHubServer(app: Express, settings: ReturnType<typeof serverSettings>) {
  return settings.tls ? httpsServer(settings.tls, app) : httpServer(app);
}

export function accessAddresses(settings: Pick<ReturnType<typeof serverSettings>, 'port' | 'host' | 'tls'>) {
  const protocol = settings.tls ? 'https' : 'http';
  const hosts =
    settings.host === '0.0.0.0' || settings.host === '::'
      ? [
          'localhost',
          ...Object.values(networkInterfaces())
            .flat()
            .filter((address) => address && !address.internal && address.family === 'IPv4')
            .map((address) => address!.address),
        ]
      : [settings.host];
  return [...new Set(hosts)].map(
    (host) => `${protocol}://${host.includes(':') ? `[${host}]` : host}:${settings.port}`,
  );
}
