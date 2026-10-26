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

  /**
   * «Обо мне»: липкий экран с оффером и короткими фактами; под ним наезжают карьерный путь, образование,
   * последний год и переход в «Кейсы». Пустой блок (нет пунктов или текста) на сайт не выводится —
   * впишите данные, и он появится. Пустые org и text у строки пути тоже просто не показываются.
   */
  about: {
    title: 'Обо мне',
    /**
     * Цифры под оффером — подтверждают заголовок (до трёх). Пустое value на сайт не выводится:
     * впишите число, и цифра появится. Рядом всегда ссылка на кейсы (about.cases).
     */
    facts: [
      { value: '10 лет', label: 'в практике, с 2016 года' },
      { value: '', label: 'B2B-платформ запущено' },
      { value: '', label: 'человек в моих командах' },
    ],
    career: {
      title: 'Карьерный путь',
      /** period — годы, role — роль, org — компания, text — главный результат одной строкой. */
      items: [
        { period: 'с 2016', role: 'Разрабатываю backend', org: '', text: '' },
        { period: 'с 2018', role: 'Запускаю B2B-платформы', org: '', text: '' },
        { period: 'с 2022', role: 'Руковожу backend-командами', org: '', text: '' },
        { period: 'с 2024', role: 'Изучаю ML и LLM, внедряю ИИ-агентов в работу руководителей', org: '', text: '' },
      ],
    },
    /** Образование: { period: '2010 — 2016', org: 'Вуз', text: 'Специальность' }; курсы — так же. */
    education: { title: 'Образование', items: [] },
    /**
     * Последний год: lead — одна фраза, чем занят сейчас; metrics — до трёх { value, label };
     * points — до трёх главных дел года. Блок виден, если заполнен lead.
     */
    lastYear: { title: 'Последний год', period: '', lead: '', metrics: [], points: [] },
    /** Переход в раздел «Кейсы» на портале. */
    cases: { label: 'Смотреть кейсы', href: '/cases/', note: 'Запуски B2B-платформ: цель, шаги, цифры' },
  },

  /** Ask Ishmanov AI: замена на бота — правка href. */
  ask: { label: 'Ask Ishmanov AI', href: TELEGRAM_DM },
  /** «Написать»: главный призыв к действию. */
  contact: { title: 'Написать', label: 'Написать в Telegram', href: TELEGRAM_DM },

  /**
   * «Чем могу быть полезен» (CONTEXT.md, «Предложение», «Проект»): три предложения и проекты, которые веду.
   * В карточке: direction — кому, title — что получите, essence — что сделаю, topics — форматы работы,
   * links — подтверждение на сайте, cta — главная кнопка. Форматы — только те, что владелец делает
   * (консультация, практикум, менторство; внедрения под ключ нет — решение 2026-10-13).
   * ongoing — «Что веду»: каналы, практикумы, библиотеки; рабочая система агентов — обобщённо, без компании.
   */
  projects: {
    title: 'Чем могу быть полезен',
    lead: 'Превращаю идеи в работающие бизнес-платформы',
    items: [
      {
        id: 'founders',
        direction: 'Основателям и продактам',
        title: 'Довести продукт до первых платящих',
        essence: 'Разберу продукт и рынок, помогу выбрать один канал роста вместо семи и собрать план экспериментов на 2–4 недели.',
        topics: ['Консультация-разбор', 'Менторство на время запуска'],
        links: [{ label: 'Статьи о запуске', href: '/startups/' }],
        cta: { label: 'Обсудить задачу', href: TELEGRAM_DM },
      },
      {
        id: 'leaders',
        direction: 'Руководителям, CPO и CTO',
        title: 'ИИ-агенты в работе руководителя',
        essence: 'Покажу, как агенты собирают требования, ведут спринт и готовят планирование квартала, и помогу внедрить это в вашей команде.',
        topics: ['Консультация-разбор', 'Сопровождение внедрения'],
        links: [{ label: 'Презентации', href: '/slides/' }, { label: 'Разборы инструментов', href: '/reviews/' }],
        cta: { label: 'Обсудить задачу', href: TELEGRAM_DM },
      },
      {
        id: 'teams',
        direction: 'Командам',
        title: 'Практикум «ИИ в работе продакта»',
        essence: 'Групповое занятие на задачах вашей команды: Claude Code и GLM в российских реалиях, промты, свои ИИ-агенты.',
        topics: ['Практикум для команды'],
        links: [{ label: 'Пример практикума', href: '/slides/claude-desktop-zai-macos/' }, { label: '69 промтов', href: '/prompts/' }],
        cta: { label: 'Записать команду', href: TELEGRAM_DM },
      },
    ],
    ongoing: {
      title: 'Что веду',
      items: [
        { label: 'PO-нейробаза', note: 'канал об ИИ-навыках руководителей', href: 'https://t.me/corporate_ai' },
        { label: 'Aleks for PMF', note: 'канал о стратегиях запуска', href: 'https://t.me/ai_pmf' },
        { label: 'ИИ-ассистент продакт-оунера', note: 'агенты для спринтов, требований и планирования', href: '/slides/sprint-under-manager/' },
        { label: 'Практикумы', note: 'программы и презентации', href: '/slides/' },
        { label: 'OSS-обзоры', note: 'карточки open source', href: '/tools/' },
        { label: 'Библиотека промтов', note: 'шаблоны для продакта и руководителя', href: '/prompts/' },
        { label: 'AI Product Research', note: 'чат сообщества', href: 'https://t.me/ai_prodresearch' },
      ],
    },
  },

  /** Подписи предметов второй сцены (наведение на десктопе): тема и раздел портала. */
  props: {
    chip: { label: 'ИИ в бизнесе', href: '/ai-in-business/' },
    rack: { label: 'Инструменты и highload', href: '/tools/' },
    chain: { label: 'Стартапы', href: '/startups/' },
  },

  /** Меню: два направления с подписью «кому», ниже разделы; сбоку «Написать» и Telegram. */
  menu: {
    title: 'Меню',
    directions: [
      { label: 'Запуск продуктов', note: 'Основателям и продактам', href: '/startups/' },
      { label: 'ИИ в корпорациях', note: 'Руководителям, CPO и CTO', href: '/ai-in-business/' },
    ],
    /** Разделы мельче направлений; «Обо мне» — якорь секции главной. */
    pages: [PAGES.blog, PAGES.reviews, PAGES.tools, PAGES.cases, { label: 'Обо мне', href: '#about' }],
    /** Нижний док на телефоне: ☰ и четыре перехода, как у референса (Solutions · Services · Portfolio · About). */
    dock: [PAGES.blog, PAGES.reviews, PAGES.cases, { label: 'Обо мне', href: '#about' }],
    /** Строка под кнопкой «Написать». */
    social: { label: 'Telegram', handle: '@kibarik', href: TELEGRAM_DM },
    /** Ссылка внизу панели. */
    home: { label: '< На главную', href: '/' },
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
          { label: 'Чем полезен', href: '#projects' },
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
