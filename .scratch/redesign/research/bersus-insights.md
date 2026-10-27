# bersus.io — Insights: категория и статья (измерено 1440x900; DOM + computed styles)

Общее: фон страницы #FFFFFF, текст #0B0B0B (основной) / #27282C (вторичный), шрифты CalSans (заголовки) + Figtree (текст). Шапка 70px, прозрачная; в футере общий шаблон. Скругления: «пилюли» 25px, карточки 28px.

## 1. Листинг категории — /insights/creative-marketing/ (Elementor archive template #4133 + JetEngine listing #4641; высота ~3720px)
- **Одна узкая колонка, без сетки и без картинок/обложек**. Контейнер x=445, ширина 540px (по центру 1440 при вьюпорте ~1430). Всё выровнено по левому краю x=445.
- Порядок сверху вниз:
  1. «< Back to Insights» — Figtree 16px/24px weight 500, #27282C (y=83).
  2. **H1 «Creative Digital Marketing»** — CalSans **53px / 63.6px (1.2), 700**, #0B0B0B, ширина 540 (переносится на 2 строки) (y=139).
  3. Вводный абзац (категории) — Figtree **18px / 30.6px (1.7), 400, #0B0B0B**, ширина 540px; ~6 строк: «Algorithms and trends change, but human nature remains constant. This section explores…» (y=301).
  4. Список из **5 карточек** (JetEngine grid item), шаг ~357-386px по высоте, без разделителей/границ, межкарточный отступ ≈ 60px:
     - заголовок-ссылка CalSans **26px / 28.6px, 700**, #0B0B0B (ширина до 540, на 1–3 строки);
     - строка тегов: «пилюли» Figtree **14px/22.4px, weight 500**, текст #0B0B0B, фон **#F5F5F5**, `border-radius 25px`, высота 30px (padding ≈ 4x16), расстояние между пилюлями ≈ 10px; у статьи может быть 1–4 тега (напр. «AI & Automation» «Creative Marketing»);
     - анонс Figtree **16px / 24px, 400, #27282C**, 5–6 строк, 540px;
     - мета-строка: две колонки «Time To Read / 3 mins» и «Posted On / <дата>»: подпись Figtree 14px/16.8px **700**, значение Figtree 14px/22.4px 600; x=445 и x=548;
     - справа от карточки (x≈545+540) круглая иконка-стрелка → (в кружке ~24px) — affordance перехода.
  5. Кнопка пагинации «+ Load More» — Figtree 18px/21.6px, 600 (подгрузка по клику, не бесконечный скролл).
  6. before-footer, footer.
- Контент 5 постов: «Realistic take on AI regulation», «Mandela Effect in digital marketing», «Five Eyes cyber agencies urge leaders to act as AI reshapes cyber threats», «The Frankenstein Factory: how siloed expertise is killing digital products» (4 тега), «Digital Marketing Glossary» (35 mins).
- Левый край страницы: тонкая стрелка «‹» вертикально по центру (x≈20, «Back», 18px/600) — кастомная навигация «назад».
- Читаемость: единственная колонка 540px (≈ 60–70 знаков), крупные интерлиньяжи (1.7 у вводного, 1.5 у анонсов), ничего кроме текста и пилюль; цветовые акценты только серые пилюли.

## 2. Статья — /insights/ai-automation/realistic-take-on-ai-regulation/ (single-post template #4338 + wp-post #23856; высота документа 3750px)
Три секции шаблона: header-блок (y 0–239) -> тело (y 239–2204, высота 1965) -> низ (y 2203–2880, 677px).
### Верх
- Хлебные крошки (y=89, x=203): «Insights Hub / AI & Automation» — Figtree 16px/24px, weight 500, #0B0B0B, разделитель «/».
- **H1 (CalSans 53px / 63.6px, 700, #0B0B0B), ширина 1024px**, x=203 (шире текстовой колонки, левый край общий).
- Пилюли категорий (как в листинге, #F5F5F5, radius 25px, высота 30px).
- Лид/excerpt: Figtree **18px / 30.6px, 400**, ширина **644px** (x=203).
- Мета: «Posted On / September 18, 2026» и «Time To Read / 3 mins» — подписи Figtree **16px/19.2px, 700**, значения Figtree 16px/24px 400; две колонки с шагом 181px (x=203 и x=384).
### Тело
- Текстовая колонка **x=203, ширина 644px**, Figtree **18px / 30.6px (1.7), 400, #0B0B0B** (абзацы), отступ между абзацами ≈ 24px. Эмодзи — картинкой (`1f602.svg` 18x18px).
- Справа от колонки (x≈1009) — **минимап-превью** (`minimap_23856_….jpeg`, 120x195px): уменьшенная картинка страницы/структуры статьи, (поведение при скролле не проверялось).
- Между шапкой и телом слева — «‹» стрелка назад (x≈20).
### Раздел «Author» (в самом конце тела, сразу после последнего абзаца; y≈1721–2048)
Карточка **644x328px** (та же ширина, что у колонки; x=203), фон **#F5F5F5**, **border-radius 28px**, padding **35px**, без обводки/тени. Внутри:
- Аватар **80x80px** (`den-bersus-avatar-small-01-1.webp`), позиция (35,35); на скриншоте — круглое фото (скругление в самой webp / маске, CSS radius 0).
- Справа от аватара (x=135): **«by Den Bersus»** — Figtree **23px / 29.9px, 700**, #0B0B0B — ссылка на /about/; под ним **«Fractional Head of Digital & Creative Director»** — Figtree 14px/22.4px, **600**, #0B0B0B.
- В правом верхнем углу карточки: стрелка → (иконка ~24px, ссылка на /about/).
- Био-абзац (y=135 от верха карточки, ширина 574px): Figtree **14px / 22.4px, 500, #27282C**: «Den builds comprehensive digital growth systems for tech companies, ecommerce, gamedev and startups. With 5+ years in C-level roles overseeing $7.8B in transactions and leading teams of 860+ people, backed by 28+ years of technical experience, he combines executive leadership with hands on expertise in design, development, AI, and marketing. His work has been recognized with industry design awards and federal medals.»
- Нижний ряд: 4 иконки соцсетей (LinkedIn, Instagram, TikTok, X), ~20x20px каждая, чёрные в скруглённых квадратах, расстояние ≈ 17px: linkedin.com/in/denbersus, instagram.com/denbersus, tiktok.com/@denbersus, x.com/denbersus.
### Низ: «Latest posts» + подписка (y 2203–2880, высота 677; два блока в ряд)
- **Левый блок «Latest Posts»**: 599x577px, x=203, фон **#0B0B0B**, **radius 28px**, padding 35/45/35/30. Заголовок «Latest Posts» — CalSans **26px/28.6px, 700, #FFF** (x=260). Далее **5 строк-постов** (вертикальный список, шаг ≈ 100px): каждая строка = малая метка-категория Figtree 14px/22.4px 500 #F5F5F5 (напр. «Development», «Development, Elementor Expert») над названием-ссылкой CalSans **18px / 21.6px, 700, #FFF** (названия до 2 строк, ширина ≤ 445px), слева у названия иконка-шеврон «›» (~12px). Нет дат, картинок, лидов. Посты: «PHP2Shell: How to Protect Your WordPress Site Now», «Optimizing WordPress Performance with Cloudways Device Detection», «How to Fracture 3D Models in Blender and Export to Three.js», «Optimizing Three.js: Handling Draw Calls, Instancing and Batching», «Realistic take on AI regulation» (в т.ч. текущая статья — список «последних», не «похожих»).
- **Правый блок «Join the Loop»** (подписка): 385x577px, x=842, фон #FFF, **border 1px solid #D8D7D8**, radius 28px, padding 35px. Сверху иконка-конверт `ui-envelope-01.svg` (44x25), «FREE» — Figtree 17px/20.4px 700; заголовок **«Join the Loop» — CalSans 36px / 43.2px, 700, #0B0B0B**; текст Figtree **14px / 19.6px, 300, #7C7C7C**: «Subscribe for exclusive access to my tailored knowledge base, inspiring content, the latest in tech, and practical tutorials that empower your growth.»; поле e-mail; кнопка «Sign Up» — Figtree 18px/21.6px 600, белый текст на чёрной кнопке; микро-текст 13px/18.2px #7C7C7C: «By submitting, you agree to receive email updates. Unsubscribe anytime.»
- Ниже — общие before-footer и footer (869px).
### Итоговая раскладка по ширине (1440)
- Колонка контента статьи 644px (x 203–847), «Latest» 599px + зазор 40px + «Join the Loop» 385px => общая ширина нижнего ряда 1024px (x 203–1227) = ширина H1. Т.е. вся статья строится на сетке 1024px; текст занимает левые 644px, правая часть — минимап.
