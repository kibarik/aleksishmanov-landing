/**
 * Генерация фолбэк-кадров белой сцены (webp) из самой сцены.
 * Поднимает dev-сервер, доводит сцену до шага full на обоих пресетах, снимает кадр
 * через window.__captureWebp и кладёт в public/fallback/.
 *
 *   npm run capture:fallback
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'public', 'fallback');
const URL_ = process.env.CAPTURE_URL || 'http://localhost:5173/';
const CHANNEL = process.env.PW_CHANNEL || 'chrome';

const PRESETS = [
  { name: 'white-desktop', width: 1440, height: 900, device: null, whiteScene: 640, transition: 440 },
  { name: 'white-mobile', width: 390, height: 844, device: devices['Pixel 7'], whiteScene: 1053 },
];

async function reachable(url) {
  try { await fetch(url, { signal: AbortSignal.timeout(1500) }); return true; } catch { return false; }
}

async function startServer() {
  if (await reachable(URL_)) return null;
  console.log('поднимаю dev-сервер…');
  const proc = spawn('npm', ['run', 'dev'], { cwd: root, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    if (await reachable(URL_)) return proc;
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error(`dev-сервер не поднялся на ${URL_}`);
}

async function swipeUp(page, distance = 300, steps = 12) {
  const vp = page.viewportSize();
  const x = vp.width / 2;
  const y0 = vp.height * 0.7;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', y0);
  for (let i = 1; i <= steps; i++) { await touch('touchMove', y0 - (distance * i) / steps); await page.waitForTimeout(16); }
  await touch('touchEnd', 0);
  await cdp.detach();
}

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

const server = await startServer();
const browser = await chromium.launch({ channel: CHANNEL });
try {
  for (const preset of PRESETS) await capture(browser, preset);
} finally {
  await browser.close();
  server?.kill();
}
