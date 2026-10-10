#!/usr/bin/env node
/**
 * Статический сервер dist/ с поведением Timeweb App Platform (проверено на slides.aleksishmanov.ru, 2026-10-10):
 * каталог без слэша → 308 на слэш, есть 404.html → он с кодом 404. Нужен E2E-тестам портала.
 *   node scripts/serve-dist.mjs [порт=4174]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './local-server.mjs';

const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.argv[2] || 4174);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };

function send(res, file, status = 200) {
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let rel;
  try { rel = decodeURIComponent(url.pathname); } catch { rel = url.pathname; }
  const file = path.join(DIST, path.normalize(rel));
  if (!file.startsWith(DIST)) { res.writeHead(400); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(308, { Location: `${url.pathname}/${url.search}` }); res.end(); return; }
    const index = path.join(file, 'index.html');
    if (fs.existsSync(index)) return send(res, index);
  } else if (fs.existsSync(file)) return send(res, file);
  send(res, path.join(DIST, '404.html'), 404);
}).listen(PORT, () => console.log(`dist/ на http://localhost:${PORT}`));
