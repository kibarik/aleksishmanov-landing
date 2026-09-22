import { test, expect } from '@playwright/test';
import { STEPS, waitForPrelude, readProgress, waitForProgress, swipeUp, expectGolden } from './helpers.js';

const S = STEPS.mobile;

test('mobile: тёмная сцена → белая сцена свайпами', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  expect(await readProgress(page)).toBe(S.darkScene);
  expect(await page.evaluate(() => document.body.dataset.preset)).toBe('mobile');

  await swipeUp(page);
  await swipeUp(page);
  await waitForProgress(page, S.whiteScene);
  await expect(page.locator('body')).toHaveClass(/is-light/);
  await expect(page.locator('#tagline')).toHaveClass(/tagline--visible/);

  await page.waitForTimeout(600);
  await expectGolden(page, 'white-mobile');
});
