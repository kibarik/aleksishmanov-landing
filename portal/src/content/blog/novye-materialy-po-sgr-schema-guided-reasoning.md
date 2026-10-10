---
title: "Новые материалы по SGR - Schema-Guided Reasoning"
description: "SGR - это набор практик и патттернов от Рината Абдулина (LLM Underhood) Одна из ключевых сложностей - заставить LLM генерировать ответы в строго шаблонизированной форме благодаря…"
date: "2025-08-11T06:25:14+00:00"
directions: ["ai-in-business"]
source: "telegram:corporate_ai"
source_url: "https://t.me/corporate_ai/21"
imported: true
---
SGR - это набор практик и патттернов от Рината Абдулина (LLM Underhood)

Одна из ключевых сложностей - заставить LLM генерировать ответы в строго шаблонизированной форме благодаря Structed Output. Это дает преимущества при работы с моделью:
- воспроизводимость ответов
- валидируемость формы
- контроль качества

Ключевые паттерны для повышения качества:
- **Cascade**. Каждый этап использует результат предыдущего
- **Routing**. Выбор одного из нескольких путей на основе условий, входных данных или промежуточных результатов.
- **Cycle**. Итеративное выполнение шагов с повторной проверкой/модификацией до достижения заданного условия и запуском в многопоточном режиме.

Источники:
- [SGR Intro](https://abdullin.com/schema-guided-reasoning/)
- [SGR Patterns](https://abdullin.com/schema-guided-reasoning/patterns)
- [SGR Examples](https://abdullin.com/schema-guided-reasoning/examples)
