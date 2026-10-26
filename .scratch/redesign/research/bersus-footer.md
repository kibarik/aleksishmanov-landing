# bersus.io — footer (измерено на /insights/creative-marketing/, 1440x900)

## Как переиспользуется
- Это Elementor Theme Builder template типа **footer** (`elementor-location-footer`, id 4523), одна и та же разметка на всех страницах. Перед ней — template **before-footer** (id 19187, высота 0, скрытый текст «About | Solutions | Services | Insights» — служебный/SEO-блок). Шапка — template header id 2544. То есть один шаблон, подключённый глобально через условия показа.
- Класс `.brs-footer.brs-section--dark` — помечен как тёмная секция: ScrollTrigger переключает цвет шапки (иконка/логотип белые) на время, пока футер под шапкой; плюс при приближении (`top center`) к шапке добавляется `brs-header-el--footer-close`: кнопка меню и подпись логотипа уходят `scale 0` (0.3s ease-in-out), логотип остаётся.
- На <=1024px мобильное меню (`show-mobile-nav`) временно скрывается, когда футер вошёл в зону (top <= bottom-100px).

## Каркас
- Внешний `.brs-footer` 1400px (на 1440 -> отступы 15px по бокам), высота 798px (один экран). Внутренний `.brs-footer__wrap`: фон **#0B0B0B**, `padding 60px 64px 0`, **border-radius 62px 62px 0 0** (скруглённая «верхняя крышка», сверху выступает белая страница); сверху по центру маленькая светлая «ручка-пилюля» ~50x7px (y=+16).
- Сетка `.brs-footer__grid`: **3 колонки 396px | 396px | 420px**, gap 50px по строкам / 30px по колонкам, ширина 1272px (x 79..1351).
  1. Левая колонка `brs-footer__scroll-wrap`: скроллируемый внутри «список-карточек» (высота окна 678px, внутри контент 1003px, padding 32/16). Скролл **не нативный**: GSAP `quickTo(inner,'y',{duration .3, ease 'power2.out'})`, скорость от колеса `wheelSensitivity .5`, смещение курсора у верхнего/нижнего края (`zoneFraction .15`, `maxHoverSpeed 2`) тоже прокручивает; свой кастомный скроллбар 8px, справа 20px, фон rgba(255,255,255,.1), ползунок rgba(255,255,255,.3 -> .5 active), radius 6px. Только >1024px. Левая колонка визуально — полупрозрачная панель (светлее фона), карточки по 16px radius, padding 16px.
  2. Средняя колонка: **иллюстрация** `bersus-fist-01.png` (3D-рендер хромированного кулака с татуировкой, ч/б), блок 380x630px, x=513 (по центру страницы), прижат к низу, обрезается нижним краем экрана. Ленивая загрузка (`brs-lazy-placeholder.svg` -> `data-src`).
  3. Правая колонка 420px (`brs-footer__right-top` 340px: подгрид 150px | 165px, gap 25px).
- Декоративный слой `.brs-footer-noise` (canvas, mix-blend-mode soft-light, opacity 1, абсолютный, 1400x869) — анимированный «шум плёнки» поверх футера (параметры `pageNoiseV2Opacity .45, Fps 24, blend soft-light`).

## Контент (порядок сверху вниз)
Левая панель (ссылки по 14px, заголовки — группы с подчёркиванием):
- **Solutions**: Marketing 3D Websites, eCommerce, Online Schools, For Startups
- **AI Solutions**: Creative AI Workflows, Knowledgebase & Tuning, Custom AI Agents, Operations Automation, Chatbots For Websites, Bespoke MCP Servers
- **Design**: Brand Identity, UX Design, UI Design, Bespoke 3D, Creative Visuals, Motion Design, Email Templates, Photography
- **Marketing**: Organic Search Visibility, Reputation Management, Email Marketing, Advanced Analytics, Paid Ads, Conversion Optimization, ASO, Intent Data Tools, Gamification
- **Development**: Custom Features, WordPress Plugins, Integrations, Elementor Expert, Performance Optimization

Правая верхняя часть, 2 колонки:
- col 1: **:: Portfolio** (+ «My selected works. Strategies, websites, campaigns, mobile apps.»), **Insights** (8 рубрик: Creative Marketing, AI & Automation, UI/UX Design, Development, Elementor Expert, Management, Case Studies, History Of Web)
- col 2: **Academy** (+ «Bridge the gap between business, design, and tech.»), **About** (My Story, Team Behind, Recognition, Contacts)
Правая нижняя часть:
- Кнопка **Get In Touch** 250x59px (стекло: bg rgba(255,255,255,.05), radius 8px, текст Figtree 18px белый, box-shadow 0 15px 15px rgba(0,0,0,.3), розовое свечение (magenta glow) сверху/снизу кнопки), красная/розовая точка в правом углу
- «Follow me» + иконки LinkedIn, Instagram
- Юр.строка: Cookie Policy · Privacy Statement · Terms of Use (маленький текст, разделители)
- Лого-лейбл «Made with pure love.» (`footer-label-01.webp`, 260x28 -> рукописная каллиграфия белая)
- «© Den Bersus, 2026» + QR-код `qr-mobile-02.webp` 60x71 (подпись «Go mobile») в правом нижнем углу
- Кнопка «наверх» (`#totop`, круглая стрелка ↑) в правом верхнем углу футера, ~20px.

## Типографика
- Заголовки групп/разделов: **CalSans 28px / 30.8px (1.1), #fff**, подчёркнутые.
- Ссылки/описания: **Figtree 14px / 19.6px (1.4), weight 300**, цвет #D8D7D8 (описания); ссылки по умолчанию #C36 (rgb 204,51,102) и белеют/подсвечиваются на hover (в состоянии покоя на скриншоте — белые).
- Кнопка: Figtree 18px.

## Анимации
- Нет входной анимации «всего футера» как блока; footer просто часть потока страницы (`brs-footer--visible` класс на старте).
- Анимированы: внутренний hover/wheel-скролл левой панели (см. выше), шум-слой, кастомный курсор, и реакция шапки (уход кнопки меню/подписи `scale 0`, смена цвета на светлый).
- На <=1024px левая скролл-панель отключена (js `if innerWidth <= 1024 return`) — колонки перестраиваются в стопку.
