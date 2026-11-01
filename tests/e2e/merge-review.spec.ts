import { test, expect, type Page } from '@playwright/test';

async function enroll(page: Page, actor: string) {
  await page.goto('/app/today');
  await page.getByLabel('Your name', { exact: true }).fill(actor);
  await page.getByLabel('Choose a device PIN', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('Synced', {
    timeout: 30000,
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

async function navigate(page: Page, path: string) {
  await page.locator(`.sidebar nav a[href="${path}"]`).click();
}

async function sync(page: Page) {
  await navigate(page, '/app/settings#sync');
  const button = page.getByRole('button', { name: 'Sync now', exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toBeEnabled({ timeout: 30000 });
  await expect(page.locator('.connection-pill')).toContainText('Synced');
  await expect(page.getByText('Quarantined operations: 0', { exact: true })).toBeVisible();
}

async function createChild(page: Page, name: string) {
  await navigate(page, '/app/children');
  await page.getByRole('button', { name: 'New', exact: true }).last().click();
  await page.getByRole('button', { name: 'Student', exact: true }).last().click();
  const form = page.getByRole('dialog', { name: 'New student', exact: true });
  // The form names are stable across typography changes to the visible apostrophe.
  await form.locator('input[name="name"]').fill(name);
  await form.getByLabel('Date of birth', { exact: true }).fill('2018-01-10');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Save student', exact: true }).click();
  await expect(form).toHaveCount(0);
  const link = page.getByRole('link').filter({ has: page.getByText(name, { exact: true }) });
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^\/app\/children\/child-/);
  return href!;
}

async function openChild(page: Page, href: string) {
  await navigate(page, '/app/children');
  await page.locator(`.person-link[href="${href}"]`).click();
}

async function correctDob(page: Page, href: string, value: string) {
  await openChild(page, href);
  await page.getByRole('button', { name: 'Correct details', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Edit child', exact: true });
  await form.getByLabel('Date of birth', { exact: true }).fill(value);
  await form.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(form).toHaveCount(0);
}

async function addVisit(page: Page, childId: string, note: string) {
  await navigate(page, '/app/health');
  await page.getByLabel('Child for health record', { exact: true }).selectOption(childId);
  await page.getByLabel('Visit note', { exact: true }).fill(note);
  await page.getByRole('button', { name: 'Save health record', exact: true }).click();
  await expect(page.getByText('Saved locally. Ready for the next record.', { exact: true })).toBeVisible();
}

function conflictPanel(page: Page, name: string, field: string) {
  return page.locator('.panel').filter({
    has: page.getByRole('heading', { name: new RegExp(`${name}.*${field}$`) }),
  });
}

test('offline DOB edits require attributed human review while independent visits merge and originals survive a corrected resolution', async ({
  browser,
  baseURL,
}) => {
  const ca = await browser.newContext({ baseURL });
  const cb = await browser.newContext({ baseURL });
  const a = await ca.newPage();
  const b = await cb.newPage();
  const name = 'Merge Review Example';
  const actors = ['Merge Reviewer A', 'Merge Reviewer B'];
  const dates = ['2018-04-15', '2018-05-20'];
  const notes = ['Independent offline visit from worker A', 'Independent offline visit from worker B'];
  const reviewedDate = '2018-06-12';
  try {
    await enroll(a, actors[0]);
    await enroll(b, actors[1]);
    const href = await createChild(a, name);
    const childId = href.split('/').at(-1)!;
    for (const page of [a, b]) await sync(page);
    await ca.setOffline(true);
    await cb.setOffline(true);

    // Both devices start from the same causal baseline, then lose contact.
    await correctDob(a, href, dates[0]);
    await correctDob(b, href, dates[1]);
    await addVisit(a, childId, notes[0]);
    await addVisit(b, childId, notes[1]);
    for (const [page, ownNote, otherNote] of [
      [a, notes[0], notes[1]],
      [b, notes[1], notes[0]],
    ] as const) {
      await openChild(page, href);
      await expect(page.locator('.timeline').getByText(ownNote, { exact: true })).toHaveCount(1);
      await expect(page.locator('.timeline').getByText(otherNote, { exact: true })).toHaveCount(0);
    }

    await ca.setOffline(false);
    await cb.setOffline(false);
    for (const page of [a, b, a, b]) await sync(page);
    for (const page of [a, b]) {
      await openChild(page, href);
      // No clock-selected DOB is presented as the final answer while the conflict is open.
      await expect(page.locator('.child-header')).toContainText('Needs review');
      await expect(page.getByText('This record has competing accounts.', { exact: false })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Correct details', exact: true })).toBeDisabled();
      for (const note of notes)
        await expect(page.locator('.timeline').getByText(note, { exact: true })).toHaveCount(1);
      await navigate(page, '/app/conflicts');
      const panel = conflictPanel(page, name, 'dob');
      await expect(panel).toHaveCount(1);
      await expect(panel.getByText('Human review required', { exact: true })).toBeVisible();
      await expect(panel.locator('.conflict-versions article')).toHaveCount(2);
      for (let index = 0; index < actors.length; index++) {
        const version = panel.locator('.conflict-versions article').filter({ hasText: actors[index] });
        await expect(version).toHaveCount(1);
        await expect(version.getByRole('heading', { name: dates[index], exact: true })).toBeVisible();
        await expect(version).toContainText('Device');
      }
    }

    const panel = conflictPanel(a, name, 'dob');
    await panel.screenshot({ path: 'docs/smriva-conflict-review.png' });
    await panel.getByLabel('Corrected Date of birth', { exact: true }).fill(reviewedDate);
    await panel.getByRole('button', { name: 'Save reviewed value', exact: true }).click();
    await expect(panel).toHaveCount(0);
    for (const page of [a, b, a, b]) await sync(page);

    const checksums: string[] = [];
    for (const page of [a, b]) {
      await expect(page.locator('.hash')).toHaveText(/^[a-f0-9]{64}$/);
      checksums.push((await page.locator('.hash').textContent())!);
      await openChild(page, href);
      await expect(page.locator('.child-header')).toContainText(reviewedDate);
      await expect(page.locator('.child-header')).not.toContainText('Needs review');
      const history = page.locator('.audit-list');
      for (let index = 0; index < dates.length; index++) {
        const original = history.locator(':scope > div').filter({ hasText: dates[index] });
        await expect(original).toHaveCount(1);
        await expect(original).toContainText(actors[index]);
      }
      await expect(
        history.locator(':scope > div').filter({ hasText: reviewedDate }).locator('.audit-kind'),
      ).toHaveText('resolve');
      for (const note of notes)
        await expect(page.locator('.timeline').getByText(note, { exact: true })).toHaveCount(1);
      await navigate(page, '/app/conflicts');
      await expect(conflictPanel(page, name, 'dob')).toHaveCount(0);
    }
    // Includes original operations and signatures, not just equivalent screen values.
    expect(checksums[0]).toBe(checksums[1]);
  } finally {
    await ca.close();
    await cb.close();
  }
});

test('independent offline profile corrections merge without rewriting unchanged fields or creating an unnecessary conflict', async ({
  browser,
  baseURL,
}) => {
  const ca = await browser.newContext({ baseURL });
  const cb = await browser.newContext({ baseURL });
  const a = await ca.newPage();
  const b = await cb.newPage();
  const name = 'Independent Profile Example';
  const actors = ['Profile Worker A', 'Profile Worker B'];
  const editedDob = '2018-09-24';
  const editedGuardian = 'Example Caregiver';
  try {
    await enroll(a, actors[0]);
    await enroll(b, actors[1]);
    const href = await createChild(a, name);
    for (const page of [a, b]) await sync(page);
    await ca.setOffline(true);
    await cb.setOffline(true);

    await correctDob(a, href, editedDob);
    await openChild(b, href);
    await b.getByRole('button', { name: 'Correct details', exact: true }).click();
    const form = b.getByRole('dialog', { name: 'Edit child', exact: true });
    await form.locator('input[name="guardian"]').fill(editedGuardian);
    await form.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(form).toHaveCount(0);
    // Neither offline device has seen the other's independent correction.
    await expect(b.locator('.child-header')).toContainText('2018-01-10');
    await expect(b.getByText(editedGuardian, { exact: true }).first()).toBeVisible();
    await expect(a.getByText(editedGuardian, { exact: true })).toHaveCount(0);

    await ca.setOffline(false);
    await cb.setOffline(false);
    for (const page of [a, b, a, b]) await sync(page);
    for (const page of [a, b]) {
      await openChild(page, href);
      await expect(page.locator('.child-header')).toContainText(editedDob);
      await expect(page.locator('.child-header')).not.toContainText('Needs review');
      await expect(page.getByRole('button', { name: 'Correct details', exact: true })).toBeEnabled();
      await expect(page.locator('.detail-list').getByText(editedGuardian, { exact: true })).toBeVisible();
      const history = page.locator('.audit-list');
      // Six initial fields plus exactly one correction from each worker.
      await expect(history.locator(':scope > div')).toHaveCount(8);
      await expect(history.locator(':scope > div').filter({ hasText: actors[1] })).toHaveCount(1);
      for (const [field, count] of [
        ['name', 1],
        ['dob', 2],
        ['guardian', 2],
        ['class', 1],
        ['village', 1],
        ['consent', 1],
      ] as const) {
        await expect(
          history.locator(':scope > div').filter({
            has: page.locator('strong').filter({ hasText: new RegExp(`^${field}$`) }),
          }),
        ).toHaveCount(count);
      }
      const dateCorrection = history.locator(':scope > div').filter({ hasText: editedDob });
      await expect(dateCorrection).toContainText(actors[0]);
      const guardianCorrection = history.locator(':scope > div').filter({ hasText: editedGuardian });
      await expect(guardianCorrection).toContainText(actors[1]);
      await expect(history.locator(':scope > div').filter({ hasText: '2018-01-10' })).toHaveCount(1);
      await navigate(page, '/app/conflicts');
      await expect(conflictPanel(page, name, '.*')).toHaveCount(0);
    }
  } finally {
    await ca.close();
    await cb.close();
  }
});

test('an offline deletion competing with an edit is explicit and a reviewer can retain the edited record without erasing the deletion', async ({
  browser,
  baseURL,
}) => {
  const ca = await browser.newContext({ baseURL });
  const cb = await browser.newContext({ baseURL });
  const a = await ca.newPage();
  const b = await cb.newPage();
  const name = 'Deletion Review Example';
  const editedDob = '2018-08-21';
  try {
    await enroll(a, 'Deletion Worker');
    await enroll(b, 'Independent Editing Worker');
    const href = await createChild(a, name);
    for (const page of [a, b]) await sync(page);
    await ca.setOffline(true);
    await cb.setOffline(true);
    await openChild(a, href);
    await a.getByRole('button', { name: 'Mark record deleted (preserves history)', exact: true }).click();
    await expect(a.getByRole('button', { name: 'Restore record', exact: true })).toBeVisible();
    await correctDob(b, href, editedDob);
    await ca.setOffline(false);
    await cb.setOffline(false);
    for (const page of [a, b, a, b]) await sync(page);

    for (const page of [a, b]) {
      await navigate(page, '/app/conflicts');
      const panel = conflictPanel(page, name, 'deleted');
      await expect(panel).toHaveCount(1);
      await expect(
        panel.getByText(
          'A deletion and an edit happened independently. Both must be reviewed before the record changes.',
        ),
      ).toBeVisible();
      const deletion = panel.locator('.conflict-versions article').filter({ hasText: 'Deletion Worker' });
      await expect(deletion.getByRole('heading', { name: 'true', exact: true })).toBeVisible();
      await expect(panel.getByRole('heading', { name: editedDob, exact: true })).toBeVisible();
    }
    const editedVersion = conflictPanel(a, name, 'deleted')
      .locator('.conflict-versions article')
      .filter({ has: a.getByRole('heading', { name: editedDob, exact: true }) });
    await editedVersion.getByRole('button', { name: 'Keep this account', exact: true }).click();
    await expect(conflictPanel(a, name, 'deleted')).toHaveCount(0);
    for (const page of [a, b, a, b]) await sync(page);

    for (const page of [a, b]) {
      await openChild(page, href);
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
      await expect(page.locator('.child-header')).toContainText(editedDob);
      const history = page.locator('.audit-list');
      const deletion = history.locator(':scope > div').filter({ hasText: 'Deletion Worker' });
      await expect(
        deletion.filter({ has: page.locator('.audit-kind', { hasText: /^delete$/ }) }),
      ).toHaveCount(1);
      const review = history
        .locator(':scope > div')
        .filter({ has: page.locator('.audit-kind', { hasText: /^resolve$/ }) });
      await expect(review).toContainText('deleted');
      await expect(review).toContainText('false');
      await navigate(page, '/app/conflicts');
      await expect(conflictPanel(page, name, 'deleted')).toHaveCount(0);
    }
  } finally {
    await ca.close();
    await cb.close();
  }
});
