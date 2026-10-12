#!/usr/bin/env node
/**
 * Превью обложек портала: webp 480 и 960 px по ширине для каждой обложки из front matter материалов.
 * Оригиналы из Teletype/Telegram — до мегабайтов в jpg/png, а карточка шириной ~360 px (PageSpeed:
 * uses-responsive-images, modern-image-formats). Запускается сборкой перед astro build (scripts/build.mjs).
 *
 * Пишет portal/public/_t/<путь обложки без расширения>-<ширина>.webp и манифест portal/src/.thumbs.json
 * { "/media/…/x.jpg": { w, h, widths: [480, 960] } } — его читает Card.astro. Уже готовые превью не пересчитываются.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './local-server.mjs';

export const WIDTHS = [480, 960];
const PORTAL = path.join(ROOT, 'portal');
const CONTENT = path.join(PORTAL, 'src', 'content');
const OUT = path.join(PORTAL, 'public', '_t');
const MANIFEST = path.join(PORTAL, 'src', '.thumbs.json');

function covers() {
  const out = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) {
        const m = fs.readFileSync(p, 'utf8').match(/^cover:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (m && m[1].startsWith('/')) out.add(m[1]);
      }
    }
  };
  walk(CONTENT);
  return [...out];
}

export async function buildThumbs() {
  const manifest = {};
  let made = 0;
  for (const cover of covers()) {
    const src = path.join(PORTAL, 'public', cover);
    if (!fs.existsSync(src)) continue;
    const meta = await sharp(src).metadata();
    const base = cover.replace(/\.[a-z0-9]+$/i, '');
    const widths = WIDTHS.filter((w) => w < (meta.width || 0));
    if (!widths.length) widths.push(Math.min(meta.width || WIDTHS[0], WIDTHS[0]));
    for (const w of widths) {
      const dst = path.join(OUT, `${base}-${w}.webp`);
      if (fs.existsSync(dst)) continue;
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      await sharp(src).resize({ width: w }).webp({ quality: 72 }).toFile(dst);
      made++;
    }
    manifest[cover] = { w: meta.width, h: meta.height, widths };
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
  return { covers: Object.keys(manifest).length, made };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await buildThumbs();
  console.log(`превью обложек: ${r.covers}, новых файлов: ${r.made}`);
}
