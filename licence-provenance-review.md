# Neuraxia Sprint 1B — licence and provenance review

**Date checked:** 24 October 2026  
**Status:** internal technical review, not legal advice  
**Release decision:** **NO public/commercial release of the Sprint 1B adapted GLBs yet**

## Executive decision

| Asset | Included in Sprint 1B candidate? | Current status |
|---|---:|---|
| Direct BodyParts3D/Anatomography 4.3 FJ OBJ geometry | Yes — 202 components / 182 concepts | Technically reproducible and fully hash-traced, but public terms remain ambiguous because current official CC BY 4.0 wording conflicts with legacy CC BY-SA 2.1 Japan references |
| Z-Anatomy geometry | No | Not used in the candidate |
| Body Atlas `nervous.glb` Sprint 1 spike | No | Comparison/feasibility only; object-level source provenance is not sufficiently established |
| Tractography atlas geometry | No | Separate FIRE IT audit; no tract atlas imported in Sprint 1B |
| Allen Human Reference Atlas 3D | No | Promising separately licensed gap-filler for missing nuclei; not imported or registered yet |

The Sprint 1B GLBs can be used for internal development and review. They must not be described as production-cleared until two independent gates pass:

1. **Rights gate:** DBCLS confirms the governing licence for the acquired 4.3 FJ objects, or a qualified reviewer approves a conservative share-alike distribution strategy.
2. **Anatomy gate:** a qualified neuroanatomy reviewer checks the flagged structures and assembled views.

## Required BodyParts3D attribution

The current official page specifies this exact credit:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

That wording is embedded in the candidate GLB asset copyright field and in `output/ATTRIBUTION.md`, together with a statement of Neuraxia's changes.

## BodyParts3D evidence

### Current official position

The official DBCLS licence page, last updated **2025-02-27**, says:

- “The license for this database is specified in the Creative Commons Attribution 4.0 International.”
- Users may access, redistribute and create/distribute derivative works.
- Attribution must use the exact wording above.

Source: <https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html>

The official database description identifies BodyParts3D as a 3D anatomical-concept database for an adult human male and also summarises the licence as CC BY:

<https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html>

### Version evidence for the acquired objects

Neuraxia's provenance chain does not rely on a filename alone:

- `FMA2Obj.txt` states Data Version 4.3 / Objects set 4.3 / Tree version FMA 3.0.
- Every included OBJ header records `Compatibility version: 4.3`, File ID (FJ), Representation ID (BP), build-up logic, header concept ID, English name, bounds and volume.
- `output/SOURCE_PROVENANCE.json` records all 202 included components with source-object SHA-256 hashes.
- Catalogue BP/FMA values are stored only as **first mappings**; Sprint 1B proved FJ↔FMA is many-to-many, so the OBJ header and FJ ID are the object-level provenance anchors.

### Why the licence is still treated as unresolved

Three conflicts prevent a clean release assertion:

1. Older Anatomography/BodyParts3D pages and many downstream mirrors state **CC BY-SA 2.1 Japan**.
2. The feature-rich third-party 4.3 acquisition repository used as a technical reference states that its code is MIT but the BodyParts3D meshes are **CC BY-SA 2.1 Japan**:  
   <https://github.com/olivercase/body_parts_3d_api>
3. The mirrored official README saved in `research/sprint-1b/metadata/README_e.html` says CC BY 4.0 in text, but its “summary” hyperlink still points to the CC BY-SA 2.1 JP deed.

The included 4.3 OBJ headers reviewed by Sprint 1B do **not** themselves carry a licence line that settles the question.

Other downstream projects have interpreted the 2025 official page as superseding legacy text, including for 4.0 archives. That may ultimately be correct, but Neuraxia should not make that legal leap for the separately acquired 4.3 endpoint objects without a source-specific confirmation.

### Practical consequences of the two possibilities

| If DBCLS confirms… | Release consequence |
|---|---|
| **CC BY 4.0 governs the acquired 4.3 FJ objects** | Adapted GLBs may be distributed, including commercially, with the required attribution, licence link, copyright/source notices and clear indication of changes. Neuraxia could choose its own licence for its original curation/code layers. |
| **CC BY-SA 2.1 Japan governs those objects** | Adapted geometry must be distributed under the same/compatible share-alike terms as that licence requires, with attribution and licence notices preserved. Any closed/proprietary geometry distribution strategy would need a separate licence from DBCLS. |
| **Different releases/objects have different terms** | Provenance must be split at FJ level and the most restrictive applicable terms applied to each output package or the affected objects removed. |

### Clarification to request from DBCLS

A short written request should ask:

1. Which licence governs BodyParts3D/Anatomography **4.3 FJ OBJ files** obtained through the FJ endpoint: CC BY 4.0 or CC BY-SA 2.1 Japan?
2. Does the 2025-02-27 CC BY 4.0 database licence apply retrospectively to the 4.3 object set, or only to specified archive downloads/releases?
3. May simplified/merged/converted GLB adaptations be redistributed in a free educational web application, and may they later be used commercially?
4. If share-alike governs, which exact licence/version must adapted GLBs carry?
5. Is the prescribed attribution wording sufficient when shown in the app credits, a downloadable attribution file and GLB asset metadata?

## Z-Anatomy and the Sprint 1 spike

### Z-Anatomy’s own licence statement

Z-Anatomy states that its code and content are under **CC BY-SA 4.0**, but its attribution file also lists source models with different or unstated terms:

- BodyParts3D — described there as CC BY-SA 2.1 Japan
- “Brainder” and “White matter” from the University of Washington — **no licence stated in that list**
- University of Dundee cranial nerves/foramina — CC BY 4.0
- University of Dundee inner ear — CC BY-NC-SA 4.0
- Lissie Cowley kidney — CC BY-NC 4.0

Source: <https://github.com/Z-Anatomy/Models-of-human-anatomy>

### Brainder / Brain for Blender does not clear every spike brain object

The primary Brain for Blender page says Anderson Winkler’s models there are **CC BY-SA 3.0 Unported**:

<https://brainder.org/research/brain-for-blender/>

That is useful evidence for that identifiable source. It does not, by itself, prove that every `Brain`, `Brain-Inner` or `White matter` object in Z-Anatomy—or in a downstream GLB—came from that exact release. An open Z-Anatomy issue records downstream users excluding 174 objects carrying those materials because material names are the only available provenance trace and their licence was not stated in the Z-Anatomy attribution list:

<https://github.com/Z-Anatomy/Models-of-human-anatomy/issues/10>

Some downstream projects have performed their own object comparisons and reached narrower conclusions. Neuraxia has not performed a forensic object-by-object match against Brainder, BodyParts3D and University of Washington sources. Therefore:

- **do not copy claustrum, nucleus accumbens, deep cerebellar nuclei, inferior olive, septum pellucidum or tentorium from the spike into production;**
- keep the spike clearly labelled feasibility/comparison only;
- prefer direct BodyParts3D, newly acquired separately licensed sources, or original faculty-reviewed geometry.

### Non-commercial components

No Z-Anatomy geometry is included in the Sprint 1B candidate. In particular, Neuraxia has not incorporated the Dundee inner-ear material (CC BY-NC-SA) or kidney material (CC BY-NC). The local Sprint 1 `nervous.glb` inventory also contains no explicit vestibulocochlear/cochlear/vestibular nerve names; Sprint 1B instead uses direct BodyParts3D vestibulocochlear meshes, avoiding that question for CN VIII.

## Candidate gap-filler: Allen Human Reference Atlas 3D

The Allen Human Reference Atlas – 3D, 2020 is a 141-structure parcellation drawn on the ICBM 2009b Nonlinear Symmetric MRI reference volume. Allen’s materials state **CC BY 4.0** terms for the atlas:

- Overview/README: <https://download.alleninstitute.org/informatics-archive/allen_human_reference_atlas_3d_2020/version_1/README.pdf>
- Community record: <https://community.brain-map.org/t/allen-human-reference-atlas-3d-2020-new/405>

This is the most obvious next source to audit for structures BodyParts3D lacks, especially:

- claustrum
- nucleus accumbens
- deep cerebellar nuclei
- inferior olive
- refined small brainstem/subcortical nuclei where labels exist

It is **not** a drop-in mesh source. A future sprint would need to:

1. inventory exact labels and volume resolution;
2. confirm file-level licence and citation requirements;
3. extract surfaces without voxel stair-step artefacts dominating tiny nuclei;
4. register ICBM/MNI coordinates to the BodyParts3D subject with a documented transform and landmark error;
5. visually and quantitatively compare against overlapping BodyParts3D structures;
6. keep Allen-derived meshes in a separately attributed source layer until faculty review.

## Release checklist

- [x] Exact current official BodyParts3D attribution recorded
- [x] FJ-level source inventory and SHA-256 hashes generated
- [x] GLB asset copyright/extras carry source and review status
- [x] Z-Anatomy/spike geometry excluded from Sprint 1B candidate
- [x] Non-commercial source geometry excluded
- [ ] DBCLS written clarification of 4.3 governing licence
- [ ] Final licence text/notices selected for adapted geometry package
- [ ] Faculty/expert neuroanatomy sign-off
- [ ] Public credits page tested in the production app
- [ ] Separate licence review for any Allen or tractography additions

## Bottom line

Sprint 1B solved the **technical provenance** problem: every selectable concept can be traced to named BodyParts3D FJ objects and hashes. It did not—and should not pretend to—solve the **legal version ambiguity** by assertion. The candidate is ready for internal integration and expert review, not public production release.
