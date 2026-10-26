// Свежие материалы под статьёй (.scratch/redesign/issues/07): три последних того же раздела, без текущего и черновиков.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshMaterials } from '../../portal/src/lib/fresh.mjs';

const m = (collection, id, date, draft = false) => ({ collection, id, data: { date: new Date(date), draft } });
const blog = [
  m('blog', 'a', '2026-01-01'),
  m('blog', 'b', '2026-02-01'),
  m('blog', 'c', '2026-03-01'),
  m('blog', 'd', '2026-04-01'),
  m('blog', 'e', '2026-05-01'),
];
const ids = (xs) => xs.map((x) => x.id);

test('три последних того же раздела по дате, новые сверху', () => {
  assert.deepEqual(ids(freshMaterials(blog, blog[0])), ['e', 'd', 'c']);
});

test('текущий материал не попадает, даже если он самый свежий', () => {
  assert.deepEqual(ids(freshMaterials(blog, blog[4])), ['d', 'c', 'b']);
});

test('другие разделы и черновики не считаются', () => {
  const all = [...blog, m('tools', 't', '2026-06-01'), m('blog', 'x', '2026-07-01', true)];
  assert.deepEqual(ids(freshMaterials(all, blog[0])), ['e', 'd', 'c']);
});

test('в разделе меньше трёх — отдаём сколько есть; пусто — пустой список', () => {
  const two = [m('tools', 'p', '2026-01-01'), m('tools', 'q', '2026-02-01')];
  assert.deepEqual(ids(freshMaterials(two, two[0])), ['q']);
  assert.deepEqual(freshMaterials([two[0]], two[0]), []);
});
