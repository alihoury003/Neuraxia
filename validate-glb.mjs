#!/usr/bin/env node
/**
 * Load Neuraxia GLBs with the production Three.js stack (Node, no renderer).
 *
 * This catches loader/extension/metadata problems that a JSON-only audit
 * cannot: Meshopt decoding, KHR_mesh_quantization node transforms, geometry
 * attribute/index wiring, material assignment and extras propagation.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

function parseArgs(argv) {
  const files = [];
  let out = '';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out') {
      out = argv[++i] || '';
    } else {
      files.push(argv[i]);
    }
  }
  return { files, out };
}

function loadGLB(loader, bytes) {
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, '', resolve, reject);
  });
}

function boxToObject(box) {
  return {
    min: box.min.toArray(),
    max: box.max.toArray(),
    size: box.getSize(new THREE.Vector3()).toArray(),
    center: box.getCenter(new THREE.Vector3()).toArray(),
  };
}

async function validateFile(loader, file) {
  const bytes = await readFile(file);
  const started = performance.now();
  const gltf = await loadGLB(loader, bytes);
  const elapsedMs = performance.now() - started;

  gltf.scene.updateMatrixWorld(true);

  const meshes = [];
  const nodes = [];
  const errors = [];
  const categories = new Map();
  const materials = new Set();
  const globalBox = new THREE.Box3();
  let defaultVisibleTriangles = 0;
  let defaultVisibleVertices = 0;
  let sanitizedObjectNames = 0;

  gltf.scene.traverse((object) => {
    if (object !== gltf.scene) nodes.push(object);
    if (!object.isMesh) return;

    const geometry = object.geometry;
    const position = geometry?.getAttribute?.('position');
    const normal = geometry?.getAttribute?.('normal');
    const index = geometry?.getIndex?.();
    const extra = object.userData?.neuraxia;

    if (!position) errors.push(`${object.name}: missing POSITION attribute`);
    if (!normal) errors.push(`${object.name}: missing NORMAL attribute`);
    if (!index) errors.push(`${object.name}: missing index`);
    if (!extra) errors.push(`${object.name}: missing userData.neuraxia extras`);

    const vertices = position?.count || 0;
    const triangles = index ? Math.floor(index.count / 3) : 0;
    if (extra && Number(extra.output_vertices) !== vertices) {
      errors.push(`${object.name}: extras vertex count mismatch`);
    }
    if (extra && Number(extra.output_triangles) !== triangles) {
      errors.push(`${object.name}: extras triangle count mismatch`);
    }
    if (extra && extra.display_name !== object.name) {
      // Three's GLTFLoader intentionally sanitises Object3D names (spaces
      // become underscores). The product must therefore treat
      // extras.neuraxia.display_name—not Object3D.name—as canonical.
      const expectedSanitized = String(extra.display_name).replace(/\s+/g, '_');
      if (object.name === expectedSanitized) {
        sanitizedObjectNames += 1;
      } else {
        errors.push(`${object.name}: extras display_name mismatch`);
      }
    }

    const materialName = object.material?.name || '';
    materials.add(materialName);
    if (extra && materialName !== `neuraxia-${extra.category}`) {
      errors.push(`${object.name}: material ${materialName} does not match category ${extra.category}`);
    }

    const box = new THREE.Box3().setFromObject(object);
    if (!box.isEmpty()) globalBox.union(box);

    const category = extra?.category || 'unknown';
    const current = categories.get(category) || { concepts: 0, vertices: 0, triangles: 0 };
    current.concepts += 1;
    current.vertices += vertices;
    current.triangles += triangles;
    categories.set(category, current);

    if (extra?.default_visible) {
      defaultVisibleVertices += vertices;
      defaultVisibleTriangles += triangles;
    }

    meshes.push({
      object_name: object.name,
      display_name: extra?.display_name || object.name,
      concept_id: extra?.concept_id || '',
      category,
      side: extra?.side || '',
      default_visible: Boolean(extra?.default_visible),
      vertices,
      triangles,
      material: materialName,
      bounds: boxToObject(box),
      source_fj_ids: extra?.source_fj_ids || [],
    });
  });

  if (meshes.length !== 182) {
    errors.push(`expected 182 meshes, found ${meshes.length}`);
  }

  return {
    file,
    name: basename(file),
    bytes: bytes.byteLength,
    load_ms_node_no_gpu: Math.round(elapsedMs * 10) / 10,
    scene_name: gltf.scene.name,
    node_objects: nodes.length,
    meshes: meshes.length,
    vertices: meshes.reduce((sum, mesh) => sum + mesh.vertices, 0),
    triangles: meshes.reduce((sum, mesh) => sum + mesh.triangles, 0),
    default_visible_concepts: meshes.filter((mesh) => mesh.default_visible).length,
    sanitized_object_names: sanitizedObjectNames,
    default_visible_vertices: defaultVisibleVertices,
    default_visible_triangles: defaultVisibleTriangles,
    materials: [...materials].sort(),
    categories: Object.fromEntries([...categories.entries()].sort()),
    global_bounds_m: boxToObject(globalBox),
    errors,
    sample_meshes: meshes.slice(0, 5),
  };
}

const { files, out } = parseArgs(process.argv.slice(2));
if (!files.length) {
  console.error('Usage: node scripts/validate-glb.mjs [--out report.json] file.glb [...]');
  process.exit(2);
}

await MeshoptDecoder.ready;
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const results = [];
for (const file of files) {
  results.push(await validateFile(loader, file));
}

const report = {
  generated_by: 'app/scripts/validate-glb.mjs',
  three_revision: THREE.REVISION,
  meshopt_supported: MeshoptDecoder.supported,
  files: results,
};

console.log(JSON.stringify({
  three_revision: report.three_revision,
  meshopt_supported: report.meshopt_supported,
  files: results.map(({ name, bytes, load_ms_node_no_gpu, meshes, vertices, triangles, default_visible_concepts, sanitized_object_names, errors }) => ({
    name,
    bytes,
    load_ms_node_no_gpu,
    meshes,
    vertices,
    triangles,
    default_visible_concepts,
    sanitized_object_names,
    errors: errors.length,
  })),
}, null, 2));

if (out) {
  await writeFile(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${out}`);
}

const errorCount = results.reduce((sum, result) => sum + result.errors.length, 0);
process.exit(errorCount ? 1 : 0);
