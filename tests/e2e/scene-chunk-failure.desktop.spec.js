import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { expectSectionsMatchContent } from './helpers.js';

/**
 * Сборка сменилась под ногами: чанк сцены пропал (хостинг отдаёт на него HTML с кодом 200).
 * Страница обязана остаться рабочей: один раз перезагрузиться, а затем показать фолбэк,
 * а не пустой первый экран с застывшим лоадером.
 */
test('desktop: пропавший чанк сцены не оставляет страницу пустой', async ({ page }) => {
  let hits = 0;
  await page.route(/assets\/boot3d.*\.js|boot3d\.js/, (route) => {
    hits++;
    // так ведёт себя прод: неизвестный путь возвращает страницу, а не 404
    route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>404</title>' });
  });

  await page.goto('/');
  await expect(page.locator('#fallback img')).toBeVisible({ timeout: 20_000 });
  expect(hits, 'после первой неудачи страница перезагружается за свежим HTML').toBeGreaterThanOrEqual(2);

  // лоадер не висит, тема светлая, контент доступен
  await expect(page.locator('#loader')).toBeHidden();
  await expect(page.locator('body')).toHaveClass(/is-light/);
  await expect(page.locator('#ask-nav')).toHaveAttribute('href', content.ask.href);
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  await expectSectionsMatchContent(page, content);
});
