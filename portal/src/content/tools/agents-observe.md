---
title: "Agents-observe"
description: "Система для отслеживания активностей в Claude Code, понимать какие активности, вебхуки и сессии Как использую?"
date: "2026-04-11T17:42:27+00:00"
directions: ["ai-in-business"]
source: "telegram:ai_ossresearch"
source_url: "https://t.me/ai_ossresearch/139"
repo: "https://github.com/simple10/agents-observe?tab=readme-ov-file"
cover: "/media/tools/agents-observe/b613f2211d53126e.jpg"
imported: true
---
![](/media/tools/agents-observe/b613f2211d53126e.jpg)

![](/media/tools/agents-observe/e016331b2af04654.jpg)

Система для отслеживания активностей в Claude Code, понимать какие активности, вебхуки и сессии

**Как использую?**
У меня много автоматизации построено вокруг ClaudeCode, чтобы не писать низкоуровневую логику оркестрации - завязываюсь на хуки, субагентов и тулы клода.

**Главная проблема:**
Claude иногда выдает полную дичь и делает много лишнего, нужно на уровне промтов отслеживать и дебажить вызов правильных MCP, тулов и сервисов

**Решение:**
Через Observe отслеживаю активности, дальше дебажу то что мне нужно, выкатываю конфиг на тесты
