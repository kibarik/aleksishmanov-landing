// Методология (ADR 0006): дерево узлов целое, а прикреплённые материалы существуют.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const CONTENT = new URL('../../portal/src/content/', import.meta.url).pathname;
const DIR = path.join(CONTENT, 'method');

function front(file) {
  const fm = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)[1];
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim().replace(/^"|"$/g, '');
  const mats = (fm.match(/^materials:\s*\[([\s\S]*?)\]/m) || [])[1];
  return { level: get('level'), parent: get('parent'), status: get('status'), materials: mats ? [...mats.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [] };
}

const nodes = fs.existsSync(DIR)
  ? Object.fromEntries(fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => [f.slice(0, -3), front(path.join(DIR, f))]))
  : {};

test('ровно один корень level: problem', () => {
  assert.equal(Object.values(nodes).filter((n) => n.level === 'problem').length, 1);
});

test('у каждого узла существует родитель, циклов нет', () => {
  for (const [id, n] of Object.entries(nodes)) {
    if (n.level === 'problem') { assert.ok(!n.parent, `${id}: у корня не должно быть parent`); continue; }
    assert.ok(nodes[n.parent], `${id}: нет родителя «${n.parent}»`);
    const seen = new Set([id]);
    let cur = nodes[n.parent];
    let curId = n.parent;
    while (cur && cur.parent) { assert.ok(!seen.has(curId), `${id}: цикл`); seen.add(curId); curId = cur.parent; cur = nodes[curId]; }
  }
});

test('области — дети корня, темы — дети областей', () => {
  for (const [id, n] of Object.entries(nodes)) {
    if (n.level === 'area') assert.equal(nodes[n.parent]?.level, 'problem', `${id}: область должна висеть на корне`);
    if (n.level === 'topic') assert.equal(nodes[n.parent]?.level, 'area', `${id}: тема должна висеть на области`);
  }
});

test('прикреплённые материалы существуют', () => {
  const missing = [];
  for (const [id, n] of Object.entries(nodes)) {
    for (const m of n.materials) if (!fs.existsSync(path.join(CONTENT, `${m}.md`))) missing.push(`${id} → ${m}`);
  }
  assert.deepEqual(missing, []);
});
