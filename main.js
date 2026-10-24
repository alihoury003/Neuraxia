import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const canvas = document.querySelector('#scene');
const loaderEl = document.querySelector('#loader');
const loaderFill = document.querySelector('#loaderFill');
const loaderText = document.querySelector('#loaderText');
const searchInput = document.querySelector('#search');
const searchResults = document.querySelector('#searchResults');
const categoryHost = document.querySelector('#categoryToggles');
const explodeInput = document.querySelector('#explode');
const explodeValue = document.querySelector('#explodeValue');
const isolateInput = document.querySelector('#isolate');
const selectedName = document.querySelector('#selectedName');
const selectedMeta = document.querySelector('#selectedMeta');
const selectedStats = document.querySelector('#selectedStats');
const meshCountEl = document.querySelector('#meshCount');
const visibleCountEl = document.querySelector('#visibleCount');
const fpsEl = document.querySelector('#fps');
const livingModeInput = document.querySelector('#livingMode');
const captionKicker = document.querySelector('#captionKicker');
const captionText = document.querySelector('#captionText');
const datasetEyebrow = document.querySelector('#datasetEyebrow');
const datasetNote = document.querySelector('#datasetNote');
const modelSizeValue = document.querySelector('#modelSizeValue');
const modelSizeLabel = document.querySelector('#modelSizeLabel');
const sourceAttribution = document.querySelector('#sourceAttribution');
const ghostModeInput = document.querySelector('#ghostMode');
const dossierBody = document.querySelector('#dossierBody');
const optionalListEl = document.querySelector('#optionalList');
const optionalCountEl = document.querySelector('#optionalCount');
const pathwayInfoEl = document.querySelector('#pathwayInfo');
const drawCallsEl = document.querySelector('#drawCalls');
const triCountEl = document.querySelector('#triCount');
const loadTimeEl = document.querySelector('#loadTime');
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOAD_STARTED_AT = performance.now();

const urlParams = new URLSearchParams(location.search);
const DATASET_ID = urlParams.get('dataset') === 'spike' ? 'spike' : 'bp3d';
const IS_BP3D = DATASET_ID === 'bp3d';
const MODEL_PROFILE = ['desktop', 'mobile'].includes(urlParams.get('profile'))
  ? urlParams.get('profile')
  : (matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop');
const BASE_URL = import.meta.env.BASE_URL || '/';
const MODEL_URL = IS_BP3D
  ? `${BASE_URL}models/neuraxia-bp3d-cns-${MODEL_PROFILE}.meshopt.glb`
  : `${BASE_URL}models/nervous.glb`;
const MODEL_BYTES_LABEL = IS_BP3D
  ? (MODEL_PROFILE === 'mobile' ? '1.49 MB' : '2.32 MB')
  : '3.18 MB';
const QUALITY_MODE = ['auto', 'high'].includes(urlParams.get('quality')) ? urlParams.get('quality') : 'auto';
let slowWindows = 0;

datasetEyebrow.textContent = IS_BP3D
  ? 'SPRINT 1B · BODYPARTS3D CANDIDATE'
  : 'SPRINT 1 · TECHNICAL SPIKE';
datasetNote.textContent = IS_BP3D
  ? `182 curated BodyParts3D concepts · ${MODEL_PROFILE} Meshopt profile. Internal candidate pending licence confirmation and expert anatomy sign-off.`
  : 'Original 309-mesh Z-derived feasibility model, retained only for side-by-side comparison.';
modelSizeValue.textContent = MODEL_BYTES_LABEL;
modelSizeLabel.textContent = IS_BP3D ? `${MODEL_PROFILE} Meshopt GLB` : 'spike GLB';
sourceAttribution.textContent = IS_BP3D
  ? 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Sprint 1B internal candidate; licence-version confirmation and expert anatomy review remain release gates.'
  : 'Sprint 1 feasibility model: Body Atlas nervous.glb, derived from Z-Anatomy / BodyParts3D. Comparison only — not a production anatomy source.';
document.querySelectorAll('[data-dataset]').forEach(button => {
  button.setAttribute('aria-pressed', String(button.dataset.dataset === DATASET_ID));
});
if (prefersReducedMotion) livingModeInput.checked = false;

const CATEGORIES = [
  { id: 'cortex', label: 'Cortex', color: 0xd9a48e, css: '#d9a48e', default: true, opacity: 0.96, roughness: 0.62 },
  { id: 'deep', label: 'Deep nuclei', color: 0xe0a58e, css: '#e0a58e', default: true, opacity: 1, roughness: 0.58 },
  { id: 'white', label: 'White matter', color: 0xf0e6da, css: '#f0e6da', default: true, opacity: 0.94, roughness: 0.7 },
  { id: 'ventricles', label: 'Ventricles / CSF', color: 0x20d7e5, css: '#20d7e5', default: true, opacity: 0.48, roughness: 0.32 },
  { id: 'axis', label: 'Brainstem · cerebellum · cord', color: 0xc98d72, css: '#c98d72', default: true, opacity: 0.98, roughness: 0.64 },
  { id: 'cranial', label: 'Cranial nerves', color: 0xe8c39a, css: '#e8c39a', default: true, opacity: 0.98, roughness: 0.55 },
  { id: 'meninges', label: 'Meninges', color: 0xa98a7c, css: '#a98a7c', default: true, opacity: 0.24, roughness: 0.8 },
  { id: 'context', label: 'Context', color: 0xb7a69b, css: '#b7a69b', default: true, opacity: 0.92, roughness: 0.72 },
  { id: 'roots', label: 'Roots / ganglia', color: 0xbcae9e, css: '#bcae9e', default: false, opacity: 0.9, roughness: 0.7 },
  { id: 'peripheral', label: 'Peripheral / autonomic', color: 0x8d837a, css: '#8d837a', default: false, opacity: 0.82, roughness: 0.72 }
];
const categoryById = new Map(CATEGORIES.map(c => [c.id, c]));
const activeCategories = new Set(CATEGORIES.filter(c => c.default).map(c => c.id));
const manuallyEnabledCategories = new Set();

function prettifyMeshName(rawName) {
  return String(rawName || '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classify(rawName) {
  const n = rawName.toLowerCase();
  if (n.includes('spinal ganglia') || n.includes('anterior root of spinal') || n.includes('posterior root of spinal')) return 'roots';
  if (n.includes('falx') || n.includes('tentorium')) return 'meninges';
  if (n.includes('ventricle') || n.includes('aqueduct') || n.includes('interventricular') || n.includes('choroid')) return 'ventricles';
  if (n.includes('corpus callosum') || n.includes('internal capsule') || n.includes('fornix') || n.includes('commissure') || n.includes('septum pellucidum')) return 'white';
  if (['thalamus', 'mammillary', 'caudate', 'putamen', 'globus', 'hippocampus', 'amygdala', 'Hypothalamus', 'substantia nigra', 'red nucleus', 'subthalamic', 'deep cerebellar', 'inferior olive', 'accumbens', 'claustrum'].some(k => n.includes(k))) return 'deep';
  if (n.includes('brainstem') || n.includes('cerebellum') || n.includes('spinal cord') || n.includes('cauda equina')) return 'axis';
  if (n.includes('lobe') || n.includes('insula')) return 'cortex';
  if (['optic', 'olfactory', 'oculomotor', 'trochlear', 'trigeminal', 'abducens', 'facial nerve', 'vestibulocochlear', 'cochlear nerve', 'vestibular nerve', 'glossopharyngeal', 'vagus', 'accessory nerve', 'hypoglossal', 'maxillary', 'ophthalmic nerve', 'mandibular', 'lingual nerve', 'buccal nerve', 'inferior alveolar', 'mental nerve', 'mylohyoid', 'chorda tympani'].some(k => n.includes(k))) return 'cranial';
  return 'peripheral';
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070708, 0.028);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.01, 1000);
camera.position.set(4, 3, 7);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.autoRotate = !prefersReducedMotion;
controls.autoRotateSpeed = 0.42;
controls.minDistance = 0.2;
controls.maxDistance = 40;

scene.add(new THREE.HemisphereLight(0xf4efe8, 0x1b1210, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 3.2);
key.position.set(4, 6, 5);
scene.add(key);
const rim = new THREE.DirectionalLight(0xd9a48e, 1.7);
rim.position.set(-5, 2, -4);
scene.add(rim);
const signalLight = new THREE.PointLight(0x20d7e5, 0.7, 15);
signalLight.position.set(0, 1.6, 2);
scene.add(signalLight);

// Atmospheric dust / signal motes
let atmospherePoints;
{
  const count = 750;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 3 + Math.random() * 9;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 9;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xd9a48e, size: 0.018, transparent: true, opacity: 0.38, depthWrite: false });
  atmospherePoints = new THREE.Points(geo, mat);
  scene.add(atmospherePoints);
}

let model;
let entries = [];
let selected = null;
let modelCenter = new THREE.Vector3();
let modelRadius = 3;
let selectionBox;
let cameraAnimation = null;
let explodeTarget = 0;
let explodeCurrent = 0;
let journeyAnimation = null;
let lastAmbientBurst = 0;
const activeBursts = new Map();
const pathwayAnimations = [];
const pathwayGroup = new THREE.Group();
scene.add(pathwayGroup);
const sharedPulseGeometry = new THREE.SphereGeometry(1, 14, 10);
const sharedStationGeometry = new THREE.SphereGeometry(1, 12, 8);
const sharedDecussationGeometry = new THREE.OctahedronGeometry(1);
let cordFrame = null; // FIRE-0: BP3D cord centreline + radius (see computeCordFrame)
let fireGraph = null; // FIRE-0 graph definitions, built once entries exist

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerStart = null;

function categoryMaterial(category) {
  const def = categoryById.get(category);
  return new THREE.MeshStandardMaterial({
    color: def.color,
    roughness: def.roughness,
    metalness: 0.04,
    transparent: def.opacity < 1,
    opacity: def.opacity,
    emissive: 0x000000,
    emissiveIntensity: 0,
    side: THREE.DoubleSide
  });
}

function triangleCount(geometry) {
  if (geometry.index) return Math.floor(geometry.index.count / 3);
  return Math.floor((geometry.attributes.position?.count || 0) / 3);
}

function createCategoryToggles() {
  categoryHost.innerHTML = '';
  for (const def of CATEGORIES) {
    const count = entries.filter(e => e.category === def.id).length;
    if (!count) continue;
    const button = document.createElement('button');
    button.className = 'category-chip';
    button.type = 'button';
    button.style.setProperty('--chip-color', def.css);
    button.setAttribute('aria-pressed', String(activeCategories.has(def.id)));
    button.innerHTML = `<span class="dot"></span>${def.label} <span style="opacity:.62">${count}</span>`;
    button.addEventListener('click', () => {
      if (activeCategories.has(def.id)) {
        activeCategories.delete(def.id);
        manuallyEnabledCategories.delete(def.id);
      } else {
        activeCategories.add(def.id);
        manuallyEnabledCategories.add(def.id);
      }
      button.setAttribute('aria-pressed', String(activeCategories.has(def.id)));
      updateVisibility();
    });
    categoryHost.appendChild(button);
  }
}

/* ── Sprint 1C: dossiers, ghosting, presets, optional browser ─────── */

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function renderDossier(entry, def) {
  const d = getDossier(entry);
  if (d) {
    dossierBody.innerHTML = `
      <div class="dossier-block"><span class="dossier-label">What it does</span><p>${escapeHtml(d.fx)}</p></div>
      <div class="dossier-block pearl"><span class="dossier-label">Clinical pearl</span><p>${escapeHtml(d.pearl)}</p></div>
      <div class="dossier-block path"><span class="dossier-label">Pathway role</span><p>${escapeHtml(d.path)}</p></div>
      <span class="dossier-review">Teaching dossier · ${DOSSIER_REVIEW_STATE}</span>`;
  } else {
    const region = entry.neuraxia?.subregion ? ` (${entry.neuraxia.subregion})` : '';
    dossierBody.innerHTML = `
      <p class="dossier-missing">This ${escapeHtml(def.label.toLowerCase())} territory${escapeHtml(region)} is fully mapped, searchable and dissectible. Its curated teaching dossier — function, clinical pearl, pathway role and references — is in preparation for expert review.</p>
      <span class="dossier-review">Dossier · in preparation</span>`;
  }
}

function applyGhostMode() {
  const ghost = ghostModeInput.checked;
  for (const e of entries) {
    const m = e.mesh.material;
    const ghostable = e.category === 'cortex' || e.category === 'white' || e.category === 'context';
    if (ghost && ghostable) {
      m.transparent = true;
      m.opacity = 0.13;
      m.depthWrite = false;
    } else {
      m.opacity = e.baseOpacity;
      m.transparent = e.baseOpacity < 1;
      m.depthWrite = e.baseOpacity >= 0.9;
    }
    m.needsUpdate = true;
  }
}

const LAYER_PRESETS = {
  overview: { label: 'Overview', categories: null, ghost: false, caption: 'The whole neuraxis, assembled. Drag to orbit — every territory is live.' },
  deep: { label: 'Deep nuclei', categories: ['deep', 'white', 'axis', 'ventricles', 'cortex'], ghost: true, caption: 'X-ray mode: cortex ghosted so the deep nuclei — thalamus, basal ganglia, Hypothalamus — step forward.' },
  ventricles: { label: 'Ventricles / CSF', categories: ['ventricles', 'deep', 'axis'], ghost: false, caption: 'The CSF river system, isolated. Try “Enter ventricles” to travel it.' },
  white: { label: 'White matter', categories: ['white', 'deep', 'axis', 'cortex'], ghost: true, caption: 'Commissures, capsule and fornix — the wiring loom, with cortex ghosted away.' },
  cranial: { label: 'Cranial nerves', categories: ['cranial', 'axis', 'deep'], ghost: false, caption: 'Twelve cranial nerves against their brainstem. Zoom to the skull base and trace each trunk.' },
  cord: { label: 'Neuraxis', categories: ['axis', 'ventricles', 'deep'], ghost: false, caption: 'Brainstem, cerebellum and cord — the axis the FIRE pathways climb and descend. Ignite CST or DCML.' }
};

function applyLayerPreset(name) {
  const preset = LAYER_PRESETS[name] || LAYER_PRESETS.overview;
  activeCategories.clear();
  manuallyEnabledCategories.clear();
  const cats = preset.categories || CATEGORIES.filter(c => c.default).map(c => c.id);
  for (const id of cats) activeCategories.add(id);
  ghostModeInput.checked = Boolean(preset.ghost);
  document.querySelectorAll('[data-preset]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.preset === name)));
  createCategoryToggles();
  applyGhostMode();
  updateVisibility();
  setCaption(`LAYER · ${preset.label.toUpperCase()}`, preset.caption);
}

function renderOptionalList() {
  if (!optionalListEl) return;
  const optional = entries.filter(e => e.defaultVisible === false);
  optionalCountEl.textContent = optional.length ? `· ${optional.length}` : '';
  optionalListEl.innerHTML = '';
  if (!optional.length) {
    optionalListEl.innerHTML = '<span class="dossier-missing">No optional-layer structures in this dataset.</span>';
    return;
  }
  for (const e of optional) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e.name;
    if (e.revealed) b.classList.add('revealed');
    b.addEventListener('click', () => selectEntry(e));
    optionalListEl.appendChild(b);
  }
}

/* ── FIRE-0: spinal cord coordinate frame from the real mesh ───────── */

function computeCordFrame() {
  const entry = findEntry(/^Spinal cord$/i);
  if (!entry) return null;
  const pos = entry.mesh.geometry?.attributes?.position;
  if (!pos) return null;
  entry.mesh.updateWorldMatrix(true, false);
  const m = entry.mesh.matrixWorld;
  const v = new THREE.Vector3();
  const pts = [];
  const step = Math.max(1, Math.floor(pos.count / 5000));
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pos.count; i += step) {
    v.fromBufferAttribute(pos, i).applyMatrix4(m);
    pts.push([v.x, v.y, v.z]);
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  if (!pts.length || maxY <= minY) return null;
  const N = 28;
  const bins = Array.from({ length: N }, () => ({ n: 0, x: 0, y: 0, z: 0 }));
  for (const [x, y, z] of pts) {
    const b = Math.min(N - 1, Math.max(0, Math.floor(((y - minY) / (maxY - minY)) * N)));
    bins[b].n++; bins[b].x += x; bins[b].y += y; bins[b].z += z;
  }
  const centers = bins.filter(b => b.n > 0).map(b => new THREE.Vector3(b.x / b.n, b.y / b.n, b.z / b.n));
  centers.sort((a, b) => b.y - a.y); // top (cervical) → bottom (conus)
  // Radius: mean XZ distance from nearest bin centre (robust cord half-width).
  let rSum = 0, rCount = 0;
  for (const [x, y, z] of pts) {
    let best = null, bd = Infinity;
    for (const c of centers) { const d = Math.abs(c.y - y); if (d < bd) { bd = d; best = c; } }
    if (best) { rSum += Math.hypot(x - best.x, z - best.z); rCount++; }
  }
  const radius = rCount ? (rSum / rCount) * 1.35 : modelRadius * 0.02;
  return { entry, centers, radius, minY, maxY };
}

/** t: 0 = cord top, 1 = conus. lateral: +1 subject-left edge. ap: +1 anterior edge. */
function cordPointAt(t, lateral = 0, ap = 0) {
  if (!cordFrame) return new THREE.Vector3(modelCenter.x, modelCenter.y, modelCenter.z);
  const { centers, radius, entry } = cordFrame;
  const f = THREE.MathUtils.clamp(t, 0, 1) * (centers.length - 1);
  const i0 = Math.floor(f), i1 = Math.min(centers.length - 1, i0 + 1);
  const p = centers[i0].clone().lerp(centers[i1], f - i0);
  // Follow the cord mesh if the learner has disassembled the model.
  p.add(entry.mesh.position.clone().sub(entry.origin));
  p.x += lateral * radius * 0.62;
  p.z += ap * radius * 0.62;
  return p;
}

function updateVisibility() {
  let visible = 0;
  for (const e of entries) {
    const inCategory = activeCategories.has(e.category)
      && (e.defaultVisible !== false || e.revealed || manuallyEnabledCategories.has(e.category));
    e.mesh.visible = isolateInput.checked && selected ? e.mesh === selected.mesh : inCategory;
    if (e.mesh.visible) visible++;
  }
  visibleCountEl.textContent = String(visible);
  if (selectionBox) selectionBox.visible = Boolean(selected?.mesh.visible);
}

function applyExplode(value) {
  explodeCurrent = THREE.MathUtils.clamp(value, 0, 1);
  for (const e of entries) {
    e.mesh.position.copy(e.origin).addScaledVector(e.explodeOffset, explodeCurrent);
  }
  if (selected && selectionBox) selectionBox.setFromObject(selected.mesh);
}

function updateExplode(value = Number(explodeInput.value) / 100) {
  explodeTarget = THREE.MathUtils.clamp(value, 0, 1);
  explodeValue.textContent = `${Math.round(explodeTarget * 100)}%`;
  if (prefersReducedMotion) applyExplode(explodeTarget);
}

function animateCamera(toPosition, toTarget, duration = 950) {
  cameraAnimation = {
    start: performance.now(),
    duration,
    fromPosition: camera.position.clone(),
    toPosition: toPosition.clone(),
    fromTarget: controls.target.clone(),
    toTarget: toTarget.clone()
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function focusEntry(entry) {
  const box = new THREE.Box3().setFromObject(entry.mesh);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const direction = camera.position.clone().sub(controls.target).normalize();
  if (direction.lengthSq() < 0.01) direction.set(1, 0.45, 1.4).normalize();
  const distance = Math.max(sphere.radius * 5.2, modelRadius * 0.38, 0.7);
  animateCamera(center.clone().addScaledVector(direction, distance), center, 920);
}

function clearSelectionHighlight() {
  if (!selected) return;
  selected.mesh.material.emissive.setHex(0x000000);
  selected.mesh.material.emissiveIntensity = 0;
}

function selectEntry(entry, { focus = true } = {}) {
  clearSelectionHighlight();
  selected = entry;
  if (!entry) {
    selectedName.textContent = 'Enter the neuraxis';
    selectedMeta.textContent = 'Drag to orbit. Scroll to zoom. Click any glowing structure — or search by name.';
    selectedStats.innerHTML = '';
    if (selectionBox) selectionBox.visible = false;
    updateVisibility();
    return;
  }

  entry.mesh.material.emissive.setHex(0x20d7e5);
  entry.mesh.material.emissiveIntensity = 0.46;

  if (!selectionBox) {
    selectionBox = new THREE.BoxHelper(undefined, 0x20d7e5);
    selectionBox.material.transparent = true;
    selectionBox.material.opacity = 0.72;
    scene.add(selectionBox);
  }
  selectionBox.setFromObject(entry.mesh);
  selectionBox.visible = true;

  const def = categoryById.get(entry.category);
  selectedName.textContent = entry.name;
  if (entry.neuraxia) {
    const x = entry.neuraxia;
    const region = [x.subregion, x.side].filter(Boolean).join(' · ');
    const flags = Array.isArray(x.quality_flags) && x.quality_flags.length
      ? ` Quality flags: ${x.quality_flags.join(', ')}.`
      : '';
    selectedMeta.textContent = `${def.label}${region ? ` · ${region}` : ''} · BodyParts3D concept ${x.concept_id}, built from ${x.source_fj_ids?.join(' + ') || 'recorded FJ components'}.${flags}`;
    selectedStats.innerHTML = `
      <span>${entry.triangles.toLocaleString()} profile triangles</span>
      <span>${Number(x.source_triangles || 0).toLocaleString()} source triangles</span>
      <span>${x.source_fj_ids?.join(' + ') || x.concept_id}</span>
      <span>${x.default_visible ? 'default layer' : 'optional layer'}</span>`;
  } else {
    selectedMeta.textContent = `${def.label} · Sprint 1 spike mesh retained for comparison; production curation now lives in the BodyParts3D 1B candidate.`;
    selectedStats.innerHTML = `
      <span>${entry.triangles.toLocaleString()} triangles</span>
      <span>mesh #${entry.index + 1}</span>
      <span>${entry.category}</span>`;
  }

  renderDossier(entry, def);

  entry.revealed = true;
  renderOptionalList();
  if (!activeCategories.has(entry.category)) {
    activeCategories.add(entry.category);
    manuallyEnabledCategories.add(entry.category);
    createCategoryToggles();
  }
  updateVisibility();
  if (focus) focusEntry(entry);
}

function renderSearch() {
  const q = searchInput.value.trim().toLowerCase();
  searchResults.innerHTML = '';
  if (q.length < 2) return;
  const hits = entries.filter(e => {
    const searchable = [e.name, e.neuraxia?.concept_id, ...(e.neuraxia?.source_fj_ids || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchable.includes(q);
  }).slice(0, 9);
  for (const e of hits) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = e.defaultVisible === false ? `${e.name} · optional` : e.name;
    button.addEventListener('click', () => {
      searchInput.value = e.name;
      searchResults.innerHTML = '';
      selectEntry(e);
    });
    searchResults.appendChild(button);
  }
  if (!hits.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:#aaa39d;font-size:.84rem;padding:4px 2px;';
    empty.textContent = 'No named mesh matches that search in the loaded dataset.';
    searchResults.appendChild(empty);
  }
}

function setView(name) {
  const distance = modelRadius * 3.2;
  const vectors = {
    front: new THREE.Vector3(0, 0.16, 1),
    side: new THREE.Vector3(1, 0.16, 0.08),
    top: new THREE.Vector3(0.02, 1, 0.08),
    reset: new THREE.Vector3(0.72, 0.36, 1)
  };
  const v = (vectors[name] || vectors.reset).normalize();
  animateCamera(modelCenter.clone().addScaledVector(v, distance), modelCenter.clone(), 1000);
}

function setCaption(kicker, text) {
  captionKicker.textContent = kicker;
  captionText.textContent = text;
}

function findEntry(pattern) {
  return entries.find(e => pattern.test(e.name));
}

function getEntryCenter(entry) {
  entry.mesh.updateWorldMatrix(true, false);
  return entry.mesh.localToWorld(entry.localCenter.clone());
}

function triggerBurst(entry, { duration = 1500, strength = 1, color = 0x20d7e5 } = {}) {
  if (!entry) return;
  activeBursts.set(entry, { start: performance.now(), duration, strength, color });
}

function ensureEntriesVisible(sequence) {
  let changed = false;
  for (const e of sequence) {
    if (!e) continue;
    e.revealed = true;
    if (!activeCategories.has(e.category)) {
      activeCategories.add(e.category);
      manuallyEnabledCategories.add(e.category);
      changed = true;
    }
  }
  if (changed) createCategoryToggles();
  updateVisibility();
}

function buildPathCurve(sequence, lateralOffset = 0) {
  const points = sequence.map((entry, i) => {
    const p = getEntryCenter(entry);
    if (lateralOffset && i > 0 && i < sequence.length - 1) p.x += lateralOffset;
    return p;
  });
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.18);
}

/** Resolve any pathway definition (legacy sequence or FIRE-0 graph) to a curve. */
function resolvePathCurve(definition) {
  if (definition.kind === 'graph' && typeof definition.buildPoints === 'function') {
    return new THREE.CatmullRomCurve3(definition.buildPoints(), false, 'catmullrom', 0.12);
  }
  return buildPathCurve(definition.sequence, (definition.lateralOffset || 0) * modelRadius);
}

/** Normalise stations: legacy sequences become evenly spaced station events. */
function resolveStations(definition) {
  if (definition.kind === 'graph') {
    return definition.stations.map(s => ({
      ...s,
      getPoint: curve => curve.getPoint(THREE.MathUtils.clamp(s.at, 0, 1)),
    }));
  }
  const seq = definition.sequence;
  return seq.map((entry, i) => ({
    at: seq.length === 1 ? 0 : i / (seq.length - 1),
    kind: i === 0 ? 'origin' : (i === seq.length - 1 ? 'target' : 'station'),
    label: entry.name,
    entry,
    caption: definition.captions?.[i],
    getPoint: () => getEntryCenter(entry),
  }));
}

function stationMarkerStyle(kind, baseColor) {
  if (kind === 'decussation') return { geometry: sharedDecussationGeometry, color: 0xffd9a8, scale: 1.5 };
  if (kind === 'synapse') return { geometry: sharedStationGeometry, color: 0xeafcff, scale: 1.35 };
  return { geometry: sharedStationGeometry, color: baseColor, scale: 1 };
}

function renderFireInfo(definition) {
  if (!pathwayInfoEl || definition.kind !== 'graph') return null;
  const items = definition.stations.map(s =>
    `<li data-kind="${escapeHtml(s.kind)}">${escapeHtml(s.label)}</li>`).join('');
  pathwayInfoEl.innerHTML = `
    <h4>${escapeHtml(definition.label)}</h4>
    <p class="chain">${escapeHtml(definition.chain)}</p>
    <p class="crossing">${escapeHtml(definition.crossing)}</p>
    <ol>${items}</ol>
    <p class="src-note">${escapeHtml(FIRE_SOURCE_NOTE)}</p>`;
  return [...pathwayInfoEl.querySelectorAll('li')];
}

function createPathway(definition, delay = 0) {
  const isGraph = definition.kind === 'graph';
  const sequence = isGraph
    ? (definition.entries || []).filter(Boolean)
    : definition.sequence.filter(Boolean);
  if (isGraph ? sequence.length < 2 || !cordFrame : sequence.length < 2) {
    setCaption('PATHWAY OFFLINE', `The loaded model does not contain enough named stations for ${definition.label}.`);
    return;
  }
  ensureEntriesVisible(sequence);
  const stations = resolveStations({ ...definition, sequence });
  definition = { ...definition, sequence, stations };

  const group = new THREE.Group();
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(160 * 3);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: definition.color,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    depthTest: false
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  line.frustumCulled = false;
  line.renderOrder = 20;
  group.add(line);

  const markers = sequence.map(() => {
    const marker = new THREE.Mesh(
      sharedStationGeometry,
      new THREE.MeshBasicMaterial({ color: definition.color, transparent: true, opacity: 0.86, depthWrite: false, depthTest: false })
    );
    marker.renderOrder = 21;
    marker.scale.setScalar(Math.max(modelRadius * 0.012, 0.004));
    group.add(marker);
    return marker;
  });

  const pulses = Array.from({ length: 14 }, (_, j) => {
    const pulse = new THREE.Mesh(
      sharedPulseGeometry,
      new THREE.MeshBasicMaterial({ color: definition.color, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false })
    );
    pulse.renderOrder = 22;
    pulse.scale.setScalar(Math.max(modelRadius * 0.02 * (1 - j * 0.045), 0.003));
    group.add(pulse);
    return pulse;
  });

  pathwayGroup.add(group);
  const infoItems = isGraph ? renderFireInfo(definition) : null;
  pathwayAnimations.push({
    ...definition,
    sequence,
    stations,
    infoItems,
    group,
    line,
    linePositions,
    extraLines,
    markers,
    pulses,
    start: performance.now() + delay,
    triggered: new Set()
  });
  setCaption(definition.kicker, definition.intro);
}

function pathwayDefinitions() {
  const visual = {
    key: 'visual',
    label: 'visual pathway',
    kicker: 'IGNITE · VISION',
    intro: 'A signal leaves the optic nerve and races toward the occipital cortex.',
    color: 0x20d7e5,
    duration: 6200,
    lateralOffset: 0,
    sequence: [
      findEntry(/^Left optic nerve/i),
      findEntry(/^Optic chiasm$/i),
      findEntry(/^Left optic tract$/i),
      IS_BP3D ? findEntry(/^Left lateral geniculate body$/i) : findEntry(/^Left thalamus$/i),
      IS_BP3D ? findEntry(/^Left cuneus$/i) : findEntry(/^Left occipital lobe$/i)
    ],
    captions: [
      'The journey begins in the left optic nerve.',
      'Fibres converge at the optic chiasm — the great visual crossing.',
      'The signal continues through the optic tract.',
      IS_BP3D ? 'The lateral geniculate body receives the visual message.' : 'Thalamic relay territory receives the visual message.',
      IS_BP3D ? 'Arrival territory: cuneus above the calcarine visual cortex.' : 'Arrival: occipital cortex. Light becomes perception.'
    ]
  };

  const motor = {
    key: 'motor',
    label: 'motor pathway',
    kicker: 'IGNITE · MOVEMENT',
    intro: 'A voluntary motor command dives from frontal cortex toward the cord.',
    color: 0xffb199,
    duration: 6400,
    lateralOffset: 0,
    sequence: IS_BP3D ? [
      findEntry(/^Right precentral gyrus$/i),
      findEntry(/^Right internal capsule$/i),
      findEntry(/^Right cerebral crus$/i),
      findEntry(/^Pons$/i),
      findEntry(/^Medulla oblongata$/i),
      findEntry(/^Spinal cord$/i)
    ] : [
      findEntry(/^Right frontal lobe$/i),
      findEntry(/^Right internal capsule$/i),
      findEntry(/^Brainstem$/i),
      findEntry(/^Spinal cord$/i),
      findEntry(/^Cauda equina$/i)
    ],
    captions: IS_BP3D ? [
      'A motor command ignites in the right precentral gyrus.',
      'Axons funnel through the internal capsule.',
      'The command enters the cerebral crus.',
      'It descends through the pons.',
      'Medulla: pyramidal-decussation territory approaches.',
      'Now travelling the spinal cord — the neuraxis in motion.'
    ] : [
      'A motor command ignites in frontal cortex.',
      'Axons funnel through the internal capsule.',
      'The command descends through the brainstem.',
      'Now travelling the spinal cord — the neuraxis in motion.',
      'The descending journey reaches the cauda equina territory.'
    ]
  };

  const dorsal = {
    key: 'dorsal',
    label: 'dorsal-column pathway',
    kicker: 'RACE · FINE TOUCH',
    intro: 'Cyan carries fine touch and proprioception upward.',
    color: 0x20d7e5,
    duration: 7000,
    lateralOffset: -0.018,
    sequence: [
      findEntry(/^Cauda equina$/i),
      findEntry(/^Spinal cord$/i),
      IS_BP3D ? findEntry(/^Medulla oblongata$/i) : findEntry(/^Brainstem$/i),
      findEntry(/^Right thalamus$/i),
      IS_BP3D ? findEntry(/^Right postcentral gyrus$/i) : findEntry(/^Right parietal lobe$/i)
    ],
    captions: [
      'Fine-touch information enters the neuraxis.',
      'It climbs the cord before its medullary crossing.',
      IS_BP3D ? 'Medullary relay territory — the crossing zone approaches.' : 'Brainstem relay territory — the crossing zone approaches.',
      'Thalamus receives the ascending message.',
      IS_BP3D ? 'Postcentral gyrus: position, vibration and discriminative touch.' : 'Parietal cortex: position, vibration and discriminative touch.'
    ]
  };

  const pain = {
    key: 'pain',
    label: 'spinothalamic pathway',
    kicker: 'RACE · PAIN & TEMPERATURE',
    intro: 'Rose carries pain and temperature on a contrasting route.',
    color: 0xff7a90,
    duration: 7000,
    lateralOffset: 0.018,
    sequence: dorsal.sequence,
    captions: [
      'Pain and temperature enter the cord.',
      'This pathway crosses near its spinal entry level.',
      'It ascends through the brainstem on the opposite side.',
      'Thalamus receives the warning signal.',
      IS_BP3D ? 'Postcentral cortex: the body localises the warning signal.' : 'Parietal cortex: the body becomes aware of pain.'
    ]
  };

  return { visual, motor, dorsal, pain };
}

function ignitePathway(key) {
  if (!entries.length) return;
  controls.autoRotate = false;
  const defs = pathwayDefinitions();

  if (key === 'visual' && IS_BP3D && fireGraph) key = 'vision';

  // FIRE graph pathways (BP3D dataset with a computed cord frame).
  if (['cst', 'dcml', 'stt', 'race', 'vision', 'pupillary', 'reflex'].includes(key)) {
    if (IS_BP3D && fireGraph) {
      if (key === 'race') {
        setCaption('RACE OF THE DECUSSATIONS', 'Cyan fine touch crosses in the medulla. Rose pain crosses at its cord level. Same cord — opposite logic. That contrast localises lesions.');
        createPathway(fireGraph.dcml, 0);
        createPathway(fireGraph.stt, 420);
        return;
      }
      if (key === 'reflex') {
        const target = cordPointAt(0.8, 1.2, 0.4);
        animateCamera(target.clone().add(new THREE.Vector3(modelRadius * 0.34, modelRadius * 0.08, modelRadius * 0.5)), target, 1100);
      }
      createPathway(fireGraph[key], 0);
      return;
    }
    // Spike fallback: nearest legacy schematic.
    const fallback = { cst: 'motor', dcml: 'dorsal', stt: 'pain', race: 'sensory', vision: 'visual', pupillary: 'visual', reflex: 'motor' }[key];
    setCaption('FIRE-0 NEEDS THE BP3D DATASET', 'The cord-centreline pathway graph runs on the BodyParts3D candidate. Showing the Sprint 1 schematic equivalent instead.');
    key = fallback;
  }

  if (key === 'sensory') {
    setCaption('RACE OF THE DECUSSATIONS', 'Two sensory signals climb together — but their crossing stories are different.');
    createPathway(defs.dorsal, 0);
    createPathway(defs.pain, 380);
    return;
  }
  if (defs[key]) createPathway(defs[key], 0);
}

function disposePathway(animation) {
  pathwayGroup.remove(animation.group);
  animation.line.geometry.dispose();
  animation.line.material.dispose();
  for (const extra of animation.extraLines || []) {
    extra.line.geometry.dispose();
    extra.line.material.dispose();
  }
  for (const marker of animation.markers) marker.material.dispose();
  for (const pulse of animation.pulses) pulse.material.dispose();
}

function updatePathways(now) {
  let newestHead = null;
  for (let ai = pathwayAnimations.length - 1; ai >= 0; ai--) {
    const a = pathwayAnimations[ai];
    const elapsed = now - a.start;
    if (elapsed < 0) {
      a.group.visible = false;
      continue;
    }
    a.group.visible = true;
    const progress = THREE.MathUtils.clamp(elapsed / a.duration, 0, 1);
    const curve = buildPathCurve(a.sequence, a.lateralOffset * modelRadius);
    const pts = curve.getSpacedPoints(159);
    for (let i = 0; i < pts.length; i++) {
      a.linePositions[i * 3] = pts[i].x;
      a.linePositions[i * 3 + 1] = pts[i].y;
      a.linePositions[i * 3 + 2] = pts[i].z;
    }
    a.line.geometry.attributes.position.needsUpdate = true;

    const fade = progress < 0.08 ? progress / 0.08 : progress > 0.88 ? (1 - progress) / 0.12 : 1;
    a.line.material.opacity = 0.78 * fade;

    (a.stations || []).forEach((station, i) => {
      const threshold = station.at;
      const marker = a.markers[i];
      if (!marker) return;
      marker.position.copy(station.getPoint(curve));
      if (station.kind === 'decussation') marker.rotation.y = now * 0.003;
      const activated = progress >= threshold;
      const pulseScale = activated ? 1.45 + Math.sin(now * 0.012 + i) * 0.18 : 0.85;
      marker.scale.setScalar(Math.max(modelRadius * 0.012 * (marker.userData.stationScale || 1) * pulseScale, 0.003));
      marker.material.opacity = (activated ? 0.96 : 0.38) * fade;
      if (activated && !a.triggered.has(i)) {
        a.triggered.add(i);
        if (station.entry) {
          triggerBurst(station.entry, {
            duration: station.kind === 'synapse' || station.kind === 'decussation' ? 2300 : 1700,
            strength: station.kind === 'synapse' || station.kind === 'decussation' ? 1.45 : 1.15,
            color: station.kind === 'decussation' ? 0xffd9a8 : a.color,
          });
        }
        if (station.caption) setCaption(a.kicker, station.caption);
        const li = a.infoItems?.[i];
        if (li) {
          li.classList.add('lit');
          if (station.kind === 'decussation') li.classList.add('lit-dec');
          if (station.kind === 'synapse') li.classList.add('lit-syn');
        }
      }
    });

    a.pulses.forEach((pulse, j) => {
      const t = progress - j * 0.013;
      pulse.visible = t >= 0 && t <= 1;
      if (!pulse.visible) return;
      pulse.position.copy(curve.getPoint(t));
      pulse.material.opacity = Math.max(0, (0.98 - j * 0.065)) * fade;
      if (j === 0) newestHead = pulse.position.clone();
    });

    if (progress >= 1) {
      disposePathway(a);
      pathwayAnimations.splice(ai, 1);
    }
  }
  return newestHead;
}

function updateAmbientLife(now) {
  const living = livingModeInput.checked;
  if (living && entries.length && now - lastAmbientBurst > 850) {
    lastAmbientBurst = now;
    const candidates = entries.filter(e => e.mesh.visible && ['cortex', 'deep', 'white', 'axis', 'cranial'].includes(e.category));
    for (let i = 0; i < 2 && candidates.length; i++) {
      const entry = candidates[Math.floor(Math.random() * candidates.length)];
      triggerBurst(entry, {
        duration: 1250 + Math.random() * 900,
        strength: 0.48 + Math.random() * 0.38,
        color: entry.category === 'ventricles' ? 0x20d7e5 : 0xd9a48e
      });
    }
  }

  for (const e of entries) {
    let intensity = 0;
    let color = categoryById.get(e.category)?.color || 0xd9a48e;
    if (living && e.mesh.visible) {
      const wave = Math.sin(now * 0.00125 + e.phase + e.center.y * 4.5) * 0.5 + 0.5;
      if (['cortex', 'deep', 'white', 'axis'].includes(e.category)) intensity += Math.pow(wave, 10) * 0.17;
      if (e.category === 'ventricles') {
        intensity += 0.12 + wave * 0.24;
        color = 0x20d7e5;
        e.mesh.material.opacity = e.baseOpacity + Math.sin(now * 0.0016 + e.phase) * 0.08;
      }
      if (e.category === 'cranial') intensity += Math.pow(wave, 14) * 0.2;
    } else if (e.category === 'ventricles') {
      e.mesh.material.opacity = e.baseOpacity;
    }

    const burst = activeBursts.get(e);
    if (burst) {
      const p = (now - burst.start) / burst.duration;
      if (p >= 1) activeBursts.delete(e);
      else {
        intensity += Math.sin(Math.PI * THREE.MathUtils.clamp(p, 0, 1)) * 0.82 * burst.strength;
        color = burst.color;
      }
    }

    if (selected?.mesh === e.mesh) {
      color = 0x20d7e5;
      intensity = Math.max(intensity, 0.5);
    }
    e.mesh.material.emissive.setHex(color);
    e.mesh.material.emissiveIntensity = intensity;
  }

  if (atmospherePoints && living) atmospherePoints.rotation.y += 0.00038;
}

function startVentricularJourney() {
  if (!entries.length || journeyAnimation) return;
  const sequence = [
    findEntry(/^Left lateral ventricle$/i),
    findEntry(/^Interventricular foramen$/i),
    findEntry(/^Third ventricle$/i),
    findEntry(/^Cerebral aqueduct$/i),
    findEntry(/^Fourth ventricle$/i),
    IS_BP3D ? findEntry(/^Medulla oblongata$/i) : findEntry(/^Brainstem$/i)
  ].filter(Boolean);
  if (sequence.length < 4) {
    setCaption('JOURNEY OFFLINE', 'The loaded model does not contain enough ventricular stations for this voyage.');
    return;
  }

  explodeInput.value = 0;
  updateExplode(0);
  isolateInput.checked = false;
  ensureEntriesVisible(sequence);
  controls.autoRotate = false;
  controls.enabled = false;
  cameraAnimation = null;
  journeyAnimation = {
    start: performance.now() + 350,
    duration: 15000,
    sequence,
    triggered: new Set(),
    captions: [
      'We enter the lateral ventricle — a CSF-filled cavern inside the hemisphere.',
      'Through the interventricular foramen: the doorway between ventricles.',
      'Inside the third ventricle, suspended between the thalami.',
      'The cerebral aqueduct narrows into a luminous channel.',
      'The fourth ventricle opens above the brainstem.',
      'We emerge along the brainstem. The voyage becomes anatomy again.'
    ]
  };
  setCaption('ENTER · VENTRICULAR VOYAGE', 'Hold on. Neuraxia is taking you inside the CSF pathways.');
}

function updateJourney(now) {
  if (!journeyAnimation) return;
  const elapsed = now - journeyAnimation.start;
  if (elapsed < 0) return;
  const raw = THREE.MathUtils.clamp(elapsed / journeyAnimation.duration, 0, 1);
  const t = raw * raw * (3 - 2 * raw);
  const centers = journeyAnimation.sequence.map(getEntryCenter);
  const start = centers[0].clone().add(new THREE.Vector3(modelRadius * 0.22, modelRadius * 0.08, modelRadius * 0.34));
  const end = centers[centers.length - 1].clone().add(new THREE.Vector3(modelRadius * 0.1, -modelRadius * 0.05, -modelRadius * 0.22));
  const curve = new THREE.CatmullRomCurve3([start, ...centers, end], false, 'catmullrom', 0.16);
  camera.position.copy(curve.getPoint(t));
  controls.target.copy(curve.getPoint(Math.min(1, t + 0.045)));
  camera.lookAt(controls.target);
  signalLight.position.copy(camera.position);

  journeyAnimation.sequence.forEach((entry, i) => {
    const threshold = (i + 1) / (journeyAnimation.sequence.length + 1);
    if (t >= threshold && !journeyAnimation.triggered.has(i)) {
      journeyAnimation.triggered.add(i);
      triggerBurst(entry, { duration: 2100, strength: 1.2, color: 0x20d7e5 });
      if (journeyAnimation.captions[i]) setCaption('ENTER · VENTRICULAR VOYAGE', journeyAnimation.captions[i]);
    }
  });

  if (raw >= 1) {
    const destination = journeyAnimation.sequence.at(-2) || journeyAnimation.sequence.at(-1);
    journeyAnimation = null;
    controls.enabled = true;
    if (destination) selectEntry(destination, { focus: false });
    setCaption('VOYAGE COMPLETE', 'You have travelled the ventricular route. Orbit freely, ignite a pathway, or enter again.');
    animateCamera(
      modelCenter.clone().add(new THREE.Vector3(modelRadius * 1.35, modelRadius * 0.5, modelRadius * 1.8)),
      modelCenter.clone(),
      1500
    );
  }
}

function awakenNeuraxia() {
  if (!entries.length) return;
  livingModeInput.checked = true;
  controls.autoRotate = !prefersReducedMotion;
  setView('reset');
  explodeInput.value = 42;
  updateExplode(0.42);
  setCaption('NEURAXIA AWAKENS', 'Territories separate, signals ignite, and the neuraxis comes alive.');
  setTimeout(() => ignitePathway('visual'), 650);
  setTimeout(() => ignitePathway('sensory'), 2100);
  setTimeout(() => {
    explodeInput.value = 0;
    updateExplode(0);
  }, 3300);
  setTimeout(() => ignitePathway('motor'), 4200);
}

function prepareModel(gltf) {
  model = gltf.scene;
  scene.add(model);
  model.updateMatrixWorld(true);

  const wholeBox = new THREE.Box3().setFromObject(model);
  const wholeSphere = wholeBox.getBoundingSphere(new THREE.Sphere());

  entries = [];
  let index = 0;
  model.traverse(obj => {
    if (!obj.isMesh) return;
    const neuraxia = obj.userData?.neuraxia || null;
    const name = neuraxia?.display_name || prettifyMeshName(obj.name) || `Mesh ${index + 1}`;
    const category = neuraxia?.category && categoryById.has(neuraxia.category)
      ? neuraxia.category
      : classify(name);
    obj.material = categoryMaterial(category);
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.geometry.computeBoundingBox();
    obj.geometry.computeBoundingSphere();
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const localCenter = obj.geometry.boundingBox.getCenter(new THREE.Vector3());
    entries.push({
      index,
      mesh: obj,
      name,
      category,
      neuraxia,
      defaultVisible: neuraxia ? Boolean(neuraxia.default_visible) : Boolean(categoryById.get(category)?.default),
      revealed: false,
      triangles: triangleCount(obj.geometry),
      center,
      localCenter,
      origin: obj.position.clone(),
      explodeOffset: new THREE.Vector3(),
      phase: Math.random() * Math.PI * 2,
      baseOpacity: obj.material.opacity
    });
    index++;
  });

  const defaultEntries = entries.filter(e => e.defaultVisible && activeCategories.has(e.category));
  const cnsBox = new THREE.Box3();
  for (const e of defaultEntries) cnsBox.expandByObject(e.mesh);
  const cnsSphere = cnsBox.getBoundingSphere(new THREE.Sphere());
  modelCenter.copy(cnsSphere.center);
  modelRadius = Math.max(cnsSphere.radius, 0.001);

  for (const e of entries) {
    const horizontal = new THREE.Vector3(e.center.x - modelCenter.x, 0, e.center.z - modelCenter.z);
    if (horizontal.length() < modelRadius * 0.025) {
      const angle = (e.index * 2.399963) % (Math.PI * 2);
      horizontal.set(Math.cos(angle), 0, Math.sin(angle));
    }
    horizontal.normalize();
    const vertical = THREE.MathUtils.clamp((e.center.y - modelCenter.y) / modelRadius, -1, 1);
    e.explodeOffset.copy(horizontal.multiplyScalar(modelRadius * 0.34));
    e.explodeOffset.y = vertical * modelRadius * 0.28;
  }

  controls.target.copy(modelCenter);
  camera.near = Math.max(modelRadius / 500, 0.001);
  camera.far = Math.max(wholeSphere.radius * 30, 100);
  camera.updateProjectionMatrix();
  camera.position.copy(modelCenter).add(new THREE.Vector3(modelRadius * 1.55, modelRadius * 0.72, modelRadius * 2.35));

  meshCountEl.textContent = IS_BP3D
    ? `${entries.length} curated concepts · ${MODEL_PROFILE}`
    : `${entries.length} named spike meshes`;
  loadTimeEl.textContent = `${((performance.now() - LOAD_STARTED_AT) / 1000).toFixed(1)}s`;

  // FIRE-0 foundations: real cord centreline + pathway graph (BP3D only).
  cordFrame = IS_BP3D ? computeCordFrame() : null;
  fireGraph = cordFrame
    ? buildFireGraphPathways({ THREE, Vector3: THREE.Vector3, findEntry, getEntryCenter, cordPointAt, radius: modelRadius })
    : null;

  createCategoryToggles();
  renderOptionalList();
  applyGhostMode();
  updateVisibility();
  updateExplode(0);

  const preferred = entries.find(e => /left thalamus/i.test(e.name)) || defaultEntries[0];
  if (preferred) selectEntry(preferred, { focus: false });
  animateCamera(
    modelCenter.clone().add(new THREE.Vector3(modelRadius * 1.15, modelRadius * 0.45, modelRadius * 1.9)),
    modelCenter.clone(),
    1600
  );
  if (livingModeInput.checked && !prefersReducedMotion) {
    setTimeout(() => ignitePathway('visual'), 950);
  } else {
    setCaption('LIVING NEURAXIS', 'Enable ambient activity, then press Awaken Neuraxia to ignite the circuits.');
  }
}

const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
gltfLoader.load(
  MODEL_URL,
  gltf => {
    try {
      prepareModel(gltf);
      loaderFill.style.width = '100%';
      loaderText.textContent = 'Territory ready.';
      setTimeout(() => loaderEl.classList.add('done'), 350);
    } catch (err) {
      console.error(err);
      loaderText.textContent = `Model loaded, but scene preparation failed: ${err.message}`;
    }
  },
  xhr => {
    if (xhr.total) {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      loaderFill.style.width = `${Math.max(7, pct)}%`;
      loaderText.textContent = `Entering the territory… ${pct}%`;
    }
  },
  err => {
    console.error(err);
    loaderText.textContent = `The ${IS_BP3D ? 'BodyParts3D candidate' : 'spike model'} could not be loaded. Check the browser console and model path.`;
  }
);

document.querySelectorAll('[data-dataset]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.dataset === DATASET_ID) return;
    const next = new URLSearchParams(location.search);
    next.set('dataset', button.dataset.dataset);
    if (button.dataset.dataset === 'spike') next.delete('profile');
    location.search = `?${next.toString()}`;
  });
});

let searchActiveIndex = -1;
function paintSearchActive() {
  [...searchResults.querySelectorAll('button')].forEach((b, i) =>
    b.classList.toggle('active', i === searchActiveIndex));
}
searchInput.addEventListener('input', () => { searchActiveIndex = -1; renderSearch(); paintSearchActive(); });
searchInput.addEventListener('keydown', ev => {
  const buttons = [...searchResults.querySelectorAll('button')];
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    if (!buttons.length) return;
    ev.preventDefault();
    searchActiveIndex = ev.key === 'ArrowDown'
      ? Math.min(buttons.length - 1, searchActiveIndex + 1)
      : Math.max(0, searchActiveIndex - 1);
    paintSearchActive();
    buttons[searchActiveIndex]?.scrollIntoView({ block: 'nearest' });
  } else if (ev.key === 'Enter') {
    const target = buttons[searchActiveIndex] || buttons[0];
    if (target) target.click();
  } else if (ev.key === 'Escape') {
    searchResults.innerHTML = '';
    searchActiveIndex = -1;
  }
});
ghostModeInput.addEventListener('change', () => {
  applyGhostMode();
  setCaption('GHOST MODE', ghostModeInput.checked
    ? 'Cortex and white matter turned to glass — the deep brain is yours.'
    : 'Solid anatomy restored.');
});
document.querySelectorAll('[data-preset]').forEach(btn =>
  btn.addEventListener('click', () => applyLayerPreset(btn.dataset.preset)));
explodeInput.addEventListener('input', () => updateExplode());
isolateInput.addEventListener('change', updateVisibility);
document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
document.querySelectorAll('[data-ignite]').forEach(btn => btn.addEventListener('click', () => ignitePathway(btn.dataset.ignite)));
document.querySelector('#awakenNeuraxia').addEventListener('click', awakenNeuraxia);
document.querySelector('#enterVentricles').addEventListener('click', startVentricularJourney);
document.querySelector('#resetView').addEventListener('click', () => {
  isolateInput.checked = false;
  explodeInput.value = 0;
  updateExplode(0);
  selectEntry(null, { focus: false });
  setView('reset');
});

addEventListener('keydown', ev => {
  if (ev.key === '/' && document.activeElement !== searchInput) {
    ev.preventDefault();
    searchInput.focus();
  }
});

canvas.addEventListener('pointerdown', ev => {
  controls.autoRotate = false;
  pointerStart = { x: ev.clientX, y: ev.clientY, t: performance.now() };
});

canvas.addEventListener('pointerup', ev => {
  if (!pointerStart) return;
  const dx = ev.clientX - pointerStart.x;
  const dy = ev.clientY - pointerStart.y;
  const dt = performance.now() - pointerStart.t;
  pointerStart = null;
  if (Math.hypot(dx, dy) > 7 || dt > 650) return;

  pointer.x = (ev.clientX / innerWidth) * 2 - 1;
  pointer.y = -(ev.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const visibleMeshes = entries.filter(e => e.mesh.visible).map(e => e.mesh);
  const hit = raycaster.intersectObjects(visibleMeshes, false)[0];
  if (!hit) return;
  const entry = entries.find(e => e.mesh === hit.object);
  if (entry) selectEntry(entry);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
});

let frames = 0;
let fpsTime = performance.now();

function tick(now) {
  requestAnimationFrame(tick);

  if (cameraAnimation) {
    const t = Math.min(1, (now - cameraAnimation.start) / cameraAnimation.duration);
    const e = easeInOutCubic(t);
    camera.position.lerpVectors(cameraAnimation.fromPosition, cameraAnimation.toPosition, e);
    controls.target.lerpVectors(cameraAnimation.fromTarget, cameraAnimation.toTarget, e);
    if (t >= 1) cameraAnimation = null;
  }

  if (Math.abs(explodeTarget - explodeCurrent) > 0.0005) {
    applyExplode(explodeCurrent + (explodeTarget - explodeCurrent) * 0.085);
  }
  updateJourney(now);
  updateAmbientLife(now);
  const signalHead = updatePathways(now);
  if (signalHead) {
    signalLight.position.copy(signalHead);
    signalLight.intensity = 2.4;
  } else if (!journeyAnimation && entries.length) {
    signalLight.position.set(
      modelCenter.x + Math.cos(now * 0.00035) * modelRadius * 0.72,
      modelCenter.y + Math.sin(now * 0.00055) * modelRadius * 0.18,
      modelCenter.z + Math.sin(now * 0.00035) * modelRadius * 0.72
    );
    signalLight.intensity = livingModeInput.checked ? 0.75 + Math.sin(now * 0.0014) * 0.2 : 0.35;
  } else if (journeyAnimation) {
    signalLight.intensity = 2.2;
  }

  controls.update();
  if (selected && selectionBox?.visible) selectionBox.setFromObject(selected.mesh);
  renderer.render(scene, camera);

  frames++;
  if (now - fpsTime >= 600) {
    fpsEl.textContent = String(Math.round((frames * 1000) / (now - fpsTime)));
    drawCallsEl.textContent = String(renderer.info.render.calls);
    const tris = renderer.info.render.triangles;
    triCountEl.textContent = tris >= 1000 ? `${(tris / 1000).toFixed(0)}k` : String(tris);
    frames = 0;
    fpsTime = now;
  }
}
requestAnimationFrame(tick);
