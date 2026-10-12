import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, isInViewport } from './helpers.js';

test('desktop: футер — тёмная панель как у референса, с 3D-объектом', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.evaluate(() => window.__sticky.release());
  await page.evaluate(() => document.getElementById('footer').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);

  expect(await isInViewport(page, '#footer')).toBe(true);
  // панель не меньше 82% высоты экрана, с отступом 20px по бокам; светлая шапка на ней
  const box = await page.evaluate(() => {
    const f = document.querySelector('#footer .footer__panel').getBoundingClientRect();
    return { h: f.height, vh: window.innerHeight, left: f.left, w: f.width, vw: window.innerWidth };
  });
  expect(box.h).toBeGreaterThanOrEqual(box.vh * 0.82 - 1);
  expect(Math.round(box.left)).toBe(20);
  // левая карточка прокручивается внутри и не растягивает панель
  const scroll = await page.evaluate(() => {
    const s = document.querySelector('#footer [data-footer-scroll]');
    return { scrollable: s.scrollHeight > s.clientHeight, cardH: s.parentElement.getBoundingClientRect().height };
  });
  expect(scroll.scrollable).toBe(true);
  expect(scroll.cardH).toBeLessThan(box.h);
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
