import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, isInViewport } from './helpers.js';

test('desktop: подвал главной — тёмный статичный блок, шапка на нём светлая', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.evaluate(() => window.__sticky.release());
  await page.evaluate(() => document.getElementById('footer').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(800);

  expect(await isInViewport(page, '#footer')).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#footer .site-footer__panel')).backgroundColor)).toBe('rgb(11, 11, 11)');
  // шапка на тёмной секции белая
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(255, 255, 255)');
  // ни 3D, ни шума, ни прокручиваемой карточки
  await expect(page.locator('#footer canvas')).toHaveCount(0);
  await expect(page.locator('#footer-scene, #footer-noise, [data-footer-scroll]')).toHaveCount(0);
  // ссылки направлений, разделов и контакт
  for (const href of ['/startups/', '/ai-in-business/', '/blog/', '/cases/', '/about/', '/rss.xml', '/llms.txt']) {
    await expect(page.locator(`#footer a[href="${href}"]`).first()).toBeAttached();
  }
  await expect(page.locator('#footer a[href="' + content.contact.href + '"]').first()).toHaveText('Написать');
});
