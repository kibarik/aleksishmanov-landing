import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, expectAskOnDarkScene, expectAskButtons, rectOf } from './helpers.js';

test('mobile: Ask Ishmanov AI между пьедесталом и доком, уезжает со сценой', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectAskOnDarkScene(page, content);

  await goToWhiteScene(page, 'mobile');
  await expectAskButtons(page, content);

  // как у референса: пилюля над доком; низ пьедестала на 390×844 — ~78% высоты кадра (tests/e2e/golden/white-mobile.png)
  const r = await rectOf(page, '#ask-scene');
  const dock = await rectOf(page, '.dock__bar');
  expect(r.top, `ask: ${JSON.stringify(r)}`).toBeGreaterThanOrEqual(r.heroH * 0.78);
  expect(r.bottom, `ask наезжает на док: ${JSON.stringify({ r, dock })}`).toBeLessThanOrEqual(dock.top - 8);

  await leaveScene(page, 'mobile', { screens: 1.5 });
  expect((await rectOf(page, '#ask-scene')).bottom).toBeLessThanOrEqual(0);
});
