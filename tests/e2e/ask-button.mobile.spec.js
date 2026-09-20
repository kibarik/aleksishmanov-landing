import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, expectAskOnDarkScene, expectAskButtons, rectOf } from './helpers.js';

test('mobile: Ask Ishmanov AI под пьедесталом не перекрывает его, в шапке видна, уезжает со сценой', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectAskOnDarkScene(page, content);

  await goToWhiteScene(page, 'mobile');
  await expectAskButtons(page, content);

  // низ пьедестала на 390×844 — ~86% высоты кадра (tests/e2e/golden/white-mobile.png)
  const r = await rectOf(page, '#ask-scene');
  expect(r.top).toBeGreaterThanOrEqual(r.viewportH * 0.86);
  expect(r.bottom).toBeLessThanOrEqual(r.viewportH);

  await leaveScene(page, 'mobile', { screens: 1.5 });
  expect((await rectOf(page, '#ask-scene')).bottom).toBeLessThanOrEqual(0);
});
