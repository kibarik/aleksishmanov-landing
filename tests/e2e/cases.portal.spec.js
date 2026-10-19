// Стопка кейсов на /cases/ и страница кейса (.scratch/about-cases): npm run test:portal.
// Сборка для тестов идёт с PORTAL_DRAFTS=1 — каркасы кейсов (draft: true) видны только в ней, в прод не попадают.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const DIR = path.join(ROOT, 'portal', 'src', 'content', 'cases');
/** Кейсы в порядке стопки (поле order). */
const CASES = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'))
  .map((f) => {
    const fm = fs.readFileSync(path.join(DIR, f), 'utf8').split(/^---$/m)[1];
    return { slug: f.slice(0, -3), title: JSON.parse(fm.match(/^title:\s*(.*)$/m)[1]), order: Number(fm.match(/^order:\s*(\d+)/m)[1]) };
  })
  .sort((a, b) => a.order - b.order);

const deck = (page) => page.locator('[data-stack-deck]');
const slides = (page) => page.locator('[data-stack-slide]');
const front = (page) => page.locator('[data-stack-slide][data-pos="0"]');

test.beforeEach(() => expect(CASES.length, 'в тестовой сборке нужны кейсы').toBeGreaterThanOrEqual(3));

test('1. без JS: каждый кейс в HTML — заголовок, ссылка на страницу, роль доступности у стопки', async ({ request }) => {
  const html = await (await request.get('/cases/')).text();
  for (const c of CASES) {
    expect(html).toContain(c.title.replace(/"/g, '&quot;'));
    expect(html).toContain(`href="/cases/${c.slug}/"`);
  }
  expect(html).toMatch(/role="region"[^>]*aria-roledescription="карусель"|aria-roledescription="карусель"[^>]*role="region"/);
  expect(html).toContain('aria-live="polite"');
});

test('2. спереди первый кейс; «Следующий кейс», стрелки и счётчик листают по кругу, live-регион объявляет', async ({ page }) => {
  await page.goto('/cases/');
  await expect(slides(page)).toHaveCount(CASES.length);
  await expect(front(page)).toContainText(CASES[0].title);
  await expect(page.locator('[data-stack-count]')).toHaveText('01');

  await page.getByRole('button', { name: 'Следующий кейс' }).click();
  await expect(front(page)).toContainText(CASES[1].title);
  await expect(page.locator('[data-stack-count]')).toHaveText('02');
  await expect(page.locator('[data-stack-status]')).toContainText(`Кейс 2 из ${CASES.length}`);

  await deck(page).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(front(page)).toContainText(CASES[0].title);
  await page.keyboard.press('ArrowLeft');
  await expect(front(page)).toContainText(CASES.at(-1).title);
  await page.keyboard.press('ArrowRight');
  await expect(front(page)).toContainText(CASES[0].title);
});

test('3. клик по выглядывающему краю заднего слайда выводит его вперёд; задние — вне Tab и скрыты от скринридера', async ({ page }) => {
  await page.goto('/cases/');
  const back = page.locator('[data-stack-slide][data-pos="1"]');
  await expect(back).toHaveAttribute('aria-hidden', 'true');
  for (const tab of await back.locator('a').evaluateAll((as) => as.map((a) => a.tabIndex))) expect(tab).toBe(-1);

  // край заднего слайда торчит справа сверху от переднего — кликаем туда, где переднего нет
  const b = await back.boundingBox();
  await page.mouse.click(b.x + b.width - 12, b.y + 6);
  await expect(front(page)).toContainText(CASES[1].title);
  await expect(front(page)).not.toHaveAttribute('aria-hidden', 'true');
  for (const tab of await front(page).locator('a').evaluateAll((as) => as.map((a) => a.tabIndex))) expect(tab).toBe(0);
});

test('4. свайп пальцем влево — следующий кейс, короткий — остаётся', async ({ page }) => {
  await page.goto('/cases/');
  const swipe = (dx) => deck(page).evaluate((el, dx) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2; const y = r.top + r.height / 2;
    const ev = (type, cx) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: cx, clientY: y, bubbles: true }));
    ev('pointerdown', x); ev('pointermove', x + dx / 2); ev('pointermove', x + dx); ev('pointerup', x + dx);
  }, dx);
  await swipe(-30);
  await expect(front(page)).toContainText(CASES[0].title);
  await swipe(-120);
  await expect(front(page)).toContainText(CASES[1].title);
  await swipe(120);
  await expect(front(page)).toContainText(CASES[0].title);
});

test('5. prefers-reduced-motion: слайды не перелетают (transform без анимации), только проявляются', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/cases/');
  const prop = await front(page).evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(prop).not.toMatch(/transform|all/);
});

test('5b. фокус на колоде объявляет подсказку: у колоды есть роль и имя', async ({ page }) => {
  await page.goto('/cases/');
  await expect(deck(page)).toHaveAttribute('role', 'group');
  await expect(deck(page)).toHaveAttribute('aria-label', /листайте/);
});

test('6. страница кейса: заголовок-результат, цифры, роль, годы, шаги', async ({ page }) => {
  await page.goto('/cases/');
  await front(page).getByRole('link', { name: /Открыть кейс/ }).click();
  await expect(page).toHaveURL(new RegExp(`/cases/${CASES[0].slug}/$`));
  await expect(page.locator('h1')).toHaveText(CASES[0].title);
  await expect(page.locator('.case-facts__metrics dt')).toHaveCount(await page.locator('.case-facts__metrics dd').count());
  expect(await page.locator('.case-facts__metrics dt').count()).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.case-facts')).toContainText(/\d{4}/);
  expect(await page.locator('.case-facts__steps li').count()).toBeGreaterThanOrEqual(3);
});

test('7. телефон 390 px: без горизонтальной прокрутки, передний слайд целиком на экране по ширине', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of ['/cases/', `/cases/${CASES[0].slug}/`]) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(1);
  }
  await page.goto('/cases/');
  const f = await front(page).boundingBox();
  expect(f.x).toBeGreaterThanOrEqual(0);
  expect(f.x + f.width).toBeLessThanOrEqual(390);
  // на телефоне остаётся «Открыть кейс» (контекст и шаги прячутся — исследование, 1.4)
  await expect(front(page).getByRole('link', { name: /Открыть кейс/ })).toBeVisible();
  await expect(front(page).locator('.slide__context')).toBeHidden();
  // текст переднего слайда не вылезает за его рамку
  const spill = await front(page).evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(spill).toBeLessThanOrEqual(1);
});
