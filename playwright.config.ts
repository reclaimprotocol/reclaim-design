import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'light',
    locale: 'en-US',
    reducedMotion: 'no-preference',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: {width: 1440, height: 1000},
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: {width: 900, height: 1000},
      },
    },
    {
      name: 'phone',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: {width: 390, height: 844},
      },
    },
  ],
  webServer: {
    command:
      'npm run catalog:build && npm run preview -w @reclaim/design-catalog -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
