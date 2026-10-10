---
title: "Инсайды построение RAG от победителя RAG Enterprice Chellenge (IlyaRice)"
description: "Системный подход, конкретные методы и open-source код. Потрясающая статья, если изучаете RAG."
date: "2025-06-27T15:44:26+00:00"
directions: ["ai-in-business"]
source: "telegram:corporate_ai"
source_url: "https://t.me/corporate_ai/6"
also_in: ["https://t.me/ai_pmf/89"]
imported: true
---
Системный подход, конкретные методы и open-source код. Потрясающая статья, если изучаете RAG.

Делюсь мыслями, которые себе сохранил:
— Semantic splitter: нарезка чанков по смыслу, не по токенам
— 1 база = 1 документ — не мешаем данные разных компаний
— LLM reranking с reasoning + relevance score реально помогает
— Structed Output + Chain of Thought → меньше галлюцинаций
— GPT-4o-mini и JINA — хорошие модели для reranker
— Retrieval как указатель: чанки указывают на страницу
— Multiquery-routing ощутимо повышает качество
— «Я не знаю» = дать модельке подумать с разных углов
— Ошибки JSON? Просто переспросить через LLM
— Стандартизация всех сокращений — важна
— Первые 5 прогонов лучше просмотреть вручную

Работа с таблицами:
- Сериализация таблиц на мелкие чанки
- HTML иногда лучше чем .md, если структура не классическая

**Полезные ссылки из статьи:**
[- статья на habr](https://habr.com/ru/articles/893356/)
- [github код с чемпионата](https://github.com/trustbit/enterprise-rag-challenge) (промпты, сериализаторы, инструменты)
- [Github код и промты сериализатора таблиц](https://github.com/IlyaRice/RAG-Challenge-2/blob/3ed9a2a7453420ed96cfc48939ea42d47a5f7b1c/src/tables_serialization.py#L313-L345)
- [исследование Row-wise Serialization](https://arxiv.org/pdf/2402.17944)
- [про semantic-text-splitter](https://writingtools.ai/tools/semantic-text-splitter)
- [FAISS](https://github.com/facebookresearch/faiss)
- [JINA reranker](https://jina.ai/reranker/)

Автор оригинальной статьи на habr: [Илья](https://t.me/IlyaRice)
