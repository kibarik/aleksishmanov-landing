// Уровни заголовков в тексте материала — без скачков (аудит heading-order, доступность): над текстом стоит
// h1 статьи, а импортированные из Teletype/Telegram тексты начинаются с h3 или прыгают h2 → h4.
// Заголовок не глубже предыдущего + 1, h1 внутри текста — h2. Внешний вид задаёт CSS по уровню.
import { visit } from 'unist-util-visit';

export function rehypeHeadingOrder() {
  return (tree) => {
    let prev = 1;
    visit(tree, 'element', (node) => {
      const m = /^h([1-6])$/.exec(node.tagName);
      if (!m) return;
      const level = Math.max(2, Math.min(Number(m[1]), prev + 1));
      node.tagName = `h${level}`;
      prev = level;
    });
  };
}
