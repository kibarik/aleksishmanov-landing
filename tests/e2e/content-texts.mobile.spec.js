import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { STEPS, waitForProgress, swipeUp, expectFirstScreenTexts } from './helpers.js';

const S = STEPS.mobile;

test('mobile: лоадер показывает оффер, теглайн из контента появляется на белой сцене', async ({ page }) => {
  await page.goto('/');
  await expectFirstScreenTexts(page, content);

  await swipeUp(page);
  await swipeUp(page);
  await waitForProgress(page, S.whiteScene);
  await expect(page.locator('#tagline')).toHaveClass(/tagline--visible/);
  await expect(page.locator('#tagline')).toBeVisible();
  await expect(page.locator('#tagline')).toHaveText(content.tagline);
});
