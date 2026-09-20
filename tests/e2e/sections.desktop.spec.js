import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, isInViewport, expectSectionsMatchContent } from './helpers.js';

test('desktop: после ухода сцены секции в потоке и совпадают с контентом', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');

  // ещё жест вниз — уход сцены, страница отдаёт нативный скролл
  await leaveScene(page, 'desktop');
  expect(await isInViewport(page, '#about')).toBe(true);

  await expectSectionsMatchContent(page, content);
});
