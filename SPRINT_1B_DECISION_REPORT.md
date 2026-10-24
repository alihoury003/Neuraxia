# NEURAXIA Sprint 1B — Decision report

**Date:** 24 October 2026  
**Dataset:** `neuraxia-bp3d-cns-sprint1b-v0.1`  
**Production direction:** direct BodyParts3D 4.3 through Neuraxia's own traceable pipeline

## Decision in one page

### GO — internal Layer-0 candidate

Sprint 1B successfully converted a hierarchy-led, manually adjudicated BodyParts3D CNS selection into compact browser GLBs:

- **182 selectable concepts** from **202 FJ source components**
- **171 concepts visible by default** and 11 retained as searchable optional structures
- **2.32 MB desktop Meshopt GLB** (373,682 triangles)
- **1.49 MB mobile Meshopt GLB** (189,484 triangles)
- node+mesh `extras.neuraxia` metadata with concept, FJ/BP/FMA identifiers, category, side, provenance hashes and quality flags
- **0 errors** in the independent structural audit and Three.js r180 loader/Meshopt validation for raw and compressed outputs

The candidate is now the app's default dataset for internal development. The Z-derived Sprint 1 GLB remains available only through a dataset switch for visual comparison; it contributes **no geometry** to Sprint 1B.

### NO-GO — public or commercial release today

Two external gates remain:

1. **Licence confirmation:** DBCLS's current official page says CC BY 4.0, but legacy BodyParts3D material and third-party sources point to CC BY-SA 2.1 Japan. Written clarification or an approved conservative share-alike release strategy is required.
2. **Expert anatomy sign-off:** curation was geometry/hierarchy audited and QA-rendered, but a neuroanatomist/neurology/neurosurgery reviewer has not yet signed off the merged concepts, side corrections and quality flags.

### GO — next engineering work

Proceed to:

1. **DISSECT alpha polish** on the BP3D candidate: dossier data model, better layering/ghosting, category-specific visibility, and browser/GPU performance testing.
2. **FIRE-0 pathway graph:** build the BP3D cord coordinate system and hybrid lateral-CST/DCML/STT segment model defined in the tract audit. Do not present the current whole-structure pulse routes as production tract anatomy.
3. **External clearance track:** send DBCLS the five questions already drafted in the licence review and recruit an anatomy reviewer.
4. **Gap-filler audit:** inventory Allen Human Reference Atlas 3D labels for claustrum, nucleus accumbens, deep cerebellar nuclei and inferior olive before considering registration.

## Acceptance checklist

| Sprint 1B requirement | Result | Evidence |
|---|---|---|
| Curated FJ list from hierarchy + manual review | **Pass** | `pipeline/select_bp3d_cns.py`; 219 candidates; candidate/not-selected/manual-exclusion CSVs |
| Deduplication / alternate-component rationale | **Pass** | OBJ fingerprints, duplicate contact sheet, `resolve_curation.py`, final curation CSV/JSON |
| OBJ→GLB preserving FJ/BP/FMA/name/side/category | **Pass** | `convert_obj_to_glb.py`; `extras.neuraxia` on every node and mesh |
| Simplification + compression with budgets | **Pass** | 7.24 MB raw desktop, 2.32 MB Meshopt desktop, 1.49 MB Meshopt mobile |
| BP3D-only CNS rendered/scored vs spike | **Pass** | comparison contact sheets; completeness scorecard 68.5 vs 52.8 |
| Licence/provenance reconciliation | **Research pass; release blocked** | `licence-provenance-review.md`, `ATTRIBUTION.md`, `SOURCE_PROVENANCE.json` |
| Separate audit of first six FIRE pathways | **Pass** | `fire-pathway-geometry-audit.md` |
| App integration for inspection | **Pass** | BP3D default, spike switch, desktop/mobile profile, extras-driven search/selection |

## Curation result

### Candidate pool

- 219 FJ candidate components
- 181 source names
- 1,333,172 catalogue triangles
- 90,655,057 catalogue OBJ bytes

The pool came from official BodyParts3D hierarchy/FMA2Obj roots for brain, neuraxis gray matter, ventricular system/choroid plexus, spinal cord, thalamus, Hypothalamus, pineal/pituitary context and cranial dura, plus exact manually reviewed proximal cranial-nerve patterns and three explicit manual FJs for cauda equina/olfactory tracts.

Distal peripheral/autonomic branches were not swept in from the whole neural-tree root. The two “interpeduncular fossa” FJs that initially appeared to be selector omissions are now explicit manual scope exclusions: they are a subarachnoid surface depression/CSF fossa, not solid CNS tissue in the current Layer-0 model.

### Final concepts

Display names are unique in this release candidate, but the stable machine identity is still `concept_id`; UI code must never use a display label or sanitized Three.js object name as the primary key.

| Neuraxia category | Concepts |
|---|---:|
| Cortex | 50 |
| Deep gray / diencephalon / limbic | 57 |
| White matter | 20 |
| Ventricles / CSF | 9 |
| Brainstem · cerebellum · cord axis | 7 |
| Cranial nerves | 35 |
| Meninges | 3 |
| Context | 1 |
| **Total** | **182** |

Final curation includes:

- 202 included source components;
- 17 excluded alternates with FJ-level rationale;
- complementary components merged where geometry showed adjacent parts rather than duplicates;
- side corrections where source labels disagreed with bounds;
- 171 default-visible and 11 optional concepts;
- 1,244,246 included source triangles and 690,390 source vertices.

The optional layer keeps broad/ambiguous geometry—such as whole-brain dura, hemisphere-white-matter context and the long vagus course—searchable without letting it dominate the opening anatomy.

## Conversion and size budgets

| Output | Concepts | Triangles | Vertices | Bytes | Source-triangle retention |
|---|---:|---:|---:|---:|---:|
| Raw desktop GLB | 182 | 373,682 | 187,151 | 7,239,340 | 30.03% |
| Raw mobile GLB | 182 | 189,484 | 95,089 | 3,924,144 | 15.23% |
| Meshopt desktop | 182 | 373,682 | 187,151 | **2,316,592** | 30.03% |
| Meshopt mobile | 182 | 189,484 | 95,089 | **1,492,504** | 15.23% |

The raw desktop target of roughly sub-10 MB is met before compression; Meshopt brings the delivered desktop payload to about one-third of that ceiling.

Method highlights:

- fan triangulation and 0.01 mm weld;
- degenerate/duplicate/unused cleanup;
- a deliberately narrow micro-fragment rule (≤4 faces, ≤1 mm diagonal, ≤1% of the largest component), with removals logged;
- category/concept quadric simplification with protection for tiny structures;
- smooth normals;
- one pickable node/mesh per concept;
- Meshopt high compression with 14-bit position and 10-bit normal quantization.

Coordinate transform:

```text
glTF metres = (source_x, source_z, -source_y) / 1000
```

Thus subject-left is `+X`, superior is `+Y`, anterior is `+Z`. Only Y/Z bounding-box centres are subtracted. The anatomical midline stays at `x=0`; X is never bounding-box centred.

## Completeness vs the Sprint 1 spike

The reproducible scorecard compares all 182 BP3D concepts with the 109 structures visible under the spike app's default CNS categories, while also reporting all 309 spike names in its JSON.

| Dataset | Weighted teaching-atlas score |
|---|---:|
| **BodyParts3D Sprint 1B** | **68.5 / 100** |
| Z-derived Sprint 1 spike | 52.8 / 100 |

Domain scores (`/5`):

| Domain | BP3D | Spike |
|---|---:|---:|
| Cortical surface / gyri | 4.3 | 2.0 |
| Deep gray / diencephalon / Hypothalamus | 4.0 | 3.0 |
| Brainstem / cerebellum | 2.7 | 2.5 |
| Ventricles / CSF | 4.8 | 4.4 |
| White matter / pathway substrates | 2.5 | 2.0 |
| Cranial nerves | 4.4 | 3.3 |
| Spinal cord / cauda | 1.4 | 1.3 |
| Meninges / context | 2.4 | 3.0 |

### Why BP3D wins

- 25 named cortical units per hemisphere rather than a handful of whole lobes;
- unusually strong Hypothalamic/preoptic/periventricular subdivision;
- separate pons, medulla, cerebral crura, colliculi and geniculate bodies;
- bilateral olfactory tracts and CN VIII; all 12 named cranial nerves represented;
- central canal included;
- exact FJ-level source hashes and transformation history.

### What the spike still has that BP3D lacks

- claustrum;
- nucleus accumbens;
- deep cerebellar nuclei;
- inferior olive;
- a distinct septum pellucidum;
- fuller tentorium concept;
- more distal trigeminal branches.

Those meshes are **not** production imports because the spike's object-level Z-Anatomy/Brainder/white-matter provenance remains unproven and its lineage requires share-alike review. Allen Human Reference Atlas 3D is the leading separately licensed candidate for these gaps, subject to label, surface and registration audits.

### Shared teaching gaps

Neither dataset provides production-grade:

- spinal cord segments, horns, funiculi or named cord tracts;
- optic/auditory radiations, cingulum, SLF, ILF, arcuate or uncinate;
- corona-radiata subdivisions, lemnisci or cerebellar peduncles as selectable anatomy;
- systematic cranial-nerve, reticular, raphe, tegmental or dorsal-column nuclei;
- cerebellar lobule/fissure parcellation.

This is why Layer 0 can proceed while FIRE needs its own pathway-geometry layer.

## Validation evidence

### Structural and loader validation

All four GLBs pass:

- `gltf-transform validate` for the uncompressed files;
- independent Python structural/accessor/extras/laterality audit: **0 errors**;
- Node Three.js r180 `GLTFLoader` + `MeshoptDecoder`: **182 meshes, 0 errors** per file.

A real app bug was found and fixed during integration: the browser code had never registered a Meshopt decoder, so required `EXT_meshopt_compression` assets would fail despite successful builds. `app/src/main.js` now imports and registers `MeshoptDecoder` for both datasets.

### Visual QA

Generated and inspected:

- BP3D vs spike side-by-side contact sheet;
- BP3D category-layer contact sheet;
- duplicate-geometry contact sheet;
- focused curation contact sheet for superior parietal alternates, tentorium/dura, temporal-white-matter scope, crura, vagus laterality and stria fragments.

### App integration checks

- `npm run build` passes;
- Vite follows the symlinked public model paths and emits real GLB files in `dist`;
- HTTP HEAD checks return 200 for desktop/mobile BP3D GLBs, spike GLB and attribution sidecar;
- app identity/search/selection uses `userData.neuraxia.concept_id` and `.display_name`, avoiding Three's sanitized Object3D names;
- default-hidden BP3D concepts remain searchable and are revealed on selection.

**Still untested:** real GPU frame time, raycast latency on low-end devices, touch behaviour and long-session memory. Node loader validation is not a substitute for browser performance QA.

## App behaviour after Sprint 1B

The app now:

- loads the Sprint 1B BP3D candidate by default;
- chooses the mobile Meshopt profile on narrow viewports;
- supports `?dataset=spike` for the comparison model and `?profile=desktop|mobile` for forced BP3D profiles;
- displays FJ components, source/profile triangle counts, tier and quality flags for a selected BP3D concept;
- centres and disassembles from the 171 default-visible concepts rather than optional outliers;
- adapts Living Neuraxia's schematic visual, motor and sensory pulses to BP3D stations (LGN/cuneus, precentral/crus/pons/medulla, postcentral gyrus).

Those pulses remain **schematic interaction prototypes**. They connect named-structure centres and are not yet neuron-order/synapse/decussation geometry.

## FIRE IT tract conclusion

The separate tract audit covers dorsal column–medial lemniscus, spinothalamic, lateral CST, visual, pupillary and monosynaptic stretch-reflex pathways.

Headline findings:

- Yeh HCP1065 and ENIGMA can inform cerebral CST, medial lemniscus and optic-radiation centrelines;
- PAM50 can guide spinal posterior-column, lateral-CST, spinal-lemniscus and horn territories, but its data terms need confirmation;
- ORG is mainly useful for CST/generic projections;
- TractSeg reference data is CC BY-NC and should not become production geometry by default;
- no source supplies a complete spinothalamic pathway, pupillary circuit or stretch-reflex arc;
- tractography does not encode synapses, neuron order, direction, crossings or reflex branching.

**Decision:** FIRE IT proceeds as a hybrid authored/atlas-guided pathway graph, with source type and confidence stored per segment. Lateral CST is first; DCML follows; spinothalamic is mostly authored; visual combines BP3D anterior structures with atlas-guided radiations and authored chiasmal sorting; pupillary and stretch reflex are authored circuits/insets.

## Known limitations and quality flags

- Some BP3D source names/sides are unreliable; Neuraxia records corrections and flags instead of silently trusting labels.
- The right tentorium source is half-only; whole-brain dura remains optional context.
- The temporal “white matter” components are hemisphere-scale and therefore hidden context, not a local temporal tract claim.
- The right vagus course is anatomically long and remains optional so it does not distort the default neuraxis framing.
- Many small BP3D nuclei are present as approximate source solids; presence in the catalogue is not yet expert confirmation of boundaries.
- BP/FMA catalogue mappings are many-to-many. FJ ID + OBJ header/hash are the primary provenance anchors.
- The dataset is one adult male source model, not population anatomy.
- Explode/disassembly in the app is a radial teaching transform, not surgical/anatomical separation.

## Release gates and next sprint queue

### External gates

1. Send DBCLS the five licence questions in `licence-provenance-review.md`.
2. Obtain expert review of concept merges, exclusions, laterality corrections, default-hidden items and quality flags.
3. Keep all public output files and sidecars version-locked until those answers are recorded.

### Sprint 1C / DISSECT-alpha engineering

1. Browser GPU profiling on desktop and mobile; measure FPS, first render, raycast cost and memory.
2. Add concept dossier schema linked to `concept_id` (definition, function, blood supply, lesions, relations, references, review state).
3. Add ghost/x-ray/layer ordering controls per category and a proper optional-structure browser.
4. Replace radial explode offsets with curated anatomical disassembly vectors for major territories.
5. Add keyboard/focus and reduced-motion QA.

### FIRE-0

1. Build a BP3D spinal-cord centreline and local cross-section coordinate frame.
2. Implement the pathway graph schema from the tract audit.
3. Build lateral CST and DCML exemplars with explicit decussation and synapse events.
4. Spike-test Yeh CST/ML/OR centreline clustering and MNI→BP3D affine landmark error before importing any bundle into production.

## Artefact map

- `research/sprint-1b/output/` — four GLBs, build reports, `ATTRIBUTION.md`, `SOURCE_PROVENANCE.json`
- `research/sprint-1b/curation/` — candidate pool, fingerprints, final curation, exclusions
- `research/sprint-1b/reports/dataset-completeness-scorecard.{md,json}`
- `research/sprint-1b/reports/glb-structural-audit.{md,json}`
- `research/sprint-1b/reports/three-glb-validation.json`
- `research/sprint-1b/reports/licence-provenance-review.md`
- `research/sprint-1b/reports/fire-pathway-geometry-audit.md`
- `research/sprint-1b/reports/*.png` — comparison and QA contact sheets
- `pipeline/README.md` — reproducibility runbook
- `app/` — dataset-switchable internal viewer

## Final Sprint 1B verdict

**Sprint 1B is complete as an internal data-engineering milestone.** Neuraxia now has a compact, searchable, provenance-rich BodyParts3D Layer-0 candidate and a clear, honest route for production pathway geometry.

It is **not yet a public anatomy release**. The next value jump is not more meshes at any cost; it is browser performance, reviewed dossiers, licence clearance, and the first anatomically explicit FIRE pathway graph.
