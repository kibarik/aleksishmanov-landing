---
title: "Ошибки первого и второго рода в A/B тестировании"
description: "A/B тест - это инструмент принятия решений под неопределённостью. Вы никогда не знаете «правду» о вашем продукте со 100% уверенностью: у вас есть только выборка данных."
date: "2026-06-06T11:53:38.937Z"
directions: ["startups"]
source: "teletype"
source_url: "https://blog.aleksishmanov.ru/a-b-math-basics"
also_in: ["https://t.me/ai_pmf/82"]
old_urls: ["https://blog.aleksishmanov.ru/a-b-math-basics", "https://teletype.in/@aleksishmanov/a-b-math-basics"]
cover: "/media/blog/a-b-math-basics/2b1de2fc65cf3e45.png"
imported: true
---
A/B тест - это инструмент принятия решений под неопределённостью. Вы никогда не знаете «правду» о вашем продукте со 100% уверенностью: у вас есть только выборка данных. Именно поэтому в любом тесте возможны два типа ошибок - и задача хорошего дизайна эксперимента состоит не в том, чтобы их исключить (это невозможно), а в том, чтобы **заранее договориться**, какой риск допустим.

![](/media/blog/a-b-math-basics/2b1de2fc65cf3e45.png)

Прежде чем говорить об ошибках, нужно понять отправную точку.

В каждом A/B тесте есть **нулевая гипотеза H₀**: «изменение, которое мы тестируем, не оказывает никакого эффекта на метрику». Это ваша «ставка по умолчанию» - вы предполагаете, что вариант B ничем не лучше контрольного варианта

Ваша задача - решить: **отвергнуть H₀** (объявить победителя) или **не отвергнуть H₀** (эффекта не найдено). Обе эти ситуации могут оказаться верными или ошибочными — вот откуда берутся две ошибки.

### Ошибка первого рода (α) — False Positive

**Определение**: Вы решили отказаться от гипотезы, хотя на самом деле эффект был и бизнес мог с этого заработать. Вы отвергли нулевую гипотезу, которая была верной.

Простая аналогия из медицины: вы сказали **здоровому человеку, что он болен**. Тест дал положительный результат, но болезни нет

В продуктовом A/B тесте это выглядит так:

- Вы запустили новый онбординг-флоу
- Тест показал +5% к конверсии, p-value < 0.1
- Вы раскатываете на всех пользователей
- Через месяц: эффект исчезает, конверсия возвращается на базовый уровень
- Вы потратили ресурсы на фичу, которая не работала — просто «повезло» с выборкой

**Вероятность ошибки первого рода = α (уровень значимости)**. Если α = 0.1 (доверие 90%), значит, в 10% тестов без реального эффекта вы всё равно увидите «значимый» результат.

**Почему 10%, а не 5%?** При доверии 95% (α = 0.05) нужно значительно больше трафика. Для большинства продуктовых команд 90% — разумный компромисс: вы принимаете, что примерно 1 тест из 10 будет «ложной тревогой»

### Ошибка второго рода (β) — False Negative

**Определение:** Вы не нашли эффекта, хотя он реально существует. Вы не отвергли нулевую гипотезу, когда она была ложной

Медицинская аналогия: вы сказали **больному человеку, что он здоров**. Болезнь есть, но тест её не увидел.

В продукте это выглядит так:

- Вы запустили новый процесс активации
- Тест собрал 2000 пользователей, прирост <5% не значим для нас (p > 0.1)
- Вы откатываете изменение как «не работающее»
- Но на самом деле эффект был — просто выборка была слишком мала, чтобы его «поймать"

**Вероятность ошибки второго рода = β**. При мощности теста 80% β = 20% — то есть в 2 тестах из 10, где эффект реально существует, вы его пропустите.[^11][^12]

**Почему β = 20% считается допустимым?** Чтобы снизить β до 10% (мощность 90%), потребуется существенно больше трафика и времени. При ограниченных ресурсах и высокой частоте экспериментов 80% мощности — стандартный практический компромисс

### Визуализация: два распределения

![](/media/blog/a-b-math-basics/f1ab79ffd0531d1a.png)

*На графике видны две нормальные кривые. Левая (синяя) — распределение результата при истинной H₀ (эффекта нет). Правая (красная) — распределение при альтернативной гипотезе H₁ (эффект есть и равен ожидаемому MDE).*

Вертикальная пунктирная линия — **критический порог**, который определяется α:

- Под синей кривой **правее порога** — ошибка первого рода (α = 10%): «увидели победителя там, где его нет»[^5][^13]
- Под красной кривой **левее порога** — ошибка второго рода (β = 20%): «пропустили настоящий эффект»[^13][^5]
- Под красной кривой **правее порога** — **мощность теста (1 − β = 80%)**: «поймали реальный эффект»[^12][^14]

### Матрица решений

![](/media/blog/a-b-math-basics/8b8d9c92c84cb1ea.png)

*Все возможные исходы A/B теста можно уложить в матрицу*

Из матрицы видно: **обе ошибки существуют одновременно**, и их нельзя обнулить одновременно. Снижение α (строже к ложным победителям) автоматически увеличивает β (чаще пропускаем реальные эффекты) при фиксированном размере выборки.

### Как параметры связаны между собой

![](/media/blog/a-b-math-basics/0bdcfcd2c7ea7e05.png)

*Все три параметра образуют единую мат. систему*

Все эти числа **согласованы**: нельзя задать confidence = 90% и потом смотреть на p-value < 0.05 - это внутреннее противоречие

### Как выбрать баланс α и β в продукте

Выбор зависит от цены каждой из ошибок в конкретной ситуации

**Когда важнее минимизировать ошибку 1-го рода (ложный позитив):**

- Продуктовые изменения с высокой стоимостью внедрения (рефакторинг бэкенда, редизайн ключевого флоу)
- Решения, которые трудно откатить
- Тесты, затрагивающие безопасность или платёжную воронку → Используйте более строгое доверие: 95–99% (α = 0.05 или 0.01)

**Когда важнее минимизировать ошибку 2-го рода (ложный негатив):**

- Быстрые продуктовые итерации с малым трафиком
- Тест на ранней стадии гипотезы, где важно «не пропустить сигнал»
- Изменения, которые легко раскатить и откатить → Можно снизить мощность до 70–75%, чтобы ускорить тест, или повысить MDE

**Стандарт большинства продуктовых команд:** α = 0.1, мощность 80% — это рабочий баланс для регулярных экспериментов при ограниченном трафике.

### Практические следствия для команды

**Из ошибки первого рода:**

- Никогда не останавливайте тест досрочно «потому что уже видно результат» - это резко повышает реальный α
- Если тестируете много гипотез подряд без корректировки (проблема множественных сравнений), реальный α накапливается

**Из ошибки второго рода:**

- Если тест завершился без значимого результата, это не значит «фича не работает» — возможно, у вас просто не хватило выборки
- Размер выборки нужно рассчитывать **до запуска теста**, исходя из заданных α, мощности и MDE
- При малом трафике лучше тестировать меньше гипотез, но с правильным размером выборки, чем много — с ненадёжными результатами

### Материалы

- [Type 1 and Type 2 Errors in Statistics](https://www.abtasty.com/glossary/type-1-type-2-errors/) - Type 1 (or type I) error, also referred to as false positive, which is the wrong rejection of a null...
- [What are Type 1 and Type 2 Errors in A/B Testing and How ...](https://vwo.com/blog/errors-in-ab-testing/) - Type 1 error is the probability of rejecting the null hypothesis when it is true, usually determined...
- [Type I and type II errors](https://en.wikipedia.org/wiki/Type_I_and_type_II_errors) - Type I error, or a false positive, is the incorrect rejection of a true null hypothesis in statistic...
- [Проверка результатов A/B теста - Max Tsvetkov](https://your-scorpion.ru/ab-tests-check-mathematics/) - Ошибка второго рода (false negative) происходит, когда верна альтернативная гипотеза, но было принят...
- [Type 1 Errors and Type 2 Errors, Explained](https://www.statsig.com/perspectives/type-1-errors-and-type-2-errors-explained) - Type 1 errors, also known as false positives, happen when we incorrectly reject a true null hypothes...
- [Ошибки первого и второго рода](https://ru.wikipedia.org/wiki/%D0%9E%D1%88%D0%B8%D0%B1%D0%BA%D0%B8_%D0%BF%D0%B5%D1%80%D0%B2%D0%BE%D0%B3%D0%BE_%D0%B8_%D0%B2%D1%82%D0%BE%D1%80%D0%BE%D0%B3%D0%BE_%D1%80%D0%BE%D0%B4%D0%B0) - Оши́бка второ́го ро́да (β-ошибка, ложноотрицательное заключение) — ситуация, когда принята неверная ...
- [What are Type 1 and Type 2 Errors?](https://www.mida.so/blog/what-are-type-1-and-type-2-errors) - In A/B testing, a Type I error (false positive) ships a losing variant; a Type II error (false negat...
- [Mobile A/B Testing: Statistical Significance and Confidence ...](https://splitmetrics.com/blog/mobile-a-b-testing-statistical-significance/) - You can also come across 90% and 99% confidence levels, other parameter values are quite rare. mobil...
- [Что такое АБ тестирование? - энциклопедия BigdataSchool](https://bigdataschool.ru/wiki/ab-testing/) - Ошибка первого рода. Ситуация, когда мы ошибочно признаем различие там, где его нет. Это ложноположи...
- [What are Type I and Type II errors?](https://www.kameleoon.com/blog/what-are-type-i-and-type-ii-errors) - Type I errors occur when you incorrectly reject a true null hypothesis. · Type II errors occur when ...
- [Data Science Essentials – Crash Course in A/B Testing with ...](https://www.youtube.com/watch?v=KZe0C0Qq4p0) - In this applied Data Science Crash Course, we cover everything you need to know about A/B testing, f...
- [Sample size calculation and power analysis for AB testing](https://uxplanet.org/sample-size-calculation-and-power-analysis-for-ab-testing-eafa8a72e779) - In practice, usually, a test power equal to or greater than 80% is considered acceptable (which corr...
- [Type I and Type II Errors: False Positives, False Negatives ...](https://mbrenndoerfer.com/writing/type-i-type-ii-errors-false-positives-false-negatives-statistical-power) - Type I Error (False Positive): 0 is true) It represents the false positive rate of your test. A Type...
- [Understanding statistical power in A/B testing](https://www.statsig.com/perspectives/understanding-statistical-power-ab-testing) - In simple terms, it's a test's ability to detect a real effect when one truly exists. It reflects th...
- [A/B Testing 101](https://www.nngroup.com/articles/ab-testing/) - A/B testing is a quantitative research method that tests two or more design variations with a live a...
- [A/B testing calculator for statistical significance](https://www.surveymonkey.com/learn/research-and-analysis/ab-testing-significance-calculator/) - The level of confidence you can have that your results are not due to random chance. 90% 95% 99% Cal...
- [Four Ways to Improve Statistical Power in A/B Testing](https://towardsdatascience.com/four-ways-to-improve-statistical-power-in-a-b-testing-without-increasing-test-duration-duh-e37ad45d38f5/) - Statistical power measures the chance of NOT making a Type II error, meaning it shows how likely we ...
