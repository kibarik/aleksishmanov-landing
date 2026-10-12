#!/usr/bin/env node
/**
 * Сборка сайта целиком: главная (3D-лендинг, Vite) + портал (Astro) → один каталог dist/.
 * Timeweb App Platform запускает `npm run build` и отдаёт dist/ (ADR 0002).
 * Совпадение путей между лендингом и порталом — ошибка сборки, а не тихая перезапись.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './local-server.mjs';
import { buildThumbs } from './portal-thumbs.mjs';

const DIST = path.join(ROOT, 'dist');
const PORTAL = path.join(ROOT, 'dist-portal');
const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });

run('npx vite build');
// превью картинок портала (webp) — до astro build: карточки и статьи читают манифест
const thumbs = await buildThumbs();
console.log(`превью картинок: ${thumbs.images}, новых файлов: ${thumbs.made}`);
run('npx astro build --root portal');

const conflicts = [];
let copied = 0;
function merge(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); merge(a, b); continue; }
    if (fs.existsSync(b) && !fs.readFileSync(a).equals(fs.readFileSync(b))) { conflicts.push(path.relative(PORTAL, a)); continue; }
    fs.copyFileSync(a, b);
    copied++;
  }
}
merge(PORTAL, DIST);
fs.rmSync(PORTAL, { recursive: true, force: true });
if (conflicts.length) {
  console.error(`\nлендинг и портал собрали один и тот же путь:\n${conflicts.map((c) => `  ${c}`).join('\n')}`);
  process.exit(1);
}
for (const must of ['index.html', '404.html', 'blog/index.html', 'sitemap-index.xml', 'robots.txt', 'llms.txt']) {
  if (!fs.existsSync(path.join(DIST, must))) { console.error(`в сборке нет ${must}`); process.exit(1); }
}
console.log(`\nпортал добавлен в dist/: ${copied} файлов`);
