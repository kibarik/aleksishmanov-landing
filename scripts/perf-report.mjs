/**
 * Замер fps сцены на свободной машине: прогон Playwright меряет не сцену, а загруженный CPU,
 * поэтому производительность снимается отдельной командой.
 *
 *   npm run perf
 *
 * Chrome запускается без vsync, иначе частота упирается в частоту экрана (30–60 Гц).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL_ = process.env.PERF_URL || 'http://localhost:5173/';
const TARGET = { desktop: 50, mobile: 40 };
const ARGS = ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'];

async function reachable(url) {
  try { await fetch(url, { signal: AbortSignal.timeout(1500) }); return true; } catch { return false; }
}
async function startServer() {
  if (await reachable(URL_)) return null;
  const proc = spawn('npm', ['run', 'dev'], { cwd: root, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    if (await reachable(URL_)) return proc;
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error(`dev-сервер не поднялся на ${URL_}`);
}

const fpsOver = (page, ms) => page.evaluate(async (d) => {
  let n = 0;
  const t0 = performance.now();
  await new Promise((res) => { const loop = () => { n++; if (performance.now() - t0 < d) requestAnimationFrame(loop); else res(); }; loop(); });
  return n / ((performance.now() - t0) / 1000);
}, ms);

async function swipeUp(page, distance = 300) {
  const vp = page.viewportSize();
  const cdp = await page.context().newCDPSession(page);
  const x = vp.width / 2;
  const y0 = vp.height * 0.7;
  const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', y0);
  for (let i = 1; i <= 12; i++) { await touch('touchMove', y0 - (distance * i) / 12); await page.waitForTimeout(16); }
  await touch('touchEnd', 0);
  await cdp.detach();
}

const server = await startServer();
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', args: ARGS });
try {
  for (const [preset, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['mobile', { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await page.goto(URL_, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForFunction(() => window.__sticky?.state?.preludeDone === true, null, { timeout: 90_000 });
    await page.waitForTimeout(1500);
    const dark = await fpsOver(page, 3000);

    const t0 = performance.now();
    let frames = 0;
    const counting = page.evaluate(() => {
      window.__perf = { n: 0, t0: performance.now() };
      const loop = () => { window.__perf.n++; window.__perf.raf = requestAnimationFrame(loop); };
      loop();
    });
    await counting;
    if (preset === 'mobile') { await swipeUp(page); await swipeUp(page); } else {
      await page.mouse.move(720, 450);
      for (let k = 0; k < 2; k++) {
        for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(40); }
        await page.waitForTimeout(900);
      }
    }
    const transition = await page.evaluate(() => {
      cancelAnimationFrame(window.__perf.raf);
      return window.__perf.n / ((performance.now() - window.__perf.t0) / 1000);
    });
    void frames; void t0;
    const ok = transition >= TARGET[preset] ? 'ok' : 'НИЖЕ ЦЕЛИ';
    console.log(`${preset}: тёмная сцена ${dark.toFixed(1)} fps, переход ${transition.toFixed(1)} fps (цель ${TARGET[preset]}) — ${ok}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server?.kill();
}
