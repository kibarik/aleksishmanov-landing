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
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (t, a, b) => clamp01((t - a) / (b - a));

// BASE_URL: пути относительно базы сборки, чтобы статика работала и не в корне домена
const BASE = import.meta.env.BASE_URL;
const MODEL_URL = `${BASE}models/character.glb`; // draco, 2.7 MB (исходник base.glb 36 MB)
const TARGET_HEIGHT = 1.85;
const BLACK = new THREE.Color(0x0a0a0a);
const WHITE = new THREE.Color(3, 3, 3); // >1: после ACES tone mapping даёт чистый белый

// Параметры bersus (desktop)
const SWAP_POINT = 0.36;          // color swap внутри black-man → into-white
const GLITCH_START = 0.01, GLITCH_END = 0.9;
const KEY_LIGHT_MAX = 2.8;        // у них 1.11 в своих единицах; подобрано под нашу экспозицию
const ENV_FADE = { start: 0.25, duration: 0.3, to: 0.55 }; // у bersus 1.25, но их статуя с запечённой тенью; нам нужен контраст от key
const SHADOW_FLOOR = { before: 0.2, after: 0.32 }; // у bersus .13→.1, но их тень с текстурой пола читается сильнее
const TAGLINE_AT = 0.75;
// Mobile (bersus, UNIT 260, black-man 260 → full 1053): свап на абсолютном 370, заголовок с 560
const MOBILE = {
  swapLocal: (370 - 260) / (1053 - 260),      // 0.139
  titleFrom: (560 - 260) / (1053 - 260),      // 0.378
  orbitEnd: 0.494949,                          // кадры 51–100 занимают первые 49.5% сегмента
  taglineAt: 0.88,
  hintHideAt: 0.88,
  mmFrom: 24, mmTo: 46,
  titleYOffset: -0.8, titleScaleFrom: 1.2,
};
const mmToFov = (mm) => THREE.MathUtils.radToDeg(2 * Math.atan(24 / (2 * mm))); // sensor 24 мм

// Имя на белой сцене: плоскость с canvas-текстурой за фигурой
const TITLE_W = 5.6;                                   // ширина плоскости, ед. сцены
const TITLE_CANVAS_W = { desktop: 4096, mobile: 2048 }; // холст 4:1; на мобильном вдвое меньше (память)
const TITLE_FONT_RATIO = 0.84;   // кегль от высоты холста
const TITLE_MAX_FILL = 0.96;     // длинное имя ужимается до этой доли ширины холста
const TITLE_FRAME_FILL = 0.9;    // desktop: буквы не шире этой доли видимой ширины кадра

/** @param name {{ desktop: string, mobile: string }} имя по пресетам (content.name) */
export async function createScene(canvas, { onProgress, name }) {
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
    draco.setDecoderPath(`${BASE}draco/`);
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
  const marbleAlbedo = marbleTexture(1024);
  marbleAlbedo.repeat.set(3, 3);
  const marbleNormal = noiseNormalTexture(512, 1.2);
  marbleNormal.repeat.set(4, 4);
  // Чистая поверхность: без шумовой roughnessMap и с очень слабым normal-зерном — иначе рябь на белом
  const statueMat = new THREE.MeshPhysicalMaterial({
    color: 0xa39f99, map: marbleAlbedo, roughness: 0.68, metalness: 0,
    normalMap: marbleNormal, normalScale: new THREE.Vector2(0.18, 0.18), envMapIntensity: 0.5,
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
  const marble = new THREE.MeshPhysicalMaterial({ color: 0xa5a29c, map: marbleAlbedo, roughness: 0.78, normalMap: marbleNormal, normalScale: new THREE.Vector2(0.15, 0.15), envMapIntensity: 0.6 });
  const PED_H = 0.62;
  const ped = new THREE.Group();
  ped.position.y = -PED_H;
  // профиль колонны (радиус, высота) снизу вверх: плинт → валик → ствол → валик → абака
  const profile = [
    [0.0, 0.0], [0.62, 0.0], [0.62, 0.05], [0.58, 0.06], [0.56, 0.1], [0.5, 0.115], [0.47, 0.14],
    [0.44, 0.16], [0.44, 0.48], [0.47, 0.5], [0.5, 0.525], [0.55, 0.545], [0.57, 0.575], [0.57, 0.6], [0.55, 0.62], [0.0, 0.62],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const column = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), marble);
  ped.add(column);
  // каннелюры: полукруглые желобки, вырезанные «в обратную» — узкие цилиндры чуть утоплены в ствол
  const fluteGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 12);
  const fluteMat = marble.clone(); fluteMat.color.setHex(0x8f8c86);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    ped.add(mesh(fluteGeo, fluteMat, [Math.cos(a) * 0.445, 0.32, Math.sin(a) * 0.445]));
  }
  ped.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  white.add(ped);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: 0x000000, opacity: SHADOW_FLOOR.before }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -PED_H;
  floor.receiveShadow = true;
  white.add(floor);
  // 3D-текст позади фигуры: фигура перекрывает буквы. Рисуется в layoutTitle после attachScroll (известен пресет).
  const titleTex = makeTitleTexture();
  let titleFill = 0; // доля ширины плоскости, занятая буквами (для подгонки под кадр)
  const title = new THREE.Mesh(new THREE.PlaneGeometry(TITLE_W, 1.4), new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, alphaTest: 0.5, toneMapped: false, color: 0x0a0a0a }));
  title.position.set(0, 1.12, -0.9);
  title.castShadow = true;
  white.add(title);
  // Пропсы вокруг пьедестала — вместо шахмат bersus: глянцевые чёрные глифы кода
  const glyphMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1.4 });
  const props = [];
  new FontLoader().load(`${BASE}fonts/helvetiker_bold.typeface.json`, (font) => {
    const add = (ch, size, pos, rot) => {
      const g = new TextGeometry(ch, { font, size, depth: size * 0.42, curveSegments: 10, bevelEnabled: true, bevelThickness: size * 0.03, bevelSize: size * 0.025, bevelSegments: 3 });
      g.center();
      const m = new THREE.Mesh(g, glyphMat);
      m.position.set(...pos); m.rotation.set(...rot);
      m.castShadow = true; m.receiveShadow = true;
      m.userData.base = { pos: [...pos], size };
      white.add(m); props.push(m);
      return m;
    };
    // лежит слева, стоит справа, брошен под углом за спиной справа
    add('{', 0.42, [-1.55, -PED_H + 0.22, 0.1], [0, 0.35, -0.12]);
    add('}', 0.42, [1.45, -PED_H + 0.22, 0.25], [0, -0.3, 0.1]);
    add('/', 0.5, [2.05, -PED_H + 0.07, -0.7], [Math.PI / 2, 0, 0.6]);
    add(';', 0.34, [-1.05, -PED_H + 0.18, 0.75], [0, 0.5, 0]);
    add('<', 0.36, [-2.2, -PED_H + 0.19, -0.6], [0, 0.8, 0]);
    layoutProps();
  });
  function layoutProps() {
    // на мобильном кадр узкий: пропсы ближе к пьедесталу и мельче
    const k = preset === 'mobile' ? 0.5 : 1;
    for (const m of props) {
      const b = m.userData.base;
      m.position.set(b.pos[0] * k, b.pos[1] - (1 - k) * b.size * 0.25, b.pos[2] * k);
      m.scale.setScalar(preset === 'mobile' ? 0.75 : 1);
    }
  }

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
  key.position.set(-3.2, 3.6, 2.8);
  key.target.position.set(0, 0.7, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -3.2;
  key.shadow.camera.right = key.shadow.camera.top = 3.2;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 14;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  key.shadow.radius = 2.5;
  scene.add(key, key.target);
  const keyFill = new THREE.HemisphereLight(0xffffff, 0xb9b5ae, 0);
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
  // Mobile: camera_mobile.glb × 0.85 — камера облетает фигуру по дуге, target статичен
  const KFM = {
    init:     { pos: [0, 1.74, -2.97], tgt: [0.03, 1.55, 0] },
    blackMan: { pos: [0, 1.63, -1.77], tgt: [0.03, 1.55, 0] },
    full:     { pos: [0, 1.6, 8.74],   tgt: [0.03, 0.9, 0] },
  };
  const orbit = new THREE.CatmullRomCurve3([
    [0, 1.63, -1.77], [1.2, 1.53, -1.62], [2.44, 1.43, -0.82], [3.28, 1.37, 0.82],
    [3.46, 1.38, 2.86], [3.04, 1.42, 4.88], [1.13, 1.54, 7.79], [0, 1.6, 8.74],
  ].map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const titleBase = { y: title.position.y, z: title.position.z };

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
    grainPass.uniforms.amount.value = on ? 0.0 : 0.07;
    // AO на белом фоне даёт грязь по краям — ослабляем
    // на белом AO выключен: 16-сэмпловый GTAO даёт шум-рябь на ровных светлых поверхностях
    gtao.enabled = !on;
  }

  let preset = 'desktop';
  let attached = false;
  /** Перерисовка холста имени под пресет: при attachScroll и после загрузки шрифта. */
  function layoutTitle() {
    if (!attached) return;
    const c = titleTex.image;
    const w = TITLE_CANVAS_W[preset];
    if (c.width !== w) { c.width = w; c.height = w / 4; }
    titleFill = drawTitle(c, name[preset]);
    titleTex.needsUpdate = true;
    // desktop: буквы за торсом; mobile: над головой, узкая ширина под портрет
    if (preset === 'mobile') title.position.set(0, 2.1, -0.6);
    else title.position.set(0, 1.12, -0.9);
    titleBase.y = title.position.y;
    scaleTitle();
  }
  /** Масштаб имени; пересчитывается и при ресайзе — без перерисовки холста. */
  function scaleTitle() {
    if (!attached) return;
    if (preset === 'mobile') title.scale.setScalar(0.47); // текст занимает ~70% ширины плоскости (Montserrat 900)
    else {
      // имя не выходит за кадр: ширина букв ≤ TITLE_FRAME_FILL видимой ширины на глубине плоскости в full
      const dist = KF.full.pos[2] - title.position.z;
      const visibleW = 2 * dist * Math.tan(THREE.MathUtils.degToRad(whiteFov(KF.full.mm, camera.aspect)) / 2) * camera.aspect;
      title.scale.setScalar(Math.min(1, (TITLE_FRAME_FILL * visibleW) / (TITLE_W * titleFill)));
    }
    titleBase.scale = title.scale.x;
  }
  window.addEventListener('resize', scaleTitle);
  document.fonts?.load('900 400px Montserrat').then(layoutTitle).catch(() => {});

  /** Mobile: один сегмент black-man → full, без глитча, орбита камеры, key light сразу после свапа. */
  function applyTimelineMobile(sticky) {
    const t01 = sticky.local('init', 'black-man');
    const t = sticky.local('black-man', 'full');
    tl.t01 = t01; tl.t12 = t; tl.t23 = t;
    const a = camera.aspect;
    if (t <= 0) {
      const e = easeInOutCubic(t01);
      cam.pos.fromArray(KFM.init.pos).lerp(new THREE.Vector3().fromArray(KFM.blackMan.pos), e);
      cam.tgt.fromArray(KFM.init.tgt).lerp(new THREE.Vector3().fromArray(KFM.blackMan.tgt), e);
    } else {
      const u = clamp01(t / MOBILE.orbitEnd);
      orbit.getPointAt(easeInOutCubic(u), cam.pos);
      cam.tgt.fromArray(KFM.blackMan.tgt).lerp(new THREE.Vector3().fromArray(KFM.full.tgt), easeInOutCubic(u));
    }
    cam.fov = lerp(mmToFov(MOBILE.mmFrom), mmToFov(MOBILE.mmTo), t); // 24 → 50 мм
    void a;

    glitchPass.uniforms.uBypass.value = 1;
    tl.glitch = 0;
    setSwapped(t >= MOBILE.swapLocal);

    // key light сразу после свапа, env по всему сегменту
    const keyOn = tl.swapped ? 1 : 0;
    key.intensity = KEY_LIGHT_MAX * keyOn;
    keyFill.intensity = 0.12 * keyOn;
    scene.environmentIntensity = tl.swapped ? lerp(0.3, ENV_FADE.to, t) : 0.1;
    floor.material.opacity = keyOn ? SHADOW_FLOOR.after : SHADOW_FLOOR.before;

    // заголовок: выезжает снизу и уменьшается 1.2 → 1 (smoothstep от 37.8% до 100%)
    const st = seg(t, MOBILE.titleFrom, 1);
    const u2 = st * st * (3 - 2 * st);
    title.position.y = titleBase.y + MOBILE.titleYOffset * (1 - u2);
    title.scale.setScalar(titleBase.scale * lerp(MOBILE.titleScaleFrom, 1, u2));
    title.visible = tl.swapped;

    tl.tagline = t >= MOBILE.taglineAt;
    tl.hintHidden = t >= MOBILE.hintHideAt;
    for (const fn of listeners) fn(tl);
  }

  /** sticky — объект из stickyScroll: local(from, to). */
  function applyTimeline(sticky) {
    if (preset === 'mobile') return applyTimelineMobile(sticky);
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
    keyFill.intensity = 0.07 * keyFade;
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
    const par = preset === 'mobile' ? 0 : (tl.swapped ? 0.5 : 1);
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
    attachScroll(s, p = 'desktop') { sticky = s; preset = p; attached = true; layoutTitle(); layoutProps(); },
    onTimeline(fn) { listeners.add(fn); },
    capture() { return new Promise((res) => { captureCb = res; }); },
    setLightOn(v) { lightOnAt = -1; lightOn = v; },
    lightsOn() { lightOnAt = clock.getElapsedTime(); },
    gtao, grainPass, glitchPass, composer, tl,
    scene, camera, renderer, pivot, material: darkMat, statueMat, state, darkLights, key,
  };
}

function mesh(geo, mat, pos) { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); return m; }

/** Текстура имени: прозрачный фон, чёрные жирные буквы. Размер холста задаёт layoutTitle по пресету. */
function makeTitleTexture() {
  const c = document.createElement('canvas');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
/**
 * Рисует имя по центру холста: кегль TITLE_FONT_RATIO высоты, длинное имя ужимается до TITLE_MAX_FILL ширины.
 * Трекинг и оптический сдвиг по вертикали — доли кегля (подобраны под Montserrat 900).
 * Возвращает долю ширины холста, занятую буквами.
 */
function drawTitle(c, text) {
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const font = (px) => { ctx.font = `900 ${px}px Montserrat, "Helvetica Neue", Arial, sans-serif`; ctx.letterSpacing = `${-0.042 * px}px`; };
  let px = c.height * TITLE_FONT_RATIO;
  font(px);
  const maxW = c.width * TITLE_MAX_FILL;
  const w0 = ctx.measureText(text).width;
  if (w0 > maxW) { px *= maxW / w0; font(px); }
  ctx.fillText(text, c.width / 2, c.height / 2 + px * 0.056);
  return Math.min(1, ctx.measureText(text).width / c.width);
}

/** Мрамор: светлая база, тонкие тёмные прожилки, лёгкие пятна. */
function marbleTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9d6d0';
  ctx.fillRect(0, 0, size, size);
  let seed = 777;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646; };
  // пятна
  for (let i = 0; i < 260; i++) {
    const r = 20 + rnd() * 120;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    const k = 0.05 + rnd() * 0.08;
    g.addColorStop(0, `rgba(80,76,70,${k})`); g.addColorStop(1, 'rgba(80,76,70,0)');
    ctx.save(); ctx.translate(rnd() * size, rnd() * size); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
  }
  // прожилки
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    let x = rnd() * size, y = rnd() * size, a = rnd() * Math.PI * 2;
    ctx.strokeStyle = `rgba(70,66,60,${0.12 + rnd() * 0.18})`;
    ctx.lineWidth = 1 + rnd() * 2.5;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 40; k++) { a += (rnd() - 0.5) * 0.9; x += Math.cos(a) * 14; y += Math.sin(a) * 14; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
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
