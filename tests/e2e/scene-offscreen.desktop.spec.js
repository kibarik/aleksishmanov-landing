import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene, leaveScene } from './helpers.js';

// Сцена — самый дорогой рендер страницы (персонаж, тени, постобработка). Когда посетитель ушёл к секциям
// и её не видно, она не должна рисовать: иначе GPU занят впустую и прокрутка дёргается на обычных ноутбуках.
const framesIn = (page, ms) => page.evaluate(async (d) => {
  const f0 = window.__app.renderer.info.render.frame;
  await new Promise((r) => setTimeout(r, d));
  return window.__app.renderer.info.render.frame - f0;
}, ms);

test('desktop: сцена вне экрана не рисует, при возврате наверх рисует снова', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  expect(await framesIn(page, 500)).toBeGreaterThan(5);

  await goToWhiteScene(page, 'desktop');
  await leaveScene(page, 'desktop', { screens: 3 });
  await page.evaluate(() => document.getElementById('footer').scrollIntoView());
  await page.waitForTimeout(500);
  expect(await framesIn(page, 1000)).toBe(0);
  // снимок кадра (прод-смоук, сравнение с референсом) на паузе не зависает: кадр рисуется по запросу
  const png = await page.evaluate(() => Promise.race([window.__capturePng(), new Promise((r) => setTimeout(() => r(''), 3000))]));
  expect(png.length, 'снимок на паузе').toBeGreaterThan(5000);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  expect(await framesIn(page, 500)).toBeGreaterThan(5);
});
