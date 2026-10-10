---
title: "Locust – нагрузочное тестирование API и LLM"
description: "Инструмент для имитации нагрузки на веб-сервисы и API, написанный на Python. Когда использовать?"
date: "2025-10-12T14:22:07+00:00"
directions: ["ai-in-business"]
source: "telegram:ai_ossresearch"
source_url: "https://t.me/ai_ossresearch/37"
cover: "/media/tools/locust-nagruzochnoe-testirovanie-api-i-llm/2c7e46614de50eab.jpg"
imported: true
---
![](/media/tools/locust-nagruzochnoe-testirovanie-api-i-llm/2c7e46614de50eab.jpg)

![](/media/tools/locust-nagruzochnoe-testirovanie-api-i-llm/2f08180f2d4501e0.jpg)

Инструмент для имитации нагрузки на веб-сервисы и API, написанный на Python.

⚡ Когда использовать?
✅ Тестирование API больших языковых моделей (LLM)
✅ Измерение задержек и throughput под высокой нагрузкой
✅ Проверка отказоустойчивости и масштабируемости

👨‍💻 Пример из практики:
Перед выходом в прод проверить выдержит ли сервис 1000 запросов в секунду. Locust сгенерирует тест и покажет изменение метрик задержки и ответов.

📝 5 шагов внедрения:
1️⃣ Установка Locust (pip install locust)
2️⃣ Написать сценарий (Python-скрипт с моделируемыми запросами)
3️⃣ Запуск тестов (locust -f test_script.py)
4️⃣ Анализ метрик (задержка, throughput, процент ошибок)

🛠 Сравнение с аналогами:
🔹 JMeter → GUI-инструмент, сложнее в настройке
🔹 K6 → Высокая производительность, но нет Python
🔹 Vegeta → Простота, но нет интерактивного UI
🔹 Perflint → Подходит для ML, но сложнее в освоении
