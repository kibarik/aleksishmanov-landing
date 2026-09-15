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
