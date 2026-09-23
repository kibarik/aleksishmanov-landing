// Шрифты локально (без Google Fonts): детерминированная отрисовка имени на сцене и Lighthouse.
// Полные css с unicode-range: браузер грузит только нужные сабсеты (латиница + кириллица).
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/800.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';
import { content } from './content.js';
import { mountSections } from './sections.js';
import { mountFlipText } from './flipText.js';
import { mountCursor } from './cursor.js';
import { mountMenu, NO_SCENE_SCROLL } from './menu.js';
import { getDevicePreset } from './stickyScroll.js';
import { installAnalytics } from './analytics.js';

const dom = {
  loader: document.getElementById('loader'),
  pct: document.getElementById('loader-pct'),
  path: document.querySelector('.loader__path'),
  nav: document.getElementById('nav'),
  hint: document.getElementById('scroll-hint'),
  tagline: document.getElementById('tagline'),
  hero: document.getElementById('hero'),
  askScene: document.getElementById('ask-scene'),
  askNav: document.getElementById('ask-nav'),
  canvas: document.getElementById('scene'),
};

// тексты первого экрана — из модуля контента; мета-теги живут в index.html: их читают краулеры
// и Telegram до выполнения JS
document.getElementById('loader-offer').textContent = content.offer;
mountFlipText(dom.tagline, content.tagline);
// Ask Ishmanov AI: обе кнопки из одной константы контента (замена на бота — правка href там)
dom.askScene.href = content.ask.href;
dom.askScene.querySelector('.ask__label').textContent = content.ask.label;
dom.askNav.href = content.ask.href;
dom.askNav.textContent = content.ask.label;
mountSections(document.getElementById('content'), content);

// Тёмная секция: пока она в кадре, шапка светлая; текст приезжает при входе в зону видимости
const intro = document.getElementById('intro');
new IntersectionObserver((entries) => {
  for (const e of entries) {
    document.body.classList.toggle('is-intro-visible', e.isIntersecting);
    document.body.classList.toggle('is-dark-section', e.isIntersecting || document.body.classList.contains('is-footer-visible'));
    if (e.isIntersecting) intro.classList.add('intro--in');
  }
}, { threshold: 0.12 }).observe(intro.querySelector('.intro__sticky'));

// Футер тоже тёмный: шапка на нём светлая. 3D-объект живёт только пока футер в кадре.
const footer = document.getElementById('footer');
let footer3d = null;
new IntersectionObserver((entries) => {
  for (const e of entries) {
    document.body.classList.toggle('is-footer-visible', e.isIntersecting);
    document.body.classList.toggle('is-dark-section', e.isIntersecting || document.body.classList.contains('is-intro-visible'));
    if (document.documentElement.dataset.webgl === 'off' || preset === 'mobile') continue;
    if (e.isIntersecting) {
      footer3d ??= import('./footer3d.js').then((m) => m.mountFooter3d(document.getElementById('footer-scene')));
      footer3d.then((s) => s.start());
    } else footer3d?.then((s) => s.stop());
  }
}, { threshold: 0.25 }).observe(footer);

const preset = getDevicePreset();
document.body.dataset.preset = preset;
mountCursor();

/** Без WebGL: статичный кадр белой сцены, обычный скролл, светлая тема; сцена не импортируется. */
function bootFallback() {
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-light', 'is-released');
  dom.hero.classList.add('hero--released');
  dom.nav.classList.add('nav--visible');
  dom.tagline.classList.add('tagline--visible');
  dom.askScene.classList.add('ask--visible');
  // меню работает и здесь: сцены нет, скролл уже нативный
  mountMenu(document.getElementById('menu'), document.getElementById('menu-toggle'), content, NO_SCENE_SCROLL);
}

const noWebgl = document.documentElement.dataset.webgl === 'off';
const analytics = installAnalytics(content.analytics, { hasScene: !noWebgl });

if (noWebgl) {
  bootFallback();
  analytics.whiteScene(); // кадр белой сцены — это и есть первый экран фолбэка
} else {
  import('./boot3d.js').then((m) => m.boot3d({ preset, dom, analytics }));
}
