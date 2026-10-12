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
   * Футер повторяет футер референса: слева прокручиваемая карточка с группами (заголовок-ссылка раздела
   * + список материалов), справа блоки-заголовки, призыв «Написать», профили и подпись.
   * Структура — по плану сайта («aleksishmanov.ru — архитектура сайта и контент-план»):
   * два направления (/ai-in-business, /startups), /tools, /blog, /cases, /slides, /prompts.
   * Внутренние ссылки ведут на страницы портала; внешние открываются в новой вкладке со стрелкой.
   */
  footer: {
    copyright: 'Алексей Ишманов',
    groups: [
      {
        title: 'ИИ в бизнесе',
        href: '/ai-in-business/',
        links: [
          { label: 'Schema-Guided Reasoning', href: '/reviews/sgr-podhod-ili-kak-uluchshayut-kachestvo-v-llm-proektah/' },
          { label: 'Repowise', href: '/reviews/repowise-sistemnaya-analitika-v-korporatsiyah/' },
          { label: 'Kagent', href: '/reviews/kagent-opensource-platforma/' },
          { label: 'Semgrep с конфигами', href: '/reviews/ai-app-sec-i-bezopasnost-ai-koda/' },
          { label: 'Nacre', href: '/tools/nacre-otkrytyy-kontekstnyy-sloy-dlya-agentov-s-pravami-dostupa/' },
          { label: 'Headlong', href: '/tools/headlong-opensource-avtonomnyy-ai-agent-s-postoyannoy-refleksiey/' },
        ],
      },
      {
        title: 'Запуск стартапов',
        href: '/startups/',
        links: [
          { label: 'Хостинг для прототипов', href: '/blog/razmeschenie-za-1r-mes-dlya-vayb-koderov/' },
          { label: 'Wedge-стратегия', href: '/blog/wedge-strategy/' },
          { label: '19 каналов дистрибуции', href: '/blog/19-distribution-channels/' },
          { label: 'Метрика North Star', href: '/blog/nsm-metric/' },
          { label: 'Холодный старт продукта', href: '/blog/product-leaks-cold-start/' },
        ],
      },
      {
        title: 'Инструменты',
        href: '/tools/',
        links: [
          { label: 'ItemsJS', href: '/tools/itemsjs-fasadnyy-poisk-dlya-faas-platform/' },
          { label: 'TinyTroupe', href: '/tools/tinytroupe-multi-agentnaya-simulyatsiya-lyudey-dlya-llm/' },
          { label: 'Formance Ledger', href: '/tools/formance-ledger-opensource-finansovyy-ledzher-dlya-fintech/' },
          { label: 'Hyperswitch', href: '/tools/hyperswitch-opensource-platezhnyy-orkestrator-dlya-multi/' },
          { label: 'LadybugDB', href: '/tools/ladybugdb-opensource-grafovaya-bd/' },
          { label: 'Graphiti', href: '/tools/graphiti-freymvork-dlya-vremennyh-grafov-znaniy/' },
          { label: 'Hermes Agent', href: '/tools/hermes-agent-nous-research/' },
          { label: 'GramIO', href: '/tools/create-gramio-gramio/' },
          { label: 'Memoire', href: '/tools/memoire-memi-dizayn-sloy-dlya-ii-agentov-na-claude-code/' },
          { label: 'YDB', href: '/tools/ydb-yandex-database/' },
          { label: 'Wiki.js', href: '/tools/wikijs/' },
          { label: 'Outline', href: '/tools/outline/' },
          { label: 'OpenObserve', href: '/tools/openobserve-otkrytaya-observability-platforma-dlya-logov-metrik/' },
        ],
      },
      {
        title: 'Блог',
        href: '/blog/',
        links: [
          { label: 'Bullseye Framework', href: '/blog/bullseye-framework/' },
          { label: 'Community-Led Growth', href: '/blog/community-led-growth/' },
          { label: 'A/B-тесты', href: '/blog/a-b-math-basics/' },
          { label: 'Bus Factor', href: '/blog/bus-factor-leak/' },
          { label: 'Метрики удержания', href: '/blog/retention-metrics/' },
          { label: 'Jobs To Be Done', href: '/blog/product-leaks-jtbd-blindness/' },
          { label: 'Lean Analytics', href: '/blog/lean-analytics/' },
          { label: 'Стартап и корпорация', href: '/blog/startup-vs-corporation/' },
        ],
      },
    ],
    /** Правая колонка: блок с описанием (desc) или со списком ссылок (links); mark — значок «::» перед заголовком. */
    blocks: [
      { title: 'Кейсы', href: '/cases/', mark: true, desc: 'Запуски и внедрения: ситуация, решение, цифры.' },
      { title: 'Промты', href: RESOURCES.prompts.href, desc: 'AI-промты руководителя: готовые шаблоны для работы.' },
      {
        title: 'Каналы',
        links: [
          { label: 'PO-нейробаза', href: RESOURCES.corporateAi.href },
          { label: 'PMF-стратегии', href: RESOURCES.aiPmf.href },
          { label: 'Разборы', href: 'https://t.me/ai_ossresearch' },
          { label: 'Сообщество', href: 'https://t.me/ai_prodresearch' },
          { label: 'Threads', href: RESOURCES.threads.href },
        ],
      },
      {
        title: 'Обо мне',
        href: '/about/',
        links: [
          { label: 'Практика', href: '#about' },
          { label: 'Направления', href: '#projects' },
          { label: 'Презентации', href: RESOURCES.slides.href },
          { label: 'Написать', href: '#contact' },
        ],
      },
    ],
    /** Профили под кнопкой: заголовок и иконки (icon — ключ ICONS в sections.js). */
    profiles: {
      title: 'Профили',
      items: [
        { label: 'Telegram', href: TELEGRAM_DM, icon: 'telegram' },
        { label: 'Threads', href: RESOURCES.threads.href, icon: 'threads' },
      ],
    },
  },
  resources: [PAGES.blog, PAGES.reviews, PAGES.tools, PAGES.prompts, PAGES.slides, PAGES.cases, PAGES.about],
};
