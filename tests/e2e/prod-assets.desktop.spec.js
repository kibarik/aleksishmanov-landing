import { test, expect } from '@playwright/test';

/**
 * Прод: каждый файл, на который ссылается страница, реально отдаётся.
 * Ловит частичный деплой — когда HTML уже новый, а чанка или шрифта на сервере ещё нет:
 * страница тогда рендерит секции, но 3D-сцена не стартует.
 *
 *   PROD_URL=https://aleksishmanov.ru npx playwright test prod-assets --project=desktop
 *
 * Проверка идёт по HTTP, без браузера: она должна работать и там, где браузер до домена не достаёт.
 */
test.skip(!process.env.PROD_URL, 'нужен PROD_URL');

const BASE = (process.env.PROD_URL || '').replace(/\/$/, '');
const abs = (p) => new URL(p.replace(/^\.\//, ''), BASE + '/').toString();

/** Типы, которые обязаны совпасть: иначе модуль не выполнится, а шрифт не применится. */
const EXPECTED_TYPE = {
  '.js': /javascript/,
  '.css': /css/,
  '.woff2': /font|octet-stream/,
  '.woff': /font|octet-stream/,
  '.glb': /model|octet-stream/,
  '.wasm': /wasm|octet-stream/,
  '.webp': /image\/webp/,
  '.json': /json/,
};

async function head(request, url) {
  const res = await request.get(url);
  return { status: res.status(), type: res.headers()['content-type'] || '', size: (await res.body()).length };
}

test('прод: отдаются все файлы страницы, чанки и шрифты', async ({ request }) => {
  const page = await request.get(BASE + '/');
  expect(page.status(), 'главная страница').toBe(200);
  const html = await page.text();

  // 1. то, на что ссылается HTML: модули, стили, картинки, модель из инлайн-скрипта
  const fromHtml = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1])
    .concat([...html.matchAll(/['"](\.\/(?:models|fonts|draco|fallback)\/[^'"]+)['"]/g)].map((m) => m[1]));
  expect(fromHtml.length, 'в HTML должны быть ссылки на ассеты').toBeGreaterThan(2);

  const entry = fromHtml.find((u) => /assets\/index-.*\.js$/.test(u));
  expect(entry, `в HTML нет входного модуля: ${fromHtml.join(', ')}`).toBeTruthy();

  // 2. чанки и шрифты, на которые ссылается сам бандл (динамические импорты — boot3d, three)
  const entryRes = await request.get(abs(entry));
  expect(entryRes.status()).toBe(200);
  const entryJs = await entryRes.text();
  const chunks = [...entryJs.matchAll(/["'`](\.\/)?(assets\/[A-Za-z0-9._-]+\.js)["'`]/g)].map((m) => m[2]);
  // CSS главной встроен в HTML (scripts/vite-inline-css.mjs), шрифты — отдельный CSS-чанк, его подключает
  // бандл после load (src/fonts.js). url() в нём — относительно самого файла стилей, а не корня сайта
  // в карте зависимостей бандла путь записан относительно assets/: "./fonts-<hash>.css"
  const fontsName = entryJs.match(/["'](?:\.\/|assets\/)(fonts-[A-Za-z0-9_-]+\.css)["']/)?.[1];
  const fontsCss = fontsName && `assets/${fontsName}`;
  expect(fontsCss, 'CSS шрифтов в бандле').toBeTruthy();
  const cssText = await (await request.get(abs(fontsCss))).text();
  const fonts = [...cssText.matchAll(/url\(\s*["']?([^"')]+\.(?:woff2?|ttf))["']?\s*\)/g)]
    .map((m) => new URL(m[1], abs(fontsCss)).toString());
  expect(fonts.length, 'файлы шрифтов в CSS шрифтов').toBeGreaterThan(5);

  const all = [...new Set([...fromHtml.map(abs), ...chunks.map(abs), abs(fontsCss), ...fonts])];
  expect(all.length, 'набор файлов для проверки').toBeGreaterThan(5);

  // на этом хостинге несуществующий путь отдаёт 200 с HTML — проверяем тип, а не только код
  const broken = [];
  for (const url of all) {
    const r = await head(request, url);
    const ext = url.slice(url.lastIndexOf('.')).split('?')[0];
    if (r.status !== 200) broken.push(`${r.status} ${url}`);
    else if (r.size === 0) broken.push(`пустой файл ${url}`);
    else if (EXPECTED_TYPE[ext] && !EXPECTED_TYPE[ext].test(r.type)) broken.push(`тип ${r.type} у ${url}`);
  }
  expect(broken, `битые файлы:\n${broken.join('\n')}`).toEqual([]);
});

test('прод: HTML и бандл из одной сборки', async ({ request }) => {
  const html = await (await request.get(BASE + '/')).text();
  const entry = html.match(/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
  // стили встроены в HTML: внешний файл блокировал первую отрисовку (PageSpeed)
  const inlineCss = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('');
  expect(entry, 'входной модуль в HTML').toBeTruthy();
  expect(inlineCss, 'стили лендинга встроены в HTML').toContain('.site-footer__panel');

  // разметка и скрипт должны знать друг о друге: иначе выложены части разных сборок
  expect(html).toContain('id="loader-pct"');
  expect(html).toContain('id="scene"');
  expect(html).toContain('id="content"');
  const js = await (await request.get(abs(entry))).text();
  expect(js, 'бандл должен монтировать секции и сцену').toMatch(/loader-pct|scene|content/);
});
