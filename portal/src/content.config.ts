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

const coll = <S extends z.ZodTypeAny = typeof material>(name: string, schema?: S) =>
  defineCollection({ loader: glob({ pattern: '**/*.md', base: `./src/content/${name}` }), schema: (schema ?? material) as S });

/**
 * Кейс (CONTEXT.md, «Кейс»): материал + поля слайда стопки на /cases/. Порядок чтения слайда — результат,
 * цифры, визуал, контекст, роль, шаги, стек (.scratch/about-cases/research/case-slide-and-stack.md, 1.3–1.5).
 * Лимиты длины держат раскладку: заголовок длиннее 90 знаков не влезает в три строки слайда 16:9.
 * Тело Markdown — полная история кейса на его странице.
 */
const caseMaterial = material.extend({
  /** Заголовок-результат: законченная фраза с числом, а не название проекта. */
  title: z.string().min(10).max(90),
  /** Для кого и какая проблема — одна строка. */
  context: z.string().min(10).max(140),
  /** Роль в запуске. */
  role: z.string().min(3).max(60),
  /** Тип продукта для подписи слайда: «B2B-платформа», «маркетплейс». */
  kind: z.string().min(3).max(30),
  /** Годы; без `to` — «сейчас». */
  years: z.object({ from: z.number().int().min(2000), to: z.number().int().min(2000).optional() }),
  /** 2–3 метрики: значение цифрами и подпись в 3–5 слов. */
  metrics: z.array(z.object({ value: z.string().min(1).max(12), label: z.string().min(3).max(40) })).min(2).max(3),
  /** 3–5 шагов, по строке. */
  steps: z.array(z.string().min(3).max(80)).min(3).max(5),
  stack: z.array(z.string()).max(8).default([]),
  /** Подпись к скриншоту (cover): без неё картинка — только украшение для скринридера. */
  coverAlt: z.string().min(5).optional(),
  /** Цвет подложки-тени и цифр слайда. */
  tone: z.string().regex(/^#[0-9a-f]{6}$/i).default('#2b3cf0'),
  /** Место в стопке: меньше — ближе к началу. */
  order: z.number().int().default(100),
}).refine((c) => !c.cover || c.coverAlt, { message: 'у кейса со скриншотом (cover) нужна подпись coverAlt', path: ['coverAlt'] });

/** Узел методологии (ADR 0006): проблема → области → темы. Связь с материалами хранится в узле (`materials`). */
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
});

export const collections = {
  method: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/method' }), schema: methodNode }),
  blog: coll('blog'),
  reviews: coll('reviews'),
  tools: coll('tools'),
  prompts: coll('prompts'),
  slides: coll('slides'),
  cases: coll('cases', caseMaterial),
};
