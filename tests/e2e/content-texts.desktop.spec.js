import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { STEPS, waitForProgress, wheelBurst, expectFirstScreenTexts } from './helpers.js';

const S = STEPS.desktop;

test('desktop: лоадер показывает оффер, теглайн из контента появляется на белой сцене', async ({ page }) => {
  await page.goto('/');
  await expectFirstScreenTexts(page, content);

  // в конце перехода (into-white) теглайна ещё нет: он появляется на 75% последнего сегмента
  await wheelBurst(page);
  await waitForProgress(page, S.transition);
  await expect(page.locator('#tagline')).not.toHaveClass(/tagline--visible/);

  await page.waitForTimeout(700);
  await wheelBurst(page);
  await waitForProgress(page, S.whiteScene);
  await expect(page.locator('#tagline')).toHaveClass(/tagline--visible/);
  await expect(page.locator('#tagline')).toBeVisible();
  await expect(page.locator('#tagline')).toHaveText(content.tagline);
});
