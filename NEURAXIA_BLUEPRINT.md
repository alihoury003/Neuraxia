# NEURAXIA — Product & Experience Blueprint

**Status:** Name and identity direction locked — editable later, but this is the flag we build under now.
**Locked mark:** Design III — *Cortical Island* (`brand/neuraxia-mark-design-iii-source.png`)
**Founder goal:** Build serious educational scholarship for a future neurosurgery / neurology residency application.
**First release:** Layer 0 + FIRE IT + FLY IT. The other seven modules are designed into the architecture and added in later releases.

---

## 1. The North Star

> **Neuraxia is an explorable living territory of the human brain and spinal cord: dissect it, ignite its pathways, and travel inside it.**

Neuraxia is not “another anatomy viewer.” A normal atlas shows a structure and a paragraph. Neuraxia treats the central nervous system as a country:

- Structures are **territories**
- White-matter tracts are **routes**
- Nuclei are **cities / command centres**
- Ventricles are **rivers and caverns**
- Cranial nerves are **expeditions**
- Electrical impulses are **travellers**
- Lesions are **events that alter the territory**

**Public tagline:** *Neurons at your fingertips.*

**Academic subtitle:** *Neuraxia: An Interactive 3D Atlas of the Human Brain and Spinal Cord*

## 2. Audience and outcome

### Primary
Medical students learning neuroanatomy and preparing for neurology / neurosurgery clerkships, shelf examinations, and USMLE-style reasoning.

### Secondary
Neurology and neurosurgery residents, anatomy instructors, and advanced curious learners.

### Learning promise
After using Neuraxia, a learner should be able to:
1. Find and spatially orient major brain and spinal-cord structures in 3D.
2. Trace a signal through its neurons, synapses, and decussation.
3. Explain *why* a deficit appears on a particular side and at a particular level.
4. Mentally travel through ventricular, cranial-nerve, and spinal pathways rather than memorising flat diagrams.

## 3. The identity: Neural Topography

Design III gives us the art direction: **luxury biological cartography.**

Neuraxia should feel like a cross between:
- A high-end scientific observatory
- A luxury atlas of an undiscovered country
- A neurosurgical planning station
- A cinematic voyage inside the nervous system

### Palette
- **Abyss:** `#070708` — the dark observatory
- **Copper Contour:** `#D9A48E` — primary identity colour, taken from Design III
- **Deep Copper:** `#9C6B58` — rules, borders, secondary contours
- **Pearl:** `#F4EFE8` — primary text and neutral anatomy highlights
- **Signal Cyan:** `#20D7E5` — reserved only for living impulses and the active focal point; never decoration

### Typography direction
- Display: an elegant high-contrast serif for NEURAXIA and chapter titles
- UI: a clean modern grotesk for controls, labels, and data
- Micro-labels: letter-spaced uppercase cartography labels

### Brand rules
- No bright “medical app blue” theme.
- No cartoon brain mascot.
- No generic white dashboard.
- Copper is the land. Cyan is life/electricity. Pearl is knowledge.
- The contour language of Design III should recur in maps, loaders, transitions, empty states, posters, and social content.

## 4. The WOW Contract

The website does not pass review unless all seven rules are true:

1. **Five-second reaction:** A first-time visitor must say “wow” before reading a paragraph.
2. **No ordinary hero section:** The opening is an entrance into a territory, not text-left/image-right marketing.
3. **Nothing important is static:** Structures assemble, separate, glow, recede, ignite, or invite travel.
4. **Every click changes the world:** Selecting a structure changes camera, light, context, and available journeys — not just a side panel.
5. **Signals visibly travel:** Pathways are experienced in time, with synapses and crossings as events.
6. **The camera can enter:** At least some anatomy is experienced from the inside, not only orbited from outside.
7. **Beauty must teach:** Every spectacle is tied to a structure, pathway, spatial relationship, or clinical consequence.

“Wow” comes from choreography, depth, light, discovery, and scale — not clutter.

## 5. Product structure

Neuraxia has three primary modes:

### A. DISSECT — Layer 0, the atlas foundation
### B. IGNITE — FIRE IT, living pathways
### C. ENTER — FLY IT, internal journeys

Future modules — ZOOM, OPERATE, BREAK, SLICE, FLOW, SEIZE, REBUILD, GROW — plug into the same anatomy graph and identity system.

## 6. DISSECT: Layer 0 specification

### Scene
A complete central nervous system scene:
- Cerebral hemispheres and lobes
- Major gyri/sulci where data allows
- Insula and opercula
- Corpus callosum and major commissural fibres
- Basal ganglia / deep telencephalic nuclei
- Thalamus, Hypothalamus, epithalamus, subthalamus
- Midbrain, pons, medulla and concept-level brainstem nuclei/tracts
- Cerebellum and deep cerebellar nuclei
- Ventricular system
- Major white-matter tracts
- Cranial nerves
- Circle of Willis, major cerebral arteries, and dural venous sinuses
- Meninges and skull as optional contextual shells
- Spinal cord, enlargements, conus, cauda equina context, and level-specific internal organisation

Exact structure count will be determined by the dataset audit. We will report the real count; we will not invent a marketing number.

### Core interactions
- **Orbit / zoom / pan** with cinematic inertia and camera presets: Front, Back, Side, Superior, Inferior, Surgeon’s View
- **Assemble ↔ Disassemble slider:** the neuraxis separates into a spatial inventory and returns
- **Layer control:** shell → cortex → white matter → deep nuclei → ventricles → brainstem/cord
- **System toggles:** cortical, deep nuclear, limbic, brainstem, cerebellar, ventricular/CSF, tract, cranial nerve, vascular, meningeal/skull, spinal
- **Search:** instant search by preferred name, synonym, abbreviation, and source identifier; keyboard shortcut `/`
- **Select:** click/tap any structure to isolate or ghost everything else
- **Solo / Hide / Ghost / Restore** per structure and per system
- **Clipping planes:** axial, coronal, sagittal, reversible
- **Spinal level slider:** travel C1 → sacral while cord cross-section and tract organisation change
- **Labels:** leader-line labels with collision control; quiz mode hides them
- **Neighbour mode:** show what touches, feeds, drains, or endangers the selected structure
- **Screenshot / share view:** preserve camera and state in a URL

### Structure card
Every selectable structure opens a field dossier:
- Name and pronunciation-ready spelling
- One-sentence identity
- Function in plain language
- Inputs → outputs
- Neighbours and surgical danger relations
- Blood supply where relevant
- “If this fails…” clinical consequence
- High-yield pearl
- Actions: **Ignite pathway**, **Enter / Fly here**, **Isolate**, **Add to tour**
- Source and review status

## 7. IGNITE: FIRE IT specification

FIRE turns static tract diagrams into time-based journeys.

### First six pathways
1. **Dorsal column–medial lemniscus** — fine touch, vibration, conscious proprioception
2. **Spinothalamic** — pain and temperature
3. **Lateral corticospinal** — voluntary movement
4. **Visual pathway** — retina to visual cortex
5. **Pupillary light reflex** — CN II → pretectal circuitry → CN III
6. **Monosynaptic stretch reflex** — spindle → dorsal root → alpha motor neuron → muscle

### Signature interaction
**Race the decussations:** launch dorsal-column and spinothalamic signals simultaneously from the same body point and watch one cross in the cord and the other in the medulla. This single visual explains a classic examination distinction better than a paragraph.

### Controls
- Play / pause / restart
- Time scrubber
- Speed control
- Step-by-synapse mode
- Camera follows signal or remains free
- Toggle neuron order labels: first-, second-, third-order
- Toggle side-of-body consequence display
- Decussation event marker with an explanation card
- Compare two pathways side by side or overlaid

### Educational rule
Every animation must answer four questions visibly:
- Where does it start?
- Where does it synapse?
- Where does it cross?
- What happens if it is interrupted here?

## 8. ENTER: FLY IT specification

FLY turns anatomy into first-person travel.

### First three journeys
1. **Ventricular Voyage**
   Lateral ventricle → interventricular foramen → third ventricle → cerebral aqueduct → fourth ventricle → apertures. CSF particles travel with the camera.

2. **Optic Expedition**
   Orbit/optic nerve → optic canal → chiasm → optic tract → lateral geniculate nucleus → optic radiations → visual cortex. This journey bridges ENTER and IGNITE.

3. **Descent of the Neuraxis**
   Foramen magnum → cervical cord → thoracic cord → lumbar enlargement → conus → cauda equina. A level indicator and changing cord cross-section accompany the descent.

### Controls
- Guided cinematic mode with checkpoints
- Free-fly mode
- Speed control
- Look-around while moving
- Chapter markers and “exit to atlas” at the exact structure being viewed
- Interior labels that fade based on proximity
- Reduced-motion alternative for accessibility

## 9. The 90-second proof demo

Our first public demo should be scriptable as a social-media clip:

1. **0–5s:** Darkness. One cyan pulse crosses black. Copper contours draw the Neuraxia island.
2. **5–15s:** The contours resolve into the assembled brain and spinal cord.
3. **15–25s:** The neuraxis disassembles into territories, then returns.
4. **25–45s:** Two sensory signals race upward and cross at different levels.
5. **45–65s:** Camera dives into the ventricular system.
6. **65–80s:** Camera exits into a selected deep nucleus and reveals its connections.
7. **80–90s:** Pull back to the whole territory. **NEURAXIA — Dissect. Ignite. Enter.**

If this clip does not make a medical student stop scrolling, the experience needs more work.

## 10. Opening website experience

The landing experience is the product trailer and entrance, not a brochure.

### Sequence
1. Near-black screen with a faint topographic island.
2. A signal travels through the contours.
3. “NEURAXIA” resolves in elegant type.
4. Copy: **The brain is a territory. Enter it.**
5. Three gates appear: **DISSECT · IGNITE · ENTER**
6. Choosing a gate moves the camera into the same living scene — no abrupt page change.

### Interface language
- Full-screen 3D observatory
- Floating obsidian-glass panels with hairline copper rules
- Cartographic coordinates and scale cues instead of generic dashboard widgets
- Small, precise labels; few large buttons
- Desktop-first spectacle, responsive mobile experience
- Optional subtle sound design, off by default

## 11. Data and medical-integrity strategy

We do **not** invent anatomy. Neuraxia’s credibility depends on traceability.

### Dataset audit candidates
Candidate open sources will be scored before selection, including:
- BodyParts3D
- Z-Anatomy
- Scalable Brain Atlas resources
- SPL / Open Anatomy resources
- FreeSurfer-derived sample segmentations where licence permits
- Specialised tractography resources for pathway geometry

### Scoring criteria
- Brain and spinal-cord coverage
- Structure granularity
- Mesh naming and hierarchy
- Separate selectable structures
- Tract availability
- Licence and attribution requirements
- Geometry quality and file size
- Ability to simplify/compress
- Documentation and provenance

### Content pipeline
Source meshes → cleaning → decimation → naming/ontology mapping → grouping → glTF/GLB optimisation → metadata JSON → browser streaming.

### Integrity rules
- Every visible structure has a source identifier.
- Every educational claim has a reference or reviewer note.
- Geometry simplified for performance is disclosed in an About/Data page.
- Uncertain or concept-level reconstructions are labelled as educational schematics.
- Faculty review is sought before public educational claims or publication.

## 12. Data model

Each structure is a node in an anatomy graph:

- `id`
- Preferred name and synonyms
- Latin / Terminologia Anatomica name where available
- Parent system and subregion
- Source dataset and source mesh IDs
- Side: left / right / midline / bilateral
- One-line identity
- Function
- Inputs and outputs
- Neighbours
- Vascular supply
- Clinical consequence
- High-yield pearl
- Pathway participation
- Fly checkpoints
- Search keywords
- Review status and references

Pathways are first-class objects:
- Ordered waypoints
- Neuron order
- Synapse stations
- Decussation point
- Side logic
- Modality
- Narration events
- Camera keyframes

## 13. Technical direction

### Proposed stack
- React + TypeScript + Vite
- Three.js / React Three Fiber + Drei
- Post-processing for restrained bloom/depth
- Zustand for scene state
- GSAP or equivalent for choreographed camera/timeline motion
- glTF/GLB with meshopt or Draco compression
- Static anatomy/media delivery first; accounts/progress later

### Performance budgets
- Product shell appears before the full anatomy finishes loading.
- Anatomy loads progressively by region/system.
- Target 60 fps on a typical modern laptop for the default scene.
- Mobile receives reduced geometry/effects rather than a broken experience.
- Every loading state uses the Neuraxia contour system; no generic spinner.

### Accessibility
- Keyboard search and structure navigation
- Reduced-motion mode
- Captions for narrated/timed events
- Colour is never the only carrier of meaning
- Text alternatives for pathways and journeys

## 14. Build roadmap

### Sprint 0 — Blueprint and identity lock
- This document
- Locked source mark and art direction
- Product scope and demo script

### Sprint 1 — Data proof, not a pretty shell
- Audit datasets and licences
- Build a scoring matrix
- Load one real brain/cord dataset in the browser
- Measure structure count, file size, FPS, and selection feasibility
- Decide the production dataset(s)

### Sprint 1B — Direct BodyParts3D production candidate ✅ internal milestone
- Hierarchy-led/manual FJ curation: 202 components merged into 182 concepts
- Provenance-rich OBJ→GLB pipeline with desktop/mobile Meshopt tiers (2.32 MB / 1.49 MB)
- Structural + Three.js loader validation: 0 errors
- Completeness score: BodyParts3D 68.5/100 vs Z-derived spike 52.8/100
- App defaults to the BP3D candidate; spike retained only for comparison
- Public/commercial release remains gated on DBCLS licence clarification and expert anatomy sign-off
- First-six FIRE pathways audited: hybrid authored/atlas-guided geometry, not a tractography drop-in

See `research/sprint-1b/reports/SPRINT_1B_DECISION_REPORT.md`.

### Sprint 1C — DISSECT alpha + FIRE-0 foundation ✅ internal milestone
- Fixed a startup crash (missing metric IDs) and made BP3D model serving snapshot-proof (Vite plugin, no symlinks)
- Dossiers (60+ families, review-pending), layer presets, ghost/x-ray, optional-layer browser, curated disassembly, performance HUD
- FIRE-0: cord centreline computed from the BP3D mesh; CST/DCML/STT as neuron-order graphs with ◆ decussation and ○ synapse events; Node geometry regression test passes
- See `research/sprint-1c/SPRINT_1C_NOTES.md`

### Sprint 1D — FIRE brain circuits + GitHub readiness ✅ internal milestone
- All six V1 pathways are now FIRE graphs: vision (chiasm nasal/temporal sort + Meyer/Baumgarten loops), pupillary (bilateral pretectal fork), stretch reflex (schematic arc + camera focus)
- Audited and repaired non-persisted 1C wiring (markers/stations, curve resolver, listeners, curated explode)
- Dossier coverage 104/104 families; adaptive pixel-ratio quality
- Git initialised + committed; MIT code licence + DATA_NOTICE; GitHub Pages workflow (geometry test in CI); DBCLS email drafted
- See `research/sprint-1d/SPRINT_1D_NOTES.md` and `GITHUB_DEPLOY.md`

### Sprint 1E — Phone & tablet shell ✅ internal milestone
- Compact bottom-sheet UI (Explore / Details / FIRE / Controls), safe areas, 100dvh, ≥44px targets, responsive camera fit; deployed live to GitHub Pages and confirmed on the owner's iPhone
- See `research/sprint-1e/SPRINT_1E_RESPONSIVE_NOTES.md`

### Sprint 2A — DISSECT proper (first tools) ✅ internal milestone
- Per-structure Focus / Solo / Ghost others / Ghost this / Hide / Pulse here / Restore, with FIRE routes derived per structure from the pathway graph
- Slice lab: sagittal/axial/coronal clipping planes with flip + raycast respect
- Guided tours (3) composing presets, focus, explode, slice and FIRE ignitions
- See `research/sprint-2/SPRINT_2A_DISSECT_NOTES.md`


### Sprint 2B — Labels + neighbours ✅ internal milestone
Floating landmark labels with leader lines (collision- and UI-aware, deep labels only when revealed) and a neighbour mode that derives adjacency from live mesh bounding-box gaps + FIRE graph stations, with tappable chips and copper glows — explicitly labelled a teaching approximation, not surgical adjacency. Workspace cleaned 176 MB → 39 MB in the same turn. Suites: 2B all-pass, 2A regression all-pass, FIRE geometry exit 0. Notes: `research/sprint-2/SPRINT_2B_LABELS_NEIGHBOURS_NOTES.md`. **Sprint 2A + 2B shipped with Sprint 3 in the milestone ZIP (see Sprint 3 below).**

### Sprint 3 — IGNITE timeline engine ✅ internal milestone
Floating IGNITE console: play/pause/restart, proportional timeline scrubber, 0.5–4× speed, station stepper + tappable station chips, step-by-synapse auto-pause, neuron-order line colouring (1°–4°) with legend, follow-the-signal camera, loop, and a ✕ lesion probe that clamps the pulse at a chosen station, darkens downstream, and shows a draft lesion story per pathway. Fixed a latent Sprint-1C bug (markers built per entry, consumed per station — final stations of CST/DCML/STT never fired); curves are now cached between explode changes; auto-ignitions (on-load demo, Awaken) can no longer stomp a user ignition. Suites: Sprint 3 all-pass (step-pause scrub 500, lesion clamp 880), 2B all-pass, 2A regression all-pass, geometry exit 0. Notes: `research/sprint-3/SPRINT_3_IGNITE_NOTES.md`. **Milestone delivery: Sprints 2A + 2B + 3 ship together in `neuraxia-MILESTONE-sprint3.zip` (awaiting owner GitHub upload).**

### Sprint 2 — DISSECT alpha (original plan; largely delivered by 1C + 2A)
- Viewer, camera presets, system toggles
- Search and selectable structures
- Isolate/ghost/hide
- Assemble/disassemble
- Structure dossiers for the first anatomy set

### Sprint 3 — IGNITE alpha
- Animation/timeline engine
- Six pathways
- Synapse and decussation events
- Race-the-decussations interaction

### Sprint 4 — ENTER alpha
- Camera-path engine
- Ventricular Voyage
- Optic Expedition
- Descent of the Neuraxis

### Sprint 5 — Experience polish and learner test
- Opening sequence
- Motion/sound polish
- Mobile optimisation
- Test with medical students
- Record the 90-second demo

### Later releases
ZOOM → SLICE → BREAK → OPERATE → FLOW → SEIZE → REBUILD → GROW, ordered by educational value and feasibility after the first-release test.

## 15. Residency / scholarship strategy

The app is only the first artifact. The residency asset is the chain:

**Working platform → faculty-validated content → learner study → conference abstract/poster → manuscript and founder narrative**

Planned evaluation:
- Time required to locate structures
- Accuracy tracing pathways and predicting side/level
- Confidence before/after
- Seven-day retention
- Comparative usability against a conventional atlas/flat diagrams
- Qualitative interviews with students and instructors

A neurosurgery/neurology faculty mentor should be approached once Sprint 1 proves the data and a compelling alpha exists.

## 16. Risks and controls

| Risk | Control |
|---|---|
| Dataset lacks required granularity | Sprint 1 audit; combine datasets only with careful registration or use schematic overlays labelled as such |
| Model is too heavy for browsers/mobile | Decimation, compression, progressive loading, quality tiers |
| Beautiful but hard to learn from | Learning objectives and learner testing from alpha onward |
| Medical inaccuracy | Source IDs, references, review states, faculty validation |
| Scope explosion | First release is DISSECT + IGNITE + ENTER only; all other modules wait |
| Motion sickness / accessibility problems | Guided speeds, free-camera alternatives, reduced-motion mode |

## 17. Default decisions

To avoid stalling:
- **Desktop-first spectacle**, mobile-responsive from the start
- **English first**; Arabic/French can be added through the content model later
- **No account required** for the first public alpha
- **No generative-AI medical answers** in the first release; educational content is curated and referenced
- **Founder-led identity:** Neuraxia should look ownable on a CV, poster, social profile, and eventual publication

## 18. MVP acceptance criteria

The first release is ready to show a faculty mentor only when:
- A learner can find any included structure by search in under 10 seconds.
- The neuraxis can be disassembled and reconstructed smoothly.
- Six pathways animate with correct synapses, side logic, and decussations.
- Three fly-through journeys run without camera clipping chaos.
- Every included structure has a reviewed dossier or is explicitly marked “review pending.”
- The opening sequence passes the five-second wow test with people who did not build it.
- The 90-second demo can be recorded without narration explaining away broken interactions.

## 19. Immediate next actions

1. **Clear the release gates:** obtain DBCLS licence clarification and expert neuroanatomy review of the Sprint 1B candidate.
2. **Profile the real browser experience:** GPU frame time, raycasting, touch and memory on desktop/mobile.
3. **Build DISSECT alpha properly:** reviewed structure dossiers, ghost/layer controls, optional-structure browser and curated disassembly vectors.
4. **Build FIRE-0:** BP3D cord coordinates plus an explicit neuron-order/synapse/decussation graph; lateral CST and DCML first.
5. **Audit licensed gap-fillers:** Allen Human Reference Atlas 3D labels/registration for the small nuclei BP3D lacks.
6. **Identity redraw:** convert Design III into scalable vector versions once the alpha experience stabilises.

> Next execution command: **REAL-DEVICE PASS (iPhone/iPad FPS + gestures), SEND DBCLS EMAIL, then SPRINT 2B — labels + neighbour mode**
