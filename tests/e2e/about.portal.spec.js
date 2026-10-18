// «Обо мне» на портале (/about/) против собранного dist/: npm run test:portal.
// Страница читает src/content.js → content.about — тот же источник, что секция на главной, поэтому
// ожидания тоже берутся оттуда: впишет владелец факты — тест сверит их без правки.
import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';

const { about } = content;
const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');

test('1. без JS: карьерный путь из content.about — по строке на пункт, с периодом и ролью', async ({ request }) => {
  const html = await (await request.get('/about/')).text();
  expect(html).toMatch(new RegExp(`id="about-career"[^>]*>${about.career.title}<`));
  expect((html.match(/class="path__row/g) || []).length).toBe(about.career.items.length + about.education.items.length);
  for (const { period, role } of about.career.items) {
    expect(html, role).toContain(role);
    expect(html, period).toContain(period);
  }
});

test('2. факты под позиционированием — из content.about', async ({ page }) => {
  await page.goto('/about/');
  const facts = page.locator('.about-facts > div');
  await expect(facts).toHaveCount(about.facts.length);
  for (const [i, { value, label }] of about.facts.entries()) {
    await expect(facts.nth(i).locator('dt')).toHaveText(value);
    await expect(facts.nth(i).locator('dd')).toHaveText(label);
  }
});

test('3. пустые блоки не выводятся, заглушек [в скобках] на странице нет', async ({ request }) => {
  const html = await (await request.get('/about/')).text();
  expect(html.includes('id="about-education"'), 'образование — только с пунктами').toBe(about.education.items.length > 0);
  expect(html.includes('id="about-year"'), 'последний год — только с фразой').toBe(Boolean(about.lastYear.lead));
  expect(text(html)).not.toMatch(/\[[^\]]*\]/);
  expect(html, 'захардкоженного таймлайна больше нет').not.toMatch(/<strong>2016<\/strong> —/);
});

test('4. переход в «Кейсы»: ссылка ведёт на /cases/, страница открывается', async ({ page }) => {
  await page.goto('/about/');
  const link = page.locator('a.about-cases');
  await expect(link).toHaveAttribute('href', about.cases.href);
  await expect(link).toContainText(about.cases.label);
  await link.click();
  await expect(page).toHaveURL(/\/cases\/$/);
  await expect(page.locator('h1')).toBeVisible();
});

test('5. телефон 390 px: без горизонтальной прокрутки, строки пути в ширину экрана', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/about/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  for (const box of await page.locator('.path__row, .about-cases').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))) {
    expect(box.x).toBeGreaterThanOrEqual(16);
    expect(box.right).toBeLessThanOrEqual(390 - 16);
  }
});
