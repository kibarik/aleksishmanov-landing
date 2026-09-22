import { test, expect } from '@playwright/test';
import { STEPS, waitForPrelude, readProgress, isSceneLeft, waitForProgress, wheelBurst, expectGolden } from './helpers.js';

const S = STEPS.desktop;

test('desktop: тёмная сцена → переход → белая сцена', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  expect(await readProgress(page)).toBe(S.darkScene);
  await expect(page.locator('body')).not.toHaveClass(/is-light/);

  // один тик не коммитит переход: откат к тёмной сцене
  await wheelBurst(page, { ticks: 1 });
  await page.waitForTimeout(800);
  expect(await readProgress(page)).toBeGreaterThan(S.darkScene);
  await waitForProgress(page, S.darkScene);
  await expect(page.locator('body')).not.toHaveClass(/is-light/);

  await wheelBurst(page);
  await waitForProgress(page, S.transition);
  await expect(page.locator('body')).toHaveClass(/is-light/);

  await page.waitForTimeout(700); // пауза 500 мс в конце перехода
  await wheelBurst(page);
  await waitForProgress(page, S.whiteScene);
  await expect(page.locator('#tagline')).toHaveClass(/tagline--visible/);
  expect(await isSceneLeft(page)).toBe(false);

  await page.waitForTimeout(600);
  await expectGolden(page, 'white-desktop');
});
