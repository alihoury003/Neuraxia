# NEURAXIA — Sprint 1 Dataset Audit & Technical Spike

**Date:** 24 October 2026  
**Tagline locked for now:** *Neurons at your fingertips.*  
**Sprint question:** Can legally traceable, named brain + spinal-cord geometry be loaded in a browser, selected structure-by-structure, searched, grouped, and disassembled without turning Neuraxia into a slow generic viewer?

## Executive decision

### Production direction
**Primary candidate: BodyParts3D 4.3, acquired directly from Anatomography/DBCLS endpoints and converted by our own pipeline.**

Why:
- Named FMA-linked component meshes rather than one merged brain.
- Direct provenance for every FJ/BP/FMA identifier.
- Rich CNS detail beyond the simple built-in "brain" subset, including individual hypothalamic nuclei, basal ganglia, ventricles, corpus callosum, cranial nerves, cerebral vessels, central canal, and spinal cord.
- Official current DBCLS licence page states **CC BY 4.0** and requires the attribution: “BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.”

**Licence caution:** Older BodyParts3D materials and the third-party 4.3 downloader describe CC BY-SA 2.1 Japan. Before public release we will preserve the exact source/version record for every mesh and, if needed, seek clarification from DBCLS. We will use the more conservative attribution/provenance workflow until that is resolved.

### Experience-spike direction
For immediate interaction testing, the Sprint 1 app uses Body Atlas's 3.1 MB `nervous.glb`, derived from Z-Anatomy/BodyParts3D. This proves the browser experience today, but it is **not yet approved as the production dataset** because Z-Anatomy material provenance/licensing needs a second pass.

### Benchmark only
Human Atlas is the interaction/performance benchmark, not the product we copy. Its repository packages BodyParts3D 4.0 into 2,234 selectable meshes and 3,432 named concepts, with 2,288,268 triangles and roughly 33 MB compressed geometry. Its app code and anatomy data are under different licences.

---

## What was actually downloaded and measured

### A. BodyParts3D 4.3 direct-source subset

Using the MIT-licensed subset selector code from `olivercase/body_parts_3d_api`, we downloaded the built-in **brain** and **spinal_cord** groups directly from the Anatomography source.

Measured result:

| Metric | Result |
|---|---:|
| OBJ component meshes | 65 |
| Raw OBJ size | 43.64 MB |
| Vertices | 356,916 |
| OBJ face records | 637,700 |
| Overall source bounds | x: −71.15 to 69.70; y: −169.68 to 10.19; z: 1030.56 to 1630.46 |
| Local manifest | `models-spike/bp3d-brain-cord/MANIFEST.csv` |

The built-in group is useful proof, but it is **not the final CNS selection**. It mainly resolves cerebral gyri/insula, thalamus, cerebellum, pons, medulla, and one spinal-cord mesh. It also includes alternate/duplicated modelling components for some named structures.

### B. Full BodyParts3D 4.3 catalogue scan

The full manifest contains **3,210 component meshes**. A first-pass name heuristic for CNS and cranial-nerve anatomy found:

| Metric | First-pass heuristic |
|---|---:|
| Candidate CNS/cranial components | ~189 |
| Unique display names | ~158 |
| Sum of catalogue face counts | ~1,080,932 |
| Sum of raw OBJ bytes | ~72.6 MB |

This is not a final count. Regex alone is not an anatomy ontology. The production selection must be built from the FMA/part-of hierarchy and manually reviewed.

Important discoveries in the catalogue:
- Individual hypothalamic nuclei exist (for example anterior, arcuate, paraventricular, ventromedial, lateral hypothalamic, preoptic, and supraoptic nuclei).
- Basal ganglia structures exist individually: caudate nucleus, putamen, globus pallidus, amygdala, hippocampus proper.
- Ventricular anatomy exists: lateral, third, and fourth ventricles; choroid plexus components.
- Corpus callosum exists as a large single component.
- Optic nerve/tract/chiasm and multiple other cranial nerves exist.
- Cerebral arterial anatomy is extensive.
- `Neural tissue of spinal cord` and `Central canal of spinal cord` exist.
- Cerebral hemisphere dura exists, but the general meninges are not a complete simple set from name search alone.
- The word "midbrain" does not resolve directly by name; production selection must use hierarchy/FMA relationships and synonyms.

### C. Z-Anatomy-derived GLB spike

The temporary GLB used in the Sprint 1 app was parsed locally:

| Metric | Result |
|---|---:|
| File | `nervous.glb` |
| Size | 3,181,356 bytes |
| Nodes / meshes | 309 / 309 |
| Vertices | 212,202 |
| Triangles | 426,563 |
| Materials in source GLB | 1 |

Our first-pass name classifier assigned:
- Cortex: 12
- Deep nuclei: 29
- White matter: 9
- Ventricles / CSF: 8
- Brainstem / cerebellum / cord group: 6
- Meninges: 2
- Cranial nerves: 43
- Peripheral / autonomic: 200

The app enables the CNS/cranial categories by default and leaves peripheral/autonomic structures off.

---

## Source-by-source assessment

## 1. BodyParts3D 4.3 — production frontrunner

### Strengths
- Direct source acquisition is working in this workspace.
- Component-level FJ/BP/FMA provenance is exactly what a scholarly project needs.
- Deep structures are far richer than the showcase "brain" subset suggests.
- Whole catalogue can be selectively downloaded rather than forcing a whole-body product.
- Official download page provides 4.0 bulk archives and metadata; 4.3 can be obtained through the Anatomography endpoints used by the open downloader.

### Weaknesses / work required
- Raw OBJ geometry is too heavy to ship naively.
- Component naming includes duplicates, mirrored copies, alternate components, and concepts split across multiple meshes.
- Major teaching tracts needed for FIRE — corticospinal, dorsal column–medial lemniscus, spinothalamic — should not be assumed to exist as clean ready-made meshes. They need a separate tract-geometry audit or clearly labelled schematic curves anchored to the anatomy.
- Spinal cord is a single external mesh in the quick subset; internal level-specific grey/white organisation must come from additional data or educational schematics.
- Licence-version conflict must be documented and resolved conservatively.

### Verdict
**GO for production pipeline development.** This is the most defensible foundation.

## 2. Z-Anatomy — valuable supplement, licence gate

### Strengths
- Detailed open atlas derived from BodyParts3D.
- Nervous-system GLB derivatives are dramatically smaller and browser-ready.
- Includes structures and organisation that are immediately useful for interaction tests: brain lobes, deep nuclei, internal capsule, fornix, ventricles, aqueduct, cranial nerves, spinal cord, and cauda equina.
- Open Anatomy Atlas reports 2,827 detailed Z-Anatomy meshes and extras including brain nuclei, Latin names, and definitions.

### Weaknesses / work required
- Main atlas is distributed under CC BY-SA terms; some included third-party models have different/non-commercial terms.
- A current Z-Anatomy issue asks for clarification about the provenance/licence of “Brainder” and “White matter” models and notes 174 objects carrying Brain/Brain-Inner/White matter materials. Until that is resolved, those objects should be excluded from a public production build or independently cleared.
- Blender source is large and production conversion requires discipline around object/material provenance.

### Verdict
**GO for private feasibility and visual comparison. HOLD for production redistribution until object-level licence clearance is complete.**

## 3. Human Atlas — benchmark, not base

### Strengths
- Proves large named anatomy can work responsively in a browser.
- Useful ideas: batched geometry, GPU-side per-structure state, search/inspection contracts, exploded layout packing, on-demand chunks in later forks.
- Open-source code under MIT; anatomy separately attributed.

### Weaknesses for Neuraxia
- Whole-body scope and custom `.bin` packaging are not the cleanest starting point for a CNS-only educational graph.
- Cloning its architecture or visual language would make Neuraxia look derivative — exactly what we are avoiding.

### Verdict
**Benchmark performance and interaction patterns. Do not fork as the identity of Neuraxia.**

## 4. Open Anatomy Atlas — pipeline reference

### Strengths
- MIT application code; data is downloaded rather than bundled.
- Supports BodyParts3D 4.3, 4.0, and Z-Anatomy.
- Useful comparison of mesh counts, triangle loads, mirroring issues, and source-building scripts.

### Weaknesses for Neuraxia
- Desktop/Electron-oriented architecture and a general whole-body teaching UI.
- Runtime data installation is not the frictionless public web experience Neuraxia needs.

### Verdict
**Read its data-pipeline decisions; build Neuraxia's own web pipeline.**

---

## Sprint 1 browser spike delivered

Location: `../app`

Implemented:
- Three.js/Vite application shell
- Neuraxia Design III identity and copper topographic UI
- New tagline: **“Neurons at your fingertips.”**
- Real named nervous-system GLB loading with progress
- Orbit / zoom / pan
- Click/tap mesh picking
- Search by anatomical name with `/` shortcut
- Category toggles
- Isolate selected mesh
- Disassemble slider using per-mesh radial offsets
- Camera presets and animated focus
- Visible-mesh and FPS readouts
- Selection box and structure metadata (category, triangle count, mesh index)
- Production build verified with Vite

This spike answers the interaction question: **named CNS picking, grouping, searching and disassembly are feasible in the browser at the tested GLB scale.** It does not yet answer production anatomy completeness or final visual quality.

---

## Main risks discovered

1. **Ontology is the hard part.** Turning hundreds of modelling components into teachable named concepts requires hierarchy work, deduplication, and anatomy review.
2. **FIRE needs tract geometry.** Surface anatomy datasets do not automatically provide beautiful, pedagogically correct pathways.
3. **Licence provenance must be object-level.** “The dataset is open” is not precise enough for a residency-facing public project.
4. **Raw BodyParts3D needs aggressive optimisation.** Target for the first CNS core should be under ~10 MB delivered geometry on desktop, with a lower-detail mobile tier.
5. **Internal spinal-cord teaching anatomy is separate.** External cord geometry alone will not teach laminae, columns, and tracts by level.

## Sprint 1B — next technical tasks

1. Build a curated BodyParts3D CNS FJ list from hierarchy + manual review, not just regex.
2. Deduplicate alternate components visually and record why each chosen mesh represents a concept.
3. Write an OBJ → GLB converter preserving FJ, BP, FMA, name, side, and category metadata.
4. Add mesh simplification and meshopt/Draco compression; measure triangle and byte budgets.
5. Render the BodyParts3D-only CNS beside the Z-derived spike and score anatomical completeness.
6. Resolve licence questions:
   - BodyParts3D version-specific CC BY vs older CC BY-SA wording.
   - Z-Anatomy Brain/Brain-Inner/White-matter materials.
   - Any non-commercial third-party inclusions.
7. Audit tract sources separately for the six FIRE pathways.

## Attribution draft for production candidates

- BodyParts3D, © The Database Center for Life Science, licensed under CC Attribution 4.0 International — exact version/provenance to be confirmed per acquired file set.
- Z-Anatomy attributions and share-alike notices must be preserved for any cleared Z-Anatomy-derived assets used.
- Third-party code used only for acquisition/research must retain its own licence notices where redistributed.
