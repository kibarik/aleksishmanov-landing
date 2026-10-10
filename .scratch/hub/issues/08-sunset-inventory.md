# 08: Перечень закрываемых проектов

**Type:** research
**Status:** resolved
**Blocked by:** None (can start immediately)

**Вопрос.** Что именно закрывается и что у каждого проекта есть: домен, хостинг, DNS, репозиторий, содержимое для переноса, аналитика.

**Известные кандидаты.**
- `kibarik/aishmanov-landing` — черновик лендинга «object-11» (vinext, Cloudflare, OpenAI Sites). Какой домен/адрес его обслуживает?
- `slides.aleksishmanov.ru` — `slides-catalog` (в README — GitHub Pages и CNAME, но DNS указывает на Timeweb 178.209.127.53; есть Dockerfile+nginx).
- `prompts.aleksishmanov.ru` — Timeweb 92.246.76.92, статическая выгрузка Next; где исходники?
- `blog.aleksishmanov.ru` — Teletype (CNAME `domains.teletype.in`).
- Прочее: другие репозитории `kibarik/*` и поддомены (уточнить у владельца; при необходимости — перечень DNS-записей зоны).

**Что нужно на выходе.** Таблица: проект → домен → хостинг → DNS → репозиторий → что переносим → адресная схема редиректа → что делать с репозиторием (архив).

## Answer

Подробно — `research/sunset-inventory.md`.
- Закрываются: `slides.` (Timeweb App Platform, автодеплой из `kibarik/slides-catalog`; GitHub Pages параллельно, но мёртв),
  `blog.` (Teletype, 30 статей + рубрики), `kibarik/aishmanov-landing` (живого адреса нет — только архив),
  пустой `kibarik/ai-oxudevelopment`. Под вопросом: `prompts.` (ранее отложен владельцем), `call.` (страница звонка).
- Корень, `slides.`, `call.` — 178.209.127.53, `prompts.` — 92.246.76.92: оба Timeweb Cloud App Platform (общий Caddy, не VPS).
  Корень деплоится автоматически из GitHub при push.
- Зона: регистратор RU-CENTER (оплачено до 2026-12-16), DNS SpaceWeb, почта Beget. `www.` не резолвится — старые ссылки на www мёртвы.
- Старый сайт (WordPress, 2024-12…2026-05) в Web Archive почти не сохранился.
- Открытые вопросы к владельцу — в конце файла.
