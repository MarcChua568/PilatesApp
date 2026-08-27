import { defineConfig, devices } from '@playwright/test';

/** Smoke only. Needs the API running + seeded on :3000. */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5174',
    ...devices['Desktop Chrome'],
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
