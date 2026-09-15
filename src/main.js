import { createScene } from './scene.js';
import { installCompare } from './compare.js';

const loader = document.getElementById('loader');
const pct = document.getElementById('loader-pct');
const path = document.querySelector('.loader__path');
const nav = document.getElementById('nav');
const hint = document.getElementById('scroll-hint');

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

function finish() {
  if (finished) return;
  finished = true;
  loader.classList.add('loader--done');
  document.body.classList.remove('is-loading');
  app.lightsOn();
  setTimeout(() => { nav.classList.add('nav--visible'); hint.classList.add('scroll-hint--visible'); }, 900);
}

createScene(document.getElementById('scene'), { onProgress: (p) => { real = Math.max(real, p); } })
  .then((s) => { app = s; app.start(); real = 1; window.__app = app; installCompare(app); })
  .catch((err) => { console.error(err); pct.textContent = 'error'; });
