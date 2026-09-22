/**
 * Виртуальный «липкий» скролл по модели bersus.io.
 *
 * Прогресс — число в условных единицах (UNIT = 200 на шаг). Колесо/тач/клавиши
 * двигают targetProgress; каждый кадр target тянется к snap-точке сегмента,
 * а progress — к target (два lerp'а + ограничение скорости).
 *
 * Сегмент с commit: если жест прошёл ≥ commit доли сегмента — дотягиваем до конца,
 * иначе откатываем к началу. Паузы блокируют прогресс на точке на duration мс.
 * Prelude — авто-проигрыш первого сегмента после старта.
 *
 * API:
 *   const s = createStickyScroll({ steps, segments, pauses, prelude, onRelease });
 *   s.start();  s.progress;  s.onProgress(fn);  s.destroy()
 */

export const MOBILE_BREAKPOINT = 1024;
export const UNITS = { desktop: 200, mobile: 260 };
export const UNIT = UNITS.desktop;

export function getDevicePreset() {
  return window.innerWidth <= MOBILE_BREAKPOINT ? 'mobile' : 'desktop';
}

// STICKY_CONFIG.desktop / .mobile из bersus
const PRESETS = {
  desktop: { wheelSensitivity: 0.4, wheelClamp: 100, touchPixelScale: 3.2, lerpTarget: 0.035, lerpCurrent: 0.04, maxSpeed: 12 },
  mobile: { wheelSensitivity: 1.4, wheelClamp: 140, touchPixelScale: 5.1, lerpTarget: 0.065, lerpCurrent: 0.07, maxSpeed: 7 },
};
const COMMON = { keyboardStep: 60, preludeDelayMs: 500, preludeDurationMs: 2000, snapEps: 0.05 };

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** length шага = расстояние от предыдущего шага до этого (как в bersus buildStickySteps). */
export function buildSteps(defs) {
  let p = 0;
  return defs.map((d, index) => {
    p += d.length || 0;
    return { id: d.id, index, progress: p, length: d.length || 0 };
  });
}

export function createStickyScroll({ steps, segments, pauses = [], onRelease, preset = 'desktop' } = {}) {
  const CFG = { ...COMMON, ...(PRESETS[preset] || PRESETS.desktop) };
  const maxProgress = steps[steps.length - 1].progress;
  const stepById = (id) => steps.find((s) => s.id === id);
  const prog = (id) => stepById(id)?.progress ?? 0;

  const segs = segments.map((s) => ({ ...s, start: prog(s.from), end: prog(s.to) }));
  const pauseList = pauses.map((p) => ({ progress: prog(p.at), duration: p.duration ?? 500, when: p.when ?? 'forward', state: 'idle' }));

  const state = {
    progress: 0,
    target: 0,
    direction: 1,
    active: false,
    preludePlaying: false,
    preludeDone: false,
    locked: false,
    lockEndsAt: 0,
    released: false, // отдали нативному скроллу (после последнего шага)
    paused: false,   // жесты игнорируются (открыто меню)
  };
  const listeners = new Set();
  let raf = null;
  let preludeStart = 0;
  let destroyed = false;

  function emit() { for (const fn of listeners) fn(state.progress, state); }

  // ---------- snap ----------
  function findSegment(p) {
    return segs.find((s) => p >= s.start - 1e-6 && p <= s.end + 1e-6) || null;
  }
  function snapTarget(target) {
    const pre = segs.find((s) => s.prelude);
    if (pre && state.preludeDone && target < pre.end) return pre.end;
    if (target <= 0) return 0;
    if (target >= maxProgress) return maxProgress;
    const seg = findSegment(target);
    if (!seg) return target;
    const len = Math.max(1e-6, seg.end - seg.start);
    const t = (target - seg.start) / len;
    if (typeof seg.commit === 'number' && seg.commit > 0) {
      const c = Math.min(Math.max(seg.commit, 0.01), 0.49);
      if (state.direction > 0) return t >= c ? seg.end : seg.start;
      if (state.direction < 0) return t <= 1 - c ? seg.start : seg.end;
      return t < 0.5 ? seg.start : seg.end;
    }
    const ss = seg.snapStart ?? 0, se = seg.snapEnd ?? 0;
    if (t < ss) return seg.start <= 0 || (ss <= 0.2 && state.direction > 0) ? target : seg.start;
    if (t > 1 - se) return state.direction > 0 ? seg.end : (se <= 0.2 ? target : seg.start);
    return target;
  }

  // ---------- input ----------
  function applyDelta(raw) {
    if (!state.active || state.paused || state.preludePlaying || state.locked || state.released) return;
    const delta = Math.min(Math.max(raw, -CFG.wheelClamp), CFG.wheelClamp) * CFG.wheelSensitivity;
    if (delta === 0) return;
    state.direction = delta > 0 ? 1 : -1;
    let next = state.target + delta;
    // не перепрыгиваем точки паузы
    if (delta > 0) {
      const np = pauseList.find((p) => p.progress > state.progress + 1 && p.state === 'idle' && p.when !== 'back');
      if (np && next > np.progress) next = np.progress;
    } else {
      const pp = [...pauseList].reverse().find((p) => p.progress < state.progress - 1 && p.state === 'idle' && p.when !== 'forward');
      if (pp && next < pp.progress) next = pp.progress;
    }
    state.target = Math.min(Math.max(next, 0), maxProgress);
    if (delta > 0 && state.progress >= maxProgress - 0.5 && state.target >= maxProgress) release();
  }

  function onWheel(e) {
    if (state.released || state.paused) return;
    e.preventDefault();
    applyDelta(e.deltaY);
  }
  let touchY = null;
  function onTouchStart(e) { if (e.touches.length === 1) touchY = e.touches[0].clientY; }
  function onTouchMove(e) {
    if (state.released || state.paused || touchY == null || e.touches.length !== 1) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    applyDelta((touchY - y) * CFG.touchPixelScale);
    touchY = y;
  }
  function onTouchEnd() { touchY = null; }
  function onKey(e) {
    if (state.released || state.paused) return;
    const map = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    applyDelta(d * CFG.keyboardStep);
  }
  // возврат в липкий режим, если из нативного скролла долистали до верха и крутят вверх
  function onNativeWheel(e) {
    if (!state.released || state.paused) return;
    if (e.deltaY < 0 && window.scrollY <= 0) reengage();
  }

  // ---------- release / reengage ----------
  function release() {
    if (state.released) return;
    state.released = true;
    state.progress = state.target = maxProgress;
    document.body.classList.remove('is-sticky');
    onRelease?.(true);
    emit();
  }
  function reengage() {
    state.released = false;
    state.direction = -1;
    document.body.classList.add('is-sticky');
    window.scrollTo(0, 0);
    onRelease?.(false);
  }

  // ---------- loop ----------
  function loop(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(loop);
    if (state.preludePlaying) {
      const pre = segs.find((s) => s.prelude);
      const t = Math.min(1, (now - preludeStart) / CFG.preludeDurationMs);
      state.progress = pre.start + (pre.end - pre.start) * easeInOutQuad(t);
      state.target = state.progress;
      if (t >= 1) { state.preludePlaying = false; state.preludeDone = true; }
      emit();
      return;
    }
    if (state.released) return;
    if (state.locked) {
      if (now >= state.lockEndsAt) state.locked = false;
      else { emit(); return; }
    }
    const snap = snapTarget(state.target);
    state.target += (snap - state.target) * CFG.lerpTarget;
    let v = (state.target - state.progress) * CFG.lerpCurrent;
    v = Math.min(Math.max(v, -CFG.maxSpeed), CFG.maxSpeed);
    let p = state.progress + v;
    if (Math.abs(state.target - p) < CFG.snapEps && Math.abs(v) < CFG.snapEps) { p = state.target; v = 0; }
    // паузы
    for (const pz of pauseList) {
      if (pz.state !== 'idle') continue;
      if ((pz.when === 'forward' && state.direction !== 1) || (pz.when === 'back' && state.direction !== -1)) continue;
      if (Math.abs(p - pz.progress) < 1) {
        pz.state = 'locked';
        state.locked = true;
        state.lockEndsAt = now + pz.duration;
        p = pz.progress; state.target = pz.progress;
        setTimeout(() => { pz.state = 'done'; }, pz.duration + 50);
      }
    }
    state.progress = p;
    emit();
  }

  return {
    get progress() { return state.progress; },
    get state() { return state; },
    maxProgress,
    steps,
    onProgress(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    /** Локальный прогресс 0..1 между двумя шагами. */
    local(fromId, toId) {
      const a = prog(fromId), b = prog(toId);
      return Math.min(1, Math.max(0, (state.progress - a) / Math.max(1e-6, b - a)));
    },
    start() {
      state.active = true;
      document.body.classList.add('is-sticky');
      window.addEventListener('wheel', onWheel, { passive: false, capture: true });
      window.addEventListener('wheel', onNativeWheel, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
      window.addEventListener('keydown', onKey, { capture: true });
      setTimeout(() => { state.preludePlaying = true; preludeStart = performance.now(); }, CFG.preludeDelayMs);
      raf = requestAnimationFrame(loop);
    },
    seek(p) { state.progress = state.target = p; emit(); },
    /** Отдать нативный скролл принудительно (переход по якорю меню). */
    release,
    /** Пауза ввода: жесты не двигают сцену, пока открыто меню. */
    setPaused(v) { state.paused = v; },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('wheel', onNativeWheel);
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('keydown', onKey, { capture: true });
    },
  };
}
