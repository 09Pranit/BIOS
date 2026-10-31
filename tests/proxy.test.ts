import { afterEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { HubStore } from '../apps/hub/src/store';
import { createApp } from '../apps/hub/src/app';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
async function clientAddress(hops: string, forwarded: string) {
  vi.stubEnv('TRUST_PROXY_HOPS', hops);
  const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
  const app = createApp(store);
  app.get('/test-address', (request, response) => response.json({ ip: request.ip }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address() as { port: number };
    const health = await fetch(`http://127.0.0.1:${address.port}/api/health`, {
      headers: { 'X-Forwarded-For': forwarded },
    });
    expect(health.status).toBe(200);
    return await (
      await fetch(`http://127.0.0.1:${address.port}/test-address`, {
        headers: { 'X-Forwarded-For': forwarded },
      })
    ).json();
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
  }
}
describe('explicit HTTPS proxy trust', () => {
  it('reads the client behind the single configured proxy without rate-limit validation errors', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await clientAddress('1', '203.0.113.10')).toEqual({ ip: '203.0.113.10' });
    expect(errors).not.toHaveBeenCalled();
  });
  it('does not trust arbitrary earlier addresses in a longer forwarded chain', async () => {
    expect(await clientAddress('1', '203.0.113.10, 198.51.100.20')).toEqual({ ip: '198.51.100.20' });
  });
  it('keeps direct startup untrusted by default', () => {
    vi.stubEnv('TRUST_PROXY_HOPS', '0');
    const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
    try {
      expect(createApp(store).get('trust proxy')).toBe(false);
    } finally {
      store.close();
    }
  });
  it.each(['-1', '1.5', 'six', '6'])('rejects invalid proxy depth %s', (hops) => {
    vi.stubEnv('TRUST_PROXY_HOPS', hops);
    const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
    try {
      expect(() => createApp(store)).toThrow('TRUST_PROXY_HOPS');
    } finally {
      store.close();
    }
  });
});
