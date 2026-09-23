import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, expectSectionsMatchContent, expectAskButtons, isInViewport } from './helpers.js';

/**
 * Прогон по живому сайту: PROD_URL=https://aleksishmanov.ru npx playwright test prod-smoke --project=desktop
 * Проверяет путь посетителя на развёрнутой сборке; в обычный npm test не входит.
 */
test.skip(!process.env.PROD_URL, 'нужен PROD_URL');

test('прод: путь посетителя от лоадера до секций', async ({ page }) => {
  // считаем только свои запросы: сторонние хосты Метрики режет TLS-перехват тестовой среды
  const origin = new URL(process.env.PROD_URL).origin;
  const failed = [];
  page.on('requestfailed', (r) => { if (r.url().startsWith(origin)) failed.push(`${r.url()} ${r.failure()?.errorText}`); });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(process.env.PROD_URL, { waitUntil: 'load', timeout: 60_000 });
  await expect(page).toHaveTitle(/Алекс Ишманов/);
  await expect(page.locator('#loader-offer')).toHaveText(content.offer);

  await waitForPrelude(page);
  await expect(page.locator('#ask-nav')).toHaveAttribute('href', content.ask.href);

  await goToWhiteScene(page, 'desktop');
  await expect(page.locator('body')).toHaveClass(/is-light/);
  await expect(page.locator('#tagline')).toHaveText(content.tagline);
  await expectAskButtons(page, content);

  await leaveScene(page, 'desktop');
  expect(await isInViewport(page, '#about')).toBe(true);
  await expectSectionsMatchContent(page, content);

  expect(failed, 'запросы с ошибкой').toEqual([]);
  expect(errors, 'ошибки страницы').toEqual([]);
});
