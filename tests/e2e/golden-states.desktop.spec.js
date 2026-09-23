import { test, expect } from '@playwright/test';
import { STEPS, waitForPrelude, waitForProgress, wheelBurst, expectGolden, scoreAgainstGolden } from './helpers.js';

const S = STEPS.desktop;

// Кадра ухода сцены здесь нет: __capturePng снимает буфер WebGL, а уход — это CSS-трансформ
// канваса и смена потока. Геометрия ухода проверяется в scene-leave.*.spec.js.
test('desktop: золотые кадры ключевых состояний', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await page.waitForTimeout(2500); // свет разгорается 2.2 с
  await expectGolden(page, 'dark-desktop');

  // Пик глитча золотым кадром не фиксируем: эффект шумит по времени и кадр недетерминирован.
  // Проверяем структурно — в середине перехода картинка сильно уходит от тёмной сцены.
  await wheelBurst(page, { ticks: 2 });
  await page.waitForFunction(() => window.__app.tl.glitch > 0.35 && window.__app.tl.glitch < 0.75, null, { timeout: 5000 });
  const glitchScore = await scoreAgainstGolden(page, 'dark-desktop');
  expect(glitchScore, `кадр глитча похож на тёмную сцену: score ${glitchScore}`).toBeGreaterThan(8);

  await waitForProgress(page, S.transition, { timeout: 20_000 });
  await page.waitForTimeout(900);
  await wheelBurst(page);
  await waitForProgress(page, S.whiteScene);
  await page.waitForTimeout(900);
  await expectGolden(page, 'white-desktop');
});
