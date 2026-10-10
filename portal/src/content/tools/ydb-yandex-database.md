---
title: "YDB (Yandex Database)"
description: "DynamoDB/Aurora Serverless в мире Yandex Cloud Когда применять Нужна БД для стартапа, где не нужно платить за простой серверов."
date: "2026-08-08T07:00:00+00:00"
directions: ["startups"]
source: "telegram:ai_ossresearch"
source_url: "https://t.me/ai_ossresearch/170"
repo: "https://github.com/ydb-platform/ydb"
imported: true
---
DynamoDB/Aurora Serverless в мире Yandex Cloud

**Когда применять**
Нужна БД для стартапа, где не нужно платить за простой серверов. В основном для стартапов когда еще нет High-load:
- ТГ боты
- мобильные приложения
- SaaS сервисы

PS В реальности это очень узкоспециализированная БД для техногигантов вроде Яндекса и их нагрузки. Для стартапа возможно избыточна и выигрыш в цене дает проигрыш в быстродействии сервиса

**Особенности:**
- SQL (YQL - диалект SQL от Яндекса)
- ACID-транзакции
- Родной API - gRPC на proto3
- Kafka-совместимый API для топиков
- PostgreSQL-совместимость
- Строгая консистентность
- Горизонтальное партиционирование таблиц
- Вторичные индексы
- Time to Live (TTL) для данных
- Serverless и Dedicated режимы
- DynamoDB-совместимый API (частично, только чтение)
- SDK для Go, Python, Java, Node.js, C++, .NET

**В отличие от:**
- Postgres/MySQL - масштабируется горизонтально, а не вертикально
- DynamoDB - полноценный SQL и ACID вместо eventual consistency по ключу
- Serverless Postgres - бесплатный тир 1 млн RU/мес
- Spanner/CockroachDB — open-source и можно self-hosted

**Код:**
https://github.com/ydb-platform/ydb

**Официальная документация:**
https://ydb.tech/docs
