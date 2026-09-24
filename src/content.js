/**
 * Весь контент лендинга в одном месте: тексты, ссылки, ресурсы.
 * Сцена читает отсюда только имя (через опции createScene); разметка и HUD — всё остальное.
 * Мета-теги и Open Graph лежат в index.html: их читают краулеры и Telegram до выполнения JS.
 * Тексты проектов сняты с aleksishmanov.ru (16.09.2026); ссылка на блог исключена, пока он отдаёт 500.
 */

/** Личка в Telegram: сюда ведут и «Написать», и Ask Ishmanov AI, пока бота нет. */
const TELEGRAM_DM = 'https://t.me/kibarik';

/** Ресурсы: внешние площадки проектов. Ключи используются карточками и футером. */
const RESOURCES = {
  corporateAi: { label: 'Telegram: PO-нейробаза', href: 'https://t.me/corporate_ai' },
  slides: { label: 'Презентации', href: 'https://slides.aleksishmanov.ru' },
  aiPmf: { label: 'Telegram: PMF-стратегии', href: 'https://t.me/ai_pmf' },
  threads: { label: 'Threads', href: 'https://www.threads.com/@ishmanov_aleks' },
  prompts: { label: 'Промты', href: 'https://prompts.aleksishmanov.ru' },
};

export const content = {
  /** Имя на белой сцене: бренд латиницей, короткое на мобильном. */
  name: { desktop: 'ISHMANOV', mobile: 'ISHMANOV' },
  /** Теглайн над именем: три направления, каждое слово переворачивается по очереди (flip). */
  tagline: ['Компаниям.', 'Специалистам.', 'Основателям.'],
  /** Оффер: лоадер и «Обо мне». */
  offer: 'Превращаю идеи в работающие бизнес-платформы',

  /** Тёмная секция сразу после сцены: кто это и чем занимается. */
  intro: {
    lead: 'Строю платформы с 2016 года: backend, B2B-продукты, команды. С 2024 — ML и LLM в продукте.',
    name: 'Меня зовут Алекс Ишманов.',
    role: 'Product Owner · AI/ML-платформы',
  },

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

  /** Карточки проектов в порядке показа; direction — направление (см. CONTEXT.md). */
  projects: {
    title: 'Актуальные проекты',
    items: [
      {
        id: 'neurobase',
        direction: 'Руководителям',
        title: 'PO-нейробаза',
        essence: 'ИИ-навыки руководителей',
        topics: ['Построение AI-систем', 'Внедрение AI-навыков', 'Интересные лайфхаки'],
        links: [RESOURCES.corporateAi, RESOURCES.slides],
      },
      {
        id: 'pmf',
        direction: 'Фаундерам',
        title: 'PMF-стратегии',
        essence: 'Как находить и монетизировать проблемы, за решение которых люди готовы платить?',
        topics: ['Продуктовые стратегии', 'Обзоры рынков, идей и решений', 'Инструменты и ответы'],
        links: [RESOURCES.aiPmf, RESOURCES.threads],
      },
      {
        id: 'prompts',
        direction: 'Специалистам',
        title: 'Промты',
        essence: 'Подборка готовых prompt-шаблонов для продуктовой аналитики, исследований и операционных процессов',
        topics: ['Продуктовые фреймворки', 'Аналитика и документация', 'Product Discovery'],
        links: [RESOURCES.prompts],
      },
    ],
  },

  /** Меню: якоря по секциям (короткие подписи) и заголовок блока ресурсов внизу. */
  menu: {
    title: 'Меню',
    resourcesTitle: 'Мои ресурсы',
    anchors: [
      { label: 'Обо мне', href: '#about' },
      { label: 'Проекты', href: '#projects' },
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
  resources: [RESOURCES.corporateAi, RESOURCES.aiPmf, RESOURCES.threads, RESOURCES.prompts, RESOURCES.slides],
};
