// Страница материала (.scratch/redesign/issues/06): оглавление слева, колонка 680px, лид и выносные цитаты.
// npm run test:portal
import { test, expect } from '@playwright/test';

const LONG = '/blog/assumption-mapping-karta-dopushcheniy/'; // 14 подзаголовков H2
const SHORT = '/blog/19-distribution-channels/'; // без подзаголовков H2
const QUOTE = '/blog/ach-analiz-konkuriruyushchih-gipotez/'; // есть цитата Markdown

test('1. оглавление: у материала с ≥ 3 H2 есть, пункты ведут на подзаголовки; у короткого нет', async ({ page }) => {
  await page.goto(LONG);
  const toc = page.locator('[data-toc]');
  await expect(toc).toBeVisible();
  const links = toc.locator('a');
  const n = await page.locator('.prose h2').count();
  expect(n).toBeGreaterThanOrEqual(3);
  expect(await links.count()).toBe(n);
  const href = await links.nth(1).getAttribute('href');
  expect(await page.locator(`.prose h2[id="${decodeURIComponent(href.slice(1))}"]`).count()).toBe(1);

  await page.goto(SHORT);
  await expect(page.locator('[data-toc]')).toHaveCount(0);
});

test('2. оглавление липкое слева от текста, активный пункт меняется при прокрутке', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(LONG);
  const toc = page.locator('[data-toc]');
  const tocBox = await toc.boundingBox();
  const textBox = await page.locator('.prose').boundingBox();
  expect(tocBox.x + tocBox.width).toBeLessThanOrEqual(textBox.x);
  const links = toc.locator('a');
  const ids = async () => page.locator('[data-toc] a[aria-current="true"]').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  const target = page.locator('.prose h2').nth(5);
  await target.scrollIntoViewIfNeeded();
  await target.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  const id = await target.getAttribute('id');
  await expect.poll(ids).toEqual([`#${id}`]);
  const first = page.locator('.prose h2').first();
  await first.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await expect.poll(ids).toEqual([`#${await first.getAttribute('id')}`]);
  // липкость: после прокрутки оглавление остаётся в окне
  const after = await toc.boundingBox();
  expect(after.y).toBeGreaterThanOrEqual(0);
  expect(after.y).toBeLessThan(300);
  expect(await links.count()).toBeGreaterThan(5);
});

test('3. узкий экран: оглавление — горизонтальная строка над текстом, без горизонтальной прокрутки страницы', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(LONG);
  const toc = page.locator('[data-toc]');
  await expect(toc).toBeVisible();
  const boxes = await toc.locator('a').evaluateAll((as) => as.slice(0, 3).map((a) => { const r = a.getBoundingClientRect(); return { x: r.x, y: r.y }; }));
  expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(4);
  expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
  const tocBox = await toc.boundingBox();
  const textBox = await page.locator('.prose').boundingBox();
  expect(tocBox.y + tocBox.height).toBeLessThanOrEqual(textBox.y + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('4. колонка текста ≈ 680px, кегль 18, межстрочный 1.6; фон белый', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(LONG);
  const box = await page.locator('.prose').boundingBox();
  expect(box.width).toBeGreaterThan(670);
  expect(box.width).toBeLessThanOrEqual(682);
  const p = await page.locator('.prose p').nth(1).evaluate((el) => { const s = getComputedStyle(el); return { fs: s.fontSize, lh: s.lineHeight }; });
  expect(p.fs).toBe('18px');
  expect(p.lh).toBe('28.8px');
  const bg = await page.locator('[data-material]').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(255, 255, 255)');
});

test('5. лид и выносная цитата отличаются от обычного текста', async ({ page }) => {
  await page.goto(QUOTE);
  const lead = await page.locator('.prose > p').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const body = await page.locator('.prose > p').nth(2).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(lead).toBeGreaterThan(body);
  const q = await page.locator('.prose blockquote').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(q).toBeGreaterThanOrEqual(body * 1.3);
});

test('6. Markdown-копия, JSON-LD Article, хлебные крошки на месте; место под ряд после материала', async ({ page, request }) => {
  await page.goto(LONG);
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const all = ld.join('');
  expect(all).toContain('"Article"');
  expect(all).toContain('BreadcrumbList');
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveCount(1);
  await expect(page.locator('.crumbs')).toBeVisible();
  const md = await request.get(`${LONG.slice(0, -1)}.md`);
  expect(md.status()).toBe(200);
  await expect(page.locator('[data-after-material]')).toHaveCount(1);
});
