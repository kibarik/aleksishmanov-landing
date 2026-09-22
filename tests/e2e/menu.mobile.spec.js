import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, openMenu, expectMenuClosed, isInViewport } from './helpers.js';

test('mobile: меню открывается тапом и ведёт к секции «Написать»', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectMenuClosed(page);

  await openMenu(page);
  await expect(page.locator('#menu .menu__anchor')).toHaveText(content.menu.anchors.map((a) => a.label));

  await page.locator('#menu .menu__anchor', { hasText: 'Написать' }).click();
  await expectMenuClosed(page);
  await page.waitForFunction(() => window.__sticky.state.released === true, null, { timeout: 10_000 });
  await page.waitForTimeout(1200);
  expect(await isInViewport(page, '#contact')).toBe(true);
});
