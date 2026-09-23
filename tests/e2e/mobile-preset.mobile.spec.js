import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene } from './helpers.js';

test('mobile: грузится облегчённый персонаж, рендер в облегчённом пресете', async ({ page }) => {
  const models = [];
  page.on('request', (r) => { if (/\.glb(\?|$)/.test(r.url())) models.push(r.url()); });
  await page.goto('/');
  await waitForPrelude(page);

  // облегчённый персонаж вместо десктопного
  expect(models.some((u) => u.includes('character-mobile.glb')), `запрошено: ${models}`).toBe(true);
  expect(models.some((u) => /\/character\.glb/.test(u))).toBe(false);

  const r = await page.evaluate(() => ({
    dpr: window.__app.renderer.getPixelRatio(),
    gtao: window.__app.gtao.enabled,
    glitchInComposer: window.__app.composer.passes.some((p) => p === window.__app.glitchPass),
    shadow: window.__app.key.shadow.mapSize.x,
    triangles: window.__app.renderer.info.render.triangles,
  }));
  expect(r.dpr).toBeGreaterThanOrEqual(1);
  expect(r.dpr).toBeLessThanOrEqual(1.5);
  expect(r.gtao).toBe(false);
  expect(r.glitchInComposer).toBe(false);
  expect(r.shadow).toBe(128);
  expect(r.triangles).toBeLessThan(220_000);

  // переход всё ещё доходит до белой сцены и не проседает по кадрам
  await goToWhiteScene(page, 'mobile');
  await expect(page.locator('body')).toHaveClass(/is-light/);
});
