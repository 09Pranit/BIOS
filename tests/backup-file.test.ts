import { describe, expect, it } from 'vitest';
import { readBackupFile } from '../apps/pwa/src/lib/backup-file';

const value = { format: 'smriva-backup', label: 'पढ़ाई · ਸਿੱਖਿਆ' };
const json = JSON.stringify(value);
const file = (data: Uint8Array) => ({ arrayBuffer: async () => Uint8Array.from(data).buffer });
function utf16(text: string, littleEndian: boolean) {
  const result = new Uint8Array(2 + text.length * 2);
  const view = new DataView(result.buffer);
  view.setUint16(0, 0xfeff, littleEndian);
  for (let index = 0; index < text.length; index++)
    view.setUint16(2 + index * 2, text.charCodeAt(index), littleEndian);
  return result;
}
describe('transferred backup files', () => {
  it.each([
    ['UTF-8', new TextEncoder().encode(json)],
    ['UTF-8 BOM', new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(json)])],
    ['UTF-16 LE BOM', utf16(json, true)],
    ['UTF-16 BE BOM', utf16(json, false)],
  ])('reads %s JSON without altering its content', async (_label, data) => {
    expect(await readBackupFile(file(data as Uint8Array))).toEqual(value);
  });
  it.each(['', '<html>Download preview</html>', '{"private": "sensitive record",', '{invalid}'])(
    'rejects malformed files with no private JSON fragments in the message',
    async (text) => {
      const error = await readBackupFile(file(new TextEncoder().encode(text))).catch((error: Error) => error);
      expect(error).toBeInstanceOf(Error);
      if (!(error instanceof Error)) throw new Error('Expected invalid JSON to be rejected');
      expect(error.message).toContain('not valid backup JSON');
      expect(error.message).not.toContain('sensitive record');
    },
  );
  it('explains invalid text encoding', async () => {
    await expect(readBackupFile(file(new Uint8Array([0xff, 0xff])))).rejects.toThrow(
      'No records were imported',
    );
  });
  it('explains an unreadable cloud placeholder', async () => {
    await expect(
      readBackupFile({
        arrayBuffer: async () => {
          throw new Error('provider error');
        },
      }),
    ).rejects.toThrow('Download it to this device');
  });
});
