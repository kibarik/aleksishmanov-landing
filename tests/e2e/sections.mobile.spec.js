import { test, expect } from '@playwright/test';
import { content } from '../../src/content.js';
import { waitForPrelude, goToWhiteScene, leaveScene, isInViewport, expectSectionsMatchContent } from './helpers.js';

test('mobile: после ухода сцены секции в потоке и совпадают с контентом', async ({ page }) => {
  await page.goto('/');
  await waitForPrelude(page);
  await goToWhiteScene(page, 'mobile');

  await leaveScene(page, 'mobile');
  // после сцены идёт тёмная секция самопрезентации (два экрана), «Обо мне» ниже неё
  expect(await isInViewport(page, '#intro')).toBe(true);
  await page.evaluate(() => document.getElementById('about').scrollIntoView());
  await page.waitForTimeout(500);
  expect(await isInViewport(page, '#about')).toBe(true);

  await expectSectionsMatchContent(page, content);
});
