/**
 * Элементы вокруг статуи на второй сцене (выбор владельца 2026-10-16 из прототипов: чёрные предметы на полу,
 * голограммы на проекторах, орбита, HUD — взяты орбита + HUD):
 *   orbitSet — светящиеся каркасные символы облетают статую: нейросфера (AI), стопка серверов (highload), цепочка (блокчейн)
 *   hudSet   — голографические экраны-дашборды ниже имени, по бокам пьедестала: граф нейросети, нагрузка, рост цепочки
 * Каждый набор отдаёт items в формате neonSet (группа, kind, позиция, масштаб, раскладка телефона) и update(t, glow).
 */
import * as THREE from 'three';

/** Яркий неон для каркасов и узлов. */
function glowMat(accent, k = 1.6) {
  const m = new THREE.MeshBasicMaterial({ color: accent.clone().multiplyScalar(k), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  m.userData.k = k;
  return m;
}

/** Рёбра геометрии толстыми трубками (линии WebGL — всегда 1 px): InstancedMesh цилиндров. */
function tubeEdges(geo, radius, mat, threshold = 1) {
  const e = new THREE.EdgesGeometry(geo, threshold).attributes.position;
  const n = e.count / 2;
  const mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(radius, radius, 1, 6, 1, true), mat, n);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion(), s = new THREE.Vector3(), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    a.fromBufferAttribute(e, i * 2); b.fromBufferAttribute(e, i * 2 + 1);
    mid.addVectors(a, b).multiplyScalar(0.5);
    const d = b.clone().sub(a); const len = d.length();
    q.setFromUnitVectors(up, d.normalize());
    m4.compose(mid, q, s.set(1, len, 1));
    mesh.setMatrixAt(i, m4);
  }
  return mesh;
}

/** Узлы в вершинах геометрии (уникальные точки). */
function nodes(geo, radius, mat) {
  const p = geo.attributes.position, seen = new Map();
  for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(k)) seen.set(k, [p.getX(i), p.getY(i), p.getZ(i)]); }
  const pts = [...seen.values()];
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(radius, 10, 8), mat, pts.length);
  const m4 = new THREE.Matrix4();
  pts.forEach((v, i) => mesh.setMatrixAt(i, m4.makeTranslation(...v)));
  return mesh;
}

// ---------------------------------------------------------------- orbit
/** Каркасные символы облетают статую на разной высоте. Верхняя группа стоит в центре (параллакс и раскладка
 * двигают её), сам облёт — у дочерней. */
export function orbitSet({ accent }) {
  const glow = [];
  const edgeMat = glowMat(accent, 1.1), nodeMat = glowMat(accent.clone().lerp(new THREE.Color(1, 1, 1), 0.3), 1.3), dimMat = glowMat(accent, 0.5);
  glow.push(edgeMat, nodeMat, dimMat);
  // AI: нейросфера — икосаэдр-сетка с узлами и пульсирующим ядром
  const ai = new THREE.Group();
  const ico = new THREE.IcosahedronGeometry(0.24, 1);
  ai.add(tubeEdges(ico, 0.0045, edgeMat), nodes(ico, 0.013, nodeMat));
  ai.scale.setScalar(1.35);
  const coreMat = glowMat(accent, 0.6);
  glow.push(coreMat);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 16), coreMat);
  ai.add(core);
  // Highload: стопка из четырёх «лезвий» серверов с полосами нагрузки
  const hl = new THREE.Group();
  const bars = [];
  for (let i = 0; i < 4; i++) {
    const box = new THREE.BoxGeometry(0.42, 0.05, 0.26);
    const e = tubeEdges(box, 0.004, edgeMat);
    e.position.y = i * 0.085;
    hl.add(e);
    const barMat = glowMat(accent, 1.4);
    glow.push(barMat);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.004), barMat);
    bar.position.set(0, i * 0.085, 0.132);
    hl.add(bar); bars.push(bar);
  }
  hl.position.y = -0.2;
  hl.scale.setScalar(1.3);
  // Блокчейн: три каркасных куба, связанные звеньями
  const bc = new THREE.Group();
  const cube = new THREE.BoxGeometry(0.13, 0.13, 0.13);
  const cubes = [];
  bc.scale.setScalar(1.5);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group();
    c.add(tubeEdges(cube, 0.004, edgeMat), nodes(cube, 0.01, nodeMat));
    c.position.x = (i - 1) * 0.22;
    bc.add(c); cubes.push(c);
    if (i) {
      const link = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09, 6), dimMat);
      link.rotation.z = Math.PI / 2; link.position.x = (i - 1.5) * 0.22;
      bc.add(link);
    }
  }
  const orbits = [
    // выше HUD-экранов (они ниже имени по бокам пьедестала): символы не пересекают экраны
    { g: ai, kind: 'chip', a0: 0.6, r: 1.3, y: 1.6, speed: 0.14, spin: 0.5 },
    { g: hl, kind: 'rack', a0: 2.7, r: 1.35, y: 1.15, speed: 0.14, spin: -0.3 },
    { g: bc, kind: 'chain', a0: 4.8, r: 1.25, y: 0.85, speed: 0.14, spin: 0.4 },
  ];
  const items = orbits.map((o) => {
    const top = new THREE.Group();
    const arm = new THREE.Group();
    arm.add(o.g);
    top.add(arm);
    o.arm = arm;
    return { it: { group: top, height: 0.4 }, kind: o.kind, name: 'prop-orbit', pos: [0, 0, 0], rotY: 0, k: 1, mx: 1 };
  });
  return {
    items, links: false,
    update(t, k) {
      for (const o of orbits) {
        const a = o.a0 + t * o.speed;
        o.g.position.set(Math.cos(a) * o.r, o.y + Math.sin(t * 0.9 + o.a0) * 0.04, Math.sin(a) * o.r);
        o.g.rotation.y = t * o.spin;
      }
      ai.rotation.x = t * 0.2;
      core.scale.setScalar(0.85 + 0.25 * Math.sin(t * 2.4));
      bars.forEach((b, i) => { b.scale.x = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * (1.3 + i * 0.7) + i)); b.position.x = -0.17 * (1 - b.scale.x); });
      const head = (t * 0.8) % 4;
      cubes.forEach((c, i) => c.scale.setScalar(1 + 0.25 * Math.exp(-((head - i) ** 2) * 4)));
      for (const m of glow) m.color.copy(accent).multiplyScalar(m.userData.k * k);
    },
  };
}

// ---------------------------------------------------------------- hud
/** Голографические экраны-дашборды по бокам статуи; содержимое — живые canvas-текстуры (~8 кадров/с). */
export function hudSet({ accent }) {
  const css = `rgb(${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)})`;
  const panels = [];
  const panel = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = Math.round(w * 760); c.height = Math.round(h * 760); // ~760 px на единицу: мелкий текст читается
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, opacity: 0 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const p = { m, c, ctx: c.getContext('2d'), tex, mat, draw };
    panels.push(p);
    return m;
  };
  const frame = (ctx, W, H, title) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(34,230,255,0.06)'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = css; ctx.lineWidth = 3; ctx.globalAlpha = 0.9;
    const k = 22; // уголки рамки
    for (const [x, y, dx, dy] of [[4, 4, 1, 1], [W - 4, 4, -1, 1], [4, H - 4, 1, -1], [W - 4, H - 4, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y + dy * k); ctx.lineTo(x, y); ctx.lineTo(x + dx * k, y); ctx.stroke();
    }
    ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.globalAlpha = 1; ctx.fillStyle = css; ctx.font = '700 22px Menlo, monospace'; ctx.fillText(title, 22, 38);
  };
  const AMBER = '#ffb547', RED = '#ff5c7a', TEXT = '#e8fdff';
  // AI: слева граф нейросети с бегущими импульсами, справа — сравнительный тест подходов (eval)
  const layers = [4, 6, 6, 3];
  // Подписи вымышленные, без бенчмарков и названий моделей: это иллюстрация, а не заявление о результатах
  const EVALS = [
    { name: 'BASELINE', v: 0.62 },
    { name: 'RAG', v: 0.78 },
    { name: 'FINE-TUNE', v: 0.84 },
    { name: 'AGENT+SGR', v: 0.91 },
  ];
  const ai = panel(1.25, 0.62, (ctx, W, H, t) => {
    frame(ctx, W, H, 'AI · MODEL LAB');
    const gx0 = 50, gx1 = W * 0.46;
    const pos = layers.map((n, l) => Array.from({ length: n }, (_, i) => [gx0 + l * ((gx1 - gx0) / (layers.length - 1)), 84 + (i + 0.5) * ((H - 110) / n)]));
    ctx.lineWidth = 1.2;
    for (let l = 0; l < layers.length - 1; l++) for (const a of pos[l]) for (const b of pos[l + 1]) {
      ctx.strokeStyle = css; ctx.globalAlpha = 0.16; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    }
    for (let l = 0; l < layers.length - 1; l++) pos[l].forEach((a, i) => {
      const b = pos[l + 1][(i * 3 + Math.floor(t * 2)) % pos[l + 1].length];
      const f = (t * 0.9 + l * 0.33 + i * 0.13) % 1;
      ctx.globalAlpha = 0.95; ctx.fillStyle = TEXT;
      ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 3, 0, 7); ctx.fill();
    });
    for (const L of pos) for (const [x, y] of L) { ctx.globalAlpha = 1; ctx.fillStyle = css; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); }
    // разделитель
    const ex = W * 0.52;
    ctx.globalAlpha = 0.3; ctx.strokeStyle = css; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ex - 18, 60); ctx.lineTo(ex - 18, H - 24); ctx.stroke();
    // eval: прогон раз в 7 с — полосы растут заново, победитель отмечается в конце
    const run = (t % 7) / 7, grow = Math.min(1, run / 0.55);
    ctx.globalAlpha = 0.75; ctx.fillStyle = css; ctx.font = '600 15px Menlo, monospace';
    ctx.fillText('EVAL · ACCURACY · n=1200', ex, 72);
    const rowH = (H - 140) / EVALS.length, barX = ex + 128, barW = W - barX - 92;
    EVALS.forEach((e, i) => {
      const y = 92 + i * rowH, best = i === EVALS.length - 1;
      const v = e.v * (0.15 + 0.85 * (1 - (1 - grow) ** 3)) + (grow >= 1 ? Math.sin(t * 3 + i) * 0.004 : 0);
      ctx.globalAlpha = best ? 1 : 0.7; ctx.fillStyle = TEXT; ctx.font = `${best ? 700 : 500} 15px Menlo, monospace`;
      ctx.fillText(e.name, ex, y + rowH * 0.5);
      ctx.globalAlpha = 0.18; ctx.fillStyle = css; ctx.fillRect(barX, y + rowH * 0.22, barW, rowH * 0.42);
      ctx.globalAlpha = best ? 1 : 0.6; ctx.fillRect(barX, y + rowH * 0.22, barW * v, rowH * 0.42);
      ctx.globalAlpha = best ? 1 : 0.75; ctx.fillStyle = TEXT; ctx.font = '700 15px Menlo, monospace';
      ctx.fillText(`${Math.round(v * 100)}%${best && run > 0.6 ? ' ★' : ''}`, barX + barW + 10, y + rowH * 0.5);
    });
    if (run > 0.6) {
      ctx.globalAlpha = Math.min(1, (run - 0.6) * 5); ctx.fillStyle = css; ctx.font = '700 15px Menlo, monospace';
      ctx.fillText(`Δ +${Math.round((EVALS[3].v - EVALS[0].v) * 100)} pp vs baseline`, ex, H - 26);
    }
  });
  // Highload: мини-Grafana — плитки RPS / p95 / ошибки с порогами и график двух метрик с линией порога
  const N = 72;
  const rps = Array.from({ length: N }, (_, i) => 0.55 + 0.18 * Math.sin(i * 0.21) + 0.05 * Math.sin(i * 0.9));
  const lat = Array.from({ length: N }, (_, i) => 0.35 + 0.12 * Math.sin(i * 0.17 + 1));
  let lastPush = 0;
  const hl = panel(1.15, 0.74, (ctx, W, H, t) => {
    if (t - lastPush > 0.25) {
      lastPush = t;
      const surge = Math.max(0, Math.sin(t * 0.22)) ** 6; // раз в ~30 с — пик нагрузки, задержка подскакивает
      rps.shift(); rps.push(0.55 + 0.16 * Math.sin(t * 0.7) + 0.25 * surge + Math.random() * 0.05);
      lat.shift(); lat.push(0.32 + 0.08 * Math.sin(t * 0.5) + 0.42 * surge + Math.random() * 0.04);
    }
    frame(ctx, W, H, 'HIGHLOAD · PROD');
    ctx.globalAlpha = 0.6; ctx.fillStyle = TEXT; ctx.font = '500 14px Menlo, monospace';
    ctx.fillText('⟳ 5s   Last 15 minutes', W - 230, 38);
    // плитки статистики, цвет — по порогам, как в Grafana
    const cur = { rps: rps[N - 1], lat: lat[N - 1] };
    const p95 = Math.round(90 + cur.lat * 260), err = (0.05 + Math.max(0, cur.lat - 0.55) * 1.6).toFixed(2);
    const tiles = [
      { label: 'RPS', value: `${(28 + cur.rps * 30).toFixed(1)}k`, color: css, series: rps },
      { label: 'p95 LATENCY', value: `${p95} ms`, color: p95 > 250 ? RED : p95 > 190 ? AMBER : css, series: lat },
      { label: 'ERRORS', value: `${err}%`, color: +err > 0.3 ? RED : +err > 0.15 ? AMBER : css, series: lat },
    ];
    const tw = (W - 44 - 2 * 12) / 3, ty = 56, th = 104;
    tiles.forEach((tl, i) => {
      const x = 22 + i * (tw + 12);
      ctx.globalAlpha = 0.3; ctx.strokeStyle = css; ctx.lineWidth = 1; ctx.strokeRect(x, ty, tw, th);
      ctx.globalAlpha = 0.7; ctx.fillStyle = TEXT; ctx.font = '600 13px Menlo, monospace'; ctx.fillText(tl.label, x + 12, ty + 22);
      ctx.globalAlpha = 1; ctx.fillStyle = tl.color; ctx.font = '700 34px Menlo, monospace'; ctx.fillText(tl.value, x + 12, ty + 64);
      ctx.globalAlpha = 0.5; ctx.strokeStyle = tl.color; ctx.lineWidth = 2; ctx.beginPath();
      tl.series.slice(-30).forEach((v, k) => { const sx = x + 10 + k * ((tw - 20) / 29), sy = ty + th - 10 - v * 26; k ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
      ctx.stroke();
    });
    // график: сетка, RPS с заливкой, задержка, пунктир порога SLO, легенда
    const gx = 70, gy = ty + th + 30, gw = W - gx - 26, gh = H - gy - 52;
    ctx.globalAlpha = 0.7; ctx.fillStyle = TEXT; ctx.font = '600 13px Menlo, monospace'; ctx.fillText('Requests / Latency', 22, gy - 10);
    ctx.font = '500 12px Menlo, monospace';
    for (let g = 0; g <= 4; g++) {
      const y = gy + gh * (g / 4);
      ctx.globalAlpha = 0.14; ctx.strokeStyle = css; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.fillStyle = TEXT; ctx.fillText(`${60 - g * 15}k`, 22, y + 4);
    }
    for (let g = 0; g <= 5; g++) { ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.moveTo(gx + gw * g / 5, gy); ctx.lineTo(gx + gw * g / 5, gy + gh); ctx.stroke(); }
    const X = (i) => gx + i * (gw / (N - 1)), Y = (v) => gy + gh - Math.min(1, v) * gh;
    ctx.globalAlpha = 0.16; ctx.fillStyle = css; ctx.beginPath(); ctx.moveTo(X(0), gy + gh);
    rps.forEach((v, i) => ctx.lineTo(X(i), Y(v))); ctx.lineTo(X(N - 1), gy + gh); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = css; ctx.lineWidth = 2.5; ctx.beginPath(); rps.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
    ctx.strokeStyle = AMBER; ctx.lineWidth = 2; ctx.beginPath(); lat.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
    ctx.globalAlpha = 0.8; ctx.strokeStyle = RED; ctx.setLineDash([8, 6]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(gx, Y(0.62)); ctx.lineTo(gx + gw, Y(0.62)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = RED; ctx.font = '600 12px Menlo, monospace'; ctx.fillText('SLO p95 250ms', gx + gw - 118, Y(0.62) - 6);
    const ly = H - 22;
    [[css, 'rps'], [AMBER, 'p95 latency'], [RED, 'SLO']].forEach(([c, label], i) => {
      const lx = gx + i * 150;
      ctx.globalAlpha = 1; ctx.fillStyle = c; ctx.fillRect(lx, ly - 9, 18, 4);
      ctx.globalAlpha = 0.75; ctx.fillStyle = TEXT; ctx.font = '500 13px Menlo, monospace'; ctx.fillText(label, lx + 26, ly - 3);
    });
  });
  // Блокчейн: цепочка растёт — новые блоки с хешами въезжают справа
  const bc = panel(0.8, 0.42, (ctx, W, H, t) => {
    frame(ctx, W, H, 'CHAIN · BLOCKS');
    const n = Math.floor(t / 1.6), f = (t / 1.6) % 1;
    for (let k = 0; k < 5; k++) {
      const x = 30 + (k - f) * 130, id = n + k;
      if (x < 10 || x > W - 120) continue;
      ctx.globalAlpha = k === 4 ? f : 1; ctx.strokeStyle = css; ctx.lineWidth = 3; ctx.strokeRect(x, 70, 100, 90);
      ctx.fillStyle = '#e8fdff'; ctx.font = '700 22px Menlo, monospace'; ctx.fillText(`#${1840 + id}`, x + 12, 108);
      ctx.globalAlpha *= 0.6; ctx.font = '500 15px Menlo, monospace'; ctx.fillText(`0x${((id * 2654435761) >>> 0).toString(16).slice(0, 6)}`, x + 12, 140);
      if (k) { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(x - 30, 115); ctx.lineTo(x, 115); ctx.stroke(); }
    }
  });
  const items = [
    // ниже имени, по бокам от пьедестала: экраны не перекрывают буквы и не подсвечивают их
    // mobile: узкий кадр — экраны мельче, у краёв, на уровне пьедестала (общая формула раскладки поставила бы их на него)
    { it: { group: wrap(ai, 0.0), height: 0.62 }, kind: 'chip', name: 'prop-near', pos: [-1.85, 0.3, 0.9], rotY: 0.42, k: 1.25, mx: 0.9, mobile: { pos: [-0.82, -0.1, 0.9], k: 0.6 } },
    { it: { group: wrap(hl, 0.0), height: 0.74 }, kind: 'rack', name: 'prop-far', pos: [1.85, 0.38, 0.7], rotY: -0.42, k: 1.25, mx: 0.9, mobile: { pos: [0.84, -0.02, 0.7], k: 0.6 } },
    { it: { group: wrap(bc, 0.0), height: 0.42 }, kind: 'chain', name: 'prop-near', pos: [-1.2, -0.35, 1.7], rotY: 0.3, k: 1.05, mx: 0.9, mobile: { hidden: true } }, // на телефоне его место — за кнопкой Ask
  ];
  function wrap(mesh) { const g = new THREE.Group(); g.add(mesh); return g; }
  let lastDraw = -1;
  return {
    items, links: false, floating: true,
    update(t, k) {
      panels.forEach((p, i) => { p.mat.opacity = k; p.m.position.y = Math.sin(t * 0.8 + i * 2) * 0.025; });
      if (k > 0 && t - lastDraw > 0.12) {
        lastDraw = t;
        for (const p of panels) { p.draw(p.ctx, p.c.width, p.c.height, t); p.tex.needsUpdate = true; }
      }
    },
  };
}
