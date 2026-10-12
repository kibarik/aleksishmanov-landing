// Картинки в тексте материалов — как обложки карточек: webp-превью из /_t/ (scripts/portal-thumbs.mjs),
// srcset под колонку статьи (~700 px), ширина и высота (без сдвига вёрстки), ленивая загрузка.
// Первая картинка статьи часто на первом экране и становится LCP — её грузим сразу и с приоритетом.
// Нет манифеста (astro dev без сборки) или картинки в нём — остаётся оригинал.
import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';

const SIZES = '(max-width: 740px) calc(100vw - 40px), 700px';

function loadManifest() {
  for (const p of ['portal/src/.thumbs.json', 'src/.thumbs.json']) {
    try { return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), p), 'utf8')); } catch { /* следующий путь */ }
  }
  return {};
}

export function rehypeThumbs() {
  const manifest = loadManifest();
  return (tree) => {
    let first = true;
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const src = String(node.properties?.src || '');
      const e = manifest[src];
      const props = node.properties;
      props.decoding = 'async';
      if (first) { props.loading = 'eager'; props.fetchPriority = 'high'; first = false; }
      else props.loading = 'lazy';
      if (!e) return;
      const base = src.replace(/\.[a-z0-9]+$/i, '');
      const url = (w) => `/_t${base}-${w}.webp`;
      props.src = url(e.widths[Math.min(1, e.widths.length - 1)]);
      props.srcSet = e.widths.map((w) => `${url(w)} ${w}w`).join(', ');
      props.sizes = SIZES;
      props.width = e.w;
      props.height = e.h;
    });
  };
}
