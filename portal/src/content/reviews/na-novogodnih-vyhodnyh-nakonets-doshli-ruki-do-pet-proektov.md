---
title: "На новогодних выходных наконец дошли руки до pet-проектов"
description: "Небольшой лайфхак, если у вас в параллель работает 5-10 генераций, то замените git checkout на git worktree ASIS: Проблема: TOBE: создать worktree для каждой фичи git worktree add…"
date: "2026-01-11T04:52:35+00:00"
directions: ["ai-in-business"]
source: "telegram:corporate_ai"
source_url: "https://t.me/corporate_ai/44"
cover: "/media/reviews/na-novogodnih-vyhodnyh-nakonets-doshli-ruki-do-pet-proektov/17288523adad54e2.jpg"
imported: true
---
![](/media/reviews/na-novogodnih-vyhodnyh-nakonets-doshli-ruki-do-pet-proektov/17288523adad54e2.jpg)

Небольшой лайфхак, если у вас в параллель работает 5-10 генераций, то замените git checkout на *git worktree*

ASIS:

```
git checkout -b feature-auth# запускаешь агента# ожидание генерации # фича 2git stashgit checkout -b feature-profile# фича 3git stashgit checkout -b feature-feed
```

**Проблема:**

```
- Пока идет одна генерация - нельзя параллельно писать код другим агентом, будет хаос и блокирующие вызовы. - генерация SpecKit занимает 45 минут на подготовку и 5 минут на исполнение, все это время я в блоке
```

**TOBE:**
**# создать worktree для каждой фичи**
git worktree add -b feature-auth ../feature-auth develop
git worktree add -b feature-profile ../feature-profile develop
git worktree add -b feature-feed ../feature-feed develop

Теперь все фичи в папке, наследованные от develop, без нарушений workflow. Можно в параллель вести генерации на одной машине.
