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

  // карта теней по спеке: 256 на десктопе (откат к 2048 роняет кадр в переходе)
  expect(await page.evaluate(() => window.__app.key.shadow.mapSize.x)).toBe(256);

  // three вынесен в отдельный чанк — видно только на сборке (в dev модули грузятся по одному)
  if (process.env.PREVIEW) {
    const js = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.endsWith('.js')));
    expect(js.some((u) => /three-[^/]*\.js$/.test(u)), `чанки: ${js.join(', ')}`).toBe(true);
  }
});
