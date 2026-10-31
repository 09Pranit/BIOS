import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
const windowsChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_PATH || (existsSync(windowsChrome) ? windowsChrome : undefined);
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const render = async (source, width, height, target) => {
    await page.setViewportSize({ width, height });
    await page.setContent(
      '<!doctype html><html><body style="margin:0;background:#171d1b">' + source + '</body></html>',
    );
    await page.screenshot({ path: target });
  };
  await render(
    readFileSync('packages/site/social-card.svg', 'utf8'),
    1200,
    630,
    'apps/pwa/public/social-card.png',
  );
  const icon = readFileSync('apps/pwa/public/icon.svg', 'utf8');
  for (const size of [180, 192, 512]) {
    const svg = icon.replace('<svg ', `<svg width="${size}" height="${size}" `);
    await render(
      svg,
      size,
      size,
      'apps/pwa/public/' + (size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`),
    );
  }
  console.log('Rendered original Smriva share card and device icons.');
} finally {
  await browser.close();
}
