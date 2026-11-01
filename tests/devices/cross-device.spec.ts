import { test, expect, type Page } from '@playwright/test';

async function enroll(page: Page) {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill('Device compatibility worker');
  await page.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
}
async function navigate(page: Page, path: string) {
  if ((page.viewportSize()?.width ?? 1440) <= 700)
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator(`.sidebar nav a[href="${path}"]`).click();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test('encrypted entry, offline reload and JSON backup work on this browser and screen', async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enroll(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await noOverflow(page);
  await context.setOffline(true);
  await navigate(page, '/app/children');
  await page.getByRole('button', { name: 'New', exact: true }).last().click();
  await page.getByRole('button', { name: 'Student', exact: true }).last().click();
  const dialog = page.getByRole('dialog', { name: 'New student', exact: true });
  await dialog.locator('input[name="name"]').fill('आशा ਕੌਰ ' + testInfo.project.name);
  await dialog.getByLabel('Date of birth', { exact: true }).fill('2018-01-10');
  await dialog.getByRole('checkbox').check();
  if ((page.viewportSize()?.width ?? 1440) <= 700) {
    expect(
      await dialog
        .locator('input[name="name"]')
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
    ).toBeGreaterThanOrEqual(16);
  }
  await dialog.getByRole('button', { name: 'Save student', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await noOverflow(page);
  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(page.getByText('आशा ਕੌਰ ' + testInfo.project.name, { exact: true })).toBeVisible();
  await navigate(page, '/app/library');
  await noOverflow(page);
  await navigate(page, '/app/settings');
  await noOverflow(page);
  await page
    .getByLabel('Backup passphrase (at least 10 characters)', { exact: true })
    .fill('portable-backup-passphrase');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('smriva-encrypted-backup.json');
  const path = await download.path();
  expect(path).toBeTruthy();
  await page
    .getByLabel('Backup passphrase used when exporting this file', { exact: true })
    .fill('portable-backup-passphrase');
  await page.locator('input[type="file"]').first().setInputFiles(path!);
  await expect(page.getByRole('status')).toContainText('operations restored locally');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('missing recent convenience APIs do not block enrollment or saving', async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true });
    Object.defineProperty(AbortSignal, 'timeout', { value: undefined, configurable: true });
    Object.defineProperty(Object, 'hasOwn', { value: undefined, configurable: true });
    Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(SubmitEvent.prototype, 'submitter', { get: () => null, configurable: true });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enroll(page);
  await navigate(page, '/app/children');
  await page.getByRole('button', { name: 'New', exact: true }).last().click();
  await page.getByRole('button', { name: 'Student', exact: true }).last().click();
  const dialog = page.getByRole('dialog', { name: 'New student', exact: true });
  await dialog.locator('input[name="name"]').fill('Older browser example');
  await dialog.getByLabel('Date of birth', { exact: true }).fill('2019-01-01');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Save and add another', exact: true }).click();
  await expect(dialog.locator('input[name="name"]')).toHaveValue('');
  await dialog.locator('input[name="name"]').fill('Older browser follow-up');
  await dialog.getByLabel('Date of birth', { exact: true }).fill('2019-02-01');
  await dialog.getByRole('checkbox').check();
  await dialog.locator('input[name="name"]').press('Control+Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Older browser example', { exact: true })).toBeVisible();
  await expect(page.getByText('Older browser follow-up', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('insecure access explains the HTTPS address without enrolling or changing records', async ({
  page,
  context,
}) => {
  await context.addInitScript(() => Object.defineProperty(window, 'isSecureContext', { value: false }));
  let enrolled = false;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/enroll')) enrolled = true;
  });
  await page.goto('/app/today');
  await expect(page.getByRole('heading', { name: 'Set up secure access' })).toBeVisible();
  await expect(page.getByText(/HTTPS address provided/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create demo workspace' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Check again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Set up secure access' })).toBeVisible();
  expect(enrolled).toBe(false);
});

test('blocked storage shows recovery instructions instead of a broken form', async ({ page, context }) => {
  await context.addInitScript(() => {
    IDBFactory.prototype.open = () => {
      throw new DOMException('Storage blocked', 'SecurityError');
    };
  });
  await page.goto('/app/today');
  await expect(page.getByRole('heading', { name: 'Set up secure access' })).toBeVisible();
  await expect(page.getByText(/Allow site storage/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create demo workspace' })).toHaveCount(0);
});
