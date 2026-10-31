/** Read transferred JSON without relying on its filename or the device's text encoding. */
export async function readBackupFile(file: Pick<File, 'arrayBuffer'>): Promise<unknown> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new Error(
      'This file could not be read. Download it to this device, then select it again. No records were imported.',
    );
  }
  const data = new Uint8Array(buffer);
  // Some Windows editors save JSON as UTF-16. Keep support for those copies as
  // well as the UTF-8 files produced by Smriva and mobile share sheets.
  const encoding =
    data[0] === 0xff && data[1] === 0xfe
      ? 'utf-16le'
      : data[0] === 0xfe && data[1] === 0xff
        ? 'utf-16be'
        : 'utf-8';
  try {
    const text = new TextDecoder(encoding, { fatal: true })
      .decode(data)
      .replace(/^\uFEFF/, '')
      .trim();
    return JSON.parse(text);
  } catch {
    // JSON.parse errors can echo fragments of private file contents. Show a
    // stable, actionable message instead, before touching the local vault.
    throw new Error(
      'This file is not valid backup JSON. Select the original encrypted .json file from Settings, not a preview or a webpage. No records were imported.',
    );
  }
}
