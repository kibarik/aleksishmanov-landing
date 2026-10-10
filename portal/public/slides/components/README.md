# Компоненты практикума

Два независимых сайдбара можно подключить к любой HTML-презентации каталога.

```html
<script src="../components/workshop-timer.js"></script>
<script src="../components/workshop-poll.js"></script>
<script src="../components/workshop-timer-sidebar.js"></script>
<script src="../components/workshop-poll-sidebar.js"></script>

<div id="workshop-tools">
  <workshop-timer-sidebar minutes="10"></workshop-timer-sidebar>
  <workshop-poll-sidebar guide="unique-step-id"></workshop-poll-sidebar>
</div>
```

`minutes` задаёт начальное значение таймера: 5, 10 или 15 минут. Таймер продолжает работать после закрытия панели, а вкладка показывает оставшееся время и меняет цвет.

Контейнер компонентов размещайте вне элемента, который масштабируется через CSS `transform`. Тогда вкладки с `position: fixed` останутся у физического правого края окна. Если у каждого слайда собственные настройки, при переключении переносите компоненты активного слайда в общий viewport-слой, как это сделано в `claude-desktop-zai-macos/index.html`.

`guide` служит ключом локального состояния голосования. Вкладка показывает три счётчика: успех, вопрос, проблема. Раскрытая панель показывает крупные счётчики и локальный журнал событий.

На странице участника `<workshop-poll guide="unique-step-id"></workshop-poll>` доступны короткий ник, необязательный комментарий и три варианта ответа. Участник может изменить ответ: счётчик переносится между статусами, а в журнал добавляется новое событие.

В режиме ведущего `<workshop-poll guide="unique-step-id" mode="presenter"></workshop-poll>` журнал показывает ник, действие, статус, комментарий и время. Доступны быстрые фильтры «Положительно», «Есть вопросы», «Негативно» и «Комментарии». Длинный текст свёрнут до двух строк и раскрывается по кнопке.

Локальный формат состояния:

```js
{
  legacyCounts: { done: 0, question: 0, problem: 0 },
  voters: {
    "browser-token": { status: "done", nickname: "Алекс", updatedAt: "..." }
  },
  events: [
    {
      id: "event-id",
      type: "status", // или "comment"
      status: "done", // done | question | problem
      fromStatus: "question",
      nickname: "Алекс",
      comment: "Получилось после перезапуска терминала",
      time: "12:04"
    }
  ]
}
```

Компоненты закрывают соседний сайдбар при открытии, но не зависят друг от друга. Для общего счётчика и журнала между устройствами нужен realtime backend из Issue №3. Ник должен оставаться псевдонимом, а `voterToken` — анонимным идентификатором браузера, не связанным с личными данными.
