/**
 * Первый экран: персонаж из public/models/base.glb, вид со спины,
 * телевик + рим-свет как у bersus.io. Персонаж занимает весь кадр по высоте.
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

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const MODEL_URL = '/models/character.glb'; // draco, 2.7 MB (исходник base.glb 36 MB)
const TARGET_HEIGHT = 1.85;

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
  scene.background = new THREE.Color(0x0a0a0a);

  // окружение: слабое, только для бликов на ткани
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.1;

  const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 50);

  // ---------- model ----------
  const gltf = await new Promise((resolve, reject) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(MODEL_URL, resolve, (e) => { if (e.total) onProgress?.(e.loaded / e.total); }, reject);
  });
  const root = gltf.scene;
  // в файле две фигуры (z<0 и z>0): оставляем одну
  const PART = new URLSearchParams(location.search).get('part') || 'back';
  root.traverse((o) => { if (o.isMesh) o.geometry = keepHalf(o.geometry, PART === 'front' ? 1 : -1); });

  // единый материал: глянцевая «кожа» с микрозерном, как на bersus — блики рваные, база почти чёрная
  const grain = noiseTexture(512, 0.55, 0.72);
  grain.repeat.set(24, 24);
  const grainNormal = noiseNormalTexture(512, 2.0);
  grainNormal.repeat.set(24, 24);
  // ВАЖНО: RectAreaLight в three.js не учитывает clearcoat, поэтому глянец живёт в базовом слое:
  // roughness × grain(0.45..0.99) → эффективно ~0.35 с крапинками, диффуз почти чёрный (albedo 0.02).
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x050505,
    roughness: 0.5,
    roughnessMap: grain,
    metalness: 0.0,
    clearcoat: 0.0,
    normalMap: grainNormal,
    normalScale: new THREE.Vector2(0.9, 0.9), // зерно ломает отражение софтбокса в крапинки
    sheen: 0,
    envMapIntensity: 0.1,
    side: THREE.FrontSide,
  });
  // голова (волосы/кожа) светлее одежды: подмешиваем цвет по высоте в мировых координатах
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uHeadY = { value: 1.68 };
    shader.uniforms.uHeadColor = { value: new THREE.Color(0x1a1510) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vWorldY;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldY = (modelMatrix * vec4(transformed, 1.0)).y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vWorldY;\nuniform float uHeadY;\nuniform vec3 uHeadColor;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  float headMask = smoothstep(uHeadY - 0.015, uHeadY + 0.015, vWorldY);\n  diffuseColor.rgb = mix(diffuseColor.rgb, uHeadColor, headMask);')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n  #ifdef USE_CLEARCOAT\n  material.clearcoat *= (1.0 - headMask);\n  #endif\n  material.roughness = mix(material.roughness, 0.62, headMask);');
    mat.userData.shader = shader;
  };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = mat;
    o.castShadow = true;
    o.receiveShadow = true;
    o.frustumCulled = false;
  });

  // нормализация: рост TARGET_HEIGHT, ноги на y=0, центр по x/z
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  root.scale.setScalar(TARGET_HEIGHT / size.y);
  box.setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -box.min.y, -c.z);
  // зеркалим: ноутбук в левой руке → в правой части кадра, как на референсе
  const mirror = new THREE.Group();
  mirror.scale.x = -1;
  mirror.add(root);

  const pivot = new THREE.Group();
  pivot.add(mirror);
  scene.add(pivot);

  // ---------- lights: римы сзади/сбоку (bersus: right_side / left_side / top / fill) ----------
  const target = new THREE.Vector3(0, 1.35, 0);
  const rect = (color, intensity, w, h, pos) => {
    const l = new THREE.RectAreaLight(color, intensity, w, h);
    l.position.set(...pos);
    l.lookAt(target);
    l.userData.base = intensity;
    scene.add(l);
    return l;
  };
  // Большие софтбоксы, стоящие так, чтобы их отражение в глянцевом слое попадало в камеру (+Z):
  // получаются широкие стрики с чёткими краями, зерно нормалей делает их крапчатыми.
  const lights = [
    rect(0xffe8d2, 8, 2.6, 4.5, [-3.0, 4.4, 1.6]),     // верхне-левый софтбокс: спина, левый рукав (тёплый)
    rect(0xf4f2ec, 5.5, 2.2, 4.0, [3.6, 3.2, 0.6]),    // правый софтбокс: плечо, правый бок (холодный)
    rect(0xffffff, 9, 0.8, 2.6, [2.6, 2.2, -2.8]),     // задне-правый рим: контур
    rect(0xffffff, 2.5, 2.0, 0.8, [0.3, 4.4, -1.0]),   // макушка
    rect(0x9fb0d8, 1.6, 6, 4, [0.8, 1.6, 4.5]),        // фронтальный фил: тусклые полутона на спине и левом рукаве
  ];
  const spot = new THREE.SpotLight(0xffffff, 6, 10, 0.5, 0.8, 1.5);
  spot.position.set(-2.6, 4.6, 1.0);
  spot.target.position.copy(target);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.bias = -0.0002;
  spot.shadow.normalBias = 0.02;
  spot.userData.base = 6;
  scene.add(spot, spot.target);
  lights.push(spot);
  let lightOn = 0;

  // ---------- camera: сзади, чуть справа; ноутбук уходит вправо ----------
  pivot.rotation.y = Math.PI + 0.38; // почти строго в спину, ноутбук чуть справа
  const rig = { dist: 4.2, height: 1.62, targetY: 1.5, fov: 30 };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function fitFov(aspect) {
    // кадр: от макушки до пояса; в портрете — чтобы плечи влезли по ширине
    const wantH = 1.22;
    const fovH = 2 * Math.atan(wantH / 2 / rig.dist);
    const wantW = 1.3;
    const fovW = 2 * Math.atan(wantW / 2 / rig.dist / aspect);
    return THREE.MathUtils.radToDeg(Math.max(fovH, fovW));
  }

  // ---------- post: GTAO (SSAO) + tonemap + film grain ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 1.0;
  gtao.updateGtaoMaterial({ radius: 0.22, distanceExponent: 1.5, thickness: 1.0, scale: 1.4, samples: 16, distanceFallOff: 1.0, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 });
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  const grainPass = new ShaderPass(GrainShader);
  grainPass.uniforms.amount.value = 0.07;
  composer.addPass(grainPass);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    composer.setPixelRatio(renderer.getPixelRatio());
    gtao.setSize(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    camera.aspect = w / h;
    camera.fov = fitFov(camera.aspect);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let running = false;
  let lightOnAt = -1;
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const state = { baseRotY: pivot.rotation.y };

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, clock.getDelta());
    const t = clock.getElapsedTime();

    if (lightOnAt >= 0) lightOn = easeOut(clamp01((t - lightOnAt) / 2.2));
    for (const l of lights) l.intensity = l.userData.base * lightOn;

    const k = 1 - Math.exp(-dt * 3);
    mouse.sx += (mouse.x - mouse.sx) * k;
    mouse.sy += (mouse.y - mouse.sy) * k;

    // idle: лёгкое дыхание/покачивание
    pivot.rotation.y = state.baseRotY + Math.sin(t * 0.35) * 0.01;
    pivot.position.y = Math.sin(t * 1.1) * 0.003;

    camPos.set(mouse.sx * 0.15, rig.height - mouse.sy * 0.06, rig.dist);
    camera.position.copy(camPos);
    camTarget.set(-0.06 + mouse.sx * 0.03, rig.targetY - mouse.sy * 0.015, 0);
    camera.lookAt(camTarget);

    grainPass.uniforms.time.value = t;
    composer.render();
    if (captureCb) { const cb = captureCb; captureCb = null; cb(readPixels()); }
  }

  let captureCb = null;
  /** Читает кадр сразу после рендера (до swap буферов). */
  function readPixels() {
    const gl = renderer.getContext();
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const buf = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return { width: w, height: h, data: buf, flipY: true };
  }

  return {
    start() { running = true; frame(); },
    capture() { return new Promise((res) => { captureCb = res; }); },
    setLightOn(v) { lightOnAt = -1; lightOn = v; },
    gtao, grainPass, composer,
    lightsOn() { lightOnAt = clock.getElapsedTime(); },
    scene, camera, renderer, pivot, material: mat, state, rig, lights,
  };
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
