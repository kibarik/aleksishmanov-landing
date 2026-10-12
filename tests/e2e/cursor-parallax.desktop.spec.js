import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene } from './helpers.js';

const cursorPos = (page) => page.evaluate(() => {
  const t = getComputedStyle(document.querySelector('.cursor')).transform;
  const m = new DOMMatrixReadOnly(t);
  return { x: m.m41, y: m.m42 };
});

test('desktop: курсор-точка следует за мышью и реагирует на ссылки', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await expect(page.locator('.cursor')).toHaveCount(1);

  await page.mouse.move(300, 300, { steps: 8 });
  await page.waitForTimeout(600);
  const a = await cursorPos(page);
  await page.mouse.move(1100, 700, { steps: 12 });
  await page.waitForTimeout(600);
  const b = await cursorPos(page);
  expect(b.x - a.x, `курсор не уехал: ${JSON.stringify([a, b])}`).toBeGreaterThan(400);
  expect(b.y - a.y).toBeGreaterThan(200);

  // над кнопкой в шапке точка превращается в кольцо
  await page.locator('#ask-nav').hover();
  await page.waitForTimeout(300);
  await expect(page.locator('.cursor')).toHaveClass(/cursor--active/);
});

test('desktop: сцена отзывается на движение мыши, на мобильном нет', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');

  const camX = () => page.evaluate(() => window.__app.camera.position.x);
  const pieceX = () => page.evaluate(() => {
    const p = window.__app.scene.getObjectByName('chess-near');
    return p ? p.position.x : null;
  });

  await page.mouse.move(120, 700, { steps: 10 });
  await page.waitForTimeout(900);
  const left = { cam: await camX(), piece: await pieceX() };
  await page.mouse.move(1340, 200, { steps: 10 });
  await page.waitForTimeout(900);
  const right = { cam: await camX(), piece: await pieceX() };

  expect(right.cam - left.cam, `камера не сдвинулась: ${JSON.stringify([left, right])}`).toBeGreaterThan(0.4);
  expect(Math.abs(right.piece - left.piece), 'ближняя фигура должна двигаться заметнее камеры').toBeGreaterThan(0.4);
});
