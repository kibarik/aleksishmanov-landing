/**
 * Яндекс.Метрика: счётчик подключается после первой отрисовки сцены (событие scene:first-frame),
 * чтобы сторонний скрипт не конкурировал с загрузкой модели. Идентификатор и цели — в контенте.
 * Без WebGL сцены нет, поэтому там подключаемся сразу.
 */

let loaded = false;

function loadCounter(id) {
  if (loaded) return;
  loaded = true;
  /* eslint-disable */
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (let j = 0; j < e.scripts.length; j++) { if (e.scripts[j].src === r) return; }
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  /* eslint-enable */
  window.ym(id, 'init', { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true });
}

/**
 * @param analytics секция контента: { counter, goals }
 * @param hasScene есть ли 3D-сцена: с ней ждём первую отрисовку, без неё подключаемся сразу
 */
export function installAnalytics({ counter, goals }, { hasScene }) {
  const reach = (goal) => { try { window.ym?.(counter, 'reachGoal', goal); } catch { /* счётчик мог не загрузиться */ } };

  if (hasScene) window.addEventListener('scene:first-frame', () => loadCounter(counter), { once: true });
  else loadCounter(counter);

  // клики по обеим кнопкам Ask и по «Написать» в контенте и футере
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    if (link.id === 'ask-nav' || link.id === 'ask-scene') reach(goals.ask);
    else if (link.closest('#contact')) reach(goals.contact);
  }, { capture: true });

  /** Цель «дошёл до белой сцены» — один раз за визит. */
  let whiteSent = false;
  return {
    whiteScene() {
      if (whiteSent) return;
      whiteSent = true;
      reach(goals.whiteScene);
    },
  };
}
