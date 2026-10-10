---
title: "Repowise"
description: "\"Your agent reads files. It does not understand your codebase\" - на Linkedin нашел пост решение Пытаюсь решить проблему с ужасным качеством работы с контекстом на GLM5 + Claude…"
date: "2026-04-19T13:25:05+00:00"
directions: ["ai-in-business"]
source: "telegram:ai_ossresearch"
source_url: "https://t.me/ai_ossresearch/145"
repo: "https://github.com/repowise-dev/repowise"
cover: "/media/tools/repowise/fa3f661748b3236d.jpg"
imported: true
---
![](/media/tools/repowise/fa3f661748b3236d.jpg)

![](/media/tools/repowise/25988b6ace0c6ec0.jpg)

![](/media/tools/repowise/c19e2410308a5638.jpg)

![](/media/tools/repowise/09fd3a5f76b2d1ca.jpg)

![](/media/tools/repowise/f1d02d81d917ddc4.jpg)

**"Your agent reads files. It does not understand your codebase"** - на Linkedin [нашел пост](https://www.linkedin.com/posts/raghav-chamadiya_the-biggest-problem-with-ai-coding-agents-share-7449371123152228352-hHx0?utm_source=share&amp;utm_medium=member_desktop&amp;rcm=ACoAADQRyfYBci13AGwX2cIDs70UdEx9oHPu200) решение

Пытаюсь решить проблему с ужасным качеством работы с контекстом на GLM5 + Claude Code. У меня в PET проекте с GIS аналитикой есть комбинированный монстр из 5-ти OpenSource проектов и одного FastAPI + Temporal. Этот монстр хорошо решает продуктовую задачу и легко поддерживается когда я сам пишу код с копайлотом. Но стоит отдать его в ClaudeCode агентов - выходит полный бред. А держать под себя целую экосистему с OpenDeepWiki, Onyx, WrenAI, DevFleet, Quocoe  мне слишком накладно...

**Какую проблему решает:**
Точность кодогенерации, снижение стоимости токенов. Через единый слой данных

**Что умеет:**
• граф зависимостей (как DeepWiki)
• git‑история (как [Entire.io](http://Entire.io/))
• wiki-дока (как Onyx)
• dead code (как review агенты)
• Запускается в одну команду
• Дает единый MCP контекст
• Не жрет столько ресурсов
• Поддерживает внешние LLM

[Репозиторий](https://github.com/repowise-dev/repowise)
