# NEURAXIA Sprint 1C — DISSECT alpha + FIRE-0 foundation

**Date:** 24 October 2026
**Builds on:** Sprint 1B BodyParts3D candidate (`neuraxia-bp3d-cns-sprint1b-v0.1`)

## What shipped

### Critical fixes found on entry

1. **Startup crash:** `main.js` wrote to `#modelSizeValue`/`#modelSizeLabel`, but the HTML metrics block never received those IDs — the module threw before loading. Fixed with proper metric cells (FPS, visible meshes, GLB size, draw calls, rendered triangles, model load time).
2. **Missing BP3D models in the app:** the `app/public/models/*.meshopt.glb` symlinks did not survive workspace snapshotting. Replaced with a durable Vite plugin (`app/vite.config.js`) that serves the two Meshopt GLBs straight from `research/sprint-1b/output/` in dev/preview and copies them into `dist/models/` on build. No symlinks, no duplicated payload.

### DISSECT alpha

- **Structure dossiers** (`app/src/dossiers.js`): 60+ structure families with *What it does / Clinical pearl / Pathway role*, keyed by concept family so one dossier serves both sides. Every dossier is badged `draft — expert review pending`. Structures without a dossier get an honest "in preparation" card, never filler anatomy.
- **Layer presets:** Overview · Deep nuclei · Ventricles · White matter · Cranial nerves · Neuraxis — one tap reconfigures categories + ghosting with a teaching caption.
- **Ghost mode (x-ray):** cortex/white matter/context drop to 13% opacity with depth-write off so deep nuclei and ventricles read through the hemisphere.
- **Optional-layer browser:** the 11 default-hidden BP3D concepts are now listed as chips; clicking reveals + focuses the structure (also still searchable).
- **Curated disassembly:** explode vectors are now anatomical rather than purely radial — hemispheres part by curated side, meninges balloon outward, cerebellum drops posteriorly, ventricles lift gently, cranial nerves flare, the axis stretches.
- **Search keyboard navigation:** ↑/↓ + Enter + Esc, with an active-result highlight. `/` focuses search (existing).
- **Performance instrumentation:** live FPS, draw calls and rendered-triangle readouts (`renderer.info`), plus measured model-load time — the baseline for real GPU profiling on user hardware.

### FIRE-0 — pathway graph foundation

- **Cord coordinate frame from source geometry** (`computeCordFrame`): samples the BP3D spinal-cord mesh, bins vertices by height into a 28-point centreline + mean radius (~5.2 mm, anatomically sane). `cordPointAt(t, lateral, ap)` gives cross-sectional territory points (posterior / lateral / anterolateral) that follow real cord curvature and track the mesh during disassembly.
- **Graph data model** (`app/src/pathways.js`): each tract declares its neuron chain, crossing, stations with kinds (`origin / station / synapse / decussation / target`), captions and per-station burst targets. Source honesty is stored in the module header: cerebral waypoints are atlas-guided schematic anchors on real BP3D centres; cord segments are authored schematic on the source centreline; stations BP3D lacks (nucleus gracilis, VPL, dorsal/anterior horn) are labelled schematic in every caption.
- **Three tracts live:** lateral CST (right cortex → pyramidal decussation → left lateral cord → anterior-horn synapse), DCML (left posterior column uncrossed → nucleus gracilis synapse → internal arcuate decussation → medial lemniscus → VPL → right cortex), spinothalamic (right dorsal-horn synapse → anterior-white-commissure crossing → left anterolateral cord → spinal lemniscus → VPL → left cortex). Plus **Race the decussations** (DCML vs STT simultaneously).
- **Visual grammar:** ◆ amber octahedra = decussations (slowly rotating), ○ bright rings/spheres = synapses with stronger bursts, ● = ordinary stations. The FIRE panel shows the full chain and lights each station as the pulse arrives.
- **Awaken sequence** now runs the FIRE-0 race + CST on the BP3D dataset. On the spike dataset, FIRE buttons fall back to the legacy schematics with an explanatory caption.

## Verification

- `node --check` clean on all new/edited modules; `npm run build` passes; `dist/models/` contains all three GLBs via the plugin.
- Dev server: 200 for `/`, both BP3D Meshopt GLBs (plugin-served, correct byte lengths), spike GLB and all three JS modules.
- **Geometry regression test** `app/scripts/test-fire-geometry.mjs` (Node + real GLB): recomputes the cord frame and asserts side logic — CST crosses at the midline point and ends left; DCML cord points are posterior + ipsilateral and it ends in right cortex; STT crosses within its first points and its cord points are anterior; all curves finite (0.44–0.54 m). All checks pass.
- **Visual QA:** `research/sprint-1c/fire-0-tract-qa.png` (frontal + sagittal orthographic routes over the BP3D silhouette; renderer in `pipeline/render_fire_qa.py`).

## Still not done / honest limits

- No GPU frame-time measurement on real user hardware yet — the new HUD makes this a 30-second check on any device, and it remains the top Sprint 1D task.
- FIRE-0 cerebral segments are structure-centre anchors with small offsets, not registered tractography. Yeh/ENIGMA centreline import (with MNI→BP3D landmark error) remains gated on licence-chain clarification, per the Sprint 1B tract audit.
- Remaining FIRE pathways (visual fibre sorting upgrade, pupillary bilateral circuit, stretch-reflex inset) are designed but not yet graph-implemented.
- Dossiers cover 60+ families; the rest intentionally show "in preparation". All remain pre-review drafts.
- Public/commercial release gates unchanged: DBCLS licence clarification + expert anatomy sign-off.

## Next (Sprint 1D queue)

1. Real-device GPU/mobile profiling using the HUD; pixel-ratio auto-quality if needed.
2. visual-pathway graph upgrade (chiasmal nasal/temporal sorting) + pupillary light-reflex bilateral circuit.
3. Dossier completion pass + references field; package for faculty reviewer.
4. Send DBCLS licence questions; Allen label inventory for gap nuclei.
