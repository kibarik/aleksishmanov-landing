// Всё, что знает сайт о себе: имя, позиционирование, разделы, направления, профили.
// Тексты меняются здесь, страницы читают отсюда.
export const SITE = {
  url: 'https://aleksishmanov.ru',
  name: 'Алексей Ишманов',
  brand: 'ISHMANOV',
  /** Позиционирование: одна фраза (рабочая формулировка из документа архитектуры). */
  positioning: 'Запускаю сложные технологические продукты за недели и внедряю ИИ в корпоративные процессы',
  short: 'Запуск технологических продуктов и ИИ в корпоративных процессах',
  contact: { label: 'Написать в Telegram', href: 'https://t.me/kibarik' },
  ask: { label: 'Ask Ishmanov AI', href: 'https://t.me/kibarik' },
};

export type CollectionName = 'blog' | 'reviews' | 'tools' | 'prompts' | 'slides' | 'cases';

/** Разделы сайта: по типу материала (CONTEXT.md, «Раздел»). */
export const SECTIONS: Record<CollectionName, { path: string; title: string; one: string; lead: string }> = {
  blog: { path: '/blog/', title: 'Блог', one: 'Статья', lead: 'Продуктовые стратегии, каналы роста, эксперименты и заметки о запуске продуктов.' },
  reviews: { path: '/reviews/', title: 'Разборы', one: 'Разбор', lead: 'Как я применял инструмент: ситуация, решение, чем отличается от альтернатив.' },
  tools: { path: '/tools/', title: 'Инструменты', one: 'Инструмент', lead: 'Карточки open source: когда применять, чем отличается, где взять.' },
  prompts: { path: '/prompts/', title: 'Промты', one: 'Промт', lead: 'Готовые промты руководителя и продакта: фреймворки, исследования, аналитика, маркетинг.' },
  slides: { path: '/slides/', title: 'Презентации', one: 'Презентация', lead: 'Практикумы и доклады: ИИ-агенты в работе руководителя.' },
  cases: { path: '/cases/', title: 'Кейсы', one: 'Кейс', lead: 'Мой опыт с целью, шагами и цифрами: запуски продуктов и внедрение ИИ в командах.' },
};

/** Порядок разделов в шапке. */
export const NAV: CollectionName[] = ['blog', 'reviews', 'tools', 'prompts', 'slides', 'cases'];

export const DIRECTION_INFO = {
  startups: {
    path: '/startups/',
    title: 'Запуск технологических продуктов',
    short: 'Запуск продуктов',
    lead: 'Как довести сложный технологический продукт до первых платящих за недели, а не за годы: стратегии, каналы, эксперименты, метрики.',
    audience: 'Основателям и продактам',
  },
  'ai-in-business': {
    path: '/ai-in-business/',
    title: 'ИИ в корпоративных процессах',
    short: 'ИИ в корпорациях',
    lead: 'Как внедрять ИИ-системы и ИИ-навыки в работу команд и руководителей: агенты, безопасность, инструменты, промты.',
    audience: 'Руководителям, CPO и CTO',
  },
} as const;

export type Direction = keyof typeof DIRECTION_INFO;

/** Профили на внешних площадках: шапка, футер, разметка Person (sameAs). */
export const PROFILES = [
  { label: 'Telegram: PO-нейробаза', href: 'https://t.me/corporate_ai' },
  { label: 'Telegram: Aleks for PMF', href: 'https://t.me/ai_pmf' },
  { label: 'Telegram: OSS-обзоры', href: 'https://t.me/ai_ossresearch' },
  { label: 'Чат AI Product Research', href: 'https://t.me/ai_prodresearch' },
  { label: 'Threads', href: 'https://www.threads.com/@ishmanov_aleks' },
  { label: 'GitHub', href: 'https://github.com/kibarik' },
];

export const SOURCE_LABEL: Record<string, string> = {
  teletype: 'блог на Teletype',
  'telegram:corporate_ai': '@corporate_ai',
  'telegram:ai_pmf': '@ai_pmf',
  'telegram:ai_ossresearch': '@ai_ossresearch',
  prompts: 'prompts.aleksishmanov.ru',
  slides: 'slides.aleksishmanov.ru',
};
