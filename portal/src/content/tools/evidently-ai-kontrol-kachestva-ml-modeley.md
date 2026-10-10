---
title: "Evidently AI – контроль качества ML-моделей"
description: "Удобный инструмент, чтобы быстро проанализовать AI, есть готовые пресеты для аналитики и удобные отчеты. Когда использовать?"
date: "2025-10-12T14:22:09+00:00"
directions: ["ai-in-business"]
source: "telegram:ai_ossresearch"
source_url: "https://t.me/ai_ossresearch/94"
repo: "https://github.com/evidentlyai/evidently"
cover: "/media/tools/evidently-ai-kontrol-kachestva-ml-modeley/74aa7d225371711b.jpg"
imported: true
---
![](/media/tools/evidently-ai-kontrol-kachestva-ml-modeley/74aa7d225371711b.jpg)

Удобный инструмент, чтобы быстро проанализовать AI, есть готовые пресеты для аналитики и удобные отчеты.

**⚡ Когда использовать?**
✅ Запускаете ML-модель в прод и боитесь "сломанных" предсказаний
✅ Новые модели стали хуже предсказывать чем прошлые
✅ Дополнительные данные для A/B тестов (почему метрика выросла/упала)
✅ Построить борды метрик ML

👨‍💻 Задача
Отладка ML модели и анализ деградации качества (например, прирост на beta, но просадка на проде)

- Без инструмента
1. Скачиваем Reference/Current выборки
2. Пишем скрипты для расчёта метрик
3. Сравниваем фичи, дистрибуции, ошибки вручную
4. Собираем отчёт в Python тетрадки для объяснения
5. Выводим отчет в презентацию/HTML/скриншоты

- С инструментом
1. Скачиваем Reference/Current выборки
2. Запускаем анализ DataDriftPreset(), ClassificationPreset() - генерируется отчет .html

Useful links:
- [Documentation](https://docs.evidentlyai.com/)
- [Исходный код] (https://github.com/evidentlyai/evidently)
