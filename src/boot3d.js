/**
 * Запуск 3D-сцены: лоадер, липкий скролл, таймлайн, уход сцены с задержкой персонажа.
 * Импортируется динамически — на устройствах без WebGL этот модуль (и бандл three) не грузится.
 */
import { createScene } from './scene.js';
import { installCompare } from './compare.js';
import { createStickyScroll, buildSteps, UNITS } from './stickyScroll.js';
import { content } from './content.js';
import { mountMenu } from './menu.js';

/** Доля скролла, на которую персонаж отстаёт от контента на первом экране при уходе сцены. */
const PARALLAX = 0.7;

export function boot3d({ preset, dom }) {
  const { loader, pct, path, nav, hint, tagline, hero, askScene, canvas } = dom;

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
  const UNIT = UNITS[preset];
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
      sceneParallax(released);
    },
  });
  window.__sticky = sticky;
  mountMenu(document.getElementById('menu'), document.getElementById('menu-toggle'), content, sticky);

  // ---------- уход сцены: персонаж задерживается в кадре ----------
  // Канвас отстаёт от контента на первом экране высоты, потом идёт с ним синхронно.
  // Теглайн и кнопка Ask лежат в потоке hero и уезжают вместе с контентом.
  let parallaxOn = false;
  let parallaxRaf = 0;

  function applyParallax() {
    parallaxRaf = 0;
    const lag = (1 - PARALLAX) * Math.min(window.scrollY, window.innerHeight);
    canvas.style.transform = `translate3d(0, ${lag.toFixed(2)}px, 0)`;
  }
  function onParallaxScroll() {
    if (!parallaxRaf) parallaxRaf = requestAnimationFrame(applyParallax);
  }
  function sceneParallax(on) {
    if (parallaxOn === on) return;
    parallaxOn = on;
    if (on) {
      window.addEventListener('scroll', onParallaxScroll, { passive: true });
      applyParallax();
    } else {
      window.removeEventListener('scroll', onParallaxScroll);
      if (parallaxRaf) { cancelAnimationFrame(parallaxRaf); parallaxRaf = 0; }
      canvas.style.transform = '';
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    loader.classList.add('loader--done');
    document.body.classList.remove('is-loading');
    app.lightsOn();
    app.attachScroll(sticky);
    sticky.start(); // prelude стартует через 500 мс, длится 2 с
    setTimeout(() => { nav.classList.add('nav--visible'); }, 900);
    setTimeout(() => { hint.classList.add('scroll-hint--visible'); }, 2600);
  }

  createScene(canvas, { name: content.name, preset, onProgress: (p) => { real = Math.max(real, p); } })
    .then((s) => {
      app = s; app.start(); real = 1; window.__app = app; installCompare(app);
      app.onTimeline((tl) => {
        tagline.classList.toggle('tagline--visible', tl.tagline);
        askScene.classList.toggle('ask--visible', tl.tagline);
        hint.classList.toggle('scroll-hint--hidden', tl.hintHidden);
      });
    })
    .catch((err) => { console.error(err); pct.textContent = 'error'; });
}
