import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene, leaveScene, rectOf } from './helpers.js';

const hint = (page) => page.evaluate(() => {
  const el = document.getElementById('scroll-hint');
  const cs = getComputedStyle(el);
  return { opacity: +cs.opacity, color: cs.color, text: el.textContent.trim(), size: parseFloat(cs.fontSize) };
});

test('desktop: подсказка «scroll down» видна в углу и на тёмной, и на белой сцене', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.waitForTimeout(3000); // подсказка появляется через 2.6 с после старта сцены

  const dark = await hint(page);
  expect(dark.text).toContain('scroll down');
  expect(dark.opacity).toBe(1);
  expect(dark.color, 'на тёмной сцене подсказка светлая').toMatch(/255, 255, 255/);
  expect(dark.size, 'подпись должна быть читаемой').toBeGreaterThanOrEqual(13);

  // в правом нижнем углу
  const r = await rectOf(page, '#scroll-hint');
  const vp = page.viewportSize();
  expect(r.right).toBeGreaterThan(vp.width * 0.9);
  expect(r.bottom).toBeGreaterThan(vp.height * 0.85);

  // на белой сцене остаётся видимой и перекрашивается
  await goToWhiteScene(page, 'desktop');
  await page.waitForTimeout(900);
  const white = await hint(page);
  expect(white.opacity, 'после перехода подсказка возвращается').toBe(1);
  expect(white.color, 'на белой сцене подсказка тёмная').toBe('rgb(17, 17, 17)');

  // после ухода сцены прячется: дальше и так обычный скролл
  await leaveScene(page, 'desktop');
  await page.waitForTimeout(500);
  expect((await hint(page)).opacity).toBe(0);
});
