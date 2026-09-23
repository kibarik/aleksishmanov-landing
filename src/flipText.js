/**
 * Флип-текст: слова появляются переворотом вокруг горизонтальной оси, одно за другим,
 * и повторяют переворот при наведении. Используется для теглайна белой сцены.
 */

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/** Длительность одного переворота при наведении (совпадает с .flip__word--spin в style.css). */
const SPIN_MS = 600;
/** Задержка между соседними словами. */
const STAGGER_MS = 90;

/**
 * Раскладывает слова в элемент и вешает переворот по наведению.
 * @param el контейнер (получает класс flip)
 * @param words массив слов; строка тоже принимается и режется по пробелам
 */
export function mountFlipText(el, words) {
  const list = Array.isArray(words) ? words : String(words).split(' ');
  el.classList.add('flip');
  el.innerHTML = list
    .map((w, i) => `<span class="flip__word" style="--i:${i}">${esc(w)}</span>`)
    .join(' ');

  const spans = [...el.querySelectorAll('.flip__word')];
  let spinning = false;

  el.addEventListener('pointerenter', () => {
    if (spinning || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    spinning = true;
    spans.forEach((s, i) => setTimeout(() => s.classList.add('flip__word--spin'), i * STAGGER_MS));
    setTimeout(() => {
      for (const s of spans) s.classList.remove('flip__word--spin');
      spinning = false;
    }, SPIN_MS + spans.length * STAGGER_MS);
  });

  return { words: list };
}
