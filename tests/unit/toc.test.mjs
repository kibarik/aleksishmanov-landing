// Оглавление страницы материала (.scratch/redesign/issues/06): пункты — подзаголовки H2, не меньше трёх.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tocItems } from '../../portal/src/lib/toc.mjs';

const h = (depth, slug, text = slug) => ({ depth, slug, text });

test('три и больше H2 — пункты оглавления в порядке текста', () => {
  const items = tocItems([h(2, 'a', 'Первый'), h(2, 'b', 'Второй'), h(2, 'c', 'Третий')]);
  assert.deepEqual(items, [
    { id: 'a', text: 'Первый' },
    { id: 'b', text: 'Второй' },
    { id: 'c', text: 'Третий' },
  ]);
});

test('меньше трёх H2 — оглавления нет', () => {
  assert.deepEqual(tocItems([h(2, 'a'), h(2, 'b')]), []);
  assert.deepEqual(tocItems([]), []);
});

test('вложенные H3 и глубже в пункты не попадают и не считаются', () => {
  const items = tocItems([h(2, 'a'), h(3, 'a1'), h(2, 'b'), h(4, 'b1'), h(2, 'c')]);
  assert.deepEqual(items.map((i) => i.id), ['a', 'b', 'c']);
  assert.deepEqual(tocItems([h(2, 'a'), h(3, 'x'), h(3, 'y'), h(2, 'b')]), []);
});

test('импорт с h3 в начале: уровни выравниваются так же, как в тексте (rehype-heading-order)', () => {
  // h3 первым → станет h2; затем h3 после h2 остаётся h3
  const items = tocItems([h(3, 'a'), h(3, 'b'), h(4, 'c'), h(3, 'd')]);
  // a: h2, b: h3 (prev=2 → min(3,3)), c: h4, d: h3 → один H2
  assert.deepEqual(items, []);
  const flat = tocItems([h(1, 'a'), h(1, 'b'), h(1, 'c')]);
  assert.deepEqual(flat.map((i) => i.id), ['a', 'b', 'c']);
});
