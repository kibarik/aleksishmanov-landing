/**
 * Замер «как у посетителя»: время загрузки и подвисания по фазам пути, с замедлением как у PageSpeed.
 *
 *   node scripts/speed-probe.mjs [url] [--mobile] [--runs N] [--no-throttle]
 *
 * Фазы: load (до первого кадра сцены и до конца пролога), transition (тёмная → белая сцена),
 * white (2 с покоя на белой сцене), leave (уход сцены и прокрутка до футера).
 * В каждой фазе — длинные задачи (> 50 мс): их сумма и самая длинная. Это и есть «зависает».
 * --dpr 2 — Retina, --headed — настоящий GPU (headless рисует иначе).
 * По умолчанию CPU ×4 и сеть «быстрый 4G» (как мобильный Lighthouse), чтобы разница была видна на быстром Mac.
 */
import { chromium, devices } from '@playwright/test';
import { swipeUp } from './local-server.mjs';

const args = process.argv.slice(2);
const URL_ = args.find((a) => /^https?:/.test(a)) || 'https://aleksishmanov.ru/';
const MOBILE = args.includes('--mobile');
const THROTTLE = !args.includes('--no-throttle');
const RUNS = Number(args[args.indexOf('--runs') + 1]) || 1;
const DPR = Number(args[args.indexOf('--dpr') + 1]) || 1;
const HEADED = args.includes('--headed');

async function once() {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', headless: !HEADED });
  const ctx = await browser.newContext(MOBILE ? { ...devices['Pixel 7'] } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (THROTTLE) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    // «быстрый 4G» Lighthouse: 150 мс RTT, 1,6 Мбит/с вниз
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
  }
  let bytes = 0;
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });

  await page.addInitScript(() => {
    window.__probe = { phase: 'load', tasks: [], marks: {} };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__probe.tasks.push({ phase: window.__probe.phase, t: Math.round(e.startTime), d: Math.round(e.duration) });
    }).observe({ type: 'longtask', buffered: true });
    // кто держал длинный кадр: скрипт и функция (Long Animation Frames API)
    window.__probe.loaf = [];
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.blockingDuration < 50) continue;
          const sc = [...e.scripts].sort((a, b) => b.duration - a.duration)[0];
          window.__probe.loaf.push({ phase: window.__probe.phase, d: Math.round(e.duration), block: Math.round(e.blockingDuration),
            src: sc ? `${(sc.sourceURL || '').split('/').pop()} ${sc.sourceFunctionName || sc.invoker || ''} ${Math.round(sc.duration)}мс` : 'без скрипта (стиль/раскладка/GPU)' });
        }
      }).observe({ type: 'long-animation-frame', buffered: true });
    } catch {}
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__probe.marks.lcp = Math.round(e.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true });
    // паузы между кадрами: подвисание отрисовки (GPU, компиляция шейдеров) не видно как longtask
    window.__probe.frames = {};
    let last = 0;
    const loop = (now) => {
      if (last) {
        const gap = now - last; const f = (window.__probe.frames[window.__probe.phase] ||= { n: 0, slow: 0, max: 0, ms: 0 });
        f.n++; f.ms += gap; if (gap > 50) f.slow++; if (gap > f.max) f.max = Math.round(gap);
      }
      last = now; requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    window.addEventListener('scene:first-frame', () => { window.__probe.marks.firstFrame = Math.round(performance.now()); }, { once: true });
  });
  const phase = (p) => page.evaluate((x) => { window.__probe.phase = x; window.__probe.marks[x] = Math.round(performance.now()); }, p);

  await page.goto(URL_, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__sticky?.state?.preludeDone === true, null, { timeout: 180_000, polling: 100 });
  await page.evaluate(() => { window.__probe.marks.prelude = Math.round(performance.now()); });
  await page.waitForTimeout(1000);

  await phase('transition');
  if (MOBILE) { await swipeUp(page); await swipeUp(page); }
  else {
    await page.mouse.move(720, 450);
    for (let k = 0; k < 2; k++) { for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(40); } await page.waitForTimeout(1500); }
  }
  await page.waitForFunction(() => document.body.classList.contains('is-light'), null, { timeout: 60_000 });
  await phase('white');
  await page.waitForTimeout(2000);

  await phase('leave');
  for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(60); }
  await page.evaluate(() => document.getElementById('footer')?.scrollIntoView());
  await page.waitForTimeout(2500);

  const r = await page.evaluate(() => window.__probe);
  await browser.close();
  const by = {};
  for (const p of ['load', 'transition', 'white', 'leave']) {
    const t = r.tasks.filter((x) => x.phase === p);
    by[p] = { sum: t.reduce((s, x) => s + x.d, 0), max: Math.max(0, ...t.map((x) => x.d)), n: t.length };
  }
  for (const p of Object.keys(by)) { const f = r.frames[p] || { n: 0, ms: 1, slow: 0, max: 0 }; Object.assign(by[p], { fps: Math.round(f.n / (f.ms / 1000)), slowFrames: f.slow, maxGap: f.max }); }
  const loaf = r.loaf.filter((x) => x.phase !== 'load' || x.block >= 80);
  return { loaf, firstFrame: r.marks.firstFrame, prelude: r.marks.prelude, lcp: r.marks.lcp, mb: +(bytes / 1e6).toFixed(2), by, top: r.tasks.sort((a, b) => b.d - a.d).slice(0, 5) };
}

for (let i = 0; i < RUNS; i++) {
  const r = await once();
  console.log(`первый кадр ${r.firstFrame} · пролог ${r.prelude} · LCP ${r.lcp} · ${r.mb} МБ`);
  for (const p of ['load', 'transition', 'white', 'leave']) {
    const b = r.by[p];
    console.log(`  ${p.padEnd(10)} fps ${b.fps} · кадров >50мс ${b.slowFrames} · макс пауза ${b.maxGap} мс · longtask ${b.sum}/${b.max} мс (${b.n})`);
  }
  for (const x of r.loaf) console.log(`  кадр ${x.phase}: ${x.d} мс (блок ${x.block}) ← ${x.src}`);
  console.log('  самые длинные:', r.top.map((x) => `${x.phase}@${x.t}:${x.d}`).join(', '));
}
