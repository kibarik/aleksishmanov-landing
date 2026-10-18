// Статьи, написанные на сайте, проходят стандарт docs/content/article-standard.md без ошибок.
// Импортированные материалы (imported: true) не проверяются: их дорабатывают по docs/content/prompts/refresh-imported.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { lintFile } from '../../scripts/lint-content.mjs';

const BLOG = new URL('../../portal/src/content/blog/', import.meta.url);

test('статьи блога без imported: true проходят проверку без ошибок', () => {
  const files = fs.readdirSync(BLOG).filter((f) => f.endsWith('.md')).map((f) => path.join(BLOG.pathname, f));
  const failing = files
    .map((f) => lintFile(f))
    .filter((r) => !r.stats.imported)
    .map((r) => ({ file: path.basename(r.file), errors: r.issues.filter((i) => i.level === 'error').map((i) => i.msg) }))
    .filter((r) => r.errors.length);
  assert.deepEqual(failing, []);
});

test('проверка ловит битую ссылку, обрезанное описание и H1', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-'));
  const file = path.join(dir, 'bad.md');
  fs.writeFileSync(file, '---\ntitle: "Плохая статья для проверки линтера"\ndescription: "Описание, которое обрывается на полуслове…"\n---\n# Заголовок\n\nТекст со [ссылкой](/blog/net-takoy-stati/).\n');
  const rules = lintFile(file).issues.filter((i) => i.level === 'error').map((i) => i.rule);
  assert.ok(rules.includes('links'));
  assert.ok(rules.includes('description'));
  assert.ok(rules.includes('h1'));
});
