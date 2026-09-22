# bersus.io — разбор скролл-перехода первого экрана (desktop)

Источники: `main.js` бандла (R3F), `camera.glb` (путь камеры, 451 кадр), покадровая съёмка
через Playwright (`tests/ref-scroll/g*.png`, контакт-лист `contact2.png`).

## 1. Таймлайн — «липкие» шаги (sticky steps)

Прогресс измеряется в условных единицах, `UNIT = 200` (desktop). Шаг = отрезок прогресса.

| # | step        | длина      | прогресс  | кадры camera.glb | что происходит |
|---|-------------|-----------|-----------|------------------|----------------|
| 0 | init        | —         | 0         | 0                | стартовая поза после лоадера, свет выключен |
| 1 | black-man   | 1.0·UNIT  | 200       | 0–50             | prelude: авто-проигрыш 2 с (easeInOutQuad), delay 500 мс после лоадера. Камера подъезжает: z −1.83→−1.43, y 2.05→2.22. Свет включается (`brs:scene-light-on`) |
| 2 | into-white  | 1.2·UNIT  | 440       | 51–100           | ГЛИТЧ + свап в белую сцену, камера пролетает сквозь фигуру вперёд |
| 3 | full        | 1.0·UNIT  | 640       | 101–150          | статуя проявляется светом, камера наезжает, появляется теглайн |
| 4 | explode…    | 4·UNIT…   | 1440…     | 150–450          | шахматы, взрыв, comeback, leave — не наш случай |

Далее у них ещё `chess-1-expl`, `chess-2-expl`, `comeback`, `leave`; нам нужен только `leave`
(сцена уезжает, начинается обычный контент).

## 2. Модель скролла (виртуальный, body заблокирован)

Не нативный скролл. `wheel` перехватывается (`capture`, `preventDefault`), touch и клавиши тоже.

```
delta = clamp(deltaY, −100, 100) × 0.4        // wheelSensitivity, wheelClamp (desktop)
targetProgress += delta
каждый кадр:
  snap = getSnapTarget(targetProgress)        // куда «тянет» сегмент
  targetProgress += (snap − targetProgress) × 0.035   // lerpTarget
  velocity = (targetProgress − progress) × 0.04        // lerpCurrent
  velocity = clamp(velocity, −12, 12)                  // maxSpeed
  progress += velocity
```

Сегменты и их режимы (`buildSegments`):

| сегмент               | mode | commit | snapStart/End | смысл |
|-----------------------|------|--------|---------------|-------|
| init → black-man      | free, prelude, pullTo end | — | .5/.5 | авто-проигрыш, назад не откатывается |
| black-man → into-white| free | **0.3** | 0/0 | если прошёл ≥30% — дотягивает до конца, иначе откатывает к началу |
| into-white → full     | free | 0.3 | 0/0 | то же |
| full → explode        | free | — | .1/.3 | обычный скраб с прилипанием к краям |

`commit` = «жест решает»: направление вниз и прогресс в сегменте ≥ 0.3 → цель = конец сегмента;
иначе цель = начало. Поэтому один тик колеса (40 ед. из 240 = 17%) показывает глитч и откатывает
обратно (видно на `contact.png`), а 2+ тика подряд коммитят переход.

Точки паузы (`buildPausePoints`): в `into-white` и `full`, только вперёд, 500 мс (`MICRO_PAUSE_MS`):
прогресс блокируется на точке, потом продолжает. Даёт «ступеньку» и не позволяет проскочить кадр.

Клавиатура: `keyboardMicroStep 1`, ускорение при удержании. Touch: `touchPixelScale 3.2`.

## 3. Что делают шаги визуально

### black-man → into-white (прогресс 200→440)

- **Камера** (`camera.glb`, cam_1_root): ease-in-out, стоит сзади до ~25%, между 29% и 39%
  проходит сквозь тело (z −0.56 → +1.54), к 100% на z = 12.38, y 1.06 (далеко спереди, низко).
  Target y 2.19 → 1.61. Фокусное 35 мм → 55 мм (fov 37.8° → 24.6°, sensor 24 мм).
- **Глитч-пасс** (`GlitchScrollDriver`): активен на 1%…90% сегмента, интенсивность =
  `(1 − |t−0.5|·2)^1 × strength 2`, пик на 50%. Параметры: blockCount 6, displacement .3,
  blockChance 1, timeSpeed 4, rgbMono true (моно-«edge» вместо RGB-сдвига), scanline .51,
  noise .43, flicker .43, ghost 1. Шейдер полностью в `main.js` (`fragmentShader` с `uBlockCount`).
  На пике экран — сплошные горизонтальные полосы с шумом (кадр `g01`).
- **Color swap** на 36% сегмента (`swapPoint`): фон чёрный → белый, тёмные лампы (dark_init_*)
  выключаются, материал персонажа меняется на «статую», но без света он читается чёрным
  силуэтом (кадры `g02`–`g07`): силуэт на пьедестале, 3D-текст BERSUS сзади, шахматы на полу.
- Scroll hint скрывается на into-white + 12%.

### into-white → full (прогресс 440→640)

- **Камера**: z 12.38 → 10.28 (наезд), y 1.06 → 2.52 (подъём), target y 1.61 → 1.35.
  Фокусное 55 → 65 мм (fov 24.6° → 20.9°).
- **Key light** (`KEY_LIGHT_DEFAULTS`): position (−1, 3, 1), intensity 0 → 1.11 линейно по
  всему сегменту (`rangeFromPct 0..100`); тень PCF, shadowIntensity .9 → 3.97, пол-тень
  (shadow floor) opacity .13 → .1.
- **Env light**: 0 → 1.25 на 25%…55% сегмента (`ENV_LIGHT_FADE_IN`).
- Силуэт → белая текстурированная статуя (кадры `g08`–`g14`).
- **Body anim** (риг персонажа) стартует с −5% сегмента (`bodyAnimStart`).
- **Теглайн** «Design. Development. Marketing.» (`DDM_DESKTOP.appear`) с 75% сегмента.
- Пауза 500 мс на `full`.

### full → … (дальше)

Cursor-параллакс (`PC_CURSOR`), idle breath, шахматы интерактивны, потом explode. Для нас:
`full → leave` — сцена отпускает нативный скролл (`releaseToNative("down")` при
`intent = "down"` на maxProgress), ниже идёт обычный контент (`.brs-below-scene`).

## 4. Что переносим к себе

| bersus                          | у нас                                                   |
|---------------------------------|---------------------------------------------------------|
| sticky steps + commit/pause     | `src/stickyScroll.js`, те же константы                  |
| camera.glb                      | ключевые позы камеры на шагах + smoothstep (без glb)    |
| glitch pass                     | порт шейдера 1:1 в `src/glitchShader.js`                |
| color swap 36%                  | фон, свет, материал → статуя                            |
| key light + env fade            | SpotLight с тенью + environmentIntensity                |
| 3D-текст BERSUS                 | плоскость с canvas-текстурой «ALEKS» позади фигуры      |
| пьедестал, пол-тень             | процедурная колонна, ShadowMaterial                     |
| теглайн DDM                     | HTML `.tagline` с 75% сегмента                          |
| releaseToNative                 | после `full` отпускаем body scroll, контент ниже        |

Масштаб: их персонаж ≈ 2.2 ед. (target головы 2.13), наш 1.85 → координаты камеры × 0.85.

## 5. Мобильный таймлайн (width ≤ 1024, `MOBILE_BREAKPOINT`)

Кадры: `tests/ref-scroll/mobile/m*.png`. Камера: `camera_mobile.glb`.

| step      | длина       | прогресс | кадры camera_mobile.glb |
|-----------|-------------|----------|-------------------------|
| init      | —           | 0        | 0                       |
| black-man | 1.0·UNIT    | 260      | 0–50 (prelude)          |
| full      | 3.05·UNIT   | 1053     | 51–100 на первых 49.5% сегмента, 101–135.3 на остатке |

`UNIT = 260`. Шага into-white нет: один сегмент black-man → full, `commit 0.3`, пауза 500 мс только на full.
Ввод: wheelSensitivity 1.4, wheelClamp 140, touchPixelScale 5.1, lerpTarget .065, lerpCurrent .07, maxSpeed 7.

Отличия от desktop:
- **Глитча нет** (`GlitchScrollDriver`: mobile → bypass).
- **Color swap** на абсолютном прогрессе 370 (`MOBILE_COLOR_SWAP_PROGRESS`) = 13.9% сегмента.
- **Камера облетает фигуру по дуге**, не пролетает сквозь: cam_1_root
  init (0, 2.05, −3.49) → black-man (0, 1.92, −2.08) → f65 (2.87, 1.68, −0.97) → f70 (3.86, 1.61, 0.96) →
  f75 (4.07, 1.62, 3.36) → f80 (3.58, 1.67, 5.74) → f90 (1.33, 1.81, 9.16) → f100 (0, 1.88, 10.28), дальше почти статично.
  Target статичен (0.03, 2.10, 0). Фокусное 24 → 50 мм (fov 53° → 27°) по всему сегменту.
- **Key light** включается сразу после свапа (`getKeyLightFade`: mobile → isPastColorSwapThreshold ? 1 : 0),
  тени сразу в «after»-значениях. **Env** 0 → 1.25 по всему сегменту (`start 0, duration 1`).
- **Заголовок**: скрыт до свапа, потом выезжает снизу: yOffset −0.8 → 0, scale 1.2 → 1,
  smoothstep от прогресса 560 (`MOBILE_BERSUS_Y_ANIM_START`, 37.8% сегмента) до full. В финале стоит НАД головой.
- **Теглайн** с 88% сегмента (`DDM_MOBILE.appear`, duration .1). Scroll hint скрывается на 88%.
- Курсор-параллакс и chess float выключены (амплитуды 0), body anim с 92%.
