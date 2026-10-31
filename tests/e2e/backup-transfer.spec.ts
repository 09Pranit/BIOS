import { readFile } from 'node:fs/promises';
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';

const backupPassword = 'shared-backup-passphrase';

async function enroll(page: Page, actor: string, pin: string) {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill(actor);
  await page.getByLabel('Choose a device PIN', { exact: true }).fill(pin);
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText(/Synced|Needs attention/, {
    timeout: 30000,
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

async function navigate(page: Page, path: string) {
  if ((page.viewportSize()?.width ?? 1440) < 700)
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator(`.sidebar nav a[href="${path}"]`).click();
}

async function createChild(page: Page, name: string) {
  await navigate(page, '/app/children');
  await page.getByRole('button', { name: 'New child', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'New child', exact: true });
  await form.locator('input[name="name"]').fill(name);
  await form.getByLabel('Date of birth', { exact: true }).fill('2018-01-10');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Save child', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function importPassword(page: Page, password: string) {
  await page.getByLabel('Backup passphrase used when exporting this file', { exact: true }).fill(password);
}

async function importFile(page: Page, buffer: Buffer, name = 'smriva-encrypted-backup.json') {
  await page.locator('input[type="file"]').first().setInputFiles({
    name,
    mimeType: 'application/json',
    buffer,
  });
}

async function logDigest(page: Page) {
  await navigate(page, '/app/sync');
  const digest = page.locator('.hash');
  await expect(digest).toHaveText(/^[a-f\d]{64}$/);
  return (await digest.textContent())!;
}

test('downloaded encrypted backup restores offline on an independent phone with a different PIN and keeps Unicode, drafts and operation identity', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(120000);
  const source = await browser.newContext({ baseURL });
  const phone = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  });
  const a = await source.newPage();
  const b = await phone.newPage();
  const name = 'आशा ਕੌਰ Backup Transfer';
  const assessment = 'पानी ਅਤੇ ਗਿਣਤੀ';
  try {
    await enroll(a, 'Backup source desktop', '123456');
    await enroll(b, 'Backup destination phone', '654321');
    await source.setOffline(true);
    await phone.setOffline(true);
    await createChild(a, name);
    await navigate(a, '/app/school');
    await a.getByRole('button', { name: 'Assessments', exact: true }).click();
    await a.getByLabel('Class', { exact: true }).selectOption('Class 1');
    await a.getByLabel('Assessment title', { exact: true }).fill(assessment);
    await a.getByLabel('Anaya Devi score', { exact: true }).fill('105');
    await a.getByLabel('Anaya Devi score', { exact: true }).press('Tab');
    await expect(
      a.locator('tr').filter({ hasText: 'Anaya Devi' }).getByText('Encrypted draft saved', { exact: true }),
    ).toBeVisible();
    const sourceDigest = await logDigest(a);
    await navigate(a, '/app/settings');
    await a.getByLabel('Backup passphrase (at least 10 characters)', { exact: true }).fill(backupPassword);
    const downloaded = a.waitForEvent('download');
    await a.getByRole('button', { name: 'Export backup', exact: true }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe('smriva-encrypted-backup.json');
    const bytes = await readFile((await download.path())!);
    expect(JSON.parse(bytes.toString()).format).toBe('smriva-backup');
    expect(bytes.toString()).not.toContain(name);
    expect(bytes.toString()).not.toContain(assessment);

    await navigate(b, '/app/settings');
    await importPassword(b, 'wrong');
    await importFile(b, bytes);
    await expect(b.getByRole('alert')).toContainText(/Incorrect password|passphrase/i);
    await navigate(b, '/app/children');
    await expect(b.getByText(name, { exact: true })).toHaveCount(0);
    await navigate(b, '/app/settings');
    await importPassword(b, backupPassword);
    await importFile(b, bytes);
    await expect(b.getByRole('status')).toContainText(/operations restored locally/);
    await expect(b.getByRole('alert')).toHaveCount(0);
    await expect(b.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(
      true,
    );
    await b.getByRole('status').waitFor({ state: 'hidden' });
    await b.evaluate(() => window.scrollTo(0, 0));
    await b.screenshot({ path: 'docs/smriva-backup-restore-phone.png', fullPage: true });
    expect(await logDigest(b)).toBe(sourceDigest);
    await navigate(b, '/app/children');
    await expect(b.getByText(name, { exact: true })).toBeVisible();

    // Importing the same signed operations again has no duplicate effect.
    await navigate(b, '/app/settings');
    await importPassword(b, backupPassword);
    await importFile(b, bytes);
    await expect(b.getByRole('status')).toContainText(/operations restored locally/);
    expect(await logDigest(b)).toBe(sourceDigest);
    await navigate(b, '/app/school');
    await b.getByRole('button', { name: 'Assessments', exact: true }).click();
    await b.getByLabel('Class', { exact: true }).selectOption('Class 1');
    await expect(b.getByLabel('Assessment title', { exact: true })).toHaveValue(assessment);
    await expect(b.getByLabel('Anaya Devi score', { exact: true })).toHaveValue('105');
    await b.reload();
    await b.getByLabel('Device PIN', { exact: true }).fill('654321');
    await b.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
    await expect(b.getByLabel('Assessment title', { exact: true })).toHaveValue(assessment);
    await expect(b.getByLabel('Anaya Devi score', { exact: true })).toHaveValue('105');
    expect(await logDigest(b)).toBe(sourceDigest);
  } finally {
    await source.close();
    await phone.close();
  }
});

test('Settings rejects malformed JSON and unrelated JSON files without changing local records', async ({
  page,
  context,
}) => {
  await enroll(page, 'Backup file validation', '123456');
  await context.setOffline(true);
  await createChild(page, 'Local child preserved during failed restores');
  const before = await logDigest(page);
  await navigate(page, '/app/settings');
  await importPassword(page, backupPassword);
  await importFile(page, Buffer.from('{"format": "smriva-backup", BROKEN'), 'damaged.json');
  await expect(page.getByRole('alert')).toContainText('This file is not valid backup JSON.');
  await expect(page.getByRole('alert')).not.toContainText('BROKEN');
  await importFile(page, Buffer.from('{"format":"kuka-bundle","version":1}'), 'hub-bundle.json');
  await expect(page.getByRole('alert')).toContainText(
    'Choose an encrypted Smriva backup exported from Settings.',
  );
  await importFile(page, Buffer.from('{}'), 'unrelated.json');
  await expect(page.getByRole('alert')).toContainText(/backup|format/i);
  expect(await logDigest(page)).toBe(before);
  await navigate(page, '/app/children');
  await expect(page.getByText('Local child preserved during failed restores', { exact: true })).toBeVisible();
});

test('Settings accepts an independently encrypted UTF-16 legacy backup with its original short passphrase', async ({
  page,
  context,
}) => {
  await enroll(page, 'Legacy backup passphrase', '123456');
  await context.setOffline(true);
  await navigate(page, '/app/settings');
  const password = 'old123';
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', pbkdf2Sync(password, salt, 310000, 32, 'sha256'), iv);
  cipher.setAAD(Buffer.from('KUKA:v1'));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify({ ops: [], entryDrafts: {} })),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const legacy = {
    format: 'kuka-backup',
    version: 1,
    salt: salt.toString('base64'),
    sealed: { iv: iv.toString('base64'), data: encrypted.toString('base64') },
  };
  await importPassword(page, password);
  await expect(page.locator('input[type="file"]').first()).toBeEnabled();
  await importFile(
    page,
    Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(JSON.stringify(legacy), 'utf16le')]),
    'kuka-encrypted-backup.json',
  );
  await expect(page.getByRole('status')).toContainText('0 validated operations restored locally');
  await expect(page.getByRole('alert')).toHaveCount(0);
});
