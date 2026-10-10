/**
 * Мост лендинга и портала (Vite-плагин главной):
 *  - первым в <head> — скрипт редиректа со старых доменов (shared/host-redirect.js, как во всех страницах портала);
 *  - разметка Person (JSON-LD) для поиска по имени;
 *  - при сборке секции главной рендерятся в HTML (тем же renderSections, что и в браузере):
 *    поисковик видит текст и ссылки на разделы без выполнения JS.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://aleksishmanov.ru';

const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE}/#person`,
  name: 'Алексей Ишманов',
  alternateName: ['Aleks Ishmanov', 'Алекс Ишманов', 'Alexey Ishmanov'],
  url: `${SITE}/`,
  description: 'Запускаю сложные технологические продукты за недели и внедряю ИИ в корпоративные процессы',
  jobTitle: 'Product Owner, AI/ML-платформы',
  image: `${SITE}/fallback/white-desktop.webp`,
  sameAs: ['https://t.me/corporate_ai', 'https://t.me/ai_pmf', 'https://t.me/ai_ossresearch', 'https://t.me/ai_prodresearch', 'https://www.threads.com/@ishmanov_aleks', 'https://github.com/kibarik'],
};

/** Свежие материалы портала для главной: читаем шапки Markdown, без сборки Astro. */
export function latestMaterials(limit = 6) {
  // на главную — статьи, разборы и кейсы: короткие карточки инструментов живут в своём разделе
  const SECTIONS = { blog: ['/blog/', 'Статья'], reviews: ['/reviews/', 'Разбор'], cases: ['/cases/', 'Кейс'] };
  const out = [];
  for (const [c, [base, type]] of Object.entries(SECTIONS)) {
    const dir = path.join(ROOT, 'portal', 'src', 'content', c);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      const head = fs.readFileSync(path.join(dir, f), 'utf8').split(/^---$/m)[1] || '';
      const get = (k) => { const m = head.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')); if (!m) return ''; try { return JSON.parse(m[1]); } catch { return m[1].replace(/^['"]|['"]$/g, ''); } };
      if (get('draft') === true) continue;
      out.push({ title: get('title'), href: `${base}${f.replace(/\.md$/, '')}/`, type, date: String(get('date')) });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export function portalBridge() {
  const hostScript = fs.readFileSync(path.join(ROOT, 'shared', 'host-redirect.js'), 'utf8');
  return {
    name: 'aleks-portal-bridge',
    async transformIndexHtml(html, ctx) {
      let out = html.replace(/<meta charset="UTF-8" \/>/i, (m) => `${m}\n  <script>${hostScript}</script>`);
      const latest = latestMaterials();
      out = out.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(person)}</script>\n  <script>window.__latestMaterials = ${JSON.stringify(latest).replace(/</g, '\\u003c')};</script>\n</head>`);
      if (!ctx.server) {
        // сборка: секции в HTML; в браузере их же перерисует mountSections — разметка совпадает
        const bust = `?t=${Date.now()}`;
        const { content } = await import(pathToFileURL(path.join(ROOT, 'src', 'content.js')).href + bust);
        const sections = await import(pathToFileURL(path.join(ROOT, 'src', 'sections.js')).href + bust);
        const markup = sections.renderSections(content, { latest });
        out = out.replace(/<main class="content" id="content">\s*<\/main>/, `<main class="content" id="content">${markup}</main>`);
      }
      return out;
    },
  };
}
