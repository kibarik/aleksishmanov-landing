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

/** Узел методологии (ADR 0006): проблема → области → темы. Связь с материалами хранится в узле (`materials`). */
/** Узел диаграммы процесса: шаг (кто делает — who), развилка с вариантами, гейт, начало или конец. */
const flowNode = z.object({
  title: z.string(),
  kind: z.enum(['start', 'step', 'fork', 'gate', 'end']).default('step'),
  who: z.enum(['po', 'agent', 'team', 'business']).optional(),
  step: z.number().optional(),
  /** 1–3 предложения: описание узла под диаграммой. */
  text: z.string().optional(),
  options: z.array(z.string()).default([]),
});

const methodNode = z.object({
  title: z.string().min(3),
  /** Ключевой вопрос, на который отвечает узел. */
  question: z.string().min(10),
  description: z.string().min(10).max(320),
  level: z.enum(['problem', 'area', 'topic']),
  /** slug родителя; у корня — пусто. */
  parent: z.string().optional(),
  order: z.number().default(100),
  /** ready — содержательная страница; draft — каркас с материалами; planned — только на карте, без страницы. */
  status: z.enum(['ready', 'draft', 'planned']).default('draft'),
  /** Прикреплённые материалы: «<раздел>/<slug>». */
  materials: z.array(z.string()).default([]),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  /** Место области в процессе (ADR 0006): стадия потока, ответвление или основание под всеми стадиями. */
  role: z.enum(['stage', 'branch', 'foundation']).optional(),
  /** Номер стадии на сквозной диаграмме. */
  stage: z.number().optional(),
  /** Короткое имя для диаграмм: «Вход», «Решение». */
  short: z.string().optional(),
  /** Абзац «Общий каркас процесса» над диаграммой. */
  summary: z.string().optional(),
  /** Диаграмма процесса узла: узлы слева направо. step — номер шага, он связывает узел с разделом «## Шаг N. …». */
  flow: z.array(flowNode).default([]),
  /** Гейт на выходе стадии: когда стадия пройдена. */
  gate: z.object({ title: z.string(), criteria: z.array(z.string()).default([]) }).optional(),
});

export const collections = {
  method: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/method' }), schema: methodNode }),
  blog: coll('blog'),
  reviews: coll('reviews'),
  tools: coll('tools'),
  prompts: coll('prompts'),
  slides: coll('slides'),
  cases: coll('cases'),
};
