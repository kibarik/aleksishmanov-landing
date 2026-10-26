import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, isInViewport } from './helpers.js';

test('desktop: тёмная секция открывается после сцены и перекрашивает шапку', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');
  await leaveScene(page, 'desktop');

  expect(await isInViewport(page, '#about')).toBe(true);
  const intro = page.locator('#about');
  await expect(intro.locator('.about__offer')).toHaveText(content.offer);
  await expect(intro.locator('.about__fact')).toHaveCount(content.about.facts.filter((f) => f.value).length);
  // заголовок подтверждается на том же экране: ссылка на кейсы видна без прокрутки
  expect(await isInViewport(page, '.about__proof-link')).toBe(true);
  await expect(intro.locator('.about__proof-link')).toHaveAttribute('href', content.about.cases.href);

  // текст приехал, фон тёмный, шапка светлая
  await expect(intro).toHaveClass(/intro--in/);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.intro')).backgroundColor)).toBe('rgb(10, 10, 10)');
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(255, 255, 255)');

  // карьерный путь наезжает на экран оффера, шапка остаётся светлой; из него — переход в «Кейсы»
  await page.evaluate(() => document.querySelector('.about__cases').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(600);
  expect(await isInViewport(page, '.about__cases')).toBe(true);
  await expect(intro.locator('.path__row')).toHaveCount(content.about.career.items.length + content.about.education.items.length);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(255, 255, 255)');
  await expect(intro.locator('a.about__cases')).toHaveAttribute('href', '/cases/');

  // ниже по странице секции снова светлые и шапка тёмная
  await page.evaluate(() => document.getElementById('projects').scrollIntoView());
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('nav')).color)).toBe('rgb(17, 17, 17)');
});

test('desktop: на липком экране «Обо мне» внизу тихая подсказка прокрутки, её прячет наезд следующего блока', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');
  await leaveScene(page, 'desktop');
  const hint = page.locator('#about .about__hint');
  // экран оффера на месте: следующий блок ещё целиком под нижней границей
  await page.evaluate(() => document.getElementById('about').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(600);
  await expect(hint).toHaveText(content.about.hint);
  await expect(hint).toHaveCSS('opacity', /^(0\.[5-9]\d*|1)$/);
  const r = await hint.boundingBox();
  const vp = page.viewportSize();
  expect(r.y + r.height, 'подсказка внизу экрана').toBeGreaterThan(vp.height * 0.8);
  // никакой бесконечной анимации
  expect(await hint.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.effect.getTiming().iterations === Infinity).length)).toBe(0);
  // кейсы остаются на экране
  expect(await isInViewport(page, '.about__proof-link')).toBe(true);

  // подсказка прячется, как только следующий блок начал наезжать: он ещё внизу экрана, виден лишь частично
  await page.evaluate(() => {
    const top = document.querySelector('.about__more').getBoundingClientRect().top;
    window.scrollBy(0, top - window.innerHeight * 0.75);
  });
  await page.waitForTimeout(1200);
  const topNow = await page.evaluate(() => document.querySelector('.about__more').getBoundingClientRect().top / window.innerHeight);
  expect(topNow, 'блок только входит в кадр').toBeGreaterThan(0.6);
  await expect(hint).toHaveCSS('opacity', '0');

  // наезд следующего блока прячет подсказку
  await page.evaluate(() => document.querySelector('.about__more').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1200);
  await expect(hint).toHaveCSS('opacity', '0');
});

test('desktop reduced-motion: подсказка прокрутки появляется без анимации', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');
  await leaveScene(page, 'desktop');
  await page.evaluate(() => document.getElementById('about').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(600);
  const t = await page.locator('#about .about__hint').evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(t)).toBe(0);
  await expect(page.locator('#about .about__hint')).toHaveCSS('opacity', /^(0\.[5-9]\d*|1)$/);
});
