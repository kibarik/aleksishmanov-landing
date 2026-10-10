// Портал против собранного dist/ (сервер с поведением Timeweb): npm run test:portal.
// Шаги повторяют сценарий приёмки (HowToDemo) из .scratch/hub/spec.md.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'portal', 'src', 'content');
const slugs = (c) => fs.readdirSync(path.join(CONTENT, c)).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const teletype = slugs('blog').filter((s) => fs.readFileSync(path.join(CONTENT, 'blog', `${s}.md`), 'utf8').includes('source: "teletype"'));

test('1. главная: в HTML без JS — имя, позиционирование, направления, свежие материалы, Person', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toMatch(/<title>Алексей Ишманов/);
  expect(html).toContain('"@type":"Person"');
  for (const href of ['/startups/', '/ai-in-business/', '/blog/', '/prompts/', '/slides/']) expect(html).toContain(`href="${href}"`);
  expect(html).toContain('id="latest"');
  expect(html).toContain('ИИ в корпоративных процессах');
});

test('2. шапка портала ведёт во все разделы, каждый раздел открывается', async ({ page }) => {
  await page.goto('/blog/');
  const nav = page.locator('.site-nav a');
  await expect(nav).toHaveText(['Блог', 'Разборы', 'Инструменты', 'Промты', 'Презентации', 'Кейсы', 'Обо мне']);
  for (const href of await nav.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) {
    const res = await page.goto(href);
    expect(res.status(), href).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('3. все статьи Teletype: полный текст в HTML без JS, canonical и Article', async ({ request }) => {
  expect(teletype.length).toBe(30);
  for (const slug of teletype) {
    const res = await request.get(`/blog/${slug}/`);
    expect(res.status(), slug).toBe(200);
    const html = await res.text();
    expect(html, slug).toContain(`<link rel="canonical" href="https://aleksishmanov.ru/blog/${slug}/">`);
    expect(slug, 'адреса сайта — в нижнем регистре').toBe(slug.toLowerCase());
    expect(html, slug).toContain('"@type":"Article"');
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
    expect(text.replace(/\s+/g, ' ').length, slug).toBeGreaterThan(2500);
  }
});

test('4a. старые адреса блога: страница-переадресация на новый адрес', async ({ request }) => {
  const old = teletype.map((slug) => [JSON.parse(fs.readFileSync(path.join(CONTENT, 'blog', `${slug}.md`), 'utf8').match(/^old_urls: (.*)$/m)[1])[0].split('/').pop(), slug]);
  for (const [was, slug] of old) {
    const res = await request.get(`/${was}/`);
    expect(res.status(), slug).toBe(200);
    const html = await res.text();
    expect(html, slug).toContain(`url=https://aleksishmanov.ru/blog/${slug}/`);
    expect(html, slug).toContain(`rel="canonical" href="https://aleksishmanov.ru/blog/${slug}/"`);
  }
  // адрес без слэша — как у Teletype — сначала 308 на слэш
  const bare = await request.get(`/${old[0][0]}`, { maxRedirects: 0 });
  expect(bare.status()).toBe(308);
});

test('4b. старые домены уводят на aleksishmanov.ru с тем же материалом', async ({ page }) => {
  const port = new URL(page.context()._options?.baseURL || 'http://localhost:4174').port || '4174';
  const cases = [
    [`http://blog.aleksishmanov.ru:${port}/bullseye-framework`, 'https://aleksishmanov.ru/blog/bullseye-framework/'],
    [`http://slides.aleksishmanov.ru:${port}/okr-quarter-planning/`, 'https://aleksishmanov.ru/slides/okr-quarter-planning/'],
    [`http://prompts.aleksishmanov.ru:${port}/prompts/tam-sam-som/`, 'https://aleksishmanov.ru/prompts/tam-sam-som/'],
    [`http://prompts.aleksishmanov.ru:${port}/`, 'https://aleksishmanov.ru/prompts/'],
  ];
  await page.route('https://aleksishmanov.ru/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
  for (const [from, to] of cases) {
    const req = page.waitForRequest((r) => r.url().startsWith('https://aleksishmanov.ru/'));
    await page.goto(from).catch(() => {});
    expect((await req).url(), from).toBe(to);
  }
});

test('5. несуществующий адрес — страница 404 с кодом 404', async ({ request }) => {
  const res = await request.get('/net-takoy-stranicy/');
  expect(res.status()).toBe(404);
  expect(await res.text()).toContain('Такой страницы нет');
});

test('6. sitemap, robots, RSS, llms.txt и Markdown-копии', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('<loc>https://aleksishmanov.ru/</loc>');
  expect(sitemap).toContain('https://aleksishmanov.ru/blog/bullseye-framework/');
  expect(sitemap).not.toContain('/404');
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://aleksishmanov.ru/sitemap-index.xml');
  expect(await (await request.get('/rss.xml')).text()).toContain('<item>');
  const llms = await (await request.get('/llms.txt')).text();
  expect(llms).toMatch(/^# Алексей Ишманов/);
  expect(llms).toContain('/blog/bullseye-framework.md');
  const md = await request.get('/blog/bullseye-framework.md');
  expect(md.status()).toBe(200);
  expect(await md.text()).toMatch(/^# Bullseye Framework/);
});

test('7. внутренние ссылки всех страниц ведут на существующие файлы', async () => {
  const pages = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) pages.push(p); } };
  walk(DIST);
  const broken = new Set();
  for (const file of pages) {
    if (file.includes(`${path.sep}slides${path.sep}`) || file.includes(`${path.sep}call${path.sep}`)) continue; // готовые HTML презентаций проверяются ниже
    const html = fs.readFileSync(file, 'utf8');
    for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
      let rel = decodeURIComponent(href);
      const target = path.join(DIST, rel);
      const ok = rel.endsWith('/') ? fs.existsSync(path.join(target, 'index.html')) : fs.existsSync(target);
      if (!ok) broken.add(`${path.relative(DIST, file)} → ${href}`);
    }
  }
  expect([...broken]).toEqual([]);
});

test('8. презентации открываются с прежними ресурсами', async ({ page }) => {
  const failed = [];
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith('http://localhost')) failed.push(`${r.status()} ${r.url()}`); });
  for (const id of slugs('slides')) {
    const res = await page.goto(`/slides/${id}/`);
    expect(res.status(), id).toBe(200);
  }
  await page.goto('/slides/');
  await expect(page.locator('.card')).toHaveCount(slugs('slides').length);
  expect(failed).toEqual([]);
});

test('9. мобильная ширина: без горизонтальной прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of ['/blog/', '/blog/bullseye-framework/', '/prompts/', '/ai-in-business/', '/about/']) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(1);
    // шапка не прилипает к краю экрана: отступ по бокам как у контента
    expect((await page.locator('.brand').boundingBox()).x, url).toBeGreaterThanOrEqual(16);
  }
});
