// «Обо мне» на главной (.scratch/about-cases): пустые блоки не выводятся, заполненные — появляются,
// заглушек в квадратных скобках на сайте нет, переход в «Кейсы» есть всегда.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../../src/content.js';
import { renderSections } from '../../src/sections.js';

const about = (patch = {}) => {
  const html = renderSections({ ...content, about: { ...content.about, ...patch } });
  return html.slice(html.indexOf('id="about"'), html.indexOf('id="projects"'));
};
const text = (html) => html.replace(/<[^>]+>/g, ' ');

test('опубликованный текст «Обо мне» без заглушек [в скобках]', () => {
  assert.doesNotMatch(text(about()), /\[[^\]]*\]/);
});

test('факты и карьерный путь — из контента, по строке на пункт', () => {
  const html = about();
  assert.equal((html.match(/class="about__fact"/g) || []).length, content.about.facts.length);
  assert.equal((html.match(/class="path__row"/g) || []).length, content.about.career.items.length);
  for (const { role } of content.about.career.items) assert.ok(html.includes(role), role);
});

test('пустая строка пути — без «· компании» и без пустой строки итога', () => {
  const html = about({ career: { title: 'Путь', items: [{ period: 'с 2016', role: 'Роль', org: '', text: '' }] } });
  assert.doesNotMatch(html, /path__org/);
  assert.doesNotMatch(html, /path__text/);
  const full = about({ career: { title: 'Путь', items: [{ period: '2016 — 2018', role: 'Роль', org: 'Компания', text: 'Итог' }] } });
  assert.match(full, /path__org[^>]*>[^<]*Компания/);
  assert.match(full, /path__text[^>]*>Итог/);
});

test('образование: нет пунктов — блока нет, есть — заголовок и пункты', () => {
  assert.doesNotMatch(about({ education: { title: 'Образование', items: [] } }), /Образование/);
  const html = about({ education: { title: 'Образование', items: [{ period: '2010 — 2016', org: 'МГТУ', text: 'Информатика' }] } });
  assert.match(html, /Образование/);
  assert.match(html, /МГТУ/);
});

test('последний год: без фразы — блока нет; с фразой — фраза, цифры и пункты', () => {
  assert.doesNotMatch(about({ lastYear: { title: 'Последний год', period: '', lead: '', metrics: [], points: [] } }), /class="year"/);
  const html = about({ lastYear: { title: 'Последний год', period: '2025 — 2026', lead: 'Запускаю ИИ-агентов', metrics: [{ value: '12', label: 'агентов' }], points: ['Пункт'] } });
  assert.match(html, /class="year"/);
  assert.match(html, /Запускаю ИИ-агентов/);
  assert.match(html, /<dt>12<\/dt>/);
  assert.match(html, /<li>Пункт<\/li>/);
});

test('переход в «Кейсы»: ссылка на /cases/ с подписью', () => {
  const html = about();
  assert.match(html, new RegExp(`<a class="about__cases" href="${content.about.cases.href}"`));
  assert.ok(html.includes(content.about.cases.label));
});
