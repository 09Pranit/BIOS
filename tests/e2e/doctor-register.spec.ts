import { test, expect } from '@playwright/test';

test('doctor entries appear immediately, survive offline reload and stay out of the classroom roster', async ({
  page,
  context,
}) => {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill('Dr Example');
  await page.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('Synced');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.locator('.repo-tabs a[href="/app/doctor"]').click();
  await expect(page.getByRole('heading', { name: 'Doctor’s register', exact: true })).toBeVisible();
  const rows = page.getByRole('table', { name: 'Patient entries', exact: true }).locator('tbody tr');
  await expect(rows).toHaveCount(12);
  await expect(rows.filter({ hasText: 'Harpreet Singh' })).toContainText('Routine consultation');
  await expect(rows.filter({ hasText: 'Harpreet Singh' })).toContainText('Data');
  await expect(rows.filter({ hasText: 'Synthetic demo' })).toHaveCount(0);
  await expect(rows.filter({ hasText: 'Fictional demo patient' })).toHaveCount(0);
  await context.setOffline(true);
  await page.getByLabel('Patient name', { exact: true }).fill('Offline Patient Example');
  await page.getByLabel('Date', { exact: true }).fill('2020-01-01');
  await page.getByLabel('Time', { exact: true }).fill('09:30');
  await page.getByLabel('Purpose', { exact: true }).fill('Routine consultation');
  await page.getByRole('button', { name: 'Add record', exact: true }).click();
  await expect(rows).toHaveCount(13);
  await expect(rows.first()).toContainText('Offline Patient Example');
  await expect(rows.first()).toContainText('09:30');
  await expect(rows.first()).toContainText('Routine consultation');
  await expect(rows.first()).toContainText('Dr Example');
  await expect(page.getByLabel('Patient name', { exact: true })).toHaveValue('');
  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(rows).toHaveCount(13);
  await expect(rows.first()).toContainText('Offline Patient Example');
  await context.setOffline(false);
  await page.locator('.connection-pill').click();
  await expect(page.locator('.connection-pill')).toContainText('Synced');
  await expect(rows).toHaveCount(13);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.repo-tabs a[href="/app/children"]').click();
  await expect(page.locator('.records-table')).not.toContainText('Offline Patient Example');
  await expect(page.locator('.records-table')).not.toContainText('Harpreet Singh');
});
