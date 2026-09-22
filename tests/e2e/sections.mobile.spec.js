import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, isInViewport, expectSectionsMatchContent } from './helpers.js';

test('mobile: после ухода сцены секции в потоке и совпадают с контентом', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'mobile');

  await leaveScene(page, 'mobile');
  expect(await isInViewport(page, '#about')).toBe(true);

  await expectSectionsMatchContent(page, content);
});
