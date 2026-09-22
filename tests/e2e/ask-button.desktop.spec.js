import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, expectAskOnDarkScene, expectAskButtons, rectOf } from './helpers.js';

test('desktop: Ask Ishmanov AI в шапке с тёмной сцены, под пьедесталом — с теглайном, уезжает со сценой', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectAskOnDarkScene(page, content);

  await goToWhiteScene(page, 'desktop');
  await expectAskButtons(page, content);

  // уход сцены: кнопка уезжает вместе со сценой (#hero), не висит над контентом
  await leaveScene(page, 'desktop', { screens: 1.5 });
  expect((await rectOf(page, '#ask-scene')).bottom).toBeLessThanOrEqual(0);
});
