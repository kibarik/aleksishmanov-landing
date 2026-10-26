// Оглавление страницы материала: подзаголовки H2 текста, если их не меньше трёх (история 43).
// Вход — headings из render() Astro ({ depth, slug, text }) с исходными уровнями: приводим их к тем,
// что в разметке после rehype-heading-order, иначе импортированный текст с h3 в начале остался бы без пунктов.
import { fixedLevel } from './rehype-heading-order.mjs';

export const TOC_MIN = 3;

export function tocItems(headings) {
  let prev = 1;
  const items = [];
  for (const h of headings) {
    const level = fixedLevel(h.depth, prev);
    prev = level;
    if (level === 2) items.push({ id: h.slug, text: h.text });
  }
  return items.length >= TOC_MIN ? items : [];
}
