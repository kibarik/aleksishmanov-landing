// Разметка schema.org (JSON-LD): Person на «Обо мне», Article на материалах, хлебные крошки.
import { SITE, PROFILES } from './site';

export const person = {
  '@type': 'Person',
  '@id': `${SITE.url}/#person`,
  name: SITE.name,
  alternateName: ['Aleks Ishmanov', 'Алекс Ишманов', 'Alexey Ishmanov'],
  url: `${SITE.url}/`,
  description: SITE.positioning,
  jobTitle: 'Product Owner, AI/ML-платформы',
  image: `${SITE.url}/fallback/white-desktop.webp`,
  sameAs: PROFILES.map((p) => p.href),
  knowsAbout: ['Запуск технологических продуктов', 'Product management', 'ИИ-агенты', 'LLM', 'Внедрение ИИ в корпоративные процессы'],
};

export function article(opts: { title: string; description: string; url: string; date: Date; image?: string; section: string }) {
  return {
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    mainEntityOfPage: opts.url,
    datePublished: opts.date.toISOString(),
    articleSection: opts.section,
    inLanguage: 'ru',
    author: { '@id': `${SITE.url}/#person`, '@type': 'Person', name: SITE.name, url: `${SITE.url}/about/` },
    publisher: { '@id': `${SITE.url}/#person` },
    ...(opts.image ? { image: new URL(opts.image, SITE.url).toString() } : {}),
  };
}

export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: new URL(it.url, SITE.url).toString() })),
  };
}

export const graph = (...nodes: object[]) => JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
