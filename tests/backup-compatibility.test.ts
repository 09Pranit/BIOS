import { createCipheriv, createDecipheriv, pbkdf2Sync } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportBackup, importBackup } from '../packages/sync-core/src/crypto';

const password = 'Restore हिंदी ਪੰਜਾਬੀ 42';
const original = {
  ops: [{ name: 'मीरा / ਮੀਰਾ', value: 'A child’s original record' }],
  entryDrafts: { 'assessment-title': 'ਗਿਣਤੀ / गिनती' },
  createdAt: 1793462400000,
};

// An independent implementation reproduces the original version-1 wire format.
// This catches accidental changes to PBKDF2, AAD, nonce length or GCM tag layout
// that an exporter/importer round trip using the same implementation can miss.
function legacyBackup(format: string, passphrase = password) {
  const salt = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex'),
    iv = Buffer.from('101112131415161718191a1b', 'hex'),
    key = pbkdf2Sync(passphrase, salt, 310000, 32, 'sha256'),
    cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('KUKA:v1', 'utf8'));
  const data = Buffer.concat([
    cipher.update(JSON.stringify(original), 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {
    format,
    version: 1,
    salt: salt.toString('base64'),
    sealed: { iv: iv.toString('base64'), data: data.toString('base64') },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('portable encrypted backup format', () => {
  it.each(['kuka-backup', 'setusync-backup', 'smriva-backup'])(
    'reads an independently encrypted %s file after JSON transfer',
    async (format) => {
      const file = JSON.parse(JSON.stringify(legacyBackup(format)));
      expect(await importBackup(file, password)).toEqual(original);
    },
  );

  it('retains compatibility with original short backup passphrases', async () => {
    expect(await importBackup(legacyBackup('kuka-backup', 'old'), 'old')).toEqual(original);
  });

  it('exports standard encrypted JSON readable by an independent crypto implementation', async () => {
    const backup = JSON.parse(JSON.stringify(await exportBackup(original, password))),
      salt = Buffer.from(backup.salt, 'base64'),
      iv = Buffer.from(backup.sealed.iv, 'base64'),
      data = Buffer.from(backup.sealed.data, 'base64'),
      key = pbkdf2Sync(password, salt, 310000, 32, 'sha256'),
      decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from('KUKA:v1', 'utf8'));
    decipher.setAuthTag(data.subarray(-16));
    expect(backup.format).toBe('smriva-backup');
    expect(JSON.stringify(backup)).not.toContain('मीरा');
    expect(
      JSON.parse(Buffer.concat([decipher.update(data.subarray(0, -16)), decipher.final()]).toString('utf8')),
    ).toEqual(original);
  });

  it('does not confuse absent Web Crypto on an insecure browser connection with a bad passphrase', async () => {
    const backup = legacyBackup('smriva-backup');
    vi.stubGlobal('crypto', {});
    await expect(importBackup(backup, password)).rejects.toThrow('HTTPS or localhost');
    await expect(exportBackup(original, password)).rejects.toThrow('HTTPS or localhost');
  });

  it.each([null, [], {}, { format: 'smriva-bundle', version: 1 }])(
    'explains that the wrong JSON file is not an encrypted Settings backup (%j)',
    async (value) => {
      await expect(importBackup(value, password)).rejects.toThrow('exported from Settings');
    },
  );

  it('asks for an app update when a newer backup version is selected', async () => {
    await expect(importBackup({ ...legacyBackup('smriva-backup'), version: 2 }, password)).rejects.toThrow(
      'Update this app',
    );
  });

  it.each([
    { version: undefined },
    { version: '1' },
    { salt: '?' },
    { salt: 'AA==' },
    { sealed: undefined },
    { sealed: { iv: 'AA==', data: 'AAAAAAAAAAAAAAAAAAAAAA==' } },
    { sealed: { iv: 'EBESExQVFhcYGRob', data: 'AA==' } },
    { sealed: { iv: 'EBESExQVFhcYGRob', data: 42 } },
  ])('identifies malformed or truncated envelopes before decrypting (%j)', async (fields) => {
    await expect(importBackup({ ...legacyBackup('smriva-backup'), ...fields }, password)).rejects.toThrow(
      'incomplete or damaged',
    );
  });

  it('rejects an incorrect password and a modified authentication tag without exposing native crypto details', async () => {
    const backup = legacyBackup('smriva-backup');
    await expect(importBackup(backup, 'wrong password')).rejects.toThrow(
      'Incorrect password or damaged backup. No records were imported.',
    );
    const ciphertext = Buffer.from(backup.sealed.data, 'base64');
    ciphertext[ciphertext.length - 1] ^= 1;
    await expect(
      importBackup(
        { ...backup, sealed: { ...backup.sealed, data: ciphertext.toString('base64') } },
        password,
      ),
    ).rejects.toThrow('Incorrect password or damaged backup. No records were imported.');
  });
});
