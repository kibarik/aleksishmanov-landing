// Уровни заголовков в тексте материала — без скачков (аудит heading-order, доступность): над текстом стоит
// h1 статьи, а импортированные из Teletype/Telegram тексты начинаются с h3 или прыгают h2 → h4.
// Заголовок не глубже предыдущего + 1, h1 внутри текста — h2. Внешний вид задаёт CSS по уровню.
import { visit } from 'unist-util-visit';

/** Итоговый уровень заголовка по исходному и уровню предыдущего (общее правило для текста и оглавления). */
export function fixedLevel(depth, prev) {
  return Math.max(2, Math.min(depth, prev + 1));
}

export function rehypeHeadingOrder() {
  return (tree) => {
    let prev = 1;
    visit(tree, 'element', (node) => {
      const m = /^h([1-6])$/.exec(node.tagName);
      if (!m) return;
      const level = fixedLevel(Number(m[1]), prev);
      node.tagName = `h${level}`;
      prev = level;
    });
  };
}
