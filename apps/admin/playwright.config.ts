import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke test only. Requires the API running + seeded on :3000
 * (cd apps/api && npm run seed && npm run start:dev).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
