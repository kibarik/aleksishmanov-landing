import { createScene } from './scene.js';
import { installCompare } from './compare.js';
import { createStickyScroll, buildSteps, UNIT } from './stickyScroll.js';

const loader = document.getElementById('loader');
const pct = document.getElementById('loader-pct');
const path = document.querySelector('.loader__path');
const nav = document.getElementById('nav');
const hint = document.getElementById('scroll-hint');
const tagline = document.getElementById('tagline');
const hero = document.getElementById('hero');

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

// ---------- sticky scroll: шаги и сегменты как у bersus (desktop) ----------
const steps = buildSteps([
  { id: 'init' },
  { id: 'black-man', length: UNIT },
  { id: 'into-white', length: UNIT * 1.2 },
  { id: 'full', length: UNIT },
]);
const sticky = createStickyScroll({
  steps,
  segments: [
    { from: 'init', to: 'black-man', prelude: true, snapStart: 0.5, snapEnd: 0.5 },
    { from: 'black-man', to: 'into-white', commit: 0.3 },
    { from: 'into-white', to: 'full', commit: 0.3 },
  ],
  pauses: [
    { at: 'into-white', duration: 500, when: 'forward' },
    { at: 'full', duration: 500, when: 'forward' },
  ],
  onRelease(released) {
    // после full отдаём нативный скролл: сцена перестаёт быть fixed и уезжает вместе с контентом
    hero.classList.toggle('hero--released', released);
    document.body.classList.toggle('is-released', released);
  },
});
window.__sticky = sticky;

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

createScene(document.getElementById('scene'), { onProgress: (p) => { real = Math.max(real, p); } })
  .then((s) => {
    app = s; app.start(); real = 1; window.__app = app; installCompare(app);
    app.onTimeline((tl) => {
      tagline.classList.toggle('tagline--visible', tl.tagline);
      hint.classList.toggle('scroll-hint--hidden', tl.hintHidden);
    });
  })
  .catch((err) => { console.error(err); pct.textContent = 'error'; });
