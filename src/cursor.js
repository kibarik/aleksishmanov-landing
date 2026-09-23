/**
 * Курсор-точка как у референса: тёмная точка догоняет мышь с инерцией, над ссылками и кнопками
 * гаснет и превращается в кольцо. Только десктоп: на touch и узких экранах системный курсор.
 */

/** Ширина, ниже которой курсор не включаем (там всё равно тач). */
const MIN_WIDTH = 769;
/** Время, за которое точка практически догоняет мышь. */
const FOLLOW_SEC = 0.32;
/** Элементы, над которыми точка превращается в кольцо. */
const INTERACTIVE = 'a, button, [role="button"], input, label, summary';

const followK = (sec) => 1 - Math.pow(0.01, 1 / Math.max(1, sec * 60));

export function mountCursor() {
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (touch || window.innerWidth < MIN_WIDTH) return null;

  const root = document.createElement('div');
  root.className = 'cursor';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"></span>';
  document.body.appendChild(root);
  document.body.classList.add('has-cursor');

  const k = followK(FOLLOW_SEC);
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let seen = false;
  let raf = 0;

  function frame() {
    x += (targetX - x) * k;
    y += (targetY - y) * k;
    root.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%)`;
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    targetX = e.clientX;
    targetY = e.clientY;
    if (!seen) { seen = true; x = targetX; y = targetY; root.classList.add('cursor--seen'); }
    root.classList.toggle('cursor--active', !!e.target.closest?.(INTERACTIVE));
  }, { passive: true });

  window.addEventListener('pointerdown', () => root.classList.add('cursor--down'), { passive: true });
  window.addEventListener('pointerup', () => root.classList.remove('cursor--down'), { passive: true });
  document.addEventListener('pointerleave', () => root.classList.remove('cursor--seen'));

  raf = requestAnimationFrame(frame);
  return { destroy() { cancelAnimationFrame(raf); root.remove(); document.body.classList.remove('has-cursor'); } };
}
