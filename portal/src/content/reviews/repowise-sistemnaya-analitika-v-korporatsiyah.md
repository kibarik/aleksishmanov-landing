---
title: "Repowise - системная аналитика в корпорациях"
description: "Анализ огромных проектов на дешевой модельке и токенах. В корпорации главная боль — огромный контекст экосистемы: где что находится, как передаются данные и почему простые задачи…"
date: "2026-04-30T14:24:16+00:00"
directions: ["ai-in-business"]
source: "telegram:corporate_ai"
source_url: "https://t.me/corporate_ai/52"
also_in: ["https://t.me/ai_pmf/99"]
cover: "/media/reviews/repowise-sistemnaya-analitika-v-korporatsiyah/0edfbb025a1645db.jpg"
imported: true
---
![](/media/reviews/repowise-sistemnaya-analitika-v-korporatsiyah/0edfbb025a1645db.jpg)

![](/media/reviews/repowise-sistemnaya-analitika-v-korporatsiyah/b4b15ee99caa5154.jpg)

![](/media/reviews/repowise-sistemnaya-analitika-v-korporatsiyah/0903f8222cbc82cd.jpg)

![](/media/reviews/repowise-sistemnaya-analitika-v-korporatsiyah/6ca7032edb39fede.jpg)

![](/media/reviews/repowise-sistemnaya-analitika-v-korporatsiyah/bf4ef93211ba8c32.jpg)

Анализ огромных проектов на дешевой модельке и токенах.
В корпорации главная боль — огромный контекст экосистемы: где что находится, как передаются данные и почему простые задачи решаются криво.  Базовый LLM модельки не справляются с задачей  - «Построй C4 L3 диаграмму и объясни Dataflow для ТОП-5 API запросов».

Тестовый репозиторий - это 2.7 млн токенов информации. Базовый LLM модельки даже в сжатом контексте упираются в лимит( А базовые RAG-механизмы дают кривой контекст

**Repowise тут лидер:**
8ч индексировался, построил граф на 27к+ нод, 41к связей, 550 документов. Результат - вау. Haiku за 1к токенов выдал корректную C4 диаграмму за одну минуту без каких-либо подсказок. GLM5 за 5к токенов — полная схема со всеми техническими деталями.

И всё это на MacBook Air M3 локально. В режиме MCP сервера нагрузки не замечаю вообще.

**Стек эксперимента:**
• [repowise](https://github.com/repowise-dev/repowise)
• [caveman](https://github.com/JuliusBrussee/caveman)
• [serena](https://github.com/oraios/serena)
• [superpowers](https://github.com/obra/superpowers)
• Claude Code
• GLM5 от [z.ai](http://z.ai/)
