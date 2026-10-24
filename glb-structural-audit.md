# Neuraxia Sprint 1B — GLB structural and laterality audit

This report is generated from the GLB files themselves (JSON, accessor counts, accessor bounds and `extras.neuraxia`), cross-checked against the curated concept JSON.

## File summary

| File | Size | Gzip size | Concepts | Vertices | Triangles | Extensions | Errors |
|---|---:|---:|---:|---:|---:|---|---:|
| `neuraxia-bp3d-cns-desktop.glb` | 7.239 MB (7,239,340 bytes) | 5.763 MB (5,762,966 bytes) | 182 | 187,151 | 373,682 | none | 0 |
| `neuraxia-bp3d-cns-mobile.glb` | 3.924 MB (3,924,144 bytes) | 2.972 MB (2,972,472 bytes) | 182 | 95,089 | 189,484 | none | 0 |
| `neuraxia-bp3d-cns-desktop.meshopt.glb` | 2.317 MB (2,316,592 bytes) | 1.466 MB (1,465,931 bytes) | 182 | 187,151 | 373,682 | EXT_meshopt_compression, KHR_mesh_quantization | 0 |
| `neuraxia-bp3d-cns-mobile.meshopt.glb` | 1.493 MB (1,492,504 bytes) | 0.826 MB (825,765 bytes) | 182 | 95,089 | 189,484 | EXT_meshopt_compression, KHR_mesh_quantization | 0 |

## Coordinate frame

- glTF units: metres
- `+X`: subject left
- `+Y`: superior
- `+Z`: anterior
- Anatomical midsagittal plane: `x = 0` (Y/Z are bounds-centred; X is preserved)
- Desktop global bounds (mm): min `[-73.6822, -396.9401, -95.7952]`, max `[78.342, 396.9401, 95.7952]`, dimensions `[152.0242, 793.8802, 191.5904]`

## Category geometry (desktop)

| Category | Concepts | Vertices | Triangles |
|---|---:|---:|---:|
| axis | 7 | 18,607 | 37,218 |
| context | 1 | 293 | 582 |
| cortex | 50 | 76,720 | 153,296 |
| cranial | 35 | 21,337 | 42,506 |
| deep | 57 | 28,379 | 56,498 |
| meninges | 3 | 7,614 | 15,220 |
| ventricles | 9 | 10,788 | 21,540 |
| white | 20 | 23,413 | 46,822 |

Default-visible desktop load: **171 concepts**, **167,550 vertices**, **334,444 triangles**.

## Laterality and pair QA

Complete left/right named pairs checked: **78**.

### Side-labelled concepts crossing `x=0` by more than 2 mm

- **Right vagus nerve** (`FJ4024`): x bounds `[-37.9918, 78.342]` mm; crosses by 78.3 mm; default visible: false.

### Paired concepts exceeding asymmetry thresholds

Thresholds: dimension difference >5 mm, mirror-centre error >5 mm, Y/Z centre difference >5 mm, or source-triangle ratio >1.8.

| Pair | Max dim diff (mm) | Mirror error (mm) | Y/Z centre diff (mm) | Source-triangle ratio |
|---|---:|---:|---:|---:|
| hypoglossal nerve | 0.1 | 1.4 | 0.0 | 2.90 |
| lateral geniculate body | 0.5 | 0.7 | 1.0 | 3.08 |
| thalamus | 0.1 | 1.3 | 0.0 | 2.25 |
| vagus nerve | 65.3 | 48.6 | 27.6 | 1.19 |

## Quality-flagged concepts carried into the GLBs

- **Brachium of left superior colliculus** (`FJ1736`): source_side_label_conflicts_with_bounds
- **Brachium of right superior colliculus** (`FJ1735`): source_side_label_conflicts_with_bounds
- **Cauda equina** (`FJ4425`): many_indexed_components_before_spatial_weld
- **Cerebral dura mater** (`FJ3890`): whole_brain_dural_shell_default_hidden
- **Right glossopharyngeal nerve** (`FJ3901`): source_side_label_conflicts_with_bounds
- **Right stria terminalis** (`FJ1825`): source_contains_five_two_triangle_submillimetre_micro_fragments_on_opposite_side_removed_by_converter; dominant component is correctly right-sided
- **Right vagus nerve** (`FJ4024`): side_geometry_review_required: one welded component labelled trunk of right vagus nerve crosses extensively into positive-X (subject-left) bounds; default hidden pending anatomical adjudication
- **Spinal cord** (`FJ4426`): many_indexed_components_before_spatial_weld; 7 degenerate triangles in source
- **White matter of left temporal lobe** (`FJ1758`): suspected_name_geometry_scope_mismatch: source says temporal-lobe white matter, but bounds/volume span almost the whole cerebral hemisphere; default hidden pending expert review
- **White matter of right temporal lobe** (`FJ1806`): suspected_name_geometry_scope_mismatch: source says temporal-lobe white matter, but bounds/volume span almost the whole cerebral hemisphere; default hidden pending expert review

## Structural errors and warnings

### `neuraxia-bp3d-cns-desktop.glb`

- No structural/metadata errors.
- WARNING: 1 side-labelled concept(s) cross x=0 by >2 mm
- WARNING: 4 paired concept(s) exceed asymmetry QA thresholds

### `neuraxia-bp3d-cns-mobile.glb`

- No structural/metadata errors.
- WARNING: 1 side-labelled concept(s) cross x=0 by >2 mm
- WARNING: 4 paired concept(s) exceed asymmetry QA thresholds

### `neuraxia-bp3d-cns-desktop.meshopt.glb`

- No structural/metadata errors.
- WARNING: 1 side-labelled concept(s) cross x=0 by >2 mm
- WARNING: 4 paired concept(s) exceed asymmetry QA thresholds

### `neuraxia-bp3d-cns-mobile.meshopt.glb`

- No structural/metadata errors.
- WARNING: 1 side-labelled concept(s) cross x=0 by >2 mm
- WARNING: 4 paired concept(s) exceed asymmetry QA thresholds

## Interpretation

- A clean structural audit does **not** prove anatomical correctness; it proves that the curated concepts, names, source IDs, counts, materials and coordinate metadata survived conversion/compression consistently.
- Right stria terminalis is no longer a laterality bounds problem after removal of five two-triangle, submillimetre source fragments; its dominant component is correctly right-sided.
- The trunk of the right vagus nerve remains a genuine source-geometry adjudication item: it is one welded component, defaults hidden, and must not be used for side-specific teaching until visually/anatomically resolved.
- Triangle-count asymmetry alone (for example thalamus or lateral geniculate body) is a mesh-density/source generation warning, not by itself evidence of wrong anatomy when bounds and centres mirror well.
