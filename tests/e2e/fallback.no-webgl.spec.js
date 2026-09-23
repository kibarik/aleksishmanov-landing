import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { expectSectionsMatchContent } from './helpers.js';

test('без WebGL: кадр белой сцены вместо канваса, обычный скролл, секции на месте', async ({ page }) => {
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');

  // инлайн-проверка в head пометила документ и не дала грузить сцену
  await expect(page.locator('html')).toHaveAttribute('data-webgl', 'off');
  await expect(page.locator('#loader')).toBeHidden();
  await expect(page.locator('#scene')).toBeHidden();
  await expect(page.locator('#fallback img')).toBeVisible();
  expect(requests.some((u) => /character\.glb|draco/.test(u)), 'модель и Draco не грузятся').toBe(false);

  // шапка в светлой теме, кнопка Ask видна
  await expect(page.locator('body')).toHaveClass(/is-light/);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(17, 17, 17)');
  await expect(page.locator('#ask-scene')).toBeVisible();
  await expect(page.locator('#ask-nav')).toHaveAttribute('href', content.ask.href);

  // обычный скролл: страница листается к секциям
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await expectSectionsMatchContent(page, content);
});
