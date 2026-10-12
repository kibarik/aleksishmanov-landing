import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, openMenu, expectMenuClosed, isInViewport } from './helpers.js';

test('mobile: нижний док открывает меню-карточку и ведёт к секции «Направления»', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectMenuClosed(page);

  await openMenu(page);
  await expect(page.locator('#menu .menu__anchor')).toHaveText([...content.menu.anchors, ...content.menu.pages].map((a) => a.label));

  await page.locator('#menu .menu__anchor', { hasText: 'Направления' }).click();
  await expectMenuClosed(page);
  await page.waitForFunction(() => window.__sticky.state.released === true, null, { timeout: 10_000 });
  await page.waitForTimeout(1200);
  expect(await isInViewport(page, '#projects')).toBe(true);
});
