import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { goToWhiteScene, expectFirstScreenTexts } from './helpers.js';

test('mobile: лоадер показывает оффер, теглайн из контента появляется на белой сцене', async ({ page }) => {
  await page.goto('/');
  await expectFirstScreenTexts(page, content);

  await goToWhiteScene(page, 'mobile');
  await expect(page.locator('#tagline')).toHaveClass(/tagline--visible/);
  await expect(page.locator('#tagline')).toBeVisible();
  await expect(page.locator('#tagline')).toHaveText(content.tagline);
});
