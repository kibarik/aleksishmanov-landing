#!/usr/bin/env node
/**
 * Превью картинок портала в webp: обложки из front matter (карточка ~360 px — 480 и 960) и картинки из текста
 * материалов (колонка ~700 px — 480, 960 и 1440). Оригиналы из Teletype/Telegram — до мегабайтов в jpg/png
 * (PageSpeed: uses-responsive-images, modern-image-formats). Запускается сборкой перед astro build (scripts/build.mjs).
 *
 * Пишет portal/public/_t/<путь без расширения>-<ширина>.webp и манифест portal/src/.thumbs.json
 * { "/media/…/x.jpg": { w, h, widths } } — его читают Card.astro и rehype-плагин статей (portal/src/lib/rehype-thumbs.mjs).
 * Уже готовые превью не пересчитываются.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './local-server.mjs';

/** ширины превью: обложки карточек и картинки в тексте статьи */
export const COVER_WIDTHS = [480, 960];
export const CONTENT_WIDTHS = [480, 960, 1440];
const PORTAL = path.join(ROOT, 'portal');
const CONTENT = path.join(PORTAL, 'src', 'content');
const OUT = path.join(PORTAL, 'public', '_t');
const MANIFEST = path.join(PORTAL, 'src', '.thumbs.json');

/** Картинки материалов: путь → нужные ширины (обложка и картинка в тексте могут совпадать — берём объединение). */
function images() {
  const out = new Map();
  const want = (src, widths) => out.set(src, [...new Set([...(out.get(src) || []), ...widths])].sort((a, b) => a - b));
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) {
        const text = fs.readFileSync(p, 'utf8');
        const cover = text.match(/^cover:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (cover && cover[1].startsWith('/')) want(cover[1], COVER_WIDTHS);
        for (const m of text.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)\)/g)) want(m[1], CONTENT_WIDTHS);
      }
    }
  };
  walk(CONTENT);
  return out;
}

export async function buildThumbs() {
  const manifest = {};
  let made = 0;
  for (const [src, wanted] of images()) {
    const file = path.join(PORTAL, 'public', src);
    if (!fs.existsSync(file) || !/\.(jpe?g|png|webp|gif)$/i.test(src)) continue;
    const meta = await sharp(file).metadata();
    const base = src.replace(/\.[a-z0-9]+$/i, '');
    // больше оригинала не растягиваем, но сам оригинал (до наибольшей нужной ширины) — тоже в наборе:
    // иначе картинка 800 px получила бы только 480w и на Retina была бы мыльной
    const W = meta.width || wanted[0];
    const top = Math.min(W, wanted[wanted.length - 1]);
    const widths = [...new Set([...wanted.filter((w) => w < top), top])];
    for (const w of widths) {
      const dst = path.join(OUT, `${base}-${w}.webp`);
      if (fs.existsSync(dst)) continue;
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      await sharp(file, { animated: false }).resize({ width: w }).webp({ quality: 72 }).toFile(dst);
      made++;
    }
    manifest[src] = { w: meta.width, h: meta.height, widths };
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
  return { images: Object.keys(manifest).length, made };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await buildThumbs();
  console.log(`превью картинок: ${r.images}, новых файлов: ${r.made}`);
}
