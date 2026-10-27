// Список кейсов на /cases/ и страница кейса (.scratch/redesign, тикет 08): npm run test:portal.
// Сборка для тестов идёт с PORTAL_DRAFTS=1 — каркасы кейсов (draft: true) видны только в ней, в прод не попадают.
// Пустое состояние (без черновиков) в этой сборке не проверить — его смотрят сборкой без PORTAL_DRAFTS (см. тикет).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const DIR = path.join(ROOT, 'portal', 'src', 'content', 'cases');
/** Кейсы в порядке списка (поле order). */
const CASES = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))
  .map((f) => {
    const fm = fs.readFileSync(path.join(DIR, f), 'utf8').split(/^---$/m)[1];
    return { slug: f.slice(0, -3), title: JSON.parse(fm.match(/^title:\s*(.*)$/m)[1]), order: Number(fm.match(/^order:\s*(\d+)/m)[1]) };
  })
  .sort((a, b) => a.order - b.order);

const rows = (page) => page.locator('.case-row');

test.beforeEach(() => expect(CASES.length, 'в тестовой сборке нужны кейсы').toBeGreaterThanOrEqual(3));

test('1. список: крупный заголовок, вступление, кейсы строками по порядку — без JS, картинок и листания', async ({ request, page }) => {
  const html = await (await request.get('/cases/')).text();
  for (const c of CASES) {
    expect(html).toContain(c.title.replace(/"/g, '&quot;'));
    expect(html).toContain(`href="/cases/${c.slug}/"`);
  }
  await page.goto('/cases/');
  await expect(page.locator('h1')).toHaveText('Кейсы');
  await expect(page.locator('.case-intro')).not.toBeEmpty();
  await expect(rows(page)).toHaveCount(CASES.length);
  for (const [i, c] of CASES.entries()) await expect(rows(page).nth(i).locator('.case-row__title')).toHaveText(c.title);
  // никаких каруселей, кнопок листания и картинок в строках
  await expect(page.locator('[aria-roledescription="карусель"], [data-stack], button[aria-label*="кейс"]')).toHaveCount(0);
  await expect(rows(page).locator('img')).toHaveCount(0);
});

test('2. строка кейса: заголовок-результат ссылкой, направление, годы, ровно две цифры', async ({ page }) => {
  await page.goto('/cases/');
  const row = rows(page).first();
  await expect(row.locator('a.case-row__title')).toHaveAttribute('href', `/cases/${CASES[0].slug}/`);
  await expect(row.locator('.case-row__dir')).toHaveText('Запуск продуктов');
  await expect(row.locator('.case-row__years')).toHaveText(/^\d{4}( — (\d{4}|сейчас))?$/);
  await expect(row.locator('.case-row__metrics dt')).toHaveCount(2);
  await expect(row.locator('.case-row__metrics dd')).toHaveCount(2);
});

test('2б. у кейса с несколькими направлениями в строке видны все', async ({ page }) => {
  await page.goto('/cases/');
  await expect(rows(page).nth(1).locator('.case-row__dir')).toHaveText(['Запуск продуктов', 'ИИ в корпорациях']);
});

test('3. клик по заголовку открывает страницу кейса', async ({ page }) => {
  await page.goto('/cases/');
  await rows(page).first().locator('a.case-row__title').click();
  await expect(page).toHaveURL(new RegExp(`/cases/${CASES[0].slug}/$`));
});

test('4. страница кейса: белый фон, колонка 680px, поля в порядке результат → цифры → контекст → роль → шаги → стек', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/cases/${CASES[0].slug}/`);
  await expect(page.locator('h1')).toHaveText(CASES[0].title);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(255, 255, 255)');
  const col = await page.locator('.case-page').boundingBox();
  expect(Math.round(col.width)).toBe(680);

  // цифры крупными блоками: не меньше двух, значение крупнее обычного текста
  const values = page.locator('.case-results__value');
  expect(await values.count()).toBeGreaterThanOrEqual(2);
  expect(await values.first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(40);
  await expect(page.locator('.case-results__label').first()).not.toBeEmpty();
  await expect(page.locator('.case-meta')).toContainText(/\d{4}/);
  expect(await page.locator('.case-steps li').count()).toBeGreaterThanOrEqual(3);

  const order = ['h1', '.case-results', '.case-context', '.case-role', '.case-steps', '.case-tech'];
  const tops = await Promise.all(order.map((s) => page.locator(s).first().evaluate((el) => el.getBoundingClientRect().top + scrollY)));
  expect(tops, 'порядок блоков').toEqual([...tops].sort((a, b) => a - b));
});

test('5. телефон 390 px: без горизонтальной прокрутки на списке и странице кейса', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of ['/cases/', `/cases/${CASES[0].slug}/`]) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(1);
  }
});

test('6. Markdown-копия кейса сохраняет цифры и шаги', async ({ request }) => {
  const md = await (await request.get(`/cases/${CASES[0].slug}.md`)).text();
  expect(md).toMatch(/- Роль:/);
  expect(md).toMatch(/- Шаги:/);
});
