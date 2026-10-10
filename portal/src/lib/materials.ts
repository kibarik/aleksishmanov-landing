// Доступ к материалам: все страницы берут списки отсюда, чтобы порядок, черновики и адреса были едины.
import { getCollection, type CollectionEntry } from 'astro:content';
import { SECTIONS, type CollectionName, type Direction } from './site';

export type Material = CollectionEntry<CollectionName> & { collection: CollectionName };

export const ALL: CollectionName[] = ['blog', 'reviews', 'tools', 'prompts', 'slides', 'cases'];

export function urlFor(m: { collection: CollectionName; id: string }): string {
  return `${SECTIONS[m.collection].path}${m.id}/`;
}

// пустая коллекция (кейсов пока нет) — без запроса, иначе Astro пишет предупреждение на каждой странице
const FILES = import.meta.glob('../content/*/*.md');
const hasFiles = (name: CollectionName) => Object.keys(FILES).some((f) => f.startsWith(`../content/${name}/`));

export async function list(name: CollectionName): Promise<Material[]> {
  if (!hasFiles(name)) return [];
  const items = (await getCollection(name, (e) => !e.data.draft)) as Material[];
  return items
    .map((e) => Object.assign(e, { collection: name }))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id));
}

export async function listAll(names: CollectionName[] = ALL): Promise<Material[]> {
  const parts = await Promise.all(names.map(list));
  return parts.flat().sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function byDirection(d: Direction, names: CollectionName[] = ALL): Promise<Material[]> {
  return (await listAll(names)).filter((m) => m.data.directions.includes(d));
}

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export function formatDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Время чтения по словам (200 слов в минуту), не меньше минуты. */
export function readingTime(body: string | undefined): number {
  return Math.max(1, Math.round((body || '').split(/\s+/).filter(Boolean).length / 200));
}

/** Разделы, у которых есть страницы материалов (презентации — готовые HTML в public/slides/). */
export const PAGED: CollectionName[] = ['blog', 'reviews', 'tools', 'prompts', 'cases'];
