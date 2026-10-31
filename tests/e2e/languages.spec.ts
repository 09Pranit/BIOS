import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PIN = '123456';
const labels = {
  hi: {
    language: 'हिन्दी',
    overview: 'एक नज़र',
    health: 'स्वास्थ्य रिकॉर्ड',
    child: 'स्वास्थ्य रिकॉर्ड के लिए बच्चा',
    note: 'मुलाकात का विवरण',
    library: 'शिक्षण पुस्तकालय',
    easyHeading: 'आप क्या करना चाहेंगे?',
    lightTheme: 'हल्की थीम चुनें',
    darkTheme: 'गहरी थीम चुनें',
  },
  pa: {
    language: 'ਪੰਜਾਬੀ',
    overview: 'ਸੰਖੇਪ ਜਾਣਕਾਰੀ',
    health: 'ਸਿਹਤ ਰਿਕਾਰਡ',
    child: 'ਸਿਹਤ ਰਿਕਾਰਡ ਲਈ ਬੱਚਾ',
    note: 'ਮੁਲਾਕਾਤ ਦਾ ਵੇਰਵਾ',
    library: 'ਸਿੱਖਿਆ ਲਾਇਬ੍ਰੇਰੀ',
    easyHeading: 'ਤੁਸੀਂ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?',
    lightTheme: 'ਹਲਕੀ ਥੀਮ ਚੁਣੋ',
    darkTheme: 'ਗੂੜ੍ਹੀ ਥੀਮ ਚੁਣੋ',
  },
} as const;

function languageButton(page: Page, name: string) {
  return page.locator('.language-options').getByRole('button', { name, exact: true });
}

async function enroll(page: Page, actor: string) {
  await page.goto('/app/today');
  for (const name of ['English', 'हिन्दी', 'ਪੰਜਾਬੀ']) {
    await expect(languageButton(page, name)).toBeVisible();
    await languageButton(page, name).click();
    // Displayed role labels may change; enrollment API values must stay stable in every language.
    expect(
      await page
        .locator('#enroll-role option')
        .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value)),
    ).toEqual(['Reviewer', 'Teacher', 'Health Worker', 'Hub Admin']);
  }
  await languageButton(page, 'English').click();
  await page.getByLabel('Your name', { exact: true }).fill(actor);
  await page.getByLabel('Your role', { exact: true }).selectOption('Reviewer');
  await page.getByLabel('Choose a device PIN', { exact: true }).fill(PIN);
  await page.getByRole('button', { name: 'Create demo workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('Synced', { timeout: 30000 });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

async function switchLanguage(page: Page, language: 'hi' | 'pa' | 'en') {
  const name = language === 'en' ? 'English' : labels[language].language;
  await languageButton(page, name).click();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(languageButton(page, name)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.language-option[aria-pressed="true"]')).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('smriva-language'))).toBe(language);
}

async function accessible(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  expect(
    result.violations.map((rule) => ({
      id: rule.id,
      targets: rule.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

test('top language buttons support keyboard switching and preserve an unfinished health entry when saving offline in Punjabi', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await enroll(page, 'Language Entry Worker');
  await page.locator('.repo-tabs a[href="/app/health"]').click();
  const selection = page.getByLabel('Child for health record', { exact: true });
  const childName = 'Anaya Devi';
  const childId = await selection.locator('option').filter({ hasText: childName }).getAttribute('value');
  expect(childId).toBeTruthy();
  await selection.selectOption(childId!);
  const originalNote = 'ਮਾਂ ਨੇ ਦੱਸਿਆ: ਬੱਚਾ ਸਕੂਲ ਜਾਂਦਾ ਹੈ। Parent note stays exactly as entered.';
  await page.getByLabel('Visit note', { exact: true }).fill(originalNote);

  const hindi = languageButton(page, 'हिन्दी');
  await hindi.focus();
  await page.keyboard.press('Space');
  await expect(hindi).toBeFocused();
  await expect(hindi).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  expect(
    await hindi.evaluate((node) => {
      const style = getComputedStyle(node);
      return (
        node.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
      );
    }),
  ).toBe(true);
  await expect(page.getByRole('heading', { name: labels.hi.health, exact: true })).toBeVisible();
  await expect(page.locator('.repo-tabs a[href="/app/library"]')).toHaveText(labels.hi.library);
  await expect(page.getByLabel(labels.hi.note, { exact: true })).toHaveValue(originalNote);
  await expect(page.getByLabel(labels.hi.child, { exact: true })).toHaveValue(childId!);
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'docs/smriva-hindi-desktop.png', fullPage: true, animations: 'disabled' });

  await hindi.focus();
  await page.keyboard.press('Tab');
  await expect(languageButton(page, 'ਪੰਜਾਬੀ')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(languageButton(page, 'ਪੰਜਾਬੀ')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: labels.pa.health, exact: true })).toBeVisible();
  await expect(page.getByLabel(labels.pa.note, { exact: true })).toHaveValue(originalNote);
  await expect(page.getByLabel(labels.pa.child, { exact: true })).toHaveValue(childId!);

  await switchLanguage(page, 'en');
  await expect(page.getByRole('heading', { name: 'Health records', exact: true })).toBeVisible();
  await expect(page.getByLabel('Visit note', { exact: true })).toHaveValue(originalNote);
  await expect(page.getByLabel('Child for health record', { exact: true })).toHaveValue(childId!);
  await switchLanguage(page, 'pa');
  await context.setOffline(true);
  await page.getByRole('button', { name: 'ਸਿਹਤ ਰਿਕਾਰਡ ਸੰਭਾਲੋ', exact: true }).click();
  await expect(page.getByText('ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲਿਆ ਗਿਆ। ਅਗਲਾ ਰਿਕਾਰਡ ਭਰੋ।', { exact: true })).toBeVisible();
  await expect(page.locator('.compact-events')).toContainText(originalNote);
  await expect(page.getByLabel(labels.pa.child, { exact: true })).toHaveValue(childId!);
  expect(
    await page
      .getByLabel(labels.pa.child, { exact: true })
      .evaluate((node: HTMLSelectElement) => node.selectedOptions[0].textContent),
  ).toContain(childName);
});

test('Hindi and Punjabi layouts remain accessible at 390px in standard and Easy mode with both themes', async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 390, height: 844 });
  await enroll(page, 'Mobile Language Worker');
  for (const language of ['hi', 'pa'] as const) {
    await switchLanguage(page, language);
    for (const easy of [false, true]) {
      const toggle = page.getByRole('switch');
      if ((await toggle.getAttribute('aria-checked')) !== String(easy)) await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', String(easy));
      await expect(
        page.getByRole('heading', {
          name: easy ? labels[language].easyHeading : labels[language].overview,
          exact: true,
        }),
      ).toBeVisible();
      if (easy && language === 'pa') {
        await expect(page.locator('.easy-today .easy-section-heading > span')).not.toContainText(/M\d/);
      }
      for (const theme of ['dark', 'light']) {
        if ((await page.locator('html').getAttribute('data-theme')) !== theme) {
          await page
            .getByRole('button', {
              name: theme === 'light' ? labels[language].lightTheme : labels[language].darkTheme,
              exact: true,
            })
            .click();
        }
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        for (const name of ['English', 'हिन्दी', 'ਪੰਜਾਬੀ']) {
          const button = languageButton(page, name);
          await expect(button).toBeVisible();
          const box = await button.boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(44);
          expect(box!.width).toBeGreaterThanOrEqual(44);
        }
        await page.locator('.toast').waitFor({ state: 'hidden' });
        await accessible(page);
      }
    }
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'docs/smriva-punjabi-mobile.png', fullPage: true, animations: 'disabled' });
});

test('Punjabi persists through offline PIN unlock, library filters and a translated lesson quiz', async ({
  page,
  context,
}) => {
  await enroll(page, 'Offline Language Worker');
  await page.locator('.repo-tabs a[href="/app/library"]').click();
  await switchLanguage(page, 'pa');
  await expect(page.getByRole('heading', { name: labels.pa.library, exact: true })).toBeVisible();
  const section = page.locator('#government-programmes');
  await expect(section.getByRole('article')).toHaveCount(8);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pa');
  await expect(page.getByRole('heading', { name: 'ਕਾਰਜ-ਥਾਂ ਖੋਲ੍ਹੋ', exact: true })).toBeVisible();
  await expect(languageButton(page, 'ਪੰਜਾਬੀ')).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('ਡਿਵਾਈਸ PIN', { exact: true }).fill(PIN);
  await page.getByRole('button', { name: 'ਕਾਰਜ-ਥਾਂ ਖੋਲ੍ਹੋ', exact: true }).click();
  await expect(page.getByRole('heading', { name: labels.pa.library, exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('ਆਫ਼ਲਾਈਨ');
  await section.getByRole('button', { name: 'ਸਿੱਖਿਆ', exact: true }).click();
  await expect(section.getByRole('article')).toHaveCount(6);
  await section.getByRole('button', { name: 'ਸਿਹਤ ਅਤੇ ਭਲਾਈ', exact: true }).click();
  await expect(section.getByRole('article')).toHaveCount(2);
  await section.getByRole('button', { name: 'ਸਾਰੀਆਂ ਯੋਜਨਾਵਾਂ', exact: true }).click();
  await expect(section.getByRole('article')).toHaveCount(8);
  const search = section.getByLabel('ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਲੱਭੋ', { exact: true });
  await search.fill('DIKSHA');
  await expect(section.getByRole('article')).toHaveCount(1);
  await expect(section.getByRole('article').getByRole('heading', { level: 3 })).toHaveText('DIKSHA');
  await search.fill('');
  await expect(section.getByRole('article')).toHaveCount(8);

  const waterTitle = 'ਰੋਜ਼ਾਨਾ ਦੇ ਵਿਗਿਆਨ ਦੀ ਇੱਕ ਬੂੰਦ';
  await page.locator('.lesson-card').getByRole('button', { name: waterTitle, exact: true }).click();
  const lesson = page.getByRole('dialog', { name: waterTitle, exact: true });
  await expect(lesson.locator('.lesson-reader')).toHaveAttribute('lang', 'pa');
  await expect(
    lesson.getByText('ਤਰਲ ਪਾਣੀ ਦੇ ਜਲ-ਵਾਸ਼ਪ ਵਿੱਚ ਬਦਲਣ ਨੂੰ ਕੀ ਕਹਿੰਦੇ ਹਨ?', { exact: true }),
  ).toBeVisible();
  await expect(lesson.getByText(/^ਪਾਣੀ ਠੋਸ, ਤਰਲ ਜਾਂ ਗੈਸ ਦੇ ਰੂਪ ਵਿੱਚ ਹੋ ਸਕਦਾ ਹੈ।/)).toBeVisible();
  // The displayed words change; option C remains the canonical correct answer at index 2.
  await lesson.getByRole('button', { name: 'C ਵਾਸ਼ਪੀਕਰਨ', exact: true }).click();
  await lesson.getByRole('button', { name: 'ਜਾਂਚੋ ਅਤੇ ਮੇਰੀ ਤਰੱਕੀ ਸੰਭਾਲੋ', exact: true }).click();
  await expect(lesson.getByRole('status')).toHaveText('ਸਹੀ ਜਵਾਬ। ਤੁਹਾਡੀ ਤਰੱਕੀ ਸੰਭਾਲੀ ਗਈ ਹੈ।');
  await lesson.locator('.panel-heading button').click();
  await expect(
    page.locator('.lesson-card').filter({ hasText: waterTitle }).locator('.lesson-practice-status'),
  ).toContainText('1');
});
