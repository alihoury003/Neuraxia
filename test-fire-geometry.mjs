#!/usr/bin/env node
/**
 * FIRE-0 geometry regression test (Node, no GPU).
 * Loads the real Sprint 1B GLB, recomputes the cord centreline with the
 * app's algorithm, builds the CST/DCML/STT graph routes and asserts the
 * teaching-critical side logic: where each tract runs and where it crosses.
 * Run from app/:  node scripts/test-fire-geometry.mjs
 */
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { buildFireGraphPathways } from '../src/pathways.js';

await MeshoptDecoder.ready;
const bytes = await readFile('../research/sprint-1b/output/neuraxia-bp3d-cns-desktop.meshopt.glb');
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const gltf = await new Promise((res, rej) => loader.parse(ab, '', res, rej));
gltf.scene.updateMatrixWorld(true);

const entries = [];
gltf.scene.traverse(o => {
  if (!o.isMesh) return;
  const x = o.userData?.neuraxia;
  o.geometry.computeBoundingBox();
  entries.push({ mesh: o, name: x?.display_name || o.name, neuraxia: x,
    localCenter: o.geometry.boundingBox.getCenter(new THREE.Vector3()),
    origin: o.position.clone() });
});
const findEntry = p => entries.find(e => p.test(e.name));
const getEntryCenter = e => { e.mesh.updateWorldMatrix(true, false); return e.mesh.localToWorld(e.localCenter.clone()); };

// modelRadius like app: default-visible bounds sphere
const box = new THREE.Box3();
for (const e of entries.filter(e => e.neuraxia?.default_visible)) box.expandByObject(e.mesh);
const sphere = box.getBoundingSphere(new THREE.Sphere());
const modelRadius = sphere.radius, modelCenter = sphere.center;
console.log(`entries=${entries.length} modelRadius=${modelRadius.toFixed(3)} center=${modelCenter.toArray().map(n=>n.toFixed(3))}`);

// --- replicate computeCordFrame algorithm ---
const cordEntry = findEntry(/^Spinal cord$/i);
const pos = cordEntry.mesh.geometry.attributes.position;
cordEntry.mesh.updateWorldMatrix(true, false);
const m = cordEntry.mesh.matrixWorld; const v = new THREE.Vector3(); const pts = [];
const step = Math.max(1, Math.floor(pos.count / 5000));
let minY = Infinity, maxY = -Infinity;
for (let i = 0; i < pos.count; i += step) {
  v.fromBufferAttribute(pos, i).applyMatrix4(m);
  pts.push([v.x, v.y, v.z]); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
}
const N = 28; const bins = Array.from({ length: N }, () => ({ n: 0, x: 0, y: 0, z: 0 }));
for (const [x, y, z] of pts) { const b = Math.min(N-1, Math.max(0, Math.floor(((y-minY)/(maxY-minY))*N))); bins[b].n++; bins[b].x+=x; bins[b].y+=y; bins[b].z+=z; }
const centers = bins.filter(b => b.n>0).map(b => new THREE.Vector3(b.x/b.n, b.y/b.n, b.z/b.n)).sort((a,b) => b.y - a.y);
let rSum=0, rCount=0;
for (const [x,y,z] of pts) { let best=null, bd=Infinity; for (const c of centers) { const d=Math.abs(c.y-y); if (d<bd){bd=d;best=c;} } if (best){ rSum += Math.hypot(x-best.x, z-best.z); rCount++; } }
const radius = (rSum/rCount) * 1.35;
console.log(`cord: centers=${centers.length} top=${centers[0].toArray().map(n=>n.toFixed(3))} bottom=${centers.at(-1).toArray().map(n=>n.toFixed(3))} radius~${radius.toFixed(4)}m (${(radius*1000).toFixed(1)}mm)`);
const cordFrame = { entry: cordEntry, centers, radius };
function cordPointAt(t, lateral=0, ap=0) {
  const f = THREE.MathUtils.clamp(t,0,1) * (centers.length-1);
  const i0 = Math.floor(f), i1 = Math.min(centers.length-1, i0+1);
  const p = centers[i0].clone().lerp(centers[i1], f-i0);
  p.add(cordEntry.mesh.position.clone().sub(cordEntry.origin));
  p.x += lateral * radius * 0.62; p.z += ap * radius * 0.62;
  return p;
}

const fire = buildFireGraphPathways({ THREE, Vector3: THREE.Vector3, findEntry, getEntryCenter, cordPointAt, radius: modelRadius });
const midX = centers[0].x;
function check(name, def, decIdx) {
  const pts = def.buildPoints();
  const xs = pts.map(p => +(p.x - midX).toFixed(4));
  const finite = pts.every(p => [p.x,p.y,p.z].every(Number.isFinite));
  console.log(`\n${name}: points=${pts.length} finite=${finite}`);
  console.log(`  x rel. cord midline: ${xs.join(' ')}`);
  console.log(`  stations=${def.stations.length} kinds=${def.stations.map(s=>s.kind).join(',')}`);
  return { pts, xs };
}
const cst = check('CST', fire.cst);
console.log(`  CST starts right (x<0): ${cst.xs[0] < 0} · ends left cord (x>0): ${cst.xs.at(-1) > 0} · decussation pt near midline: ${Math.abs(cst.xs[5]) < 0.01}`);
const dcml = check('DCML', fire.dcml);
console.log(`  DCML cord pts left (x>0): ${dcml.xs[0]>0 && dcml.xs[2]>0} · ends right cortex (x<0): ${dcml.xs.at(-1)<0}`);
const posterior = dcml.pts[1].z < cordPointAt(0.55,0,0).z;
console.log(`  DCML cord point posterior to centre: ${posterior}`);
const stt = check('STT', fire.stt);
console.log(`  STT starts right (x<0): ${stt.xs[0]<0} · crossed by pt3 (x>0): ${stt.xs[2]>0} · ends left cortex (x>0): ${stt.xs.at(-1)>0}`);
const anterior = stt.pts[3].z > cordPointAt(0.5,0,0).z;
console.log(`  STT cord point anterior to centre: ${anterior}`);

// curve sanity
for (const [n, d] of Object.entries(fire)) {
  const curve = new THREE.CatmullRomCurve3(d.buildPoints(), false, 'catmullrom', 0.12);
  const sp = curve.getSpacedPoints(159);
  console.log(`${n} curve length=${curve.getLength().toFixed(3)}m spaced=${sp.length} ok=${sp.every(p=>[p.x,p.y,p.z].every(Number.isFinite))}`);
}
console.log('\nALL FIRE-0 GEOMETRY CHECKS DONE');

// --- Sprint 1D additions ---
const vision = fire.vision.buildPoints();
const nasal = fire.vision.extraCurves[0].buildPoints();
const meyer = fire.vision.extraCurves[1].buildPoints();
console.log(`\nVISION: main pts=${vision.length} nasal pts=${nasal.length} meyer pts=${meyer.length}`);
console.log(`  temporal stays left (all x>=mid-2mm): ${vision.every(p => p.x - midX > -0.002)}`);
console.log(`  nasal starts right (x<mid): ${nasal[0].x < midX} · joins left tract (x>mid): ${nasal.at(-1).x > midX}`);
console.log(`  meyer dips anterior+inferior then returns: dip z>${vision[3].z.toFixed(3)}? ${meyer[1].z > vision[3].z} · y lower: ${meyer[1].y < vision[3].y}`);
const pupMain = fire.pupillary.buildPoints();
const pupExtra = fire.pupillary.extraCurves[0].buildPoints();
console.log(`\nPUPILLARY: direct end left (x>mid): ${pupMain.at(-1).x > midX} · consensual end right (x<mid): ${pupExtra.at(-1).x < midX}`);
console.log(`  consensual starts at pretectal (same point): ${pupExtra[0].distanceTo(fire.pupillary.buildPoints()[4]) < 1e-6}`);
const refl = fire.reflex.buildPoints();
const cordC = cordPointAt(0.8, 0, 0);
console.log(`\nREFLEX: starts outside cord (>15mm lateral): ${(refl[0].x - cordC.x) > 0.015} · synapse pt inside cord radius: ${refl[3].distanceTo(cordC) < radius} · returns outside: ${(refl.at(-1).x - cordC.x) > 0.015}`);
for (const [n, d] of Object.entries(fire)) {
  const curve = new THREE.CatmullRomCurve3(d.buildPoints(), false, 'catmullrom', 0.12);
  const ok = curve.getSpacedPoints(50).every(p => [p.x,p.y,p.z].every(Number.isFinite));
  const extrasOk = (d.extraCurves||[]).every(e => new THREE.CatmullRomCurve3(e.buildPoints(), false, 'catmullrom', 0.12).getSpacedPoints(20).every(p => [p.x,p.y,p.z].every(Number.isFinite)));
  console.log(`${n}: curve finite=${ok} extras finite=${extrasOk} stations=${d.stations.length}`);
}
console.log('\nSPRINT 1D CHECKS DONE');
