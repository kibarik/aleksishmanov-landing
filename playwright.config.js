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
  // PREVIEW=1 — те же тесты против собранной статики (vite build + vite preview)
  webServer: process.env.PREVIEW
    ? {
      command: 'npm run build && npx vite preview --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120_000,
    }
    : {
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
      // Кроссбраузерный прогон пути посетителя (тикет 11): npx playwright test --project=webkit
      name: 'webkit',
      testMatch: /visitor-path\.desktop\.spec\.js$/,
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'firefox',
      testMatch: /visitor-path\.desktop\.spec\.js$/,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
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
