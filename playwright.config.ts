import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3002',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.CHROME_PATH || undefined },
  },
  webServer: {
    command: 'node --import tsx apps/hub/src/index.ts',
    url: 'http://127.0.0.1:3002/api/health',
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      PORT: '3002',
      HOST: '127.0.0.1',
      DATABASE_PATH: `./.tools/e2e-${process.pid}.sqlite`,
      DEMO_JUDGE_MODE: 'true',
    },
  },
  reporter: 'list',
});
