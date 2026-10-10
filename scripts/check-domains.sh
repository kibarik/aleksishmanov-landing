#!/usr/bin/env bash
# Проверка после переключения доменов (spec.md, «Переключение доменов»): каждый старый домен отдаётся
# приложением aleksishmanov.ru и содержит скрипт перевода на основной хост; основной хост — портал и 404.
set -u
fail=0
check() { # url, ожидаемый код, строка в теле
  local code body
  body=$(curl -s -m 20 -w '\n%{http_code}' "$1"); code=${body##*$'\n'}; body=${body%$'\n'*}
  if [[ "$code" == "$2" && "$body" == *"$3"* ]]; then echo "ok   $code $1"; else echo "FAIL $code $1 (ждали $2 и «$3»)"; fail=1; fi
}
check https://aleksishmanov.ru/ 200 'Алексей Ишманов'
check https://aleksishmanov.ru/blog/ 200 'class="site-nav"'
check https://aleksishmanov.ru/blog/bullseye-framework/ 200 '"@type":"Article"'
check https://aleksishmanov.ru/bullseye-framework/ 200 'url=https://aleksishmanov.ru/blog/bullseye-framework/'
check https://aleksishmanov.ru/net-takoy-stranicy/ 404 'Такой страницы нет'
check https://aleksishmanov.ru/sitemap-index.xml 200 'sitemap'
check https://aleksishmanov.ru/llms.txt 200 '# Алексей Ишманов'
for d in blog slides prompts call www; do
  check "https://$d.aleksishmanov.ru/" 200 '__hostTarget'
done
check https://blog.aleksishmanov.ru/bullseye-framework/ 200 'url=https://aleksishmanov.ru/blog/bullseye-framework/'
check https://slides.aleksishmanov.ru/okr-quarter-planning/ 200 'url=https://aleksishmanov.ru/slides/okr-quarter-planning/'
exit $fail
