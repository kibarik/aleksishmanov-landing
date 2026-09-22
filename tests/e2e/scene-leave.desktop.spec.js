import { test, expect } from '@playwright/test';
import { STEPS, waitForPrelude, goToWhiteScene, leaveScene, readProgress, waitForProgress, wheelBurst } from './helpers.js';

const S = STEPS.desktop;

test('desktop: персонаж отстаёт при уходе сцены, возврат наверху возвращает липкий режим', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');
  expect(await readProgress(page)).toBe(S.whiteScene);

  // в момент отпускания рывка нет: наверху сцена ровно в кадре, без смещения
  await leaveScene(page, 'desktop', { screens: 0 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.getElementById('scene').getBoundingClientRect().top)).toBe(0);
  expect(await page.evaluate(() => document.getElementById('hero').getBoundingClientRect().top)).toBe(0);

  // персонаж отстаёт от контента: канвас смещается вниз относительно уехавшего hero
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(400);
  const lag = await page.evaluate(() => {
    const hero = document.getElementById('hero').getBoundingClientRect().top;
    const scene = document.getElementById('scene').getBoundingClientRect().top;
    return { hero, scene, scrollY: window.scrollY };
  });
  expect(lag.scrollY).toBeGreaterThan(0);
  expect(lag.scene).toBeGreaterThan(lag.hero + 40); // канвас ниже своего контейнера — отстаёт

  // теглайн и кнопка Ask уезжают вместе с контентом, не отстают
  const overlay = await page.evaluate(() => ({
    hero: document.getElementById('hero').getBoundingClientRect().top,
    tagline: document.getElementById('tagline').getBoundingClientRect().top,
    ask: document.getElementById('ask-scene').getBoundingClientRect().top,
  }));
  expect(overlay.tagline - overlay.hero).toBeLessThan(overlay.hero + 1000);
  expect(Math.abs((overlay.ask - overlay.hero) - (await page.evaluate(() => {
    const h = document.getElementById('hero'); const a = document.getElementById('ask-scene');
    return a.offsetTop - h.offsetTop;
  })))).toBeLessThan(2);

  // после первого экрана отставание перестаёт расти: догоняет по скорости
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const hero = document.getElementById('hero').getBoundingClientRect().top;
    const scene = document.getElementById('scene').getBoundingClientRect().top;
    return scene - hero;
  });
  expect(after).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight * 0.31));

  // возврат: наверху жест вверх включает липкий режим на белой сцене
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, -120);
  await page.waitForFunction(() => window.__sticky.state.released === false, null, { timeout: 10_000 });
  expect(await readProgress(page)).toBe(S.whiteScene);

  // и дальше жестами вверх — назад к переходу и тёмной сцене
  await wheelBurst(page, { delta: -100 });
  await waitForProgress(page, S.transition);
  await page.waitForTimeout(700);
  await wheelBurst(page, { delta: -100 });
  await waitForProgress(page, S.darkScene);
});
