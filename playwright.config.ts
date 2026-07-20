import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: process.env.CI
      ? 'node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4321'
      : 'npm.cmd run build && node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321/zh/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-chromium', testIgnore: /webkit\.spec\.ts/, use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chromium', testIgnore: /webkit\.spec\.ts/, use: { ...devices['Pixel 7'], channel: process.env.CI ? undefined : 'chrome' } },
    { name: 'webkit-core', testMatch: /webkit\.spec\.ts/, use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
  ],
});
