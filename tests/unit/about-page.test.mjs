// «Обо мне» на портале (/about/): блоки берутся из того же content.about, что секция на главной,
// и подчиняются тому же правилу — пустой блок не выводится. Разметку собранной страницы проверяет
// tests/e2e/about.portal.spec.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../../src/content.js';
import { aboutBlocks, pathHead } from '../../portal/src/lib/about.mjs';

const blocks = (patch = {}) => aboutBlocks({ ...content.about, ...patch });

test('карьерный путь и факты — из content.about как есть, переход в «Кейсы» есть всегда', () => {
  const b = blocks();
  assert.equal(b.career, content.about.career);
  assert.equal(b.facts, content.about.facts);
  assert.equal(b.cases.href, '/cases/');
});

test('нет пунктов — нет блока: карьерный путь и образование', () => {
  assert.equal(blocks({ career: { title: 'Карьерный путь', items: [] } }).career, null);
  assert.equal(blocks({ education: { title: 'Образование', items: [] } }).education, null);
  const edu = { title: 'Образование', items: [{ period: '2010 — 2016', org: 'МГТУ', text: 'Информатика' }] };
  assert.equal(blocks({ education: edu }).education, edu);
});

test('последний год: без фразы блока нет, с фразой — есть, пустые цифры и пункты не ломают блок', () => {
  assert.equal(blocks({ lastYear: { title: 'Последний год', period: '', lead: '', metrics: [{ value: '1', label: 'x' }], points: ['p'] } }).lastYear, null);
  const y = blocks({ lastYear: { title: 'Последний год', lead: 'Запускаю ИИ-агентов' } }).lastYear;
  assert.equal(y.lead, 'Запускаю ИИ-агентов');
  assert.deepEqual([y.metrics, y.points], [[], []]);
});

test('строка пути: роль · компания; без компании — только роль; у образования — организация', () => {
  assert.deepEqual(pathHead({ role: 'Техлид', org: 'Компания' }), { main: 'Техлид', org: 'Компания' });
  assert.deepEqual(pathHead({ role: 'Техлид', org: '' }), { main: 'Техлид', org: '' });
  assert.deepEqual(pathHead({ org: 'МГТУ' }), { main: 'МГТУ', org: '' });
});
