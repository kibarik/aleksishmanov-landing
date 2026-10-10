#!/usr/bin/env node
/**
 * Импорт материалов в портал: блог Teletype, три Telegram-канала, промты, презентации, страница звонка.
 *
 *   node tools/import-sources.mjs --sources ../sources [--dry]
 *
 * Источник — снимок, скачанный tools/fetch_sources.py (репозиторий-сборщик вне сайта).
 * Результат: portal/src/content/<коллекция>/<slug>.md, картинки в portal/public/media/,
 * презентации в portal/public/slides/, отчёт portal/import-report.md.
 * После импорта Markdown в репозитории — источник истины: правки делаются в нём, повторный импорт
 * не перезаписывает файл, если в нём нет строки `imported: true` (её снимают при ручной доработке).
 * Правила (дубли, отсев, направления) — по образцу aleks-catalog/catalog/build.py.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTAL = path.join(ROOT, 'portal');
const CONTENT = path.join(PORTAL, 'src', 'content');
const PUBLIC = path.join(PORTAL, 'public');

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const SRC = path.resolve(arg('--sources') || path.join(ROOT, '..', 'sources'));
const DRY = args.includes('--dry');
if (!fs.existsSync(SRC)) { console.error(`нет каталога источников: ${SRC}`); process.exit(1); }

const CHANNELS = ['corporate_ai', 'ai_pmf', 'ai_ossresearch'];
const CODE_HOSTS = ['github.com', 'gitlab.com', 'codeberg.org', 'huggingface.co'];
const AI_WORDS = /(^|[^\p{L}])(ии|ai|llm|gpt|claude|агент\p{L}*|нейро\p{L}*|промпт\p{L}*|промт\p{L}*|rag|sgr|ml|mcp)(?=[^\p{L}]|$)/iu;
const STARTUP_WORDS = /(стартап|mvp|pmf|монетизац|запуск|unit-эконом|юнит-эконом|гипотез|трафик|воронк|продаж|retention|aarrr|основател|фаундер)/iu;
const MIN_BODY = 120;
const SIM_LIMIT = 0.9;

// ---------- утилиты ----------

const TRANSLIT = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };

export function slugify(text, max = 64) {
  const lat = [...String(text).toLowerCase()].map((ch) => TRANSLIT[ch] ?? ch).join('');
  let s = lat.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (s.length > max) s = s.slice(0, max).replace(/-[^-]*$/, '');
  return s || 'post';
}

/** Заголовок без эмодзи, звёздочек и хвостовой точки. */
export function cleanTitle(t) {
  return String(t || '')
    .replace(/\*\*|__|`/g, '')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([:;,.!?])/g, '$1')
    .trim()
    .replace(/[.:;,]+$/, '');
}

/** Чистый текст из Markdown для description: без ссылок, картинок и разметки. */
export function plain(md) {
  return String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_`#>|]/g, ' ')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function describe(md, max = 180) {
  const p = plain(md);
  if (p.length <= max) return p;
  const cut = p.slice(0, max);
  const dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return dot > 80 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

/**
 * Заголовок поста Telegram: первая строка, если короткая; иначе первое предложение или часть до двоеточия
 * и тире; пост, который начинается голой ссылкой на репозиторий, называется именем репозитория.
 */
export function postTitle(body, fetched = '') {
  const lines = String(body).split('\n').map((l) => l.trim()).filter(Boolean);
  let first = lines[0] || '';
  const bare = first.match(/^<?(https?:\/\/\S+?)>?$/);
  if (bare) {
    // ссылка на репозиторий — «владелец/репозиторий», как на GitHub; любая другая голая ссылка — заголовком станет следующая строка
    const url = bare[1].replace(/[?#].*$/, '').replace(/\/+$/, '');
    const seg = url.split('/').pop() || '';
    const parts = url.split('/');
    if (CODE_HOSTS.includes(hostOf(url)) && parts.length >= 5 && seg) return `${parts[3]}/${parts[4]}`;
    first = lines[1] || '';
    if (!first) return shorten(cleanTitle(fetched));
  }
  const line = cleanTitle(plain(first)) || cleanTitle(fetched);
  return shorten(line.length >= cleanTitle(fetched).length ? line : cleanTitle(fetched));
}

export function shorten(t, max = 90) {
  if (t.length <= max) return t;
  let best = -1;
  for (const sep of ['. ', ': ', ' — ', ' – ', ' - ', '? ', '! ']) {
    const i = t.indexOf(sep);
    if (i >= 15 && i <= max && (best < 0 || i < best)) best = i + (sep.startsWith('?') || sep.startsWith('!') ? 1 : 0);
  }
  if (best > 0) return t.slice(0, best).replace(/[.:,;\s—–-]+$/, '');
  // запасной разрыв — запятая или скобка ближе к концу лимита
  const soft = Math.max(t.lastIndexOf(', ', max), t.lastIndexOf(' (', max));
  if (soft >= 30) return t.slice(0, soft);
  return t.slice(0, max - 10).replace(/\s+\S*$/, '') + '…';
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const isTelegram = (u) => ['t.me', 'telegram.me'].includes(hostOf(u));
/** Ссылка без меток и якоря: utm-хвосты отбрасываем, остальной запрос — часть адреса (YouTube ?v=). */
export const canon = (u) => {
  try {
    const x = new URL(u.replace(/&amp;/g, '&'));
    x.hash = '';
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|pp$|feature$|tab$|si$)/.test(k)) x.searchParams.delete(k);
    x.hostname = x.hostname.replace(/^www\./, '');
    return x.toString().replace(/\/$/, '').replace(/\/\?/, '?');
  } catch { return u; }
};

function norm(text) {
  return plain(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').slice(0, 300);
}

/** Похожесть строк (коэффициент Дайса по биграммам) — замена difflib.SequenceMatcher. */
export function similarity(a, b) {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const grams = new Map();
  for (let i = 0; i < a.length - 1; i++) { const g = a.slice(i, i + 2); grams.set(g, (grams.get(g) || 0) + 1); }
  let hit = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const g = b.slice(i, i + 2); const n = grams.get(g);
    if (n) { hit++; grams.set(g, n - 1); }
  }
  return (2 * hit) / (a.length + b.length - 2);
}

const yamlStr = (v) => JSON.stringify(v);
function frontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || (Array.isArray(v) && !v.length && k !== 'directions')) continue;
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(yamlStr).join(', ')}]`);
    else if (typeof v === 'boolean' || typeof v === 'number') lines.push(`${k}: ${v}`);
    else lines.push(`${k}: ${yamlStr(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

function readFm(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: txt };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (!mm) continue;
    try { meta[mm[1]] = JSON.parse(mm[2]); } catch { meta[mm[1]] = mm[2]; }
  }
  return { meta, body: m[2] };
}

const report = { written: {}, kept: {}, skipped: [], merged: [], notes: [] };
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

function writeFile(file, data) {
  if (DRY) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

function copyFile(from, to) {
  if (DRY || !fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return true;
}

/** Не трогаем материал, который уже доработали руками (нет флага imported: true). */
function writeMaterial(collection, slug, meta, body) {
  const file = path.join(CONTENT, collection, `${slug}.md`);
  if (fs.existsSync(file) && readFm(file).meta.imported !== true) { bump(report.kept, collection); return; }
  writeFile(file, frontmatter({ ...meta, imported: true }) + body.trim() + '\n');
  bump(report.written, collection);
}

function directionsFor(source, text, title) {
  const ai = AI_WORDS.test(text);
  const st = STARTUP_WORDS.test(text);
  const aiT = AI_WORDS.test(title);
  const stT = STARTUP_WORDS.test(title);
  const d = new Set();
  if (source === 'telegram:corporate_ai') { d.add('ai-in-business'); if (stT) d.add('startups'); }
  else if (source === 'telegram:ai_pmf' || source === 'teletype') { d.add('startups'); if (aiT || (ai && !st)) d.add('ai-in-business'); }
  else { d.add(ai ? 'ai-in-business' : 'startups'); if (ai && stT) d.add('startups'); }
  return [...d];
}

// ---------- сбор ----------

function loadTeletype() {
  const dir = path.join(SRC, 'blog-teletype', 'articles');
  const index = JSON.parse(fs.readFileSync(path.join(SRC, 'blog-teletype', 'index.json'), 'utf8'));
  const out = [];
  for (const a of index) {
    const file = path.join(dir, a.slug, 'article.md');
    if (!fs.existsSync(file)) { report.notes.push(`Teletype: нет текста ${a.slug}`); continue; }
    const { meta, body } = readFm(file);
    out.push({
      source: 'teletype', sid: a.slug, url: a.url, date: meta.date || a.date,
      title: cleanTitle(meta.title || a.title), body, links: [...body.matchAll(/\]\((https?:[^)\s]+)\)/g)].map((m) => m[1]),
      mediaDir: path.join(dir, a.slug),
    });
  }
  return out;
}

function loadTelegram() {
  const out = [];
  for (const ch of CHANNELS) {
    const file = path.join(SRC, 'telegram', ch, 'posts.jsonl');
    for (const line of fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
      const d = JSON.parse(line);
      out.push({
        source: d.source, sid: d.sid, url: d.url, date: d.date, kind: d.kind,
        title: postTitle(d.body_md || '', d.title), body: d.body_md || '', links: d.links || [],
        media: (d.local_media || []).map((m) => path.join(SRC, 'telegram', ch, m)),
      });
    }
  }
  return out;
}

function skipReason(it) {
  const body = it.body.trim();
  if (!body) return 'пусто';
  if (/^channel (created|photo|name)/i.test(body)) return 'служебный пост';
  if (it.kind === 'forward' && body.length < 400) return 'пересылка без своего текста';
  const textOnly = body.replace(/https?:\/\/\S+/g, '').trim();
  if (it.links.length && it.links.every(isTelegram) && textOnly.length < MIN_BODY) return 'только ссылки на Telegram';
  if (body.length < MIN_BODY && !it.links.length) return 'слишком коротко';
  return '';
}

/** Ссылка на статью блога из поста: такой пост — анонс статьи, он сливается с ней. */
function blogSlugIn(it, blogSlugs) {
  for (const u of it.links) {
    const h = hostOf(u);
    let p = '';
    try { p = decodeURIComponent(new URL(u).pathname); } catch { continue; }
    if (h === 'blog.aleksishmanov.ru' || h === 'aleksishmanov.ru') p = p.replace(/^\//, '');
    else if (h === 'teletype.in') p = p.replace(/^\/@aleksishmanov\//, '');
    else continue;
    p = p.replace(/\/$/, '');
    if (blogSlugs.has(p)) return p;
  }
  return '';
}

function primaryLink(it) {
  for (const u of it.links) {
    if (isTelegram(u)) continue;
    const h = hostOf(u);
    if (['blog.aleksishmanov.ru', 'aleksishmanov.ru', 'teletype.in', 'threads.com', 'threads.net'].includes(h)) continue;
    const c = canon(u);
    if (/^https?:\/\/[^/]+\/.+/.test(c)) return c;
  }
  return '';
}

/** Два поста об одном: похожие заголовки или тексты (для склейки по общей ссылке). */
export function isSameStory(a, b) {
  const ta = cleanTitle(a.title).toLowerCase();
  const tb = cleanTitle(b.title).toLowerCase();
  return similarity(ta, tb) > 0.6 || similarity(norm(a.body), norm(b.body)) > 0.5;
}

// ---------- тела материалов ----------

/** Убираем первую строку-заголовок поста: заголовок уйдёт в H1 страницы. */
function stripLeadTitle(body, title) {
  const lines = body.split('\n');
  const first = cleanTitle(plain(lines[0] || ''));
  const t = cleanTitle(plain(title || ''));
  if (first && t && (first === t || t.startsWith(first) || first.startsWith(t))) return lines.slice(1).join('\n').trim();
  return body.trim();
}

function telegramBody(it, collection, slug) {
  let body = stripLeadTitle(it.body, it.title);
  const imgs = [];
  for (const m of it.media || []) {
    const name = path.basename(m);
    if (copyFile(m, path.join(PUBLIC, 'media', collection, slug, name)) || DRY) imgs.push(`/media/${collection}/${slug}/${name}`);
  }
  if (imgs.length) body = `${imgs.map((u) => `![](${u})`).join('\n\n')}\n\n${body}`;
  return { body, cover: imgs[0] };
}

function teletypeBody(it) {
  let cover;
  const body = it.body.replace(/!\[([^\]]*)\]\((images\/[^)\s]+)\)/g, (_, alt, rel) => {
    const name = path.basename(rel);
    copyFile(path.join(it.mediaDir, rel), path.join(PUBLIC, 'media', 'blog', it.sid.toLowerCase(), name));
    const url = `/media/blog/${it.sid.toLowerCase()}/${name}`;
    cover ??= url;
    return `![${alt}](${url})`;
  });
  return { body, cover };
}

// ---------- промты ----------

const PROMPT_DIRECTIONS = {
  'MBTI консультанты': ['startups'],
  'Product Discovery': ['startups', 'ai-in-business'],
  'Аналитика и документация': ['ai-in-business', 'startups'],
  'Генерация контента': ['ai-in-business'],
  'Конвертер': ['ai-in-business'],
  'Маркетинговая стратегия': ['startups'],
  'Продуктовые фреймворки': ['startups', 'ai-in-business'],
  'Трафик': ['startups'],
};

function importPrompts() {
  const dir = path.join(SRC, 'prompts-md');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) {
    const slug = f.replace(/\.md$/, '');
    const { meta, body } = readFm(path.join(dir, f));
    const lines = body.split('\n').map((l) => l.trim());
    const category = lines.find(Boolean) || 'Промты';
    const title = cleanTitle((body.match(/^##\s+(.+)$/m) || [])[1] || String(meta.title).split(' — ')[0]);
    const code = (body.match(/```[^\n]*\n([\s\S]*?)```/) || [])[1];
    if (!code) { report.skipped.push(`prompts/${slug}: нет текста промта`); continue; }
    const prompt = code.replace(/\s+$/, '');
    writeMaterial('prompts', slug, {
      title,
      description: `Промт «${title}» из раздела «${category}»: ${describe(prompt, 140)}`,
      // даты у промтов нет: берём запуск prompts.aleksishmanov.ru (первый сертификат домена — 2026-05-17)
      date: '2026-05-17',
      category,
      directions: PROMPT_DIRECTIONS[category] || ['ai-in-business'],
      source: 'prompts',
      source_url: meta.url,
    }, `\`\`\`text\n${prompt}\n\`\`\``);
  }
}

// ---------- презентации и страница звонка ----------

const SLIDE_REWRITES = [
  [/https:\/\/slides\.aleksishmanov\.ru\/?/g, 'https://aleksishmanov.ru/slides/'],
  // абсолютные пути каталога (в атрибутах, строках JS и url() CSS) — под /slides/
  [/(["'(])\/(okr-quarter-planning|po-workspace-bft-plugin|sprint-under-manager|claude-desktop-zai-macos|instructions|i|components)\//g, '$1/slides/$2/'],
];

function copyTree(from, to, rewrite) {
  if (DRY) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(a, b, rewrite);
    else {
      fs.mkdirSync(path.dirname(b), { recursive: true });
      if (rewrite && /\.(html|js|css|json|md)$/.test(entry.name)) {
        let txt = fs.readFileSync(a, 'utf8');
        for (const [re, to2] of SLIDE_REWRITES) txt = txt.replace(re, to2);
        fs.writeFileSync(b, txt);
      } else fs.copyFileSync(a, b);
    }
  }
}

function importSlides() {
  const dir = path.join(SRC, 'slides-catalog');
  const js = fs.readFileSync(path.join(dir, 'catalog.js'), 'utf8');
  const arr = js.match(/const presentations = (\[[\s\S]*?\n\]);/);
  if (!arr) throw new Error('slides-catalog/catalog.js: не нашёл список presentations');
  const decks = Function(`return ${arr[1]}`)();
  const MONTHS = { января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6, июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12 };
  for (const d of decks) {
    const [day, mon, year] = d.updated.split(' ');
    const date = `${year}-${String(MONTHS[mon]).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    copyTree(path.join(dir, d.id), path.join(PUBLIC, 'slides', d.id), true);
    writeMaterial('slides', d.id, {
      title: d.title, description: d.description, date, slides: d.slides,
      cover: `/slides/${d.cover}`,
      directions: ['ai-in-business'],
      source: 'slides', source_url: `https://slides.aleksishmanov.ru/${d.id}/`,
    }, d.description);
  }
  for (const extra of ['instructions', 'i', 'components']) copyTree(path.join(dir, extra), path.join(PUBLIC, 'slides', extra), true);
  copyFile(path.join(dir, 'og-cover.png'), path.join(PUBLIC, 'slides', 'og-cover.png'));
  copyFile(path.join(dir, 'favicon.svg'), path.join(PUBLIC, 'favicon.svg'));
}

// ---------- главный проход ----------

function main() {
  const teletype = loadTeletype();
  const blogSlugs = new Set(teletype.map((t) => t.sid));
  const telegram = loadTelegram();

  const kept = [];
  const announces = new Map(); // slug статьи -> ссылки на посты-анонсы
  for (const it of telegram) {
    const reason = skipReason(it);
    if (reason) { report.skipped.push(`${it.url}: ${reason}`); continue; }
    const slug = blogSlugIn(it, blogSlugs);
    if (slug && it.body.length < 2500) {
      if (!announces.has(slug)) announces.set(slug, []);
      announces.get(slug).push(it.url);
      report.merged.push(`${it.url} → анонс статьи /blog/${slug}/`);
      continue;
    }
    kept.push(it);
  }

  // дубли между каналами: одна главная внешняя ссылка или похожий текст; побеждает более длинный
  const order = [...kept].sort((a, b) => b.body.length - a.body.length || String(a.date).localeCompare(String(b.date)));
  const winners = [];
  const byLink = new Map();
  const also = new Map();
  for (const it of order) {
    const link = primaryLink(it);
    const n = norm(it.body);
    // общая ссылка — дубль, только если похожи и сами посты: подборка со многими ссылками — не дубль
    let dup = link ? byLink.get(link) : undefined;
    if (dup && !isSameStory(dup, it)) dup = undefined;
    if (!dup && n) dup = winners.find((w) => Math.abs(w.n.length - n.length) <= 0.5 * Math.max(w.n.length, n.length) && similarity(w.n, n) > SIM_LIMIT);
    if (dup) {
      if (!also.has(dup)) also.set(dup, []);
      also.get(dup).push(it.url);
      report.merged.push(`${it.url} → дубль ${dup.url}`);
      continue;
    }
    it.n = n;
    winners.push(it);
    if (link) byLink.set(link, it);
  }

  // статьи блога
  for (const t of teletype) {
    const { body, cover } = teletypeBody(t);
    const text = `${t.title}\n${t.body}`;
    // адреса сайта — в нижнем регистре (так их отдаёт Astro); старый адрес Teletype сохраняет регистр
    writeMaterial('blog', t.sid.toLowerCase(), {
      title: t.title,
      description: describe(body),
      date: t.date,
      directions: directionsFor('teletype', text, t.title),
      source: 'teletype',
      source_url: t.url,
      also_in: announces.get(t.sid) || [],
      old_urls: [`https://blog.aleksishmanov.ru/${t.sid}`, `https://teletype.in/@aleksishmanov/${t.sid}`],
      cover,
    }, body);
  }

  // посты Telegram: инструменты, разборы, статьи
  const used = new Set(teletype.map((t) => `blog/${t.sid.toLowerCase()}`));
  for (const it of winners.sort((a, b) => String(a.date).localeCompare(String(b.date)))) {
    const hasCode = it.links.some((u) => CODE_HOSTS.includes(hostOf(u)));
    const collection = it.source === 'telegram:ai_ossresearch' ? 'tools' : hasCode ? 'reviews' : 'blog';
    const title = it.title || describe(it.body, 70);
    // пост из одного заголовка и ссылки — указатель, а не материал
    if (plain(stripLeadTitle(it.body, title)).length < 60 && !(it.media || []).length) {
      report.skipped.push(`${it.url}: только заголовок и ссылка`);
      continue;
    }
    let slug = slugify(title);
    for (let n = 2; used.has(`${collection}/${slug}`); n++) slug = `${slugify(title)}-${n}`;
    used.add(`${collection}/${slug}`);
    const { body, cover } = telegramBody(it, collection, slug);
    const text = `${title}\n${it.body}`;
    const repo = it.links.find((u) => CODE_HOSTS.includes(hostOf(u)));
    writeMaterial(collection, slug, {
      title,
      description: describe(body),
      date: it.date,
      directions: directionsFor(it.source, text, title),
      source: it.source,
      source_url: it.url,
      also_in: also.get(it) || [],
      repo: collection === 'tools' ? repo : undefined,
      cover,
    }, body);
  }

  importPrompts();
  importSlides();

  const lines = ['# Отчёт импорта', '', `Источник: \`${path.relative(ROOT, SRC)}\`, ${new Date().toISOString().slice(0, 10)}.`, '',
    '| Коллекция | записано | оставлено (доработано вручную) |', '|---|---|---|',
    ...[...new Set([...Object.keys(report.written), ...Object.keys(report.kept)])].sort().map((c) => `| ${c} | ${report.written[c] || 0} | ${report.kept[c] || 0} |`),
    '', `## Слито (${report.merged.length})`, '', ...report.merged.map((m) => `- ${m}`),
    '', `## Отсеяно (${report.skipped.length})`, '', ...report.skipped.map((m) => `- ${m}`),
    '', '## Заметки', '', ...(report.notes.length ? report.notes.map((m) => `- ${m}`) : ['- нет']), ''];
  writeFile(path.join(PORTAL, 'import-report.md'), lines.join('\n'));
  console.log(lines.slice(0, 12 + Object.keys(report.written).length).join('\n'));
  console.log(`слито: ${report.merged.length}, отсеяно: ${report.skipped.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
