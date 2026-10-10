/*
 * Один хост для всего: старые домены (blog., slides., prompts., call., www.) привязаны к тому же
 * приложению Timeweb, а этот скрипт в <head> каждой страницы уводит на aleksishmanov.ru, сохраняя путь.
 * Хостинг не умеет 301 (ADR 0003), поэтому редирект — здесь, плюс canonical и страницы-переадресации.
 * Встраивается инлайн: в портал (portal/src/layouts/Base.astro) и в лендинг (vite.config.js).
 */
(function (w) {
  var CANON = 'aleksishmanov.ru';
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;
  function target(host, path) {
    host = String(host).toLowerCase();
    if (host === CANON || LOCAL.test(host)) return null;
    var p = path || '/';
    if (host === 'blog.' + CANON) {
      if (p === '/' || p.indexOf('/+') === 0) p = '/blog/';
      else if (/^\/data\/(rss|atom)/.test(p)) p = '/rss.xml';
      else if (p.indexOf('/blog/') !== 0) p = '/blog' + p.toLowerCase(); // адреса сайта в нижнем регистре
    } else if (host === 'slides.' + CANON) {
      if (p.indexOf('/slides/') !== 0) p = '/slides' + p;
    } else if (host === 'prompts.' + CANON) {
      if (p === '/') p = '/prompts/';
    } else if (host === 'call.' + CANON) {
      p = '/call/';
    }
    return 'https://' + CANON + p;
  }
  w.__hostTarget = target;
  var t = target(w.location.hostname, w.location.pathname);
  if (t) w.location.replace(t + w.location.search + w.location.hash);
})(window);
