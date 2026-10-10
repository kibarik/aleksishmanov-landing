/**
 * Весь контент лендинга в одном месте: тексты, ссылки, ресурсы.
 * Сцена читает отсюда только имя (через опции createScene); разметка и HUD — всё остальное.
 * Мета-теги и Open Graph лежат в index.html: их читают краулеры и Telegram до выполнения JS.
 * Тексты проектов сняты с aleksishmanov.ru (16.09.2026); ссылка на блог исключена, пока он отдаёт 500.
 */

/** Личка в Telegram: сюда ведут и «Написать», и Ask Ishmanov AI, пока бота нет. */
const TELEGRAM_DM = 'https://t.me/kibarik';

/** Ресурсы: площадки проектов. Презентации и промты переехали на сайт (портал, portal/), остальное — Telegram и Threads. */
const RESOURCES = {
  corporateAi: { label: 'Telegram: PO-нейробаза', href: 'https://t.me/corporate_ai' },
  slides: { label: 'Презентации', href: '/slides/' },
  aiPmf: { label: 'Telegram: Aleks for PMF', href: 'https://t.me/ai_pmf' },
  threads: { label: 'Threads', href: 'https://www.threads.com/@ishmanov_aleks' },
  prompts: { label: 'Промты', href: '/prompts/' },
};

/** Разделы портала: меню и карточки направлений ведут сюда. */
const PAGES = {
  blog: { label: 'Блог', href: '/blog/' },
  reviews: { label: 'Разборы', href: '/reviews/' },
  tools: { label: 'Инструменты', href: '/tools/' },
  prompts: RESOURCES.prompts,
  slides: RESOURCES.slides,
  cases: { label: 'Кейсы', href: '/cases/' },
  about: { label: 'Обо мне', href: '/about/' },
};

export const content = {
  /** Имя на белой сцене: бренд латиницей, короткое на мобильном. */
  name: { desktop: 'ISHMANOV', mobile: 'ISHMANOV' },
  /** Теглайн над именем: три направления, каждое слово переворачивается по очереди (flip). */
  tagline: ['Компаниям.', 'Специалистам.', 'Основателям.'],
  /** Оффер: лоадер и «Обо мне». */
  offer: 'Превращаю идеи в работающие бизнес-платформы',

  /** «Обо мне»: заголовок секции, подпись и таймлайн практики. */
  about: {
    title: 'Обо мне',
    since: 'В практике с',
    timeline: [
      { year: '2016', text: 'Разрабатываю backend' },
      { year: '2018', text: 'Запускаю B2B-платформы' },
      { year: '2022', text: 'Руковожу backend-командами' },
      { year: '2024', text: 'Изучаю ML и LLM' },
    ],
  },

  /** Ask Ishmanov AI: замена на бота — правка href. */
  ask: { label: 'Ask Ishmanov AI', href: TELEGRAM_DM },
  /** «Написать»: главный призыв к действию. */
  contact: { title: 'Написать', label: 'Написать в Telegram', href: TELEGRAM_DM },

  /**
   * Карточки направлений (CONTEXT.md, «Направление»): два направления сайта, ссылки — в разделы портала.
   * direction здесь — аудитория направления, title — само направление.
   */
  projects: {
    title: 'Направления',
    items: [
      {
        id: 'startups',
        direction: 'Основателям и продактам',
        title: 'Запуск технологических продуктов',
        essence: 'Как довести сложный продукт до первых платящих за недели, а не за годы: стратегии, каналы, эксперименты, метрики.',
        topics: ['Продуктовые стратегии', 'Каналы роста', 'Эксперименты и метрики'],
        links: [{ label: 'Все материалы направления', href: '/startups/' }, PAGES.blog, RESOURCES.aiPmf],
      },
      {
        id: 'ai-in-business',
        direction: 'Руководителям, CPO и CTO',
        title: 'ИИ в корпоративных процессах',
        essence: 'Как внедрять ИИ-системы и ИИ-навыки в работу команд и руководителей: агенты, безопасность, инструменты, промты.',
        topics: ['ИИ-агенты для руководителей', 'Безопасность AI-кода', 'Промты и инструменты'],
        links: [{ label: 'Все материалы направления', href: '/ai-in-business/' }, PAGES.reviews, PAGES.slides, PAGES.prompts, RESOURCES.corporateAi],
      },
    ],
  },

  /** Меню: якоря по секциям главной и разделы сайта внизу (resources). */
  menu: {
    title: 'Меню',
    resourcesTitle: 'Разделы сайта',
    anchors: [
      { label: 'Обо мне', href: '#about' },
      { label: 'Направления', href: '#projects' },
      { label: 'Написать', href: '#contact' },
    ],
  },

  /** Яндекс.Метрика: идентификатор счётчика и цели. */
  analytics: {
    counter: 103355275,
    goals: { whiteScene: 'white-scene', ask: 'ask', contact: 'contact' },
  },

  /**
   * Футер: отдельный тёмный экран. Колонки ссылок, призыв и подпись.
   * columns — заголовок и ссылки; ссылки берутся из тех же RESOURCES, что и везде.
   */
  footer: {
    copyright: 'Aleks Ishmanov',
    lead: 'Пишите — разберём вашу задачу.',
    columns: [
      {
        title: 'Проекты',
        links: [
          { label: 'PO-нейробаза', href: RESOURCES.corporateAi.href },
          { label: 'PMF-стратегии', href: RESOURCES.aiPmf.href },
          { label: 'Промты', href: RESOURCES.prompts.href },
        ],
      },
      { title: 'Ресурсы', links: [RESOURCES.slides, RESOURCES.threads] },
    ],
  },
  resources: [PAGES.blog, PAGES.reviews, PAGES.tools, PAGES.prompts, PAGES.slides, PAGES.cases, PAGES.about],
};
