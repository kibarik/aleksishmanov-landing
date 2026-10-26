import { test, expect } from '@playwright/test';

test('без WebGL: подвал выглядит так же — тёмный, статичный, с эмблемой', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.getElementById('footer').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);

  await expect(page.locator('#footer .site-footer__emblem svg')).toBeVisible();
  await expect(page.locator('#footer canvas')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#footer .site-footer__panel')).backgroundColor)).toBe('rgb(11, 11, 11)');
});
