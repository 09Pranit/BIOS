# Smriva site analysis

Smriva now has a crawlable public introduction, route-specific metadata and protected private indexing rules, with both existing dashboard modes retained. A focused bug audit also fixed local-storage races affecting concurrent tabs and locking.

## Measured entry-route results

Lighthouse **13.5.0**, local Chrome, fresh profiles, mobile and desktop presets. The requested URL was `/`: before, it redirected to the locked workspace; after, it serves the new public introduction. This compares the visitor's entry experience, not identical page content or authenticated-workspace speed.

| Category       | Mobile before | Mobile after | Desktop before | Desktop after |
| -------------- | ------------: | -----------: | -------------: | ------------: |
| Performance    |            70 |          100 |             98 |           100 |
| Accessibility  |            98 |          100 |             98 |           100 |
| Best practices |            96 |          100 |             96 |           100 |
| SEO            |           100 |          100 |            100 |           100 |

The original SEO checklist score was already 100; it did not establish useful public content, good indexing boundaries or search ranking. The structural SEO changes below go beyond that checklist. Scores are local lab observations, not Google rankings or field Core Web Vitals. [Chrome explains score variability](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

Evidence: [baseline summary](site-audit-baseline.json), [after summary](site-audit-after.json), [mobile Lighthouse report](site-audit-after.lighthouse-mobile.json), [desktop Lighthouse report](site-audit-after.lighthouse-desktop.json). Version, emulation settings, timings and runtime-error fields are retained. Exploratory runs with another Lighthouse version are excluded from this comparison.

## Findings and changes

| Finding                                                                                              | Result                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The entry URL redirected straight to setup/unlock and had no server-visible introduction.            | New public home with product explanation, workflow, FAQ and workspace links; home/about body content is rendered during the build.                                                        |
| One generic document title and description served different routes.                                  | Distinct public titles/descriptions, generic private route titles, and no child identifiers or search text in metadata.                                                                   |
| Missing URLs and missing assets fell through to a 200 app shell.                                     | Actual 404 responses and a helpful page; known aliases redirect permanently.                                                                                                              |
| No configured canonical, sitemap, social preview or structured data.                                 | Validated `SITE_URL` enables absolute canonical/social tags, a public-only sitemap and CSP-approved JSON-LD. No public domain is invented locally.                                        |
| Workspace resources loaded on the public entry route.                                                | Complete native public HTML works before JavaScript; workspace code is loaded when needed.                                                                                                |
| Static assets lacked useful long-lived caching and transfer compression.                             | Hashed assets use immutable caching and negotiated prebuilt Brotli/gzip; private/API responses remain no-store.                                                                           |
| Visible labels disagreed with accessible names; landmarks were missing or ambiguous.                 | Native brand labels, correctly named search/lock controls, named sidebar navigation and main/control landmarks. Validation errors announce themselves.                                    |
| Canonical index redirects interfered with offline precaching under the strict local security policy. | A dedicated `/app-shell.html` returns a direct non-indexed 200 response; public canonical redirects remain intact. All precache resources were checked and offline installation verified. |
| Two tabs sharing one device could overwrite each other's encrypted snapshots and reuse counters.     | Atomic ciphertext/revision comparisons and bounded retries preserve both logs and unique counters.                                                                                        |
| Re-reading current storage could falsely mark an unseen competing edit as observed.                  | Causal dependencies retain the tab's observed frontier. Stale conflicting values remain explicit; same-tab and batch ordering still work.                                                 |
| A delayed completion could restore plaintext state after lock.                                       | Generation guards keep the workspace locked even if an already committed save finishes.                                                                                                   |
| Browser schema validation probed eval and triggered a CSP issue.                                     | Optional Zod JIT is disabled before workspace initialization; unsafe-eval is not enabled.                                                                                                 |

## Accessibility and workflow evidence

Eight axe scans covered public home/about and unlocked Standard/Easy home views at desktop and phone widths. No WCAG A/AA violations were detected. Browser regression tests also checked axe best-practice rules, keyboard activation/focus, 44-pixel Easy-mode controls, both themes, phone overflow, no-JavaScript public content, offline reload, conflicts, same-profile tab writes and preserved drafts.

Four automated checks requested human review of the Easy-mode switch's value/label pattern. The switch has a constant “Easy mode” name, `aria-checked` state and visible On/Off value; keyboard activation and the state changes were checked. The incomplete flags remain in the raw evidence. Automated success is not full accessibility certification, and testing with a broader range of assistive technology remains valuable.

The standard dashboard, original data-entry forms, permissions, encryption formats, legacy local databases and recoverable workspaces remain compatible. Source snapshots are preserved in `SetuSync-original-before-Smriva.zip` and `Smriva-before-site-improvements.zip` alongside the updated source archive.

## Validation and remaining deployment work

- 126 unit/integration tests passed, including stale-tab conflicts, queued writes, encryption, storage failures, recovery, API roles, static-route safety and compression negotiation.
- 16 browser scenarios passed, with focused reruns for the final accessibility and concurrency fixes.
- Production build, TypeScript and all nine content-source checks passed.
- `npm audit --omit=dev` reported **zero production-subset advisories**. Critical test-tool advisories were removed by moving to supported Vitest 5; ten low/moderate advisories remain in upstream build-tool dependencies. Details and primary notices are in [SEO/quality operations](SEO.md).

Set the real HTTPS `SITE_URL` when deploying to enable public canonical URLs and sitemap entries. The localhost run cannot establish indexing, traffic or ranking, and no Search Console submission or public deployment was performed. Public content and indexing instructions follow [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics). Existing clinical/privacy/deployment limits remain in [Security](SECURITY.md) and the README.

Reproduce the checks with `npm run build`, `npm test`, `npm run test:e2e` and `npm run audit:site`. The audit uses a separate synthetic database and fresh browser contexts. See [SEO.md](SEO.md) for configuration and the full audit command.

## Library and language follow-up · 31 October 2026

The library now includes eight attributed government-resource images and four original lesson illustrations, with offline previews and verified source/policy links. English, Hindi and Punjabi controls cover the workspace and four original lessons, including phone typography and a persisted offline preference. Follow-up validation passed 131 unit/integration tests, 21 content-source checks and all 23 browser scenarios with focused reruns after fixes. Library and multilingual phone views each passed eight mode/theme accessibility scans. The broader browser run also caught and fixed unclear inline policy links on About; those links are now underlined.

The Lighthouse figures above are the recorded site-audit results. Lighthouse was not rerun for these subsequent library and language changes.
