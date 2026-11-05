import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('3D illustration changes modes, pauses, and leaves the private workspace unloaded', async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('.public-network')).toHaveClass(/scene-ready/);
  await expect(page.getByRole('button', { name: 'Offline', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Connected', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Interactive illustration · connected mode');
  await expect(page.getByText('Example: entries travel to the hub.')).toBeVisible();
  await page.getByRole('button', { name: 'Pause illustration' }).click();
  await expect(page.getByRole('button', { name: 'Play illustration' })).toBeVisible();
  await page.getByRole('button', { name: 'Offline', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('offline mode');
  expect(requests.some((url) => /workspace-main-|storage-|validation-/.test(url))).toBe(false);
  expect(errors).toEqual([]);
});

test('reduced motion renders a still scene and respects preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.public-network')).toHaveClass(/scene-ready/);
  await expect(page.getByRole('button', { name: 'Pause illustration' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Connected', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('connected mode');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('button', { name: 'Pause illustration' })).toBeVisible();
});

test('a failed optional 3D download keeps the illustration, controls and entry links usable', async ({
  page,
}) => {
  await page.route('**/record-scene-*.js', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Connected', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('connected mode');
  await expect(page.locator('.public-network-fallback')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try the workspace', exact: true })).toHaveAttribute(
    'href',
    '/app/today',
  );
});

test('Save-Data skips Three.js while keeping connection controls usable', async ({ page }) => {
  const requests: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true });
  });
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await page.getByRole('button', { name: 'Connected', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('connected mode');
  expect(requests.some((url) => /record-scene-|landing-three-/.test(url))).toBe(false);
  await expect(page.locator('.public-network')).not.toHaveClass(/scene-ready/);
});

test('losing the WebGL context restores the fallback without breaking the page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.public-network')).toHaveClass(/scene-ready/);
  await page.locator('.public-network canvas').evaluate((canvas) => {
    canvas.dispatchEvent(new Event('webglcontextlost'));
  });
  await expect(page.locator('.public-network')).not.toHaveClass(/scene-ready/);
  await page.getByRole('button', { name: 'Connected', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('connected mode');
});

for (const width of [360, 390, 768, 1440]) {
  test(`landing fits and passes accessibility checks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.public-network')).toHaveClass(/scene-ready/);
    await page.getByRole('button', { name: 'Pause illustration' }).click();
    await page.getByText('What can I do without internet?', { exact: true }).click();
    await expect(
      page.getByText('After the first connected setup and app download, unlock and enter records offline.'),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(
      scan.violations.map((rule) => ({ id: rule.id, nodes: rule.nodes.map((node) => node.target) })),
    ).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `.tools/landing-${width}.png`, fullPage: true, animations: 'disabled' });
  });
}
