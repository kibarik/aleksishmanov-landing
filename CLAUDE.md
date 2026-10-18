# wow-landing

Лендинг с 3D-персонажем (Three.js + Vite), первый экран и скролл-переход по модели bersus.io.
Ключевые файлы: `src/scene.js` (сцена и таймлайн), `src/stickyScroll.js` (виртуальный скролл),
`src/compare.js` (метрики против референса), `src/content.js` (все тексты и ссылки). Разбор оригинала: `tests/bersus-scroll-analysis.md`.

## Портал (всё, кроме главной)

aleksishmanov.ru = главная (3D-лендинг выше) + портал на Astro 5 в `portal/` (ADR 0002–0004). Сборка — `npm run build`:
`scripts/build.mjs` склеивает `vite build` и `astro build` в `dist/`. Хостинг Timeweb App Platform, деплой из `main`.
- Материал = `portal/src/content/<blog|reviews|tools|prompts|slides|cases>/<slug>.md`, схема — `portal/src/content.config.ts`
  (сборка падает, если поля не хватает). Слова — по `CONTEXT.md` (материал, раздел, направление).
- Тексты сайта (имя, позиционирование, разделы, профили) — `portal/src/lib/site.ts`; списки и адреса — `portal/src/lib/materials.ts`.
- Старые адреса: `shared/host-redirect.js` (домены blog./slides./prompts./call.) и `portal/src/pages/[...old].astro`
  (страницы-переадресации). 301 на хостинге нет — ADR 0003.
- Импорт из снимка источников — `npm run import` (`tools/import-sources.mjs`): перезаписывает только файлы с `imported: true`.
- Главная получает текст для поиска и «Свежие материалы» при сборке — `scripts/vite-portal.mjs`.
- Проверка: `npm run test:unit`, `npm run test:portal` (собирает `dist/` и гоняет `tests/e2e/*.portal.spec.js`
  против сервера с поведением Timeweb), `npm test` — лендинг.
- Для ИИ-поиска: `/llms.txt`, `/llms-full.txt`, Markdown-копия каждого материала (`/blog/<slug>.md`).
- Методология — хребет сайта (ADR 0006): узлы в `portal/src/content/method/` (проблема → области → темы), материалы
  прикрепляются к темам полем `materials`; целостность — `tests/unit/method.test.mjs`.
- Как писать и принимать статьи (SEO, цитирование ИИ, рубрика, промты автора и ревьюера) — `docs/content/README.md`,
  навык `.claude/skills/article`. Перед коммитом статьи — `npm run lint:content` без ошибок.

## Agent skills

### Issue tracker

Задачи и спеки — markdown-файлы в `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Пять стандартных ролей, строки совпадают с именами (`needs-triage` … `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` и `docs/adr/` в корне. See `docs/agents/domain.md`.
