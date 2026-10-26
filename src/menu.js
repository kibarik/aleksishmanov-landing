/**
 * Меню по модели bersus.io: открывается кликом по кнопке; из угла кнопки вырастает белый круг (~0,6 с), затем
 * пункты выезжают по буквам. Закрывается крестиком, Escape или переходом по ссылке, но обычное закрытие — только когда
 * анимация доиграла: тот же таймлайн задом наперёд в 3 раза быстрее, затем 1,5 с нельзя открыть снова.
 * Фокус уходит в меню при открытии и возвращается на кнопку. Мобильный режим и prefers-reduced-motion: без круга и
 * побуквенной анимации (нижний док и карточка-меню над ним). Пока меню открыто, липкий скролл не принимает жесты.
 */
import emblem from './menu-emblem.svg?url';

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/** Расписание таймлайна (секунды): как у эталона — пункты по буквам, потом кнопка, крестик и нижние ссылки. */
const T = {
  total: 1.9,
  itemStarts: [0.1, 0.26, 0.42, 0.54, 0.66, 0.78, 0.9],
  charDur: 0.3, charStagger: 0.02,
  note: { dur: 0.4 },
  cross: { start: 0.2, dur: 0.9 },
  cta: { start: 1.1, dur: 0.6 },
  social: { start: 1.6, dur: 0.2 },
};
const OPEN_DELAY_MS = 600; // белый круг вырастает (--circle-open в style.css), и только потом стартует таймлайн
const REOPEN_LOCK_MS = 1500; // после закрытия
const CLOSE_SPEED = 3;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const power2InOut = (p) => (p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2);
/** gsap back.inOut(overshoot) */
const backInOut = (over) => {
  const s = over * 1.525;
  return (p) => ((p *= 2) < 1 ? 0.5 * p * p * ((s + 1) * p - s) : 0.5 * ((p -= 2) * p * ((s + 1) * p + s) + 2));
};
const back3 = backInOut(3);

const ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 55 55' fill='none' stroke='%230b0b0b' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 27.5h30M30 15l12.5 12.5L30 40'/%3E%3C/svg%3E\")";

function chars(label) {
  return [...label].map((ch) => (ch === ' ' ? ' ' : `<span class="menu__char" aria-hidden="true">${esc(ch)}</span>`)).join('');
}

function markup(content) {
  const { menu, contact } = content;
  return `
    <div class="menu__overlay" id="menu-overlay"></div>
    <div class="menu__circle" aria-hidden="true"></div>
    <nav class="menu__panel" aria-label="${esc(menu.title)}" style="--arrow:${ARROW}">
      <div class="menu__art" aria-hidden="true"><img src="${emblem}" alt="" loading="lazy" decoding="async" /></div>
      <i class="menu__dot" aria-hidden="true"></i>
      <button class="menu__close" id="menu-close" type="button" aria-label="Закрыть меню">
        <svg viewBox="0 0 46 46" aria-hidden="true"><path d="M9 9l28 28M37 9L9 37" /></svg>
      </button>
      <div class="menu__main">
        <ul class="menu__directions menu__list">
          ${menu.directions.map((d) => `<li><a class="menu__direction" href="${esc(d.href)}" aria-label="${esc(d.label)}. ${esc(d.note)}"><span class="menu__anchor">${chars(d.label)}</span><span class="menu__note">${esc(d.note)}</span></a></li>`).join('')}
        </ul>
        <ul class="menu__pages menu__list">
          ${menu.pages.map((a) => `<li><a class="menu__anchor menu__page" href="${esc(a.href)}" aria-label="${esc(a.label)}">${chars(a.label)}</a></li>`).join('')}
        </ul>
      </div>
      <div class="menu__side">
        <a class="menu__cta" href="${esc(contact.href)}" target="_blank" rel="noopener noreferrer">
          <span class="menu__cta-pointer" aria-hidden="true"></span><span class="menu__cta-label">${esc(contact.title)}</span>
        </a>
        <p class="menu__social"><a href="${esc(menu.social.href)}" target="_blank" rel="noopener noreferrer">${esc(menu.social.label)}: ${esc(menu.social.handle)}</a></p>
        <p class="menu__home"><a class="menu__back" href="${esc(menu.home.href)}">${esc(menu.home.label)}</a></p>
      </div>
    </nav>`;
}

/** Нижний док мобильного режима (как у референса): ☰ слева, четыре перехода, имя водяным знаком. */
function dockMarkup(content) {
  return `<div class="dock__bar">
      <span class="dock__mark" aria-hidden="true">${esc(content.name.mobile)}</span>
      <button class="dock__menu" id="menu-dock-toggle" type="button" aria-label="Меню" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
      ${content.menu.dock.map((a) => `<a class="dock__btn" href="${esc(a.href)}">${esc(a.label)}</a>`).join('')}
    </div>`;
}

/** Липкий скролл без сцены (фолбэк без WebGL): страница уже отдана нативному скроллу. */
export const NO_SCENE_SCROLL = { state: { released: true }, release() {}, setPaused() {} };

/** Таймлайн: render(t) расставляет стили по времени; play/reverse гоняют t через rAF. */
function createTimeline(root) {
  const entries = [];
  const items = [...root.querySelectorAll('.menu__list li')];
  items.forEach((li, i) => {
    const start = T.itemStarts[i] ?? T.itemStarts.at(-1) + 0.12 * (i - T.itemStarts.length + 1);
    [...li.querySelectorAll('.menu__char')].forEach((el, k) => {
      entries.push({ el, start: start + k * T.charStagger, dur: T.charDur, ease: back3, x: 30, y: 0, scale: 1.2 });
    });
    const note = li.querySelector('.menu__note');
    if (note) entries.push({ el: note, start: start + 0.3, dur: T.note.dur, ease: power2InOut, x: 0, y: 10, scale: 1 });
  });
  const cta = root.querySelector('.menu__cta');
  const social = root.querySelector('.menu__social');
  const close = root.querySelector('.menu__close');
  entries.push({ el: cta, ...T.cta, ease: back3, x: 100, y: 0, scale: 1 });
  entries.push({ el: close, ...T.cross, ease: power2InOut, x: 0, y: 0, scale: 1 });
  entries.push({ el: social, ...T.social, ease: power2InOut, x: 0, y: 10, scale: 1 });

  let t = 0; let raf = 0;
  function render(time) {
    t = time;
    for (const e of entries) {
      const v = e.ease(clamp01((time - e.start) / e.dur));
      e.el.style.opacity = String(clamp01(v));
      const x = e.x * (1 - v); const y = e.y * (1 - v); const s = e.scale + (1 - e.scale) * v;
      e.el.style.transform = x || y || s !== 1 ? `translate3d(${x}px, ${y}px, 0) scale(${s})` : 'none';
    }
  }
  function run(target, speed, done) {
    cancelAnimationFrame(raf);
    let prev = performance.now();
    const step = (now) => {
      const dt = (now - prev) / 1000; prev = now;
      const dir = Math.sign(target - t);
      const next = t + dir * speed * dt;
      if ((dir > 0 && next >= target) || (dir < 0 && next <= target) || dir === 0) { render(target); raf = 0; done?.(); return; }
      render(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  render(0);
  return {
    play: (done) => run(T.total, 1, done),
    reverse: (done) => run(0, CLOSE_SPEED, done),
    set: (time) => { cancelAnimationFrame(raf); raf = 0; render(time); },
    get time() { return t; },
  };
}

/**
 * @param root контейнер меню (#menu)
 * @param toggle кнопка в шапке
 * @param sticky липкий скролл: release() и state.released
 */
export function mountMenu(root, toggle, content, sticky) {
  root.innerHTML = markup(content);
  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.id = 'menu-dock';
  dock.innerHTML = dockMarkup(content);
  root.insertAdjacentElement('afterend', dock);
  const dockToggle = dock.querySelector('#menu-dock-toggle');

  const close = root.querySelector('#menu-close');
  const overlay = root.querySelector('#menu-overlay');
  const circle = root.querySelector('.menu__circle');
  const timeline = createTimeline(root);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMq = matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)');
  const toggles = [toggle, dockToggle];

  let open = false; let ready = false; let locked = false;
  let openTimer = 0; let lockTimer = 0;

  /** Белый круг растёт из центра кнопки до самого дальнего угла экрана. */
  function placeCircle() {
    const r = toggle.getBoundingClientRect();
    const ox = r.left + r.width / 2; const oy = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy)) * 1.08;
    circle.style.setProperty('--ox', `${ox}px`);
    circle.style.setProperty('--oy', `${oy}px`);
    circle.style.setProperty('--r', `${Math.ceil(radius)}px`);
  }
  function applyOpen() {
    root.classList.add('menu--open');
    document.body.classList.add('is-menu-open');
    for (const b of toggles) b.setAttribute('aria-expanded', 'true');
    root.setAttribute('aria-hidden', 'false');
    sticky.setPaused(true); // жесты не проваливаются в сцену за панелью
    close.focus({ preventScroll: true }); // фокус уходит в меню; программный фокус после клика мыши рамку не рисует
  }

  function openMenu() {
    if (open || locked) return;
    open = true; ready = false;
    if (!mobileMq.matches && !reduced.matches) placeCircle();
    applyOpen();
    if (mobileMq.matches || reduced.matches) {
      timeline.set(T.total);
      setTimeout(() => { if (open) { ready = true; root.classList.add('menu--ready'); } }, 300);
    } else {
      timeline.set(0);
      openTimer = setTimeout(() => timeline.play(() => { if (open) { ready = true; root.classList.add('menu--ready'); } }), OPEN_DELAY_MS);
    }
  }

  /** После закрытия: фейд панели и защита от мгновенного повторного открытия. */
  function finishClose(returnFocus) {
    open = false; ready = false;
    root.classList.remove('menu--open', 'menu--ready');
    document.body.classList.remove('is-menu-open');
    for (const b of toggles) b.setAttribute('aria-expanded', 'false');
    root.setAttribute('aria-hidden', 'true');
    sticky.setPaused(false);
    locked = true;
    clearTimeout(lockTimer);
    lockTimer = setTimeout(() => { locked = false; }, REOPEN_LOCK_MS);
    if (returnFocus) (mobileMq.matches ? dockToggle : toggle).focus({ preventScroll: true });
  }

  /** Обычное закрытие: только когда таймлайн доиграл; пункты уходят в обратном порядке. */
  function closeMenu() {
    if (!open || !ready) return;
    ready = false;
    if (mobileMq.matches || reduced.matches) { finishClose(true); return; }
    timeline.reverse(() => finishClose(true));
  }

  /** Закрытие по ссылке: без обратной анимации, сразу. */
  function closeInstant() {
    if (!open) return;
    clearTimeout(openTimer);
    timeline.set(0);
    finishClose(false);
  }

  const toggleMenu = () => (open ? closeMenu() : openMenu());
  toggle.addEventListener('click', toggleMenu);
  dockToggle.addEventListener('click', toggleMenu);
  close.addEventListener('click', closeMenu);
  overlay.addEventListener('click', () => { if (mobileMq.matches) closeMenu(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !open) return;
    e.stopPropagation(); // иначе клавиша уйдёт в обработчик липкого скролла
    closeMenu();
  }, { capture: true });

  /** Переход к якорю секции главной: сцена ещё липкая — сначала отдаём нативный скролл. */
  function goAnchor(a, e) {
    e.preventDefault();
    closeInstant();
    if (!sticky.state.released) sticky.release();
    const target = document.querySelector(a.getAttribute('href'));
    requestAnimationFrame(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  for (const a of [...root.querySelectorAll('.menu__direction, .menu__page'), ...dock.querySelectorAll('.dock__btn')]) {
    const href = a.getAttribute('href');
    if (href.startsWith('#')) a.addEventListener('click', (e) => goAnchor(a, e));
    else a.addEventListener('click', () => closeInstant()); // страница сменится, панель гаснет сразу
  }
  const back = root.querySelector('.menu__back');
  back.addEventListener('click', (e) => {
    closeInstant();
    if (location.pathname === '/') e.preventDefault(); // уже на главной: просто закрыть, не перезагружать
  });
  for (const a of root.querySelectorAll('.menu__social a, .menu__cta')) a.addEventListener('click', () => closeInstant());

  // «Прожектор» кнопки: круг идёт за курсором внутри кнопки, при уходе остаётся где был
  const cta = root.querySelector('.menu__cta');
  const pointer = root.querySelector('.menu__cta-pointer');
  const moveSpot = (e) => {
    const r = cta.getBoundingClientRect();
    const x = Math.min(r.width, Math.max(0, e.clientX - r.left)) - 45;
    const y = Math.min(r.height, Math.max(0, e.clientY - r.top)) - 45;
    pointer.style.setProperty('--px', `${x}px`);
    pointer.style.setProperty('--py', `${y}px`);
    cta.classList.add('menu__cta--active');
  };
  cta.addEventListener('mouseenter', moveSpot);
  cta.addEventListener('mousemove', moveSpot);
  cta.addEventListener('mouseleave', () => cta.classList.remove('menu__cta--active'));

  return {
    get open() { return open; },
    get ready() { return ready; },
    close: () => { if (open) { if (ready) closeMenu(); else closeInstant(); } },
  };
}
