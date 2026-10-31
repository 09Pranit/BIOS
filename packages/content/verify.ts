import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(readFileSync('packages/content/sources.json', 'utf8'));
for (const item of manifest.items) {
  if (
    !item.attribution ||
    !item.source ||
    !['CC-BY-4.0', 'OFL-1.1', 'ISC', 'GOV-REUSE-POLICY'].includes(item.license)
  )
    throw new Error('Missing or unsupported attribution/license: ' + item.title);
  if (item.license === 'GOV-REUSE-POLICY') {
    const official = (url: string) => {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && /\.(?:gov|nic)\.in$/.test(parsed.hostname);
    };
    if (
      !item.rightsUrl ||
      !item.rightsNote ||
      !official(item.rightsUrl) ||
      !official(item.source) ||
      item.offlinePermission !== true
    )
      throw new Error(
        'Government media requires an official source and explicit recorded reuse policy: ' + item.title,
      );
  }
  if (item.path) {
    const bytes = readFileSync(item.path),
      checksum = createHash('sha256').update(bytes).digest('hex');
    if (checksum !== item.sha256) throw new Error('Checksum mismatch: ' + item.path);
  }
}
console.log(`Verified ${manifest.items.length} source records and every bundled asset checksum.`);
