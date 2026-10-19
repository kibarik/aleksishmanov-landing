import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, isInViewport } from './helpers.js';

test('desktop: тёмная секция открывается после сцены и перекрашивает шапку', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');
  await leaveScene(page, 'desktop');

  expect(await isInViewport(page, '#about')).toBe(true);
  const intro = page.locator('#about');
  await expect(intro.locator('.about__offer')).toHaveText(content.offer);
  await expect(intro.locator('.about__fact')).toHaveCount(content.about.facts.filter((f) => f.value).length);
  // заголовок подтверждается на том же экране: ссылка на кейсы видна без прокрутки
  expect(await isInViewport(page, '.about__proof-link')).toBe(true);
  await expect(intro.locator('.about__proof-link')).toHaveAttribute('href', content.about.cases.href);

  // текст приехал, фон тёмный, шапка светлая
  await expect(intro).toHaveClass(/intro--in/);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.intro')).backgroundColor)).toBe('rgb(10, 10, 10)');
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(255, 255, 255)');

  // карьерный путь наезжает на экран оффера, шапка остаётся светлой; из него — переход в «Кейсы»
  await page.evaluate(() => document.querySelector('.about__cases').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(600);
  expect(await isInViewport(page, '.about__cases')).toBe(true);
  await expect(intro.locator('.path__row')).toHaveCount(content.about.career.items.length + content.about.education.items.length);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(255, 255, 255)');
  await expect(intro.locator('a.about__cases')).toHaveAttribute('href', '/cases/');

  // ниже по странице секции снова светлые и шапка тёмная
  await page.evaluate(() => document.getElementById('projects').scrollIntoView());
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(17, 17, 17)');
});
