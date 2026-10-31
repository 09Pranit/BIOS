import React from 'react';
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import PublicHome from '../apps/pwa/src/components/PublicHome';
import { About } from '../apps/pwa/src/pages/Workspace';
mkdirSync('dist/site', { recursive: true });
writeFileSync('dist/site/home.html', renderToStaticMarkup(<PublicHome />));
writeFileSync(
  'dist/site/about.html',
  renderToStaticMarkup(
    <MemoryRouter initialEntries={['/about']}>
      <About />
    </MemoryRouter>,
  ),
);
console.log('Prepared public home and about HTML. No workspace records are included.');
let compressed = 0;
for (const file of readdirSync('dist/assets')) {
  if (!/\.(?:js|css)$/.test(file)) continue;
  const path = join('dist/assets', file),
    content = readFileSync(path);
  if (content.length < 1024) continue;
  writeFileSync(path + '.br', brotliCompressSync(content));
  writeFileSync(path + '.gz', gzipSync(content));
  compressed++;
}
console.log('Prepared Brotli and gzip variants for ' + compressed + ' static assets.');
