# wow-landing

Лендинг с 3D-персонажем (Three.js + Vite), первый экран и скролл-переход по модели bersus.io.
Ключевые файлы: `src/scene.js` (сцена и таймлайн), `src/stickyScroll.js` (виртуальный скролл),
`src/compare.js` (метрики против референса), `src/content.js` (все тексты и ссылки). Разбор оригинала: `tests/bersus-scroll-analysis.md`.

## Agent skills

### Issue tracker

Задачи и спеки — markdown-файлы в `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Пять стандартных ролей, строки совпадают с именами (`needs-triage` … `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` и `docs/adr/` в корне. See `docs/agents/domain.md`.
