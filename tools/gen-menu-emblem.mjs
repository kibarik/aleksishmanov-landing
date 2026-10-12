// Генератор знака для меню (src/menu-emblem.svg): белая гравюра «пирамида с глазом» на прозрачном фоне.
// Знак наш, а не копия картинки bersus.io. Запуск: node tools/gen-menu-emblem.mjs
import { writeFileSync } from 'node:fs';

const W = 929, H = 943;
const cx = W / 2;
const apexY = 190, baseY = 820, baseHalf = 330;
const half = (y) => ((y - apexY) / (baseY - apexY)) * baseHalf;
const out = [];
const line = (x1, y1, x2, y2, w = 3) => out.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke-width="${w}"/>`);

// контур пирамиды
line(cx, apexY, cx - baseHalf, baseY, 7);
line(cx, apexY, cx + baseHalf, baseY, 7);
line(cx - baseHalf, baseY, cx + baseHalf, baseY, 7);

// ряды кладки: горизонтали и смещённые вертикальные швы
const rows = 14;
for (let r = 1; r <= rows; r++) {
  const y = apexY + ((baseY - apexY) * r) / rows;
  const yPrev = apexY + ((baseY - apexY) * (r - 1)) / rows;
  if (r > 2) line(cx - half(y), y, cx + half(y), y, 3);
  const n = Math.max(1, Math.round(half(y) / 34));
  for (let k = -n; k <= n; k++) {
    const off = (r % 2) * 0.5;
    const x = cx + ((k + off) / (n + 0.5)) * half(y);
    if (Math.abs(x - cx) < half(y) - 6 && r > 2) line(x, yPrev + 3, x * (half(yPrev) / half(y)) + cx * (1 - half(yPrev) / half(y)), y - 3, 2);
  }
}

// заштрихованная левая грань
for (let i = 0; i < 40; i++) {
  const t = i / 40;
  const y = apexY + 40 + (baseY - apexY - 60) * t;
  line(cx - half(y) + 4, y, cx - half(y) * 0.78, y + 18, 2);
}

// луч-сияние вокруг вершины
const ex = cx, ey = 175;
for (let a = 0; a < 360; a += 6) {
  const rad = (a * Math.PI) / 180;
  const r1 = 98, r2 = 118 + (a % 12 === 0 ? 70 : 28);
  line(ex + Math.cos(rad) * r1, ey + Math.sin(rad) * r1, ex + Math.cos(rad) * r2, ey + Math.sin(rad) * r2, a % 12 === 0 ? 4 : 2.5);
}

// парящий треугольник с глазом (чёрная заливка — прозрачные «вырезы», обводка белая)
const triTop = 78, triBot = 258, triHalf = 125;
out.push(`<path d="M${ex} ${triTop}L${ex + triHalf} ${triBot}L${ex - triHalf} ${triBot}Z" stroke-width="7" fill="#000" fill-opacity="0.001" stroke-linejoin="round"/>`);
out.push(`<path d="M${ex - 62} ${ey + 28}Q${ex} ${ey - 42} ${ex + 62} ${ey + 28}Q${ex} ${ey + 88} ${ex - 62} ${ey + 28}Z" stroke-width="5"/>`);
out.push(`<circle cx="${ex}" cy="${ey + 28}" r="25" stroke-width="5"/>`);
out.push(`<circle cx="${ex}" cy="${ey + 28}" r="9" fill="#fff" stroke="none"/>`);

// подпись на основании
out.push(`<path d="M${cx - baseHalf + 40} ${baseY + 38}H${cx + baseHalf - 40}" stroke-width="3"/>`);
out.push(`<path d="M${cx - 150} ${baseY + 62}H${cx + 150}" stroke-width="2"/>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="#fff" stroke-linecap="round">\n${out.join('\n')}\n</svg>\n`;
writeFileSync(new URL('../src/menu-emblem.svg', import.meta.url), svg);
console.log('src/menu-emblem.svg', svg.length, 'байт');
