/**
 * 3D-элемент футера: хромированный глиф, который медленно вращается и ловит блики.
 * Отдельная маленькая сцена во втором канвасе; стартует, когда футер попал в зону видимости,
 * и останавливается, когда ушёл. Модуль подгружается динамически — без WebGL не импортируется.
 *
 * Чтобы заменить объект на сгенерированную модель, достаточно поменять MODEL_URL:
 * при непустом значении вместо глифа грузится glb тем же материалом.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const BASE = import.meta.env.BASE_URL;
/** Пусто — рисуем глиф. Непусто — грузим модель (например сгенерированную в hyper3d). */
const MODEL_URL = '';
const GLYPH = '{}';

export async function mountFooter3d(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.35;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 0, 6.2);

  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(-3, 4, 5);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));

  // хром: зеркальный металл, блики берутся из окружения
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdadada, metalness: 1, roughness: 0.08, envMapIntensity: 1.6 });
  const pivot = new THREE.Group();
  scene.add(pivot);

  if (MODEL_URL) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(`${BASE}draco/`);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    const gltf = await loader.loadAsync(MODEL_URL);
    const root = gltf.scene;
    root.traverse((o) => { if (o.isMesh) o.material = chrome; });
    // нормализуем по высоте, чтобы объект не зависел от масштаба исходника
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    root.scale.setScalar(2.6 / Math.max(size.y, 1e-3));
    box.setFromObject(root).getCenter(size);
    root.position.sub(size);
    pivot.add(root);
  } else {
    const font = await new FontLoader().loadAsync(`${BASE}fonts/helvetiker_bold.typeface.json`);
    const geo = new TextGeometry(GLYPH, {
      font, size: 1.5, depth: 0.55, curveSegments: 14,
      bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.045, bevelSegments: 6,
    });
    geo.center();
    pivot.add(new THREE.Mesh(geo, chrome));
  }

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let raf = 0;
  let running = false;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };

  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    const dt = 1 - Math.exp(-clock.getDelta() * 3);
    mouse.sx += (mouse.x - mouse.sx) * dt;
    mouse.sy += (mouse.y - mouse.sy) * dt;
    pivot.rotation.y = Math.sin(t * 0.25) * 0.5 + mouse.sx * 0.45;
    pivot.rotation.x = Math.sin(t * 0.19) * 0.16 + mouse.sy * 0.22;
    pivot.position.y = Math.sin(t * 0.7) * 0.06;
    renderer.render(scene, camera);
  }

  return {
    start() { if (running) return; running = true; clock.getDelta(); resize(); frame(); },
    stop() { running = false; cancelAnimationFrame(raf); },
  };
}
