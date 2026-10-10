---
title: "VPN + корпоративный доступ + шифрование"
description: "История как на одном ноутбуке использовать сразу 2-3 различный VPN-подключения без конфликтов подключения (корпоративный, личный, зарубежный) ШАГ 1: Поднять свой VPN Помогло…"
date: "2025-09-12T23:27:23+00:00"
directions: ["ai-in-business"]
source: "telegram:corporate_ai"
source_url: "https://t.me/corporate_ai/32"
cover: "/media/reviews/vpn-korporativnyy-dostup-shifrovanie/1761d74cdc3bb285.jpg"
imported: true
---
![](/media/reviews/vpn-korporativnyy-dostup-shifrovanie/1761d74cdc3bb285.jpg)

История как на одном ноутбуке использовать сразу 2-3 различный VPN-подключения без конфликтов подключения (корпоративный, личный, зарубежный)

**ШАГ 1: Поднять свой VPN**
Помогло поднять свой сервер с доп. шифрованием:
[github ссылка проекта](https://github.com/EmptyLibra/Configure-Xray-with-VLESS-Reality-on-VPS-server/tree/master)

**ШАГ 2: Совмещение VPN**
Чтобы одновременно работал корп. VPN (доступ к инфраструктуре) и личный VPN (доступ к YouTube, ChatGPT и тп)

1. Установить - [**https://github.com/throneproj/Throne**](https://github.com/throneproj/Throne)
2. Для макбука карантин - **sudo xattr -dr com.apple.quarantine /Applications/**[**Throne.app**](http://Throne.app/)
3. Включить **Tun Mode** (для маршрутизации трафика)
4. Добавить конфигурацию VPN
5. Перейти в Routing > Routing Settings > Route > Default
6. ruleset:geoip-ru - исключаем из машртутизации Российские адреса
7. domain:{корп. домены} исключаем из машртутизации
8. Включаем VPN-для сервисов
9. Включаем корпоративный VPN

**Результат:**
- Зарубежные сервисы через VPN-сервер
- Трафик к корп. инфре идет через корпоративный VPN
- Трафик для ру-сегмента идет без VPN
