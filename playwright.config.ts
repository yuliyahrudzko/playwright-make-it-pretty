import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: './tests',
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code. 
  forbidOnly: !!process.env.CI,
  // Retry on CI only 
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI. 
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use. See https://playwright.dev/docs/test-reporters 
  reporter: 'html',

  use: {
    // Base URL to use in actions like `await page.goto('/')`. 
    // baseURL: 'http://127.0.0.1:3000',

    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer 
    trace: 'on-first-retry',
    launchOptions: {
      logger: {
        isEnabled: (name, severity) => true,
        log: (name, severity, message) => console.log(`${name} ${message}`)
      }
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
