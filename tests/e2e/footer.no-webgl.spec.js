import { test, expect } from '@playwright/test';

test('без WebGL: в футере статичный кадр вместо 3D-объекта', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.getElementById('footer').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);

  await expect(page.locator('#footer-fallback')).toBeVisible();
  await expect(page.locator('#footer-scene')).toBeHidden();
});
