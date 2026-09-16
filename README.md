# wow-landing

Первый экран: 3D-персонаж (Three.js), вид со спины, рим-свет — по мотивам bersus.io.

```bash
npm run dev      # http://localhost:5173
npm run build
```

- `public/models/character.glb` — персонаж, Draco (2.7 MB). Исходник `~/Downloads/base.glb` (36 MB, две фигуры).
- `src/scene.js` — сцена: выбор фигуры (`?part=back|front`), зеркалирование, нормализация роста, свет, камера.
- Пересжать модель: `npx @gltf-transform/cli optimize in.glb public/models/character.glb --compress draco --simplify false`

## Сравнительные тесты с bersus.io

Референс `public/ref/bersus-1440.png`. В консоли страницы (окно 1440×900, после лоадера):

```js
await window.__compare()   // { ref, ours, diff, score } — меньше score = ближе
```

Метрики и веса — `src/compare.js`, история прогонов — `tests/log.md`, скриншоты — `tests/shots/`.
Прогон через Playwright: navigate → wait → `__app.setLightOn(1)` → `__compare()` → screenshot.

## Скролл-переход (по bersus.io)

Разбор оригинала: `tests/bersus-scroll-analysis.md` (шаги, модель скролла, камера, глитч, свет).
Реализация: `src/stickyScroll.js` (виртуальный скролл: commit/snap/паузы/prelude/release),
`src/glitchShader.js` (порт глитч-пасса), таймлайн в `src/scene.js` (`applyTimeline`).
Шаги: init → black-man (prelude 2 с) → into-white (глитч, свап на 36%) → full (статуя, теглайн) → release.
Кадры прогонов: `tests/shots/scroll/`, кадры оригинала: `tests/ref-scroll/`.
Мобильный пресет (≤ 1024px, как `MOBILE_BREAKPOINT` у bersus): `UNIT 260`, один сегмент black-man → full
(3.05·UNIT), без глитча, свап на абсолютном прогрессе 370, камера облетает фигуру по дуге,
заголовок выезжает снизу над головой. Кадры: `tests/shots/scroll-mobile/`, оригинал: `tests/ref-scroll/mobile/`.
