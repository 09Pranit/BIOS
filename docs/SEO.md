# Smriva SEO and site quality

Public information lives at `/` and `/about`. The build renders their content into HTML, so readers and crawlers can see it before JavaScript runs. The public home uses native links and disclosures and does not load workspace encryption or form code on first paint. Standard and Easy dashboards remain available at `/app/today`.

## Configure the public address

Set `SITE_URL` in the server environment when deploying:

```dotenv
SITE_URL=https://your-real-smriva-domain.org
```

Use the actual HTTPS origin without a path, credentials, query or fragment. This is an example, not a provisioned domain. Docker Compose passes this setting through. New production configuration includes an empty setting for you to fill.

When configured, the server emits absolute canonical URLs, Open Graph and Twitter metadata, the original 1200×630 share card, and public-only JSON-LD. `/sitemap.xml` lists only `/` and `/about`; `/robots.txt` links to that sitemap. Without a configured address, no fake canonical or public origin is invented and the sitemap has no URL entries. A request's Host header never defines the site's public identity.

Use `npm start` for the full server behavior. Vite development/preview servers are UI tools and do not implement the hub's SEO routes. A local localhost audit does not measure Google indexing, search traffic, ranking or real-user Core Web Vitals. Configure the deployed domain and verify it in your own Search Console account after publishing.

## Private records stay out of search metadata

Workspace, recovery, administration and lab HTML receive `noindex, nofollow, noarchive` in both HTML and HTTP headers. API responses also receive an indexing exclusion. Route titles are generic: child names, IDs, PINs, recovery codes and search text are never inserted into page metadata. Public HTML, structured data and sitemaps contain no workspace records.

These indexing instructions complement authentication and encryption; they are not access controls. Private HTML stays crawlable so a crawler can read its noindex directive. API and internal build/storage paths are disallowed in robots.txt. Google explains why an initial noindex directive cannot reliably be removed later by JavaScript and why [server-rendered content and correct HTTP status codes matter](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

`/index.html`, `/attributions` and `/partners` have permanent redirects to their public canonical page. Missing pages and missing assets return actual HTTP 404 responses. The dedicated `/app-shell.html` returns a direct, non-indexed generic shell for offline caching; it never redirects or includes personal records. Public canonical redirects therefore do not interfere with service-worker installation on HTTP localhost.

## Asset and accessibility work

Hashed JavaScript/CSS assets have immutable caching and prebuilt Brotli/gzip variants, with content negotiation and Vary headers. API responses and private page responses remain no-store. Raster app icons and an Apple touch icon accompany the original vector artwork. To regenerate them from their vector sources:

```sh
npm run assets:prepare
npm run build
```

Asset generation uses installed Chrome through Playwright (`CHROME_PATH` may select it), or Playwright's installed browser. Ordinary builds use the committed PNGs and do not require Chrome.

The interface uses matching visible/accessibility labels, uniquely named navigation landmarks, main landmarks, announced validation errors, visible focus, and both existing dashboard modes. Automated accessibility checks are supplemented by keyboard, phone-layout, offline and data-preservation browser scenarios. Passing an automated scan does not establish complete accessibility certification.

## Reproduce the audit

```sh
npm run build
npm test
npm run test:e2e
npm run audit:site
```

`audit:site` starts an isolated synthetic hub on port 3003 with a separate ignored database and fresh browser contexts. It records real Lighthouse mobile/desktop scores, axe checks, HTTP metadata/statuses and navigation timings. It never uses a saved user browser profile. For screenshots, pass `-- --screenshots` to the npm command. For an existing deployed Smriva hub, run `node scripts/quality-audit.mjs --url https://your-domain.org --public-only --lighthouse --out docs/deployed-audit.json`; controlled hubs do not undergo synthetic private enrollment.

Lighthouse is pinned to 13.5.0 for comparable evidence. [Chrome documents how hardware, networking and resource contention affect scores](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring). These are local lab measurements, not field traffic data. The reports retain configuration, failures and runtime errors rather than inventing scores for incomplete runs.

The production dependency subset is recorded in `dependency-audit-runtime.json`. Ten low/moderate advisories remain in upstream build tooling (Workbox's dependency tree), while critical test-tool advisories were removed. Supported updates cannot eliminate the remaining advisories at this snapshot; forced major transitive overrides were avoided. See the [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), [Glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) and [Minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) upstream notices.
