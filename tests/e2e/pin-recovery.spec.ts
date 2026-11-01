import { test, expect, type Page } from '@playwright/test';

async function enroll(page: Page, name: string, pin: string) {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill(name);
  await page.getByLabel('Your role', { exact: true }).selectOption('Reviewer');
  await page.getByLabel('Choose a device PIN', { exact: true }).fill(pin);
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
}

async function unlock(page: Page, pin: string) {
  await page.getByLabel('Device PIN', { exact: true }).fill(pin);
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
}

async function originalCiphertext(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('kuka-main');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Could not inspect the original encrypted workspace.'));
    });
    try {
      const read = (store: string) =>
        new Promise<unknown[]>((resolve, reject) => {
          const request = db.transaction(store).objectStore(store).getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(new Error('Could not inspect encrypted records.'));
        });
      return JSON.stringify(await Promise.all([read('meta'), read('vault')]));
    } finally {
      db.close();
    }
  });
}

test('forgotten PIN can start a separate demo while original ciphertext and unfinished work remain intact', async ({
  page,
}) => {
  await enroll(page, 'Original PIN Worker', '123456');
  await page.locator('.sidebar nav a[href="/app/school"]').click();
  await page.getByRole('button', { name: 'Assessments', exact: true }).click();
  await page.getByLabel('Class', { exact: true }).selectOption('Class 1');
  await page.getByLabel('Anaya Devi score', { exact: true }).fill('105');
  await page.getByLabel('Anaya Devi score', { exact: true }).press('Tab');
  await expect(
    page.locator('tr').filter({ hasText: 'Anaya Devi' }).getByText('Encrypted draft saved', { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Device PIN', { exact: true })).toBeVisible();
  const preserved = await originalCiphertext(page);
  await unlock(page, '654321');
  await expect(page.getByText(/Incorrect PIN\. Use the PIN chosen/)).toBeVisible();
  expect(await originalCiphertext(page)).toBe(preserved);
  await page.getByRole('button', { name: 'Show PIN', exact: true }).click();
  await expect(page.getByLabel('Device PIN', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByLabel('Device PIN', { exact: true })).toHaveValue('654321');
  await page.getByRole('button', { name: 'Hide PIN', exact: true }).click();

  await page.getByRole('link', { name: 'Forgot PIN?', exact: true }).click();
  await expect(page.getByText(/Your original encrypted workspace stays on this browser/)).toBeVisible();
  await page.screenshot({ path: 'docs/pin-recovery.png', fullPage: true });
  await page.getByRole('button', { name: 'Start a separate demo workspace', exact: true }).click();
  await enroll(page, 'Separate PIN Worker', '654321');
  expect(await originalCiphertext(page)).toBe(preserved);
  await page.reload();
  await unlock(page, '654321');
  await expect(page.locator('.sidebar-user')).toContainText('Separate PIN Worker');
  await page.getByRole('button', { name: 'Lock workspace', exact: true }).click();
  await page.getByLabel('Saved workspace', { exact: true }).selectOption('main');
  await expect(page.getByLabel('Saved workspace', { exact: true })).toBeEnabled();
  await unlock(page, '654321');
  await expect(page.getByText(/Incorrect PIN\. Use the PIN chosen/)).toBeVisible();
  expect(await originalCiphertext(page)).toBe(preserved);
  await unlock(page, '123456');
  await expect(page.locator('.sidebar-user')).toContainText('Original PIN Worker');
  await page.locator('.sidebar nav a[href="/app/school"]').click();
  await page.getByRole('button', { name: 'Assessments', exact: true }).click();
  await page.getByLabel('Class', { exact: true }).selectOption('Class 1');
  await expect(page.getByLabel('Anaya Devi score', { exact: true })).toHaveValue('105');
});

test('same-browser recovery restores hub records under a new PIN and preserves the original locked database', async ({
  page,
}) => {
  await enroll(page, 'Recovery PIN Worker', '123456');
  await page.locator('.sidebar nav a[href="/app/settings"]').click();
  await page.getByRole('button', { name: 'Reveal recovery code', exact: true }).click();
  const recovery = await page.locator('.recovery-code').innerText();
  await page.getByRole('button', { name: 'Lock workspace', exact: true }).click();
  const preserved = await originalCiphertext(page);
  await page.getByRole('link', { name: 'Forgot PIN?', exact: true }).click();
  await page.getByLabel('Recovery code', { exact: true }).fill('invalid-recovery-code');
  await page.getByLabel('New device PIN', { exact: true }).fill('345678');
  await page.getByRole('button', { name: 'Recover from hub', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recover from hub', exact: true })).toBeEnabled();
  expect(await originalCiphertext(page)).toBe(preserved);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('setusync-workspaces-v1')!).active)).toBe(
    'main',
  );
  await page.getByLabel('Recovery code', { exact: true }).fill(recovery);
  await page.getByLabel('New device PIN', { exact: true }).fill('345678');
  await page.getByRole('button', { name: 'Recover from hub', exact: true }).click();
  await page.getByRole('link', { name: 'Open restored workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await page.locator('.sidebar nav a[href="/app/children"]').click();
  await expect(page.getByRole('row').filter({ hasText: 'Aarohi Kaur' })).toBeVisible();
  expect(await originalCiphertext(page)).toBe(preserved);
  await page.reload();
  await unlock(page, '345678');
  await expect(page.getByRole('heading', { name: 'Children', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lock workspace', exact: true }).click();
  await expect(
    page.getByLabel('Saved workspace', { exact: true }).locator('option[value="main"]'),
  ).toHaveText('Original workspace');
  await page.getByLabel('Saved workspace', { exact: true }).selectOption('main');
  await expect(page.getByLabel('Saved workspace', { exact: true })).toBeEnabled();
  await unlock(page, '123456');
  await expect(page.locator('.sidebar-user')).toContainText('Recovery PIN Worker');
  await expect(page.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
});
