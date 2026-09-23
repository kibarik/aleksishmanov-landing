import { defineConfig, devices } from '@playwright/test';

// Локально используем установленный Google Chrome (без скачивания Chromium с CDN).
// В CI: PW_CHANNEL=chromium после `npx playwright install chromium`.
const channel = process.env.PW_CHANNEL || 'chrome';


export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'desktop',
      testMatch: /\.desktop\.spec\.js$/,
      use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testMatch: /\.mobile\.spec\.js$/,
      use: { ...devices['Pixel 7'], channel, viewport: { width: 390, height: 844 } },
    },
    {
      // Без WebGL: тесты фолбэка (тикет 07) — testMatch ограничивает набор
      name: 'no-webgl',
      testMatch: /\.no-webgl\.spec\.js$/,
      use: {
        ...devices['Desktop Chrome'],
        channel,
        viewport: { width: 1440, height: 900 },
        launchOptions: { args: ['--disable-3d-apis'] },
      },
    },
  ],
});
