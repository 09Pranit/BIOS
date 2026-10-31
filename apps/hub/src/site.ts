import express, { type Express, type RequestHandler, type Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, join, posix, resolve } from 'node:path';
import { parseSiteUrl, publicRouteMeta } from '../../../packages/site/config';

const privateRobots = 'noindex, nofollow, noarchive';
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const privatePath = (path: string) => /^\/(?:app|admin|recover|lab|api)(?:\/|$)/i.test(path);
const knownWorkspacePath = (path: string) =>
  /^\/app\/(?:today|children(?:\/[^/]+)?|school|health|library|sync|conflicts|settings)\/?$/.test(path) ||
  /^\/(?:admin|recover)\/?$/.test(path) ||
  /^\/lab(?:\/.*)?$/.test(path);

/** Mount before API handlers as well as the site routes. */
export const siteRobotsHeaders: RequestHandler = (req, res, next) => {
  if (privatePath(req.path)) res.setHeader('X-Robots-Tag', privateRobots);
  next();
};

type DocumentOptions = {
  path: string;
  siteUrl?: string;
  /** Trusted, build-generated public body content, never a record projection. */
  publicMarkup?: string;
  notFound?: boolean;
  unavailable?: boolean;
};

function structuredData(path: string, siteUrl?: string) {
  const origin = parseSiteUrl(siteUrl);
  const meta = publicRouteMeta(path);
  if (!origin || !meta) return undefined;
  const data =
    path === '/'
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Smriva',
          url: origin + '/',
          description: meta.description,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web browser',
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: meta.title,
          url: origin + '/about',
          description: meta.description,
          isPartOf: { '@type': 'WebSite', name: 'Smriva', url: origin + '/' },
        };
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function allowStructuredData(res: Response, path: string, siteUrl?: string) {
  const data = structuredData(path, siteUrl);
  if (!data) return;
  const hash = "'sha256-" + createHash('sha256').update(data).digest('base64') + "'";
  const csp = String(res.getHeader('Content-Security-Policy') ?? "script-src 'self'");
  res.setHeader(
    'Content-Security-Policy',
    /(?:^|;)\s*script-src\s/.test(csp)
      ? csp.replace(/((?:^|;)\s*script-src\s+[^;]+)/, '$1 ' + hash)
      : csp + ";script-src 'self' " + hash,
  );
}

export function renderDocument(template: string, options: DocumentOptions): string {
  const meta = publicRouteMeta(options.path);
  const origin = parseSiteUrl(options.siteUrl);
  const title =
    meta?.title ??
    (options.notFound
      ? 'Page not found — Smriva'
      : options.unavailable
        ? 'Public page unavailable — Smriva'
        : 'Smriva workspace — Private records');
  const description =
    meta?.description ??
    'Open your device’s encrypted Smriva workspace. Personal school and health records are private.';
  const managedMeta = (tag: string) => {
    const name = tag.match(/\b(?:name|property)\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase();
    return (
      name === 'description' ||
      name === 'robots' ||
      name === 'googlebot' ||
      name === 'smriva-site-url' ||
      name?.startsWith('og:') ||
      name?.startsWith('twitter:')
    );
  };
  let document = template
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, (tag) => (managedMeta(tag) ? '' : tag))
    .replace(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, (tag) => (/\brel\s*=\s*(["'])canonical\1/i.test(tag) ? '' : tag));
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${meta ? 'index, follow, max-image-preview:large' : privateRobots}" />`,
  ];
  if (origin) tags.push(`<meta name="smriva-site-url" content="${escapeHtml(origin)}" />`);
  if (meta && origin) {
    const canonical = new URL(options.path, origin).href;
    tags.push(
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
      '<meta property="og:type" content="website" />',
      '<meta property="og:site_name" content="Smriva" />',
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
      `<meta property="og:image" content="${escapeHtml(origin + '/social-card.png')}" />`,
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      '<meta property="og:image:alt" content="Smriva — offline-first health and education records" />',
      '<meta name="twitter:card" content="summary_large_image" />',
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
      `<meta name="twitter:image" content="${escapeHtml(origin + '/social-card.png')}" />`,
      '<meta name="twitter:image:alt" content="Smriva — offline-first health and education records" />',
      `<script type="application/ld+json" id="smriva-structured-data">${structuredData(options.path, origin)}</script>`,
    );
  }
  document = document.replace(/<\/head>/i, tags.join('\n') + '\n</head>');
  const markup = meta
    ? (options.publicMarkup ?? '')
    : options.unavailable
      ? '<main class="standalone"><h1>Public page unavailable</h1><p>The public page is being prepared. You can still open your saved workspace.</p><a href="/app/today">Open workspace</a></main>'
      : options.notFound
        ? '<main class="standalone"><h1>Page not found</h1><p>This page is unavailable. Your saved workspace is unchanged.</p><a href="/">Smriva home</a> <a href="/app/today">Open workspace</a></main>'
        : '';
  return document.replace(
    /<div\s+id\s*=\s*(["'])root\1\s*>\s*<\/div>/i,
    () => `<div id="root">${markup}</div>`,
  );
}

type SiteOptions = { distDir: string; siteUrl?: string };
const minimalTemplate =
  '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>';

function publicAssetPath(path: string) {
  try {
    const decoded = decodeURIComponent(path);
    if (decoded.includes('\\') || decoded.includes('\0')) return false;
    const normalized = posix.normalize(decoded);
    if (/\.(?:br|gz)$/i.test(normalized)) return false;
    return (
      (/^\/assets\/[a-z0-9][a-z0-9_.-]*$/i.test(normalized) && !/\.html$/i.test(normalized)) ||
      /^\/lessons\/[a-z0-9_-]+\.json$/i.test(normalized) ||
      /^\/government\/[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(normalized) ||
      /^\/learning\/[a-z0-9-]+\.svg$/i.test(normalized) ||
      /^\/(?:favicon\.svg|icon\.svg|apple-touch-icon\.png|icon-192\.png|icon-512\.png|social-card\.png|manifest\.webmanifest|sw\.js|workbox-[\w-]+\.js|registerSW\.js|browser-help\.js|benchmark-results\.json|education-snapshot\.json)$/.test(
        normalized,
      )
    );
  } catch {
    return false;
  }
}

function acceptedEncodings(header?: string): ('br' | 'gzip')[] {
  const qualities = new Map<string, number>();
  for (const item of (header ?? '').toLowerCase().split(',')) {
    const [name, ...parameters] = item.trim().split(';');
    if (!name) continue;
    const parameter = parameters.map((part) => part.trim()).find((part) => /^q\s*=/.test(part));
    const value = parameter ? parameter.replace(/^q\s*=\s*/, '') : '1';
    const quality = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value) ? Number(value) : 0;
    qualities.set(name, quality);
  }
  return (['br', 'gzip'] as const)
    .map((encoding) => ({ encoding, quality: qualities.get(encoding) ?? qualities.get('*') ?? 0 }))
    .filter(({ quality }) => quality > 0)
    .sort((left, right) => right.quality - left.quality)
    .map(({ encoding }) => encoding);
}

/** HTTP routes are explicit so missing URLs and assets cannot become indexable SPA soft-404s. */
export function installSiteRoutes(app: Express, options: SiteOptions) {
  const distDir = resolve(options.distDir);
  const origin = parseSiteUrl(options.siteUrl);
  const template = () => {
    const path = join(distDir, 'index.html');
    return existsSync(path) ? readFileSync(path, 'utf8') : minimalTemplate;
  };
  app.use(siteRobotsHeaders);
  app.get('/robots.txt', (_req, res) => {
    const robots = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /api$',
      'Disallow: /data/',
      'Disallow: /backups/',
      'Disallow: /site/',
      ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : []),
    ];
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('text/plain').send(robots.join('\n') + '\n');
  });
  app.get('/sitemap.xml', (_req, res) => {
    res.setHeader('X-Robots-Tag', privateRobots);
    res.setHeader('Cache-Control', origin ? 'public, max-age=300' : 'no-store');
    const urls = origin
      ? ['/', '/about']
          .map((path) => `<url><loc>${escapeHtml(new URL(path, origin).href)}</loc></url>`)
          .join('')
      : '';
    res
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
      );
  });
  // Workbox precaches this stable URL directly; the public index alias remains a redirect.
  app.get('/app-shell.html', (req, res, next) => {
    if (req.path !== '/app-shell.html') return next();
    res.setHeader('X-Robots-Tag', privateRobots);
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(renderDocument(template(), { path: '/app-shell.html' }));
  });
  app.use((req, res, next) => {
    if (
      ['GET', 'HEAD'].includes(req.method) &&
      ['/attributions', '/attributions/', '/partners', '/partners/', '/about/', '/index.html'].includes(
        req.path,
      )
    )
      return res.redirect(308, req.path === '/index.html' ? '/' : '/about');
    next();
  });
  app.get(['/', '/about'], (req, res, next) => {
    if (!publicRouteMeta(req.path)) return next();
    const publicPath = req.path === '/about' ? '/about' : '/';
    const markupPath = join(distDir, 'site', publicPath === '/' ? 'home.html' : 'about.html');
    if (!existsSync(markupPath)) {
      res.setHeader('X-Robots-Tag', privateRobots);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Retry-After', '60');
      return res
        .status(503)
        .type('html')
        .send(renderDocument(template(), { path: '/unavailable', unavailable: true }));
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
    allowStructuredData(res, publicPath, origin);
    res.type('html').send(
      renderDocument(template(), {
        path: publicPath,
        siteUrl: origin,
        publicMarkup: readFileSync(markupPath, 'utf8'),
      }),
    );
  });
  app.get(['/app', '/app/'], (_req, res) => res.redirect(308, '/app/today'));
  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method) || !knownWorkspacePath(req.path)) return next();
    res.setHeader('X-Robots-Tag', privateRobots);
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(renderDocument(template(), { path: req.path }));
  });
  const serveFiles = express.static(distDir, {
    index: false,
    redirect: false,
    dotfiles: 'deny',
    acceptRanges: false,
    setHeaders(res, path) {
      const file = basename(path).replace(/\.(?:br|gz)$/i, '');
      const immutable = /[\\/]assets[\\/]/.test(path) && /-[\w-]{8,}\.[a-z0-9]+$/i.test(file);
      res.setHeader(
        'Cache-Control',
        immutable
          ? 'public, max-age=31536000, immutable'
          : /^(?:sw|workbox-).*\.js$/i.test(file)
            ? 'no-cache'
            : 'public, max-age=300',
      );
    },
  });
  app.use((req, res, next) => {
    if (!publicAssetPath(req.path)) return next();
    const normalized = posix.normalize(decodeURIComponent(req.path));
    const originalUrl = req.url;
    let compressed = false;
    if (/^\/assets\/.*\.(?:js|css)$/i.test(normalized) && ['GET', 'HEAD'].includes(req.method)) {
      res.vary('Accept-Encoding');
      const sourcePath = join(distDir, normalized.slice(1));
      if (existsSync(sourcePath)) {
        for (const encoding of acceptedEncodings(req.get('Accept-Encoding'))) {
          const suffix = encoding === 'br' ? '.br' : '.gz';
          if (!existsSync(sourcePath + suffix)) continue;
          const query = originalUrl.indexOf('?');
          req.url =
            query < 0
              ? originalUrl + suffix
              : originalUrl.slice(0, query) + suffix + originalUrl.slice(query);
          res.setHeader('Content-Encoding', encoding);
          res.setHeader('Accept-Ranges', 'none');
          res.type(normalized.endsWith('.css') ? 'text/css' : 'text/javascript');
          compressed = true;
          break;
        }
      }
    }
    serveFiles(req, res, (error) => {
      req.url = originalUrl;
      if (compressed && !res.headersSent) {
        res.removeHeader('Content-Encoding');
        res.removeHeader('Accept-Ranges');
        res.removeHeader('Content-Type');
      }
      next(error);
    });
  });
  app.use((_req, res) => {
    res.setHeader('X-Robots-Tag', privateRobots);
    res.setHeader('Cache-Control', 'no-store');
    res
      .status(404)
      .type('html')
      .send(renderDocument(template(), { path: '/not-found', notFound: true }));
  });
}
