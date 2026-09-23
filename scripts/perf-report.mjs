/**
 * Замер fps сцены на свободной машине: внутри общего прогона Playwright частота упирается
 * в vsync или загрузку CPU, поэтому производительность снимается отдельной командой
 * и по собранной статике, а не по dev-серверу.
 *
 *   npm run perf
 *
 * Chrome запускается без vsync, иначе частота упирается в частоту экрана (30–60 Гц).
 */
import { chromium, devices } from '@playwright/test';
import { startServer, swipeUp } from './local-server.mjs';

const URL_ = process.env.PERF_URL || 'http://localhost:4173/';
const TARGET = { desktop: 50, mobile: 40 };
const ARGS = ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'];

/** Считает кадры rAF за ms миллисекунд. */
const fpsOver = (page, ms) => page.evaluate(async (d) => {
  let n = 0;
  const t0 = performance.now();
  await new Promise((res) => { const loop = () => { n++; if (performance.now() - t0 < d) requestAnimationFrame(loop); else res(); }; loop(); });
  return n / ((performance.now() - t0) / 1000);
}, ms);

/** Кадры считаются только пока идут жесты перехода, без пауз между сегментами. */
async function transitionFps(page, preset) {
  await page.evaluate(() => {
    window.__perf = { n: 0, ms: 0, raf: 0, on: false, last: 0 };
    const loop = () => {
      const now = performance.now();
      if (window.__perf.on) { window.__perf.n++; window.__perf.ms += now - window.__perf.last; }
      window.__perf.last = now;
      window.__perf.raf = requestAnimationFrame(loop);
    };
    loop();
  });
  const on = (v) => page.evaluate((x) => { window.__perf.on = x; window.__perf.last = performance.now(); }, v);

  if (preset === 'mobile') {
    await on(true);
    await swipeUp(page);
    await swipeUp(page);
    await page.waitForFunction(() => Math.abs(window.__sticky.progress - 1053) <= 1, null, { timeout: 20_000 });
    await on(false);
  } else {
    await page.mouse.move(720, 450);
    for (const target of [440, 640]) {
      await on(true);
      for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(40); }
      await page.waitForFunction((t) => Math.abs(window.__sticky.progress - t) <= 1, target, { timeout: 20_000 });
      await on(false);
      await page.waitForTimeout(900); // пауза шага: в замер не входит
    }
  }
  return page.evaluate(() => {
    cancelAnimationFrame(window.__perf.raf);
    return window.__perf.n / (window.__perf.ms / 1000);
  });
}

const server = await startServer(URL_, 'preview:build');
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', args: ARGS });
try {
  for (const [preset, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['mobile', { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await page.goto(URL_, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForFunction(() => window.__sticky?.state?.preludeDone === true, null, { timeout: 90_000 });
    await page.waitForTimeout(1500);

    const idle = await fpsOver(page, 3000);
    const transition = await transitionFps(page, preset);
    const verdict = transition >= TARGET[preset] ? 'ok' : 'НИЖЕ ЦЕЛИ';
    console.log(`${preset}: тёмная сцена ${idle.toFixed(1)} fps, переход ${transition.toFixed(1)} fps (цель ${TARGET[preset]}) — ${verdict}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server?.kill();
}
