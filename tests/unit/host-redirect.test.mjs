// Редирект со старых доменов на aleksishmanov.ru: shared/host-redirect.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../../shared/host-redirect.js', import.meta.url), 'utf8');

function run(host, pathname, search = '', hash = '') {
  let replaced = null;
  const window = { location: { hostname: host, pathname, search, hash, replace: (u) => { replaced = u; } } };
  vm.runInNewContext(code, { window });
  return replaced;
}

test('на основном домене и локально ничего не делает', () => {
  assert.equal(run('aleksishmanov.ru', '/blog/x/'), null);
  assert.equal(run('localhost', '/'), null);
  assert.equal(run('127.0.0.1', '/tools/'), null);
});

test('blog.: статьи под /blog/, корень и рубрики — в /blog/, ленты — в rss', () => {
  assert.equal(run('blog.aleksishmanov.ru', '/bullseye-framework/', '?utm_source=tg'), 'https://aleksishmanov.ru/blog/bullseye-framework/?utm_source=tg');
  assert.equal(run('blog.aleksishmanov.ru', '/'), 'https://aleksishmanov.ru/blog/');
  assert.equal(run('blog.aleksishmanov.ru', '/Ju2LlW1vxzM'), 'https://aleksishmanov.ru/blog/ju2llw1vxzm');
  assert.equal(run('blog.aleksishmanov.ru', '/+product-management/'), 'https://aleksishmanov.ru/blog/');
  assert.equal(run('blog.aleksishmanov.ru', '/data/rss/'), 'https://aleksishmanov.ru/rss.xml');
});

test('slides., prompts., call., www.', () => {
  assert.equal(run('slides.aleksishmanov.ru', '/okr-quarter-planning/', '', '#3'), 'https://aleksishmanov.ru/slides/okr-quarter-planning/#3');
  assert.equal(run('slides.aleksishmanov.ru', '/'), 'https://aleksishmanov.ru/slides/');
  assert.equal(run('prompts.aleksishmanov.ru', '/'), 'https://aleksishmanov.ru/prompts/');
  assert.equal(run('prompts.aleksishmanov.ru', '/prompts/tam-sam-som/'), 'https://aleksishmanov.ru/prompts/tam-sam-som/');
  assert.equal(run('call.aleksishmanov.ru', '/'), 'https://aleksishmanov.ru/call/');
  assert.equal(run('www.aleksishmanov.ru', '/about/'), 'https://aleksishmanov.ru/about/');
});
