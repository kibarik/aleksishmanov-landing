/**
 * Материал статуи на второй (неоновой) сцене. Прототип трёх стилей, выбор — ?statue=chrome|holo|veins|marble.
 * У всех — запечённый AO из атрибута _ao (scripts/bake-ao.mjs).
 */
import * as THREE from 'three';

/** Неоновая «комната» для отражений: тёмный фон, циановые полосы по кругу, тусклая белая панель сверху. */
export function neonEnvironment(renderer, accent) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x020305);
  const strip = (w, h, pos, color, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 1, 0);
    room.add(m);
  };
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    strip(0.35, 6, [Math.cos(a) * 6, 1.5, Math.sin(a) * 6], accent, 4);
  }
  strip(14, 0.3, [0, -0.5, -6], accent, 3);            // горизонт
  strip(4, 2, [-3, 6, 3], new THREE.Color(0xdfe8f0), 1.6); // тусклый верхний свет
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(room, 0.03).texture;
  pmrem.dispose();
  return tex;
}

const AO_VERT = ['#include <common>', '#include <common>\nattribute float _ao;\nvarying float vAo;'];
const AO_VERT2 = ['#include <begin_vertex>', '#include <begin_vertex>\nvAo = _ao;'];

/** AO в стандартный PBR-шейдер: затемняет рассеянный и отражённый свет в складках. */
function withBakedAo(mat, extraFragment = '') {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = mat.userData.uTime;
    shader.vertexShader = shader.vertexShader.replace(...AO_VERT).replace(...AO_VERT2);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAo;\nuniform float uTime;')
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
  float bakedAo = mix(1.0, vAo * vAo, 0.9);
  reflectedLight.indirectDiffuse *= bakedAo;
  reflectedLight.directDiffuse *= mix(1.0, bakedAo, 0.6);
  reflectedLight.indirectSpecular *= bakedAo;${extraFragment}`);
  };
  mat.userData.uTime ??= { value: 0 };
  return mat;
}

/** Прожилки: белые трещины-нити на чёрном (как жилы мрамора), для emissiveMap. */
function veinTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
  let seed = 1234;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646; };
  ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    let x = rnd() * size, y = rnd() * size, a = rnd() * Math.PI * 2;
    ctx.lineWidth = 0.8 + rnd() * 1.6; ctx.globalAlpha = 0.5 + rnd() * 0.5;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 60; k++) { a += (rnd() - 0.5) * 0.7; x += Math.cos(a) * 9; y += Math.sin(a) * 9; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * @param kind 'marble' | 'chrome' | 'holo' | 'veins'
 * Возвращает { material, update(t, glow) }.
 */
export function createStatueMaterial(kind, { marbleAlbedo, marbleNormal, envMap, accent }) {
  if (kind === 'chrome') {
    const m = withBakedAo(new THREE.MeshPhysicalMaterial({
      color: 0x15181c, metalness: 1, roughness: 0.24, envMap, envMapIntensity: 1.6,
      normalMap: marbleNormal, normalScale: new THREE.Vector2(0.12, 0.12), clearcoat: 0.6, clearcoatRoughness: 0.18,
    }));
    return { material: m, update() {} };
  }
  if (kind === 'veins') {
    const veins = veinTexture(1024);
    veins.repeat.set(3, 3);
    const m = withBakedAo(new THREE.MeshPhysicalMaterial({
      color: 0x3a3e44, map: marbleAlbedo, roughness: 0.42, metalness: 0.1, envMap, envMapIntensity: 0.9,
      normalMap: marbleNormal, normalScale: new THREE.Vector2(0.18, 0.18),
      emissive: accent, emissiveMap: veins, emissiveIntensity: 0,
    }), `
  // неоновая кромка по силуэту: свет «изнутри» на скользящих углах
  float fres = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.0);
  totalEmissiveRadiance += vec3(${accent.r.toFixed(3)}, ${accent.g.toFixed(3)}, ${accent.b.toFixed(3)}) * fres * 0.5;`);
    return { material: m, update(t, glow) { m.emissiveIntensity = glow * (1.6 + 0.4 * Math.sin(t * 1.3)); } };
  }
  if (kind === 'holo') {
    const uTime = { value: 0 }, uGlow = { value: 0 };
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: true, side: THREE.FrontSide, toneMapped: false,
      uniforms: { uTime, uGlow, uColor: { value: accent.clone() } },
      vertexShader: /* glsl */`
        uniform float uTime;
        attribute float _ao;
        varying vec3 vN; varying vec3 vV; varying float vY; varying float vAo;
        float hash(float n) { return fract(sin(n) * 43758.5453); }
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          // редкий сбой развёртки: горизонтальный срез на миг уезжает вбок
          float slice = floor(w.y * 14.0), tick = floor(uTime * 9.0);
          float g = step(0.985, hash(slice * 7.13 + tick));
          w.x += g * (hash(slice + tick) - 0.5) * 0.06;
          vY = w.y; vAo = _ao;
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - w.xyz);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform float uGlow; uniform vec3 uColor;
        varying vec3 vN; varying vec3 vV; varying float vY; varying float vAo;
        void main() {
          float ndv = abs(dot(normalize(vN), normalize(vV)));
          float fres = pow(clamp(1.0 - ndv, 0.0, 1.0), 2.0); // pow от отрицательного — NaN
          float scan = 0.72 + 0.28 * step(0.5, fract(vY * 110.0 - uTime * 0.8));
          float band = 1.0 - smoothstep(0.0, 0.05, abs(fract(vY * 0.5 - uTime * 0.22) - 0.5)); // бегущая полоса
          float ao = 0.45 + 0.55 * vAo;
          // насыщенный циан в теле, к кромке — почти белый
          vec3 deep = uColor * vec3(0.35, 0.75, 0.95);
          vec3 col = mix(deep, vec3(0.75, 1.0, 1.0), fres) * (0.55 + 1.5 * fres) * scan * ao + uColor * band * 0.6;
          float a = clamp(0.62 + fres * 0.5 + band * 0.2, 0.0, 1.0) * uGlow;
          gl_FragColor = vec4(col * 1.25, a);
        }`,
    });
    return { material: m, update(t, glow) { uTime.value = t; uGlow.value = glow; } };
  }
  // marble — текущий вид
  const m = withBakedAo(new THREE.MeshPhysicalMaterial({
    color: 0xa39f99, map: marbleAlbedo, roughness: 0.68, metalness: 0,
    normalMap: marbleNormal, normalScale: new THREE.Vector2(0.18, 0.18), envMapIntensity: 0.5,
  }));
  return { material: m, update() {} };
}
