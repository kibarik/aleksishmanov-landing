// Превью обложек (webp 480/960), которые сборка кладёт в /_t/ — манифест пишет scripts/portal-thumbs.mjs.
// Нет манифеста (astro dev без сборки) — карточка показывает оригинал.
import fs from 'node:fs';
import path from 'node:path';

type Entry = { w: number; h: number; widths: number[] };
let manifest: Record<string, Entry> | null = null;

function load(): Record<string, Entry> {
  if (manifest) return manifest;
  try { manifest = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'portal/src/.thumbs.json'), 'utf8')); }
  catch { try { manifest = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/.thumbs.json'), 'utf8')); } catch { manifest = {}; } }
  return manifest!;
}

/** src/srcset/размеры для <img> обложки; без превью — оригинал. */
export function coverImage(cover: string) {
  const e = load()[cover];
  if (!e) return { src: cover, srcset: undefined, width: undefined, height: undefined };
  const base = cover.replace(/\.[a-z0-9]+$/i, '');
  const url = (w: number) => `/_t${base}-${w}.webp`;
  return {
    src: url(e.widths[0]),
    srcset: e.widths.map((w) => `${url(w)} ${w}w`).join(', '),
    width: e.w,
    height: e.h,
  };
}
