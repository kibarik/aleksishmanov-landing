// llms.txt (llmstxt.org): карта сайта для ИИ-поисковиков и агентов — кто автор, разделы, все материалы.
import { listAll, urlFor } from '../lib/materials';
import { SITE, SECTIONS, DIRECTION_INFO, PROFILES, type CollectionName } from '../lib/site';

export async function GET() {
  const all = await listAll();
  const lines = [
    `# ${SITE.name}`, '',
    `> ${SITE.positioning}. Личный сайт: статьи, разборы инструментов, карточки open source, промты и презентации практикумов. Язык — русский.`, '',
    'Каждый материал доступен как HTML и как Markdown: добавьте `.md` к адресу без завершающего слэша (например, `/blog/bullseye-framework.md`). Полный текст всех статей и разборов — `/llms-full.txt`.', '',
    '## Направления', '',
    ...Object.values(DIRECTION_INFO).map((d) => `- [${d.title}](${SITE.url}${d.path}): ${d.lead}`), '',
    '## Об авторе', '',
    `- [Обо мне](${SITE.url}/about/): кто такой ${SITE.name}, опыт и профили`,
    ...PROFILES.map((p) => `- [${p.label}](${p.href})`), '',
  ];
  for (const c of ['blog', 'reviews', 'tools', 'prompts', 'slides', 'cases'] as CollectionName[]) {
    const items = all.filter((m) => m.collection === c);
    if (!items.length) continue;
    lines.push(`## ${SECTIONS[c].title}`, '', `${SECTIONS[c].lead}`, '');
    for (const m of items) {
      const md = c === 'slides' ? `${SITE.url}${urlFor(m)}` : `${SITE.url}${SECTIONS[c].path}${m.id}.md`;
      lines.push(`- [${m.data.title}](${md}): ${m.data.description}`);
    }
    lines.push('');
  }
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
