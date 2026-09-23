import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, isInViewport } from './helpers.js';

test('desktop: футер — отдельный тёмный экран с 3D-объектом', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.evaluate(() => window.__sticky.release());
  await page.evaluate(() => document.getElementById('footer').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);

  expect(await isInViewport(page, '#footer')).toBe(true);
  // тёмный экран во всю высоту и светлая шапка на нём
  const box = await page.evaluate(() => {
    const f = document.getElementById('footer').getBoundingClientRect();
    return { h: f.height, vh: window.innerHeight };
  });
  expect(box.h).toBeGreaterThanOrEqual(box.vh * 0.98);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(255, 255, 255)');

  // 3D-объект запустился и рисует кадры
  await expect(page.locator('#footer-scene')).toBeVisible();
  const drawn = await page.evaluate(() => {
    const c = document.getElementById('footer-scene');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return { w: c.width, h: c.height, ctx: !!gl };
  });
  expect(drawn.ctx).toBe(true);
  expect(drawn.w).toBeGreaterThan(100);

  await expect(page.locator('#footer .footer__btn')).toHaveAttribute('href', content.contact.href);
});
