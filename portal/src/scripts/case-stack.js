// Логика стопки кейсов на /cases/: чистые функции, без DOM — их проверяет tests/unit/case-stack.test.mjs,
// а разметку и события ведёт компонент CaseStack.astro. Почему без библиотеки —
// .scratch/about-cases/research/case-slide-and-stack.md (раздел 2).

/** Номер слайда по кругу: за последним — первый, перед первым — последний. */
export const wrap = (i, n) => ((i % n) + n) % n;

/**
 * Позиция каждого слайда в стопке: 0 — спереди (активный), 1…depth-1 — выглядывают сзади,
 * depth — спрятан за стопкой (CSS прячет его, но держит на месте, чтобы он выезжал без скачка).
 */
export function stackPositions(n, current, depth = 3) {
  return Array.from({ length: n }, (_, k) => Math.min(wrap(k - current, n), depth));
}

/** Свайп по стопке: влево дальше порога — следующий (+1), вправо — предыдущий (-1), короче — на месте (0). */
export function swipeStep(dx, threshold = 60) {
  if (Math.abs(dx) <= threshold) return 0;
  return dx < 0 ? 1 : -1;
}

/** Годы кейса для подписи слайда: «2018 — 2019», «2020», «2024 — сейчас». */
export function yearsLabel({ from, to }) {
  if (to === undefined) return `${from} — сейчас`;
  return from === to ? String(from) : `${from} — ${to}`;
}
