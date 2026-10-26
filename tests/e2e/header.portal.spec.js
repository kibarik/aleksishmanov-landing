// Шапка портала (тикет 04, образец — Airtable): группы с описаниями, прямые ссылки, текущий раздел,
// Escape / клик мимо, мобильный ☰, ссылки в HTML без JS.
import { test, expect } from '@playwright/test';

const header = (page) => page.locator('header.site-header');

test('шапка: бренд без подстрочника, закреплена, ~64px, одна чёрная кнопка «Написать»', async ({ page }) => {
  await page.goto('/blog/');
  const h = header(page);
  await expect(h.locator('.brand')).toHaveText('ISHMANOV');
  expect((await h.boundingBox()).height).toBeLessThanOrEqual(72);
  expect(await h.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
  const write = h.getByRole('link', { name: 'Написать' });
  await expect(write).toHaveCount(1);
  expect(await write.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(10, 10, 10)');
  await expect(h.getByText('Методология')).toHaveCount(0);
});

test('панели: кнопки с aria-expanded открываются кликом, показывают пункты и описания', async ({ page }) => {
  await page.goto('/about/');
  const h = header(page);
  const dir = h.getByRole('button', { name: /Направления/ });
  const mat = h.getByRole('button', { name: /Материалы/ });
  await expect(dir).toHaveAttribute('aria-expanded', 'false');
  await expect(h.getByRole('link', { name: /Запуск технологических продуктов/ })).toBeHidden();
  await dir.click();
  await expect(dir).toHaveAttribute('aria-expanded', 'true');
  for (const t of ['Запуск технологических продуктов', 'ИИ в корпоративных процессах']) await expect(h.getByRole('link', { name: new RegExp(t) })).toBeVisible();
  await expect(h.getByText('Основателям и продактам')).toBeVisible();
  await mat.click();
  await expect(dir).toHaveAttribute('aria-expanded', 'false');
  await expect(mat).toHaveAttribute('aria-expanded', 'true');
  const names = ['Блог', 'Разборы', 'Инструменты', 'Промты', 'Презентации'];
  for (const n of names) await expect(h.locator('.nav-panel a', { hasText: n }).first()).toBeVisible();
  await expect(h.locator('.nav-panel:visible .nav-item__desc')).toHaveCount(5);
});

test('панель открывается наведением и закрывается Escape и кликом мимо', async ({ page }) => {
  await page.goto('/about/');
  const mat = header(page).getByRole('button', { name: /Материалы/ });
  await mat.hover();
  await expect(mat).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(mat).toHaveAttribute('aria-expanded', 'false');
  await mat.click();
  await expect(mat).toHaveAttribute('aria-expanded', 'true');
  await page.mouse.click(700, 600);
  await expect(mat).toHaveAttribute('aria-expanded', 'false');
});

test('клавиатура: Tab доходит до кнопки, Enter открывает, фокус остаётся в шапке, Escape возвращает на кнопку', async ({ page }) => {
  await page.goto('/about/');
  const dir = header(page).getByRole('button', { name: /Направления/ });
  await dir.focus();
  await page.keyboard.press('Enter');
  await expect(dir).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.closest('.nav-panel') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dir).toHaveAttribute('aria-expanded', 'false');
  await expect(dir).toBeFocused();
});

test('прямые ссылки: «PO System» на /po-system/, «Кейсы», «Обо мне»; текущий раздел отмечен', async ({ page }) => {
  await page.goto('/cases/');
  const h = header(page);
  await expect(h.getByRole('link', { name: 'PO System' })).toHaveAttribute('href', '/po-system/');
  await expect(h.getByRole('link', { name: 'Кейсы' })).toHaveAttribute('aria-current', 'page');
  await expect(h.getByRole('link', { name: 'Обо мне' })).not.toHaveAttribute('aria-current', 'page');
  await page.goto('/about/');
  await expect(h.getByRole('link', { name: 'Обо мне' })).toHaveAttribute('aria-current', 'page');
  await page.goto('/reviews/');
  await h.getByRole('button', { name: /Материалы/ }).click();
  await expect(h.locator('.nav-panel a[aria-current="page"]')).toHaveText(/Разборы/);
  await expect(h.getByRole('button', { name: /Материалы/ })).toHaveAttribute('aria-current', 'true');
  await page.goto('/startups/');
  await header(page).getByRole('button', { name: /Направления/ }).click();
  await expect(header(page).locator('.nav-panel a[aria-current="page"]')).toHaveText(/Запуск/);
});

test('телефон: ☰ открывает тот же список с группами', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog/');
  const h = header(page);
  const burger = h.getByRole('button', { name: 'Меню' });
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(h.getByRole('link', { name: 'Обо мне' })).toBeHidden();
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  for (const n of ['Направления', 'Материалы']) await expect(h.getByRole('button', { name: new RegExp(n) })).toBeVisible();
  for (const n of ['Запуск технологических продуктов', 'Презентации', 'PO System', 'Кейсы', 'Обо мне']) {
    await expect(h.getByRole('link', { name: new RegExp(n) }).first()).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});

test('без JS: все адреса шапки есть в HTML', async ({ request }) => {
  const html = (await (await request.get('/blog/')).text()).match(/<header[\s\S]*?<\/header>/)[0];
  for (const href of ['/startups/', '/ai-in-business/', '/blog/', '/reviews/', '/tools/', '/prompts/', '/slides/', '/po-system/', '/cases/', '/about/', 'https://t.me/kibarik']) {
    expect(html, href).toContain(`href="${href}"`);
  }
  expect(html).not.toContain('/method/');
});

test('без JS: панели доступны по наведению/фокусу (скрипт не нужен)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('http://localhost:' + (process.env.PW_PORTAL_PORT || 4174) + '/blog/');
  await page.getByRole('button', { name: /Материалы/ }).hover();
  await expect(page.locator('.nav-panel a', { hasText: 'Презентации' })).toBeVisible();
  await ctx.close();
});
