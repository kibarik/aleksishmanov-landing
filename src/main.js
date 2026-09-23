// Шрифты локально (без Google Fonts): детерминированная отрисовка имени на сцене и Lighthouse.
// Полные css с unicode-range: браузер грузит только нужные сабсеты (латиница + кириллица).
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/800.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/900.css';
import { content } from './content.js';
import { mountSections } from './sections.js';
import { mountMenu } from './menu.js';
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

// тексты первого экрана — из модуля контента, в разметке ничего не захардкожено
document.getElementById('loader-offer').textContent = content.offer;
dom.tagline.textContent = content.tagline;
// Ask Ishmanov AI: обе кнопки из одной константы контента (замена на бота — правка href там)
dom.askScene.href = content.ask.href;
dom.askScene.querySelector('.ask__label').textContent = content.ask.label;
dom.askNav.href = content.ask.href;
dom.askNav.textContent = content.ask.label;
mountSections(document.getElementById('content'), content);

const preset = getDevicePreset();
document.body.dataset.preset = preset;

/** Без WebGL: статичный кадр белой сцены, обычный скролл, светлая тема; сцена не импортируется. */
function bootFallback() {
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-light', 'is-released');
  dom.hero.classList.add('hero--released');
  dom.nav.classList.add('nav--visible');
  dom.tagline.classList.add('tagline--visible');
  dom.askScene.classList.add('ask--visible');
  // меню работает и здесь: сцены нет, скролл уже нативный
  mountMenu(document.getElementById('menu'), document.getElementById('menu-toggle'), content, {
    state: { released: true }, release() {}, setPaused() {},
  });
}

const noWebgl = document.documentElement.dataset.webgl === 'off';
const analytics = installAnalytics(content, { hasScene: !noWebgl });

if (noWebgl) {
  bootFallback();
  analytics.whiteScene(); // кадр белой сцены — это и есть первый экран фолбэка
} else {
  import('./boot3d.js').then((m) => m.boot3d({ preset, dom, analytics }));
}
