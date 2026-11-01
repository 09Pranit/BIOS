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
    ).toEqual(['Reviewer', 'Teacher', 'Hub Admin']);
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

test('education workspace has no health centre, patient creation or removed dashboard panels', async ({
  page,
}) => {
  await page.goto('/app/today');
  await expect(
    page.getByLabel('Your role', { exact: true }).locator('option[value="Health Worker"]'),
  ).toHaveCount(0);
  await enroll(page, 'Education Worker');
  await expect(page.locator('a[href="/app/health"]')).toHaveCount(0);
  await expect(page.getByText('Recent changes', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Keyboard shortcuts', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Saved on this device', { exact: true })).toHaveCount(0);
  await page.locator('.new-global').click();
  await expect(page.locator('.new-menu-options a')).toHaveText(['Student']);
  await page.goto('/app/health');
  await expect(page.getByRole('heading', { name: 'We couldn’t find that page.' })).toBeVisible();
});

test('Hindi and Punjabi layouts remain accessible at 390px with both themes', async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 390, height: 844 });
  await enroll(page, 'Mobile Language Worker');
  for (const language of ['hi', 'pa'] as const) {
    await switchLanguage(page, language);
    await expect(page.getByRole('heading', { name: labels[language].overview, exact: true })).toBeVisible();
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
  await page.evaluate(() => scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await page.screenshot({ path: 'docs/smriva-punjabi-mobile.png', fullPage: true, animations: 'disabled' });
});

test('Punjabi persists through offline PIN unlock and education scheme filters', async ({
  page,
  context,
}) => {
  await enroll(page, 'Offline Language Worker');
  await page.locator('.repo-tabs a[href="/app/library"]').click();
  await switchLanguage(page, 'pa');
  await expect(page.getByRole('heading', { name: 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ', exact: true })).toBeVisible();
  const section = page.locator('#government-programmes');
  await expect(section.getByRole('article')).toHaveCount(6);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pa');
  await expect(page.getByRole('heading', { name: 'ਕਾਰਜ-ਥਾਂ ਖੋਲ੍ਹੋ', exact: true })).toBeVisible();
  await expect(languageButton(page, 'ਪੰਜਾਬੀ')).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('ਡਿਵਾਈਸ PIN', { exact: true }).fill(PIN);
  await page.getByRole('button', { name: 'ਕਾਰਜ-ਥਾਂ ਖੋਲ੍ਹੋ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ', exact: true })).toBeVisible();
  await expect(page.locator('.connection-pill')).toContainText('ਆਫ਼ਲਾਈਨ');
  await section.getByRole('button', { name: 'ਸਿੱਖਿਆ', exact: true }).click();
  await expect(section.getByRole('article')).toHaveCount(6);
  await section.getByRole('button', { name: 'ਸਾਰੀਆਂ ਯੋਜਨਾਵਾਂ', exact: true }).click();
  await expect(section.getByRole('article')).toHaveCount(6);
  const search = section.getByLabel('ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਲੱਭੋ', { exact: true });
  await search.fill('DIKSHA');
  await expect(section.getByRole('article')).toHaveCount(1);
  await expect(section.getByRole('article').getByRole('heading', { level: 3 })).toHaveText('DIKSHA');
  await search.fill('');
  await expect(section.getByRole('article')).toHaveCount(6);

  await expect(page.locator('.lesson-card')).toHaveCount(0);
});
