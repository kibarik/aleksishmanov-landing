---
title: "Tilt – удобный инструмент для микросервисов"
description: "Ссылка на доку Автоматически отслеживает изменения кода, пересобирает Docker-образы и применяет их в Kubernetes/Docker или локально — без ручного CI/CD Когда использовать?"
date: "2025-10-12T14:22:08+00:00"
directions: ["startups"]
source: "telegram:ai_ossresearch"
source_url: "https://t.me/ai_ossresearch/70"
cover: "/media/tools/tilt-udobnyy-instrument-dlya-mikroservisov/4bf60c003aa34685.jpg"
imported: true
---
![](/media/tools/tilt-udobnyy-instrument-dlya-mikroservisov/4bf60c003aa34685.jpg)

[Ссылка на доку](https://docs.tilt.dev/api.html)

Автоматически отслеживает изменения кода, пересобирает Docker-образы и применяет их в Kubernetes/Docker или локально — без ручного CI/CD

⚡ Когда использовать?
✅ Быстрая сборка и деплой Docker-контейнеров
✅ Локальная отладка микросервисов в Kubernetes
✅ Ускорение командной разработки с DevOps-инфраструктурой

👨‍💻 Пример из практики:
Поднимали проект, внутри которых отдельные docker-compose файлы: N8N, Supabase, helicone и наша платформа.

Прописали все docker-compose в Tiltfile, теперь в одном месте все мониторим по проекту: статус, логи, билды, запуск, закрытие. Не нужно разные терминалы использовать
