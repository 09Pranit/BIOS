import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function meta(html: string, name: string) {
  return html.match(
    new RegExp(`<meta(?=[^>]*\\bname=["']${name}["'])[^>]*\\bcontent=["']([^"']*)["'][^>]*>`, 'i'),
  )?.[1];
}

test('public pages contain crawlable HTML, clear entry points and route-specific metadata without JavaScript', async ({
  browser,
  request,
}) => {
  const landing = await request.get('/');
  expect(landing.status()).toBe(200);
  const home = await landing.text();
  expect(home.match(/<h1(?:\s|>)/gi)).toHaveLength(1);
  expect(home).toMatch(/Offline records\.[\s\S]*?Connected communities\./);
  expect(meta(home, 'description')?.length).toBeGreaterThanOrEqual(50);
  expect(meta(home, 'robots')).toContain('index, follow');
  const about = await request.get('/about');
  expect(about.status()).toBe(200);
  const sources = await about.text();
  expect(sources.match(/<h1(?:\s|>)/gi)).toHaveLength(1);
  expect(home.match(/<title>(.*?)<\/title>/)?.[1]).not.toBe(sources.match(/<title>(.*?)<\/title>/)?.[1]);
  expect(meta(sources, 'description')?.length).toBeGreaterThanOrEqual(50);
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  for (const path of [...manifest.icons.map((icon: { src: string }) => icon.src), '/apple-touch-icon.png']) {
    const icon = await request.get(path);
    expect(icon.status()).toBe(200);
    expect(icon.headers()['content-type']).toContain('image/');
  }
  if (!process.env.SITE_URL) {
    for (const html of [home, sources]) {
      expect(html).not.toMatch(/rel=["']canonical["']/i);
      expect(html).not.toContain('application/ld+json');
    }
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /Offline records\.\s*Connected communities\./,
  );
  await expect(page.getByRole('link', { name: 'Open workspace', exact: true })).toHaveAttribute(
    'href',
    '/app/today',
  );
  await page.getByRole('link', { name: 'Sources & security', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('main')).toBeVisible();
  await context.close();
});

test('private routes use noindex and generic titles while unknown URLs return actual HTTP 404s', async ({
  page,
  request,
}) => {
  for (const path of ['/app/today', '/app/children/child-001', '/recover', '/admin', '/lab']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag']).toContain('noindex');
    expect(response.headers()['cache-control']).toContain('no-store');
    const html = await response.text();
    expect(meta(html, 'robots')).toContain('noindex');
    expect(html).not.toMatch(/rel=["']canonical["']/i);
    expect(html).not.toContain('application/ld+json');
    expect(html).not.toContain('Aarohi Kaur');
  }
  await page.goto('/app/today');
  await expect(page).toHaveTitle(/Overview.*Smriva/);
  await page.goto('/app/children/child-001');
  await expect(page).toHaveTitle(/Child record.*Smriva/);
  expect(await page.title()).not.toMatch(/Aarohi|child-001/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  const missing = await request.get('/this-page-does-not-exist');
  expect(missing.status()).toBe(404);
  expect(missing.headers()['x-robots-tag']).toContain('noindex');
  expect(await missing.text()).toContain('Page not found');
  const missingAsset = await request.get('/assets/missing-file.js');
  expect(missingAsset.status()).toBe(404);
  const health = await request.get('/api/health');
  expect(health.headers()['x-robots-tag']).toContain('noindex');
  const shell = await request.get('/app-shell.html', { maxRedirects: 0 });
  expect(shell.status()).toBe(200);
  expect(shell.headers()['x-robots-tag']).toContain('noindex');
  expect(meta(await shell.text(), 'robots')).toContain('noindex');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain('/app/');
});

for (const [name, viewport] of [
  ['desktop', { width: 1440, height: 1000 }],
  ['mobile', { width: 390, height: 844 }],
] as const) {
  test(`public and standard/Easy workspaces have no detected WCAG A/AA or axe best-practice violations on ${name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const scan = async () => {
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();
      expect(
        result.violations.map((rule) => ({
          id: rule.id,
          impact: rule.impact,
          nodes: rule.nodes.length,
          targets: rule.nodes.map((node) =>
            node.target.map((target) =>
              typeof target === 'string' ? target.replace(/\[[^\]]*\]/g, '[attribute]') : '[shadow target]',
            ),
          ),
        })),
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    };
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /Offline records\.\s*Connected communities\./,
    );
    await scan();
    await page.screenshot({ path: `docs/smriva-home-${name}.png`, fullPage: true, animations: 'disabled' });
    await page.goto('/about');
    await expect(page.getByRole('main')).toBeVisible();
    await scan();
    await page.goto('/app/today');
    await page.getByLabel('Your name', { exact: true }).fill(`Accessibility ${name} worker`);
    await page.getByLabel('Your role', { exact: true }).selectOption('Reviewer');
    await page.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
    await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
    await expect(page.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
    await page.locator('.toast').waitFor({ state: 'hidden' });
    await scan();
  });
}
