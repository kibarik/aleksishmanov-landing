import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene, leaveScene, openMenu } from './helpers.js';

const probe = (page, selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  return { cursor: getComputedStyle(el).cursor, dot: +getComputedStyle(document.querySelector('.cursor')).opacity };
}, selector);

const moveOver = async (page, selector) => {
  const r = await page.locator(selector).first().boundingBox();
  await page.mouse.move(r.x + r.width / 2, r.y + Math.min(r.height / 2, 40), { steps: 4 });
  await page.mouse.move(r.x + r.width / 2 + 3, r.y + Math.min(r.height / 2, 40) + 3);
  await page.waitForTimeout(500);
};

test('desktop: курсор-точка живёт только до ухода сцены и возвращается при прокрутке назад', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.mouse.move(400, 400, { steps: 5 });
  await page.waitForTimeout(500);

  // тёмная сцена и белая сцена: системный курсор скрыт, точка видна
  let p = await probe(page, 'body');
  expect(p.cursor).toBe('none');
  expect(p.dot).toBe(1);
  await goToWhiteScene(page, 'desktop');
  await page.mouse.move(420, 420, { steps: 3 });
  await page.waitForTimeout(400);
  p = await probe(page, 'body');
  expect(p.cursor).toBe('none');
  expect(p.dot).toBe(1);

  // сцена ушла: «Обо мне» — системный курсор, точки нет
  await leaveScene(page, 'desktop');
  await moveOver(page, '#about .about__offer');
  p = await probe(page, '#about .about__offer');
  expect(p.cursor).not.toBe('none');
  expect(p.dot).toBe(0);
  expect((await probe(page, '#about .about__proof-link')).cursor).not.toBe('none');

  // подвал
  await page.evaluate(() => document.getElementById('footer').scrollIntoView());
  await moveOver(page, '#footer');
  p = await probe(page, '#footer a');
  expect(p.cursor).not.toBe('none');
  expect(p.dot).toBe(0);

  // назад к сцене: точка возвращается
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, -200); // жест вверх на самом верху включает липкий режим сцены
  await page.waitForFunction(() => !document.body.classList.contains('is-released'), null, { timeout: 10_000 });
  await page.mouse.move(500, 300, { steps: 3 });
  await page.waitForTimeout(500);
  p = await probe(page, 'body');
  expect(p.cursor).toBe('none');
  expect(p.dot).toBe(1);
});

test('desktop: открытое меню — системный курсор, точки нет', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await openMenu(page);
  await page.waitForTimeout(800);
  const p = await probe(page, 'body');
  expect(p.cursor).not.toBe('none');
  expect(p.dot).toBe(0);
});

test('desktop: предметы белой сцены — декорация: ни плашки, ни pointer, ни перехода по клику', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');
  const vp = page.viewportSize();
  const url = page.url();
  // обходим сеткой весь кадр: где бы ни лежал предмет, реакции быть не должно
  for (let y = 80; y < vp.height - 40; y += 70) {
    for (let x = 60; x < vp.width - 40; x += 90) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(25);
      expect(await page.evaluate(() => document.body.classList.contains('is-prop-hover')), `hover на ${x},${y}`).toBe(false);
    }
  }
  await page.waitForTimeout(200);
  await expect(page.locator('.prop-tag')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('scene')).cursor)).not.toBe('pointer');
  // клик по каждой «горячей» точке не уводит со страницы
  const hits = await page.evaluate(({ w, h }) => {
    const out = [];
    for (let y = 80; y < h - 40; y += 70) for (let x = 60; x < w - 40; x += 90) if (window.__app.pickProp(x, y)) out.push([x, y]);
    return out;
  }, { w: vp.width, h: vp.height });
  for (const [x, y] of hits.slice(0, 5)) await page.mouse.click(x, y);
  await page.waitForTimeout(500);
  expect(page.url()).toBe(url);
});
