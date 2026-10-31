import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { governmentResources } from '../apps/pwa/src/lib/government-resources';

const official = (url: string) => {
  const parsed = new URL(url);
  return (
    parsed.protocol === 'https:' &&
    /\.(?:gov|nic)\.in$/.test(parsed.hostname) &&
    !parsed.username &&
    !parsed.password
  );
};
const files = await Promise.all(
  governmentResources.map(async (resource) => {
    if (
      !official(resource.imageSource) ||
      !official(resource.rightsUrl) ||
      !/^\/government\/[a-z0-9-]+\.(?:png|jpe?g)$/.test(resource.image)
    )
      throw new Error('Unapproved government image source/path: ' + resource.id);
    const response = await fetch(resource.imageSource, { signal: AbortSignal.timeout(45000) });
    if (!response.ok || !official(response.url))
      throw new Error(`Official image unavailable (${response.status}): ${resource.id}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 512000)
      throw new Error('Image exceeds the curated size limit: ' + resource.id);
    // Some official servers label PNG bytes as JPEG; inspect the actual file signature.
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const mime = png ? 'image/png' : jpeg ? 'image/jpeg' : undefined;
    if (!mime || (png && !resource.image.endsWith('.png')) || (jpeg && !/\.jpe?g$/.test(resource.image)))
      throw new Error('Unexpected image signature: ' + resource.id);
    if (resource.imageBytes && resource.imageBytes !== bytes.length)
      throw new Error('Official asset changed; review before updating: ' + resource.id);
    return { resource, bytes, mime, sha256: createHash('sha256').update(bytes).digest('hex') };
  }),
);
mkdirSync('apps/pwa/public/government', { recursive: true });
const items = files.map(({ resource, bytes, mime, sha256 }) => {
  const path = 'apps/pwa/public' + resource.image;
  writeFileSync(path, bytes);
  return {
    title: resource.title + ' — official programme image',
    provider: resource.provider,
    author: resource.provider,
    source: resource.imageSource,
    programmeUrl: resource.href,
    attribution:
      resource.provider + '. Reproduced unchanged from the official website with source acknowledgement.',
    license: 'GOV-REUSE-POLICY',
    rightsUrl: resource.rightsUrl,
    rightsNote: resource.rightsNote,
    retrievedAt: resource.lastVerifiedDate,
    contentType: mime,
    offlinePermission: true,
    path,
    size: bytes.length,
    sha256,
  };
});
writeFileSync(
  'packages/content/government-sources.json',
  JSON.stringify({ generatedAt: '2026-10-31', items }, null, 2),
);
console.log(
  'Saved ' + items.length + ' unmodified official programme images with checksums and source policies.',
);
