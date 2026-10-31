export type Sealed = { iv: string; data: string };
const bytes = (s: string) => new TextEncoder().encode(s);
export const base64 = (b: Uint8Array) => {
  let s = '';
  for (const n of b) s += String.fromCharCode(n);
  return btoa(s);
};
export const unbase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export async function deriveKey(password: string, salt: string) {
  const source = await crypto.subtle.importKey('raw', bytes(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: unbase64(salt), iterations: 310000, hash: 'SHA-256' },
    source,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}
export const newSalt = () => base64(crypto.getRandomValues(new Uint8Array(16)));
export async function seal(key: CryptoKey, value: unknown): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: bytes('KUKA:v1') },
    key,
    bytes(JSON.stringify(value)),
  );
  return { iv: base64(iv), data: base64(new Uint8Array(data)) };
}
export async function open<T>(key: CryptoKey, value: Sealed): Promise<T> {
  const data = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unbase64(value.iv), additionalData: bytes('KUKA:v1') },
    key,
    unbase64(value.data),
  );
  return JSON.parse(new TextDecoder().decode(data));
}
export async function createKeys(pin: string) {
  const salt = newSalt(),
    wrap = await deriveKey(pin, salt),
    key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const raw = base64(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
  return { key, salt, wrapped: await seal(wrap, raw) };
}
export async function unlockKey(pin: string, salt: string, wrapped: Sealed) {
  const raw = await open<string>(await deriveKey(pin, salt), wrapped);
  return crypto.subtle.importKey('raw', unbase64(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function exportBackup(value: unknown, password: string) {
  requireBackupCrypto();
  const salt = newSalt();
  return {
    format: 'smriva-backup',
    version: 1,
    salt,
    sealed: await seal(await deriveKey(password, salt), value),
  };
}
const damagedBackup =
  'This backup file is incomplete or damaged. Copy the original JSON file again. No records were imported.';
function requireBackupCrypto() {
  if (!globalThis.crypto?.subtle)
    throw new Error(
      'Encrypted backups require a secure browser connection. Open this site over HTTPS or localhost, then try again. No records were imported.',
    );
}
function backupEnvelope(value: unknown): { salt: string; sealed: Sealed } {
  if (
    !value ||
    typeof value !== 'object' ||
    !('format' in value) ||
    typeof value.format !== 'string' ||
    !['kuka-backup', 'setusync-backup', 'smriva-backup'].includes(value.format)
  )
    throw new Error(
      'Choose an encrypted Smriva backup exported from Settings. KUKA and SetuSync backups are also supported. No records were imported.',
    );
  if (!('version' in value) || value.version !== 1) {
    if ('version' in value && typeof value.version === 'number' && value.version > 1)
      throw new Error(
        'This backup was created by a newer version of Smriva. Update this app before importing it. No records were imported.',
      );
    throw new Error(damagedBackup);
  }
  if (
    !('salt' in value) ||
    typeof value.salt !== 'string' ||
    !('sealed' in value) ||
    !value.sealed ||
    typeof value.sealed !== 'object' ||
    !('iv' in value.sealed) ||
    typeof value.sealed.iv !== 'string' ||
    !('data' in value.sealed) ||
    typeof value.sealed.data !== 'string'
  )
    throw new Error(damagedBackup);
  // Version 1 always used a 16-byte salt, a 12-byte AES-GCM nonce, and
  // a ciphertext containing the 16-byte authentication tag. Check the
  // envelope before deriving a key so truncated files are not blamed on a PIN.
  try {
    if (
      unbase64(value.salt).length !== 16 ||
      unbase64(value.sealed.iv).length !== 12 ||
      unbase64(value.sealed.data).length < 16
    )
      throw new Error(damagedBackup);
  } catch {
    throw new Error(damagedBackup);
  }
  return { salt: value.salt, sealed: { iv: value.sealed.iv, data: value.sealed.data } };
}
export async function importBackup<T>(value: unknown, password: string): Promise<T> {
  const envelope = backupEnvelope(value);
  requireBackupCrypto();
  try {
    return await open<T>(await deriveKey(password, envelope.salt), envelope.sealed);
  } catch {
    throw new Error('Incorrect password or damaged backup. No records were imported.');
  }
}
