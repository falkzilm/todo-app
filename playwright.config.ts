import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-Smoke-Tests der Kernflüsse (DEMOPROJEK-52). Läuft headless gegen einen
 * lokal von Playwright selbst gestarteten `ng serve`, damit die Tests ohne
 * manuellen Setup-Schritt reproduzierbar sind (`npm run e2e`).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4399',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx ng serve --port 4399 --configuration development',
    url: 'http://localhost:4399',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
