// Стопка кейсов на /cases/ (.scratch/about-cases): какой слайд где лежит, куда ведёт свайп.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrap, stackPositions, swipeStep } from '../../portal/src/scripts/case-stack.js';
import { yearsLabel, byStackOrder, caseFactsMarkdown } from '../../portal/src/lib/cases.mjs';

test('wrap: листание по кругу в обе стороны', () => {
  assert.equal(wrap(4, 4), 0);
  assert.equal(wrap(-1, 4), 3);
  assert.equal(wrap(2, 4), 2);
});

test('активный слайд спереди (0), следующие за ним — глубже, дальше глубины — скрыты на последнем уровне', () => {
  assert.deepEqual(stackPositions(5, 0), [0, 1, 2, 3, 3]);
  assert.deepEqual(stackPositions(5, 3), [2, 3, 3, 0, 1]);
  assert.deepEqual(stackPositions(2, 1), [1, 0]);
  assert.deepEqual(stackPositions(1, 0), [0]);
});

test('глубина настраивается: видимых задних слайдов — depth - 1', () => {
  assert.deepEqual(stackPositions(4, 0, 2), [0, 1, 2, 2]);
});

test('свайп: влево дальше порога — следующий, вправо — предыдущий, короткий — на месте', () => {
  assert.equal(swipeStep(-80), 1);
  assert.equal(swipeStep(80), -1);
  assert.equal(swipeStep(30), 0);
  assert.equal(swipeStep(-30), 0);
  assert.equal(swipeStep(-50, 40), 1);
});

test('годы кейса: «2018 — 2019», один год, «2024 — сейчас»', () => {
  assert.equal(yearsLabel({ from: 2018, to: 2019 }), '2018 — 2019');
  assert.equal(yearsLabel({ from: 2020, to: 2020 }), '2020');
  assert.equal(yearsLabel({ from: 2024 }), '2024 — сейчас');
});

test('порядок стопки: по order, при равенстве — новее раньше', () => {
  const m = (order, date) => ({ data: { order, date: new Date(date) } });
  const sorted = [m(2, '2026-01-01'), m(1, '2025-01-01'), m(2, '2026-05-01')].sort(byStackOrder);
  assert.deepEqual(sorted.map((x) => [x.data.order, x.data.date.getUTCMonth()]), [[1, 0], [2, 4], [2, 0]]);
});

test('факты кейса в Markdown: годы, роль, каждая метрика числом, шаги', () => {
  const md = caseFactsMarkdown({ years: { from: 2018, to: 2019 }, kind: 'B2B-платформа', role: 'Техлид', context: 'Оптовикам',
    metrics: [{ value: '×3', label: 'выручка' }, { value: '40', label: 'клиентов' }], steps: ['A', 'B', 'C'], stack: [] });
  assert.match(md, /2018 — 2019 · B2B-платформа/);
  assert.match(md, /- выручка: ×3/);
  assert.match(md, /- клиентов: 40/);
  assert.match(md, /Шаги: A; B; C/);
  assert.doesNotMatch(md, /Стек/);
});
