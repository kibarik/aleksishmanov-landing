/**
 * Вторая сцена (full): тёмная неоновая площадка вокруг статуи — сетка пола, неоновые кольца пьедестала
 * и три предмета про ИТ-управление вместо шахмат bersus: серверная стойка (highload), чип (AI),
 * цепочка блоков (блокчейн). Всё процедурное: моделей нет, вес — только код.
 *
 * Композиция повторяет шахматы bersus: стойка за пьедесталом справа (их конь), чип у левого края
 * и цепочка у правого (их лежащие пешки). Камера второй сцены стоит на +Z, предметы смотрят на неё.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const ACCENT = new THREE.Color(0x22e6ff);
const LED_GREEN = new THREE.Color(0.55, 1, 0.75);

/** Неоновый материал: без тонмаппинга, чтобы циан не сероватился; яркость задаёт setGlow. */
function neonMat(k = 1) {
  const m = new THREE.MeshBasicMaterial({ color: ACCENT.clone().multiplyScalar(k), toneMapped: false });
  m.userData.k = k;
  return m;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Пол: сетка, гаснущая к краям, и световое пятно под пьедесталом. */
function gridFloor(y) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uColor: { value: ACCENT.clone() }, uGlow: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec2 vXZ;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vXZ = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uGlow;
      varying vec2 vXZ;
      float grid(vec2 p, float cell, float width) {
        vec2 g = abs(fract(p / cell - 0.5) - 0.5) / fwidth(p / cell);
        return 1.0 - min(min(g.x, g.y) / width, 1.0);
      }
      void main() {
        float r = length(vXZ);
        float lines = grid(vXZ, 0.5, 1.0) * 0.35 + grid(vXZ, 2.0, 1.3) * 0.65;
        float fade = exp(-r * 0.32);
        float pool = exp(-r * r * 1.6) * 0.55; // свет от пьедестала
        // к горизонту пол светлеет и сходится с дымкой (стена на z = −14) — без резкого шва; у края плоскости гаснет
        float haze = smoothstep(4.0, 14.0, r) * (1.0 - smoothstep(15.0, 19.5, r)) * 0.09;
        float a = (lines * fade * 0.75 + pool + haze) * uGlow;
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y + 0.002;
  m.renderOrder = -1; // под тенью пола: тень статуи ложится и на свет
  return m;
}

/** Дымка у горизонта: циановое свечение за сценой, гаснет кверху — небо не плоско-чёрное. */
function horizonHaze(y) {
  const tex = canvasTex(4, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,.3)'); gr.addColorStop(0.45, 'rgba(255,255,255,.06)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: ACCENT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(60, 6), mat);
  m.position.set(0, y + 3, -14);
  return m;
}

/** Кольца пьедестала: два тонких по кромкам и голографическое с делениями, медленно вращается. */
function pedestalRings(pedH) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.TorusGeometry(0.575, 0.006, 8, 160), neonMat(1.4));
  top.rotation.x = Math.PI / 2; top.position.y = -0.002;
  const base = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.008, 8, 160), neonMat(1.2));
  base.rotation.x = Math.PI / 2; base.position.y = -pedH + 0.01;
  const ticks = canvasTex(1024, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 96; i++) { const x = (i / 96) * w; ctx.globalAlpha = i % 8 === 0 ? 1 : 0.45; ctx.fillRect(x, i % 8 === 0 ? 8 : 22, i % 8 === 0 ? 5 : 3, i % 8 === 0 ? 48 : 20); }
    ctx.globalAlpha = 0.8; ctx.fillRect(0, h / 2 - 1, w * 0.62, 2); ctx.fillRect(w * 0.7, h / 2 - 1, w * 0.22, 2);
  });
  ticks.wrapS = THREE.RepeatWrapping;
  const holoMat = new THREE.MeshBasicMaterial({ map: ticks, color: ACCENT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const holo = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.07, 128, 1, true), holoMat);
  holo.position.y = -pedH * 0.42;
  g.add(top, base, holo);
  return { group: g, holo, holoMat, neon: [top.material, base.material] };
}

/** Серверная стойка: корпус из воронёного металла, юниты с вентиляцией и мигающими огоньками. */
function serverRack() {
  const g = new THREE.Group();
  const W = 0.5, H = 0.96, D = 0.46;
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x0c0e12, metalness: 0.75, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.2 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.018), metal);
  body.position.y = H / 2;
  g.add(body);
  // юниты: лицевые панели с решёткой вентиляции
  const vent = canvasTex(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#1a1d22'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#07080a';
    for (let x = 150; x < w - 20; x += 9) ctx.fillRect(x, 12, 4, h - 24);
    ctx.fillStyle = '#2b3038'; ctx.fillRect(14, 18, 70, h - 36); // ручка-шильдик
  });
  const unitMat = new THREE.MeshStandardMaterial({ map: vent, metalness: 0.6, roughness: 0.4 });
  const UNITS = 9, uH = 0.082, gap = 0.012, x0 = -W / 2 + 0.035;
  const ledGeo = new THREE.BoxGeometry(0.02, 0.014, 0.004);
  const leds = new THREE.InstancedMesh(ledGeo, new THREE.MeshBasicMaterial({ toneMapped: false }), UNITS * 3);
  const ledColor = new THREE.Color();
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < UNITS; i++) {
    const y = 0.07 + i * (uH + gap) + uH / 2;
    const u = new THREE.Mesh(new THREE.BoxGeometry(W - 0.05, uH, 0.012), unitMat);
    u.position.set(0, y, D / 2 + 0.002);
    g.add(u);
    for (let k = 0; k < 3; k++) {
      m4.makeTranslation(x0 + 0.014 + k * 0.03, y, D / 2 + 0.01);
      leds.setMatrixAt(i * 3 + k, m4);
      leds.setColorAt(i * 3 + k, ledColor.set(0x000000));
    }
  }
  g.add(leds);
  // неоновые рёбра лицевой рамки
  const edge = neonMat(1.1);
  for (const sx of [-1, 1]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.006, H - 0.04, 0.006), edge);
    s.position.set(sx * (W / 2 - 0.004), H / 2, D / 2 + 0.004);
    g.add(s);
  }
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(W - 0.03, 0.006, 0.006), edge);
  topBar.position.set(0, H - 0.024, D / 2 + 0.004);
  g.add(topBar);
  // огоньки: у каждого свой ритм (как реальные индикаторы активности дисков)
  const seeds = Array.from({ length: UNITS * 3 }, (_, i) => ({ f: 1.3 + ((i * 7919) % 97) / 30, ph: ((i * 104729) % 360) / 57.3, on: (i * 31) % 5 !== 0 }));
  function update(t, glow) {
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const blink = s.on ? (Math.sin(t * s.f + s.ph) > -0.2 ? 1 : 0.15) : 0.1;
      ledColor.copy(i % 3 === 2 ? ACCENT : LED_GREEN).multiplyScalar(blink * glow * 2.4);
      leds.setColorAt(i, ledColor);
    }
    leds.instanceColor.needsUpdate = true;
  }
  return { group: g, height: H, neon: [edge], update };
}

/** Чип ИИ: подложка с дорожками, металлическая крышка с маркировкой, выводы по периметру. */
function aiChip() {
  const g = new THREE.Group();
  const S = 0.56, T = 0.04;
  const traces = canvasTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      // дорожки от края к центру с изломом под 45°, на конце — контактная площадка
      const side = i % 4, p = 60 + rnd() * (w - 120);
      let x = side === 0 ? p : side === 1 ? w - 20 : side === 2 ? p : 20;
      let y = side === 0 ? 20 : side === 1 ? p : side === 2 ? h - 20 : p;
      ctx.beginPath(); ctx.moveTo(x, y);
      const len = 80 + rnd() * 160;
      const dx = side === 1 ? -1 : side === 3 ? 1 : 0, dy = side === 0 ? 1 : side === 2 ? -1 : 0;
      x += dx * len; y += dy * len; ctx.lineTo(x, y);
      const turn = rnd() > 0.5 ? 1 : -1;
      x += (dx === 0 ? turn : dx) * 60; y += (dy === 0 ? turn : dy) * 60; ctx.lineTo(x, y);
      ctx.globalAlpha = 0.35 + rnd() * 0.65; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    }
  });
  const sub = new THREE.MeshStandardMaterial({ color: 0x0b0f0e, roughness: 0.55, metalness: 0.2, emissive: ACCENT, emissiveMap: traces, emissiveIntensity: 0 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(S, T, S, 2, 0.008), sub);
  base.position.y = T / 2;
  g.add(base);
  const lid = canvasTex(512, 512, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#b9bec6'); gr.addColorStop(0.5, '#8e939b'); gr.addColorStop(1, '#a9aeb6');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.07; ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1); // шлифовка
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#2a2d33';
    ctx.font = '900 210px Montserrat, Arial Black, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('AI', w / 2, h / 2 - 20);
    ctx.font = '600 34px Manrope, Arial, sans-serif'; ctx.globalAlpha = 0.6;
    ctx.fillText('ISHMANOV · NPU-01', w / 2, h / 2 + 130);
  });
  const cap = new THREE.Mesh(new RoundedBoxGeometry(S * 0.58, 0.026, S * 0.58, 2, 0.006),
    [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshPhysicalMaterial(i === 2 ? { map: lid, metalness: 0.9, roughness: 0.32 } : { color: 0x9aa0a8, metalness: 0.95, roughness: 0.3 })));
  cap.position.y = T + 0.013;
  g.add(cap);
  // выводы: по 13 с каждой стороны
  const pinGeo = new THREE.BoxGeometry(0.018, 0.008, 0.05);
  const pins = new THREE.InstancedMesh(pinGeo, new THREE.MeshStandardMaterial({ color: 0xd4b06a, metalness: 1, roughness: 0.28 }), 52);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (let s = 0; s < 4; s++) for (let i = 0; i < 13; i++) {
    const a = (s * Math.PI) / 2, o = -S / 2 + 0.05 + i * ((S - 0.1) / 12);
    const p = new THREE.Vector3(o, T * 0.5, S / 2 + 0.02).applyAxisAngle(up, a);
    m4.compose(p, q.setFromAxisAngle(up, a), new THREE.Vector3(1, 1, 1));
    pins.setMatrixAt(s * 13 + i, m4);
  }
  g.add(pins);
  // стоит на ребре с наклоном к камере: плашмя с низкой камеры он читался бы полоской
  const tilt = new THREE.Group();
  g.position.set(0, 0, -S / 2);
  g.rotation.x = -1.18;
  tilt.add(g);
  return { group: tilt, height: S * Math.sin(1.18), neon: [], subMat: sub };
}

/** Блокчейн: три чёрных блока с неоновой гранью и хешем, сцепленные звеньями. */
function blockChain() {
  const g = new THREE.Group();
  const B = 0.2;
  const face = (n) => canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.strokeRect(34, 34, w - 68, h - 68);
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff'; ctx.font = '700 30px Menlo, monospace'; ctx.textAlign = 'center';
    ctx.fillText(`#${n}`, w / 2, h / 2 - 8);
    ctx.globalAlpha = 0.45; ctx.font = '500 20px Menlo, monospace';
    ctx.fillText(['0x9f3a…e1', '0x41c7…08', '0x7be2…5d'][n % 3], w / 2, h / 2 + 30);
  });
  const blocks = [];
  const linkMat = new THREE.MeshStandardMaterial({ color: 0x8b9099, metalness: 1, roughness: 0.25 });
  const linkGeo = new THREE.TorusGeometry(0.034, 0.008, 10, 28);
  const poses = [
    { p: [-0.36, B / 2, 0.02], ry: 0.25, rz: 0 },
    { p: [0, B / 2, 0.08], ry: -0.12, rz: 0 },
    { p: [0.33, B / 2 + 0.02, -0.04], ry: 0.4, rz: 0.22 },
  ];
  poses.forEach((ps, i) => {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x050607, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.12, emissive: ACCENT, emissiveMap: face(i + 1), emissiveIntensity: 0, envMapIntensity: 1.3 });
    const b = new THREE.Mesh(new RoundedBoxGeometry(B, B, B, 3, 0.014), mat);
    b.position.set(...ps.p); b.rotation.set(0, ps.ry, ps.rz);
    b.castShadow = true;
    g.add(b); blocks.push(mat);
  });
  // звенья между блоками: два сцепленных кольца на каждом стыке
  for (let i = 0; i < poses.length - 1; i++) {
    const a = new THREE.Vector3(...poses[i].p), b = new THREE.Vector3(...poses[i + 1].p);
    const mid = a.clone().lerp(b, 0.5);
    const dir = b.clone().sub(a).normalize();
    for (const k of [-1, 1]) {
      const l = new THREE.Mesh(linkGeo, linkMat);
      l.position.copy(mid).addScaledVector(dir, k * 0.026);
      l.lookAt(l.position.clone().add(new THREE.Vector3(-dir.z, 0, dir.x)));
      if (k > 0) l.rotateX(Math.PI / 2);
      l.castShadow = true;
      g.add(l);
    }
  }
  return { group: g, height: B + 0.04, neon: [], blocks };
}

/**
 * Собирает площадку. pedH — высота пьедестала (пол на y = −pedH).
 * Возвращает группу, предметы (для раскладки и параллакса — в формате шахмат: userData.base)
 * и update(t, glow): glow 0…1 — разгорание неона вместе с ключевым светом.
 */
export function createNeonSet(pedH) {
  const group = new THREE.Group();
  const floor = gridFloor(-pedH);
  const haze = horizonHaze(-pedH);
  const rings = pedestalRings(pedH);
  const rack = serverRack();
  const chip = aiChip();
  const chain = blockChain();
  group.add(haze, floor, rings.group);
  // z растёт к камере (она на +8.74): ближние у края кадра, стойка за пьедесталом
  const items = [
    { it: chip, name: 'prop-near', pos: [-1.85, -pedH, 0.1], rotY: 0.5, k: 1.45, mx: 1 },
    { it: chain, name: 'prop-near', pos: [1.95, -pedH, 0.3], rotY: -0.3, k: 1.6, mx: 1 },
    { it: rack, name: 'prop-far', pos: [1.05, -pedH, -2.0], rotY: -0.42, k: 1.1, mx: 1.9 }, // mx: на узком кадре не прячется за пьедесталом
  ];
  const props = items.map(({ it, name, pos, rotY, k, mx }) => {
    const m = it.group;
    m.name = name;
    m.position.set(...pos); m.rotation.y = rotY; m.scale.setScalar(k);
    m.userData.base = { pos: [...pos], size: it.height * k, k, mx };
    m.traverse((o) => { if (o.isMesh && !o.material.isMeshBasicMaterial) { o.castShadow = true; o.receiveShadow = true; } });
    group.add(m);
    return m;
  });
  const neon = [...rings.neon, ...rack.neon];
  let glow = 0;
  function update(t, k) {
    glow = k;
    floor.material.uniforms.uGlow.value = k;
    for (const m of neon) m.color.copy(ACCENT).multiplyScalar(m.userData.k * k);
    rings.holoMat.opacity = 0.55 * k;
    haze.material.opacity = 0.07 * k;
    rings.holo.rotation.y = t * 0.12;
    rings.holoMat.map.offset.x = -t * 0.01;
    chip.subMat.emissiveIntensity = 1.1 * k;
    for (const b of chain.blocks) b.emissiveIntensity = 1.2 * k * (0.85 + 0.15 * Math.sin(t * 1.7));
    rack.update(t, k);
  }
  update(0, 0);
  return { group, props, update, get glow() { return glow; } };
}
