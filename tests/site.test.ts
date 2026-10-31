import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { request as httpRequest } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { brotliCompressSync, brotliDecompressSync, gzipSync, gunzipSync } from 'node:zlib';
import { parseSiteUrl, publicRouteMeta } from '../packages/site/config';
import { installSiteRoutes, renderDocument } from '../apps/hub/src/site';
import { createApp } from '../apps/hub/src/app';
import { HubStore } from '../apps/hub/src/store';

const documentTemplate =
  '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Old title</title><meta name="description" content="Old description"><meta name="robots" content="noindex"><link rel="canonical" href="https://old.example/"><meta property="og:url" content="https://old.example/"><script type="application/ld+json">{"old":true}</script></head><body><div id="root"></div><script src="/assets/main-abcdefgh.js" type="module"></script></body></html>';

describe('public metadata configuration', () => {
  it('accepts explicit HTTPS origins and local HTTP QA origins while rejecting unsafe or ambiguous URLs', () => {
    expect(parseSiteUrl(' https://Smriva.example/ ')).toBe('https://smriva.example');
    expect(parseSiteUrl('http://localhost:3001')).toBe('http://localhost:3001');
    expect(parseSiteUrl('http://127.0.0.1:3002')).toBe('http://127.0.0.1:3002');
    expect(parseSiteUrl('http://[::1]:3001')).toBe('http://[::1]:3001');
    for (const raw of [
      undefined,
      '',
      'not a URL',
      'http://smriva.example',
      'https://user:pass@smriva.example',
      'https://smriva.example/path',
      'https://smriva.example/?key=value',
      'https://smriva.example/#fragment',
      'javascript:alert(1)',
      'ftp://smriva.example',
    ])
      expect(parseSiteUrl(raw)).toBeUndefined();
  });
  it('publishes metadata for public pages only, never record IDs or private URLs', () => {
    expect(publicRouteMeta('/')?.title).toContain('Smriva');
    expect(publicRouteMeta('/about')?.title).toContain('About Smriva');
    for (const path of [
      '/app/today',
      '/app/children/private-child-name',
      '/admin',
      '/recover',
      '/lab',
      '/unknown',
    ])
      expect(publicRouteMeta(path)).toBeUndefined();
  });
  it('replaces restrictive shell metadata on public pages and strips old or private canonical hints', () => {
    const rendered = renderDocument(documentTemplate, {
      path: '/',
      siteUrl: 'https://smriva.example',
      publicMarkup: '<main><h1>Public offline records</h1></main>',
    });
    expect(rendered).toContain('<h1>Public offline records</h1>');
    expect(rendered).toContain('name="robots" content="index, follow, max-image-preview:large"');
    expect(rendered).toContain('rel="canonical" href="https://smriva.example/"');
    expect(rendered).toContain('name="smriva-site-url" content="https://smriva.example"');
    expect(rendered).toContain('property="og:image" content="https://smriva.example/social-card.png"');
    expect(rendered).toContain('name="twitter:image" content="https://smriva.example/social-card.png"');
    expect(rendered).not.toContain('noindex');
    expect(rendered).not.toContain('old.example');
    expect(rendered).not.toContain('"old":true');
    expect(rendered.match(/<title>/g)).toHaveLength(1);
    const privateDocument = renderDocument(documentTemplate, {
      path: '/app/children/private-child-name',
      siteUrl: 'https://smriva.example',
      publicMarkup: '<h1>Should not enter a private shell</h1>',
    });
    expect(privateDocument).toContain('noindex, nofollow, noarchive');
    expect(privateDocument).not.toContain('private-child-name');
    expect(privateDocument).not.toContain('rel="canonical"');
    expect(privateDocument).not.toContain('og:url');
    expect(privateDocument).not.toContain('Should not enter');
    expect(privateDocument).not.toContain('application/ld+json');
    expect(privateDocument).toContain('name="smriva-site-url" content="https://smriva.example"');
  });
});

describe('HTTP crawl boundaries and real status codes', () => {
  let store: HubStore, server: Server | undefined, directory: string, origin: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'smriva-site-test-'));
    mkdirSync(join(directory, 'site'));
    mkdirSync(join(directory, 'assets'));
    writeFileSync(join(directory, 'index.html'), documentTemplate);
    writeFileSync(
      join(directory, 'site', 'home.html'),
      '<main><h1>Offline health and education</h1><a href="/app/today">Open workspace</a></main>',
    );
    writeFileSync(
      join(directory, 'site', 'about.html'),
      '<main><h1>About Smriva</h1><p>Sources and deployment limits.</p></main>',
    );
    writeFileSync(join(directory, 'assets', 'main-abcdefgh.js'), 'console.log("Smriva");');
    writeFileSync(
      join(directory, 'assets', 'main-abcdefgh.js.br'),
      brotliCompressSync('console.log("Smriva");'),
    );
    writeFileSync(join(directory, 'assets', 'main-abcdefgh.js.gz'), gzipSync('console.log("Smriva");'));
    writeFileSync(join(directory, 'sw.js'), '// worker');
    writeFileSync(join(directory, 'browser-help.js'), '// legacy browser help');
    writeFileSync(join(directory, 'unlisted.json'), '{"internal":"not a public asset"}');
    store = new HubStore(':memory:', randomBytes(32).toString('hex'));
  });
  async function start(siteUrl?: string) {
    const app = createApp(store);
    installSiteRoutes(app, { distDir: directory, siteUrl });
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  }
  async function rawAsset(encoding: string, additionalHeaders: Record<string, string> = {}) {
    return new Promise<{ status: number; headers: import('node:http').IncomingHttpHeaders; body: Buffer }>(
      (done, reject) => {
        const request = httpRequest(
          origin + '/assets/main-abcdefgh.js',
          { headers: { 'Accept-Encoding': encoding, ...additionalHeaders } },
          (response) => {
            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            response.on('end', () =>
              done({ status: response.statusCode!, headers: response.headers, body: Buffer.concat(chunks) }),
            );
            response.on('error', reject);
          },
        );
        request.on('error', reject);
        request.end();
      },
    );
  }
  afterEach(async () => {
    if (server) await new Promise<void>((done) => server!.close(() => done()));
    server = undefined;
    store.close();
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('smriva-site-test-'))
      throw new Error('Unexpected cleanup target');
    rmSync(target, { recursive: true, force: true });
  });
  it('returns indexable HTML before JavaScript, trusted canonical URLs, and a CSP hash for actual structured data', async () => {
    await start('https://smriva.example');
    const response = await fetch(origin + '/', { headers: { Host: 'poisoned.example' } });
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(body).toContain('<h1>Offline health and education</h1>');
    expect(body).toContain('href="https://smriva.example/"');
    expect(body).not.toContain('poisoned.example');
    expect(response.headers.get('x-robots-tag')).toBeNull();
    const script = body.match(
      /<script type="application\/ld\+json" id="smriva-structured-data">([\s\S]*?)<\/script>/,
    )?.[1];
    expect(script).toBeTruthy();
    expect(JSON.parse(script!)['@type']).toBe('WebApplication');
    const hash = createHash('sha256').update(script!).digest('base64');
    expect(response.headers.get('content-security-policy')).toContain("'sha256-" + hash + "'");
    const about = await fetch(origin + '/about');
    expect(about.status).toBe(200);
    const aboutBody = await about.text();
    expect(aboutBody).toContain('<h1>About Smriva</h1>');
    expect(aboutBody).toContain('href="https://smriva.example/about"');
    expect(aboutBody).toContain('"@type":"AboutPage"');
  });
  it('omits domain claims without SITE_URL and returns an honest empty sitemap', async () => {
    await start();
    const body = await (await fetch(origin + '/')).text();
    expect(body).not.toContain('rel="canonical"');
    expect(body).not.toContain('property="og:');
    expect(body).not.toContain('application/ld+json');
    const sitemap = await fetch(origin + '/sitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(await sitemap.text()).not.toContain('<loc>');
    expect(sitemap.headers.get('x-robots-tag')).toContain('noindex');
    expect(await (await fetch(origin + '/robots.txt')).text()).not.toContain('Sitemap:');
  });
  it('marks every known private page and API response noindex without rendering record-specific metadata', async () => {
    await start('https://smriva.example');
    for (const path of [
      '/app/today',
      '/app/children',
      '/app/children/private-person',
      '/app/school',
      '/app/health',
      '/app/library',
      '/app/sync',
      '/app/conflicts',
      '/app/settings',
      '/admin',
      '/recover',
      '/lab/scenario',
    ]) {
      const response = await fetch(origin + path);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
      expect(response.headers.get('cache-control')).toBe('no-store');
      const body = await response.text();
      expect(body).toContain('name="robots" content="noindex, nofollow, noarchive"');
      expect(body).not.toContain('private-person');
      expect(body).not.toContain('rel="canonical"');
    }
    for (const path of ['/api/health', '/api/children', '/API/health']) {
      const response = await fetch(origin + path);
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
    }
  });
  it('returns real noindex 404s for unknown pages and missing assets without exposing prerender files', async () => {
    await start('https://smriva.example');
    for (const path of [
      '/does-not-exist',
      '/app/not-real',
      '/assets/missing.js',
      '/assets',
      '/site/home.html',
      '/%73ite/home.html',
      '/assets/..%2fsite/home.html',
      '/unlisted.json',
      '/ABOUT',
      '/assets/main-abcdefgh.js.br',
      '/assets/main-abcdefgh.js.gz',
    ]) {
      const response = await fetch(origin + path);
      expect(response.status, path).toBe(404);
      expect(response.headers.get('x-robots-tag')).toContain('noindex');
      expect(await response.text()).toContain('<h1>Page not found</h1>');
    }
  });
  it('redirects only aliases and trailing slashes, never the canonical about page itself', async () => {
    await start();
    for (const path of ['/attributions', '/partners', '/about/']) {
      const response = await fetch(origin + path, { redirect: 'manual' });
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toBe('/about');
    }
    expect((await fetch(origin + '/about', { redirect: 'manual' })).status).toBe(200);
    const index = await fetch(origin + '/index.html', { redirect: 'manual' });
    expect(index.status).toBe(308);
    expect(index.headers.get('location')).toBe('/');
  });
  it('serves a direct private app shell for service-worker installation without redirecting the index alias', async () => {
    await start('https://smriva.example');
    const response = await fetch(origin + '/app-shell.html');
    expect(response.status).toBe(200);
    expect(response.redirected).toBe(false);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.text();
    expect(body).toContain('name="robots" content="noindex, nofollow, noarchive"');
    expect(body).toContain('<div id="root"></div>');
    expect(body).toContain('<script src="/assets/main-abcdefgh.js" type="module"></script>');
    expect(body).not.toContain('rel="canonical"');
    expect(body).not.toContain('application/ld+json');
    expect(body).not.toContain('<h1>Offline health and education</h1>');
    expect(body).not.toContain('<h1>About Smriva</h1>');
    const index = await fetch(origin + '/index.html', { redirect: 'manual' });
    expect(index.status).toBe(308);
    expect(index.headers.get('location')).toBe('/');
  });
  it('lists only public pages in the configured sitemap while allowing private HTML to be crawled for noindex', async () => {
    await start('https://smriva.example');
    const xml = await (await fetch(origin + '/sitemap.xml')).text();
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml).toContain('<loc>https://smriva.example/</loc>');
    expect(xml).toContain('<loc>https://smriva.example/about</loc>');
    expect(xml).not.toContain('/app');
    const robots = await (await fetch(origin + '/robots.txt')).text();
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Sitemap: https://smriva.example/sitemap.xml');
    expect(robots).not.toContain('Disallow: /app');
    expect(robots).not.toContain('Disallow: /recover');
  });
  it('caches versioned assets immutably while keeping the service worker revalidatable', async () => {
    await start();
    const asset = await fetch(origin + '/assets/main-abcdefgh.js');
    expect(asset.status).toBe(200);
    expect(asset.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(await asset.text()).toBe('console.log("Smriva");');
    const worker = await fetch(origin + '/sw.js');
    expect(worker.status).toBe(200);
    expect(worker.headers.get('cache-control')).toBe('no-cache');
  });
  it('serves the legacy browser helper so offline precaching does not fail on a missing asset', async () => {
    await start();
    const helper = await fetch(origin + '/browser-help.js');
    expect(helper.status).toBe(200);
    expect(helper.headers.get('content-type')).toMatch(/javascript/);
    expect(await helper.text()).toBe('// legacy browser help');
    const page = await fetch(origin + '/app/today');
    expect(page.headers.get('content-security-policy')).not.toContain('upgrade-insecure-requests');
  });
  it('negotiates compressed build assets by quality and keeps identity, ETag and range responses consistent', async () => {
    await start();
    const brotli = await rawAsset('gzip;q=0.5, br;q=1');
    expect(brotli.status).toBe(200);
    expect(brotli.headers['content-encoding']).toBe('br');
    expect(brotli.headers['content-type']).toContain('javascript');
    expect(brotli.headers.vary).toContain('Accept-Encoding');
    expect(brotli.headers['cache-control']).toContain('immutable');
    expect(brotliDecompressSync(brotli.body).toString()).toBe('console.log("Smriva");');
    const gzip = await rawAsset('br;q=0, gzip;q=1');
    expect(gzip.headers['content-encoding']).toBe('gzip');
    expect(gunzipSync(gzip.body).toString()).toBe('console.log("Smriva");');
    const identity = await rawAsset('br;q=0, gzip;q=0, *;q=0');
    expect(identity.headers['content-encoding']).toBeUndefined();
    expect(identity.body.toString()).toBe('console.log("Smriva");');
    const invalidQuality = await rawAsset('br;q=wrong, gzip;q=2');
    expect(invalidQuality.headers['content-encoding']).toBeUndefined();
    const unchanged = await rawAsset('br', { 'If-None-Match': String(brotli.headers.etag) });
    expect(unchanged.status).toBe(304);
    expect(unchanged.body).toHaveLength(0);
    const range = await rawAsset('br', { Range: 'bytes=0-2' });
    expect(range.status).toBe(200);
    expect(range.headers['accept-ranges']).toBe('none');
    expect(brotliDecompressSync(range.body).toString()).toBe('console.log("Smriva");');
  });
  it('reports an unavailable public build as 503 with noindex instead of publishing an empty shell', async () => {
    unlinkSync(join(directory, 'site', 'home.html'));
    await start('https://smriva.example');
    const response = await fetch(origin + '/');
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
    expect(await response.text()).toContain('<h1>Public page unavailable</h1>');
  });
});
