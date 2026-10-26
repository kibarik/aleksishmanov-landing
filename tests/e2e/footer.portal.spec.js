// Общий подвал: на главной и на страницах портала — один и тот же тёмный статичный блок.
import { test, expect } from '@playwright/test';

const footerHtml = async (request, url) => {
  const html = await (await request.get(url)).text();
  const m = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
  expect(m, `на ${url} нет подвала`).not.toBeNull();
  return m[0];
};

test('подвал главной и страниц портала — одна и та же разметка из одних данных', async ({ request }) => {
  const home = await footerHtml(request, '/');
  for (const url of ['/blog/', '/cases/', '/startups/', '/about/']) expect(await footerHtml(request, url), url).toBe(home);
});

test('портал: подвал тёмный, статичный, с тремя колонками', async ({ page }) => {
  await page.goto('/blog/');
  const footer = page.locator('footer.site-footer');
  await expect(footer.locator('canvas')).toHaveCount(0);
  expect(await footer.evaluate((el) => el.querySelectorAll('*').length && [...el.querySelectorAll('*')].every((n) => getComputedStyle(n).animationName === 'none' && parseFloat(getComputedStyle(n).transitionDuration) === 0))).toBe(true);
  const panel = footer.locator('.site-footer__panel');
  expect(await panel.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(11, 11, 11)');
  expect(await panel.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).not.toBe('0px');
  const boxes = await Promise.all(['.site-footer__links', '.site-footer__emblem', '.site-footer__side'].map((s) => footer.locator(s).boundingBox()));
  expect(boxes[0].x).toBeLessThan(boxes[1].x);
  expect(boxes[1].x).toBeLessThan(boxes[2].x);
  await expect(footer.locator('.site-footer__emblem svg')).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Написать' })).toHaveAttribute('href', 'https://t.me/kibarik');
});

test('портал на телефоне: колонки подвала идут столбиком', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog/');
  const footer = page.locator('footer.site-footer');
  const boxes = await Promise.all(['.site-footer__links', '.site-footer__emblem', '.site-footer__side'].map((s) => footer.locator(s).boundingBox()));
  expect(boxes[0].y + boxes[0].height).toBeLessThanOrEqual(boxes[1].y + 1);
  expect(boxes[1].y + boxes[1].height).toBeLessThanOrEqual(boxes[2].y + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
