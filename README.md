# wow-landing

Первый экран: 3D-персонаж (Three.js), вид со спины, рим-свет — по мотивам bersus.io.

```bash
npm run dev      # http://localhost:5173
npm run build
```

- `public/models/character.glb` — персонаж, Draco (2.7 MB). Исходник `~/Downloads/base.glb` (36 MB, две фигуры).
- `src/content.js` — весь контент (имя, теглайн, оффер, таймлайн, проекты, ссылки); сцена и разметка читают оттуда.
- `src/sections.js` — секции после сцены («Обо мне», проекты, «Написать», футер), рендер из контента.
- `src/scene.js` — сцена: выбор фигуры (`?part=back|front`), зеркалирование, нормализация роста, свет, камера.
- Пересжать модель: `npx @gltf-transform/cli optimize in.glb public/models/character.glb --compress draco --simplify false`

## Тесты

E2E на Playwright, один шов — собранная страница. Прогоны в трёх проектах: `desktop` 1440×900,
`mobile` 390×844 (touch, свайпы через CDP), `no-webgl` (Chromium с `--disable-3d-apis`, тесты фолбэка).

```bash
npm test                      # все проекты; dev-сервер поднимается сам
npx playwright test --project=desktop
npm run test:update-golden    # перезаписать золотые кадры
```

Локально тесты используют установленный Google Chrome (`channel: 'chrome'`), чтобы не качать Chromium.
На машине без Chrome: `npx playwright install chromium` и `PW_CHANNEL=chromium npm test`.
Отсутствующий золотой кадр — падение теста; создать его можно только через `test:update-golden`.

Золотые кадры лежат в `tests/e2e/golden/` и сравниваются метриками (`src/compare.js`,
`window.__compareTo`) по порогу score, не попиксельно. Хуки `window.__sticky` / `window.__app`
используются только для чтения прогресса и захвата кадра. Хелперы в `tests/e2e/helpers.js`.

## Сравнение с референсом (тюнинг тёмной сцены)

Референсный кадр и прогоны скриншотов в репозиторий не входят (`.gitignore`): это материалы bersus.io.
Чтобы пользоваться `window.__compare()`, положите скриншот bersus.io 1440×900 в `public/ref/bersus-1440.png`:

```js
await window.__compare()   // { ref, ours, diff, score } — меньше score = ближе
```

Метрики и веса — `src/compare.js`, история прогонов — `tests/log.md`.
## Скролл-переход (по bersus.io)

Разбор оригинала: `tests/bersus-scroll-analysis.md` (шаги, модель скролла, камера, глитч, свет).
Реализация: `src/stickyScroll.js` (виртуальный скролл: commit/snap/паузы/prelude/release),
`src/glitchShader.js` (порт глитч-пасса), таймлайн в `src/scene.js` (`applyTimeline`).
Шаги: init → black-man (prelude 2 с) → into-white (глитч, свап на 36%) → full (статуя, теглайн) → release.
Мобильный пресет (≤ 1024px, как `MOBILE_BREAKPOINT` у bersus): `UNIT 260`, один сегмент black-man → full
(3.05·UNIT), без глитча, свап на абсолютном прогрессе 370, камера облетает фигуру по дуге,
заголовок выезжает снизу над головой.
