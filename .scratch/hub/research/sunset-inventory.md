# Перечень закрываемых проектов (тикет 08)

Снимок на 2026-10-05. Только чтение: DNS (`dig` через 1.1.1.1 и авторитетный `ns1.spaceweb.ru`), CT (crt.sh + certspotter),
`whois`, `curl -sI`, публичный GitHub API (без `gh`: на Mac он не установлен, поэтому **приватные репозитории kibarik не видны**).

## Зона aleksishmanov.ru

- **Регистратор:** RU-CENTER (nic.ru), создан 2024-12-16, **оплачен до 2026-12-16** — продлить до переезда.
- **DNS-хостинг:** SpaceWeb (`ns1/ns2.spaceweb.ru`, `ns3/ns4.spaceweb.pro`), AXFR закрыт — полный список записей только из панели.
- **Почта:** MX `mx1/mx2.beget.com`, TXT `v=spf1 redirect=beget.com`, DMARC нет. При любой правке зоны MX и SPF не трогать.
- **Найденные имена** (CT + перебор частых имён): `aleksishmanov.ru`, `www`, `slides`, `prompts`, `blog`, `call`, `harness`, `browser.harness`.
  crt.sh отставал (не знал `slides` и `harness`), certspotter дал полный список. Wildcard-записи нет.
- **`www.aleksishmanov.ru` не резолвится**, хотя с 2024-12 по 2026-03 сертификаты выпускались на корень+www (старый сайт
  на шаред-хостинге, адреса в стиле WordPress). С 2026-05 сертификат только на корень (Caddy/Timeweb). Старые ссылки на `www.` сейчас мёртвые.
- **Хостинг сайтов:** 178.209.127.53 (корень, `slides.`, `call.`) и 92.246.76.92 (`prompts.`) — оба Timeweb (AS9123), `server: Caddy`.
  На любой чужой Host оба IP отвечают `308 → https://<host>/` с подсказкой `*.twc1.net` — это общий вход Timeweb Cloud
  **App Platform** (мультиарендный Caddy), а не личный VPS. Тип приложения (фронтенд или Docker) видно только в панели.
- Старый сайт (2024-12 … 2026-05) в Web Archive не сохранился: в CDX один снимок `www → 301` от 2024-12-31.

## Таблица проектов

| Проект | Домен / адрес | Хостинг | DNS-запись | Репозиторий | Как деплоится | Что переносим | Схема редиректа | Репозиторий после |
|---|---|---|---|---|---|---|---|---|
| **Основа:** лендинг | `aleksishmanov.ru` | Timeweb App Platform, 178.209.127.53, Caddy; LE (YE1), до 2026-12-11; http→https 308; любой путь → `index.html` 200 (SPA-фолбэк) | A 178.209.127.53 | `kibarik/aleksishmanov-landing` (pub) | автодеплой из GitHub при push (Last-Modified 14:37:38 MSK, коммит `cc3f137` 14:36:28) | — (остаётся) | сюда ведут все 301 | оставить, основа |
| Каталог слайдов | `slides.aleksishmanov.ru` | тот же Timeweb 178.209.127.53, Caddy; LE до 2026-12-10; свой 404 с кодом 404 | A 178.209.127.53 | `kibarik/slides-catalog` (pub) | **реально — Timeweb**, автодеплой из GitHub (Last-Modified = время коммита `a380eaa`). Параллельно на каждый push идёт мёртвый деплой GitHub Pages (окружение `github-pages`, `CNAME`, `.nojekyll`; `kibarik.github.io/slides-catalog` → 301 на slides.). Dockerfile+nginx (с 2026-09-11) живой ответ не обслуживает: отдаёт Caddy с его ETag | 4 презентации (`claude-desktop-zai-macos`, `po-workspace-bft-plugin`, `sprint-under-manager`, `okr-quarter-planning`), `instructions/`, короткие `i/claude/`, `i/helper/`, `components/` (виджеты воркшопа), `og-cover.png`, обложки `cover.png` | `slides./` → `/slides/`; `slides./<id>/` → `/slides/<id>/`; `slides./i/<x>/` → `/slides/i/<x>/` (или по смыслу); прочее → `/slides/` | архивировать после переноса; перед этим выключить Pages и убрать `CNAME`/Dockerfile |
| Промты | `prompts.aleksishmanov.ru` | Timeweb App Platform, **92.246.76.92** (другой узел), Caddy; LE (YE2) до 2026-12-12; SPA-фолбэк (`robots.txt`, `sitemap.xml` отдают главную) | A 92.246.76.92 | **не найден** среди публичных kibarik/*; локально тоже нет → приватный репозиторий или загрузка архивом | Next.js 14.2.35 `output: export`, `trailingSlash` (без слэша → 308), статика; ~1 ₽/мес со слов владельца | 69 промтов `/prompts/<slug>/` (тексты уже в `sources/prompts-md/`), аватар `assets/authors/` | `prompts./` → `/prompts/`; `prompts./prompts/<slug>/` → `/prompts/<slug>/` | после переноса — архив (сначала найти исходник). NB: `sources/README.md` — «отложено решением владельца 2026-10-05» |
| Блог Teletype | `blog.aleksishmanov.ru`; родной адрес `teletype.in/@aleksishmanov` (302 на blog.) | Teletype, `domains.teletype.in` → `gw0.teletype.in` 37.46.123.78 (AltusHost, NL); `server: Teletype/4.41.26`; LE до 2026-11-30 | CNAME `domains.teletype.in` | нет (платформа) | редактор Teletype | 30 статей + 3 рубрики `/+…` (sitemap Teletype = 30 статей + корень, совпадает с `sources/blog-teletype/urls.txt`); RSS `/data/rss`, Atom `/data/atom` | `blog./` → `/blog/`; `blog./<slug>` → `/blog/<slug>/`; `blog./+<рубрика>` → `/blog/` или страница направления; `blog./data/rss`,`/data/atom` → лента сайта | — (статьи на Teletype скрыть/удалить после переноса, см. раздел Teletype) |
| Черновик «object-11» | **живого адреса нет** | — | — | `kibarik/aishmanov-landing` (pub, 1 коммит 2026-09-11) | vinext + `@openai/sites-vite-plugin` + Cloudflare vite-plugin, `.openai/hosting.json` (d1/r2 = null). README: «No external publication», превью только localhost:3000. Деплоев в GitHub нет, ни один DNS не указывает на Cloudflare | идеи/тексты по желанию (ссылки на те же площадки) | не нужен | архивировать |
| Страница звонка | `call.aleksishmanov.ru` | Timeweb 178.209.127.53, Caddy; LE с 2026-09-03 | A 178.209.127.53 | не найден среди публичных (приватный или загрузка) | статика, Last-Modified 2026-09-03 | одна страница «Звонок с Алексеем Ишмановым» с кнопкой на комнату MTS Link | `call./` → `/call/` (если владелец закрывает) | — (решение владельца) |
| Пустой репозиторий | — | — | — | `kibarik/ai-oxudevelopment` (pub, size 0, создан 2026-05-17 — в день первого сертификата `prompts.`) | — | — | — | архивировать/удалить по решению владельца |

## Эталон: prompts.aleksishmanov.ru

Модель, которая нравится владельцу: Next.js 14 со статическим экспортом (`output: export`, `trailingSlash`), контент — файлы,
на выходе чистая статика, хостинг — Timeweb App Platform (~1 ₽/мес со слов владельца). Минусы этого же устройства:
`robots.txt` и `sitemap.xml` отдают главную (SPA-фолбэк Caddy), настоящего 404 нет — то же ограничение, что у основного домена.
Каталог слайдов на том же Timeweb отдаёт свой 404 с кодом 404 — значит, поведение зависит от типа/настроек приложения (тикет 01).
Исходный репозиторий prompts среди публичных `kibarik/*` не найден.

## Открытые вопросы к владельцу

1. Тип приложений в панели Timeweb App Platform у корня, `slides.`, `call.` и `prompts.` (фронтенд/Docker) и откуда деплоятся `prompts.` и `call.` (приватный репозиторий?).
2. `prompts.`: в `sources/README.md` записано «исходники prompts — отложено (решение владельца 2026-10-05), в объединение пока не входит»,
   а новое решение — «все остальные проекты закрываются». Переносим промты сейчас или позже?
3. `call.aleksishmanov.ru` (страница звонка через MTS Link) — закрыть с редиректом на `/call/` или оставить?
4. `kibarik/ai-oxudevelopment` (пустой) — архивировать или удалить?
5. Домен оплачен до 2026-12-16 (RU-CENTER) — продлить. DNS у SpaceWeb, почта у Beget: при правках зоны MX/SPF не трогать.
6. Приватные репозитории `kibarik/*` не проверены (на Mac нет `gh`).
