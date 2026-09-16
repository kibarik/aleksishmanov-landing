# bersus.io — оптимизация под слабые устройства и Lighthouse

Источники: сохранённый DOM-снимок страницы и её ассеты (`main.js`, `module.js`,
`main-page-no-webgl-deferred-load.js`, `brs-lazy-frontend.js`). Размеры gltf/bin/ktx2 неизвестны,
файлы не сохранены.

## 1. Загрузка R3F-бандла

- Инлайн-гейт в `<head>`: `canvas.getContext("webgl")`, при провале ставит
  `data-brs-webgl-unsupported` на `<html>`.
- `module.js` (9 KB, `type=module`) повторно проверяет через mapbox-gl-supported: `webgl2`,
  `failIfMajorPerformanceCaveat: true`, Worker, `getImageData`. При успехе инжектит importmap для
  three и `<script type=module src=app/main.js>`. Триггер: DOMContentLoaded.
- `main.js` (223 KB) + чанки `vendor-react`, `vendor-libs-r3f`, three общий для сайта.
- Весь WordPress-JS (~1 MB: jQuery, GSAP, Elementor) отложен через Perfmatters и стартует
  по кастомному событию `brs:11152-load-scripts`, которое бандл шлёт после `loader:phase1Done`.
- До загрузки: SVG-лоадер с инлайн critical CSS, `<html class="brs-scroll-locked">`.

## 2. Детекция устройства

- Только WebGL-проверки. `deviceMemory`, `hardwareConcurrency`, `prefers-reduced-motion`,
  `saveData`, `connection`, UA-проверки: 0 вхождений.
- Пресет только по ширине: `MOBILE_BREAKPOINT = 1024`, замораживается на старте.
- Fallback без WebGL: контейнер `.brs-no-webgl` с `<img>` `main-page-no-webgl-placeholder-desktop.webp`
  (1280×607, 14.6 KB, srcset 320–1080w), нативный скролл, лоадер убирается, `body.brs-light-scene`.
  Остальной JS/CSS активируется по первому scroll/wheel/mousemove/touch или через 15 с.

## 3. Мобильный пресет в бандле

- Модели: desktop `camera.glb`, `man-2.gltf`, `all-2.gltf`; mobile `camera_mobile.glb`,
  `man_mobile-2.*`, `all_mobile-2.*`.
- Текстуры KTX2: desktop normal 1k, diffuse 2k, details 1k, pedestal 512;
  mobile normal 512, diffuse 1k, details 512, pedestal 256.
- Draco через `useGLTF.setDecoderPath`, KTX2 через `useKTX2`.
- Canvas: `dpr: [1, 1.5]`, `antialias: false`, `toneMapping: NoToneMapping`, `shadows: true`.
- Postprocessing: EffectComposer `multisampling: 4`, `resolutionScale: 0.6`, SMAA LOW.
  DOF только desktop (`resolutionScale: .5`). Глитч на mobile bypass.
- Тени: один directionalLight, shadow map 256 desktop / 128 mobile, тесная shadow-camera,
  прогрев 8 кадров и `shadow.needsUpdate` вместо autoUpdate. Environment запекается
  `frames: 1, resolution: 256`.
- Frameloop: `demand` на старте, `always` пока сцена активна, `never` после выхода.

## 4. Лоадер и ассеты

- Стадии `coreReady → phase1Done → mountHeavy → sceneReady`. Сначала лёгкий Suspense и
  SVG-анимация, тяжёлые модели монтируются после `phase1Done` и prefetch всех ассетов.
- Prefetch: `fetch()` всех URL пресета в ArrayBuffer-кэш, патч `FileLoader.prototype.load`,
  `Cache.enabled = true`, чтобы лоадеры не качали повторно.
- Показ сцены ждёт `sceneReady && perfmattersReady && pauseElapsed` и `requestIdleCallback`
  (timeout 1200 мс).

## 5. Lighthouse-специфика

- `<link rel=preload>`: 6 шрифтов woff2 (`fetchpriority=high`), placeholder с `media`,
  логотип, 2 CSS, 47 script-preload (инжект загрузчиками).
- Perfmatters «used CSS» + отложенные некритичные CSS, инлайн critical CSS лоадера,
  `font-display: swap`.
- `img loading=lazy`, `decoding=async`, свой lazy-loader на IntersectionObserver
  (rootMargin 100–200% высоты).
- HLS-видео секций грузится по событию после выхода из сцены.

## 6. Что копируем

1. Двойной гейт: инлайн `getContext('webgl')` в `<head>` + `failIfMajorPerformanceCaveat: true`
   перед импортом бандла. Fallback: статичный webp + нативный скролл, остальной JS по первому жесту.
2. Отдельные чанки three/vendor через Vite `manualChunks`, `type=module`.
3. Пресеты по ширине: мобильная модель (децимация 1M → 100–200k), текстуры 512/1k против 1k/2k.
4. `dpr` 1–1.5, `antialias: false` + SMAA через composer с `resolutionScale 0.6`;
   GTAO/DOF только desktop.
5. Тени: shadow map 256/128, тесная камера, прогрев и `needsUpdate` вместо каждого кадра.
6. Prefetch ассетов в буфер-кэш, тяжёлое монтируется после лёгкой фазы и `requestIdleCallback`.
7. Frameloop `demand`/`never` вне сцены.
8. Preload шрифтов и hero-webp с `fetchpriority=high`, critical CSS лоадера инлайн,
   сторонний JS после первой отрисовки сцены.
