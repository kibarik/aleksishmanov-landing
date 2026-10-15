// Запекание ambient occlusion в вершины модели персонажа: атрибут _AO (один канал, Draco, 6 бит).
// Сцена умножает на него свет статуи (src/scene.js, statueMat) — складки темнеют, как на текстуре статуи bersus.
// Зависимости не в проекте, ставятся разово:
//   npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 draco3dgltf three-mesh-bvh@0.8.3
//   node scripts/bake-ao.mjs in.glb out.glb [rays=48] [radiusFrac=0.065] [quantPos=12]
// desktop: quantPos 12 (~60 с), mobile: 14 (~40 с). Входная модель — без _AO (перезапись по кругу не нужна).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const [inp, out, raysArg = '48', radArg = '0.065', qArg = '12'] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(inp);
const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
const K = +raysArg;
// направления: косинусное полушарие вокруг +Z (Фибоначчи), поворот к нормали на вершину + случайный поворот вокруг нормали
const dirs = [];
for (let i = 0; i < K; i++) {
  const u = (i + 0.5) / K, phi = i * 2.399963;
  const r = Math.sqrt(u);
  dirs.push(new THREE.Vector3(r * Math.cos(phi), r * Math.sin(phi), Math.sqrt(1 - u)));
}
for (const prim of prims) {
  const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL'), idx = prim.getIndices();
  const n = pos.getCount();
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), t = [0, 0, 0];
  for (let i = 0; i < n; i++) { pos.getElement(i, t); P.set(t, i * 3); nor.getElement(i, t); N.set(t, i * 3); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(idx.getArray()), 1));
  geo.computeBoundingBox();
  const H = geo.boundingBox.max.y - geo.boundingBox.min.y;
  const R = H * +radArg, eps = H * 0.0015;
  const bvh = new MeshBVH(geo);
  const ray = new THREE.Ray(), nv = new THREE.Vector3(), q = new THREE.Quaternion(), z = new THREE.Vector3(0, 0, 1), rot = new THREE.Quaternion(), d = new THREE.Vector3();
  const ao = new Float32Array(n);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    nv.set(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]).normalize();
    q.setFromUnitVectors(z, nv);
    rot.setFromAxisAngle(z, (i * 0.618034 % 1) * Math.PI * 2);
    let occ = 0;
    for (const dd of dirs) {
      d.copy(dd).applyQuaternion(rot).applyQuaternion(q);
      ray.origin.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).addScaledVector(nv, eps);
      ray.direction.copy(d);
      const hit = bvh.raycastFirst(ray, mat, 0, R);
      if (hit) occ += 1 - hit.distance / R; // ближние препятствия затеняют сильнее
    }
    ao[i] = 1 - occ / K;
  }
  // сглаживание по соседям (2 прохода): убирает шум от конечного числа лучей
  const ia = idx.getArray();
  for (let pass = 0; pass < 2; pass++) {
    const sum = new Float32Array(n), cnt = new Uint16Array(n);
    for (let f = 0; f < ia.length; f += 3) for (let k = 0; k < 3; k++) { const a = ia[f + k]; for (let m = 0; m < 3; m++) { sum[a] += ao[ia[f + m]]; cnt[a]++; } }
    for (let i = 0; i < n; i++) ao[i] = sum[i] / cnt[i];
  }
  let mean = 0;
  for (let i = 0; i < n; i++) { ao[i] = Math.min(1, Math.max(0, ao[i])); mean += ao[i]; }
  // один канал: пользовательский атрибут _AO (GLTFLoader кладёт его в geometry.attributes._ao)
  const acc = doc.createAccessor().setType('SCALAR').setArray(ao).setBuffer(pos.getBuffer());
  prim.setAttribute('_AO', acc);
  console.log(`вершин ${n}, лучей ${K}, R=${R.toFixed(4)}, средний AO ${(mean / n).toFixed(3)}, ${((Date.now() - t0) / 1000).toFixed(1)} с`);
}
await doc.transform(draco({ quantizePosition: +qArg, quantizeGeneric: +(process.env.QG || 6) }));
await io.write(out, doc);
