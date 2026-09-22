import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, openMenu, expectMenuClosed, isInViewport, rectOf } from './helpers.js';

test('desktop: меню ведёт к секциям, закрывается крестиком, кликом вне и Escape', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectMenuClosed(page);

  // меню открывается прямо со сцены; якоря и ресурсы — из контента
  await openMenu(page);
  const anchors = page.locator('#menu .menu__anchor');
  await expect(anchors).toHaveText(content.menu.anchors.map((a) => a.label));
  const resources = page.locator('#menu .menu__resource');
  await expect(resources).toHaveCount(content.resources.length);
  for (const [i, r] of content.resources.entries()) {
    await expect(resources.nth(i)).toHaveAttribute('href', r.href);
    await expect(resources.nth(i)).toContainText(r.label);
  }

  // Escape закрывает
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);

  // клик вне панели закрывает
  await openMenu(page);
  await page.mouse.click(40, 500);
  await expectMenuClosed(page);

  // крестик закрывает
  await openMenu(page);
  await page.locator('#menu-close').click();
  await expectMenuClosed(page);

  // клавиатура: открытие с Enter, фокус на крестике, Escape возвращает фокус на кнопку меню
  await page.locator('#menu-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#menu')).toHaveClass(/menu--open/);
  await expect(page.locator('#menu-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);
  await expect(page.locator('#menu-toggle')).toBeFocused();

  // клик по «Проекты» со сцены: сцена отпускается, страница скроллит к секции, меню закрыто
  await openMenu(page);
  await page.locator('#menu .menu__anchor', { hasText: 'Проекты' }).click();
  await expectMenuClosed(page);
  await page.waitForFunction(() => window.__sticky.state.released === true, null, { timeout: 10_000 });
  await page.waitForTimeout(1200); // плавный скролл
  expect(await isInViewport(page, '#projects')).toBe(true);
  expect((await rectOf(page, '#projects')).top).toBeLessThan(200);
});

test('desktop: шапка тёмная на белой сцене и светлая на тёмной', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  const navColor = () => page.evaluate(() => getComputedStyle(document.getElementById('nav')).color);
  expect(await navColor()).toBe('rgb(255, 255, 255)');

  await goToWhiteScene(page, 'desktop');
  expect(await navColor()).toBe('rgb(17, 17, 17)');
});
