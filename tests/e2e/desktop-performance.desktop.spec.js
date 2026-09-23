import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene } from './helpers.js';

test('desktop: переход держит кадры, тени обновляются по событию, сцена сообщает о первой отрисовке', async ({ page }) => {
  // флаг ставится обработчиком события ещё до загрузки бандла страницы
  await page.addInitScript(() => {
    window.__firstFrameSeen = false;
    window.addEventListener('scene:first-frame', () => { window.__firstFrameSeen = true; }, { once: true });
  });
  await page.goto('/');
  await waitForPrelude(page);

  // событие первой отрисовки сцены: по нему подключается сторонний JS (Метрика)
  expect(await page.evaluate(() => window.__firstFrameSeen)).toBe(true);

  // тени не пересчитываются каждый кадр
  expect(await page.evaluate(() => window.__app.renderer.shadowMap.autoUpdate)).toBe(false);

  // GTAO в покое тёмной сцены включён
  expect(await page.evaluate(() => window.__app.gtao.enabled)).toBe(true);

  await goToWhiteScene(page, 'desktop');
  await expect(page.locator('body')).toHaveClass(/is-light/);
  // на белой сцене AO выключен: самый дорогой проход не работает там, где он не нужен
  expect(await page.evaluate(() => window.__app.gtao.enabled)).toBe(false);
  expect(await page.evaluate(() => window.__app.renderer.getPixelRatio())).toBeLessThanOrEqual(1.5);

  // три отдельно от кода страницы: чанк грузится своим запросом
  const chunks = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name));
  expect(chunks.some((u) => /three|boot3d/.test(u)), `чанки: ${chunks.filter((u) => u.endsWith('.js')).join(', ')}`).toBe(true);
});
