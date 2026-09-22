/**
 * Сравнительные тесты «наш кадр vs референс bersus.io».
 * Обе картинки приводятся к 288×180 (аспект 16:10), считаются метрики:
 *   black/dark/mid/hi — доли пикселей по яркости (тональный баланс)
 *   mean, p99         — средняя яркость и яркость бликов
 *   grain             — амплитуда мелкого шума в освещённых зонах
 *   warmth            — средний (R−B) в освещённых зонах (тёплый/холодный оттенок бликов)
 *   coverage, bbox    — доля кадра под фигурой и её рамка (композиция)
 *   edges             — плотность контуров (детализация)
 * score — взвешенная сумма нормированных отклонений; меньше = ближе.
 *
 * Использование: window.__compare() → Promise<{ ref, ours, diff, score }>
 * HUD (лого, scroll hint) исключён: анализируется область x∈[8%,88%].
 */

const W = 288, H = 180;
const ROI = { x0: 0.08, x1: 0.88, y0: 0.0, y1: 1.0 };

/** Кадр { width, height, data(RGBA), flipY? } → canvas полного размера. */
function frameToCanvas(img) {
  const src = document.createElement('canvas');
  src.width = img.width; src.height = img.height;
  const sctx = src.getContext('2d');
  const id = sctx.createImageData(img.width, img.height);
  if (img.flipY) {
    const row = img.width * 4;
    for (let y = 0; y < img.height; y++) id.data.set(img.data.subarray((img.height - 1 - y) * row, (img.height - y) * row), y * row);
  } else id.data.set(img.data);
  sctx.putImageData(id, 0, 0);
  return src;
}

function toGray(img) {
  // img: { width, height, data(RGBA), flipY? } → Float32Array L (W×H) + RGB means
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(frameToCanvas(img), 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;
  const L = new Float32Array(W * H), R = new Float32Array(W * H), B = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255;
    L[i] = 0.299 * r + 0.587 * g + 0.114 * b; R[i] = r; B[i] = b;
  }
  return { L, R, B, canvas: c };
}

function metrics({ L, R, B }) {
  const x0 = Math.floor(ROI.x0 * W), x1 = Math.floor(ROI.x1 * W), y0 = Math.floor(ROI.y0 * H), y1 = Math.floor(ROI.y1 * H);
  let n = 0, black = 0, dark = 0, mid = 0, hi = 0, sum = 0, warmN = 0, warm = 0, cover = 0;
  let bx0 = W, bx1 = 0, by0 = H, by1 = 0;
  const vals = [];
  let grainSum = 0, grainN = 0, edgeSum = 0;
  const at = (x, y) => L[y * W + x];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = y * W + x, l = L[i];
    n++; sum += l; vals.push(l);
    if (l < 0.02) black++; else if (l < 0.1) dark++; else if (l < 0.35) mid++; else hi++;
    if (l > 0.1) { warm += R[i] - B[i]; warmN++; }
    if (l > 0.015) { cover++; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    if (x > x0 && x < x1 - 1 && y > 0 && y < H - 1) {
      if (l > 0.08) {
        const avg = (at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1) + at(x - 1, y - 1) + at(x + 1, y + 1) + at(x - 1, y + 1) + at(x + 1, y - 1) + l) / 9;
        grainSum += Math.abs(l - avg); grainN++;
      }
      const gx = at(x + 1, y) - at(x - 1, y), gy = at(x, y + 1) - at(x, y - 1);
      edgeSum += Math.hypot(gx, gy);
    }
  }
  vals.sort((a, b) => a - b);
  return {
    black: black / n, dark: dark / n, mid: mid / n, hi: hi / n,
    mean: sum / n, p99: vals[Math.floor(vals.length * 0.99)],
    grain: grainN ? grainSum / grainN : 0,
    warmth: warmN ? warm / warmN : 0,
    coverage: cover / n,
    bbox: { x0: (bx0 - x0) / (x1 - x0), x1: (bx1 - x0) / (x1 - x0), y0: by0 / H, y1: by1 / H },
    edges: edgeSum / n,
  };
}

const WEIGHTS = { black: 3, dark: 3, mid: 4, hi: 4, mean: 6, p99: 3, grain: 3, warmth: 3, coverage: 3, edges: 2, bboxTop: 3, bboxLeft: 1, bboxRight: 1 };
const SCALE = { black: 0.1, dark: 0.1, mid: 0.05, hi: 0.03, mean: 0.02, p99: 0.15, grain: 0.01, warmth: 0.02, coverage: 0.1, edges: 0.01, bboxTop: 0.1, bboxLeft: 0.1, bboxRight: 0.1 };

function diff(ref, ours) {
  const d = {};
  let score = 0;
  for (const k of ['black', 'dark', 'mid', 'hi', 'mean', 'p99', 'grain', 'warmth', 'coverage', 'edges']) {
    d[k] = ours[k] - ref[k];
    score += WEIGHTS[k] * Math.abs(d[k]) / SCALE[k];
  }
  d.bboxTop = ours.bbox.y0 - ref.bbox.y0; d.bboxLeft = ours.bbox.x0 - ref.bbox.x0; d.bboxRight = ours.bbox.x1 - ref.bbox.x1;
  for (const k of ['bboxTop', 'bboxLeft', 'bboxRight']) score += WEIGHTS[k] * Math.abs(d[k]) / SCALE[k];
  return { d, score: Math.round(score * 10) / 10 };
}

async function loadRef(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return { width: c.width, height: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data };
}

let refCache = null;
const fmt = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(4) : v]));

async function compareWith(app, refGray) {
  const ours = toGray(await app.capture());
  const mr = metrics(refGray), mo = metrics(ours);
  const { d, score } = diff(mr, mo);
  return { ref: fmt(mr), ours: fmt(mo), diff: fmt(d), score };
}

export function installCompare(app, refUrl = `${import.meta.env.BASE_URL}ref/bersus-1440.png`) {
  /** Сравнение с референсом (тюнинг тёмной сцены). */
  window.__compare = async () => {
    refCache ||= toGray(await loadRef(refUrl));
    return compareWith(app, refCache);
  };
  /** Сравнение с любым изображением (URL или data URL): золотые кадры E2E. */
  window.__compareTo = async (url) => compareWith(app, toGray(await loadRef(url)));
  /** Текущий кадр сцены полного размера как PNG data URL (золотые кадры E2E). */
  window.__capturePng = async () => frameToCanvas(await app.capture()).toDataURL('image/png');
  /** Кадр сцены как webp data URL, ужатый до ширины width (фолбэк-кадр без WebGL). */
  window.__captureWebp = async (width, quality = 0.9) => {
    const src = frameToCanvas(await app.capture());
    const c = document.createElement('canvas');
    const k = width ? width / src.width : 1;
    c.width = Math.round(src.width * k);
    c.height = Math.round(src.height * k);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/webp', quality);
  };
}
