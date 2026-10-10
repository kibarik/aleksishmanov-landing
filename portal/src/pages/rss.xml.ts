import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { listAll, urlFor } from '../lib/materials';
import { SITE } from '../lib/site';

export async function GET(context: APIContext) {
  const items = (await listAll(['blog', 'reviews', 'tools', 'cases', 'slides'])).slice(0, 60);
  return rss({
    title: `${SITE.name}: новые материалы`,
    description: SITE.positioning,
    site: context.site!,
    items: items.map((m) => ({ title: m.data.title, description: m.data.description, pubDate: m.data.date, link: urlFor(m) })),
    customData: '<language>ru</language>',
  });
}
