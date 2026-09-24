import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';

test('desktop: лоадер считает с первой секунды, не застревает на 100% и наклоняет иконку', async ({ page }) => {
  const modelRequests = [];
  page.on('request', (r) => { if (/character.*\.glb/.test(r.url())) modelRequests.push(r.url()); });
  await page.goto('/', { waitUntil: 'commit' });

  // полоса живёт до того, как загрузился чанк сцены
  await page.waitForFunction(() => {
    const t = document.getElementById('loader-pct')?.textContent;
    return t && parseInt(t, 10) > 0;
  }, null, { timeout: 15_000 });
  expect(await page.evaluate(() => !!window.__app), 'проценты идут ещё до готовности сцены').toBe(false);
  await expect(page.locator('#loader-offer')).toHaveText(content.offer);

  // 100% только когда сцена готова
  await page.waitForFunction(() => document.getElementById('loader-pct').textContent === '100%', null, { timeout: 60_000 });
  expect(await page.evaluate(() => window.__sceneReady === true)).toBe(true);

  // финальный наклон иконки, затем лоадер уходит
  await expect(page.locator('#loader')).toHaveClass(/loader--out/);
  await page.waitForTimeout(220); // переход наклона уже идёт, но ещё не закончился
  const tilt = await page.evaluate(() => getComputedStyle(document.querySelector('.loader__art')).transform);
  expect(tilt.startsWith('matrix3d'), `иконка должна наклоняться, получено: ${tilt}`).toBe(true);
  await expect(page.locator('#loader')).toHaveClass(/loader--done/, { timeout: 5000 });

  // модель скачивается один раз
  expect(modelRequests.length, `запросов модели: ${modelRequests.length}`).toBe(1);
});
