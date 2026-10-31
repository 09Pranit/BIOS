import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : (args[index + 1] ?? fallback);
};
const base = option('--base', 'http://localhost:3001');
const output = resolve(option('--out', 'docs/site-audit-before.json'));
const executablePath =
  process.env.CHROME_PATH ||
  (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);
const result = {
  generatedAt: new Date().toISOString(),
  base,
  scope:
    'Public routes only; fresh isolated browser storage. No enrollment, credentials or record values collected.',
  methodology:
    'Browser navigation and aggregate DOM checks. Transfer sizes are browser-reported, not mobile network measurements. Name checks are a heuristic, not a complete WCAG audit.',
  http: [],
  pages: [],
};
const headerNames = [
  'content-type',
  'cache-control',
  'content-security-policy',
  'referrer-policy',
  'x-content-type-options',
  'x-frame-options',
  'cross-origin-resource-policy',
];
for (const path of [
  '/',
  '/about',
  '/recover',
  '/robots.txt',
  '/sitemap.xml',
  '/missing-audit-file.js',
  '/api/missing-audit-route',
]) {
  try {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(10000) });
    const body = await response.text();
    result.http.push({
      path,
      status: response.status,
      headers: Object.fromEntries(headerNames.map((name) => [name, response.headers.get(name)])),
      bytes: Buffer.byteLength(body),
      htmlFallback: /<!doctype html>/i.test(body),
    });
  } catch (error) {
    result.http.push({ path, errorType: error.name });
  }
}
const browser = await chromium.launch({ headless: true, executablePath });
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
    try {
      for (const path of ['/app/today', '/about', '/recover']) {
        const page = await context.newPage();
        let consoleErrors = 0,
          pageErrors = 0;
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors++;
        });
        page.on('pageerror', () => pageErrors++);
        try {
          const response = await page.goto(new URL(path, base).href, {
            waitUntil: 'networkidle',
            timeout: 20000,
          });
          const metrics = await page.evaluate(() => {
            const visible = (element) =>
              Boolean(element.getClientRects().length) && getComputedStyle(element).visibility !== 'hidden';
            const inputName = (element) =>
              Boolean(
                element.getAttribute('aria-label')?.trim() ||
                element.getAttribute('aria-labelledby')?.trim() ||
                element.labels?.length ||
                (['submit', 'button'].includes(element.type) && element.value),
              );
            const controlName = (element) =>
              Boolean(
                element.getAttribute('aria-label')?.trim() ||
                element.getAttribute('aria-labelledby')?.trim() ||
                element.getAttribute('title')?.trim() ||
                element.textContent?.trim(),
              );
            const controls = [
              ...document.querySelectorAll(
                'button, input:not([type="hidden"]), select, textarea, a[href], summary',
              ),
            ].filter(visible);
            const formControls = controls.filter((element) =>
              ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName),
            );
            const resources = performance.getEntriesByType('resource');
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
              title: document.title,
              meta: Object.fromEntries(
                ['description', 'robots', 'theme-color'].map((name) => [
                  name,
                  document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? null,
                ]),
              ),
              canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
              documentLanguage: document.documentElement.lang,
              horizontalOverflowPixels: Math.max(0, document.documentElement.scrollWidth - innerWidth),
              h1Count: document.querySelectorAll('h1').length,
              mainLandmarks: document.querySelectorAll('main, [role="main"]').length,
              visibleControls: controls.length,
              inputsWithoutLabels: formControls.filter((element) => !inputName(element)).length,
              buttonsOrLinksWithoutNames: controls.filter(
                (element) => ['BUTTON', 'A'].includes(element.tagName) && !controlName(element),
              ).length,
              targetsBelow44Pixels: controls.filter((element) => {
                const { width, height } = element.getBoundingClientRect();
                return width < 44 || height < 44;
              }).length,
              alertRegions: document.querySelectorAll('[role="alert"], [aria-live="assertive"]').length,
              statusRegions: document.querySelectorAll('[role="status"], [aria-live="polite"]').length,
              performance: {
                navigationTransferBytes: navigation?.transferSize ?? null,
                resourceTransferBytes: resources.reduce((total, item) => total + item.transferSize, 0),
                resourceCount: resources.length,
                domContentLoadedMs: navigation
                  ? Math.round(navigation.domContentLoadedEventEnd - navigation.startTime)
                  : null,
                loadMs: navigation ? Math.round(navigation.loadEventEnd - navigation.startTime) : null,
              },
            };
          });
          let unnamedKeyboardTargets = 0;
          const focusKinds = [];
          for (let index = 0; index < Math.min(metrics.visibleControls, 16); index++) {
            await page.keyboard.press('Tab');
            const focus = await page.evaluate(() => {
              const element = document.activeElement;
              return {
                kind: element?.tagName ?? 'NONE',
                named: Boolean(
                  element?.getAttribute('aria-label') ||
                  element?.getAttribute('aria-labelledby') ||
                  element?.getAttribute('title') ||
                  element?.textContent?.trim() ||
                  element?.labels?.length ||
                  element?.value,
                ),
              };
            });
            focusKinds.push(focus.kind);
            if (!focus.named && focus.kind !== 'BODY') unnamedKeyboardTargets++;
          }
          result.pages.push({
            path,
            viewport,
            status: response?.status() ?? null,
            ...metrics,
            keyboard: {
              sampledTargets: focusKinds.length,
              unnamedTargets: unnamedKeyboardTargets,
              elementKinds: focusKinds,
            },
            consoleErrors,
            pageErrors,
          });
        } catch (error) {
          result.pages.push({ path, viewport, errorType: error.name, consoleErrors, pageErrors });
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    output,
    httpChecks: result.http.length,
    pages: result.pages.length,
    overflowPages: result.pages.filter((page) => page.horizontalOverflowPixels > 0).length,
    pageErrors: result.pages.reduce((total, page) => total + (page.pageErrors ?? 0), 0),
    unlabeledInputs: result.pages.reduce((total, page) => total + (page.inputsWithoutLabels ?? 0), 0),
  }),
);
