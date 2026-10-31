import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { lessons } from '../packages/content/lessons';
import { governmentResources } from '../apps/pwa/src/lib/government-resources';
mkdirSync('apps/pwa/public/lessons', { recursive: true });
for (const lesson of lessons)
  writeFileSync(
    `apps/pwa/public/lessons/${lesson.id}.json`,
    JSON.stringify({ ...lesson, author: 'Smriva project', license: 'CC-BY-4.0' }),
  );
const paths = [
  'packages/content/lessons.ts',
  'apps/pwa/src/components/Art.tsx',
  'apps/pwa/public/favicon.svg',
  'apps/pwa/public/icon.svg',
  ...lessons.map((l) => `apps/pwa/public/lessons/${l.id}.json`),
  ...lessons.map((l) => `apps/pwa/public/learning/${l.id}.svg`),
];
const items = paths.map((path) => ({
  title: path.split('/').pop(),
  provider: 'Smriva project',
  author: 'Smriva project',
  source: 'Original work in this repository',
  attribution: 'Original content and artwork by the Smriva project. CC BY 4.0.',
  license: 'CC-BY-4.0',
  retrievedAt: '2026-10-31',
  language: 'English',
  contentType: path.endsWith('.json')
    ? 'application/json'
    : path.endsWith('.svg')
      ? 'image/svg+xml'
      : 'source',
  offlinePermission: true,
  path,
  size: readFileSync(path).byteLength,
  sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
}));
const snapshotPath = 'apps/pwa/public/education-snapshot.json';
if (existsSync(snapshotPath))
  items.push({
    title: 'India education indicator snapshot',
    provider: 'World Bank / UNESCO UIS',
    author: 'UNESCO Institute for Statistics',
    source: 'https://data.worldbank.org/indicator/SE.ADT.LITR.ZS?locations=IN',
    attribution:
      'World Bank / UNESCO UIS. Primary and secondary gross enrollment and adult literacy. CC BY 4.0. Individual source URLs, observation years and retrieval date in the snapshot.',
    license: 'CC-BY-4.0',
    retrievedAt: JSON.parse(readFileSync(snapshotPath, 'utf8')).retrievedAt,
    language: 'English',
    contentType: 'application/json',
    offlinePermission: true,
    path: snapshotPath,
    size: readFileSync(snapshotPath).byteLength,
    sha256: createHash('sha256').update(readFileSync(snapshotPath)).digest('hex'),
  });
const governmentPath = 'packages/content/government-sources.json';
if (existsSync(governmentPath)) {
  const government = JSON.parse(readFileSync(governmentPath, 'utf8'));
  government.items = government.items.map((item: any) => {
    const resource = governmentResources.find((entry) => 'apps/pwa/public' + entry.image === item.path);
    if (!resource) throw new Error('Government image is not in the curated catalogue: ' + item.path);
    return { ...item, id: resource.id, programmeUrl: resource.href };
  });
  writeFileSync(governmentPath, JSON.stringify(government, null, 2));
  items.push(...government.items);
}
writeFileSync('packages/content/sources.json', JSON.stringify({ generatedAt: '2026-10-31', items }, null, 2));
console.log('Original lesson packs and source manifest prepared.');
