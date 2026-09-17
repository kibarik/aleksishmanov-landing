/**
 * Хелперы E2E. Хуки window.__sticky / window.__app используются только для чтения
 * (прогресс шагов, факт ухода сцены, захват кадра); управление — колесом, свайпом, кликами.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
export const GOLDEN_DIR = path.join(here, 'golden');

/** Прогресс шагов липкого скролла (см. tests/bersus-scroll-analysis.md, UNIT 200 / 260). */
export const STEPS = {
  desktop: { darkScene: 200, transition: 440, whiteScene: 640 },
  mobile: { darkScene: 260, whiteScene: 1053 },
};

/** Ждёт загрузку сцены и окончание prelude (тёмная сцена в стартовой позе). */
export async function waitForPrelude(page) {
  await page.waitForFunction(() => window.__sticky?.state?.preludeDone === true, null, { timeout: 60_000 });
}

export async function readProgress(page) {
  return page.evaluate(() => Math.round(window.__sticky.progress));
}

/** Сцена отдала нативный скролл (уход сцены). */
export async function isSceneLeft(page) {
  return page.evaluate(() => window.__sticky.state.released === true);
}

/** Ждёт, пока прогресс липкого скролла дойдёт до значения (с допуском). */
export async function waitForProgress(page, value, { timeout = 15_000, eps = 1 } = {}) {
  await page.waitForFunction(
    ([v, e]) => Math.abs(window.__sticky.progress - v) <= e,
    [value, eps],
    { timeout },
  );
}

/** Пачка тиков колеса, как реальный жест: несколько событий подряд. */
export async function wheelBurst(page, { ticks = 4, delta = 100, gapMs = 40 } = {}) {
  const vp = page.viewportSize();
  await page.mouse.move(vp.width / 2, vp.height / 2);
  for (let i = 0; i < ticks; i++) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(gapMs);
  }
}

/** Свайп вверх (контент вниз) через CDP touch-события. Только Chromium. */
export async function swipeUp(page, { distance = 300, steps = 12 } = {}) {
  const vp = page.viewportSize();
  const x = vp.width / 2;
  const y0 = vp.height * 0.7;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', y0);
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', y0 - (distance * i) / steps);
    await page.waitForTimeout(16);
  }
  await touch('touchEnd', 0);
  await cdp.detach();
}

const goldenPath = (name) => path.join(GOLDEN_DIR, `${name}.png`);

/**
 * Сравнивает текущий кадр сцены с золотым через window.__compareTo (метрики src/compare.js).
 * score — взвешенная сумма отклонений; 0 = идентично. Порог по умолчанию 4.
 * Отсутствующий золотой кадр — ошибка; записать можно только с UPDATE_GOLDEN=1.
 */
export async function expectGolden(page, name, { threshold = 4 } = {}) {
  // имя на сцене перерисовывается после загрузки шрифта — дожидаемся, чтобы кадр был детерминирован
  await page.waitForFunction(() => document.fonts.check('900 40px Montserrat'), null, { timeout: 15_000 });
  await page.waitForTimeout(300);
  const current = await page.evaluate(() => window.__capturePng());
  const file = goldenPath(name);
  if (process.env.UPDATE_GOLDEN) {
    fs.mkdirSync(GOLDEN_DIR, { recursive: true });
    fs.writeFileSync(file, Buffer.from(current.split(',')[1], 'base64'));
    return;
  }
  expect(fs.existsSync(file), `нет золотого кадра ${file}; создай: npm run test:update-golden`).toBe(true);
  const goldenUrl = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  const result = await page.evaluate((url) => window.__compareTo(url), goldenUrl);
  expect(result.score, `золотой кадр "${name}": score ${result.score} > ${threshold}: ${JSON.stringify(result.diff)}`).toBeLessThanOrEqual(threshold);
}
