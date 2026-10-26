/**
 * Данные портала (portal/src/lib/site.ts) для кода вне Astro: сборка главной и юнит-тесты.
 * TypeScript снимаем esbuild-ом (он уже есть в зависимостях Vite), версия Node не важна.
 */
import fs from 'node:fs';
import path from 'node:path';
import { transform } from 'esbuild';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export async function loadSiteData() {
  const src = fs.readFileSync(path.join(ROOT, 'portal', 'src', 'lib', 'site.ts'), 'utf8');
  const { code } = await transform(src, { loader: 'ts', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
