---
title: "AI App Sec и безопасность AI-кода"
description: "Semgrep - анализирует код на уязвимости, помогает не пропустить плохие решения от AI-агента в прод и подсвечивает что и где может пойти не так. Приоретизирует ошибки и риски."
date: "2026-05-02T17:29:17+00:00"
directions: ["ai-in-business"]
source: "telegram:corporate_ai"
source_url: "https://t.me/corporate_ai/62"
cover: "/media/reviews/ai-app-sec-i-bezopasnost-ai-koda/936cc28e2d7830a4.jpg"
imported: true
---
![](/media/reviews/ai-app-sec-i-bezopasnost-ai-koda/936cc28e2d7830a4.jpg)

![](/media/reviews/ai-app-sec-i-bezopasnost-ai-koda/f9c33a0cfcdd12ab.jpg)

![](/media/reviews/ai-app-sec-i-bezopasnost-ai-koda/cf812470847ce6b5.jpg)

[Semgrep](https://github.com/semgrep/semgrep) - анализирует код на уязвимости, помогает не пропустить плохие решения от AI-агента в прод и подсвечивает что и где может пойти не так. Приоретизирует ошибки и риски. Содержит огромную библиотеку статических анализаторов. Подходит для стартапов, вместо тяжелого SonarQube

**Как работает**
• Поиск уязвимостей
• AI-вайбкодинг в проде
• Подсвечивает проблемы в репозитории

**Как запустить:**
• Копируете .yml в Github Actions
• Распаковываете архив [semgrep.zip](http://semgrep.zip/) в /config папку проекта (кастомные правила под себя настроил)
• Подключаете semgrep токен, если хотите полный аудит проводить

**Результат:**
Перед отправкой коммита видите уязвимости, можете их AI-агентом исправить. Если же упустили - PullRequest подсветит что и где вы не заметили.

PS Если бюджет позволяет - купите про версию, там из коробки AppSec агент придет и Review
