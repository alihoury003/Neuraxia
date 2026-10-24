# Neuraxia BodyParts3D pipeline — Sprint 1B

This directory contains the reproducible, source-traceable pipeline that turned selected BodyParts3D 4.3 OBJ components into the Sprint 1B desktop/mobile GLB candidates.

> **Release status:** internal technical candidate only. Read `research/sprint-1b/reports/licence-provenance-review.md` before distributing any adapted GLB.

## Pipeline order

### 1. Select the candidate pool

```bash
python3 pipeline/select_bp3d_cns.py
```

Inputs:

- `research/bp3d-tools/MANIFEST.csv`
- `research/sprint-1b/metadata/FMA2Obj.txt`
- official IS-A / PART-OF tables in `research/sprint-1b/metadata/`

Outputs in `research/sprint-1b/curation/`:

- `bp3d-cns-candidates.csv` — 219 candidate FJ components
- `bp3d-cns-download-list.txt`
- `bp3d-neural-tree-not-selected.csv`
- `bp3d-manual-scope-exclusions.csv` — includes the two interpeduncular-fossa surface components and why they are outside tissue Layer 0
- `bp3d-cns-candidate-summary.json`

The selector uses hierarchy/FMA2Obj roots plus exact reviewed cranial patterns. It does not treat a broad name regex as an ontology.

### 2. Download and fingerprint raw OBJs

Raw OBJ files are intentionally kept under `/tmp`, not committed into the persistent research tree:

```bash
python3 pipeline/download_bp3d_selection.py \
  --fj-list research/sprint-1b/curation/bp3d-cns-download-list.txt \
  --out /tmp/neuraxia-sprint1b/raw-obj

PYTHONPATH=/tmp/neuraxia-pydeps python3 pipeline/audit_obj_geometry.py \
  --obj-dir /tmp/neuraxia-sprint1b/raw-obj \
  --candidates research/sprint-1b/curation/bp3d-cns-candidates.csv \
  --out-dir research/sprint-1b/curation
```

The fingerprinter records SHA-256, triangles, vertices, bounds, signed/absolute volume, manifold/component counts and duplicate-group evidence. It distinguishes adjacent complementary parts from overlapping alternates; equal names alone are never deduplicated.

### 3. Resolve final curation

```bash
python3 pipeline/resolve_curation.py
```

This encodes the reviewed decisions: 202 included FJ components merged into 182 concepts, 17 excluded alternates, side corrections, category/subregion, default visibility and quality flags.

Primary outputs:

- `bp3d-cns-concepts.json`
- `bp3d-cns-curation.csv`
- `bp3d-cns-included-fj.txt`
- `bp3d-cns-curation-summary.json`

### 4. Convert OBJ components to concept GLBs

Python dependencies used during Sprint 1B were installed outside the snapshot tree:

```bash
python3 -m pip install --target /tmp/neuraxia-pydeps \
  trimesh fast-simplification pygltflib
```

```bash
PYTHONPATH=/tmp/neuraxia-pydeps python3 pipeline/convert_obj_to_glb.py \
  --profile desktop \
  --out research/sprint-1b/output/neuraxia-bp3d-cns-desktop.glb

PYTHONPATH=/tmp/neuraxia-pydeps python3 pipeline/convert_obj_to_glb.py \
  --profile mobile \
  --out research/sprint-1b/output/neuraxia-bp3d-cns-mobile.glb
```

Desktop/mobile conversion is driven by the profile and category rules inside `convert_obj_to_glb.py`. The converter:

- fan-triangulates OBJ faces;
- welds at 0.01 mm and removes degenerates/duplicates/unused vertices;
- removes only narrow micro-fragments (≤4 faces, ≤1 mm diagonal, ≤1% of the largest component), logging every removal;
- merges curated components into one node/mesh per concept;
- simplifies by concept/category while protecting tiny structures;
- recomputes smooth normals;
- preserves anatomical midline `x=0` and centres only Y/Z;
- writes identical `extras.neuraxia` metadata to node and mesh.

### 5. Meshopt-compress

```bash
cd research/sprint-1b/output
npx @gltf-transform/cli@4.5.1 meshopt \
  neuraxia-bp3d-cns-desktop.glb neuraxia-bp3d-cns-desktop.meshopt.glb \
  --level high --quantize-position 14 --quantize-normal 10
npx @gltf-transform/cli@4.5.1 meshopt \
  neuraxia-bp3d-cns-mobile.glb neuraxia-bp3d-cns-mobile.meshopt.glb \
  --level high --quantize-position 14 --quantize-normal 10
```

### 6. Validate independently

```bash
python3 pipeline/audit_glb.py

cd app
node scripts/validate-glb.mjs \
  ../research/sprint-1b/output/neuraxia-bp3d-cns-desktop.glb \
  ../research/sprint-1b/output/neuraxia-bp3d-cns-mobile.glb \
  ../research/sprint-1b/output/neuraxia-bp3d-cns-desktop.meshopt.glb \
  ../research/sprint-1b/output/neuraxia-bp3d-cns-mobile.meshopt.glb
```

Important app rule: Three.js sanitises Object3D names. Always use `mesh.userData.neuraxia.concept_id` as identity and `.display_name` for UI text.

### 7. Score, render and write sidecars

```bash
python3 pipeline/score_dataset_completeness.py
PYTHONPATH=/tmp/neuraxia-pydeps python3 pipeline/render_dataset_comparison.py \
  --spike /tmp/nervous-dequant.glb
PYTHONPATH=/tmp/neuraxia-pydeps python3 pipeline/render_focus_qa.py
python3 pipeline/write_release_sidecars.py
```

These generate the completeness scorecard, comparison/focus contact sheets, `output/ATTRIBUTION.md`, and `output/SOURCE_PROVENANCE.json`.

## Coordinate contract

Source OBJ millimetres are transformed to glTF metres as:

```text
glTF position = (source_x, source_z, -source_y) / 1000
```

After transform:

- subject left = `+X`
- superior = `+Y`
- anterior = `+Z`
- anatomical midline remains `x=0`

Do not centre X by bounding box: asymmetric structures such as a long vagus component would shift the anatomical midline.

## App consumption

The app loads the Meshopt candidate by default and chooses the mobile profile on narrow viewports. `?dataset=spike` restores the Sprint 1 comparison model; `?profile=desktop|mobile` forces a BP3D profile.

Public app model paths are symlinks to the canonical files in `research/sprint-1b/output/`, avoiding duplicate GLB payloads in the source tree.
