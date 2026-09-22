// Шрифты локально (без Google Fonts): детерминированная отрисовка имени на сцене и Lighthouse.
// Полные css с unicode-range: браузер грузит только нужные сабсеты (латиница + кириллица).
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/800.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/900.css';
import { createScene } from './scene.js';
import { installCompare } from './compare.js';
import { createStickyScroll, buildSteps, UNITS, getDevicePreset } from './stickyScroll.js';
import { content } from './content.js';
import { mountSections } from './sections.js';
import { mountMenu } from './menu.js';

const loader = document.getElementById('loader');
const pct = document.getElementById('loader-pct');
const path = document.querySelector('.loader__path');
const nav = document.getElementById('nav');
const hint = document.getElementById('scroll-hint');
const tagline = document.getElementById('tagline');
const hero = document.getElementById('hero');
const askScene = document.getElementById('ask-scene');
const askNav = document.getElementById('ask-nav');

// тексты первого экрана — из модуля контента, в разметке ничего не захардкожено
document.getElementById('loader-offer').textContent = content.offer;
tagline.textContent = content.tagline;
// Ask Ishmanov AI: обе кнопки из одной константы контента (замена на бота — правка href там)
askScene.href = content.ask.href;
askScene.querySelector('.ask__label').textContent = content.ask.label;
askNav.href = content.ask.href;
askNav.textContent = content.ask.label;
mountSections(document.getElementById('content'), content);

let real = 0;
let shown = 0;
const t0 = performance.now();
let app = null;
let finished = false;

function tickLoader() {
  const elapsed = (performance.now() - t0) / 1800;
  const target = Math.min(real, elapsed, 1);
  shown += (target - shown) * 0.15;
  if (target >= 1 && shown > 0.995) shown = 1;
  pct.textContent = Math.round(shown * 100) + '%';
  path.style.strokeDashoffset = 100 - shown * 100;
  if (shown < 1 || !app) requestAnimationFrame(tickLoader);
  else finish();
}
requestAnimationFrame(tickLoader);

// ---------- sticky scroll: шаги и сегменты как у bersus (desktop / mobile) ----------
const preset = getDevicePreset();
const UNIT = UNITS[preset];
document.body.dataset.preset = preset;
const steps = buildSteps(preset === 'mobile'
  ? [{ id: 'init' }, { id: 'black-man', length: UNIT }, { id: 'full', length: UNIT * 3.05 }]
  : [{ id: 'init' }, { id: 'black-man', length: UNIT }, { id: 'into-white', length: UNIT * 1.2 }, { id: 'full', length: UNIT }]);
const sticky = createStickyScroll({
  preset,
  steps,
  segments: preset === 'mobile'
    ? [
      { from: 'init', to: 'black-man', prelude: true, snapStart: 0.5, snapEnd: 0.5 },
      { from: 'black-man', to: 'full', commit: 0.3 },
    ]
    : [
      { from: 'init', to: 'black-man', prelude: true, snapStart: 0.5, snapEnd: 0.5 },
      { from: 'black-man', to: 'into-white', commit: 0.3 },
      { from: 'into-white', to: 'full', commit: 0.3 },
    ],
  pauses: preset === 'mobile'
    ? [{ at: 'full', duration: 500, when: 'forward' }]
    : [{ at: 'into-white', duration: 500, when: 'forward' }, { at: 'full', duration: 500, when: 'forward' }],
  onRelease(released) {
    // после full отдаём нативный скролл: сцена перестаёт быть fixed и уезжает вместе с контентом
    hero.classList.toggle('hero--released', released);
    document.body.classList.toggle('is-released', released);
  },
});
window.__sticky = sticky;
mountMenu(document.getElementById('menu'), document.getElementById('menu-toggle'), content, sticky);

function finish() {
  if (finished) return;
  finished = true;
  loader.classList.add('loader--done');
  document.body.classList.remove('is-loading');
  app.lightsOn();
  app.attachScroll(sticky, preset);
  sticky.start(); // prelude стартует через 500 мс, длится 2 с
  setTimeout(() => { nav.classList.add('nav--visible'); }, 900);
  setTimeout(() => { hint.classList.add('scroll-hint--visible'); }, 2600);
}

createScene(document.getElementById('scene'), { name: content.name, onProgress: (p) => { real = Math.max(real, p); } })
  .then((s) => {
    app = s; app.start(); real = 1; window.__app = app; installCompare(app);
    app.onTimeline((tl) => {
      tagline.classList.toggle('tagline--visible', tl.tagline);
      askScene.classList.toggle('ask--visible', tl.tagline);
      hint.classList.toggle('scroll-hint--hidden', tl.hintHidden);
    });
  })
  .catch((err) => { console.error(err); pct.textContent = 'error'; });
