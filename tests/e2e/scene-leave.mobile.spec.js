import { test, expect } from '@playwright/test';
import { STEPS, waitForPrelude, goToWhiteScene, leaveScene, readProgress, swipeUp } from './helpers.js';

const S = STEPS.mobile;

test('mobile: персонаж отстаёт при уходе сцены, свайп вверх наверху возвращает липкий режим', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'mobile');
  expect(await readProgress(page)).toBe(S.whiteScene);

  await leaveScene(page, 'mobile', { screens: 0 });
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(400);
  const lag = await page.evaluate(() => {
    const hero = document.getElementById('hero').getBoundingClientRect().top;
    const scene = document.getElementById('scene').getBoundingClientRect().top;
    return scene - hero;
  });
  expect(lag).toBeGreaterThan(40);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await swipeUp(page, { distance: -260 }); // свайп вниз = контент вверх
  await page.waitForFunction(() => window.__sticky.state.released === false, null, { timeout: 10_000 });
  expect(await readProgress(page)).toBe(S.whiteScene);
});
