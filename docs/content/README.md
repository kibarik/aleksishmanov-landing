# Материалы сайта: правила и промты

Как писать статьи для aleksishmanov.ru, чтобы они попадали в топ по целевым вопросам, их цитировали ИИ-ассистенты и их было удобно читать людям. Все материалы — часть одной [методологии](/method/) вокруг проблемы «как построить IT-департамент, который быстро и качественно реализует пожелания бизнеса» (ADR 0006). Материалы пишет ИИ-агент (ADR 0004), владелец даёт опыт, позицию и решения.

| Документ | Зачем |
| --- | --- |
| [strategy.md](strategy.md) | Цель материалов, большая проблема и методология, путь читателя, эталон (PAF), форматы, метрики |
| [article-standard.md](article-standard.md) | Стандарт статьи: анатомия, «вау», артефакты, голос, оформление, шапка, факты |
| [seo-geo.md](seo-geo.md) | Поиск (Яндекс, Google) и ИИ-ответы: что подтверждено, что мифы |
| [quality-rubric.md](quality-rubric.md) | Рубрика приёмки и правило публикации |
| [prompts/brief.md](prompts/brief.md) | Шаблон брифа статьи |
| [prompts/write-article.md](prompts/write-article.md) | Промт автора |
| [prompts/review-article.md](prompts/review-article.md) | Промт ревьюера |
| [prompts/refresh-imported.md](prompts/refresh-imported.md) | Доработка импортированного поста |
| [prompts/cluster-plan.md](prompts/cluster-plan.md) | План набора статей внутри темы |
| [prompts/node-page.md](prompts/node-page.md) | Страница области или темы методологии |
| [prompts/grow-method.md](prompts/grow-method.md) | Следующий шаг роста методологии: найти пробел и подготовить бриф |

## Как выходит статья

1. **Узел методологии** — к какой теме прикрепится статья; если темы нет — `prompts/grow-method.md` и `prompts/node-page.md`.
2. **Бриф** — `prompts/brief.md`. Владелец заполняет «Опыт автора» и «Позицию автора» или оставляет пустыми.
3. **Черновик** — `prompts/write-article.md`, файл в `portal/src/content/blog/<slug>.md`.
4. **Проверка** — `npm run lint:content`: ошибки чинятся до ревью.
5. **Ревью** — `prompts/review-article.md` отдельным агентом, который не писал статью. Правило публикации — `quality-rubric.md`.
6. **Сборка и выкладка** — `npm run build`, затем `main` (деплой Timeweb). Проверка на проде: страница отдаёт свой title, а не главную (хостинг отвечает 200 на любой адрес).

## Проверка

```bash
npm run lint:content          # статьи, написанные на сайте; ошибки валят запуск
node scripts/lint-content.mjs --all          # весь блог, включая импорт — отчёт
node scripts/lint-content.mjs blog/<slug>.md # один файл
```

Пороги и список клише — в `scripts/lint-content.mjs` (`LIMITS`, `BANNED`); меняются вместе со стандартом.
