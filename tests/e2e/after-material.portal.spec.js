// Ряд после материала (.scratch/redesign/issues/07): карточка автора, «Свежие материалы», «Подписаться в Telegram».
// npm run test:portal
import { test, expect } from '@playwright/test';

const ARTICLE = '/blog/assumption-mapping-karta-dopushcheniy/';

test('1. три карточки в ряд; свежие материалы — три ссылки того же раздела без текущего', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(ARTICLE);
  const author = page.locator('[data-author-card]');
  const fresh = page.locator('[data-fresh]');
  const tg = page.locator('[data-telegram-card]');
  await expect(author).toBeVisible();
  await expect(fresh).toBeVisible();
  await expect(tg).toBeVisible();
  const [a, f, t] = await Promise.all([author.boundingBox(), fresh.boundingBox(), tg.boundingBox()]);
  expect(f.x).toBeGreaterThan(a.x + a.width - 1);
  expect(t.x).toBeGreaterThan(f.x + f.width - 1);
  await expect(fresh.getByRole('heading', { name: 'Свежие материалы' })).toBeVisible();
  const links = fresh.locator('a');
  expect(await links.count()).toBe(3);
  const hrefs = await links.evaluateAll((as) => as.map((x) => x.getAttribute('href')));
  for (const h of hrefs) expect(h).toMatch(/^\/blog\/[^/]+\/$/);
  expect(hrefs).not.toContain(ARTICLE);
  // дальше — страница из «Свежих» открывается
  await links.first().click();
  await expect(page).toHaveURL(new RegExp(`${hrefs[0]}$`));
});

test('2. Telegram-карточка ведёт на профиль основного канала', async ({ page }) => {
  await page.goto(ARTICLE);
  await expect(page.locator('[data-telegram-link]')).toHaveAttribute('href', 'https://t.me/corporate_ai');
});

test('3. без фото в карточке автора монограмма «АИ», имя и профили', async ({ page }) => {
  await page.goto(ARTICLE);
  const card = page.locator('[data-author-card]');
  await expect(card.locator('[data-monogram]')).toHaveText('АИ');
  await expect(card.locator('img')).toHaveCount(0);
  await expect(card.getByText('Алексей Ишманов')).toBeVisible();
  expect(await card.locator('.acard__profiles a').count()).toBeGreaterThan(0);
});

test('4. на телефоне карточки друг под другом', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(ARTICLE);
  const [a, f, t] = await Promise.all(['[data-author-card]', '[data-fresh]', '[data-telegram-card]'].map((s) => page.locator(s).boundingBox()));
  expect(f.y).toBeGreaterThanOrEqual(a.y + a.height - 1);
  expect(t.y).toBeGreaterThanOrEqual(f.y + f.height - 1);
  expect(Math.abs(a.x - f.x)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('5. «Читать дальше» и тёмный призыв заменены рядом', async ({ page }) => {
  await page.goto(ARTICLE);
  await expect(page.getByRole('heading', { name: 'Читать дальше' })).toHaveCount(0);
  await expect(page.locator('.cta')).toHaveCount(0);
});
