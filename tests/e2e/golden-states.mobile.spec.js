import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene, leaveScene, expectGolden } from './helpers.js';

test('mobile: золотые кадры ключевых состояний', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.waitForTimeout(2500);
  await expectGolden(page, 'dark-mobile');

  await goToWhiteScene(page, 'mobile');
  await page.waitForTimeout(900);
  await expectGolden(page, 'white-mobile');

  await leaveScene(page, 'mobile', { screens: 0.5 });
  await page.waitForTimeout(500);
  await expectGolden(page, 'leave-mobile');
});
