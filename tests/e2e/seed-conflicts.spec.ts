import { test, expect } from '@playwright/test';

test('demo conflicts show stored names and a reviewed choice survives sync and offline reload', async ({
  page,
  context,
}) => {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill('Synthetic conflict reviewer');
  await page.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('Synced');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.locator('.repo-tabs a[href="/app/conflicts"]').click();
  for (const name of ['Aarohi Kaur', 'Kabir Singh', 'Meher Kaur']) {
    const panel = page
      .locator('.panel')
      .filter({ has: page.getByRole('heading', { name: `${name} · score`, exact: true }) });
    await expect(panel.getByText('Synthetic demo conflict', { exact: true })).toBeVisible();
    await expect(panel.locator('.conflict-versions article')).toHaveCount(2);
  }
  const aarohi = page
    .locator('.panel')
    .filter({ has: page.getByRole('heading', { name: 'Aarohi Kaur · score', exact: true }) });
  await aarohi.getByLabel('Corrected Score', { exact: true }).fill('80');
  await aarohi.getByRole('button', { name: 'Save reviewed value', exact: true }).click();
  await expect(aarohi).toHaveCount(0);
  await page.locator('.connection-pill').click();
  await expect(page.locator('.connection-pill')).toContainText('Synced');
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(aarohi).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Kabir Singh · score', exact: true })).toBeVisible();
  await expect(page.getByText('Synthetic demo conflict', { exact: true })).toHaveCount(2);
});
