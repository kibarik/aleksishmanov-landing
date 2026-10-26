import { content } from './content.js';
import { mountSections } from './sections.js';
import { mountFlipText } from './flipText.js';
import { mountCursor } from './cursor.js';
import { mountMenu, NO_SCENE_SCROLL } from './menu.js';
import { getDevicePreset } from './stickyScroll.js';
import { mountFooterNoise } from './footerNoise.js';

// шрифты — после загрузки страницы, в свободное время (см. fonts.js)
const loadFonts = () => (window.requestIdleCallback || setTimeout)(() => import('./fonts.js'), { timeout: 800 });
if (document.readyState === 'complete') loadFonts();
else window.addEventListener('load', loadFonts, { once: true });

// Лендинг всегда начинается с первого экрана: липкий режим запрещает прокрутку, и восстановленная браузером
// позиция (перезагрузка, автоперезагрузка при пропавшем чанке) оставляла посетителя на футере без секций.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const dom = {
  loader: document.getElementById('loader'),
  pct: document.getElementById('loader-pct'),
  path: document.querySelector('.loader__path'),
  nav: document.getElementById('nav'),
  hint: document.getElementById('scroll-hint'),
  tagline: document.getElementById('tagline'),
  hero: document.getElementById('hero'),
  askScene: document.getElementById('ask-scene'),
  canvas: document.getElementById('scene'),
};

// тексты первого экрана — из модуля контента; мета-теги живут в index.html: их читают краулеры
// и Telegram до выполнения JS
document.getElementById('loader-offer').textContent = content.offer;
mountFlipText(dom.tagline, content.tagline);
// Ask Ishmanov AI: кнопка под пьедесталом, ссылка — из константы контента (замена на бота — правка href там)
dom.askScene.href = content.ask.href;
dom.askScene.querySelector('.ask__label').textContent = content.ask.label;
mountSections(document.getElementById('content'), content);

// Под шапкой светлый контент (сцена ушла вверх): шапка и курсор тёмные. Сцена и тёмные секции — светлые.
new IntersectionObserver(([e]) => {
  document.body.classList.toggle('is-content-top', e.isIntersecting);
}, { rootMargin: '0px 0px -94% 0px' }).observe(document.getElementById('content'));

// Тёмная секция: пока она в кадре, шапка светлая; текст приезжает при входе в зону видимости
const intro = document.getElementById('about');
new IntersectionObserver((entries) => {
  for (const e of entries) {
    document.body.classList.toggle('is-intro-visible', e.isIntersecting);
    document.body.classList.toggle('is-dark-section', e.isIntersecting || document.body.classList.contains('is-footer-visible'));
    if (e.isIntersecting) intro.classList.add('intro--in');
  }
}, { threshold: 0.12 }).observe(intro.querySelector('.intro__sticky'));
// Подсказка прокрутки на липком экране прячется, когда на него наезжает следующий блок
new IntersectionObserver(([e]) => {
  intro.classList.toggle('about--covered', e.isIntersecting);
}, { rootMargin: '0px 0px -88% 0px' }).observe(intro.querySelector('.about__more'));

// Футер тоже тёмный: шапка на нём светлая. 3D-объект живёт только пока футер в кадре.
const footer = document.getElementById('footer');
let footer3d = null;
const has3dFooter = () => document.documentElement.dataset.webgl !== 'off' && preset !== 'mobile';
/** Объект футера (геометрия, окружение, шейдеры) готовится один раз; дорого — ~100 мс работы потока. */
const prepareFooter3d = () => (footer3d ??= import('./footer3d.js').then((m) => m.mountFooter3d(document.getElementById('footer-scene'))));
// Готовим заранее, в свободное время, пока до футера ещё два экрана: иначе эта работа выпадает
// на момент, когда футер въезжает в кадр, и прокрутка спотыкается.
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
new IntersectionObserver((entries, io) => {
  if (!entries.some((e) => e.isIntersecting) || !has3dFooter()) return;
  io.disconnect();
  idle(prepareFooter3d, { timeout: 2000 });
}, { rootMargin: '0px 0px 200% 0px' }).observe(footer);
const footerNoise = mountFooterNoise(document.getElementById('footer-noise'));
new IntersectionObserver((entries) => {
  for (const e of entries) {
    document.body.classList.toggle('is-footer-visible', e.isIntersecting);
    if (e.isIntersecting) footerNoise.start(); else footerNoise.stop();
    document.body.classList.toggle('is-dark-section', e.isIntersecting || document.body.classList.contains('is-intro-visible'));
    if (!has3dFooter()) continue;
    if (e.isIntersecting) {
      prepareFooter3d().then((s) => s.start());
    } else footer3d?.then((s) => s.stop());
  }
}, { threshold: 0.25 }).observe(footer);

// Кнопка «наверх» в футере: плавно к началу страницы
document.querySelector('[data-footer-up]').addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const preset = getDevicePreset();
document.body.dataset.preset = preset;
mountCursor();

/** Без WebGL: статичный кадр неоновой сцены, обычный скролл; сцена не импортируется. */
function bootFallback() {
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-neon', 'is-released');
  dom.hero.classList.add('hero--released');
  dom.nav.classList.add('nav--visible');
  dom.tagline.classList.add('tagline--visible');
  dom.askScene.classList.add('ask--visible');
  // меню работает и здесь: сцены нет, скролл уже нативный
  mountMenu(document.getElementById('menu'), document.getElementById('menu-toggle'), content, NO_SCENE_SCROLL);
}

const noWebgl = document.documentElement.dataset.webgl === 'off';

/** Один раз перезагрузить страницу: обычно чанк пропал из-за свежего деплоя, а HTML в кеше старый. */
const RETRY_KEY = 'scene-chunk-retry';
const retried = () => { try { return sessionStorage.getItem(RETRY_KEY) === '1'; } catch { return true; } };
const markRetry = () => { try { sessionStorage.setItem(RETRY_KEY, '1'); } catch { /* приватный режим */ } };

if (noWebgl) {
  bootFallback();
} else {
  import('./boot3d.js')
    .then((m) => { window.__bundleReady = true; return m.boot3d({ preset, dom }); })
    .catch((err) => {
      // Чанк сцены не приехал: во время деплоя старые имена файлов исчезают, а этот хостинг
      // отдаёт на них HTML с кодом 200 — импорт падает. Первый раз пробуем перезагрузиться
      // за свежим HTML, второй — показываем фолбэк, чтобы первый экран не остался пустым.
      console.error('сцена не загрузилась:', err);
      if (!retried()) { markRetry(); location.reload(); return; }
      document.documentElement.dataset.webgl = 'off';
      bootFallback();
    });
}
