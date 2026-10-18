---
title: "Команда агентов"
question: "Какие задачи IT-команды можно отдать ИИ-агентам и что не отдавать никому?"
description: "Три класса агентов, карта делегирования, корпоративная безопасность и доля работы, которая реально уходит агентам."
level: "topic"
parent: "postavka"
order: 10
status: "draft"
materials: ["blog/ai-agents-evolution-architecture-real-world-applications", "blog/beyond-the-gang-of-four-practical-design-patterns-for-modern-ai", "blog/agentgateway-opensource-sloy-dlya-zaschity-kommunikatsii-mezhdu", "reviews/kagent-opensource-platforma", "reviews/mbti-komanda-agentov-eksperiment-s-meta-promtingom"]
date: "2026-10-18"
---
Тема отвечает на вопрос руководителя, который уже попробовал одного ИИ-ассистента и хочет большего: какие задачи команды отдать агентам, как их распределить и что не отдавать никому.

Ключевая мысль из гайда: агенты бывают трёх классов, и их нельзя смешивать. Агент над репозиторием (Claude Code) работает по команде и даёт одинаковый результат на одних правилах. Постоянный агент с памятью (Hermes Agent) работает по расписанию и учится на повторах. Шлюз мессенджеров (OpenClaw) видит поток в чатах и почте, но может действовать от вашего имени. Отсюда правило: самообучающиеся агенты собирают и готовят, агент с жёсткими правилами считает, человек подтверждает запись между ними. Обещания наружу, изменение правил, отправка писем от вашего имени и разговоры про даты не делегируются никому. Права агента начинаются с чтения, а список тех, кто может ему писать, ограничен: агент, доступный всем, выполняет чужие инструкции. Общая рамка — в области [«Поставка»](/method/postavka/).

Как читать материалы:

1. [AI Agents: Evolution, Architecture & Real-World Applications](/blog/ai-agents-evolution-architecture-real-world-applications/) — общий словарь: что такое агент и из каких слоёв он состоит.
2. [Beyond the Gang of Four](/blog/beyond-the-gang-of-four-practical-design-patterns-for-modern-ai/) — принципы проектирования ИИ-систем: иерархия промптов, внешние факты через RAG, контроль контекстного окна.
3. [MBTI-команда агентов](/reviews/mbti-komanda-agentov-eksperiment-s-meta-promtingom/) — эксперимент с ролевыми агентами: как задать боту миссию, регламент и цель, на которую он влияет.
4. [AgentGateway](/blog/agentgateway-opensource-sloy-dlya-zaschity-kommunikatsii-mezhdu/) — слой между агентами и сервисами: аутентификация трафика, мониторинг, фильтры от утечки данных. Читайте вместе с вопросами безопасности выше.
5. [Kagent](/reviews/kagent-opensource-platforma/) — когда агентов становится много: развернуть их в Kubernetes с мониторингом и отладкой.
