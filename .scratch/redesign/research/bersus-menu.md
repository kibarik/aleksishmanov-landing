# bersus.io — offcanvas menu (измерено 1440x900, desktop; источник: DOM, computed styles, brs-functions/navigation-desktop.js, brs-webgpu-layers/layers.js)

Стек: WordPress + Elementor Pro + GSAP (SplitText, CustomEase) + собственный WebGPU/WebGL2 плагин `brs-webgpu-layers`.

## Триггер и закрытие
- Кнопка `.brs-navigation-toggle` в шапке справа: иконка 22x22px, 4 кольца (диаметр 10px, border 3px, цвет #111; в тёмных секциях #fff) — 2x2 «квартет». Шапка: высота 70px, отступы по бокам 24px; слева логотип 80px-квадрат (webp) + слово BERSUS.
- Смена иконки: кольца `scale: 0`, иконка-крестик (`ui-close-01.svg`, 24x24) `scale 0->1` + `rotate 0->90deg`, 0.3s ease-in-out (CSS-переменные --transition-duration .3s / ease-in-out).
- На десктопе (>=1025px) меню открывается по **mouseenter** на невидимой зоне 88x88px в правом верхнем углу (`.brs-header-el__trigger-open-close`), без клика. Click по триггеру — закрывает; после закрытия повторное открытие блокируется до mouseleave (`reopenLocked`).
- Закрытие: крестик в правом верхнем углу (кликабельная зона 100x100px, `.brs-desktop-navigation__trigger-close`), клавиша Esc, ссылка "< Back to Home" внизу колонки. Крестик ~24px, чёрный, у правого верхнего угла (x~1420, y~24).
- Мобайл/планшет (<=1024px): другая реализация (navigation-mobile.js): `.brs-sec-main-navigation__main` fixed inset 0, `transition: transform .3s, opacity .3s ease-in-out`; список с кнопками "Open X submenu"/"Back to Main menu" (подменю внутри того же экрана, не оффканвас); на планшете 768-1024 сетка 2 колонки (nav-block на 2 строки слева, кнопка и футер справа).

## Анимация открытия (десктоп)
1. mouseenter -> `brs-layers-open` с координатами курсора; `desktopNav` получает `--active` (opacity 0->1 мгновенно, `transition: none`), body scroll lock.
2. Фон: WebGL-«чернильный» круг (canvas `#brs-layers-circle`, z -1, fixed во весь экран) **растёт из правого верхнего угла** (origin NDC (1,1); радиус = progress * maxRadius, maxRadius покрывает диагональ * 1.08). Скорость `menuOpenSpeed = 0.022` progress/кадр (~0.75s при 60fps), `menuCloseSpeed = 0.022`, мягкость края `menuSoftness = 0.025`. Цвет круга белый (shade 1.0, на кромке 0.97 «виньетка»).
3. Через **300ms** (`setTimeout`) запускается GSAP-таймлайн пунктов (`timeline.timeScale(1).play()`), стартует с паузы `0.7s` (`tl.to({}, {duration: 0.7})`).
4. Пункты меню: SplitText по символам (`.nav-char`), каждый пункт стартует за 0.32s до конца предыдущего. Символы: `from {scale 1.2, opacity 0, x 30}` -> `{1, 1, 0}`, `duration 0.3`, `stagger 0.02`, `ease "back.inOut(3)"`.
5. Кнопка "Get In Touch": `from {opacity 0, x 100}` -> 0, `duration 0.6`, `back.inOut(3)`, старт `button -= 0.28`.
6. Иконки (если есть): `y 30 -> 0`, 0.6s, stagger 0.05, back.inOut(3).
7. Крестик: opacity 0->1, 0.9s `power2.inOut`, стартует на 0.9s раньше метки (т.е. почти сразу).
8. Нижние ссылки (LinkedIn / Back to Home): `from {opacity 0, y 10}`, 0.2s, stagger 0.08, `power2.inOut`.
9. По окончании таймлайна (`onComplete`) -> `brs-desktop-navigation__img--active`: картинка справа-налево (см. ниже) получает opacity 0->1 за **0.15s ease-in-out**.
- Закрытие: `timeline.timeScale(3).reverse()` (в 3 раза быстрее открытия), картинка гасится сразу, затем круг схлопывается; финализация ждёт `vit-menu-closed` (таймаут 900ms); защитный интервал 1500ms до возможности нового открытия.
- Во время открытия шапка прячется (`brs-action-scroll-bottom` снимается), логотип в шапке становится #111 (`brs-header-el--nav-open`).

## Визуал внутри меню
- Файл: `https://bersus.io/wp-content/uploads/menu-all-seeing-eye-01.png` — PNG 929x943, 8-bit palette, 203 KB, **белый (почти невидимый на белом) силуэт «всевидящего глаза»**. Отображается как `<img>` в виджете `.brs-desktop-navigation__img` (`object-fit: contain`), ленивая загрузка (`brs-lazy-handle`, грузится при открытии, `BRS_Lazy.loadHandle('.brs-nav-hidden-background')`).
- Размещение: левая колонка, блок 768x720px, x=96..864, y=90..810 (на 1440x900; вертикально по центру, слева с отступом 96px). Текст — в колонке справа от x=960, перекрытия нет: сетка `.brs-desktop-navigation` = `grid 960.4px | 350px | 0` (картинка в 1-й колонке, пункты и кнопка — во 2-й). Картинка не под текстом, поэтому читаемость текста не страдает.
- Видимость глаза обеспечивает второй canvas `#brs-layers-ink` (z 2, `mix-blend-mode: difference`): флюид-симуляция (Navier-Stokes, fluidSimResolution 720, dye dissipation .872, velocity dissipation .19, maxRadius .045) рисует белые вихревые «чернильные» пятна за курсором; в их пределах разность с белой картинкой даёт чёрный силуэт. То есть глаз «проявляется» только там, где пользователь водит мышью. Это вывод из CSS/шейдеров; в headless-скриншоте WebGL не отрисовался (виден чистый белый фон + точка-курсор 8px).
- Кастомный курсор: canvas `#brs-layers-cursor` (fixed z 120): точка 8x8px; на меню/ссылках меняет форму (кольцо 28/30px, "view" 134x56, chevron-left/right, ring-pf 60x60).

## Типографика и состояния
- Пункты: **CalSans** (fallback sans-serif), `48px`, weight 700 (декларация; CalSans один вес), `line-height 52.8px` (1.1), `letter-spacing normal`, цвет `#0B0B0B`, шаг пунктов ~68.8px (padding вокруг), x=960. Список: Solutions, Services, Portfolio, Academy, Insights, About.
- Hover на пункте: подчёркивание текста + справа стрелка → (чёрная, ~24px, у правого края колонки 350px, x~1430/1.8). Transition на `a` — none (эффект через GSAP/JS и CSS), стрелка появляется мгновенно.
- Кнопка "Get In Touch": 350x91px, чёрная (#0b0b0b), скруглённая (~12px), зелёная точка-индикатор слева сверху, растровая «halftone» четверть-окружность слева снизу, текст белый CalSans ~28px по центру. Ссылка `/connect/`.
- Под кнопкой: "LinkedIn: @denbersus" (Figtree 600, ~16px) -> linkedin.com/in/denbersus; "< Back to Home" (Figtree ~13px) -> `/`.
- Подменю: Figtree для текста (body), CalSans для заголовков.

## Информационная архитектура (смысл)
Верхний уровень: 6 пунктов. Два из них — группы «намерений», остальные — прямые.
- **Solutions** (подменю-оффканвас, заголовок «What's the best match for your goals?»): 4 готовых пакета «под ключ» — eCommerce (/ecommerce/), Digital Growth (/digital-growth/), Online Schools (/online-schools/), Startup Kit (/startup/). Каждый = название CalSans + одно предложение-выгода. Внизу ссылка-переключатель «Need a standalone service?» -> открывает Services.
- **Services** (заголовок «What can I help you with?»): Design, Development, Marketing, AI & Automation (/design/, /development/, /marketing/, /ai-automation/) + описание на 14px Figtree 600. Внизу «Need a comprehensive turnkey solution?» -> Solutions. Т.е. две плоскости (пакеты vs отдельные услуги) связаны взаимными ссылками.
- **Portfolio** -> /portfolio/ ; **Academy** -> /academy/ (прямые).
- **Insights**: «Go to Insights Hub >» + 8 рубрик: Creative Marketing, AI & Automation, UI/UX Design, Development, Elementor Expert, Management, Case Studies, History of Web.
- **About**: About Me (/about/), My Team (/team/), Recognition (/recognition/), Testimonials (/recognition/#testimonials), Ask Bersus AI (/ai/), Contacts (/connect/).
- Служебные: CTA «Get In Touch» (/connect/), LinkedIn, Back to Home.

## Подменю (Elementor off-canvas, десктоп)
- Клик по Solutions/Services/Insights/About открывает полноэкранный оффканвас `.e-off-canvas` (fixed, z-index 2147483630, content 1440x900, фон #fff, overlay rgba(0,0,0,.5) с opacity 0), при этом главное меню «паркуется» (`navParkedForPopup`) и закрывается после закрытия подменю. Крестик остаётся в том же углу.
- Services-панель (1440x900): подпись «What can I help you with?» Figtree 18px/30.6px weight 500, #0B0B0B, по центру (y~255); 4 колонки по ~320px, заголовки CalSans **41px / 53.3px** #0B0B0B (Design x=222, Development x=450, Marketing x=771, AI & Automation переносится на 2 строки); описания Figtree 14px/22.4px weight 600 цвет #27282C, изначально **opacity 0, слова раскрываются на hover** (SplitText по словам, `stagger .05`, `duration .1`, на mouseleave reverse); внизу (y~700) ссылка-переключатель 14-16px.
- Появление списков в панелях: `.brs-popup-list__item` `from {opacity 0, y 5}` -> 0, `duration .4`, `stagger .08`, `ease power2.out`, старт через 100ms после открытия, сброс через 500ms после закрытия.
