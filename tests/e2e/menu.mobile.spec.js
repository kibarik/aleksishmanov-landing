import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, openMenu, expectMenuClosed, isInViewport } from './helpers.js';

test('mobile: нижний док открывает меню-карточку с новой структурой и ведёт к «Обо мне»', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectMenuClosed(page);

  await openMenu(page);
  const { directions, pages } = content.menu;
  await expect(page.locator('#menu .menu__direction')).toHaveText(directions.map((d) => d.label + d.note));
  await expect(page.locator('#menu .menu__page')).toHaveText(pages.map((a) => a.label));
  await expect(page.locator('#menu .menu__anchor', { hasText: 'Чем полезен' })).toHaveCount(0);
  await expect(page.locator('#menu .menu__cta')).toBeVisible();
  await expect(page.locator('#menu .menu__social a')).toBeVisible();
  await expect(page.locator('#menu .menu__circle')).toBeHidden();

  await page.locator('#menu .menu__page', { hasText: 'Обо мне' }).click();
  await expectMenuClosed(page);
  await page.waitForFunction(() => window.__sticky.state.released === true, null, { timeout: 10_000 });
  await page.waitForTimeout(1200);
  expect(await isInViewport(page, '#about')).toBe(true);
});
