import { test, expect } from '@playwright/test';
import { waitForPrelude, goToWhiteScene } from './helpers.js';

test('desktop: мета-теги на русском и превью, сторонних счётчиков нет', async ({ page }) => {
  // сторонних скриптов и cookie нет (ADR 0001): Метрика убрана ради «Лучших практик» PageSpeed
  const thirdParty = [];
  page.on('request', (r) => {
    const host = new URL(r.url()).hostname;
    if (!['localhost', '127.0.0.1', 'aleksishmanov.ru'].includes(host) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) thirdParty.push(r.url());
  });
  await page.goto('/');

  // мета-теги: русский заголовок, описание и Open Graph с фолбэк-кадром
  await expect(page).toHaveTitle(/Алексей Ишманов/);
  const meta = async (sel) => page.locator(sel).getAttribute('content');
  // описание — позиционирование портала (CONTEXT.md, «Позиционирование»), а не прежний оффер лоадера
  expect(await meta('meta[name="description"]')).toContain('Запускаю сложные технологические продукты');
  expect(await meta('meta[property="og:title"]')).toContain('Алексей Ишманов');
  expect(await meta('meta[property="og:description"]')).toContain('Запускаю сложные технологические продукты');
  expect(await meta('meta[property="og:image"]')).toMatch(/white-desktop\.webp/);
  expect(await meta('meta[property="og:type"]')).toBe('website');
  expect(await meta('meta[property="og:locale"]')).toBe('ru_RU');
  expect(await page.locator('html').getAttribute('lang')).toBe('ru');

  await waitForPrelude(page);
  await goToWhiteScene(page, 'desktop');
  expect(thirdParty, `сторонние запросы:\n${thirdParty.join('\n')}`).toEqual([]);
  expect(await page.context().cookies()).toEqual([]);
});
