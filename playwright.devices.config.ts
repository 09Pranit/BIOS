import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testDir: 'tests/devices',
  use: { ...base.use, launchOptions: {} },
  projects: [
    ...(process.env.EDGE_PATH
      ? [
          {
            name: 'edge-desktop',
            use: {
              browserName: 'chromium' as const,
              viewport: { width: 1280, height: 900 },
              launchOptions: { executablePath: process.env.EDGE_PATH },
            },
          },
        ]
      : []),
    {
      name: 'chrome-desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 1000 },
        launchOptions: { executablePath: process.env.CHROME_PATH || undefined },
      },
    },
    { name: 'firefox-desktop', use: { browserName: 'firefox', viewport: { width: 1280, height: 800 } } },
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    {
      name: 'chrome-tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        launchOptions: { executablePath: process.env.CHROME_PATH || undefined },
      },
    },
    {
      name: 'chrome-small-phone',
      use: {
        browserName: 'chromium',
        viewport: { width: 320, height: 740 },
        isMobile: true,
        hasTouch: true,
        launchOptions: { executablePath: process.env.CHROME_PATH || undefined },
      },
    },
  ],
});
