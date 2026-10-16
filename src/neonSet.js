/**
 * Вторая сцена (full): тёмная неоновая площадка вокруг статуи — сетка пола, неоновые кольца пьедестала
 * и три предмета про ИТ-управление вместо шахмат bersus: серверная стойка (highload), чип (AI),
 * цепочка блоков (блокчейн). Всё процедурное: моделей нет, вес — только код.
 *
 * Композиция повторяет шахматы bersus: стойка за пьедесталом справа (их конь), чип у левого края
 * и цепочка у правого (их лежащие пешки). Камера второй сцены стоит на +Z, предметы смотрят на неё.
 */
import * as THREE from 'three';
import { orbitSet, hudSet } from './propSets.js';

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
  // проектор: излучатель на верхней площадке и луч, уходящий вверх сквозь голограмму
  const fade = canvasTex(4, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,.3)'); gr.addColorStop(0.6, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  });
  const beamMat = new THREE.MeshBasicMaterial({ map: fade, color: ACCENT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 1.7, 96, 1, true), beamMat);
  beam.position.y = 0.85;
  const emitterMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const emitter = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 96), emitterMat);
  emitter.rotation.x = -Math.PI / 2; emitter.position.y = 0.004;
  g.add(top, base, holo, beam, emitter);
  return { group: g, holo, holoMat, beamMat, emitterMat, neon: [top.material, base.material] };
}

/** Пылинки в воздухе: глубина кадра и ощущение «живого» пространства. */
function dust(n) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  let s = 99; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * 9; pos[i * 3 + 1] = rnd() * 2.2 - 0.6; pos[i * 3 + 2] = (rnd() - 0.5) * 7 - 0.5; seed[i] = rnd(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uGlow: { value: 0 }, uColor: { value: ACCENT.clone().lerp(new THREE.Color(1, 1, 1), 0.5) }, uPx: { value: 1 } },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uPx; attribute float aSeed; varying float vA;
      void main() {
        vec3 p = position;
        // медленный дрейф вверх по кругу; выше 1.6 (уровень головы) не поднимаются — небо над сценой чистое
        p.y = mod(position.y + 0.6 + uTime * (0.03 + aSeed * 0.05), 2.2) - 0.6;
        p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.08;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (1.2 + aSeed * 2.2) * uPx * (6.0 / -mv.z);
        vA = 0.25 + 0.75 * fract(aSeed * 13.7 + uTime * 0.1);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uGlow; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA * uGlow * 0.55;
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return { points: pts, mat };
}

/**
 * Собирает площадку. pedH — высота пьедестала (пол на y = −pedH).
 * Вокруг статуи — символы на орбите и HUD-экраны (src/propSets.js, выбор владельца 2026-10-16).
 * Возвращает группу, предметы (для раскладки и параллакса: userData.base) и update(t, glow):
 * glow 0…1 — разгорание неона вместе с ключевым светом.
 */
export function createNeonSet(pedH) {
  const group = new THREE.Group();
  const floor = gridFloor(-pedH);
  const haze = horizonHaze(-pedH);
  const rings = pedestalRings(pedH);
  group.add(haze, floor, rings.group);
  const sets = [orbitSet({ accent: ACCENT }), hudSet({ accent: ACCENT })];
  const props = sets.flatMap((set) => set.items).map(({ it, kind, name, pos, rotY, k, mx, mobile }) => {
    const m = it.group;
    m.name = name;
    m.userData.kind = kind;
    m.position.set(...pos); m.rotation.y = rotY; m.scale.setScalar(k);
    m.userData.base = { pos: [...pos], size: it.height * k, k, mx, mobile };
    group.add(m);
    return m;
  });
  const motes = dust(260);
  group.add(motes.points);
  const neon = [...rings.neon];
  let glow = 0;
  function update(t, k) {
    glow = k;
    floor.material.uniforms.uGlow.value = k;
    for (const m of neon) m.color.copy(ACCENT).multiplyScalar(m.userData.k * k);
    rings.holoMat.opacity = 0.55 * k;
    rings.beamMat.opacity = 0.11 * k * (0.9 + 0.1 * Math.sin(t * 3.1));
    rings.emitterMat.opacity = 0.7 * k;
    haze.material.opacity = 0.07 * k;
    rings.holo.rotation.y = t * 0.12;
    rings.holoMat.map.offset.x = -t * 0.01;
    motes.mat.uniforms.uTime.value = t; motes.mat.uniforms.uGlow.value = k;
    for (const set of sets) set.update(t, k);
  }
  update(0, 0);
  return { group, props, update, setPixelRatio(px) { motes.mat.uniforms.uPx.value = px; }, get glow() { return glow; } };
}
