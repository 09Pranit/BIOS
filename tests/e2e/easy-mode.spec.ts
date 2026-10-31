import { test, expect, type Page } from '@playwright/test';

async function enroll(page: Page, actor: string) {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill(actor);
  const role = page.getByLabel('Your role', { exact: true });
  await expect(role.locator('option[value="Reviewer"]')).toHaveText('Community member');
  await role.selectOption('Reviewer');
  await page.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

async function navigate(page: Page, path: string) {
  if ((page.viewportSize()?.width ?? 1440) < 700)
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.locator(`.sidebar nav a[href="${path}"]`).click();
}

async function noDocumentOverflow(page: Page) {
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(
    true,
  );
}

function activity(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Choose an activity', exact: true }).getByRole('link', {
    name: new RegExp('^' + name + '(?:\\s|$)'),
  });
}

async function keyboardFocus(page: Page) {
  const mode = page.getByRole('switch', { name: 'Easy mode', exact: true });
  await mode.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(mode).toBeFocused();
  expect(
    await mode.evaluate((node) => {
      const style = getComputedStyle(node);
      return (
        node.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
      );
    }),
  ).toBe(true);
}

test('Easy mode keeps data entry, unsaved forms and encrypted drafts intact across switching and offline reload', async ({
  page,
  context,
}) => {
  await enroll(page, 'Easy Community Worker');
  await expect(page.locator('.sidebar-user')).toContainText('Community member');
  const mode = page.getByRole('switch', { name: 'Easy mode', exact: true });
  await expect(mode).toHaveAttribute('aria-checked', 'false');
  await page.locator('.toast').waitFor({ state: 'hidden' });
  await page.screenshot({ path: 'docs/smriva-standard-desktop.png', fullPage: true });
  await keyboardFocus(page);
  await page.keyboard.press('Space');
  await expect(mode).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('heading', { name: 'What would you like to do?', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('smriva-easy-mode'))).toBe('true');
  for (const [label, route] of [
    ['Add a child', '/app/children?new=1'],
    ['Mark attendance', '/app/school'],
    ['Enter marks', '/app/school?tab=assessments'],
    ['Add a health visit', '/app/health'],
    ['Open learning activities', '/app/library'],
    ['Find a child', '/app/children'],
  ]) {
    await expect(activity(page, label)).toHaveAttribute('href', route);
  }
  await noDocumentOverflow(page);
  await page.locator('.toast').waitFor({ state: 'hidden' });
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'docs/smriva-easy-desktop.png', fullPage: true });
  await activity(page, 'Add a child').click();
  const child = 'Easy Entry Child';
  const dialog = page.getByRole('dialog', { name: 'New child', exact: true });
  await dialog.getByLabel(/Child.s name/).fill(child);
  await dialog.getByLabel('Date of birth', { exact: true }).fill('2019-04-15');
  await dialog.getByLabel('Class', { exact: true }).selectOption('Class 3');
  await dialog.getByLabel('Village', { exact: true }).selectOption('Baran');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Save child', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await navigate(page, '/app/health');
  await expect(page.getByText('How to use this page', { exact: true })).toBeVisible();
  const selection = page.getByLabel('Child for health record', { exact: true });
  const childId = await selection.locator('option').filter({ hasText: child }).getAttribute('value');
  expect(childId).toBeTruthy();
  await selection.selectOption(childId!);
  const note = 'Easy mode preserves an unfinished visit while changing the interface.';
  await page.getByLabel('Visit note', { exact: true }).fill(note);
  await mode.click();
  await expect(mode).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByLabel('Visit note', { exact: true })).toHaveValue(note);
  await expect(selection).toHaveValue(childId!);
  await mode.click();
  await expect(page.getByLabel('Visit note', { exact: true })).toHaveValue(note);
  await expect(selection).toHaveValue(childId!);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Save health record', exact: true }).click();
  await expect(page.getByText('Saved locally. Ready for the next record.', { exact: true })).toBeVisible();
  await expect(page.locator('.compact-events')).toContainText(note);
  await navigate(page, '/app/school');
  await page.getByLabel('Class', { exact: true }).selectOption('Class 3');
  await page.getByRole('button', { name: `${child}: present`, exact: true }).click();
  await expect(page.getByRole('button', { name: `${child}: present`, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Assessments', exact: true }).click();
  await page.getByLabel('Class', { exact: true }).selectOption('Class 1');
  await page.getByLabel('Anaya Devi score', { exact: true }).fill('105');
  await page.getByLabel('Anaya Devi score', { exact: true }).press('Tab');
  await expect(
    page.locator('tr').filter({ hasText: 'Anaya Devi' }).getByText('Encrypted draft saved', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel('Device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
  await expect(mode).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('Anaya Devi score', { exact: true })).toHaveValue('105');
  await mode.click();
  await expect(page.getByLabel('Anaya Devi score', { exact: true })).toHaveValue('105');
  await expect(page.locator('.sidebar nav a[href="/app/school"]')).toHaveText('Classroom');
  await page.getByRole('button', { name: 'Attendance', exact: true }).click();
  await page.getByLabel('Class', { exact: true }).selectOption('Class 3');
  await expect(page.getByRole('button', { name: `${child}: present`, exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await navigate(page, '/app/health');
  await page.getByLabel('Child for health record', { exact: true }).selectOption(childId!);
  await expect(page.locator('.compact-events')).toContainText(note);
  await navigate(page, '/app/today');
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
});

test('Easy mode is usable at 390px with keyboard focus, large controls and both color themes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enroll(page, 'Mobile Community Worker');
  const mode = page.getByRole('switch', { name: 'Easy mode', exact: true });
  await mode.click();
  await expect(page.getByRole('heading', { name: 'What would you like to do?', exact: true })).toBeVisible();
  await expect(page.locator('.global-header .brand .brand-copy strong')).toBeVisible();
  const box = await mode.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.width).toBeGreaterThanOrEqual(44);
  await keyboardFocus(page);
  for (const name of [
    'Add a child',
    'Mark attendance',
    'Enter marks',
    'Add a health visit',
    'Open learning activities',
    'Find a child',
  ]) {
    const action = activity(page, name);
    await expect(action).toBeVisible();
    expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await noDocumentOverflow(page);
  await page.getByRole('button', { name: 'Use light theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(mode).toHaveAttribute('aria-checked', 'true');
  await noDocumentOverflow(page);
  await page.getByRole('button', { name: 'Use dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.toast').waitFor({ state: 'hidden' });
  await page.screenshot({ path: 'docs/smriva-easy-mobile.png', fullPage: true });
  await activity(page, 'Open learning activities').click();
  await expect(page.getByRole('heading', { name: 'Learning library', exact: true })).toBeVisible();
  await noDocumentOverflow(page);
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  for (const [route, label] of [
    ['/app/today', 'Home'],
    ['/app/school', 'Attendance & marks'],
    ['/app/health', 'Health'],
    ['/app/library', 'Learn'],
    ['/app/sync', 'Save & share'],
    ['/app/conflicts', 'Check differences'],
  ])
    await expect(page.locator(`.sidebar nav a[href="${route}"]`)).toHaveText(label);
});
