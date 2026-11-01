import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function enroll(page: Page, actor: string, waitForOffline = true) {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill(actor);
  await page.getByLabel('Your role', { exact: true }).selectOption('Reviewer');
  await page.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
  if (waitForOffline) await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.goto('/app/library');
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learning library', exact: true })).toBeVisible();
}

function programmes(page: Page) {
  return page.getByRole('region', { name: 'Explore government programmes', exact: true });
}

async function loadedPosters(page: Page) {
  const cards = programmes(page).getByRole('article');
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    const image = card.locator('img');
    await expect(image).toHaveCount(1);
    expect((await image.getAttribute('alt'))?.trim().length).toBeGreaterThan(5);
  }
  const images = page.locator('#main img');
  expect(await images.count()).toBeGreaterThanOrEqual(await cards.count());
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
      .toBe(true);
    const source = await image.getAttribute('src');
    expect(new URL(source!, page.url()).origin).toBe(new URL(page.url()).origin);
  }
}

async function scan(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  expect(
    result.violations.map((rule) => ({
      id: rule.id,
      nodes: rule.nodes.map((node) =>
        node.target.map((target) =>
          typeof target === 'string' ? target.replace(/\[[^\]]*\]/g, '[attribute]') : '[shadow target]',
        ),
      ),
    })),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const [name, viewport] of [
  ['desktop', { width: 1440, height: 1000 }],
  ['mobile', { width: 390, height: 844 }],
] as const) {
  test(`government programmes have real local posters, safe official links, working filters and accessible library modes on ${name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await enroll(page, `Library ${name} worker`);
    const section = programmes(page);
    const cards = section.getByRole('article');
    const total = await cards.count();
    expect(total).toBeGreaterThan(1);
    await loadedPosters(page);
    await expect(page.locator('.lesson-card .lesson-art')).toHaveCount(4);
    await expect(page.locator('.learning-featured-link')).toHaveAttribute('href', 'https://diksha.gov.in/');
    for (const card of await cards.all()) {
      const official = card.locator('.gov-website-link');
      const url = new URL((await official.getAttribute('href'))!);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toMatch(/(?:^|\.)(?:gov\.in|nic\.in)$/i);
      expect(url.username).toBe('');
      expect(url.password).toBe('');
      await expect(official).toHaveAttribute('target', '_blank');
      await expect(official).toHaveAttribute('rel', /\bnoopener\b/);
      await expect(official).toHaveAttribute('rel', /\bnoreferrer\b/);
      await expect(official.locator('.gov-poster img')).toHaveCount(1);
      await expect(official.locator('.gov-portal-caption')).toContainText('Official website');
      await expect(official.locator('.gov-portal-caption')).toContainText(url.hostname.replace(/^www\./, ''));
      expect(await card.locator('img').evaluate((image) => image.closest('a')?.href)).toBe(url.href);
      const credits = card.locator('.gov-image-credits a');
      await expect(credits).toHaveCount(2);
      for (const link of await credits.all()) {
        expect(new URL((await link.getAttribute('href'))!).protocol).toBe('https:');
        await expect(link).toHaveAttribute('rel', /\bnoopener\b/);
        await expect(link).toHaveAttribute('rel', /\bnoreferrer\b/);
      }
    }
    const firstDetails = cards.first().locator('.gov-details');
    await expect(firstDetails.locator('.gov-description')).toBeHidden();
    await firstDetails.locator('summary').click();
    await expect(firstDetails.locator('.gov-description')).toBeVisible();
    await firstDetails.locator('summary').press('Enter');
    await expect(firstDetails.locator('.gov-description')).toBeHidden();
    for (const category of ['Education', 'Health & wellbeing']) {
      await section.getByRole('button', { name: category, exact: true }).click();
      expect(await cards.count()).toBeGreaterThan(0);
      expect(await cards.count()).toBeLessThan(total);
      for (const card of await cards.all()) await expect(card.locator('.gov-category')).toHaveText(category);
    }
    await section.getByRole('button', { name: 'All programmes', exact: true }).click();
    const firstTitle = await cards.first().getByRole('heading', { level: 3 }).innerText();
    const search = section.getByLabel('Search government programmes', { exact: true });
    await search.fill(firstTitle);
    expect(await cards.count()).toBeGreaterThan(0);
    expect(await cards.count()).toBeLessThan(total);
    await search.fill('zzzz no matching programme 709d');
    await expect(cards).toHaveCount(0);
    await expect(
      section.getByRole('heading', { name: 'No programmes match these filters', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.lesson-card .lesson-art')).toHaveCount(4);
    await section.getByRole('button', { name: 'Clear filters and show all programmes', exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(cards).toHaveCount(total);
    await loadedPosters(page);
    await scan(page);
    await page.getByRole('button', { name: 'Use light theme', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await scan(page);
    if (name === 'desktop') await page.getByRole('button', { name: 'Use dark theme', exact: true }).click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: `docs/smriva-library-${name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
    if (name === 'desktop') {
      const official = cards.first().locator('.gov-website-link');
      const portalUrl = (await official.getAttribute('href'))!;
      // Fulfil only this portal navigation so the image/keyboard checks need no external service.
      await page.context().route(portalUrl, (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><html><head><title>Official portal test</title><link rel="icon" href="data:,"></head><body>Official portal navigation verified</body></html>',
        }),
      );
      await official.focus();
      await expect(official).toBeFocused();
      const keyboardPopup = page.waitForEvent('popup');
      await official.press('Enter');
      const openedByKeyboard = await keyboardPopup;
      await expect(openedByKeyboard).toHaveURL(portalUrl);
      await openedByKeyboard.close();
      const imagePopup = page.waitForEvent('popup');
      await official.locator('img').click();
      const openedByImage = await imagePopup;
      await expect(openedByImage).toHaveURL(portalUrl);
      await openedByImage.close();
      await page.context().unroute(portalUrl);
    }
  });
}

test('programme posters remain available after offline reload while the original lesson quiz still saves locally', async ({
  page,
  context,
}) => {
  await enroll(page, 'Offline programme worker');
  const count = await programmes(page).getByRole('article').count();
  await loadedPosters(page);
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(programmes(page).getByRole('article')).toHaveCount(count);
  await loadedPosters(page);
  await expect(
    programmes(page)
      .getByRole('status')
      .filter({ hasText: 'Official websites need an internet connection.' }),
  ).toBeVisible();
  await expect(programmes(page).locator('.gov-footer-note')).toContainText('not downloaded for offline use');
  await page.getByRole('button', { name: 'Open Little numbers, big discoveries' }).click();
  await page.getByRole('button', { name: 'B 4', exact: true }).click();
  await page.getByRole('button', { name: 'Check & save my progress', exact: true }).click();
  await expect(page.getByText(/Your progress is saved\./)).toBeVisible();
});

test('a failed poster request keeps an accessible programme fallback and official link', async ({
  browser,
}) => {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  let aborted = 0;
  await context.route('**/*', async (route) => {
    if (route.request().resourceType() === 'image') {
      aborted++;
      await route.abort('failed');
    } else await route.continue();
  });
  const page = await context.newPage();
  await enroll(page, 'Poster fallback worker', false);
  const card = programmes(page).getByRole('article').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole('img', { name: /poster unavailable$/ })).toBeVisible();
  expect(aborted).toBeGreaterThan(0);
  await expect(card.getByRole('heading', { level: 3 })).toBeVisible();
  await expect(card.locator('.gov-website-link')).toBeVisible();
  await expect(card.locator('.gov-website-link')).toHaveAttribute('href', /^https:\/\//);
  await expect(card.locator('img')).toHaveCount(0);
  await context.close();
});
