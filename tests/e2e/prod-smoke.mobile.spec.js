import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, expectAskButtons } from './helpers.js';

/** Прогон по живому сайту на мобильном пресете: PROD_URL=... npx playwright test prod-smoke --project=mobile */
test.skip(!process.env.PROD_URL, 'нужен PROD_URL');

test('прод: мобильный пресет доходит до белой сцены', async ({ page }) => {
  const models = [];
  page.on('request', (r) => { if (/\.glb(\?|$)/.test(r.url())) models.push(r.url()); });

  await page.goto(process.env.PROD_URL, { waitUntil: 'load', timeout: 60_000 });
  await waitForPrelude(page);
  expect(models.some((u) => u.includes('character-mobile.glb')), `персонаж: ${models}`).toBe(true);

  await goToWhiteScene(page, 'mobile');
  await expect(page.locator('body')).toHaveClass(/is-light/);
  await expect(page.locator('#tagline')).toHaveText(content.tagline);
  await expectAskButtons(page, content);
});
