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
  const geom = () => page.evaluate(() => {
    const r = (id) => document.getElementById(id).getBoundingClientRect().top;
    return { hero: r('hero'), scene: r('scene'), tagline: r('tagline'), ask: r('ask-scene'), scrollY: window.scrollY, h: window.innerHeight };
  });
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(400);
  const mid = await geom();
  expect(mid.scrollY).toBeGreaterThan(0);
  expect(mid.scene - mid.hero).toBeGreaterThan(40); // канвас ниже своего контейнера — отстаёт

  // теглайн и кнопка Ask уезжают вместе с контентом: их смещение от hero не меняется со скроллом
  const start = await page.evaluate(() => {
    window.scrollTo(0, 0);
    const r = (id) => document.getElementById(id).getBoundingClientRect().top;
    return { tagline: r('tagline') - r('hero'), ask: r('ask-scene') - r('hero') };
  });
  await page.waitForTimeout(300);
  expect(Math.abs((mid.tagline - mid.hero) - start.tagline)).toBeLessThan(2);
  expect(Math.abs((mid.ask - mid.hero) - start.ask)).toBeLessThan(2);

  // на втором экране персонаж догоняет контент: отставание возвращается к нулю
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await page.waitForTimeout(300);
  const atScreen = await geom();
  expect(atScreen.scene - atScreen.hero).toBeGreaterThan(atScreen.h * 0.2);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
  await page.waitForTimeout(300);
  const caught = await geom();
  expect(caught.scene - caught.hero, 'персонаж должен догнать контент').toBeLessThan(2);

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
