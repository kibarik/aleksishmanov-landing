/**
 * Первый экран + скролл-переход по модели bersus.io.
 *
 * Шаги (см. tests/bersus-scroll-analysis.md):
 *   init → black-man   prelude 2 с: камера подъезжает, свет включается
 *   black-man → into-white   глитч, на 36% свап в белую сцену, камера пролетает сквозь фигуру вперёд
 *   into-white → full   key light + env проявляют статую, камера наезжает, теглайн
 *   full → release   отдаём нативный скролл, контент ниже
 *
 * Система координат: персонаж смотрит в +Z (с поворотом 0.38), камера в тёмной фазе стоит на −Z.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GrainShader } from './grainShader.js';
import { GlitchShader } from './glitchShader.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (t, a, b) => clamp01((t - a) / (b - a));

const MODEL_URL = '/models/character.glb'; // draco, 2.7 MB (исходник base.glb 36 MB)
const TARGET_HEIGHT = 1.85;
const BLACK = new THREE.Color(0x0a0a0a);
const WHITE = new THREE.Color(3, 3, 3); // >1: после ACES tone mapping даёт чистый белый

// Параметры bersus (desktop)
const SWAP_POINT = 0.36;          // color swap внутри black-man → into-white
const GLITCH_START = 0.01, GLITCH_END = 0.9;
const KEY_LIGHT_MAX = 1.7;        // у них 1.11 в своих единицах; подобрано под нашу экспозицию
const ENV_FADE = { start: 0.25, duration: 0.3, to: 1.25 };
const SHADOW_FLOOR = { before: 0.13, after: 0.1 };
const TAGLINE_AT = 0.75;
const mmToFov = (mm) => THREE.MathUtils.radToDeg(2 * Math.atan(24 / (2 * mm))); // sensor 24 мм

export async function createScene(canvas, { onProgress } = {}) {
  RectAreaLightUniformsLib.init();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = BLACK.clone();

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.1;

  const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 60);

  // ---------- model ----------
  const gltf = await new Promise((resolve, reject) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(MODEL_URL, resolve, (e) => { if (e.total) onProgress?.(e.loaded / e.total); }, reject);
  });
  const root = gltf.scene;
  const PART = new URLSearchParams(location.search).get('part') || 'back';
  root.traverse((o) => { if (o.isMesh) o.geometry = keepHalf(o.geometry, PART === 'front' ? 1 : -1); });

  // ---------- materials ----------
  const grain = noiseTexture(512, 0.55, 0.72);
  grain.repeat.set(24, 24);
  const grainNormal = noiseNormalTexture(512, 2.0);
  grainNormal.repeat.set(24, 24);
  // Тёмная фаза: глянцевая «кожа». RectAreaLight в three не учитывает clearcoat → глянец в базовой roughness.
  const darkMat = new THREE.MeshPhysicalMaterial({
    color: 0x050505, roughness: 0.5, roughnessMap: grain, metalness: 0, clearcoat: 0,
    normalMap: grainNormal, normalScale: new THREE.Vector2(0.9, 0.9), sheen: 0, envMapIntensity: 0.1,
  });
  darkMat.onBeforeCompile = (shader) => {
    shader.uniforms.uHeadY = { value: 1.68 };
    shader.uniforms.uHeadColor = { value: new THREE.Color(0x1a1510) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vWorldY;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldY = (modelMatrix * vec4(transformed, 1.0)).y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vWorldY;\nuniform float uHeadY;\nuniform vec3 uHeadColor;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  float headMask = smoothstep(uHeadY - 0.015, uHeadY + 0.015, vWorldY);\n  diffuseColor.rgb = mix(diffuseColor.rgb, uHeadColor, headMask);')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n  material.roughness = mix(material.roughness, 0.62, headMask);');
  };
  // Белая фаза: мраморная статуя. Без света читается чёрным силуэтом (как у bersus после свапа).
  const statueMat = new THREE.MeshPhysicalMaterial({
    color: 0x9a9791, roughness: 0.72, roughnessMap: grain, metalness: 0,
    normalMap: grainNormal, normalScale: new THREE.Vector2(0.5, 0.5), envMapIntensity: 0.55,
  });
  const meshes = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = darkMat; o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
    meshes.push(o);
  });

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  root.scale.setScalar(TARGET_HEIGHT / size.y);
  box.setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -box.min.y, -c.z);
  const mirror = new THREE.Group();
  mirror.scale.x = -1;
  mirror.add(root);
  const pivot = new THREE.Group();
  pivot.rotation.y = 0.38;
  pivot.add(mirror);
  scene.add(pivot);

  // ---------- white-scene props: пьедестал, пол-тень, 3D-текст ----------
  const white = new THREE.Group();
  white.visible = false;
  scene.add(white);
  const marble = new THREE.MeshPhysicalMaterial({ color: 0x96938d, roughness: 0.76, normalMap: grainNormal, normalScale: new THREE.Vector2(0.3, 0.3), envMapIntensity: 1 });
  const PED_H = 0.62;
  const ped = new THREE.Group();
  ped.position.y = -PED_H;
  ped.add(mesh(new THREE.CylinderGeometry(0.44, 0.44, PED_H - 0.14, 48), marble, [0, PED_H / 2, 0]));
  ped.add(mesh(new THREE.CylinderGeometry(0.56, 0.5, 0.07, 48), marble, [0, PED_H - 0.035, 0]));
  ped.add(mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.08, 48), marble, [0, 0.04, 0]));
  const fluteGeo = new THREE.CylinderGeometry(0.035, 0.035, PED_H - 0.16, 10);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    ped.add(mesh(fluteGeo, marble, [Math.cos(a) * 0.44, PED_H / 2, Math.sin(a) * 0.44]));
  }
  ped.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  white.add(ped);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: 0x000000, opacity: SHADOW_FLOOR.before }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -PED_H;
  floor.receiveShadow = true;
  white.add(floor);
  // 3D-текст позади фигуры: плоскость с canvas-текстурой, фигура перекрывает буквы
  const titleTex = makeTitleTexture('ALEKS');
  const title = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.4), new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, alphaTest: 0.5, toneMapped: false, color: 0x0a0a0a }));
  title.position.set(0, 1.12, -0.9);
  title.castShadow = true;
  white.add(title);

  // ---------- lights ----------
  const target = new THREE.Vector3(0, 1.35, 0);
  const rect = (color, intensity, w, h, pos) => {
    const l = new THREE.RectAreaLight(color, intensity, w, h);
    l.position.set(-pos[0], pos[1], -pos[2]); // повёрнуто на 180° к прежней раскладке: камера теперь на −Z
    l.lookAt(target);
    l.userData.base = intensity;
    scene.add(l);
    return l;
  };
  const darkLights = [
    rect(0xffe8d2, 8, 2.6, 4.5, [-3.0, 4.4, 1.6]),
    rect(0xf4f2ec, 5.5, 2.2, 4.0, [3.6, 3.2, 0.6]),
    rect(0xffffff, 9, 0.8, 2.6, [2.6, 2.2, -2.8]),
    rect(0xffffff, 2.5, 2.0, 0.8, [0.3, 4.4, -1.0]),
    rect(0x9fb0d8, 1.6, 6, 4, [0.8, 1.6, 4.5]),
  ];
  const spot = new THREE.SpotLight(0xffffff, 6, 10, 0.5, 0.8, 1.5);
  spot.position.set(2.6, 4.6, -1.0);
  spot.target.position.copy(target);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.bias = -0.0002;
  spot.shadow.normalBias = 0.02;
  spot.userData.base = 6;
  scene.add(spot, spot.target);
  darkLights.push(spot);
  let lightOn = 0;
  // Белая фаза: key light bersus (−1, 3, 1) с тенью на пол
  const key = new THREE.DirectionalLight(0xffffff, 0);
  key.position.set(-2.4, 4.0, 2.4);
  key.target.position.set(0, 0.8, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -3;
  key.shadow.camera.right = key.shadow.camera.top = 3;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 12;
  key.shadow.bias = -0.0007; key.shadow.normalBias = 0.03;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const keyFill = new THREE.HemisphereLight(0xffffff, 0xd9d6d0, 0);
  scene.add(keyFill);

  // ---------- camera keyframes (координаты bersus × 0.85, наша тёмная поза оставлена как есть) ----------
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });
  const KF = {
    init:      { pos: [0, 1.47, -4.55], tgt: [0.06, 1.45, 0], mm: null },
    blackMan:  { pos: [0, 1.62, -4.2],  tgt: [0.06, 1.5, 0],  mm: null },
    intoWhite: { pos: [0, 0.9, 10.5],   tgt: [0, 1.1, 0],     mm: 55 },
    full:      { pos: [0, 2.14, 8.74],  tgt: [0, 0.95, 0],    mm: 60 },
  };
  function darkFov(aspect) {
    // кадр тёмной фазы: от макушки до пояса; в портрете — чтобы плечи влезли по ширине
    const dist = 4.2;
    const fovH = 2 * Math.atan(1.22 / 2 / dist);
    const fovW = 2 * Math.atan(1.3 / 2 / dist / aspect);
    return THREE.MathUtils.radToDeg(Math.max(fovH, fovW));
  }
  function whiteFov(mm, aspect) {
    const base = mmToFov(mm);
    // в портрете расширяем, чтобы фигура с пьедесталом и текст влезли по ширине
    const fovW = THREE.MathUtils.radToDeg(2 * Math.atan(3.2 / 2 / 9 / aspect));
    return Math.max(base, fovW);
  }

  // ---------- post: GTAO + tonemap + glitch + grain ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 1.0;
  gtao.updateGtaoMaterial({ radius: 0.22, distanceExponent: 1.5, thickness: 1.0, scale: 1.4, samples: 16, distanceFallOff: 1.0, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 });
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  const glitchPass = new ShaderPass(GlitchShader);
  composer.addPass(glitchPass);
  const grainPass = new ShaderPass(GrainShader);
  grainPass.uniforms.amount.value = 0.07;
  composer.addPass(grainPass);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    composer.setPixelRatio(renderer.getPixelRatio());
    gtao.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    glitchPass.uniforms.uResolution.value = [w * renderer.getPixelRatio(), h * renderer.getPixelRatio()];
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- timeline ----------
  const tl = { t01: 0, t12: 0, t23: 0, swapped: false, glitch: 0, tagline: false, hintHidden: false };
  const listeners = new Set();
  const cam = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 30 };

  function setSwapped(on) {
    if (tl.swapped === on) return;
    tl.swapped = on;
    for (const m of meshes) m.material = on ? statueMat : darkMat;
    white.visible = on;
    scene.background.copy(on ? WHITE : BLACK);
    document.body.classList.toggle('is-light', on);
    grainPass.uniforms.amount.value = on ? 0.025 : 0.07;
    // AO на белом фоне даёт грязь по краям — ослабляем
    gtao.enabled = !on; // на белом AO даёт грязный ореол вокруг фигуры
  }

  /** sticky — объект из stickyScroll: local(from, to). */
  function applyTimeline(sticky) {
    const t01 = sticky.local('init', 'black-man');
    const t12 = sticky.local('black-man', 'into-white');
    const t23 = sticky.local('into-white', 'full');
    tl.t01 = t01; tl.t12 = t12; tl.t23 = t23;

    // --- камера
    const a = camera.aspect;
    if (t12 <= 0) {
      const e = easeInOutCubic(t01);
      cam.pos.fromArray(KF.init.pos).lerp(new THREE.Vector3().fromArray(KF.blackMan.pos), e);
      cam.tgt.fromArray(KF.init.tgt).lerp(new THREE.Vector3().fromArray(KF.blackMan.tgt), e);
      cam.fov = darkFov(a);
    } else if (t23 <= 0) {
      const e = easeInOutCubic(t12);
      cam.pos.fromArray(KF.blackMan.pos).lerp(new THREE.Vector3().fromArray(KF.intoWhite.pos), e);
      cam.tgt.fromArray(KF.blackMan.tgt).lerp(new THREE.Vector3().fromArray(KF.intoWhite.tgt), e);
      cam.fov = lerp(darkFov(a), whiteFov(55, a), e);
    } else {
      const e = easeInOutCubic(t23);
      cam.pos.fromArray(KF.intoWhite.pos).lerp(new THREE.Vector3().fromArray(KF.full.pos), e);
      cam.tgt.fromArray(KF.intoWhite.tgt).lerp(new THREE.Vector3().fromArray(KF.full.tgt), e);
      cam.fov = lerp(whiteFov(55, a), whiteFov(60, a), e);
    }

    // --- глитч: 1%…90% сегмента black-man → into-white
    const g = t12 <= GLITCH_START || t12 >= GLITCH_END ? 0 : (t12 - GLITCH_START) / (GLITCH_END - GLITCH_START);
    tl.glitch = g;
    glitchPass.uniforms.uProgress.value = g;
    glitchPass.uniforms.uBypass.value = g <= 0 || g >= 1 ? 1 : 0;

    // --- color swap на 36%
    setSwapped(t12 >= SWAP_POINT);

    // --- свет белой фазы: key 0→max по всему сегменту, env на 25%…55%
    const keyFade = t23;
    key.intensity = KEY_LIGHT_MAX * keyFade;
    keyFill.intensity = 0.12 * keyFade;
    const envT = seg(t23, ENV_FADE.start, ENV_FADE.start + ENV_FADE.duration);
    scene.environmentIntensity = tl.swapped ? ENV_FADE.to * envT : 0.1;
    floor.material.opacity = lerp(SHADOW_FLOOR.before, SHADOW_FLOOR.after, keyFade);

    // --- HUD-события
    const tagline = t23 >= TAGLINE_AT;
    const hintHidden = t12 > 0.2;
    if (tagline !== tl.tagline || hintHidden !== tl.hintHidden) {
      tl.tagline = tagline; tl.hintHidden = hintHidden;
    }
    for (const fn of listeners) fn(tl);
  }

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let running = false;
  let lightOnAt = -1;
  let sticky = null;
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const state = { baseRotY: pivot.rotation.y };

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, clock.getDelta());
    const t = clock.getElapsedTime();

    if (lightOnAt >= 0) lightOn = easeOut(clamp01((t - lightOnAt) / 2.2));
    const darkMul = tl.swapped ? 0 : lightOn;
    for (const l of darkLights) l.intensity = l.userData.base * darkMul;

    const k = 1 - Math.exp(-dt * 3);
    mouse.sx += (mouse.x - mouse.sx) * k;
    mouse.sy += (mouse.y - mouse.sy) * k;

    if (sticky) applyTimeline(sticky);
    else { cam.pos.fromArray(KF.blackMan.pos); cam.tgt.fromArray(KF.blackMan.tgt); cam.fov = darkFov(camera.aspect); }

    // idle: дыхание + курсор-параллакс (в белой фазе слабее и в другую сторону: камера на +Z)
    pivot.rotation.y = state.baseRotY + Math.sin(t * 0.35) * 0.01;
    pivot.position.y = Math.sin(t * 1.1) * 0.003;
    const side = tl.swapped ? 1 : -1;
    const par = tl.swapped ? 0.5 : 1;
    camPos.copy(cam.pos);
    camPos.x += side * mouse.sx * 0.15 * par;
    camPos.y += -mouse.sy * 0.06 * par;
    camera.position.copy(camPos);
    camTarget.copy(cam.tgt);
    camTarget.x += side * mouse.sx * 0.03 * par;
    camTarget.y += -mouse.sy * 0.015 * par;
    camera.lookAt(camTarget);
    if (Math.abs(camera.fov - cam.fov) > 1e-3) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }

    grainPass.uniforms.time.value = t;
    glitchPass.uniforms.uTime.value = t;
    composer.render();
    if (captureCb) { const cb = captureCb; captureCb = null; cb(readPixels()); }
  }

  let captureCb = null;
  function readPixels() {
    const gl = renderer.getContext();
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const buf = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return { width: w, height: h, data: buf, flipY: true };
  }

  return {
    start() { running = true; frame(); },
    attachScroll(s) { sticky = s; },
    onTimeline(fn) { listeners.add(fn); },
    capture() { return new Promise((res) => { captureCb = res; }); },
    setLightOn(v) { lightOnAt = -1; lightOn = v; },
    lightsOn() { lightOnAt = clock.getElapsedTime(); },
    gtao, grainPass, glitchPass, composer, tl,
    scene, camera, renderer, pivot, material: darkMat, statueMat, state, darkLights, key,
  };
}

function mesh(geo, mat, pos) { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); return m; }

/** Текстура заголовка: прозрачный фон, чёрные жирные буквы. */
function makeTitleTexture(text) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 400px Manrope, "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = '-12px';
  ctx.fillText(text, c.width / 2, c.height / 2 + 20);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Оставляет треугольники, центр которых на стороне sign по оси Z, и уплотняет вершины. */
function keepHalf(geo, sign) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const idx = geo.index ? geo.index.array : null;
  const triCount = idx ? idx.length / 3 : pos.count / 3;
  const remap = new Int32Array(pos.count).fill(-1);
  const newIdx = [];
  const P = [], N = [], U = [];
  let next = 0;
  const use = (v) => {
    if (remap[v] < 0) {
      remap[v] = next++;
      P.push(pos.getX(v), pos.getY(v), pos.getZ(v));
      if (nor) N.push(nor.getX(v), nor.getY(v), nor.getZ(v));
      if (uv) U.push(uv.getX(v), uv.getY(v));
    }
    return remap[v];
  };
  for (let t = 0; t < triCount; t++) {
    const a = idx ? idx[t * 3] : t * 3, b = idx ? idx[t * 3 + 1] : t * 3 + 1, c = idx ? idx[t * 3 + 2] : t * 3 + 2;
    const z = pos.getZ(a) + pos.getZ(b) + pos.getZ(c);
    if (z * sign > 0) newIdx.push(use(a), use(b), use(c));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  if (nor) out.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  if (uv) out.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  out.setIndex(newIdx);
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

/** Серый шум для roughness: value-noise + зерно. */
function noiseTexture(size, contrast, center = 0.5) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  let seed = 4242;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646; };
  const G = 32, grid = new Float32Array((G + 1) * (G + 1));
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const sm = (t) => t * t * (3 - 2 * t);
  const sample = (x, y) => {
    const gx = (x / size) * G, gy = (y / size) * G;
    const x0 = Math.floor(gx) % G, y0 = Math.floor(gy) % G, fx = sm(gx - Math.floor(gx)), fy = sm(gy - Math.floor(gy));
    const g = (i, j) => grid[(j % G) * (G + 1) + (i % G)];
    return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = sample(x, y) * 0.45 + sample(x * 4, y * 4) * 0.25 + rnd() * 0.3;
    v = center + (v - 0.5) * contrast;
    const k = Math.max(0, Math.min(255, Math.round(v * 255)));
    const i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = k; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Normal map из шума (мелкое зерно поверхности). */
function noiseNormalTexture(size, strength) {
  const h = noiseTexture(size, 1.0).image;
  const ctx = h.getContext('2d');
  const src = ctx.getImageData(0, 0, size, size).data;
  const out = ctx.createImageData(size, size);
  const at = (x, y) => src[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
    const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const len = Math.hypot(dx, dy, 1);
    const i = (y * size + x) * 4;
    out.data[i] = Math.round((-dx / len * 0.5 + 0.5) * 255);
    out.data[i + 1] = Math.round((-dy / len * 0.5 + 0.5) * 255);
    out.data[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
    out.data[i + 3] = 255;
  }
  const c = document.createElement('canvas');
  c.width = c.height = size;
  c.getContext('2d').putImageData(out, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
