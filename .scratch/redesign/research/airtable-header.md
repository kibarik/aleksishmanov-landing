# airtable.com — верхняя навигация (измерено 1440x900 и 390x800; DOM + computed styles)

Ограничение: выпадающая панель (drawer) в headless-скриншотах не отрисовалась (виден только размытый фон и подчёркивание активного пункта), поэтому геометрия панелей взята из DOM/computed styles, а не с картинки. Анимацию открытия наблюдал только по состояниям (transform/opacity/transition).

## Каркас шапки
- `<header>` — `position: sticky; top: 0`, общая высота **121px = промо-баннер 42px + навигация 79px**; при скролле остаётся на месте (sticky), появляется тень `0 0 20px rgba(15,48,106,0.05)` и фон #FFF; прозрачна в верху страницы (hero просвечивает), transition `0.15s ease-in`.
- Промо-баннер (42px, светло-голубой фон): «Bring your Airtable data into Claude. **Try it now →**» (Haas 14px/18.2 weight 500, ссылка синяя rgb(37,79,173)) по центру + кнопка закрытия «×» 12x12px справа (x=1404).
- Навигационная полоса 79px: слева логотип-ссылка 140x32px (иконка + слово Airtable, x=32), далее основные пункты, справа действия.
- Шрифт: **Haas** (Neue Haas Grotesk-подобный), основной цвет #181D26 (rgb 24,29,38), без капса.

## Пункты и порядок (слева направо)
| Пункт | Тип | x,ширина |
|---|---|---|
| Platform ˅ | кнопка-drawer | 204, 81 |
| Solutions ˅ | кнопка-drawer | 308, 87 |
| Resources ˅ | кнопка-drawer | 417, 97 |
| Enterprise | прямая ссылка | 536, 81 |
| Pricing | прямая ссылка | 640, 54 |
| What's new | прямая ссылка (в покое выделен тёмно-синим цветом на скриншоте) | 716, 88 |
Типографика пунктов: Haas **16px / 20.8px, weight 500**, #181D26, расстояние между пунктами ~23px (padding ≈ 12px с каждой стороны). Dropdown-пункты имеют маленький шеврон «›» справа (12px).
Правая часть: **Book Demo** (outline, 140x55px, border-radius 12px, border 1px #181D26, текст 16/20.8 w500), **Sign up for free** (заливка #181D26, текст белый, 170x55px, radius 12px, padding 16/24), **Log in** (текстовая ссылка 47x21px, x=1361). Порядок: вторичная кнопка -> главная кнопка -> текстовый логин.
Hover/active: активный пункт — текст синий (#254FAD-тона) + тонкая 2px синяя линия-подчёркивание под пунктом; страница под шапкой при открытии получает **backdrop** `rgba(1,20,53,0.12)` с `backdrop-filter: blur(8px)`, `transition 0.15s ease-in`, клик по бэкдропу закрывает.

## Выпадающие панели (Drawer) — структура и группировка
Это **не классическое «мега-меню» на всю ширину, а боковые drawer-панели**: белая панель `position: fixed; top:0; left:0` (z-index 1), **ширина 738px, высота 100vh**, `padding-top 121px` (под шапкой); внутри колонка категорий; пункты второго уровня (где есть «›») открывают **вложенный drawer 702x900px** (внутри 480px колонка контента), который выезжает слева (`transform: translateX(-701.8px) -> 0`, opacity 0->1, `transition: all`) с кнопкой «Back» вверху. Пока закрыто — `visibility: hidden`, поэтому элементы недоступны для табуляции. Переключение drawer-ов: у каждого верхнего пункта своя панель (Platform / Solutions / Resources), одновременно открыта одна.
Элемент пункта: **заголовок 20px/26px weight 500 #181D26** + под ним описание **16px/20.8px, weight 400, цвет rgba(4,14,32,0.69)** (одна строка–две), высота строки 75px (без описания — 50px); у некоторых — иконка/логотип слева (интеграции: Slack, Google Drive, Salesforce, Jira, Zendesk). В конце групп — ссылка «See all …» (50px).
Группировка (то, что «читается»):
- **Platform**: «Platform & Products» — Airtable Platform, AI App Building, AI Agents, MCP, Scale (Hyperdb), «Platform Features ›» (-> вложенный: What's New, Automations, Governance & Security, Portals, Airtable AI, Databases, Interfaces, Reporting); «Tools» — «Integrations ›» (Slack, Google Drive, Salesforce, Jira, Zendesk, See all integrations), Download.
- **Solutions**: «Teams» — Product, Marketing, Project Management, Operations, Sales, Design & Creative, Human Resources, Finance; «Industries» — Media & Entertainment, Retail, CPG Manufacturing, Education, Technology, Agency & Professional Services. Внизу CTA-кнопки «Learn more» (/customer-stories) в виде outline 12px.
- **Resources**: «Explore» — Resources Hub › (Reports, eBooks, Webinars, Quick Reads, Demos, See all resources), Templates › (Project Management, Content Calendar, Event Planning, Product Roadmap, Organizational Chart, Resource Allocation, Social Media Calendar, Marketing Campaign Tracker, Product Launch, Content Strategy, Product Strategy, Inventory Tracker, Product Catalog, See all templates), AI Plays, Blog, Customer Stories, Videos, Events; «Learn & Support» — Airtable Academy, Airtable Community, Developers › (Dev Community, API Docs, Custom Extensions, Scripting), How-to guides, Support › (Help center, Contact Support); «Ecosystem» — Marketplace, Partners, Services; нижняя кнопка «Explore all resources».
- Прямые ссылки без подменю: **Enterprise, Pricing, What's new** — три страницы «решения о покупке».
Принцип: верхний уровень — 3 «ведра» + 3 прямых, дальше **заголовки групп (Teams / Industries / Explore / Learn & Support / Ecosystem)** + пункт = название + пояснение в одну строку.

## Sticky / scroll
- Шапка sticky во всё время скролла (не прячется при скролле вниз и не появляется заново) — всегда 79px навигации + баннер (если не закрыт); при закрытии баннера высота = 79px.
- Страница под шапкой при скролле: фон шапки белеет, добавляется мягкая тень.

## Мобайл (390px)
- Шапка 144px (баннер 42 + полоса ~102px): слева логотип 140x32 (x=24), справа «Sign up for free» (108x55) и кнопка «Open side menu» 32x32 (x=334). Пункты Platform/Solutions/Resources, Enterprise, Pricing, What's new, Book Demo и Log in уходят в тот же Drawer (на всю ширину, шаблон `Drawer-module_navDrawerMenu`); баннер на мобиле: текст 2 строки, «×» справа. Один и тот же компонент `Drawer` для десктопа и мобайла — вложенные панели «Back» работают как стековая навигация.

## Почему читается легко (измеримые причины)
1. Только 3 группирующих пункта + 3 прямых + 3 действия справа (9 интерактивных точек) при ширине 1440; пункты 16px/500, цвет #181D26 на белом (контраст ~16:1).
2. Явный визуальный приоритет действий справа: outline «Book Demo» < залитый «Sign up for free» < текст «Log in».
3. Drawer сгруппирован заголовками групп и каждый пункт имеет описание (20px заголовок + 16px приглушённый подзаголовок 69% непрозрачности) — меню объясняет, а не просто перечисляет.
4. Фон страницы затемняется/блюрится (8px) — внимание на панели; 0.15s ease-in без «показательных» эффектов.
5. Ограничение глубины: максимум 2 уровня (панель -> вложенная панель) и кнопка «Back».
