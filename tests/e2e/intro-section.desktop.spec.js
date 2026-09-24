import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, isInViewport } from './helpers.js';

test('desktop: тёмная секция открывается после сцены и перекрашивает шапку', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');
  await leaveScene(page, 'desktop');

  expect(await isInViewport(page, '#intro')).toBe(true);
  const intro = page.locator('#intro');
  await expect(intro.locator('.intro__title')).toHaveText(content.offer);
  await expect(intro.locator('.intro__lead')).toHaveText(content.intro.lead);
  await expect(intro.locator('.intro__name')).toHaveText(content.intro.name);
  await expect(intro.locator('.intro__role')).toHaveText(content.intro.role);

  // текст приехал, фон тёмный, шапка светлая
  await expect(intro).toHaveClass(/intro--in/);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.intro')).backgroundColor)).toBe('rgb(10, 10, 10)');
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(255, 255, 255)');

  // ниже по странице секции снова светлые и шапка тёмная
  await page.evaluate(() => document.getElementById('about').scrollIntoView());
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(17, 17, 17)');
});
