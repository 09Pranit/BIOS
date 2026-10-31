import { writeFileSync, mkdirSync } from 'node:fs';
const output = 'apps/pwa/public/education-snapshot.json';
const indicators = ['SE.PRM.ENRR', 'SE.SEC.ENRR', 'SE.ADT.LITR.ZS'];
const observations: any[] = [];
for (const indicator of indicators) {
  try {
    const base = 'https://api.worldbank.org/v2',
      opts = { signal: AbortSignal.timeout(15000) };
    const [data, metadata] = await Promise.all([
      fetch(`${base}/country/IND/indicator/${indicator}?format=json&mrnev=1`, opts).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      }),
      fetch(`${base}/indicator/${indicator}?format=json`, opts).then((r) => r.json()),
    ]);
    const row = data?.[1]?.find((r: any) => typeof r.value === 'number' && Number.isFinite(r.value)),
      meta = metadata?.[1]?.[0];
    if (!row || !meta?.name || row.countryiso3code !== 'IND' || row.indicator.id !== indicator)
      throw new Error('No verified observation');
    observations.push({
      indicator,
      title: meta.name,
      value: row.value,
      unit: '%',
      year: Number(row.date),
      geography: 'India',
      source: `https://data.worldbank.org/indicator/${indicator}?locations=IN`,
      metadataSource: `${base}/indicator/${indicator}?format=json`,
      provider: 'World Bank / UNESCO UIS',
      license: 'CC-BY-4.0',
      note: meta.sourceNote,
    });
    console.log(`Verified ${indicator}: observation year ${row.date}.`);
  } catch (e: any) {
    console.warn(`${indicator} unavailable: ${e.message}. No value substituted.`);
  }
}
if (observations.length) {
  mkdirSync('apps/pwa/public', { recursive: true });
  writeFileSync(
    output,
    JSON.stringify(
      {
        retrievedAt: new Date().toISOString(),
        observations,
        note: 'National data; not measurements of synthetic school records. Gross enrollment ratios may exceed 100%.',
      },
      null,
      2,
    ),
  );
  console.log('Saved ' + output);
} else console.log('No verified data retrieved. Existing verified snapshot, if any, remains unchanged.');
