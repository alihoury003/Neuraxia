import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { buildFireGraphPathways, FIRE_SOURCE_NOTE } from './pathways.js';
import { getDossier, DOSSIER_REVIEW_STATE } from './dossiers.js';

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
const controlPanelEl = document.querySelector('#controlPanel');
const selectedCardEl = document.querySelector('#selectedCard');
const firePanelEl = document.querySelector('.fire-panel');
const mobileHintEl = document.querySelector('#mobileHint');
const selectedActionsEl = document.querySelector('#selectedActions');
const relatedPathwaysEl = document.querySelector('#relatedPathways');
const neighbourPanelEl = document.querySelector('#neighbourPanel');
const labelsEnabledInput = document.querySelector('#labelsEnabled');
const labelsLayerEl = document.querySelector('#labelsLayer');
const labelLeadersEl = document.querySelector('#labelLeaders');
const igniteConsoleEl = document.querySelector('#igniteConsole');
const igniteTitleEl = document.querySelector('#igniteTitle');
const igniteScrubEl = document.querySelector('#igniteScrub');
const ignitePlayEl = document.querySelector('#ignitePlay');
const igniteRestartEl = document.querySelector('#igniteRestart');
const ignitePrevEl = document.querySelector('#ignitePrev');
const igniteNextEl = document.querySelector('#igniteNext');
const igniteSpeedEl = document.querySelector('#igniteSpeed');
const igniteStepEl = document.querySelector('#igniteStep');
const igniteFollowEl = document.querySelector('#igniteFollow');
const igniteOrdersEl = document.querySelector('#igniteOrders');
const igniteLesionEl = document.querySelector('#igniteLesion');
const igniteLoopEl = document.querySelector('#igniteLoop');
const igniteCloseEl = document.querySelector('#igniteClose');
const igniteStationsEl = document.querySelector('#igniteStations');
const igniteLegendEl = document.querySelector('#igniteLegend');
const igniteLesionNoteEl = document.querySelector('#igniteLesionNote');
const sliceEnabledInput = document.querySelector('#sliceEnabled');
const slicePositionInput = document.querySelector('#slicePosition');
const sliceValueEl = document.querySelector('#sliceValue');
const sliceNoteEl = document.querySelector('#sliceNote');
const restoreStructuresBtn = document.querySelector('#restoreStructures');
const structureModeCountEl = document.querySelector('#structureModeCount');
const tourCardEl = document.querySelector('#tourCard');
const tourProgressEl = document.querySelector('#tourProgress');
const tourTitleEl = document.querySelector('#tourTitle');
const tourTextEl = document.querySelector('#tourText');
const tourDotsEl = document.querySelector('#tourDots');
const tourBackBtn = document.querySelector('#tourBack');
const tourNextBtn = document.querySelector('#tourNext');
const tourExitBtn = document.querySelector('#tourExit');
const compactLayoutQuery = matchMedia('(max-width: 1100px)');

function isCompactLayout() {
  return compactLayoutQuery.matches;
}

function setMobilePanel(panel = 'explore') {
  const next = ['explore', 'details', 'controls', 'fire'].includes(panel) ? panel : 'explore';
  document.body.dataset.mobilePanel = next;
  document.querySelectorAll('[data-mobile-panel-button]').forEach(button =>
    button.setAttribute('aria-pressed', String(button.dataset.mobilePanelButton === next)));
  if (!controlPanelEl) return;
  if (next === 'fire' && firePanelEl) {
    requestAnimationFrame(() => {
      controlPanelEl.scrollTop = Math.max(0, firePanelEl.offsetTop - 14);
    });
  } else if (next === 'controls') {
    requestAnimationFrame(() => { controlPanelEl.scrollTop = 0; });
  } else if (next === 'details' && selectedCardEl) {
    requestAnimationFrame(() => { selectedCardEl.scrollTop = 0; });
  }
}
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOAD_STARTED_AT = performance.now();

const urlParams = new URLSearchParams(location.search);
const DATASET_ID = urlParams.get('dataset') === 'spike' ? 'spike' : 'bp3d';
const IS_BP3D = DATASET_ID === 'bp3d';
const MODEL_PROFILE = ['desktop', 'mobile'].includes(urlParams.get('profile'))
  ? urlParams.get('profile')
  : (matchMedia('(max-width: 900px), (pointer: coarse) and (max-width: 1100px)').matches ? 'mobile' : 'desktop');
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
  ? 'DISSECT ALPHA · FIRE PATHWAY GRAPH'
  : 'SPRINT 1 SPIKE · COMPARISON ONLY';
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

let renderPixelRatio = Math.min(devicePixelRatio || 1, 2);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(renderPixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.localClippingEnabled = true;
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
controls.rotateSpeed = 0.72;
controls.panSpeed = 0.65;
controls.zoomSpeed = 0.85;
controls.screenSpacePanning = false;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

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
let modelSize = new THREE.Vector3(1, 1, 1);
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

/* ── Sprint 2A · DISSECT proper state ─────────────────────────────── */
const hiddenEntries = new Set();
const ghostedEntries = new Set();
let ghostOthers = false;
const slicePlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
const activeSlicePlanes = [slicePlane];
let sliceHelper = null;
let sliceAxis = 'sagittal';
let sliceFlipped = false;
const ignite = {
  playing: true, speed: 1, follow: false, orders: false,
  step: false, lesionMode: false, loop: false, scrubbing: false
};
let lastPathwayTick = 0;
let ignitionSeq = 0;
let awakenSeq = 0;
const ORDER_COLORS = [0x20d7e5, 0xffb199, 0xc9a7ff, 0x9fe870];
let neighbourMode = false;
let neighbourEntries = [];
let neighbourDetails = [];
const neighbourSet = new Set();
let landmarkLabels = [];
const labelPool = [];
let labelFrame = 0;
let labelsWereActive = false;
let activeTour = null;
let activeTourKey = null;
let tourStepIndex = 0;
let tourIgniteTimer = null;

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
    let opacity = e.baseOpacity;
    if (ghost && ghostable) opacity = Math.min(opacity, 0.13);
    if (ghostedEntries.has(e)) opacity = Math.min(opacity, 0.16);
    if (ghostOthers && selected && e !== selected) opacity = Math.min(opacity, 0.13);
    if (ghostOthers && selected && e === selected && !ghostedEntries.has(e)) opacity = e.baseOpacity;
    m.opacity = opacity;
    m.transparent = opacity < 1;
    m.depthWrite = opacity >= 0.9;
    m.needsUpdate = true;
  }
  updateStructureModeUI();
}

function updateStructureModeUI() {
  const count = hiddenEntries.size + ghostedEntries.size;
  if (structureModeCountEl) structureModeCountEl.textContent = String(count);
  if (restoreStructuresBtn) {
    restoreStructuresBtn.disabled = count === 0 && !ghostOthers && !isolateInput.checked;
  }
}

function restoreStructureModes(announce = true) {
  hiddenEntries.clear();
  ghostedEntries.clear();
  ghostOthers = false;
  neighbourMode = false;
  updateNeighbours();
  clearIgnitions();
  isolateInput.checked = false;
  applyGhostMode();
  updateVisibility();
  renderSelectedActions();
  if (announce) setCaption('RESTORED', 'Every territory is back on the table — nothing hidden, ghosted or soloed.');
}


/* ── Sprint 2A · selected-structure actions ───────────────────────── */

const FIRE_ACTION_LABELS = {
  cst: 'CST · movement', dcml: 'DCML · fine touch', stt: 'Spinothalamic · pain',
  vision: 'Vision · chiasm sort', pupillary: 'Pupillary reflex', reflex: 'Stretch reflex',
  visual: 'Vision (schematic)', motor: 'Movement (schematic)', dorsal: 'Fine touch (schematic)',
  pain: 'Pain (schematic)'
};

function relatedFireKeys(entry) {
  if (!entry) return [];
  const keys = [];
  if (IS_BP3D && fireGraph) {
    for (const [key, def] of Object.entries(fireGraph)) {
      const inEntries = (def.entries || []).includes(entry);
      const inStations = (def.stations || []).some(st => st.entry === entry);
      if (inEntries || inStations) keys.push(key);
    }
    return keys;
  }
  if (entries.length) {
    for (const [key, def] of Object.entries(pathwayDefinitions())) {
      if ((def.sequence || []).includes(entry)) keys.push(key);
    }
  }
  return keys;
}

function makeActionButton(label, onClick, { pressed = null, className = '' } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  if (className) b.className = className;
  if (pressed !== null) b.setAttribute('aria-pressed', String(pressed));
  b.addEventListener('click', onClick);
  return b;
}

function renderSelectedActions() {
  if (!selectedActionsEl || !relatedPathwaysEl) return;
  selectedActionsEl.innerHTML = '';
  relatedPathwaysEl.innerHTML = '';
  updateStructureModeUI();
  if (!selected) {
    selectedActionsEl.innerHTML = '<p class="action-hint">Select a structure to focus, solo, ghost, hide or ignite it.</p>';
    return;
  }

  const isHidden = hiddenEntries.has(selected);
  const isGhosted = ghostedEntries.has(selected);
  selectedActionsEl.append(
    makeActionButton('◎ Focus', () => {
      hiddenEntries.delete(selected);
      updateVisibility();
      focusEntry(selected);
      renderSelectedActions();
    }),
    makeActionButton('Solo', () => {
      hiddenEntries.delete(selected);
      isolateInput.checked = !isolateInput.checked;
      updateVisibility();
      renderSelectedActions();
    }, { pressed: isolateInput.checked }),
    makeActionButton('Ghost others', () => {
      ghostOthers = !ghostOthers;
      applyGhostMode();
      renderSelectedActions();
    }, { pressed: ghostOthers }),
    makeActionButton('Neighbours', () => {
      neighbourMode = !neighbourMode;
      updateNeighbours();
      renderSelectedActions();
      renderNeighbourPanel();
    }, { pressed: neighbourMode }),
    makeActionButton(isGhosted ? 'Make solid' : 'Ghost this', () => {
      isGhosted ? ghostedEntries.delete(selected) : ghostedEntries.add(selected);
      applyGhostMode();
      renderSelectedActions();
    }, { pressed: isGhosted }),
    makeActionButton(isHidden ? 'Show' : 'Hide', () => {
      isHidden ? hiddenEntries.delete(selected) : hiddenEntries.add(selected);
      updateVisibility();
      renderSelectedActions();
    }, { pressed: isHidden }),
    makeActionButton('✦ Pulse here', () => {
      hiddenEntries.delete(selected);
      updateVisibility();
      triggerBurst(selected, { duration: 2400, strength: 1.55, color: 0x20d7e5 });
      setCaption('LOCAL IGNITION', `${selected.name} flares. Route-level FIRE graphs that pass through it are listed below where they exist.`);
      renderSelectedActions();
    }, { className: 'pulse-action' })
  );

  const keys = relatedFireKeys(selected);
  const title = document.createElement('div');
  title.className = 'related-title';
  title.textContent = keys.length ? 'FIRE routes through this structure' : 'FIRE routes';
  relatedPathwaysEl.appendChild(title);
  if (keys.length) {
    const row = document.createElement('div');
    row.className = 'related-row';
    for (const key of keys) {
      row.appendChild(makeActionButton(`✦ ${FIRE_ACTION_LABELS[key] || key}`, () => ignitePathway(key), { className: 'related-fire' }));
    }
    relatedPathwaysEl.appendChild(row);
  } else {
    const empty = document.createElement('p');
    empty.className = 'related-empty';
    empty.textContent = 'No FIRE graph routes through this exact mesh yet — “Pulse here” is a local teaching flare, not an invented tract.';
    relatedPathwaysEl.appendChild(empty);
  }
}

/* ── Sprint 2A · Slice lab (clipping planes) ──────────────────────── */

function ensureSliceHelper() {
  if (sliceHelper) return;
  const size = Math.max(modelRadius * 1.05, 0.05);
  sliceHelper = new THREE.PlaneHelper(slicePlane, size, 0x20d7e5);
  sliceHelper.material.transparent = true;
  sliceHelper.material.opacity = 0.2;
  sliceHelper.material.depthTest = false;
  sliceHelper.renderOrder = 15;
  sliceHelper.visible = Boolean(sliceEnabledInput?.checked);
  scene.add(sliceHelper);
}

function sliceAnatomicalNote(value) {
  const pct = `${value > 0 ? '+' : ''}${value}%`;
  if (sliceAxis === 'sagittal') {
    return `Sagittal plane ${value === 0 ? 'at the midline' : `${pct} toward subject ${value > 0 ? 'left' : 'right'}`}; keeping the subject-${sliceFlipped ? 'left' : 'right'} side.`;
  }
  if (sliceAxis === 'axial') {
    return `Axial plane ${pct} from centre toward ${value >= 0 ? 'superior' : 'inferior'}; keeping the ${sliceFlipped ? 'superior' : 'inferior'} side.`;
  }
  return `Coronal plane ${pct} from centre toward ${value >= 0 ? 'anterior' : 'posterior'}; keeping the ${sliceFlipped ? 'anterior' : 'posterior'} side.`;
}

function applySlice() {
  if (!sliceEnabledInput || !slicePositionInput) return;
  const enabled = sliceEnabledInput.checked;
  const value = Number(slicePositionInput.value) || 0;
  const axisVector = sliceAxis === 'sagittal'
    ? new THREE.Vector3(1, 0, 0)
    : sliceAxis === 'axial'
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(0, 0, 1);
  const dimension = sliceAxis === 'sagittal' ? modelSize.x : sliceAxis === 'axial' ? modelSize.y : modelSize.z;
  const centre = sliceAxis === 'sagittal' ? modelCenter.x : sliceAxis === 'axial' ? modelCenter.y : modelCenter.z;
  const planeCoord = centre + (value / 100) * (dimension / 2);
  slicePlane.normal.copy(axisVector).multiplyScalar(sliceFlipped ? 1 : -1);
  slicePlane.constant = sliceFlipped ? -planeCoord : planeCoord;

  const desired = enabled ? activeSlicePlanes : null;
  for (const e of entries) {
    const m = e.mesh.material;
    if (m.clippingPlanes !== desired) {
      m.clippingPlanes = desired;
      m.needsUpdate = true;
    }
  }
  ensureSliceHelper();
  if (sliceHelper) sliceHelper.visible = enabled;
  if (sliceValueEl) sliceValueEl.textContent = `${value > 0 ? '+' : ''}${value}%`;
  if (sliceNoteEl) sliceNoteEl.textContent = sliceAnatomicalNote(value);
  document.querySelectorAll('[data-slice-axis]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.sliceAxis === sliceAxis)));
}

function configureSlice({ enabled, axis, position, flipped } = {}) {
  if (axis) sliceAxis = axis;
  if (typeof flipped === 'boolean') sliceFlipped = flipped;
  if (typeof enabled === 'boolean' && sliceEnabledInput) sliceEnabledInput.checked = enabled;
  if (Number.isFinite(position) && slicePositionInput) slicePositionInput.value = String(position);
  applySlice();
}


/* ── Sprint 2B · neighbours ───────────────────────────────────────── */

function boxGap(a, b) {
  const dx = Math.max(0, Math.max(a.min.x - b.max.x, b.min.x - a.max.x));
  const dy = Math.max(0, Math.max(a.min.y - b.max.y, b.min.y - a.max.y));
  const dz = Math.max(0, Math.max(a.min.z - b.max.z, b.min.z - a.max.z));
  return Math.hypot(dx, dy, dz);
}

function computeNeighbours(entry) {
  if (!entry) return [];
  const selfBox = new THREE.Box3().setFromObject(entry.mesh);
  const selfCentre = selfBox.getCenter(new THREE.Vector3());
  const spatial = [];
  for (const e of entries) {
    if (e === entry || hiddenEntries.has(e) || !e.mesh.visible) continue;
    const box = new THREE.Box3().setFromObject(e.mesh);
    spatial.push({
      entry: e,
      gap: boxGap(selfBox, box),
      centreDist: selfCentre.distanceTo(box.getCenter(new THREE.Vector3()))
    });
  }
  spatial.sort((a, b) => a.gap - b.gap || a.centreDist - b.centreDist);

  const graph = [];
  if (IS_BP3D && fireGraph) {
    for (const [key, def] of Object.entries(fireGraph)) {
      const sequences = [
        (def.stations || []).map(st => st.entry).filter(Boolean),
        (def.entries || []).filter(Boolean)
      ];
      for (const seq of sequences) {
        const i = seq.indexOf(entry);
        if (i < 0) continue;
        for (const j of [i - 1, i + 1]) {
          if (seq[j] && seq[j] !== entry) {
            graph.push({ entry: seq[j], relation: `FIRE · ${FIRE_ACTION_LABELS[key] || key}`, graph: true });
          }
        }
      }
    }
  }

  const out = [];
  const seen = new Set([entry]);
  for (const g of graph) {
    if (seen.has(g.entry) || out.length >= 4) continue;
    seen.add(g.entry);
    out.push(g);
  }
  const nearLimit = modelRadius * 0.04;
  for (const sp of spatial) {
    if (out.length >= 8) break;
    if (seen.has(sp.entry)) continue;
    if (sp.gap > nearLimit && out.length >= 4) break;
    seen.add(sp.entry);
    out.push({
      entry: sp.entry,
      relation: sp.gap < 0.0005 ? 'adjacent' : (IS_BP3D ? `~${Math.max(1, Math.round(sp.gap * 1000))} mm away` : 'nearby'),
      graph: false
    });
  }
  return out;
}

function updateNeighbours() {
  neighbourDetails = neighbourMode && selected ? computeNeighbours(selected) : [];
  neighbourEntries = neighbourDetails.map(d => d.entry);
  neighbourSet.clear();
  for (const e of neighbourEntries) neighbourSet.add(e);
}

function renderNeighbourPanel() {
  if (!neighbourPanelEl) return;
  neighbourPanelEl.innerHTML = '';
  if (!selected || !neighbourMode) return;
  const title = document.createElement('div');
  title.className = 'related-title neighbour-title';
  title.textContent = 'Neighbours · tap to visit';
  neighbourPanelEl.appendChild(title);
  if (!neighbourDetails.length) {
    const empty = document.createElement('p');
    empty.className = 'related-empty';
    empty.textContent = 'No visible neighbours in touch range under the current layers.';
    neighbourPanelEl.appendChild(empty);
    return;
  }
  const list = document.createElement('div');
  list.className = 'neighbour-list';
  for (const d of neighbourDetails) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'neighbour-chip' + (d.graph ? ' graph' : '');
    const name = document.createElement('span');
    name.textContent = d.entry.name;
    const rel = document.createElement('span');
    rel.className = 'neighbour-relation';
    rel.textContent = d.relation;
    b.append(name, rel);
    b.addEventListener('click', () => selectEntry(d.entry));
    list.appendChild(b);
  }
  neighbourPanelEl.appendChild(list);
  const note = document.createElement('p');
  note.className = 'related-empty';
  note.textContent = 'Spatial neighbours are computed from this model’s mesh bounding boxes — a teaching approximation, not a surgical adjacency atlas.';
  neighbourPanelEl.appendChild(note);
}

/* ── Sprint 2B · floating labels ──────────────────────────────────── */

const LANDMARK_LABELS = [
  { pattern: '^Left superior frontal gyrus$', label: 'Sup. frontal gyrus', priority: 6 },
  { pattern: '^Left precentral gyrus$', label: 'Precentral · M1', priority: 8 },
  { pattern: '^Left postcentral gyrus$', label: 'Postcentral · S1', priority: 7 },
  { pattern: '^Left superior temporal gyrus$', label: 'Sup. temporal', priority: 5 },
  { pattern: '^Left cuneus$', label: 'Cuneus · V1', priority: 6 },
  { pattern: '^Left insula$', label: 'Insula', priority: 7 },
  { pattern: '^Corpus callosum$', label: 'Corpus callosum', priority: 8 },
  { pattern: '^Left internal capsule$', label: 'Internal capsule', priority: 7 },
  { pattern: '^Left fornix$', label: 'Fornix', priority: 5 },
  { pattern: '^Left thalamus$', label: 'Thalamus', priority: 10 },
  { pattern: '^Hypothalamus$', label: 'Hypothalamus', priority: 8 },
  { pattern: '^Left caudate nucleus$', label: 'Caudate', priority: 6 },
  { pattern: '^Left putamen$', label: 'Putamen', priority: 6 },
  { pattern: '^Left globus pallidus$', label: 'Globus pallidus', priority: 5 },
  { pattern: '^Left hippocampus$', label: 'Hippocampus', priority: 7 },
  { pattern: '^Left amygdala$', label: 'Amygdala', priority: 5 },
  { pattern: '^Left lateral ventricle$', label: 'Lat. ventricle', priority: 6 },
  { pattern: '^Third ventricle$', label: '3rd ventricle', priority: 6 },
  { pattern: '^Fourth ventricle$', label: '4th ventricle', priority: 6 },
  { pattern: '^Optic chiasm$', label: 'Optic chiasm', priority: 7 },
  { pattern: '^Cerebellum$', label: 'Cerebellum', priority: 9 },
  { pattern: '^Pons$', label: 'Pons', priority: 9 },
  { pattern: '^Medulla oblongata$', label: 'Medulla', priority: 8 },
  { pattern: '^Spinal cord$', label: 'Spinal cord', priority: 10 },
  { pattern: '^Cauda equina$', label: 'Cauda equina', priority: 5 }
];

function ensureLabelPool(size) {
  while (labelPool.length < size) {
    const el = document.createElement('div');
    el.className = 'structure-label';
    el.style.display = 'none';
    labelsLayerEl.appendChild(el);
    labelPool.push(el);
  }
}

function maxLabelCount() {
  if (neighbourMode) return innerWidth <= 700 ? 7 : 9;
  return innerWidth <= 700 ? 8 : innerWidth <= 1100 ? 12 : 16;
}

function labelCandidates() {
  const byEntry = new Map();
  const add = (entry, label, kind, priority) => {
    if (!entry || !entry.mesh.visible || hiddenEntries.has(entry)) return;
    const prev = byEntry.get(entry);
    if (!prev || priority > prev.priority) byEntry.set(entry, { entry, label, kind, priority });
  };
  if (labelsEnabledInput?.checked) {
    const deepRevealed = ghostModeInput.checked || ghostOthers || isolateInput.checked || sliceEnabledInput?.checked || Boolean(activeTour);
    for (const def of landmarkLabels) {
      const e = def.entry;
      const deepish = e.category === 'deep' || e.category === 'white';
      if (deepish && !deepRevealed && e !== selected) continue;
      add(e, def.label, e === selected ? 'selected' : 'landmark', e === selected ? 100 : def.priority);
    }
  }
  if (neighbourMode && selected) {
    add(selected, selected.name, 'selected', 100);
    neighbourEntries.forEach((e, i) => add(e, e.name, 'neighbour', 90 - i));
  } else if (selected && (labelsEnabledInput?.checked || activeTour)) {
    add(selected, selected.name, 'selected', 100);
  }
  return [...byEntry.values()].sort((a, b) => b.priority - a.priority).slice(0, maxLabelCount());
}

function updateLabels() {
  if (!labelsLayerEl || !labelLeadersEl) return;
  const active = Boolean(labelsEnabledInput?.checked || neighbourMode || activeTour);
  if (!active || !entries.length) {
    if (labelsWereActive) {
      for (const el of labelPool) el.style.display = 'none';
      labelLeadersEl.innerHTML = '';
      labelsWereActive = false;
    }
    return;
  }
  labelsWereActive = true;
  const candidates = labelCandidates();
  ensureLabelPool(Math.max(candidates.length, 1));
  const w = innerWidth, h = innerHeight;
  labelLeadersEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const compact = isCompactLayout();
  const topLimit = compact ? 94 : 16;
  const bottomLimit = compact && activeTour ? h * 0.54 : h - (compact ? 96 : 40);
  const placed = [];
  const obstacles = [];
  for (const sel of ['.brandbar', '#controlPanel', '#selectedCard', '#liveCaption', '#tourCard', '#igniteConsole', '#mobileNav', '.mobile-hint']) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) obstacles.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
  }
  const lines = [];
  let used = 0;
  const v = new THREE.Vector3();

  for (const cand of candidates) {
    v.copy(getEntryCenter(cand.entry)).project(camera);
    if (v.z > 1 || v.z < -1) continue;
    const ax = (v.x * 0.5 + 0.5) * w;
    const ay = (-v.y * 0.5 + 0.5) * h;
    if (ax < -40 || ax > w + 40 || ay < -40 || ay > h + 40) continue;
    const el = labelPool[used];
    if (!el) break;
    el.textContent = cand.label;
    el.className = `structure-label ${cand.kind}`;
    el.style.display = 'block';
    el.style.visibility = 'hidden';
    el.style.left = '0px';
    el.style.top = '0px';
    const lw = el.offsetWidth, lh = el.offsetHeight;
    const placements = [
      { cx: ax, cy: ay - 36 },
      { cx: ax + lw / 2 + 24, cy: ay - 12 },
      { cx: ax - lw / 2 - 24, cy: ay - 12 },
      { cx: ax, cy: ay + 36 }
    ];
    let chosen = null;
    for (const p of placements) {
      const rect = { left: p.cx - lw / 2, top: p.cy - lh / 2, right: p.cx + lw / 2, bottom: p.cy + lh / 2 };
      if (rect.left < 6 || rect.right > w - 6 || rect.top < topLimit || rect.bottom > bottomLimit) continue;
      const overlaps = [...placed, ...obstacles].some(r => rect.left < r.right + 4 && rect.right > r.left - 4 && rect.top < r.bottom + 4 && rect.bottom > r.top - 4);
      if (!overlaps) { chosen = rect; break; }
    }
    if (!chosen) { el.style.display = 'none'; continue; }
    placed.push(chosen);
    el.style.left = `${chosen.left}px`;
    el.style.top = `${chosen.top}px`;
    el.style.visibility = 'visible';
    const lx = THREE.MathUtils.clamp(ax, chosen.left, chosen.right);
    const ly = THREE.MathUtils.clamp(ay, chosen.top, chosen.bottom);
    lines.push(`<line class="${cand.kind}" x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}"/>`);
    lines.push(`<circle class="${cand.kind}" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.6"/>`);
    used++;
  }
  for (let i = used; i < labelPool.length; i++) labelPool[i].style.display = 'none';
  labelLeadersEl.innerHTML = lines.join('');
}

/* ── Sprint 2A · guided tours ─────────────────────────────────────── */

const GUIDED_TOURS = {
  first: {
    label: 'First incision',
    steps: [
      { title: 'Meet the territory', text: 'One continuous neuraxis: cerebrum above, brainstem as the stalk, cord descending behind. Orbit freely — the tour will wait for you.', preset: 'overview', view: 'reset', explode: 0, slice: { enabled: false } },
      { title: 'The executive surface', text: 'The superior frontal gyrus — planning, working memory and the medial face of the frontal lobe. Cortex is only the shell of this city.', pattern: '^Left (superior frontal gyrus|frontal lobe)$', preset: 'overview' },
      { title: 'Where movement begins', text: 'Precentral gyrus: upper motor neurons of the corticospinal tract. Watch their order descend — and note it still has not crossed.', pattern: '^Right (precentral gyrus|frontal lobe)$', ignite: 'cst' },
      { title: 'The hidden island', text: 'The insula hides beneath the lateral sulcus — interoception, taste, pain and autonomic colour. X-ray mode brings it forward.', pattern: '^Left insula$', preset: 'deep' },
      { title: 'Open the midline', text: 'A sagittal slice parts the hemispheres. The corpus callosum — ~200 million commissural fibres — is the bridge you are looking along.', pattern: '^Corpus callosum$', preset: 'white', slice: { enabled: true, axis: 'sagittal', position: 10, flipped: false } },
      { title: 'Down the axis', text: 'From cortex to conus in one structure. Every long tract in FIRE climbs or descends this cord — its cross-section is the lesion-localiser’s map.', pattern: '^Spinal cord$', preset: 'cord', explode: 22, slice: { enabled: false } }
    ]
  },
  deep: {
    label: 'Deep relay empire',
    steps: [
      { title: 'The great relay', text: 'Thalamus: almost every sensory stream synapses here before cortex. If cortex is the capital, this is its border crossing.', pattern: '^Left thalamus$', preset: 'deep' },
      { title: 'The body’s thermostat', text: 'Hypothalamus — grams of tissue governing temperature, hunger, thirst, circadian rhythm and the pituitary below it.', pattern: '^Hypothalamus$', preset: 'deep' },
      { title: 'The striatal arc', text: 'Caudate nucleus sweeps in a C around the thalamus, following the lateral ventricle — procedural learning and habit live along this arc.', pattern: '^Left caudate nucleus$', preset: 'deep' },
      { title: 'Putamen: motor striatum', text: 'Together with the caudate it forms the striatum, the input stage of the basal ganglia loops that gate movement.', pattern: '^Left putamen$', preset: 'deep' },
      { title: 'Globus pallidus: the gate', text: 'The pallidum is the basal ganglia’s output throttle — too much or too little braking here becomes Parkinsonism or dyskinesia.', pattern: '^Left globus pallidus$', preset: 'deep' },
      { title: 'The memory seahorse', text: 'Hippocampus in the medial temporal lobe — encoding new episodic memories. Its fornix is the great output arc.', pattern: '^Left hippocampus$', preset: 'deep' },
      { title: 'The capsule bottleneck', text: 'Internal capsule: nearly all cortical traffic funnels through this white-matter corridor — which is why a tiny capsular stroke can paralyse a whole side. Igniting CST through it now.', pattern: '^Right internal capsule$', preset: 'white', ignite: 'cst' }
    ]
  },
  crossings: {
    label: 'Crossing stories',
    steps: [
      { title: 'Fine touch climbs uncrossed', text: 'Dorsal columns ascend the cord on the SAME side. Watch cyan rise from cord to medulla before any crossing happens.', pattern: '^Spinal cord$', preset: 'cord', ignite: 'dcml' },
      { title: 'The medullary crossing', text: 'In the medulla, dorsal-column fibres synapse and sweep across as internal arcuate fibres — only now does fine touch change sides.', pattern: '^Medulla oblongata$', preset: 'cord' },
      { title: 'Pain crosses immediately', text: 'Spinothalamic fibres cross in the anterior white commissure within a segment or two of entry. Same cord, opposite rule — igniting it now.', pattern: '^Spinal cord$', preset: 'cord', ignite: 'stt' },
      { title: 'Race the decussations', text: 'Both systems together: cyan crosses high, rose crosses low. That single contrast produces the dissociated sensory loss of cord syndromes.', pattern: '^Right thalamus$', preset: 'cord', ignite: 'race' },
      { title: 'The chiasm sorts by field', text: 'Vision breaks the body-side rule entirely: nasal fibres cross, temporal fibres stay, and each tract thereafter carries a visual hemifield.', pattern: '^Optic chiasm$', preset: 'overview', ignite: 'vision' }
    ]
  }
};

function updateTourChrome() {
  if (!activeTour || !tourCardEl) return;
  const step = activeTour.steps[tourStepIndex];
  tourProgressEl.textContent = `${activeTour.label.toUpperCase()} · ${tourStepIndex + 1} / ${activeTour.steps.length}`;
  tourTitleEl.textContent = step.title;
  tourTextEl.textContent = step.text;
  tourBackBtn.disabled = tourStepIndex === 0;
  tourNextBtn.textContent = tourStepIndex === activeTour.steps.length - 1 ? 'Finish ✦' : 'Next →';
  tourDotsEl.innerHTML = activeTour.steps
    .map((_, i) => `<span class="${i === tourStepIndex ? 'active' : ''}"></span>`)
    .join('');
}

function runTourStep() {
  if (!activeTour) return;
  const step = activeTour.steps[tourStepIndex];
  if (tourIgniteTimer) clearTimeout(tourIgniteTimer);
  if (step.preset) applyLayerPreset(step.preset);
  if (step.slice) configureSlice(step.slice);
  if (Number.isFinite(step.explode)) {
    explodeInput.value = String(step.explode);
    updateExplode(step.explode / 100);
  }
  const entry = step.pattern ? findEntry(new RegExp(step.pattern, 'i')) : null;
  if (entry) {
    selectEntry(entry, { focus: step.focus !== false, revealDetails: false });
  } else if (step.view) {
    setView(step.view);
  }
  updateTourChrome();
  if (step.ignite) {
    tourIgniteTimer = setTimeout(() => ignitePathway(step.ignite), 650);
  }
}

function startTour(key) {
  const tour = GUIDED_TOURS[key];
  if (!tour || !entries.length) return;
  restoreStructureModes(false);
  configureSlice({ enabled: false });
  activeTour = tour;
  activeTourKey = key;
  tourStepIndex = 0;
  document.body.classList.add('tour-active');
  if (tourCardEl) tourCardEl.hidden = false;
  if (isCompactLayout()) setMobilePanel('explore');
  controls.autoRotate = false;
  runTourStep();
}

function endTour(restore = true) {
  if (!activeTour) return;
  if (tourIgniteTimer) clearTimeout(tourIgniteTimer);
  activeTour = null;
  activeTourKey = null;
  tourStepIndex = 0;
  document.body.classList.remove('tour-active');
  if (tourCardEl) tourCardEl.hidden = true;
  if (restore) {
    configureSlice({ enabled: false });
    explodeInput.value = '0';
    updateExplode(0);
    applyLayerPreset('overview');
    setView('reset');
  }
  setCaption('TOUR COMPLETE', 'The territory is yours again — orbit freely, dissect with the Slice lab, or start another route.');
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
    e.mesh.visible = hiddenEntries.has(e)
      ? false
      : (isolateInput.checked && selected ? e.mesh === selected.mesh : inCategory);
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

function selectEntry(entry, { focus = true, revealDetails = focus } = {}) {
  clearSelectionHighlight();
  selected = entry;
  if (!entry) {
    selectedName.textContent = 'Enter the neuraxis';
    selectedMeta.textContent = 'Drag to orbit. Scroll to zoom. Click any glowing structure — or search by name.';
    selectedStats.innerHTML = '';
    dossierBody.innerHTML = '';
    ghostOthers = false;
    neighbourMode = false;
    updateNeighbours();
    renderNeighbourPanel();
    if (selectionBox) selectionBox.visible = false;
    applyGhostMode();
    updateVisibility();
    renderSelectedActions();
    if (isCompactLayout()) setMobilePanel('explore');
    return;
  }

  hiddenEntries.delete(entry);
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
  if (ghostOthers) applyGhostMode();
  updateVisibility();
  if (focus) focusEntry(entry);
  if (neighbourMode) updateNeighbours();
  renderNeighbourPanel();
  renderSelectedActions();
  if (revealDetails && isCompactLayout()) setMobilePanel('details');
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
      if (isCompactLayout()) searchInput.blur();
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

function fittedDistance(direction, margin = 1.13) {
  const dir = direction.clone().normalize();
  const upHint = Math.abs(dir.y) > 0.9
    ? new THREE.Vector3(0, 0, -1)
    : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(upHint, dir).normalize();
  const up = new THREE.Vector3().crossVectors(dir, right).normalize();
  const half = modelSize.clone().multiplyScalar(0.5);
  const projectedHalfExtent = axis =>
    Math.abs(half.x * axis.x) + Math.abs(half.y * axis.y) + Math.abs(half.z * axis.z);
  const halfWidth = projectedHalfExtent(right);
  const halfHeight = projectedHalfExtent(up);
  const halfDepth = projectedHalfExtent(dir);
  const halfFovTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const fitHeight = halfHeight / halfFovTan;
  const fitWidth = halfWidth / (halfFovTan * Math.max(camera.aspect, 0.1));
  return Math.max(modelRadius * 1.15, (halfDepth + Math.max(fitHeight, fitWidth)) * margin);
}

function setView(name) {
  const vectors = {
    front: new THREE.Vector3(0, 0.16, 1),
    side: new THREE.Vector3(1, 0.16, 0.08),
    top: new THREE.Vector3(0.02, 1, 0.08),
    reset: new THREE.Vector3(0.72, 0.36, 1)
  };
  const v = (vectors[name] || vectors.reset).normalize();
  animateCamera(modelCenter.clone().addScaledVector(v, fittedDistance(v)), modelCenter.clone(), 1000);
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


/* ── Sprint 3 · IGNITE timeline engine ────────────────────────────── */

function kindIcon(kind) {
  return kind === 'decussation' ? '◆' : kind === 'synapse' ? '○' : kind === 'origin' ? '◎' : kind === 'target' ? '⬢' : '●';
}

function shortStationLabel(label) {
  return String(label || '')
    .replace(/^(◆|○)\s*/, '')
    .replace(/\s*\(schematic[^)]*\)\s*/i, '')
    .trim();
}

/** Cached curve per animation: rebuilt only while the explode value moves. */
function refreshCurve(a) {
  const key = Math.round(explodeCurrent * 500);
  if (a.curve && a.curveExplodeKey === key) return a.curve;
  a.curve = resolvePathCurve(a);
  a.curveExplodeKey = key;
  const pts = a.curve.getSpacedPoints(159);
  for (let i = 0; i < pts.length; i++) {
    a.linePositions[i * 3] = pts[i].x;
    a.linePositions[i * 3 + 1] = pts[i].y;
    a.linePositions[i * 3 + 2] = pts[i].z;
  }
  a.line.geometry.attributes.position.needsUpdate = true;
  applyLineColors(a);
  return a.curve;
}

function orderAtFraction(a, t) {
  let order = 1;
  for (const s of a.stations || []) {
    if (s.kind === 'synapse' && t > s.at) order++;
  }
  return Math.min(order, ORDER_COLORS.length);
}

/** Vertex colours: base pathway colour, neuron-order bands, or lesioned-downstream grey. */
function applyLineColors(a) {
  if (!a.lineColors || !a.curve) return;
  const base = new THREE.Color(a.color);
  const tmp = new THREE.Color();
  const dead = new THREE.Color(0x57463f);
  for (let i = 0; i < 160; i++) {
    const u = i / 159;
    const t = typeof a.curve.getUtoTmapping === 'function' ? a.curve.getUtoTmapping(u) : u;
    if (a.lesionAt !== null && t > a.lesionAt) tmp.copy(dead);
    else if (ignite.orders) tmp.setHex(ORDER_COLORS[orderAtFraction(a, t) - 1]);
    else tmp.copy(base);
    a.lineColors[i * 3] = tmp.r;
    a.lineColors[i * 3 + 1] = tmp.g;
    a.lineColors[i * 3 + 2] = tmp.b;
  }
  a.line.geometry.attributes.color.needsUpdate = true;
  (a.stations || []).forEach((st, i) => {
    const m = a.markers?.[i];
    if (m) m.material.color.setHex(a.lesionAt !== null && st.at > a.lesionAt ? 0x6b5a56 : m.userData.baseColor);
  });
}

function syncStationStates(a) {
  let current = -1;
  (a.stations || []).forEach((st, i) => { if (a.progress >= st.at) current = i; });
  (a.stations || []).forEach((st, i) => {
    const lit = a.triggered.has(i);
    const li = a.infoItems?.[i];
    if (li) {
      li.classList.toggle('lit', lit);
      li.classList.toggle('lit-dec', lit && st.kind === 'decussation');
      li.classList.toggle('lit-syn', lit && st.kind === 'synapse');
    }
    const chip = a.chips?.[i];
    if (chip) {
      chip.classList.toggle('lit', lit);
      chip.classList.toggle('current', i === current);
      chip.classList.toggle('lesioned', a.lesionAt !== null && st.at > a.lesionAt);
      chip.classList.toggle('lesion-site', a.lesionAt !== null && st.at === a.lesionAt);
    }
  });
}

function captionForProgress(a) {
  let st = null;
  for (const s of a.stations || []) if (a.progress >= s.at) st = s;
  setCaption(a.kicker, st?.caption || a.intro);
}

function seekAnimation(a, p, { burst = false } = {}) {
  a.progress = THREE.MathUtils.clamp(p, 0, 1);
  if (a.lesionAt !== null) a.progress = Math.min(a.progress, a.lesionAt);
  a.began = true;
  a.start = 0;
  a.finished = a.progress >= 1;
  a.triggered.clear();
  let last = null;
  (a.stations || []).forEach((st, i) => {
    if (a.progress >= st.at) { a.triggered.add(i); last = st; }
  });
  if (burst && last?.entry) {
    triggerBurst(last.entry, {
      duration: last.kind === 'synapse' || last.kind === 'decussation' ? 2300 : 1700,
      strength: last.kind === 'synapse' || last.kind === 'decussation' ? 1.45 : 1.15,
      color: last.kind === 'decussation' ? 0xffd9a8 : a.color
    });
  }
  syncStationStates(a);
}

function ignitionTimelineTotal() {
  if (!pathwayAnimations.length) return 1;
  return Math.max(1, ...pathwayAnimations.map(a => a.delayMs + a.duration));
}

function globalIgniteProgress() {
  if (!pathwayAnimations.length) return 0;
  const total = ignitionTimelineTotal();
  return Math.max(...pathwayAnimations.map(a => (a.delayMs + a.progress * a.duration) / total));
}

function seekAll(globalP, { burst = false } = {}) {
  const total = ignitionTimelineTotal();
  for (const a of pathwayAnimations) {
    seekAnimation(a, (globalP * total - a.delayMs) / a.duration, { burst });
  }
  if (pathwayAnimations[0]) captionForProgress(pathwayAnimations[0]);
}

function renderLesionNote() {
  if (!igniteLesionNoteEl) return;
  const lesioned = pathwayAnimations.find(a => a.lesionAt !== null);
  if (!lesioned) {
    igniteLesionNoteEl.hidden = true;
    igniteLesionNoteEl.textContent = '';
    return;
  }
  igniteLesionNoteEl.hidden = false;
  igniteLesionNoteEl.textContent =
    `✕ Interrupted at ${shortStationLabel(lesioned.lesionLabel)} — downstream stations go dark; nothing beyond this point arrives. ` +
    `${lesioned.lesion || ''} Draft teaching note — expert review pending.`;
}

function setLesion(a, station) {
  if (a.lesionAt === station.at) {
    a.lesionAt = null;
    a.lesionLabel = null;
  } else {
    a.lesionAt = station.at;
    a.lesionLabel = station.label;
    if (a.progress > station.at) seekAnimation(a, station.at);
    if (station.entry) triggerBurst(station.entry, { duration: 1600, strength: 1.3, color: 0xff6b6b });
  }
  applyLineColors(a);
  syncStationStates(a);
  renderLesionNote();
}

function onStationChosen(a, station) {
  if (ignite.lesionMode) { setLesion(a, station); return; }
  const total = ignitionTimelineTotal();
  seekAll((a.delayMs + station.at * a.duration) / total);
  seekAnimation(a, station.at, { burst: true });
  if (station.caption) setCaption(a.kicker, station.caption);
  ignite.playing = false;
  updateIgniteTransportUI();
}

function updateIgniteTransportUI() {
  if (!igniteConsoleEl) return;
  ignitePlayEl.textContent = ignite.playing ? '⏸' : '▶';
  ignitePlayEl.setAttribute('aria-pressed', String(ignite.playing));
  igniteSpeedEl.textContent = `${ignite.speed}×`;
  igniteStepEl.setAttribute('aria-pressed', String(ignite.step));
  igniteFollowEl.setAttribute('aria-pressed', String(ignite.follow));
  igniteOrdersEl.setAttribute('aria-pressed', String(ignite.orders));
  igniteLesionEl.setAttribute('aria-pressed', String(ignite.lesionMode));
  igniteLoopEl.setAttribute('aria-pressed', String(ignite.loop));
  igniteLegendEl.hidden = !ignite.orders;
  igniteConsoleEl.classList.toggle('lesion-mode', ignite.lesionMode);
}

function renderIgniteConsole() {
  if (!igniteConsoleEl) return;
  const active = pathwayAnimations.length > 0;
  igniteConsoleEl.hidden = !active;
  document.body.classList.toggle('ignite-on', active);
  if (!active) return;
  igniteTitleEl.textContent = pathwayAnimations.length > 1
    ? `Race · ${pathwayAnimations.map(a => a.label).join(' vs ')}`
    : pathwayAnimations[0].label;
  igniteStationsEl.innerHTML = '';
  for (const a of pathwayAnimations) {
    const row = document.createElement('div');
    row.className = 'ignite-station-row';
    if (pathwayAnimations.length > 1) {
      const h = document.createElement('div');
      h.className = 'ignite-row-label';
      h.textContent = a.label;
      row.appendChild(h);
    }
    const wrap = document.createElement('div');
    wrap.className = 'ignite-chip-wrap';
    a.chips = (a.stations || []).map(st => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `ignite-chip kind-${st.kind}`;
      chip.textContent = `${kindIcon(st.kind)} ${shortStationLabel(st.label)}`;
      chip.title = st.label;
      chip.addEventListener('click', () => onStationChosen(a, st));
      wrap.appendChild(chip);
      return chip;
    });
    row.appendChild(wrap);
    igniteStationsEl.appendChild(row);
    syncStationStates(a);
  }
  updateIgniteTransportUI();
  renderLesionNote();
}

function clearIgnitions() {
  while (pathwayAnimations.length) disposePathway(pathwayAnimations.pop());
  renderIgniteConsole();
}

function restartIgnitions() {
  const now = performance.now();
  for (const a of pathwayAnimations) {
    a.progress = 0;
    a.began = false;
    a.finished = false;
    a.start = now + a.delayMs;
    a.triggered.clear();
    syncStationStates(a);
  }
  ignite.playing = true;
  updateIgniteTransportUI();
  if (pathwayAnimations[0]) setCaption(pathwayAnimations[0].kicker, pathwayAnimations[0].intro);
}

function stepStation(dir) {
  const a = pathwayAnimations[0];
  if (!a) return;
  const ats = (a.stations || []).map(st => st.at);
  let target = dir > 0
    ? ats.find(at => at > a.progress + 0.0015)
    : [...ats].reverse().find(at => at < a.progress - 0.0015);
  if (target === undefined) target = dir > 0 ? 1 : 0;
  seekAll((a.delayMs + target * a.duration) / ignitionTimelineTotal());
  seekAnimation(a, target, { burst: true });
  captionForProgress(a);
  ignite.playing = false;
  updateIgniteTransportUI();
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
  const lineColors = new Float32Array(160 * 3);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    depthTest: false
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  line.frustumCulled = false;
  line.renderOrder = 20;
  group.add(line);

  // Branch/loop curves (vision Meyer loop + crossing fibres, pupillary
  // consensual arm): static CatmullRom lines resolved once per ignition.
  const extraLines = (definition.extraCurves || []).map(extra => {
    const geo = new THREE.BufferGeometry().setFromPoints(
      new THREE.CatmullRomCurve3(extra.buildPoints(), false, 'catmullrom', 0.12).getSpacedPoints(96)
    );
    const mat = new THREE.LineBasicMaterial({
      color: extra.color ?? definition.color,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      depthTest: false
    });
    const branch = new THREE.Line(geo, mat);
    branch.frustumCulled = false;
    branch.renderOrder = 19;
    group.add(branch);
    return { line: branch };
  });

  // Sprint 3 fix: markers are per STATION (not per sequence entry) and carry
  // their kind styling — gold octahedra for decussations, bright synapses.
  const markers = stations.map(station => {
    const style = stationMarkerStyle(station.kind, definition.color);
    const marker = new THREE.Mesh(
      style.geometry,
      new THREE.MeshBasicMaterial({ color: style.color, transparent: true, opacity: 0.86, depthWrite: false, depthTest: false })
    );
    marker.renderOrder = 21;
    marker.userData.stationScale = style.scale;
    marker.userData.baseColor = style.color;
    marker.scale.setScalar(Math.max(modelRadius * 0.012 * style.scale, 0.004));
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
  const anim = {
    ...definition,
    sequence,
    stations,
    infoItems,
    group,
    line,
    linePositions,
    lineColors,
    extraLines,
    markers,
    pulses,
    start: performance.now() + delay,
    delayMs: delay,
    progress: 0,
    began: false,
    finished: false,
    lesionAt: null,
    lesionLabel: null,
    curve: null,
    curveExplodeKey: NaN,
    chips: [],
    triggered: new Set()
  };
  pathwayAnimations.push(anim);
  refreshCurve(anim);
  infoItems?.forEach((li, i) => {
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => onStationChosen(anim, anim.stations[i]));
  });
  renderIgniteConsole();
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
  ignitionSeq++;
  clearIgnitions();
  ignite.playing = true;
  if (isCompactLayout()) setMobilePanel('explore');
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
  const dt = lastPathwayTick ? Math.min(now - lastPathwayTick, 120) : 0;
  lastPathwayTick = now;
  let newestHead = null;

  for (const a of pathwayAnimations) {
    if (!a.began) {
      if (now < a.start) { a.group.visible = false; continue; }
      a.began = true;
      a.progress = 0;
    }
    a.group.visible = true;

    if (ignite.playing && !ignite.scrubbing && !a.finished) {
      let next = a.progress + (dt * ignite.speed) / a.duration;
      let stepPause = false;
      if (ignite.step) {
        const ev = (a.stations || []).find((st, i) =>
          !a.triggered.has(i) &&
          (st.kind === 'synapse' || st.kind === 'decussation' || st.kind === 'target') &&
          st.at > a.progress && st.at <= next);
        if (ev) { next = ev.at; stepPause = true; }
      }
      if (a.lesionAt !== null) next = Math.min(next, a.lesionAt);
      a.progress = THREE.MathUtils.clamp(next, 0, 1);
      a._stepPause = stepPause;
      if (a.progress >= 1) a.finished = true;
    }

    const progress = a.progress;
    const curve = refreshCurve(a);
    const fade = progress < 0.08 ? 0.35 + 0.65 * (progress / 0.08) : 1;
    a.line.material.opacity = 0.78 * fade;
    for (const extra of a.extraLines || []) extra.line.material.opacity = 0.55 * fade;

    let stationsChanged = false;
    (a.stations || []).forEach((station, i) => {
      const marker = a.markers[i];
      if (!marker) return;
      marker.position.copy(station.getPoint(curve));
      if (station.kind === 'decussation') marker.rotation.y = now * 0.003;
      const activated = progress >= station.at;
      const pulseScale = activated ? 1.45 + Math.sin(now * 0.012 + i) * 0.18 : 0.85;
      marker.scale.setScalar(Math.max(modelRadius * 0.012 * (marker.userData.stationScale || 1) * pulseScale, 0.003));
      const lesionedOut = a.lesionAt !== null && station.at > a.lesionAt;
      marker.material.opacity = (lesionedOut ? 0.16 : activated ? 0.96 : 0.38) * fade;
      if (activated && !a.triggered.has(i)) {
        a.triggered.add(i);
        stationsChanged = true;
        if (station.entry) {
          triggerBurst(station.entry, {
            duration: station.kind === 'synapse' || station.kind === 'decussation' ? 2300 : 1700,
            strength: station.kind === 'synapse' || station.kind === 'decussation' ? 1.45 : 1.15,
            color: station.kind === 'decussation' ? 0xffd9a8 : a.color
          });
        }
        if (station.caption && a === pathwayAnimations[0]) setCaption(a.kicker, station.caption);
        else if (station.caption && pathwayAnimations.length === 1) setCaption(a.kicker, station.caption);
      }
    });
    if (stationsChanged) syncStationStates(a);

    if (a._stepPause) {
      a._stepPause = false;
      if (ignite.playing) { ignite.playing = false; updateIgniteTransportUI(); }
    }

    a.pulses.forEach((pulse, j) => {
      const t = progress - j * 0.013;
      pulse.visible = !a.finished && t >= 0 && t <= 1;
      if (!pulse.visible) return;
      pulse.position.copy(curve.getPoint(t));
      pulse.material.opacity = Math.max(0, (0.98 - j * 0.065)) * fade;
      if (j === 0) newestHead = pulse.position.clone();
    });
  }

  if (pathwayAnimations.length) {
    if (!ignite.scrubbing && igniteScrubEl && !igniteConsoleEl.hidden) {
      igniteScrubEl.value = String(Math.round(globalIgniteProgress() * 1000));
    }
    if (pathwayAnimations.every(a => a.finished || (a.lesionAt !== null && a.progress >= a.lesionAt))) {
      if (ignite.loop && pathwayAnimations.every(a => a.finished)) restartIgnitions();
      else if (ignite.playing) { ignite.playing = false; updateIgniteTransportUI(); }
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
    } else if (neighbourMode && neighbourSet.has(e)) {
      color = 0xd9a48e;
      intensity = Math.max(intensity, 0.42);
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
  if (isCompactLayout()) setMobilePanel('explore');
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
    setView('reset');
  }
}

function awakenNeuraxia() {
  if (!entries.length) return;
  if (isCompactLayout()) setMobilePanel('explore');
  livingModeInput.checked = true;
  controls.autoRotate = !prefersReducedMotion;
  setView('reset');
  explodeInput.value = 42;
  updateExplode(0.42);
  setCaption('NEURAXIA AWAKENS', 'Territories separate, signals ignite, and the neuraxis comes alive.');
  const myAwaken = ++awakenSeq;
  const baseSeq = ignitionSeq;
  const later = (fn, ms, expect) => setTimeout(() => {
    if (awakenSeq === myAwaken && ignitionSeq === baseSeq + expect) fn();
  }, ms);
  later(() => ignitePathway('visual'), 650, 0);
  later(() => ignitePathway('sensory'), 2100, 1);
  setTimeout(() => {
    explodeInput.value = 0;
    updateExplode(0);
  }, 3300);
  later(() => ignitePathway('motor'), 4200, 2);
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
  cnsBox.getSize(modelSize);

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
  const resetDirection = new THREE.Vector3(0.72, 0.36, 1).normalize();
  camera.position.copy(modelCenter).addScaledVector(resetDirection, fittedDistance(resetDirection) * 1.18);

  meshCountEl.textContent = IS_BP3D
    ? `${entries.length} curated concepts · ${MODEL_PROFILE}`
    : `${entries.length} named spike meshes`;
  loadTimeEl.textContent = `${((performance.now() - LOAD_STARTED_AT) / 1000).toFixed(1)}s`;

  // FIRE-0 foundations: real cord centreline + pathway graph (BP3D only).
  cordFrame = IS_BP3D ? computeCordFrame() : null;
  fireGraph = cordFrame
    ? buildFireGraphPathways({ THREE, Vector3: THREE.Vector3, findEntry, getEntryCenter, cordPointAt, radius: modelRadius })
    : null;

  landmarkLabels = LANDMARK_LABELS
    .map(def => ({ ...def, entry: findEntry(new RegExp(def.pattern, 'i')) }))
    .filter(d => d.entry);
  createCategoryToggles();
  renderOptionalList();
  applyGhostMode();
  ensureSliceHelper();
  applySlice();
  updateVisibility();
  updateExplode(0);
  renderSelectedActions();

  const preferred = entries.find(e => /left thalamus/i.test(e.name)) || defaultEntries[0];
  if (preferred) selectEntry(preferred, { focus: false });
  setView('reset');
  if (livingModeInput.checked && !prefersReducedMotion) {
    const seqAtPrep = ignitionSeq;
    setTimeout(() => { if (ignitionSeq === seqAtPrep) ignitePathway('visual'); }, 950);
  } else {
    setCaption('LIVING NEURAXIS', 'Enable ambient activity, then press Awaken Neuraxia to ignite the circuits.');
  }
}

const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

function onModelLoaded(gltf) {
  try {
    prepareModel(gltf);
    loaderFill.style.width = '100%';
    loaderText.textContent = 'Territory ready.';
    setTimeout(() => loaderEl.classList.add('done'), 350);
  } catch (err) {
    console.error(err);
    loaderText.textContent = `Model loaded, but scene preparation failed: ${err.message}`;
  }
}
function onModelError(err) {
  console.error(err);
  loaderText.textContent = `The ${IS_BP3D ? 'BodyParts3D candidate' : 'spike model'} could not be loaded. Check the browser console and model path.`;
}

// One-file edition support: models embedded as base64 in
// window.__EMBEDDED_MODELS__ (see pipeline/build_single_file.py). Inert in
// normal builds.
const EMBEDDED_MODELS = (typeof window !== 'undefined' && window.__EMBEDDED_MODELS__) || null;
function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

if (EMBEDDED_MODELS) {
  const wanted = IS_BP3D ? `bp3d-${MODEL_PROFILE}` : 'spike';
  const fallback = `bp3d-${MODEL_PROFILE}`;
  const key = EMBEDDED_MODELS[wanted] ? wanted : fallback;
  const b64 = EMBEDDED_MODELS[key];
  if (b64) {
    loaderFill.style.width = '35%';
    loaderText.textContent = key !== wanted
      ? 'One-file edition: loading the BodyParts3D candidate (comparison spike not embedded)…'
      : 'Unpacking the embedded neuraxis…';
    setTimeout(() => {
      loaderFill.style.width = '70%';
      gltfLoader.parse(base64ToArrayBuffer(b64), '', onModelLoaded, onModelError);
    }, 40);
  } else {
    onModelError(new Error('Embedded model missing'));
  }
} else {
  gltfLoader.load(
    MODEL_URL,
    onModelLoaded,
    xhr => {
      if (xhr.total) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        loaderFill.style.width = `${Math.max(7, pct)}%`;
        loaderText.textContent = `Entering the territory… ${pct}%`;
      }
    },
    onModelError
  );
}

setMobilePanel(document.body.dataset.mobilePanel || 'explore');
document.querySelectorAll('[data-mobile-panel-button]').forEach(button =>
  button.addEventListener('click', () => setMobilePanel(button.dataset.mobilePanelButton)));
document.querySelectorAll('[data-close-mobile-panel]').forEach(button =>
  button.addEventListener('click', () => setMobilePanel('explore')));
if (typeof compactLayoutQuery.addEventListener === 'function') {
  compactLayoutQuery.addEventListener('change', event => {
    if (event.matches) setMobilePanel('explore');
  });
}
let searchActiveTimer = null;
searchInput.addEventListener('focus', () => {
  if (searchActiveTimer) clearTimeout(searchActiveTimer);
  document.body.classList.add('search-active');
  if (isCompactLayout()) setMobilePanel('controls');
});
searchInput.addEventListener('blur', () => {
  // Delay the sheet's return trip so a tap on a result can land first:
  // blur fires on pointerdown and would otherwise move the button away.
  searchActiveTimer = setTimeout(() => document.body.classList.remove('search-active'), 350);
});

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
labelsEnabledInput.addEventListener('change', () => {
  setCaption('LABELS', labelsEnabledInput.checked
    ? 'Landmark labels on — deep structures join when x-ray or a slice reveals them.'
    : 'Labels off. The territory speaks geometry again.');
});

/* ── Sprint 3 · IGNITE transport wiring ───────────────────────────── */
ignitePlayEl.addEventListener('click', () => {
  if (!pathwayAnimations.length) return;
  if (!ignite.playing && pathwayAnimations.every(a => a.finished)) restartIgnitions();
  else { ignite.playing = !ignite.playing; updateIgniteTransportUI(); }
});
igniteRestartEl.addEventListener('click', restartIgnitions);
ignitePrevEl.addEventListener('click', () => stepStation(-1));
igniteNextEl.addEventListener('click', () => stepStation(1));
igniteSpeedEl.addEventListener('click', () => {
  const speeds = [0.5, 1, 2, 4];
  ignite.speed = speeds[(speeds.indexOf(ignite.speed) + 1) % speeds.length];
  updateIgniteTransportUI();
});
igniteStepEl.addEventListener('click', () => {
  ignite.step = !ignite.step;
  updateIgniteTransportUI();
  if (ignite.step) setCaption('STEP BY SYNAPSE', 'The signal now pauses at every synapse and decussation. Press play to release it to the next event.');
});
igniteFollowEl.addEventListener('click', () => {
  ignite.follow = !ignite.follow;
  updateIgniteTransportUI();
});
igniteOrdersEl.addEventListener('click', () => {
  ignite.orders = !ignite.orders;
  for (const a of pathwayAnimations) applyLineColors(a);
  updateIgniteTransportUI();
});
igniteLesionEl.addEventListener('click', () => {
  ignite.lesionMode = !ignite.lesionMode;
  updateIgniteTransportUI();
  if (ignite.lesionMode) setCaption('LESION PROBE', 'Tap a station chip to interrupt the pathway there and watch downstream go dark. Tap the same chip again to heal it.');
});
igniteLoopEl.addEventListener('click', () => {
  ignite.loop = !ignite.loop;
  updateIgniteTransportUI();
});
igniteCloseEl.addEventListener('click', () => {
  clearIgnitions();
  setCaption('IGNITE CLEARED', 'Pathway lines withdrawn. The territory is quiet anatomy again — ignite any tract to run the timeline.');
});
igniteScrubEl.addEventListener('input', () => {
  ignite.scrubbing = true;
  seekAll(Number(igniteScrubEl.value) / 1000);
});
igniteScrubEl.addEventListener('change', () => { ignite.scrubbing = false; });
controls.addEventListener('start', () => {
  if (ignite.follow) { ignite.follow = false; updateIgniteTransportUI(); }
});
document.querySelectorAll('[data-preset]').forEach(btn =>
  btn.addEventListener('click', () => applyLayerPreset(btn.dataset.preset)));
explodeInput.addEventListener('input', () => updateExplode());
isolateInput.addEventListener('change', () => {
  updateVisibility();
  renderSelectedActions();
});

sliceEnabledInput.addEventListener('change', () => {
  applySlice();
  setCaption('SLICE LAB', sliceEnabledInput.checked
    ? sliceAnatomicalNote(Number(slicePositionInput.value) || 0)
    : 'Slice removed — the whole neuraxis is back together.');
});
slicePositionInput.addEventListener('input', applySlice);
slicePositionInput.addEventListener('change', () => {
  if (sliceEnabledInput.checked) setCaption('SLICE LAB', sliceAnatomicalNote(Number(slicePositionInput.value) || 0));
});
document.querySelectorAll('[data-slice-axis]').forEach(btn =>
  btn.addEventListener('click', () => {
    sliceAxis = btn.dataset.sliceAxis;
    sliceEnabledInput.checked = true;
    applySlice();
    setCaption('SLICE LAB', sliceAnatomicalNote(Number(slicePositionInput.value) || 0));
  }));
document.querySelector('#sliceFlip').addEventListener('click', () => {
  sliceFlipped = !sliceFlipped;
  sliceEnabledInput.checked = true;
  applySlice();
  setCaption('SLICE LAB', sliceAnatomicalNote(Number(slicePositionInput.value) || 0));
});
document.querySelector('#sliceReset').addEventListener('click', () => {
  configureSlice({ enabled: false, axis: 'sagittal', position: 0, flipped: false });
  setCaption('SLICE LAB', 'Slice removed — the whole neuraxis is back together.');
});
restoreStructuresBtn.addEventListener('click', () => restoreStructureModes(true));

document.querySelectorAll('[data-tour]').forEach(btn =>
  btn.addEventListener('click', () => startTour(btn.dataset.tour)));
tourBackBtn.addEventListener('click', () => {
  if (!activeTour || tourStepIndex === 0) return;
  tourStepIndex--;
  runTourStep();
});
tourNextBtn.addEventListener('click', () => {
  if (!activeTour) return;
  if (tourStepIndex >= activeTour.steps.length - 1) endTour(true);
  else { tourStepIndex++; runTourStep(); }
});
tourExitBtn.addEventListener('click', () => endTour(true));
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
  if (ev.key === 'Escape' && activeTour) {
    endTour(true);
    return;
  }
  if (ev.key === '/' && document.activeElement !== searchInput) {
    ev.preventDefault();
    searchInput.focus();
  }
});

canvas.addEventListener('pointerdown', ev => {
  controls.autoRotate = false;
  mobileHintEl?.classList.add('is-hidden');
  pointerStart = { x: ev.clientX, y: ev.clientY, t: performance.now() };
});
canvas.addEventListener('pointercancel', () => { pointerStart = null; });

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
  const hits = raycaster.intersectObjects(visibleMeshes, false);
  const hit = hits.find(h => !sliceEnabledInput?.checked || slicePlane.distanceToPoint(h.point) >= -0.0001);
  if (!hit) return;
  const entry = entries.find(e => e.mesh === hit.object);
  if (entry) selectEntry(entry);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(renderPixelRatio);
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
  if (ignite.follow && ignite.playing && signalHead && !cameraAnimation && !journeyAnimation) {
    const followDelta = signalHead.clone().sub(controls.target).multiplyScalar(0.07);
    controls.target.add(followDelta);
    camera.position.add(followDelta);
  }
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
  if ((labelFrame++ % 2) === 0) updateLabels();

  frames++;
  if (now - fpsTime >= 600) {
    const measuredFps = Math.round((frames * 1000) / (now - fpsTime));
    fpsEl.textContent = String(measuredFps);
    if (QUALITY_MODE === 'auto' && entries.length) {
      if (measuredFps < 28) {
        slowWindows++;
        if (slowWindows >= 3 && renderPixelRatio > 1) {
          renderPixelRatio = Math.max(1, renderPixelRatio - 0.25);
          renderer.setPixelRatio(renderPixelRatio);
          slowWindows = 0;
        }
      } else {
        slowWindows = 0;
      }
    }
    drawCallsEl.textContent = String(renderer.info.render.calls);
    const tris = renderer.info.render.triangles;
    triCountEl.textContent = tris >= 1000 ? `${(tris / 1000).toFixed(0)}k` : String(tris);
    frames = 0;
    fpsTime = now;
  }
}
requestAnimationFrame(tick);
