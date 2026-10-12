import { test, expect } from '@playwright/test';
import { waitForPrelude } from './helpers.js';

// Браузер при перезагрузке возвращает прежнюю прокрутку. Лендинг стартует в липком режиме первого экрана
// и запрещает прокрутку, поэтому посетитель застревал на футере без остальных секций (инцидент 2026-10-12).
// Так же срабатывала и автоперезагрузка при пропавшем чанке сцены во время выкатки.
test('desktop: перезагрузка внизу страницы открывает сайт с первого экрана', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.evaluate(() => window.__sticky.release());
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

  await page.reload();
  await waitForPrelude(page);
  await page.waitForTimeout(500);

  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  // первый экран в кадре: сцена наверху, футер ниже окна
  expect(await page.evaluate(() => document.getElementById('footer').getBoundingClientRect().top)).toBeGreaterThan(await page.evaluate(() => window.innerHeight));
  await expect(page.locator('body')).not.toHaveClass(/is-footer-visible/);
});
