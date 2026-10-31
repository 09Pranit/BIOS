import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : (args[index + 1] ?? fallback);
};
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const origin = option('--url', 'http://127.0.0.1:3003').replace(/\/$/, '');
const auditAddress = new URL(origin);
if (
  !['http:', 'https:'].includes(auditAddress.protocol) ||
  auditAddress.username ||
  auditAddress.password ||
  auditAddress.pathname !== '/' ||
  auditAddress.search ||
  auditAddress.hash
) {
  throw new Error('Use an HTTP(S) origin without credentials, a path, query or fragment.');
}
const output = resolve(option('--out', '.tools/site-audit.json'));
const phase = option('--phase', 'local');
const serve = args.includes('--serve');
const lighthouseOnly = args.includes('--lighthouse-only');
const publicOnly = args.includes('--public-only');
const screenshots = args.includes('--screenshots');
const runLighthouse = args.includes('--lighthouse') || lighthouseOnly;
const formFactors = option('--form-factors', 'mobile,desktop').split(',');
if (formFactors.some((value) => !['mobile', 'desktop'].includes(value)))
  throw new Error('Use --form-factors mobile,desktop.');
const chromePath =
  process.env.CHROME_PATH ||
  (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : undefined);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
mkdirSync(dirname(output), { recursive: true });

async function healthy(url) {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(url + '/api/health', { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('The audit hub did not become available within 30 seconds.');
}

let server;
let browser;
const report = {
  phase,
  measuredAt: new Date().toISOString(),
  origin,
  method: {
    browser: 'Chromium through Playwright, fresh contexts; no saved user browser profile',
    scope:
      'Synthetic local demonstration only; automated checks do not establish complete accessibility or production readiness.',
    axeTags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    requested: {
      accessibility: !lighthouseOnly,
      syntheticWorkspace: !lighthouseOnly && !publicOnly,
      lighthouse: runLighthouse,
    },
    privacy:
      'No PINs, recovery codes, tokens, record text, DOM HTML or screenshots are included. Accessibility selectors have attribute values removed.',
    timing:
      'Navigation timings are unthrottled local observations, not a Lighthouse score or field Core Web Vitals.',
    node: process.version,
  },
  pages: [],
  accessibility: [],
  lighthouse: [],
  warnings: [],
};

function safeTarget(target) {
  return target.map((part) =>
    typeof part === 'string' ? part.replace(/\[[^\]]*\]/g, '[attribute]') : '[shadow target]',
  );
}

async function inspect(page, path, viewport) {
  const response = await page.goto(origin + path, { waitUntil: 'networkidle' });
  const values = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      path: location.pathname,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      h1Count: document.querySelectorAll('h1').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      navigation: navigation
        ? {
            responseStartMs: Math.round(navigation.responseStart),
            domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
            loadMs: Math.round(navigation.loadEventEnd),
            transferBytes: navigation.transferSize,
          }
        : null,
    };
  });
  report.pages.push({
    requestedPath: path,
    viewport,
    status: response?.status() ?? null,
    xRobotsTag: response?.headers()['x-robots-tag'] ?? null,
    ...values,
  });
}

async function accessibility(page, name, viewport, AxeBuilder) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summarize = (rule) => ({
    id: rule.id,
    impact: rule.impact,
    help: rule.help,
    helpUrl: rule.helpUrl,
    affectedNodes: rule.nodes.length,
    targets: rule.nodes.map((node) => safeTarget(node.target)),
  });
  report.accessibility.push({
    name,
    viewport,
    engine: results.testEngine,
    violations: results.violations.map(summarize),
    incomplete: results.incomplete.map(summarize),
    passedRules: results.passes.length,
  });
  console.log(
    `${name} ${viewport}: axe ${results.violations.length} violations (${results.violations.map((rule) => rule.id).join(', ') || 'none'}); ${results.incomplete.length} checks need human review.`,
  );
}

async function measureLighthouse() {
  let lighthouse;
  let launch;
  let desktopConfig;
  try {
    lighthouse = (await import('lighthouse')).default;
    launch = (await import('chrome-launcher')).launch;
    desktopConfig = (await import('lighthouse/core/config/desktop-config.js')).default;
  } catch {
    report.warnings.push(
      'Lighthouse was requested but its package or Chrome launcher is unavailable. No Lighthouse scores were produced.',
    );
    process.exitCode = 1;
    return;
  }
  for (const formFactor of formFactors) {
    const chrome = await launch({
      chromePath,
      chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run'],
    });
    try {
      const result = await lighthouse(
        origin + '/',
        {
          port: chrome.port,
          logLevel: 'error',
          output: 'json',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        },
        formFactor === 'desktop' ? desktopConfig : undefined,
      );
      if (!result?.lhr) throw new Error('Lighthouse did not return a result.');
      const lhr = result.lhr;
      if (lhr.runtimeError) process.exitCode = 1;
      if (lhr.configSettings.formFactor !== formFactor)
        throw new Error('Lighthouse emulation did not match the requested form factor.');
      // Public pages only. Omit embedded page imagery from reproducible JSON evidence.
      delete lhr.fullPageScreenshot;
      for (const id of ['final-screenshot', 'screenshot-thumbnails', 'full-page-screenshot'])
        delete lhr.audits[id];
      const rawPath = output.replace(/\.json$/i, '') + `.lighthouse-${formFactor}.json`;
      writeFileSync(rawPath, JSON.stringify(lhr, null, 2));
      const scores = Object.fromEntries(
        Object.entries(lhr.categories).map(([id, category]) => [
          id,
          category.score === null ? null : Math.round(category.score * 100),
        ]),
      );
      report.lighthouse.push({
        formFactor,
        measuredAt: lhr.fetchTime,
        emulation: {
          formFactor: lhr.configSettings.formFactor,
          screen: lhr.configSettings.screenEmulation,
          throttlingMethod: lhr.configSettings.throttlingMethod,
          throttling: lhr.configSettings.throttling,
        },
        version: lhr.lighthouseVersion,
        runtimeError: lhr.runtimeError
          ? { code: lhr.runtimeError.code, message: lhr.runtimeError.message }
          : null,
        runWarnings: lhr.runWarnings,
        requestedPath: '/',
        finalPath: new URL(lhr.finalDisplayedUrl ?? lhr.finalUrl).pathname,
        scores,
        metrics: Object.fromEntries(
          [
            'first-contentful-paint',
            'largest-contentful-paint',
            'speed-index',
            'total-blocking-time',
            'cumulative-layout-shift',
          ].map((id) => [id, lhr.audits[id]?.numericValue ?? null]),
        ),
        failedAudits: Object.values(lhr.audits)
          .filter((audit) => audit.score !== null && audit.score < 1)
          .map((audit) => ({
            id: audit.id,
            title: audit.title,
            score: audit.score,
            displayValue: audit.displayValue,
          })),
        rawReport: rawPath.slice(dirname(output).length + 1),
      });
      console.log(`Lighthouse ${formFactor}: ${JSON.stringify(scores)}`);
    } finally {
      try {
        await chrome.kill();
      } catch {
        report.warnings.push(
          `Chrome ${formFactor} temporary-profile cleanup did not complete automatically.`,
        );
      }
    }
  }
}

try {
  if (serve) {
    const address = new URL(origin);
    if (
      !['127.0.0.1', 'localhost'].includes(address.hostname) ||
      address.protocol !== 'http:' ||
      !address.port
    )
      throw new Error('--serve requires an HTTP localhost URL with an explicit port.');
    const occupied = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(1000) }).then(
      () => true,
      () => false,
    );
    if (occupied)
      throw new Error(
        'The audit port is already in use. Choose a free localhost --url or omit --serve to audit an existing server.',
      );
    const database = resolve(root, '.tools', `quality-${phase}-${Date.now()}.sqlite`);
    mkdirSync(dirname(database), { recursive: true });
    server = spawn(process.execPath, ['--import', 'tsx', 'apps/hub/src/index.ts'], {
      cwd: root,
      env: {
        ...process.env,
        HOST: '127.0.0.1',
        PORT: address.port || '3003',
        DATABASE_PATH: database,
        HUB_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
        DEMO_JUDGE_MODE: 'true',
        SEED_DEMO_DATA: 'true',
      },
      stdio: 'ignore',
      windowsHide: true,
    });
  }
  await healthy(origin);
  const demo = (await (await fetch(origin + '/api/health')).json()).demo === true;
  if (!lighthouseOnly && !publicOnly && !demo)
    report.warnings.push(
      'Private-workspace checks were skipped because this is not a synthetic demo hub. Use --serve for an isolated demo, or --public-only to audit a deployed public site.',
    );
  if (!lighthouseOnly) {
    let AxeBuilder;
    try {
      AxeBuilder = (await import('@axe-core/playwright')).default;
    } catch {
      report.warnings.push(
        '@axe-core/playwright is unavailable; no automated accessibility result is claimed.',
      );
      process.exitCode = 1;
    }
    browser = await chromium.launch({ executablePath: chromePath, headless: true });
    report.method.chrome = browser.version();
    for (const [name, viewport] of [
      ['desktop', { width: 1440, height: 1000 }],
      ['mobile', { width: 390, height: 844 }],
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      for (const path of ['/', '/about']) {
        await inspect(page, path, name);
        if (AxeBuilder) await accessibility(page, path, name, AxeBuilder);
        if (screenshots && path === '/')
          await page.screenshot({
            path: resolve(dirname(output), `smriva-public-${name}.png`),
            fullPage: true,
          });
      }
      if (publicOnly || !demo) {
        await context.close();
        continue;
      }
      await page.goto(origin + '/app/today');
      await page.getByLabel('Your name', { exact: true }).fill('Quality audit worker');
      await page.getByLabel('Your role', { exact: true }).selectOption('Reviewer');
      await page.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
      await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
      await page.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
      await page.locator('.toast').waitFor({ state: 'hidden' });
      if (AxeBuilder) await accessibility(page, 'workspace-standard', name, AxeBuilder);
      await page.getByRole('switch', { name: 'Easy mode', exact: true }).click();
      await page.getByRole('heading', { name: 'What would you like to do?', exact: true }).waitFor();
      await page.locator('.toast').waitFor({ state: 'hidden' });
      if (AxeBuilder) await accessibility(page, 'workspace-easy', name, AxeBuilder);
      await context.close();
    }
    await browser.close();
    browser = undefined;
  }
  if (runLighthouse) await measureLighthouse();
} catch (error) {
  // Playwright call logs can echo field values; retain only a redacted summary.
  report.warnings.push(
    error instanceof Error
      ? error.message
          .split('\n')[0]
          .slice(0, 200)
          .replace(/\b\d{6,12}\b/g, '[numeric value]')
      : 'Audit could not finish.',
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
  report.summary = {
    accessibilityScans: report.accessibility.length,
    violationInstances: report.accessibility.reduce((sum, scan) => sum + scan.violations.length, 0),
    violationRuleIds: [
      ...new Set(report.accessibility.flatMap((scan) => scan.violations.map((rule) => rule.id))),
    ],
    checksRequiringHumanReview: report.accessibility.reduce((sum, scan) => sum + scan.incomplete.length, 0),
    lighthouseRuns: report.lighthouse.length,
  };
  writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(`Audit evidence written to ${output}`);
}
