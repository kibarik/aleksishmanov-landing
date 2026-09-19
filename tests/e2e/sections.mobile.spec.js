import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, swipeUp, goToWhiteScene, expectSceneLeft, isInViewport, expectSectionsMatchContent } from './helpers.js';

test('mobile: после ухода сцены секции в потоке и совпадают с контентом', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'mobile');

  await swipeUp(page);
  await expectSceneLeft(page);
  await swipeUp(page, { distance: 600 });
  await swipeUp(page, { distance: 600 });
  await page.waitForTimeout(500);
  expect(await isInViewport(page, '#about')).toBe(true);

  await expectSectionsMatchContent(page, content);
});
