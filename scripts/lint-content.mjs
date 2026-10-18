#!/usr/bin/env node
/**
 * Проверка материалов по стандарту docs/content/article-standard.md.
 *
 *   node scripts/lint-content.mjs                 # статьи блога, написанные на сайте (imported: false) — ошибки валят запуск
 *   node scripts/lint-content.mjs --all           # все материалы блога, включая импортированные, — отчёт без падения
 *   node scripts/lint-content.mjs blog/<slug>.md  # один или несколько файлов
 *   --json                                        # машинный отчёт
 *
 * Ошибка (error) — материал нарушает обязательное правило и не публикуется. Предупреждение (warn) — повод для правки
 * на ревью. Пороги взяты из стандарта; меняются там же, а не здесь втихую.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'portal/src/content');
const SECTIONS = ['blog', 'reviews', 'tools', 'prompts', 'slides', 'cases'];

// Клише, по которым видно сгенерированный или канцелярский текст (стандарт, «Голос»).
export const BANNED = [
  'в современном мире', 'давайте разберёмся', 'давайте разберемся', 'ключ к успеху', 'важно понимать',
  'это не просто', 'эффективная стратегия', 'уникальная возможность', 'играет ключевую роль', 'в заключение',
  'таким образом, можно сказать', 'не секрет, что', 'революционн', 'в эпоху', 'погрузимся',
];

export const LIMITS = {
  title: [30, 70],
  description: [110, 170],
  lead: [25, 90], // слов в первом абзаце: ответ на главный вопрос
  words: 1200, // минимум для статьи (не короткой заметки)
  paragraphWords: 110,
  internalLinks: 3,
  faq: 3,
};

function parse(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (v === 'true' || v === 'false') v = v === 'true';
    fm[kv[1]] = v;
  }
  return { fm, body: m[2] };
}

/** Все адреса материалов сайта — чтобы проверить внутренние ссылки без сборки. */
function knownPaths() {
  const set = new Set(['/', '/about/', '/call/', '/startups/', '/ai-in-business/']);
  for (const s of SECTIONS) {
    set.add(`/${s}/`);
    const dir = path.join(CONTENT, s);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.md')) set.add(`/${s}/${f.slice(0, -3)}/`);
  }
  return set;
}

const words = (t) => t.replace(/```[\s\S]*?```/g, ' ').replace(/[|#>*_`\-]+/g, ' ').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;

export function lintFile(file, paths = knownPaths()) {
  const issues = [];
  const add = (level, rule, msg) => issues.push({ level, rule, msg });
  const parsed = parse(file);
  if (!parsed) return { file, issues: [{ level: 'error', rule: 'frontmatter', msg: 'нет шапки ---' }], stats: {} };
  const { fm, body } = parsed;
  const prose = body.replace(/```[\s\S]*?```/g, '');
  const title = fm.title || '';
  const desc = fm.description || '';
  const total = words(body);

  if (title.length < LIMITS.title[0] || title.length > LIMITS.title[1]) add('warn', 'title', `title ${title.length} знаков, норма ${LIMITS.title.join('–')}`);
  if (desc.length < LIMITS.description[0] || desc.length > LIMITS.description[1]) add('warn', 'description', `description ${desc.length} знаков, норма ${LIMITS.description.join('–')}`);
  if (/(…|\.\.\.)$/.test(desc)) add('error', 'description', 'description обрезан многоточием — это кусок текста, а не описание');
  if (/^#\s/m.test(prose)) add('error', 'h1', 'H1 в тексте: заголовок страницы берётся из title');

  // Лид: первый абзац до первого заголовка отвечает на главный вопрос.
  const first = prose.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('!['));
  const leadWords = first && !first.startsWith('#') ? words(first) : 0;
  if (!leadWords) add('error', 'lead', 'текст начинается с заголовка: нет лида');
  else if (leadWords < LIMITS.lead[0] || leadWords > LIMITS.lead[1]) add('warn', 'lead', `лид ${leadWords} слов, норма ${LIMITS.lead.join('–')}`);

  const h2 = [...prose.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  if (total >= LIMITS.words && h2.length < 4) add('warn', 'structure', `${h2.length} разделов ## на ${total} слов — текст сложно сканировать`);
  if (total < LIMITS.words) add('warn', 'length', `${total} слов: меньше ориентира для статьи (${LIMITS.words}); идеальной длины нет — для заметки это нормально`);

  const faqIdx = h2.findIndex((h) => /^Частые вопросы/i.test(h));
  if (faqIdx < 0) add('warn', 'faq', 'нет раздела «## Частые вопросы»');
  else {
    const faq = prose.split(/^##\s+Частые вопросы.*$/m)[1]?.split(/^##\s/m)[0] || '';
    const qs = [...faq.matchAll(/^###\s+(.+)$/gm)].map((m) => m[1].trim());
    if (qs.length < LIMITS.faq) add('warn', 'faq', `в «Частых вопросах» ${qs.length} вопросов, норма от ${LIMITS.faq}`);
    for (const q of qs) if (!q.endsWith('?')) add('warn', 'faq', `вопрос без «?»: ${q}`);
  }
  if (!h2.some((h) => /^Источники/i.test(h))) add('warn', 'sources', 'нет раздела «## Источники»');
  if (/\d+(?:[,.]\d+)?\s?%/.test(prose) && !/\]\(https?:\/\//.test(prose)) add('error', 'sources', 'есть проценты, но нет ни одной внешней ссылки на источник');

  const internal = [...body.matchAll(/\]\((\/[^)\s#]*)(?:#[^)]*)?\)/g)].map((m) => m[1]);
  const pages = internal.filter((h) => !/\.\w+$/.test(h));
  if (pages.length < LIMITS.internalLinks) add('warn', 'links', `${pages.length} внутренних ссылок, норма от ${LIMITS.internalLinks}`);
  for (const h of pages) {
    if (!h.endsWith('/')) add('error', 'links', `ссылка без слэша на конце: ${h}`);
    else if (!paths.has(h)) add('error', 'links', `битая внутренняя ссылка: ${h}`);
  }
  for (const h of internal.filter((x) => /^\/media\//.test(x))) {
    if (!fs.existsSync(path.join(ROOT, 'portal/public', h))) add('error', 'media', `нет файла ${h}`);
  }
  for (const m of body.matchAll(/!\[([^\]]*)\]\(/g)) if (!m[1].trim()) add('warn', 'alt', 'картинка без alt-текста');

  if (!/^\s*\|.+\|\s*$/m.test(prose) && !/^\s*(\d+\.|-|\*)\s/m.test(prose) && total >= LIMITS.words) add('warn', 'format', 'ни таблицы, ни списка: нечего унести в работу');
  for (const p of prose.split(/\n\s*\n/)) {
    const t = p.trim();
    if (!t || /^(#|\||-|\*|\d+\.|>|!\[)/.test(t)) continue;
    const n = words(t);
    if (n > LIMITS.paragraphWords) { add('warn', 'paragraph', `абзац ${n} слов: «${t.slice(0, 50)}…»`); }
  }
  const low = prose.toLowerCase();
  for (const b of BANNED) if (low.includes(b)) add('warn', 'voice', `клише «${b}»`);

  const internalLinks = pages.length;
  return { file, issues, stats: { title: title.length, description: desc.length, words: total, lead: leadWords, h2: h2.length, internalLinks, imported: fm.imported === true } };
}

function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const json = args.includes('--json');
  const explicit = args.filter((a) => !a.startsWith('--'));
  const paths = knownPaths();
  let files = explicit.length
    ? explicit.map((f) => (path.isAbsolute(f) ? f : fs.existsSync(f) ? path.resolve(f) : path.join(CONTENT, f)))
    : fs.readdirSync(path.join(CONTENT, 'blog')).filter((f) => f.endsWith('.md')).map((f) => path.join(CONTENT, 'blog', f));
  const results = files.map((f) => lintFile(f, paths)).filter((r) => explicit.length || all || !r.stats.imported);
  if (json) { console.log(JSON.stringify(results, null, 2)); }
  else {
    for (const r of results) {
      const e = r.issues.filter((i) => i.level === 'error').length;
      const w = r.issues.length - e;
      const s = r.stats;
      console.log(`${e ? '✗' : w ? '·' : '✓'} ${path.relative(CONTENT, r.file)} — ${s.words ?? '?'} слов, ошибок ${e}, замечаний ${w}`);
      for (const i of r.issues) console.log(`    ${i.level === 'error' ? 'ERROR' : 'warn '} [${i.rule}] ${i.msg}`);
    }
    const errors = results.reduce((n, r) => n + r.issues.filter((i) => i.level === 'error').length, 0);
    console.log(`\nматериалов: ${results.length}, ошибок: ${errors}`);
  }
  const failing = results.some((r) => !r.stats.imported && r.issues.some((i) => i.level === 'error'));
  process.exit(!all && failing ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
