// Список раздела (Блог, Разборы, Инструменты, Промты): одна колонка, без картинок, акцент на тексте.
// Презентации и Кейсы — свои шаблоны. Запуск: npm run test:portal.
import { test, expect } from '@playwright/test';

const TEXT_SECTIONS = ['/blog/', '/reviews/', '/tools/', '/prompts/'];

for (const url of TEXT_SECTIONS) {
  test(`список ${url}: без картинок; у пункта заголовок-ссылка, метки, анонс, время чтения, дата`, async ({ page }) => {
    await page.goto(url);
    const list = page.locator('.mlist');
    await expect(list).toHaveCount(1);
    await expect(list.locator('img')).toHaveCount(0);
    const items = list.locator('.mlist__item');
    expect(await items.count()).toBeGreaterThan(0);
    const first = items.first();
    await expect(first.locator('h2 a, h3 a')).toHaveAttribute('href', /^\/[a-z]+\/[^/]+\/$/);
    await expect(first.locator('.mlist__tag').first()).toBeVisible();
    await expect(first.locator('.mlist__desc')).not.toBeEmpty();
    await expect(first.locator('.mlist__meta')).toContainText(/\d+ мин/);
    await expect(first.locator('.mlist__meta time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}/);
    // одна колонка: все пункты на одном левом краю, друг под другом
    const xs = await items.evaluateAll((els) => els.slice(0, 5).map((e) => Math.round(e.getBoundingClientRect().x)));
    expect(new Set(xs).size).toBe(1);
    await expect(page.locator('.card')).toHaveCount(0);
  });
}

test('блог: пагинация работает, вторая страница — тот же шаблон', async ({ page }) => {
  await page.goto('/blog/');
  const next = page.locator('.pager a[rel="next"]');
  await expect(next).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/\/blog\/page\/2\/$/);
  await expect(page.locator('.mlist__item').first()).toBeVisible();
  await expect(page.locator('.mlist img')).toHaveCount(0);
  await expect(page.locator('.pager a[rel="prev"]')).toBeVisible();
});

test('презентации и кейсы этим шаблоном не затронуты', async ({ page }) => {
  await page.goto('/slides/');
  await expect(page.locator('.mlist')).toHaveCount(0);
  await expect(page.locator('.card').first()).toBeVisible();
  await page.goto('/cases/');
  await expect(page.locator('.mlist')).toHaveCount(0);
});
