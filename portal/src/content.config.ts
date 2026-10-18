// Схема материалов. Одна схема на все типы: агент, добавляющий материал, получает ошибку сборки,
// если забыл обязательное поле. Термины — CONTEXT.md (материал, тип, направление).
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const DIRECTIONS = ['startups', 'ai-in-business'] as const;

const material = z.object({
  title: z.string().min(3),
  description: z.string().min(10).max(320),
  date: z.coerce.date(),
  /** Направление: одно или оба (CONTEXT.md). */
  directions: z.array(z.enum(DIRECTIONS)).min(1).max(2),
  /** Откуда материал пришёл: teletype, telegram:<канал>, prompts, slides, site (написан на сайте). */
  source: z.string().default('site'),
  source_url: z.string().url().optional(),
  /** Где ещё опубликовано (дубли в каналах). */
  also_in: z.array(z.string()).default([]),
  /** Старые адреса: для каждого собирается страница-переадресация. */
  old_urls: z.array(z.string()).default([]),
  cover: z.string().optional(),
  /** Карточка инструмента: репозиторий. */
  repo: z.string().url().optional(),
  /** Промт: раздел каталога. */
  category: z.string().optional(),
  /** Презентация: число слайдов. */
  slides: z.number().optional(),
  /** Дата существенного обновления: идёт в dateModified и в подпись «обновлено». Только при правке содержания (docs/content/seo-geo.md). */
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  /** true — файл создан импортом и будет перезаписан повторным импортом; снять при ручной доработке. */
  imported: z.boolean().default(false),
});

const coll = (name: string) => defineCollection({ loader: glob({ pattern: '**/*.md', base: `./src/content/${name}` }), schema: material });

export const collections = {
  blog: coll('blog'),
  reviews: coll('reviews'),
  tools: coll('tools'),
  prompts: coll('prompts'),
  slides: coll('slides'),
  cases: coll('cases'),
};
