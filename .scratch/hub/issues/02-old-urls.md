# 02: Полный список старых адресов aleksishmanov.ru и blog.

**Type:** research
**Status:** resolved
**Blocked by:** None (can start immediately)

**Вопрос.** Какие адреса когда-либо были на `aleksishmanov.ru` и `blog.aleksishmanov.ru` и на что ссылаются люди —
чтобы каждому дать точный 301.

**Что уже есть.** В выгрузках Telegram/Teletype ~40 адресов статей Teletype (`/<slug>`, рубрики `/+<рубрика>`, `/data/rss`)
и адреса старого сайта на корне в стиле WordPress (`/sgr-автоулучшение-schema-guided-reasoning/`, `/corporate-nocode/`).

**Что нужно на выходе.** `old-urls.csv`: адрес, источник (Wayback CDX, Telegram, Teletype RSS/главная, sitemap), есть ли текст
для переноса. Отдельно — какие статьи Teletype не скачаны (скачано 10 из ~30–40) и почему.

**Подсказки.** Wayback Machine CDX API по обоим хостам; полный обход Teletype (`fetch_sources.py teletype` докачивает).

## Answer

Список — `research/old-urls.csv` (180 строк; колонка `status_now` заполнена частично — проверить заново при настройке редиректов, тикет 09).
- `blog.`: все 30 статей Teletype (sitemap Teletype = 30 статей, все скачаны в `sources/blog-teletype/articles/`), 9 адресов рубрик `/+…`,
  ленты `/data/rss` и `/data/atom`. Раньше было скачано 10 — докачано.
- Корень `aleksishmanov.ru`: 3 статьи старого WordPress-сайта — `/sgr-автоулучшение-schema-guided-reasoning/`, `/corporate-nocode/`,
  `/solo-founder-saas-leads` (последняя есть в блоге Teletype). **Текста SGR и corporate-nocode нет нигде** (ни Wayback, ни Common Crawl) —
  только анонсы в Telegram. Главная WordPress есть в Wayback (13 снимков 2024-12-31…2025-03-31).
- `slides.`: 15 страниц + ассеты; `prompts.`: 70 страниц (69 промтов + главная); `teletype.in/@aleksishmanov/…`: 4 статьи.
- `www.aleksishmanov.ru` не резолвится.
- Вывод для 09: точные 301 нужны для ~120 адресов-страниц; текст SGR придётся писать заново (как и предлагал документ — «с вашим экспериментом»).
