/**
 * Генерация фолбэк-кадров белой сцены (webp) из самой сцены.
 * Поднимает dev-сервер, доводит сцену до шага full на обоих пресетах, снимает кадр
 * через window.__captureWebp и кладёт в public/fallback/.
 *
 *   npm run capture:fallback
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';
import { ROOT, startServer, swipeUp } from './local-server.mjs';

const OUT_DIR = path.join(ROOT, 'public', 'fallback');
const URL_ = process.env.CAPTURE_URL || 'http://localhost:5173/';
const CHANNEL = process.env.PW_CHANNEL || 'chrome';

const PRESETS = [
  { name: 'white-desktop', width: 1440, height: 900, device: null, whiteScene: 640, transition: 440 },
  { name: 'white-mobile', width: 390, height: 844, device: devices['Pixel 7'], whiteScene: 1053 },
];

const atProgress = (page, v) => page.waitForFunction((p) => Math.abs(window.__sticky.progress - p) <= 1, v, { timeout: 20_000 });

async function capture(browser, preset) {
  const ctx = await browser.newContext({ ...(preset.device || {}), viewport: { width: preset.width, height: preset.height } });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.__sticky?.state?.preludeDone === true, null, { timeout: 90_000 });

  if (preset.device) {
    await swipeUp(page);
    await swipeUp(page);
  } else {
    await page.mouse.move(preset.width / 2, preset.height / 2);
    const burst = async () => { for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(40); } };
    await burst();
    await atProgress(page, preset.transition);
    await page.waitForTimeout(800);
    await burst();
  }
  await atProgress(page, preset.whiteScene);

  // шрифт имени и свет успевают доехать до захвата
  await page.waitForFunction(() => document.fonts.check('900 40px Montserrat'), null, { timeout: 15_000 });
  await page.waitForTimeout(2500);

  const dataUrl = await page.evaluate((w) => window.__captureWebp(w, 0.9), preset.width);
  const file = path.join(OUT_DIR, `${preset.name}.webp`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`${preset.name}.webp — ${(fs.statSync(file).size / 1024).toFixed(0)} КБ`);
  await ctx.close();
}

const server = await startServer(URL_);
const browser = await chromium.launch({ channel: CHANNEL });
try {
  for (const preset of PRESETS) await capture(browser, preset);
} finally {
  await browser.close();
  server?.kill();
}
