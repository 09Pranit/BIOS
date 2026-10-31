import { describe, expect, it } from 'vitest';
import { accessAddresses, serverSettings } from '../apps/hub/src/server';

describe('portable hub startup', () => {
  it('keeps local startup private and permits explicit LAN binding', () => {
    expect(serverSettings({})).toEqual({ port: 3001, host: '127.0.0.1', tls: undefined });
    const settings = serverSettings({ HOST: '0.0.0.0', PORT: '8443' });
    expect(settings.host).toBe('0.0.0.0');
    expect(accessAddresses(settings)).toContain('http://localhost:8443');
    expect(accessAddresses(settings).every((address) => !address.includes('0.0.0.0'))).toBe(true);
  });
  it.each(['0', '-1', '65536', 'NaN', '3001.5', ''])(
    'rejects invalid port %s before opening the database',
    (PORT) => {
      expect(() => serverSettings({ PORT })).toThrow('PORT must be');
    },
  );
  it('requires the complete HTTPS certificate pair', () => {
    expect(() => serverSettings({ TLS_CERT_FILE: 'certificate.pem' })).toThrow('Set both');
    expect(() => serverSettings({ TLS_KEY_FILE: 'private.pem' })).toThrow('Set both');
    expect(() =>
      serverSettings({
        TLS_CERT_FILE: 'certificate.pem',
        TLS_KEY_FILE: 'private.pem',
        TLS_PFX_FILE: 'certificate.pfx',
      }),
    ).toThrow('not both');
  });
  it('prints a usable IPv6 loopback URL', () => {
    expect(accessAddresses(serverSettings({ HOST: '::1' }))).toEqual(['http://[::1]:3001']);
  });
});
