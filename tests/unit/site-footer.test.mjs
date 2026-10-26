import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFooter } from '../../shared/site-footer.js';
import { loadSiteData } from '../../scripts/site-data.mjs';

const data = await loadSiteData();
const html = renderFooter({ ...data, year: 2026 });
const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

test('в подвале есть все направления портала', () => {
  for (const d of Object.values(data.DIRECTION_INFO)) {
    assert.ok(hrefs.includes(d.path), `нет ссылки на ${d.path}`);
    assert.ok(html.includes(d.title), `нет названия «${d.title}»`);
  }
});

test('в подвале есть все разделы из шапки', () => {
  for (const k of data.NAV) assert.ok(hrefs.includes(data.SECTIONS[k].path), `нет раздела ${k}`);
});

test('в подвале есть все профили, контакт и служебные ссылки', () => {
  for (const p of data.PROFILES) assert.ok(hrefs.includes(p.href), `нет профиля ${p.label}`);
  assert.ok(hrefs.includes(data.SITE.contact.href));
  assert.ok(html.includes(data.SITE.positioning));
  for (const h of ['/rss.xml', '/llms.txt']) assert.ok(hrefs.includes(h), `нет ${h}`);
  assert.ok(html.includes('© 2026'));
});

test('подвал статичный: без canvas, скриптов и анимаций', () => {
  assert.doesNotMatch(html, /<canvas|<script|animate|<style/i);
});

test('внешние ссылки открываются в новой вкладке, текст экранируется', () => {
  assert.match(html, /href="https:\/\/t\.me\/kibarik"[^>]*target="_blank"[^>]*rel="noopener/);
  const evil = renderFooter({ ...data, SITE: { ...data.SITE, positioning: '<b>&' }, year: 2026 });
  assert.ok(evil.includes('&lt;b&gt;&amp;') && !evil.includes('<b>'));
});
