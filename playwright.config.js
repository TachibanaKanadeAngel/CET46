import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * 运行方式：npx playwright test（或 npm run test:e2e）
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5188/CET46/',
    trace: 'on-first-retry',
  },
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5188 --strictPort',
    url: 'http://localhost:5188/CET46/',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
