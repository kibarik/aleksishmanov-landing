// Markdown-копия каждого материала (/blog/<slug>.md): для ИИ-поисковиков и агентов, см. /llms.txt.
import type { APIRoute } from 'astro';
import { PAGED, list, urlFor, formatDate, type Material } from '../../lib/materials';
import { SITE, SECTIONS, type CollectionName } from '../../lib/site';
import { caseFactsMarkdown } from '../../lib/cases.mjs';

export async function getStaticPaths() {
  const all = (await Promise.all(PAGED.map(list))).flat();
  return all.map((m) => ({ params: { section: m.collection, slug: m.id }, props: { m } }));
}

export const GET: APIRoute = ({ props }) => {
  const m = (props as { m: Material }).m;
  const facts = m.collection === 'cases' ? `${caseFactsMarkdown(m.data)}\n\n` : '';
  const text = `# ${m.data.title}\n\n> ${m.data.description}\n\n${SECTIONS[m.collection].one} · ${SITE.name} · ${formatDate(m.data.date)} · ${SITE.url}${urlFor(m)}\n\n${facts}${(m.body || '').trim()}\n`;
  return new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
