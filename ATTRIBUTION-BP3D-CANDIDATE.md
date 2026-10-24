# Attribution and provenance — Neuraxia Sprint 1B BodyParts3D candidate

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

## Status

**INTERNAL_TECHNICAL_CANDIDATE_ONLY — not cleared for public/commercial release until the BodyParts3D licence-version ambiguity is settled in writing and the anatomy passes expert review**

The current official BodyParts3D licence page (last updated 2025-02-27) specifies CC BY 4.0. However, legacy Anatomography/BodyParts3D references and third-party acquisition tools still state CC BY-SA 2.1 Japan, and a licence-summary link in the mirrored README points to BY-SA 2.1 JP. Do not publish or commercially redistribute these adapted GLBs until DBCLS confirms the governing terms for the acquired 4.3 FJ objects, or a qualified reviewer accepts a conservative share-alike release strategy.

## Source

- Database: BodyParts3D / Anatomography
- Version evidence: FMA2Obj.txt header: Data Version 4.3; Objects set 4.3; Tree version FMA3.0. OBJ headers carry Compatibility version 4.3.
- Neuraxia dataset: `neuraxia-bp3d-cns-sprint1b-v0.1`
- Official licence page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Official database page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html
- Z-Anatomy geometry included: **no**
- Body Atlas Sprint 1 spike geometry included: **no**
- Non-commercial source material included: **no**

## Neuraxia changes

- Ontology/hierarchy-assisted candidate selection with explicit manual curation, exclusions, side corrections and merge groups.
- Parsed OBJ polygon faces with fan triangulation.
- Welded coincident vertices on a 0.01 mm spatial grid.
- Removed degenerate/duplicate/unused geometry.
- Removed only micro-fragments satisfying all of: <=4 faces, <=1 mm bounding diagonal, <=1% of the largest connected component; removed counts are recorded per concept in the build reports and GLB extras.
- Merged source components assigned to the same Neuraxia concept into one pickable mesh.
- Applied category/profile-specific quadric simplification with fast-simplification.
- Recomputed smooth vertex normals.
- Converted source millimetres (left, posterior, superior) to glTF metres as (x, z, -y)/1000, yielding (+X subject left, +Y superior, +Z anterior).
- Centred Y/Z on the full-model bounds while preserving anatomical midline x=0.
- Assigned Neuraxia category materials and wrote concept/source provenance into node and mesh extras.neuraxia.
- Produced Meshopt variants with gltf-transform 4.5.1 using EXT_meshopt_compression and KHR_mesh_quantization, 14-bit position and 10-bit normal quantisation settings.

## Output checksums

| File | Bytes | Triangles | SHA-256 |
|---|---:|---:|---|
| `neuraxia-bp3d-cns-desktop.glb` | 7,239,340 | 373,682 | `2681b61d28a3670e7a8d457500789966d973be6c43af15d6600a39404450a831` |
| `neuraxia-bp3d-cns-mobile.glb` | 3,924,144 | 189,484 | `49fd2e7a00c7ad3bc6647e166f92e73a1f82813e6f48fe50bc862836426cddd2` |
| `neuraxia-bp3d-cns-desktop.meshopt.glb` | 2,316,592 | 373,682 | `09f30057ee68a839eb8cda3c471a39c136706a2d21ad1a91c731d70f518436c7` |
| `neuraxia-bp3d-cns-mobile.meshopt.glb` | 1,492,504 | 189,484 | `31884975dbd53261a5145d967d055e57a3e6af4dcbbf9daf3c80cb92fa1b89c2` |

## Machine-readable provenance

`SOURCE_PROVENANCE.json` lists all 182 Neuraxia concepts and all 202 included FJ components with source names, OBJ-header BP/concept IDs, first-mapping catalogue IDs (explicitly not treated as complete mappings), source bounds, triangle counts and SHA-256 hashes.

## Medical/educational status

These files are a technical candidate pending expert neuroanatomy review. They are not a clinical, surgical-planning or diagnostic product.
