import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene } from './helpers.js';

test('mobile: курсора нет, сцена не реагирует на указатель', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expect(page.locator('.cursor')).toHaveCount(0);

  await goToWhiteScene(page, 'mobile');
  const camX = () => page.evaluate(() => window.__app.camera.position.x);
  const before = await camX();
  await page.mouse.move(360, 780, { steps: 8 });
  await page.waitForTimeout(700);
  expect(Math.abs((await camX()) - before)).toBeLessThan(0.01);
});
