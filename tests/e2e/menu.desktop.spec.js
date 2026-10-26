import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, openMenu, expectMenuClosed, isInViewport, rectOf } from './helpers.js';

const { directions, pages } = content.menu;

test('desktop: меню открывается только кликом — наведение на угол его не открывает', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.mouse.move(700, 300);
  await page.mouse.move(1405, 30, { steps: 6 });
  await page.waitForTimeout(900);
  await expectMenuClosed(page);
  await expect(page.locator('.menu-zone')).toHaveCount(0);
});

test('desktop: структура — два направления с подписями, затем разделы, затем «Написать» и Telegram', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await openMenu(page);
  const box = await page.locator('#menu .menu__panel').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(1430);
  expect(box.height).toBeGreaterThanOrEqual(890);

  await expect(page.locator('#menu .menu__direction')).toHaveText(directions.map((d) => d.label + d.note));
  await expect(page.locator('#menu .menu__direction')).toHaveCount(2);
  for (const [i, d] of directions.entries()) await expect(page.locator('#menu .menu__direction').nth(i)).toHaveAttribute('href', d.href);
  await expect(page.locator('#menu .menu__page')).toHaveText(pages.map((a) => a.label));
  await expect(page.locator('#menu .menu__anchor', { hasText: 'Чем полезен' })).toHaveCount(0);
  await expect(page.locator('#menu .menu__cta')).toHaveAttribute('href', content.contact.href);
  await expect(page.locator('#menu .menu__social a')).toHaveAttribute('href', content.menu.social.href);

  // порядок на экране: направления выше разделов, «Написать» сбоку (правее разделов)
  const dirBottom = (await rectOf(page, '#menu .menu__directions li:last-child .menu__direction')).bottom;
  const firstPageTop = (await rectOf(page, '#menu .menu__page')).top;
  const ctaLeft = (await rectOf(page, '#menu .menu__cta')).left;
  const pagesRight = await page.locator('#menu .menu__page').evaluateAll((els) => Math.max(...els.map((el) => el.getBoundingClientRect().right)));
  expect(dirBottom).toBeLessThanOrEqual(firstPageTop);
  expect(ctaLeft).toBeGreaterThanOrEqual(pagesRight);

  // направления крупнее разделов
  const size = (sel) => page.locator(sel).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await size('#menu .menu__direction .menu__anchor')).toBeGreaterThan(await size('#menu .menu__page'));
});

test('desktop: эмблема стоит в своей колонке и не пересекается с текстом меню', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await openMenu(page);
  const art = await rectOf(page, '#menu .menu__art img');
  expect(art.right - art.left).toBeGreaterThan(200);
  const texts = await page.locator('#menu .menu__direction, #menu .menu__page, #menu .menu__cta, #menu .menu__social').evaluateAll(
    (els) => els.map((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }),
  );
  expect(texts.length).toBeGreaterThanOrEqual(2 + pages.length + 2);
  for (const t of texts) {
    const overlap = art.left < t.right && t.left < art.right && art.top < t.bottom && t.top < art.bottom;
    expect(overlap, `эмблема пересекает пункт ${JSON.stringify(t)}`).toBe(false);
  }
  // шумного WebGL-слоя нет
  await expect(page.locator('#menu canvas')).toHaveCount(0);
});

test('desktop: закрытие крестиком и Escape, фокус уходит в меню и возвращается на кнопку, ссылки закрывают сразу', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expectMenuClosed(page);
  const menu = page.locator('#menu');

  // клавиатура: Enter на кнопке открывает, фокус в меню, Escape возвращает фокус на кнопку
  await page.locator('#menu-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveClass(/menu--open/);
  await expect(page.locator('#menu-close')).toBeFocused();
  await expect(menu).toHaveClass(/menu--ready/, { timeout: 8_000 });
  // клик по пустому месту панели ничего не закрывает
  await page.mouse.click(1100, 700);
  await expect(menu).toHaveClass(/menu--open/);
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);
  await expect(page.locator('#menu-toggle')).toBeFocused();

  // крестик закрывает; мышью открыли — фокус всё равно уходит внутрь меню
  await page.waitForTimeout(1700);
  await openMenu(page);
  await expect(menu.locator(':focus')).toHaveCount(1);
  await page.locator('#menu-close').click();
  await expectMenuClosed(page);

  // якорь «Обо мне» со сцены: меню закрывается сразу, сцена отпускается, страница скроллит к секции
  await page.waitForTimeout(1700);
  await openMenu(page);
  await page.locator('#menu .menu__page', { hasText: 'Обо мне' }).click();
  await expectMenuClosed(page);
  await page.waitForFunction(() => window.__sticky.state.released === true, null, { timeout: 10_000 });
  await page.waitForTimeout(1200); // плавный скролл
  expect(await isInViewport(page, '#about')).toBe(true);
  expect((await rectOf(page, '#about')).top).toBeLessThan(200);
});

test('desktop: из угла кнопки растёт белый круг, затем пункты появляются по буквам, закрытие идёт задом наперёд', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.locator('#menu-toggle').click();
  const firstChar = page.locator('#menu .menu__direction .menu__char').first();
  const cta = page.locator('#menu .menu__cta');
  const circle = page.locator('#menu .menu__circle');
  await expect(page.locator('#menu')).toHaveClass(/menu--open/);
  // круг стартует из центра кнопки в правом верхнем углу, пункты ещё не показаны
  const at = await circle.evaluate((el) => ({ x: parseFloat(el.style.getPropertyValue('--ox')), y: parseFloat(el.style.getPropertyValue('--oy')), r: parseFloat(el.style.getPropertyValue('--r')) }));
  expect(at.x).toBeGreaterThan(1300);
  expect(at.y).toBeLessThan(120);
  expect(at.r).toBeGreaterThanOrEqual(1440);
  expect(Number(await cta.evaluate((el) => getComputedStyle(el).opacity))).toBe(0);
  await expect(page.locator('#menu')).toHaveClass(/menu--ready/, { timeout: 8_000 });
  expect(Number(await cta.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  expect(Number(await firstChar.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
  // круг разросся на весь экран
  expect(await circle.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(/^circle\(\d{4,}/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).not.toHaveClass(/menu--ready/);
  await expect(page.locator('#menu')).not.toHaveClass(/menu--open/, { timeout: 3_000 });
});

test.describe('prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('desktop: меню открывается сразу — без круга и побуквенной анимации', async ({ page }) => {
    await page.goto('/');
    await waitForPrelude(page);
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#menu')).toHaveClass(/menu--open/);
    expect(Number(await page.locator('#menu .menu__cta').evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
    expect(Number(await page.locator('#menu .menu__direction .menu__char').first().evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
    expect(await page.locator('#menu .menu__circle').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  });
});

test('desktop: шапка светлая на обеих сценах и тёмная над светлым контентом', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  const navColor = () => page.evaluate(() => getComputedStyle(document.getElementById('nav')).color);
  expect(await navColor()).toBe('rgb(255, 255, 255)');

  await goToWhiteScene(page, 'desktop');
  expect(await navColor(), 'на неоновой сцене').toBe('rgb(255, 255, 255)');

  await leaveScene(page, 'desktop');
  await page.evaluate(() => document.getElementById('projects').scrollIntoView());
  await page.waitForTimeout(600);
  expect(await navColor(), 'над светлым контентом').toBe('rgb(17, 17, 17)');
});
