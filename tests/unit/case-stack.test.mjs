// Стопка кейсов на /cases/ (.scratch/about-cases): какой слайд где лежит, куда ведёт свайп.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrap, stackPositions, swipeStep, yearsLabel } from '../../portal/src/scripts/case-stack.js';

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
