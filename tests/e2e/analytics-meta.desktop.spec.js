import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene } from './helpers.js';

test('desktop: мета-теги на русском и превью, цели Метрики уходят по действиям', async ({ page }) => {
  // Метрика не должна ходить в сеть из тестов: перехватываем и считаем цели
  const goals = [];
  await page.route(/mc\.yandex\.ru|mc\.webvisor\.org/, (route) => route.fulfill({ status: 200, body: '' }));
  await page.addInitScript(() => {
    window.__goals = [];
    Object.defineProperty(window, 'ym', {
      configurable: true,
      set(fn) { this.__ymReal = fn; },
      get() {
        return (id, action, target) => { if (action === 'reachGoal') window.__goals.push(target); };
      },
    });
  });
  await page.goto('/');

  // мета-теги: русский заголовок, описание и Open Graph с фолбэк-кадром
  await expect(page).toHaveTitle(/Алекс Ишманов/);
  const meta = async (sel) => page.locator(sel).getAttribute('content');
  expect(await meta('meta[name="description"]')).toContain(content.offer);
  expect(await meta('meta[property="og:title"]')).toContain('Алекс Ишманов');
  expect(await meta('meta[property="og:description"]')).toContain(content.offer);
  expect(await meta('meta[property="og:image"]')).toMatch(/white-desktop\.webp/);
  expect(await meta('meta[property="og:type"]')).toBe('website');
  expect(await meta('meta[property="og:locale"]')).toBe('ru_RU');
  expect(await page.locator('html').getAttribute('lang')).toBe('ru');

  await waitForPrelude(page);
  // счётчик подключается после первой отрисовки сцены, а не до неё
  expect(await page.evaluate(() => !!document.querySelector('script[src*="mc.yandex.ru"]'))).toBe(true);

  await goToWhiteScene(page, 'desktop');
  await page.waitForTimeout(300);
  goals.push(...await page.evaluate(() => window.__goals));
  expect(goals).toContain('white-scene');

  // клики по кнопкам: цели Ask и «Написать». Переход в Telegram гасим, вкладка не открывается.
  await page.route('https://t.me/**', (route) => route.fulfill({ status: 200, body: 'ok' }));
  await page.evaluate(() => {
    for (const a of document.querySelectorAll('a[target="_blank"]')) a.removeAttribute('target');
    document.addEventListener('click', (e) => e.preventDefault(), true);
  });
  await page.locator('#ask-nav').click();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__goals)).toContain('ask');

  await page.evaluate(() => { document.getElementById('contact').scrollIntoView(); });
  await page.locator('#contact a[href]').click();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__goals)).toContain('contact');
});
