/**
 * Общее для скриптов: поднять локальный сервер и подождать его, жест свайпа через CDP.
 * Используется в capture-fallback.mjs и perf-report.mjs.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function reachable(url) {
  try { await fetch(url, { signal: AbortSignal.timeout(1500) }); return true; } catch { return false; }
}

/**
 * Поднимает сервер командой npm, если по url ещё никто не отвечает.
 * @returns процесс сервера (его нужно kill) или null, если сервер уже был поднят
 */
export async function startServer(url, script = 'dev') {
  if (await reachable(url)) return null;
  console.log(`поднимаю сервер (npm run ${script})…`);
  const proc = spawn('npm', ['run', script], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    if (await reachable(url)) return proc;
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error(`сервер не поднялся на ${url}`);
}

/** Свайп вверх (контент вниз) через CDP: как в tests/e2e/helpers.js. */
export async function swipeUp(page, distance = 300, steps = 12) {
  const vp = page.viewportSize();
  const x = vp.width / 2;
  const y0 = vp.height * 0.7;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', y0);
  for (let i = 1; i <= steps; i++) { await touch('touchMove', y0 - (distance * i) / steps); await page.waitForTimeout(16); }
  await touch('touchEnd', 0);
  await cdp.detach();
}
