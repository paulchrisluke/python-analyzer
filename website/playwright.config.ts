import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Tests with admin authentication
    {
      name: 'admin-tests',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './tests/auth-states/admin-state.json',
      },
      dependencies: ['setup'],
      testMatch: /.*admin.*\.spec\.ts/,
    },
    // Tests with buyer authentication
    {
      name: 'buyer-tests',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './tests/auth-states/buyer-state.json',
      },
      dependencies: ['setup'],
      testMatch: /.*buyer.*\.spec\.ts/,
    },
    // Tests with viewer authentication
    {
      name: 'viewer-tests',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './tests/auth-states/viewer-state.json',
      },
      dependencies: ['setup'],
      testMatch: /.*viewer.*\.spec\.ts/,
    },
    // Tests that need multiple roles or no authentication
    {
      name: 'multi-role-tests',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*role.*\.spec\.ts/,
    },
    // General tests without authentication
    {
      name: 'general-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /^(?!.*(admin|buyer|viewer|role)).*\.spec\.ts$/,
    },
    // Cross-browser tests (without authentication for now)
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*landing.*\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*landing.*\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
