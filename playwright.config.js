import { defineConfig, devices } from '@playwright/test';

// Локально используем установленный Google Chrome (без скачивания Chromium с CDN).
// В CI: PW_CHANNEL=chromium после `npx playwright install chromium`.
const channel = process.env.PW_CHANNEL || 'chrome';
// PW_PORT — свой порт dev-сервера: несколько рабочих копий (worktree) не мешают друг другу
const port = Number(process.env.PW_PORT || 5173);


export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  // PREVIEW=1 — те же тесты против собранной статики (vite build + vite preview)
  // PORTAL=1 — портал против собранного dist/ на сервере с поведением Timeweb (npm run test:portal)
  webServer: process.env.PORTAL
    ? { command: 'node scripts/serve-dist.mjs 4174', url: 'http://localhost:4174/blog/', reuseExistingServer: true, timeout: 30_000 }
    : process.env.PREVIEW
    ? {
      command: `npm run build && npx vite preview --port ${port} --strictPort`,
      url: `http://localhost:${port}`,
      reuseExistingServer: false,
      timeout: 120_000,
    }
    : {
      command: `npx vite --port ${port} --strictPort`,
      url: `http://localhost:${port}`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  projects: [
    {
      // Портал (страницы кроме главной), старые адреса, SEO-файлы: tests/e2e/*.portal.spec.js
      name: 'portal',
      testMatch: /\.portal\.spec\.js$/,
      use: {
        ...devices['Desktop Chrome'], channel, baseURL: 'http://localhost:4174',
        // старые домены на локальный сервер: проверка редиректа blog./slides./prompts. на основной хост
        launchOptions: { args: ['--host-resolver-rules=MAP *.aleksishmanov.ru 127.0.0.1'] },
      },
    },
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
