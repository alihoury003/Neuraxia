# Neuraxia Sprint 1B — anatomical completeness scorecard

Scope: selectable brain + spinal-cord anatomy for Layer 0. Counts are generated from the curated BodyParts3D concept JSON and the Sprint 1 spike GLB inventory. Domain scores use the transparent 0–5 rubric embedded in `pipeline/score_dataset_completeness.py`; they judge coverage and teaching granularity, not mesh beauty or source accuracy.

## Headline inventories

| Measure | BodyParts3D Sprint 1B | Z-derived Sprint 1 spike |
|---|---:|---:|
| Selectable concepts/meshes in comparison set | 182 | 109 app-default of 309 total |
| Triangles in comparison set (source for BP; spike GLB) | 1,244,246 | 339,781 app-default |
| Cortical units | 50 | 12 |
| Deep concepts | 57 | 29 |
| Cranial concepts in comparison set | 35 | 45 |
| Named cranial nerves represented | 12/12 | 11/12 |
| Weighted teaching-atlas score | **68.5/100** | **52.8/100** |

## Domain scores

| Domain | Weight | BP3D /5 | Spike /5 | Interpretation |
|---|---:|---:|---:|---|
| Cerebral cortex and cortical granularity | 15 | 4.3 | 2.0 | BP3D ahead |
| Deep gray matter, diencephalon and Hypothalamus | 15 | 4.0 | 3.0 | BP3D ahead |
| Brainstem and cerebellum | 15 | 2.7 | 2.5 | BP3D ahead |
| Ventricles and CSF spaces | 10 | 4.8 | 4.4 | BP3D ahead |
| White matter, commissures and named internal pathways | 15 | 2.5 | 2.0 | BP3D ahead |
| Cranial nerves I–XII | 15 | 4.4 | 3.3 | BP3D ahead |
| Spinal cord and cauda equina | 10 | 1.4 | 1.3 | BP3D ahead |
| Meninges and immediate context | 5 | 2.4 | 3.0 | Spike ahead |

### Cerebral cortex and cortical granularity

- **BodyParts3D:** 25 named cortical units per hemisphere (24 gyri/lobules plus insula); lobe views must be derived by metadata aggregation. Missing separate paracentral lobule, transverse temporal gyri and inferior-frontal subdivisions.
- **Spike:** Six cortical units per hemisphere (five lobes plus insula), useful for orientation but too coarse for gyral teaching/localisation.

### Deep gray matter, diencephalon and Hypothalamus

- **BodyParts3D:** Basal ganglia cores plus 12 paired Hypothalamic/preoptic/periventricular nuclei, geniculate bodies, colliculi, habenula and pineal body. Missing claustrum, nucleus accumbens, thalamic nuclear subdivisions and basal-forebrain nuclei.
- **Spike:** Strong basal-ganglia set and uniquely includes claustrum and nucleus accumbens, but almost no Hypothalamic nuclear detail.

### Brainstem and cerebellum

- **BodyParts3D:** Pons, medulla, cerebral crura, colliculi, red nuclei and substantia nigra are separate; cerebellum remains one gross mesh. Missing nearly all cranial-nerve/reticular/tegmental nuclei, inferior olive, cerebellar lobes/vermis/hemispheres, deep cerebellar nuclei and peduncles.
- **Spike:** One gross brainstem and cerebellum, but uniquely includes inferior olives and deep cerebellar nuclei.

### Ventricles and CSF spaces

- **BodyParts3D:** Lateral/third/fourth ventricles, aqueduct, interventricular foramen, bilateral choroid plexus and central canal are selectable.
- **Spike:** Same ventricular core except no separate central canal.

### White matter, commissures and named internal pathways

- **BodyParts3D:** Corpus callosum, anterior/posterior commissures, fornices, internal capsules, striae, mammillothalamic tracts and collicular brachia. No named long association bundles, corona radiata subdivisions, optic/auditory radiations, lemnisci or spinal tracts; temporal white-matter labels are geometrically suspect and hidden.
- **Spike:** Core commissures/fornices/internal capsules and septum pellucidum, but fewer small named bundles and the same absence of tract-level pathway geometry.

### Cranial nerves I–XII

- **BodyParts3D:** All 12 nerves are present bilaterally at proximal/main-trunk level, plus optic/olfactory tracts and trigeminal divisions. Distal vagal geometry needs adjudication and remains hidden.
- **Spike:** Most main nerves plus distal trigeminal branches; no explicit vestibulocochlear/cochlear/vestibular nerve and no olfactory tract in the inventory.

### Spinal cord and cauda equina

- **BodyParts3D:** Whole cord, cauda equina and central canal only. No cord levels/segments, gray-matter horns/columns, white-matter funiculi/tracts, rootlets or spinal meninges as selectable CNS anatomy.
- **Spike:** Whole cord and cauda equina only within the app-default CNS set; roots/ganglia exist elsewhere in the full spike but are peripheral/spinal-nerve context rather than internal cord anatomy.

### Meninges and immediate context

- **BodyParts3D:** Falx cerebri, a whole-brain dural shell (hidden by default), pituitary and pineal context; only the right half of tentorium cerebelli exists in the selected source set.
- **Spike:** Falx and a tentorium concept are present, but no pineal/pituitary context in the spike inventory.

## Canonical presence checks

| Structure / system | BP3D | Spike |
|---|---|---|
| Claustrum | no | yes |
| Nucleus accumbens | no | yes |
| Deep cerebellar nuclei | no | yes |
| Inferior olive | no | yes |
| Septum pellucidum | no | yes |
| Pineal body | yes | no |
| Pituitary gland | yes | no |
| Central canal of spinal cord | yes | no |
| Olfactory tract | yes | no |
| Optic radiation | no | no |
| Corona radiata | no | no |
| Cingulum | no | no |
| Superior longitudinal fasciculus | no | no |
| Inferior longitudinal fasciculus | no | no |
| Arcuate fasciculus | no | no |
| Uncinate fasciculus | no | no |
| Cerebellar peduncles | no | no |
| Cranial nerve nuclei | no | no |

## What BodyParts3D adds over the spike

- Gyral-level cortex: 25 named units per hemisphere rather than lobe-level surfaces.
- Hypothalamic nuclear detail: 12 paired Hypothalamic/preoptic/periventricular nuclei.
- Separate pons, medulla and cerebral crura instead of one undifferentiated brainstem mesh.
- Lateral/medial geniculate bodies, superior/inferior colliculi, habenula, pineal body and pituitary context.
- Central canal of the spinal cord.
- Bilateral vestibulocochlear nerves and olfactory tracts; all cranial nerves I–XII are represented.
- Full object-level FJ/BP/header-concept provenance and file hashes for every selectable concept.

## What the spike has that BodyParts3D lacks

- Claustrum and nucleus accumbens.
- Deep cerebellar nuclei and inferior olives.
- Septum pellucidum as a distinct named sheet (BodyParts3D has a broader `Septum of telencephalon`).
- A tentorium concept beyond BodyParts3D's right-half-only geometry (object-level provenance in the spike remains unresolved).
- More distal trigeminal branch geometry, which is outside Sprint 1B's proximal-cranial focus.

## Shared production gaps

- No selectable spinal-cord segmental levels, gray-matter horns/columns, funiculi or ascending/descending tracts.
- No named optic/auditory radiations, cingulum, longitudinal/uncinate/arcuate fasciculi, corona-radiata subdivisions, lemnisci or cerebellar peduncles.
- No systematic cranial-nerve, reticular-formation, raphe, tegmental or dorsal-column nuclei.
- No cerebellar hemispheres/vermis/lobules as a teaching parcellation.
- No production-ready neuron-order, synapse, decussation or direction fields for FIRE IT; those must be authored as a separate pathway graph and geometry set.

## Decision

BodyParts3D is the correct production foundation: **68.5/100 versus 52.8/100** on this explicit Layer-0 rubric, with much stronger cortical, Hypothalamic, brainstem-subdivision and provenance granularity. It is not yet a complete neuroanatomy atlas. The production roadmap should add missing internal nuclei and cord/tract anatomy from separately licensed or original faculty-reviewed geometry rather than silently importing the unresolved spike meshes.
