---
title: "MetaMCP & PlexusMCP & FastMCP"
description: "OpenSource пространства для организации MCP-хабов в организации и централизованного контроля MetaMCP - помогает настроить централизованный хаб всех MCP-серверов в одной…"
date: "2025-11-15T21:44:16+00:00"
directions: ["ai-in-business"]
source: "telegram:ai_ossresearch"
source_url: "https://t.me/ai_ossresearch/115"
repo: "https://github.com/Super-I-Tech/mcp_plexus"
cover: "/media/tools/metamcp-plexusmcp-fastmcp/cee6955c886e6960.jpg"
imported: true
---
![](/media/tools/metamcp-plexusmcp-fastmcp/cee6955c886e6960.jpg)

![](/media/tools/metamcp-plexusmcp-fastmcp/4a44d0c86eb95492.jpg)

OpenSource пространства для организации MCP-хабов в организации и централизованного контроля

**MetaMCP** - помогает настроить централизованный хаб всех MCP-серверов в одной организации
**PlexusMCP** - также как metaMCP, только с поддержкой Multitenancy доступов к MCP

👨‍💻 Задача
Организация AI пространства для продуктовой команды

Без инструментом
1. Каждый сотрудник себе локально поднимает MCP-сервера
2. Каждый сотрудник настраивает McpSetup JSON в своем пространстве
3. Доступы MCP равны доступам аккаунта сотрудника

С инструментами
- через metaMCP/PlexusMCP настраиваются доверенные MCP-сервера
- каждому MCP выдаются определенные настройки
- все MCP разделены по namespace и мониторятся
- на каждый MCP устанавливается мониторинг
- единый API для доступа ко всем известным MCP-серверам

Отличия обоих фреймворках на скриншоте. MetaMCP не дает Multitenancy проверку, Plexus из коробки поддерживает и позволяет на одном сервере держать независимые секреты разных компаний
