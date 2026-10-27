// Кейсы (.scratch/redesign, тикет 08): подписи, порядок списка и факты для Markdown-копии.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yearsLabel, byOrder, caseFactsMarkdown } from '../../portal/src/lib/cases.mjs';

test('годы кейса: «2018 — 2019», один год, «2024 — сейчас»', () => {
  assert.equal(yearsLabel({ from: 2018, to: 2019 }), '2018 — 2019');
  assert.equal(yearsLabel({ from: 2020, to: 2020 }), '2020');
  assert.equal(yearsLabel({ from: 2024 }), '2024 — сейчас');
});

test('порядок списка: по order, при равенстве — новее раньше', () => {
  const m = (order, date) => ({ data: { order, date: new Date(date) } });
  const sorted = [m(2, '2026-01-01'), m(1, '2025-01-01'), m(2, '2026-05-01')].sort(byOrder);
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
