# /cases/: слайд кейса и стопка с переключением — исследование

Дата: 2026-10-18. Вопрос: (1) как уложить кейс запуска B2B-платформы на один слайд, чтобы он читался за 5–10 секунд;
(2) брать ли OSS для «стопки внахлёст» или оставить прототип без библиотеки
(`portal/src/components/prototype/CasesPrototype.astro`, вариант A: CSS `data-pos` + transform, ~60 строк JS).

Метод: официальные статьи NN/g, страницы карьерных центров вузов (STAR/CAR), первоисточники методик слайдов,
живые страницы кейсов; по библиотекам — **исходники опубликованных npm-пакетов** (скачаны и прочитаны),
GitHub API (звёзды, релизы, лицензия), размер — **собственный замер**: esbuild `--bundle --minify` + `gzip -9`
(bundlephobia не использовался). Спецификации — W3C APG/ARIA 1.2, MDN (включая browser-compat-data).

Пометка «[не проверено]» — утверждение, которое не удалось подтвердить первоисточником в этой сессии.

---

## 1. Слайд кейса на одном экране

### 1.1. Что говорят первоисточники

| Источник | Что утверждает | Что берём в слайд |
|---|---|---|
| NN/g, R. Krause, «5 Steps to Creating a UX-Design Portfolio», 2019 — [nngroup.com/articles/ux-design-portfolios](https://www.nngroup.com/articles/ux-design-portfolios/) | Нанимающие редко читают портфолио целиком — его нужно делать сканируемым; кейс покрывает проблему, **роль**, путь к решению, итог для пользователей и бизнеса (пример — рост продаж на 15%); 3–5 кейсов, качество важнее количества; скриншоты «рассказывают историю», но финальный экран — лишь часть её | Поля: проблема, роль, шаги, результат с цифрой, визуал. Кейсов в стопке — 3–5 |
| NN/g, A. Schade, «Inverted Pyramid», 2018 — [nngroup.com/articles/inverted-pyramid](https://www.nngroup.com/articles/inverted-pyramid/) | Самое важное (по сути вывод) — первым, дальше детали по убыванию важности | Заголовок = результат, а не название проекта |
| NN/g, J. Nielsen, «First 2 Words: A Signal for the Scanning Eye», 2009 — [nngroup.com/articles/first-2-words-a-signal-for-scanning](https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/) | При сканировании пользователь видит примерно первые 2 слова строки — их нужно нагружать смыслом | Заголовок и подписи метрик начинать с информативного слова/числа |
| NN/g, J. Nielsen, «Show Numbers as Numerals», 2007 — [nngroup.com/articles/web-writing-show-numbers-as-numerals](https://www.nngroup.com/articles/web-writing-show-numbers-as-numerals/) | По eyetracking цифры останавливают блуждающий взгляд даже в тексте, который пропускают | Метрики — цифрами («×3», «40 клиентов»), крупно, отдельным блоком |
| STAR — MIT CAPD — [capd.mit.edu/…/the-star-method-for-behavioral-interviews](https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/) | Situation ~20%, Task ~10%, Action ~60%, Result ~10% рассказа; результаты важно давать измеримыми | На слайде порядок **обратный** рассказу: Result наверх (заголовок + цифры), Situation — одна строка контекста, Task — роль, Action — 3 шага |
| CAR — UW-Madison, SFSU, Walden — [пример SFSU (PDF)](https://grad.sfsu.edu/sites/default/files/documents/Accomplishment-Statements-for-Resumes-CAR-Statement-Worksheet.pdf), [Walden](https://academicguides.waldenu.edu/careerservices/tailoringyourresume/CAR) | Challenge → Action → Result; результат — числами; всё сжимается в одну фразу | Заголовок-результат строится как сжатый CAR: «Запустил X для Y — Z за N мес» |
| Pyramid Principle, B. Minto — [barbaraminto.com](https://www.barbaraminto.com/) | Мысли организуются пирамидой под одной главной мыслью | Один тезис на слайд; всё остальное — его опора |
| Assertion–evidence, M. Alley (Penn State) — [assertion-evidence.com](https://www.assertion-evidence.com/) | Слайд строится на утверждении-предложении (assertion), а не на теме-фразе; опора — визуальное доказательство, а не список буллетов | Заголовок — законченное предложение; справа — скриншот как «доказательство», буллетов минимум (только 3 шага) |

### 1.2. Реальные примеры раскладок

| Пример | Что видно | Что берём |
|---|---|---|
| Stripe, кейс Twilio — [stripe.com/customers/twilio](https://stripe.com/customers/twilio) | Заголовок — результат с числом («…increases its authorization rates by 10%…»), блок фактов (продукты, регион, размер компании), отдельный крупный «10%» с подписью, дальше Challenge → Solution → Results. Порядок — по разметке страницы; положение колонок глазами не проверено (встроенный браузер был недоступен) | Заголовок-результат + один «big number» + строка фактов |
| Stripe, каталог — [stripe.com/customers](https://stripe.com/customers) | Блок «measurable results»: крупные цифры ($70M, 6 months faster, 10%) с короткими подписями | Формат метрики: «значение + подпись в 3–5 слов» |
| Vercel — [vercel.com/customers](https://vercel.com/customers) | Заголовки «How X [результат] on Vercel», у многих — блок метрик в начале (например, «Impact at a glance») | 2–3 метрики сразу под заголовком |
| Linear — [linear.app/customers](https://linear.app/customers), [кейс Scale](https://linear.app/customers/scale) | Результат с цифрой в заголовке («…compressed bug resolution time by 52%»); блок фактов между вступлением и текстом; в самом кейсе — одна колонка | Если метрика одна — она идёт прямо в заголовок |
| Framer, шаблон Folyx — [framer.com/marketplace/templates/folyx](https://www.framer.com/marketplace/templates/folyx/) | Карточки кейсов с раскладкой «картинка/текст» и количественными результатами на виду; заголовки-метрики | Ровно наша раскладка «текст | визуал» |
| Framer, шаблон Elias Vent — [framer.com/marketplace/templates/elias-vent](https://www.framer.com/marketplace/templates/elias-vent/) | Коллекция CMS: title, category, cover, description, role, timeline, year, overview, challenge, showcase; страница собирается из одной записи | Подтверждение набора полей схемы (1.5) |

### 1.3. Иерархия: что читается за 5–10 секунд

Порядок чтения (крупное → мелкое), с привязкой к STAR/CAR:

1. **Заголовок-результат** (Result) — законченное предложение, глагол + число, ≤ 3 строк. ~2 с.
2. **2–3 метрики крупно** (Result) — цифрами, подпись 3–5 слов капсом. ~2–3 с.
3. **Визуал** — скриншот продукта как доказательство (assertion–evidence). Взгляд на 1–2 с.
4. **Контекст одной строкой** (Situation/Challenge) — для кого и какая проблема.
5. **Метастрока** (Task) — роль · годы · тип, капсом с разрядкой.
6. **Шаги** (Action) — 3 пункта по одной строке; на телефоне скрыть.
7. **Стек** — строка тегов, приглушённо. Последним.
8. **«Открыть кейс →»** — полная история в отдельной странице (тело markdown).

Порог 5–10 с покрывают пункты 1–3; 4–7 — для тех, кто задержался.

### 1.4. Рекомендуемая раскладка

**Десктоп, слайд ≈ 16:9 (сетка 12 колонок, текст 5–6 | визуал 6–7):**

```
┌───────────────────────────────────────────────────────────────────┐
│ КЕЙС 01 · 2018–2019 · B2B-ПЛАТФОРМА                 Открыть кейс →│  капс-подпись, тонкий разделитель
├──────────────────────────────┬────────────────────────────────────┤
│ Для кого / какая проблема     │                                    │  контекст 1 строка, приглушённо
│                              │                                    │
│ ЗАГОЛОВОК-РЕЗУЛЬТАТ           │        скриншот в рамке            │  Cal Sans/Montserrat 800,
│ В 2–3 СТРОКИ                  │        (16:10, обрезка по верху)    │  clamp(28px, 3vw, 44px)
│                              │                                    │
│ ×3        40         6 мес    │                                    │  цифры 40–56px, цвет тона кейса
│ ПОДПИСЬ   ПОДПИСЬ    ПОДПИСЬ  │                                    │  подписи 11–12px, letter-spacing .12em
│ ──────────────────────────── │                                    │
│ 1 Шаг  2 Шаг  3 Шаг           │                                    │  Manrope 15px, по строке
│ РОЛЬ · Python · Kafka · …     │                                    │  метастрока
└──────────────────────────────┴────────────────────────────────────┘
   └─ цветная подложка-тень (box-shadow: 22px 22px 0 var(--tone))
```

**Телефон, вертикальная карточка (≈ 375×640 видимой области):**

```
┌───────────────────────────┐
│ скриншот 16:10            │  визуал наверх: он «продаёт» первым при свайпе
├───────────────────────────┤
│ КЕЙС 01 · 2018–2019        │
│ Заголовок-результат        │  24–28px, ≤ 3 строк
│ ×3     40      6 мес       │  3 в ряд (28px), при нехватке — 2 + 1
│ ПОДП.  ПОДП.   ПОДП.       │
│ Роль · стек (1 строка)     │
│ Открыть кейс →             │
└───────────────────────────┘
```

На телефоне скрыть контекст и шаги (они в полном кейсе), стопку смещать **вверх** (а не вправо), чтобы не съедать ширину —
так уже сделано в прототипе (`@media (max-width: 720px)`).

### 1.5. Поля схемы контента Astro (коллекция `cases`)

Совместимо с текущим `portal/src/content.config.ts` (Astro 5.18: `z` из `astro:content`, загрузчик `glob`).
Сейчас там уже есть `cases: coll('cases')` на общей схеме материалов — предлагается заменить её своей схемой
(или расширить общую через `material.extend({...})`), сохранив общие поля `description`, `date`, `directions`, `source`.
Для скриншота — помощник `image()` из колбэка схемы: он проверяет и импортирует картинку
([docs.astro.build/en/guides/images](https://docs.astro.build/en/guides/images/)); поэтому у `cases` своя
`defineCollection`, не общий `coll()`.

```ts
const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: ({ image }) => z.object({
    /** Заголовок-результат: законченное предложение с числом (инвертированная пирамида). */
    title: z.string().min(10).max(90),
    /** Контекст: для кого и какая проблема — одна строка (Situation/Challenge). */
    context: z.string().max(140),
    /** Роль в запуске (Task). */
    role: z.string().max(60),
    years: z.object({ from: z.number().int(), to: z.number().int().optional() }),
    /** Тип: «B2B-платформа», «маркетплейс» … — для капс-подписи. */
    kind: z.string().max(30),
    /** Клиент/отрасль; можно обезличить. */
    client: z.string().optional(),
    /** 2–3 метрики: значение цифрами + подпись 3–5 слов. */
    metrics: z.array(z.object({
      value: z.string().max(10),        // «×3», «40», «6 мес»
      label: z.string().max(40),
      note: z.string().optional(),      // как посчитано / источник — для полной страницы
    })).min(2).max(3),
    /** 3 шага (Action), по строке. */
    steps: z.array(z.string().max(80)).min(3).max(5),
    stack: z.array(z.string()).max(8),
    cover: image(),
    coverAlt: z.string().min(5),
    /** Цвет подложки-тени слайда. */
    tone: z.string().regex(/^#[0-9a-f]{6}$/i),
    order: z.number().int(),
    directions: z.array(z.enum(DIRECTIONS)).default(['startups']),
    draft: z.boolean().default(false),
  }),
});
```

Тело markdown — полный кейс (STAR целиком) для страницы «Открыть кейс». Лимиты длины — сознательная защита
раскладки: заголовок > 90 знаков на 16:9 не влезет в 3 строки при 44px.

---

## 2. OSS для стопки

### 2.1. Требования

R1 стопка внахлёст с видимыми краями задних карточек (смещение + масштаб), цветная подложка-тень у активной;
R2 свайп на телефоне; R3 клавиатура (стрелки); R4 a11y по [WAI-ARIA APG Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/):
контейнер `region`/`group` + `aria-roledescription="carousel"` + имя, слайды `group` + `aria-roledescription="slide"` + имя,
`aria-live="polite"` у обёртки без автопрокрутки; кнопки «назад/вперёд» как альтернатива свайпу
([WCAG 2.2, 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html));
R5 `prefers-reduced-motion` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion), Baseline с 2020);
R6 без фреймворка, в Astro-компоненте; R7 малый вес.

### 2.2. Сравнение

Звёзды/релизы — GitHub API на 2026-10-16; размер — esbuild-бандл «ядро + нужные модули», min+gzip -9, без CSS (CSS отдельно).

| | **Swiper** (EffectCreative / EffectCards) | **Embla Carousel** | **Splide** | **Flicking** (egjs) | **Без библиотеки** (прототип) |
|---|---|---|---|---|---|
| R1 стопка с краями | **EffectCreative — да** (см. 2.3), EffectCards — веер в обе стороны | нет эффектов в ядре — свои трансформы поверх событий | нет (типы `slide`/`loop`/`fade`) | нет; плагин `Perspective` — поворот/масштаб, не стопка | да (CSS `data-pos`) |
| R2 свайп | да, с инерцией и следованием за пальцем | да (сильная сторона) | да | да | да, порог 60 px, без инерции |
| R3 клавиатура | модуль `Keyboard`: стрелки, PageUp/Down; слушает `document`, `onlyInViewport: true` | **нет стрелок** в ядре 8.6 и 9-rc04 (`keydown` только для учёта Tab) | компонент `Keyboard` | **нет** (в `flicking.esm.js` 0 `keydown`) | стрелки на фокусе колоды |
| R4 a11y | модуль `A11y`: слайды `role="group"`, live region (`polite` без автопрокрутки), `aria-roledescription` опционально | в 8.6 — 0 `aria` в ядре; плагин `embla-carousel-accessibility` (region/group, roledescription, live) — **только 9.0 RC** | лучшая: корень `region` + `aria-roledescription="carousel"`, слайды `group`/`tabpanel` | **нет** (0 `aria-` в ядре) | `inert` у задних, `aria-*` есть, но с ошибками (2.4) |
| R5 reduced motion | **нет** (в пакете 0 упоминаний) — `speed: 0` вручную | нет | **да**: опция `reducedMotion`, по умолчанию `{speed: 0, rewindSpeed: 0, autoplay: 'pause'}` | нет | нет для варианта A (есть только у C) |
| R6 без фреймворка | да (ESM-ядро + веб-компонент `swiper/element`) | да | да | да | да |
| Лицензия | MIT | MIT | MIT | MIT | — |
| Живость | 41,9k ★; v14.3.0 — 2026-09-28; push 2026-10-16 | 8,4k ★; стабильная 8.6.0 — 2025-04-04; 9.0.0-rc04 — 2026-10-08 | 5,4k ★; v4.1.4 — **2022-11-09**; последний push — 2024-07-08 | 2,9k ★; 4.17.1 — 2026-09-30 | — |
| Размер JS, min+gz | **24,8 KB** (ядро + EffectCreative + Keyboard + A11y) + CSS ~1,3 KB | 7,6 KB (ядро) | 13,8 KB + CSS core 0,75 KB | 35,4 KB (с зависимостями `@egjs/*`, `@cfcs`) | ~1 KB (60 строк) |
| Доработка под нашу стопку | низкая: конфиг эффекта; но трансформы пишутся inline — мобильная раскладка через `breakpoints` в JS | высокая: стопку и клавиатуру писать самим | высокая: свой Transition-модуль | высокая | уже сделано; 5 правок (2.4) |

Источники строк: исходники пакетов `swiper@14.3.0` (`modules/effect-creative.mjs`, `effect-cards.mjs`, `keyboard.mjs`, `a11y.mjs`),
`embla-carousel@8.6.0` и `9.0.0-rc04` (`esm/embla-carousel.esm.js`), [embla-carousel-accessibility/Options.ts](https://github.com/davidjerleke/embla-carousel/blob/master/packages/embla-carousel-accessibility/src/components/Options.ts),
`@splidejs/splide@4.1.4` (`src/js/constants/defaults.ts`, `components/Elements/Elements.ts`, `components/Slides/Slide.ts`, `components/Media/Media.ts`),
`@egjs/flicking@4.17.1` и `@egjs/flicking-plugins@4.8.1` (`dist/plugins.esm.js`); репозитории
[nolimits4web/swiper](https://github.com/nolimits4web/swiper), [davidjerleke/embla-carousel](https://github.com/davidjerleke/embla-carousel),
[Splidejs/splide](https://github.com/Splidejs/splide), [naver/egjs-flicking](https://github.com/naver/egjs-flicking).

### 2.3. Умеет ли Swiper именно стопку с видимыми краями — проверка по исходникам

**EffectCards** (`swiper/modules/effect-cards.mjs`, v14.3.0). Параметры по умолчанию: `perSlideOffset: 8`, `perSlideRotate: 2`, `rotate: true`, `slideShadows: true`.
Для каждого слайда прогресс обрезается до ±4, сдвиг по X = `(perSlideOffset − |p|·0,75) · |p|` **процентов ширины слайда**
(для 1…4 задних: 7,25% → 13% → 17,25% → 20%), Z = −100·|p| px, поворот −2°·p, `z-index = n − |round(p)|`;
CSS модуля: `transform-origin: center bottom`, `overflow: visible`.
Вывод: края видны, но это **веер в обе стороны** — уже просмотренные карточки (p > 0) уходят влево симметрично будущим;
режим принудительно `centeredSlides: true`; смещение только по горизонтали (по вертикали — только при `direction: 'vertical'`);
карточки дальше 4-й лежат стопкой под 4-й. Односторонней «стопки скриншотов вверх-вправо» без хаков (скрывать `.swiper-slide-prev…`) он не даёт.

**EffectCreative** (`modules/effect-creative.mjs`). Трансформ слайда = `translate(next.translate · |p|)`, масштаб `1 + (1 − next.scale)·p`,
прозрачность так же, `p` обрезается до `limitProgress` (по умолчанию 1: «все слайды после prev/next в одном состоянии» — из `effect-creative.d.ts`);
`z-index = n − |round(p)|`; каждый слайд сначала возвращается на место первого (`−offset`), т.е. слайды лежат друг на друге.
Зависимость **линейная**, поэтому стопка прототипа воспроизводится конфигом один в один:

```js
effect: 'creative',
creativeEffect: {
  limitProgress: 3,                    // видно 3 задних
  perspective: false,
  next: { translate: ['4%', '-7%', 0], scale: 0.97 },     // 2-я: 4%/−7%/0.97, 3-я: 8%/−14%/0.94 …
  prev: { translate: ['-120%', 0, 0], opacity: 0 },       // просмотренная улетает влево
}
```

Вывод: **да, EffectCreative делает именно стопку с видимыми краями**; в официальных демо такой конфигурации нет
(все 6 вариантов на [swiperjs.com/demos/257-effect-creative](https://swiperjs.com/demos/257-effect-creative/core.html) — с `limitProgress` по умолчанию), вывод сделан по коду.

### 2.4. Прототип без библиотеки против лучшей библиотеки (Swiper + EffectCreative)

| | Прототип (CSS `data-pos` + ~60 строк) | Swiper 14 + EffectCreative + Keyboard + A11y |
|---|---|---|
| Вид стопки | то же самое (линейные 4%/−7%/0.97 на шаг) | то же самое, задаётся конфигом |
| Вес | 0 зависимостей, ~1 KB | +24,8 KB JS gz + ~1,3 KB CSS |
| Свайп | порог 60 px, тянется только верхняя карточка, задние не «подъезжают»; **во время перетаскивания действует `transition: transform .55s`** — карточка отстаёт от пальца; нет `setPointerCapture` | следование за пальцем всей стопкой, инерция, сопротивление |
| Клавиатура | стрелки на фокусе колоды — не конфликтует с главной (Three.js) | слушатель на `document`; надо следить, чтобы не перехватывал чужие стрелки |
| a11y | `inert` у задних — хорошо (уходят из дерева доступности и Tab-порядка, [MDN inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)); ошибки ниже | роли и live region из коробки, `inert` у неактивных — нет (только против ловушки фокуса в loop) |
| Reduced motion | нет у варианта A | нет, вручную |
| Мобильная раскладка | одной media-query в CSS | `breakpoints` в JS (трансформы inline) |

**Ошибки прототипа, найденные при сверке со спецификациями:**

1. **Клик по выглядывающему краю не работает.** Задние слайды получают `inert`, а у inert-элементов «не срабатывают события click»
   ([MDN inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)) — обработчик
   `slides.forEach(s => s.addEventListener('click', …))` мёртвый. Правка: ловить клик на колоде и по `document.elementsFromPoint`
   / геометрии определять задний слайд, либо положить поверх краёв отдельные `<button>` вне inert.
2. **`aria-roledescription` и `aria-label` на `<div data-deck>` без роли не будут озвучены.** ARIA 1.2: UA «MUST NOT expose»
   `aria-roledescription`, если у элемента нет валидной роли ([w3.org/TR/wai-aria-1.2/#aria-roledescription](https://www.w3.org/TR/wai-aria-1.2/#aria-roledescription));
   MDN: не поддерживается на `role="generic"` ([MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription)).
   Правка: `role="region"` на колоду (APG), имя без слова «карусель», `role="group"` на слайды (сейчас `<article>` — допустимо, но APG советует `group`).
3. **Нет live region.** APG: обёртка слайдов — `aria-live="polite"`, когда нет автопрокрутки. Правка: `aria-live="polite"` на счётчик или обёртку.
4. **Нет `prefers-reduced-motion` у варианта A.** Правка: при `reduce` — только `opacity`, без `transform`-перелёта.
5. **Отставание при свайпе.** На время перетаскивания снимать `transition` (класс `is-dragging`) и вызывать
   `setPointerCapture` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)); по желанию —
   сдвигать задние карточки пропорционально `dx` (то, что Swiper даёт даром), ~15–20 строк.

**Почему не нативный scroll-snap.** `scroll-snap-type` есть везде (Chrome 69, Firefox 99, Safari 11 — MDN BCD), но карточки
в скролл-контейнере лежат рядом, а не внахлёст; стопку из них делает только scroll-driven animations (`animation-timeline: view()`):
Chrome 115, Safari 26, Firefox — **159, сейчас бета, релиз 2026-10-27** (MDN browser-compat-data). Это прогрессивное улучшение,
не основа. View Transitions (`document.startViewTransition`: Chrome 111, Safari 18, Firefox 144 — Baseline 2025) для
переключения внутри стопки не нужны: хватает `transition` на `transform`.

### 2.5. Рекомендация

**Оставить прототип без библиотеки** и внести 5 правок из 2.4. Причины:
- лучшая библиотека для этой задачи — Swiper EffectCreative — по коду даёт **ту же самую** линейную стопку, что уже сделана на CSS;
  её реальный выигрыш — физика свайпа (следование за пальцем, инерция) и готовые роли/live region — закрывается ~20–30 строками;
- она добавляет 24,8 KB gz JS к странице портала, где сейчас JS почти нет, и пишет трансформы inline — мобильную раскладку
  пришлось бы переносить из CSS в JS;
- `prefers-reduced-motion` из коробки нет ни у Swiper, ни у Embla, ни у Flicking — делать самим в любом случае;
- Embla и Flicking стопку не умеют, клавиатуры в ядре нет; Splide лучший по a11y, но без релизов с 2022-11 и тоже без стопки.

**Запасной вариант:** если после правок свайп на iPhone всё равно ощущается «мёртвым» — Swiper 14 (`swiper` + `EffectCreative`,
`Keyboard`, `A11y`) с конфигом из 2.3, `speed: 0` по `matchMedia('(prefers-reduced-motion: reduce)')`, `keyboard.onlyInViewport: true`.

---

## Источники

- NN/g: [UX-design portfolios (Krause, 2019)](https://www.nngroup.com/articles/ux-design-portfolios/) · [Inverted Pyramid (Schade, 2018)](https://www.nngroup.com/articles/inverted-pyramid/) · [First 2 Words (Nielsen, 2009)](https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/) · [Numbers as Numerals (Nielsen, 2007)](https://www.nngroup.com/articles/web-writing-show-numbers-as-numerals/)
- STAR/CAR: [MIT CAPD](https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/) · [SFSU CAR worksheet](https://grad.sfsu.edu/sites/default/files/documents/Accomplishment-Statements-for-Resumes-CAR-Statement-Worksheet.pdf) · [Walden CAR](https://academicguides.waldenu.edu/careerservices/tailoringyourresume/CAR)
- Слайды: [Barbara Minto — Pyramid Principle](https://www.barbaraminto.com/) · [Assertion–evidence approach](https://www.assertion-evidence.com/)
- Примеры: [Stripe customers](https://stripe.com/customers), [Stripe × Twilio](https://stripe.com/customers/twilio) · [Vercel customers](https://vercel.com/customers) · [Linear customers](https://linear.app/customers), [Linear × Scale](https://linear.app/customers/scale) · [Framer Folyx](https://www.framer.com/marketplace/templates/folyx/) · [Framer Elias Vent](https://www.framer.com/marketplace/templates/elias-vent/)
- Спецификации: [WAI-ARIA APG Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) · [WAI-ARIA 1.2 aria-roledescription](https://www.w3.org/TR/wai-aria-1.2/#aria-roledescription) · [WCAG 2.2 — 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) · MDN: [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion), [inert](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert), [aria-roledescription](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription), [startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition), [setPointerCapture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) · [mdn/browser-compat-data](https://github.com/mdn/browser-compat-data) (`api/Document.json`, `css/properties/animation-timeline.json`, `scroll-snap-type.json`, `browsers/firefox.json`)
- Astro: [Images in content collections](https://docs.astro.build/en/guides/images/)
- Библиотеки: исходники npm-пакетов `swiper@14.3.0`, `embla-carousel@8.6.0`/`9.0.0-rc04`, `@splidejs/splide@4.1.4`, `@egjs/flicking@4.17.1`, `@egjs/flicking-plugins@4.8.1`; демо [Swiper EffectCreative](https://swiperjs.com/demos/257-effect-creative/core.html); GitHub API (звёзды, релизы, лицензии) на 2026-10-16.
