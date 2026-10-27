/**
 * Наполнение подвала (shared/site-footer.js): подборки материалов слева и блоки справа.
 * Подборки собраны вручную — это витрина, а не полный список; адреса должны существовать в портале.
 */
export const FOOTER_GROUPS = [
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
];

/** Правая колонка: блок с описанием (desc) или со списком ссылок (links); mark — значок «::» перед заголовком. */
export const FOOTER_BLOCKS = [
  { title: 'Кейсы', href: '/cases/', mark: true, desc: 'Запуски и внедрения: ситуация, решение, цифры.' },
  { title: 'Разборы', href: '/reviews/', desc: 'Чужие инструменты в моей работе: что сделал и в отличие от чего.' },
  { title: 'Промты', href: '/prompts/', desc: 'AI-промты руководителя: готовые шаблоны для работы.' },
  {
    title: 'Каналы',
    links: [
      { label: 'PO-нейробаза', href: 'https://t.me/corporate_ai' },
      { label: 'PMF-стратегии', href: 'https://t.me/ai_pmf' },
      { label: 'Разборы', href: 'https://t.me/ai_ossresearch' },
      { label: 'Сообщество', href: 'https://t.me/ai_prodresearch' },
      { label: 'Threads', href: 'https://www.threads.com/@ishmanov_aleks' },
    ],
  },
  {
    title: 'Обо мне',
    href: '/about/',
    links: [
      { label: 'Практика', href: '/#about' },
      { label: 'Чем полезен', href: '/#projects' },
      { label: 'Презентации', href: '/slides/' },
      { label: 'GitHub', href: 'https://github.com/kibarik' },
    ],
  },
];
