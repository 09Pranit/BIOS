import { test, expect, type Page } from '@playwright/test';

async function reopen(page: Page) {
  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Children', exact: true })).toBeVisible();
}

test('two tabs sharing one browser preserve simultaneous offline registrations and copy them without identity collisions', async ({
  context,
}) => {
  const a = await context.newPage();
  await a.goto('/app/today');
  await a.getByLabel('Your name', { exact: true }).fill('Shared browser worker');
  await a.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
  await a.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(a.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(a.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
  await a.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  // This second page shares IndexedDB and the enrolled identity with the first page.
  // It is deliberately not a new browser context or an independently enrolled device.
  const b = await context.newPage();
  await b.goto('/app/today');
  await b.getByLabel('Device PIN', { exact: true }).fill('123456');
  await b.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(b.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await b.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);

  for (const [page, name] of [
    [a, 'Concurrent Browser A'],
    [b, 'Concurrent Browser B'],
  ] as const) {
    await page.locator('.sidebar nav a[href="/app/children"]').click();
    await page.getByRole('button', { name: 'New', exact: true }).last().click();
    await page.getByRole('button', { name: 'Student', exact: true }).last().click();
    const dialog = page.getByRole('dialog', { name: 'New student', exact: true });
    await dialog.getByLabel(/Child’s name/).fill(name);
    await dialog.getByLabel('Date of birth', { exact: true }).fill('2019-04-15');
    await dialog.getByRole('checkbox').check();
  }
  await Promise.all(
    [a, b].map((page) =>
      page.getByRole('dialog').getByRole('button', { name: 'Save student', exact: true }).click(),
    ),
  );
  for (const page of [a, b]) await expect(page.getByRole('dialog')).toHaveCount(0);

  for (const page of [a, b]) {
    await reopen(page);
    await page.getByLabel('Search children', { exact: true }).fill('Concurrent Browser');
    const savedNames = page.locator('tbody .person-link strong');
    await expect(savedNames).toHaveCount(2);
    await expect(savedNames.filter({ hasText: /^Concurrent Browser A$/ })).toBeVisible();
    await expect(savedNames.filter({ hasText: /^Concurrent Browser B$/ })).toBeVisible();
  }

  await context.setOffline(false);
  for (const page of [a, b]) {
    await page.locator('.sidebar nav a[href="/app/settings"]').click();
    await expect(page.getByRole('button', { name: 'Sync now', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Sync now', exact: true }).click();
    await expect(page.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
    await expect(page.getByText('Quarantined operations: 0', { exact: true })).toBeVisible();
  }
});
