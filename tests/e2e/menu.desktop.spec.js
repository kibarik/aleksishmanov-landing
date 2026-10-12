import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, openMenu, expectMenuClosed, isInViewport, rectOf } from './helpers.js';

test('desktop: меню открывается наведением, закрывается Escape и кликом по зоне, ссылки закрывают сразу', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectMenuClosed(page);
  const menu = page.locator('#menu');
  const items = [...content.menu.anchors, ...content.menu.pages];

  // наведение без клика открывает меню на всю страницу; пункты и кнопка — из контента
  await openMenu(page);
  const box = await page.locator('#menu .menu__panel').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(1430);
  expect(box.height).toBeGreaterThanOrEqual(890);
  await expect(page.locator('#menu .menu__anchor')).toHaveText(items.map((a) => a.label));
  await expect(page.locator('#menu .menu__cta')).toHaveAttribute('href', content.contact.href);
  await expect(page.locator('#menu .menu__social a')).toHaveAttribute('href', content.menu.social.href);

  // клик по пустому месту панели ничего не закрывает (как у эталона)
  await page.mouse.click(300, 450);
  await expect(menu).toHaveClass(/menu--open/);

  // Escape закрывает; сразу после закрытия повторно открыть нельзя (1,5 с), потом можно
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);
  await openMenu(page);

  // клик по зоне в углу закрывает
  await page.mouse.click(1405, 30);
  await expectMenuClosed(page);

  // клавиатура: Enter на кнопке открывает, фокус на крестике, Escape возвращает фокус на кнопку
  await page.mouse.move(300, 450);
  await page.waitForTimeout(1700);
  await page.locator('#menu-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveClass(/menu--open/);
  await expect(page.locator('#menu-close')).toBeFocused();
  await expect(menu).toHaveClass(/menu--ready/, { timeout: 8_000 });
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);
  await expect(page.locator('#menu-toggle')).toBeFocused();

  // клик по «Направления» со сцены: меню закрывается сразу, сцена отпускается, страница скроллит к секции
  await page.mouse.move(300, 450);
  await openMenu(page);
  await page.locator('#menu .menu__anchor', { hasText: content.menu.anchors.find((a) => a.href === '#projects').label }).click();
  await expectMenuClosed(page);
  await page.waitForFunction(() => window.__sticky.state.released === true, null, { timeout: 10_000 });
  await page.waitForTimeout(1200); // плавный скролл
  expect(await isInViewport(page, '#projects')).toBe(true);
  expect((await rectOf(page, '#projects')).top).toBeLessThan(200);
});

test('desktop: пункты выезжают по буквам, закрытие идёт задом наперёд', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.mouse.move(700, 300);
  await page.mouse.move(1405, 30, { steps: 4 });
  const firstChar = page.locator('#menu .menu__anchor').first().locator('.menu__char').first();
  const lastCta = page.locator('#menu .menu__cta');
  // сначала панель белая и пустая: таймлайн стартует через 0,3 с
  await expect(page.locator('#menu')).toHaveClass(/menu--open/);
  expect(Number(await lastCta.evaluate((el) => getComputedStyle(el).opacity))).toBe(0);
  await expect(page.locator('#menu')).toHaveClass(/menu--ready/, { timeout: 8_000 });
  expect(Number(await lastCta.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  expect(Number(await firstChar.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  // закрытие: сначала уходят пункты, панель остаётся, потом гаснет
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).not.toHaveClass(/menu--ready/);
  await expect(page.locator('#menu')).not.toHaveClass(/menu--open/, { timeout: 3_000 });
});

test('desktop: шапка тёмная на белой сцене и светлая на тёмной', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  const navColor = () => page.evaluate(() => getComputedStyle(document.getElementById('nav')).color);
  expect(await navColor()).toBe('rgb(255, 255, 255)');

  await goToWhiteScene(page, 'desktop');
  expect(await navColor()).toBe('rgb(17, 17, 17)');
});
