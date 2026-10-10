---
title: "Самообучение модели без данных"
description: "Одна из ключевых проблем - это дифицит качественных данных для обучения LLM. - актуальные методы обучения зависят от разметки данных - коллапс качества (деградация модели), если…"
date: "2025-08-12T07:40:27+00:00"
directions: ["ai-in-business"]
source: "telegram:corporate_ai"
source_url: "https://t.me/corporate_ai/23"
cover: "/media/reviews/samoobuchenie-modeli-bez-dannyh/82000e10dd6b5883.jpg"
imported: true
---
![](/media/reviews/samoobuchenie-modeli-bez-dannyh/82000e10dd6b5883.jpg)

![](/media/reviews/samoobuchenie-modeli-bez-dannyh/fed350dc3542641f.jpg)

Одна из ключевых проблем - это дифицит качественных данных для обучения LLM.
- актуальные методы обучения зависят от разметки данных
- коллапс качества (деградация модели), если обучаться на синтетических данных
- reasoning-датасеты покрывают очень малую область знаний
- нужно вручную строить функции расчета награды для RL

**Суть решения:**
Role playing из нескольких агентов. Каждый выполняет роль и в бесконечном цикле улучшается метрика.

1. (Proposer): генерирует вопрос по тематике.
2. (Solver): решает собственный вопрос.
3. (Validator): проверяет решение — через majority voting или unit-тесты (для кода).
4. (Learner): обновляет свои параметры на основе успешных примеров и ошибок.

Результат: постепенное улучшение reasoning-навыков и усложнение генерируемых задач.

Исследование:
- [Absolute Zero: Reinforced Self-play Reasoning with Zero Data](https://www.arxiv.org/pdf/2505.03335)
- [Self-Questioning Language Models](http://arxiv.org/abs/2508.03682)

Пример обучения:
[GitHub](https://github.com/lili-chen/self-questioning-lm)
