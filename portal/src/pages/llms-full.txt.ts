// Полный текст статей, разборов и кейсов одним файлом — для ИИ-ассистентов (llmstxt.org).
import { listAll, urlFor, formatDate } from '../lib/materials';
import { SITE, SECTIONS } from '../lib/site';

export async function GET() {
  const all = await listAll(['cases', 'reviews', 'blog']);
  const parts = [`# ${SITE.name} — полные тексты\n\n> ${SITE.positioning}.\n`];
  for (const m of all) {
    parts.push(`\n---\n\n## ${m.data.title}\n\n${SECTIONS[m.collection].one} · ${formatDate(m.data.date)} · ${SITE.url}${urlFor(m)}\n\n${(m.body || '').trim()}\n`);
  }
  return new Response(parts.join(''), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
