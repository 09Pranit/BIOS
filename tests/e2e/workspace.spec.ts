import { test, expect, type BrowserContext, type Page } from '@playwright/test';
async function unlock(page: Page, name: string, role?: string) {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill(name);
  if (role) await page.getByLabel('Your role', { exact: true }).selectOption(role);
  await page.getByLabel('Choose a device PIN').fill('123456');
  await page.getByRole('button', { name: 'Create demo workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText(/Synced|Needs attention/, { timeout: 30000 });
}
async function navigate(page: Page, path: string) {
  if ((page.viewportSize()?.width ?? 1440) < 700)
    await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.locator(`.sidebar nav a[href="${path}"]`).click();
}
test('two independent browser contexts: offline entry, reload, concurrent conflict, human resolution, convergence', async ({
  browser,
}) => {
  const ca = await browser.newContext(),
    cb = await browser.newContext(),
    a = await ca.newPage(),
    b = await cb.newPage();
  await unlock(a, 'E2E Worker A');
  await unlock(b, 'E2E Worker B');
  await a.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await b.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await navigate(a, '/app/school');
  await navigate(b, '/app/school');
  await ca.setOffline(true);
  await cb.setOffline(true);
  await a.getByRole('button', { name: 'Aarohi Kaur: present', exact: true }).click();
  await expect(a.getByRole('status')).toContainText('Saved on this device');
  await b.getByRole('button', { name: 'Aarohi Kaur: absent', exact: true }).click();
  await expect(b.getByRole('status')).toContainText('Saved on this device');
  await a.reload();
  await a.getByLabel('Device PIN', { exact: true }).fill('123456');
  await a.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(a.getByRole('button', { name: 'Aarohi Kaur: present', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await ca.setOffline(false);
  await cb.setOffline(false);
  for (const page of [a, b, a, b]) {
    await navigate(page, '/app/sync');
    await expect(page.getByRole('button', { name: 'Sync with village hub' })).toBeEnabled();
    await page.getByRole('button', { name: 'Sync with village hub' }).click();
    await expect(page.locator('.connection-pill')).not.toContainText('Syncing', { timeout: 30000 });
  }
  await navigate(a, '/app/conflicts');
  await expect(a.getByRole('heading', { name: /child-001.*attendance/ })).toBeVisible();
  const conflict = a
    .locator('.panel')
    .filter({ has: a.getByRole('heading', { name: /child-001.*attendance/ }) });
  await expect(conflict.locator('.conflict-versions article')).toHaveCount(2);
  await conflict.getByRole('button', { name: 'Keep this account' }).first().click();
  for (const page of [a, b, a]) {
    await navigate(page, '/app/sync');
    await expect(page.getByRole('button', { name: 'Sync with village hub' })).toBeEnabled();
    await page.getByRole('button', { name: 'Sync with village hub' }).click();
    await expect(page.locator('.connection-pill')).not.toContainText('Syncing', { timeout: 30000 });
  }
  await navigate(b, '/app/conflicts');
  await expect(b.getByRole('heading', { name: 'No unresolved conflicts' })).toBeVisible();
  await navigate(a, '/app/today');
  await a.evaluate(() => window.scrollTo(0, 0));
  await a.getByRole('status').waitFor({ state: 'hidden' });
  await a.screenshot({ path: 'docs/dashboard-desktop.png', fullPage: true });
  await ca.close();
  await cb.close();
});
test('mobile workspace and real lab recovery scenario', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await unlock(page, 'Mobile Judge');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.getByRole('status').waitFor({ state: 'hidden' });
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(
    true,
  );
  await page.screenshot({ path: 'docs/dashboard-mobile.png', fullPage: true });
  await navigate(page, '/lab');
  await page.getByRole('button', { name: 'Initialize two real devices' }).click();
  await expect(page.getByText('Device A · Health worker', { exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Create concurrent scenario' }).click();
  await expect(page.getByRole('button', { name: 'Create concurrent scenario' })).toBeEnabled({
    timeout: 30000,
  });
  await page.getByLabel('Link profile').selectOption('Good');
  await page.getByRole('button', { name: 'Reconnect & sync' }).click();
  await expect(page.getByText('Two dates. Both kept.', { exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Confirm 2018-04-15' }).click();
  await expect(page.getByText('Two dates. Both kept.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Lost phone drill (lab device A)' }).click();
  await expect(page.locator('.event-log')).toContainText('Digest match: true', { timeout: 30000 });
  await page.screenshot({ path: 'docs/lab-mobile.png', fullPage: true });
});
test('original lessons and quiz attempts work offline and remain in the operation ledger after reload', async ({
  page,
  context,
}) => {
  await unlock(page, 'Offline Learner');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await navigate(page, '/app/library');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Open Little numbers, big discoveries' }).click();
  await page.getByRole('button', { name: 'B 4', exact: true }).click();
  await page.getByRole('button', { name: 'Check & save my progress' }).click();
  await expect(page.getByText('That’s right. Your progress is saved.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await navigate(page, '/app/sync');
  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(
    page.locator('tr').filter({ hasText: 'lesson-division' }).filter({ hasText: 'progress' }),
  ).toBeVisible();
  await navigate(page, '/app/today');
  await page.getByRole('link', { name: 'lesson-division', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Learning library', exact: true })).toBeVisible();
});
test('keyboard attendance and bulk remaining entry preserve existing marks', async ({ page }) => {
  await unlock(page, 'Entry Worker');
  await navigate(page, '/app/school');
  await page.getByLabel('Class', { exact: true }).selectOption('Class 4');
  // Establish an existing mark on the selected day rather than depending on
  // the fixed date of the bundled demo, which stops matching after midnight.
  const existingAbsence = page.getByRole('button', { name: 'Noor Kaur: absent', exact: true });
  if ((await existingAbsence.getAttribute('aria-pressed')) !== 'true') await existingAbsence.click();
  await expect(page.getByRole('button', { name: 'Noor Kaur: absent', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('row', { name: 'Fateh Singh attendance row', exact: true }).focus();
  await page.keyboard.press('p');
  await expect(page.getByRole('button', { name: 'Fateh Singh: present', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /^Mark \d+ remaining present$/ }).click();
  await expect(page.getByRole('button', { name: 'Noor Kaur: absent', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: /^Mark 0 remaining present$/ })).toBeDisabled();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('status').waitFor({ state: 'hidden' });
  await page.screenshot({ path: 'docs/attendance-desktop.png', fullPage: true });
});
test('score entry saves zero, moves focus, and restores an invalid encrypted draft after offline reload', async ({
  page,
  context,
}) => {
  await unlock(page, 'Assessment Worker');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await navigate(page, '/app/school');
  await page.getByRole('button', { name: 'Assessments', exact: true }).click();
  await page.getByLabel('Class', { exact: true }).selectOption('Class 1');
  await page.getByLabel('Aarohi Kaur score', { exact: true }).fill('0');
  await page.getByLabel('Aarohi Kaur score', { exact: true }).press('Enter');
  await expect(page.getByLabel('Anaya Devi score', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Aarohi Kaur score', { exact: true })).toHaveValue('0');
  await page.getByLabel('Anaya Devi score', { exact: true }).fill('105');
  await page.getByLabel('Anaya Devi score', { exact: true }).press('Tab');
  await expect(page.getByText('Score must be between 0 and 100.', { exact: true })).toBeVisible();
  await expect(
    page.locator('tr').filter({ hasText: 'Anaya Devi' }).getByText('Encrypted draft saved', { exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace' }).click();
  await expect(page.getByLabel('Anaya Devi score', { exact: true })).toHaveValue('105');
  await page.getByLabel('Anaya Devi score', { exact: true }).fill('50');
  await page.getByLabel('Anaya Devi score', { exact: true }).press('Enter');
  await expect(page.getByLabel('Anaya Devi score', { exact: true })).toHaveValue('50');
  await expect(page.getByText('Score must be between 0 and 100.', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Aarohi Kaur score', { exact: true })).toHaveValue('0');
});
test('consecutive registration, reviewed CSV import, global search and dark theme work', async ({ page }) => {
  await unlock(page, 'Roster Worker');
  await navigate(page, '/app/children');
  await page.getByRole('button', { name: 'New child', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'New child', exact: true });
  await dialog.getByLabel(/Child’s name/).fill('Entry Example One');
  await dialog.getByLabel('Date of birth', { exact: true }).fill('2019-04-15');
  await dialog.getByLabel('Class', { exact: true }).selectOption('Class 3');
  await dialog.getByLabel('Village', { exact: true }).selectOption('Baran');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Save and add another' }).click();
  await expect(dialog.getByLabel(/Child’s name/)).toHaveValue('');
  await expect(dialog.getByLabel('Class', { exact: true })).toHaveValue('Class 3');
  await expect(dialog.getByLabel('Village', { exact: true })).toHaveValue('Baran');
  await dialog.getByLabel(/Child’s name/).fill('Entry Example Two');
  await dialog.getByLabel('Date of birth', { exact: true }).fill('2019-06-10');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Save child', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Import CSV', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Import child roster' })
    .locator('input[type=file]')
    .setInputFiles({
      name: 'roster.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'name,dob,class,village,guardian,consent\nCSV Example Child,2019-04-15,Class 2,Dhareri,Example Guardian,true',
      ),
    });
  await page.getByRole('dialog', { name: 'Import child roster' }).getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Import 1 children', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search workspace', { exact: true }).fill('CSV Example Child');
  await page.getByLabel('Search workspace', { exact: true }).press('Enter');
  await expect(page.getByRole('heading', { name: 'CSV Example Child', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Use light theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Use dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: 'docs/child-dark.png', fullPage: true });
});

test('hub database entry is durable, versioned, auditable, and syncs into the offline child roster', async ({
  page,
}) => {
  const name = 'Hub Entry Example';
  await unlock(page, 'Database Administrator', 'Hub Admin');
  await navigate(page, '/admin');
  await expect(page.getByRole('heading', { name: 'Hub database', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New database record', exact: true }).click();
  await page.getByLabel('Hub child name', { exact: true }).fill(name);
  await page.getByLabel('Hub date of birth', { exact: true }).fill('2019-04-15');
  await page.getByLabel('Hub class', { exact: true }).fill('Class 2');
  await page.getByLabel('Hub village', { exact: true }).fill('Dhareri');
  await page.getByLabel('Hub guardian', { exact: true }).fill('Example Guardian');
  await page.getByLabel('Hub phone', { exact: true }).fill('not-a-phone');
  await page.getByLabel('Hub shared-record consent', { exact: true }).check();
  await page.getByRole('button', { name: 'Save at hub', exact: true }).click();
  await expect(page.getByText(/phone: Enter a phone number/)).toBeVisible();
  await expect(page.getByLabel('Hub child name', { exact: true })).toHaveValue(name);
  await page.getByLabel('Hub phone', { exact: true }).fill('+91 98765 43210');
  await page.getByRole('button', { name: 'Save at hub', exact: true }).click();
  await expect(page.getByLabel('Hub child name', { exact: true })).toHaveCount(0);
  await page.getByLabel('Search hub children', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Search database', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: name });
  await expect(row).toBeVisible();
  await expect(row).toContainText('Class 2');

  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hub database', exact: true })).toBeVisible();
  await page.getByLabel('Search hub children', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Search database', exact: true }).click();
  await expect(row).toBeVisible();
  await page.getByRole('button', { name: `Edit ${name} at hub`, exact: true }).click();
  await page.getByLabel('Hub class', { exact: true }).fill('Class 4');
  await page.getByRole('button', { name: 'Save at hub', exact: true }).click();
  await expect(page.getByLabel('Hub child name', { exact: true })).toHaveCount(0);
  await expect(row).toContainText('Class 4');

  await page.getByRole('button', { name: `Archive ${name} at hub`, exact: true }).click();
  await expect(row).toContainText('Archived');
  const restore = page.getByRole('button', { name: `Restore ${name} at hub`, exact: true });
  await expect(restore).toBeEnabled();
  await restore.click();
  await expect(page.getByRole('button', { name: `Archive ${name} at hub`, exact: true })).toBeEnabled();
  await expect(row).toContainText('At hub');
  await page.locator('.toast').waitFor({ state: 'hidden' });
  await page.screenshot({ path: 'docs/hub-database-desktop.png', fullPage: true });

  await page.getByRole('tab', { name: 'Enrollment', exact: true }).click();
  await page.getByLabel('Invitation role', { exact: true }).selectOption('Teacher');
  await page.getByRole('button', { name: 'Create enrollment invitation', exact: true }).click();
  await expect(page.getByTestId('enrollment-code')).toBeVisible();
  await expect(page.getByTestId('enrollment-code')).toHaveText(/\S+/);
  await page.getByRole('tab', { name: 'Audit', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hub audit events', exact: true })).toBeVisible();
  await expect(page.getByText('invitation-created', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('manual-command', { exact: true }).first()).toBeVisible();

  await navigate(page, '/app/sync');
  await expect(page.getByRole('button', { name: 'Sync with village hub', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Sync with village hub', exact: true }).click();
  await expect(page.locator('.connection-pill')).not.toContainText('Syncing', { timeout: 30000 });
  await navigate(page, '/app/children');
  await page.getByLabel('Search children', { exact: true }).fill(name);
  const localRow = page.getByRole('row').filter({ hasText: name });
  await expect(localRow).toBeVisible();
  await expect(localRow).toContainText('Class 4');
  await expect(localRow).toContainText('Example Guardian');
});
