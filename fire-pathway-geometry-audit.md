# Neuraxia Sprint 1B — FIRE IT first-six pathway geometry audit

**Date:** 24 October 2026  
**Pathways audited**

1. Dorsal column–medial lemniscus (DCML)
2. Spinothalamic / anterolateral system
3. Lateral corticospinal tract
4. visual pathway
5. Pupillary light reflex
6. Monosynaptic stretch reflex

## Executive conclusion

**No audited open tractography atlas is a drop-in production source for complete, registered, cord-to-cortex FIRE IT pathways.**

BodyParts3D gives Neuraxia excellent gross stations—cortex, internal capsule, cerebral crura, pons, medulla, thalamus as a whole, LGN, optic nerve/chiasm/tract, CN III and the whole cord—but it has no selectable named DCML, spinothalamic, lateral corticospinal, optic-radiation, dorsal-column-nucleus, VPL/VPM, pretectal/EW, spinal gray-horn or cord-tract geometry.

The viable production design is a **hybrid, explicitly provenanced pathway layer**:

- atlas-derived centreline/streamline evidence for cerebral CST, medial lemniscus, optic radiation and thalamocortical segments where a source exists;
- a BodyParts3D cord-centreline coordinate system with authored tract territories for posterior columns, anterolateral cord and lateral CST;
- separately authored synapses, decussations, neuron order, side changes and reflex branches;
- every segment labelled as **atlas-derived**, **atlas-guided schematic**, or **authored schematic**.

Anything less would create a beautiful animation that silently teaches false anatomy.

## What the current Living Neuraxia demo proves—and does not prove

The Sprint 1 app contains schematic visual, motor, dorsal-column and spinothalamic ignitions. They connect whole-structure anchor points and are valuable interaction/caption prototypes.

They are **not production pathway geometry**:

- The spinothalamic animation currently reuses the dorsal pathway's whole-structure sequence with a lateral offset and explanatory caption; it does not yet model dorsal-horn synapse, anterior-white-commissure crossing, anterolateral ascent or spinal lemniscus position.
- The motor animation descends from frontal lobe to cord/cauda equina, but does not yet isolate precentral origin, posterior-limb/crus somatotopy, pyramidal decussation, lateral CST position, a spinal segment, lower-motor-neuron synapse or exit.
- visual uses whole thalamus rather than LGN and whole occipital lobe rather than optic radiation/calcarine cortex.
- Pupillary and stretch-reflex circuits are not present.

The correct interpretation is: **the FIRE interaction language works; the production anatomy graph has not been built yet.**

## Source candidates audited

### 1. Yeh HCP1065 population tractography atlas

**What it offers**

- Population-averaged streamlines and probabilistic volumes in ICBM 2009a Nonlinear Asymmetric space.
- The official tract abbreviation inventory includes, among many cerebral bundles:
  - corticospinal tract (`CST_L/R`)
  - medial lemniscus (`ML_L/R`)
  - optic radiation (`OR_L/R`)
  - anterior/posterior/superior thalamic radiations
  - CN II, CN III, CN V, CN VII and CN VIII streamlines
  - corticobulbar and corticopontine pathways
- TRK/TT streamline and NIfTI volume variants.

**Licence / acknowledgement**

- Atlas page states **CC BY-SA 4.0** and requires HCP acknowledgement.
- Source: <https://brain.labsolver.org/hcp_trk_atlas.html>
- Primary paper: Yeh, *Nature Communications* 13, 4933 (2022), DOI `10.1038/s41467-022-32595-4`.

**Limitations for Neuraxia**

- Brain-centred MNI152 population geometry, not BodyParts3D subject geometry.
- No named spinothalamic tract in the audited abbreviation inventory.
- No spinal posterior-column fasciculi or full-cord continuation.
- Streamlines do not encode neuron order, synapses, direction of physiological conduction, modality subdivisions or which fibres cross at a named decussation.
- Registration to BodyParts3D must be treated as anatomical mapping of a population template, not patient/subject truth.

**Role:** best first research source for cerebral CST, ML and OR centreline envelopes.

### 2. ENIGMA Symmetric White Matter Tractography Atlas

**What it offers**

- 65 bundles derived from HCP1065, in MNI152 1 mm and 2 mm spaces, with full and sparse streamline versions.
- Bundle-name file includes:
  - corticospinal tract
  - medial lemniscus
  - optic radiation
  - postcentral thalamic radiation
  - corticobulbar and corticopontine tracts
- Symmetric processing reduces hemispheric streamline-density bias.

**Licence caution**

- Zenodo record lists **CC BY 4.0**: <https://zenodo.org/records/19656193>
- It also states that the atlas was constructed from the HCP1065 template, whose atlas page states CC BY-SA 4.0. The upstream/downstream licence chain must be clarified at file level before production use; do not assume the record-level CC BY label automatically overrides upstream obligations.

**Limitations**

- Same brain-only/MNI and no-neuron-order limitations as HCP1065.
- No spinothalamic, posterior-column or spinal continuation bundle.
- Symmetrisation is analytically useful but can make left/right teaching geometry more artificial than the underlying population anatomy.

**Role:** possible sparse-bundle convenience source after licence-chain review; Yeh is the cleaner primary provenance path.

### 3. TractSeg reference bundles

**What it offers**

- 72 named cerebral bundles, including CST and optic radiation plus thalamic projection subdivisions.
- High-quality reference dissections in HCP subjects and mature Apache-2.0 code.

**Licence blocker**

- The reference datasets on Zenodo are **CC BY-NC 4.0**:
  - <https://zenodo.org/records/1201476>
  - <https://zenodo.org/records/1088278>
- Code licence does not clear the reference data.

**Decision:** do not use TractSeg reference geometry in production unless Neuraxia permanently accepts non-commercial restrictions or obtains separate permission. It may be mentioned only as a comparison/benchmark in research notes, subject to its terms.

### 4. ORG fiber-clustering atlases

**What it offers**

- 58 curated deep white-matter tracts and whole-brain 800-cluster parcellation from 100 HCP subjects.
- The anatomical list includes CST and generic thalamo-parietal / thalamo-occipital projection categories, but not medial lemniscus as a named tract, spinothalamic tract or spinal posterior columns.
- Source: <https://github.com/SlicerDMRI/ORG-Atlases>

**Licence / practicality**

- Repository licence is the BSD-style 3D Slicer contribution/software licence, with research-purpose and commercialisation-risk language and third-party-rights caveats.
- Downloads are roughly hundreds of MB to >1 GB and are designed primarily for tractography parcellation, not compact educational web bundles.

**Role:** technically credible secondary comparison, not the first FIRE source.

### 5. PAM50 spinal cord template/atlas (Spinal Cord Toolbox)

**What it offers**

PAM50 is a full-spinal-cord and brainstem template compatible with ICBM152. Its probabilistic white/gray-matter atlas includes, by side:

- fasciculus gracilis
- fasciculus cuneatus
- lateral corticospinal tract
- spinal lemniscus (spinothalamic + spinoreticular)
- ventral, intermediate and dorsal gray-matter regions
- many additional spinal tracts
- spinal-level labels

Sources:

- <https://spinalcordtoolbox.com/stable/overview/concepts/pam50.html>
- <https://github.com/spinalcordtoolbox/PAM50>

**Licence / provenance caution**

- Spinal Cord Toolbox code is LGPLv3, but Sprint 1B did not find a clear standalone licence file in the PAM50 data repository root.
- Documentation says the white-matter atlas originated as a digitalised Gray's Anatomy spinal cord atlas merged into PAM50. **Data redistribution rights and upstream atlas terms require explicit confirmation.**
- PAM50 is straightened template geometry; it cannot be pasted onto BodyParts3D's curved cord without a centreline/level deformation.

**Role:** best anatomical reference for cord cross-sectional tract territories and levels; use it initially to guide original authored geometry, and import actual volumes/surfaces only after data-rights clearance.

## Pathway-by-pathway audit

### A. Dorsal column–medial lemniscus

**Teaching sequence that must be represented**

Peripheral receptor → dorsal-root ganglion (first-order cell body) → ipsilateral fasciculus gracilis/cuneatus → nucleus gracilis/cuneatus synapse → internal arcuate fibres and sensory decussation → contralateral medial lemniscus → VPL thalamus synapse → posterior limb/superior thalamic radiation → primary somatosensory cortex.

**Already present in Sprint 1B BodyParts3D**

- whole thalamus
- postcentral gyrus
- internal capsule
- medulla/pons/cerebral crura as gross stations
- whole spinal cord

**Missing selectable geometry**

- dorsal rootlets / dorsal-root ganglion
- fasciculus gracilis and cuneatus
- nucleus gracilis and cuneatus
- internal arcuate decussation
- medial lemniscus
- VPL subdivision
- modality-specific third-order radiation

**External geometry coverage**

- Yeh/ENIGMA: medial lemniscus and generic/superior/postcentral thalamic radiation.
- PAM50: fasciculus gracilis/cuneatus territories and cord levels.
- Neither supplies the medullary synapse/decussation as a semantic event.

**Production plan**

Hybrid. Use PAM50-guided authored posterior-column tubes along the BP3D cord, authored dorsal-column nucleus stations and decussation, then an atlas-guided ML centreline through brainstem to thalamus and thalamocortical fan to postcentral gyrus. Show lower-body gracile and upper-body cuneate exemplars separately rather than one uniform “dorsal column.”

**Readiness:** medium; strongest sensory candidate after the cord coordinate system exists.

### B. Spinothalamic / anterolateral system

**Teaching sequence**

Nociceptor/thermoreceptor → dorsal-root ganglion → dorsal horn synapse (including substantia gelatinosa contribution for pain modulation) → crossing in anterior white commissure within roughly 1–2 segments → contralateral anterolateral cord → spinal lemniscus through brainstem → VPL and broader thalamic targets → somatosensory/insular/cingulate distributed cortical network.

**Already present**

- whole spinal cord, medulla, pons, thalamus, postcentral gyrus, insula and cingulate gyrus.

**Missing**

- dorsal horn and Rexed laminae
- anterior white commissure
- anterolateral cord territory
- lateral versus anterior spinothalamic subdivisions
- spinal lemniscus semantic continuity
- VPL and intralaminar/mediodorsal subdivisions

**External geometry coverage**

- No named spinothalamic bundle in the audited Yeh, ENIGMA, TractSeg or ORG anatomical lists.
- PAM50 has “spinal lemniscus (spinothalamic and spinoreticular tracts)” for the cord, but it is a combined territory, not a pure lateral STT.

**Production plan**

Mostly authored schematic geometry. Build a segmental exemplar: enter at a named side/level, ascend briefly in Lissauer territory, synapse in dorsal horn, cross obliquely in anterior white commissure, then follow an anterolateral cord coordinate and a manually placed brainstem spinal-lemniscus ribbon to VPL. Label lateral pain/temperature as the core V1 pathway; keep anterior crude-touch/pressure as an optional branch rather than pretending one line represents the full anterolateral system.

**Readiness:** low-to-medium; educationally essential, but cannot be atlas-imported.

### C. Lateral corticospinal tract

**Teaching sequence**

Upper motor neuron (principally layer V motor/premotor/somatosensory contributions) → corona radiata → posterior limb of internal capsule → cerebral crus → basilar pons → medullary pyramid → pyramidal decussation → contralateral lateral CST → interneurons/direct corticomotoneuronal synapse at a named cord segment → lower motor neuron exit.

**Already present**

- precentral/postcentral gyri
- internal capsule
- cerebral crura
- pons and medulla
- whole spinal cord

**Missing**

- corona-radiata subdivision/somatotopy
- medullary pyramid as a named substructure
- pyramidal decussation
- lateral versus anterior CST
- segmental anterior-horn target and ventral root

**External geometry coverage**

- Yeh, ENIGMA, TractSeg and ORG all include cerebral CST.
- PAM50 includes lateral and ventral CST territories in the cord.
- Tractography streamlines may fade near cortex/brainstem and generally stop far above the chosen spinal segment; they cannot encode the roughly 85–90% lateral crossing proportion as a semantic teaching fact.

**Production plan**

Best hybrid candidate. Use atlas-derived cerebral CST centreline/envelope, explicitly author the decussation and the cord-level lateral tract in BP3D cord coordinates. Build at least two exemplars—hand/upper-limb cervical and lower-limb lumbosacral—so somatotopy and tract size reduction can be taught honestly. Add an optional small anterior CST branch rather than drawing the pathway as if every fibre crosses at the medulla.

**Readiness:** highest of the six.

### D. visual pathway

**Teaching sequence**

Retina → optic nerve → optic chiasm with nasal fibres crossing and temporal fibres remaining ipsilateral → optic tract → LGN synapse → optic radiation (Meyer’s temporal loop and Baumgarten/parietal loop) → calcarine visual cortex.

**Already present**

- optic nerves
- merged optic chiasm
- optic tracts
- lateral geniculate bodies
- cuneus and lingual gyrus as neighbouring visual-cortex territory

**Missing**

- retina and nasal/temporal fibre populations
- chiasmal fibre sorting
- optic radiation
- calcarine/V1 parcellation and retinotopy
- superior-colliculus/pretectal visual branches must be separated from the conscious visual route

**External geometry coverage**

- Yeh: CN II streamlines and optic radiation.
- ENIGMA/TractSeg: optic radiation.
- Tractography optic radiation can show Meyer’s-loop shape but does not label superior/inferior retinal quadrants or guarantee teaching-grade loop subdivision without clustering and review.

**Production plan**

Use BP3D anterior visual pathway geometry for nerve/chiasm/tract, author four fibre populations through the chiasm (left/right eye × nasal/temporal), synapse in BP3D LGN, then use atlas-guided optic-radiation streamlines clustered into temporal and parietal divisions. Terminate on lingual/cuneus sides of an explicitly authored calcarine target zone; do not call an entire gyrus “V1” without qualification.

**Readiness:** medium-high for gross route; fibre sorting/retinotopy requires careful educational authoring.

### E. Pupillary light reflex

**Teaching sequence**

Retina → optic nerve/chiasm/tract → brachium of superior colliculus → pretectal olivary nucleus → bilateral projections (including posterior-commissure crossing) → bilateral Edinger–Westphal nuclei → parasympathetic CN III → ciliary ganglion synapse → short ciliary nerves → sphincter pupillae; direct and consensual responses.

**Already present**

- optic nerves/chiasm/tracts
- brachia of superior colliculus
- superior colliculi
- posterior commissure
- oculomotor nerves

**Missing**

- retina/eye and sphincter pupillae
- pretectal olivary nuclei
- Edinger–Westphal nuclei
- ciliary ganglia and short ciliary nerves in the Sprint 1B CNS set
- bilateral consensual graph semantics

**Catalogue opportunity**

BodyParts3D contains left/right ciliary ganglion FJs that Sprint 1B correctly classified outside the CNS-core Layer-0 selection. A future pathway-specific context pack could fingerprint and add them after the licence gate, rather than widening Layer 0 by default.

**External geometry coverage**

- Yeh includes CN II/CN III-like streamlines but no pupillary circuit, nuclei or consensual branch semantics.

**Production plan**

Authored circuit on BP3D geometry. Place small, clearly labelled approximate pretectal and EW station markers near the posterior commissure/midbrain, draw bilateral branches, then follow BP3D CN III. Add ciliary ganglion only after separate curation. The animation should branch to both pupils; a single line to one eye would miss the reflex's defining teaching point.

**Readiness:** interaction-ready as a schematic circuit; low as purported tract geometry.

### F. Monosynaptic stretch reflex

**Teaching sequence**

Muscle spindle → Ia afferent → dorsal-root ganglion → dorsal root entry → direct synapse on alpha motor neuron in ventral horn (plus Ia inhibitory interneuron branch to antagonist) → ventral root → spinal nerve/peripheral nerve → neuromuscular junction → same muscle contraction.

**Already present**

- whole spinal cord only, at gross level.

**Missing**

- muscle and muscle spindle
- peripheral nerve segment
- dorsal-root ganglion
- dorsal/ventral rootlets
- dorsal and ventral horns
- alpha motor neuron pool
- named spinal segment/dermatome/myotome
- neuromuscular junction

**External geometry coverage**

- No cerebral tractography atlas supplies this reflex.
- PAM50 supplies cord levels and ventral/dorsal horn probabilistic territories, not the peripheral arc.

**Production plan**

Build one segment-specific schematic exemplar, preferably L3–L4 quadriceps/knee-jerk and optionally C5–C6 biceps. This needs a small peripheral-context geometry set outside the current brain+cord-only dataset. If that scope is not approved, show an inset/cross-section schematic rather than stretching a fake reflex line along the whole cord.

**Readiness:** lowest as atlas geometry; entirely authored segmental circuit required.

## Required production data model

A FIRE pathway should not be stored as one decorative polyline. Minimum schema:

```text
Pathway
  id, title, modality/function, clinical teaching points
  variants[]                       # side, body region, cord level, fibre population
  segments[]
    geometry_ref                   # centreline, ribbon, tube, envelope or station
    source_type                    # atlas_derived | atlas_guided_schematic | authored_schematic
    source_dataset/version/licence
    neuron_order
    direction
    side_before, side_after
    synapse_before, synapse_after
    decussation_event_id
    anatomical_confidence
    review_status
  stations[]
    concept_id or authored_marker_id
    nucleus/relay name
    synapse boolean
    position_source and uncertainty
  events[]
    crossing, branching, synapse, entry, exit, termination
```

### Geometry representation

- **Cerebral streamlines:** cluster to a small set of representative centreline curves; do not ship raw population tractograms.
- **Cord tracts:** build a centreline + local cross-section frame from the BP3D cord mesh; place posterior, lateral and anterolateral tract ribbons in that frame so they follow real cord curvature.
- **Decussations:** author short crossing ribbons at anatomically named levels; tractography alone is too diffuse at medullary/spinal crossings.
- **Synapses:** render pulses pausing/flashing at station markers and change neuron-order styling after the synapse.
- **Fibre populations:** visual nasal/temporal and CST lateral/anterior branches need separate curves, not a single average line.
- **Uncertainty display:** schematic markers for missing nuclei must look different from source-derived anatomical meshes.

## Registration problem: MNI atlas ↔ BodyParts3D subject

HCP/PAM50/Allen-style templates are in ICBM/MNI coordinates. BodyParts3D is a separate adult-male anatomical model with its own source coordinates. A future registration sprint must:

1. identify AC, PC, midline, obex/cervicomedullary junction, thalamic and cortical landmarks in BP3D;
2. fit an initial MNI→BP3D affine transform;
3. measure landmark residuals in millimetres;
4. test whether mapped CST/ML/OR centrelines remain inside the corresponding BP3D internal capsule, crus, pons, medulla, thalamus/LGN and cortical targets;
5. only then consider a constrained nonlinear adjustment;
6. publish the transform and error with the pathway file.

Until that is done, imported streamlines must be called **template-mapped schematic centrelines**, not BodyParts3D-native anatomy.

## Recommended build order

### FIRE-0 — pathway graph + BP3D cord coordinate system

- Implement schema, station/event model and authored cord tract ribbons.
- Build lateral CST and DCML first as opposite-direction exemplars.
- Add SPINOTHALAMIC segmental crossing immediately after, because DCML/STT contrast is a flagship teaching moment.

### FIRE-1 — atlas-centreline research spike

- Import only Yeh CST, ML, OR and CN II/CN III test bundles.
- Cluster/simplify streamlines, affine-map MNI→BP3D, and quantify containment/landmark error.
- Decide whether atlas curves improve the authored ribbons enough to justify their complexity and CC BY-SA obligations.

### FIRE-2 — visual fibre sorting and pupillary circuit

- Author nasal/temporal fibre populations and optic-radiation divisions.
- Add bilateral pupillary graph and optional ciliary-ganglion context pack.

### FIRE-3 — segmental reflex inset

- Build one named-level stretch reflex as an exploded cord cross-section/peripheral inset.
- Keep it visually and semantically separate from long-tract anatomy.

## Go / no-go decision

| Pathway | Atlas geometry available? | Production strategy | Go now? |
|---|---|---|---:|
| DCML | Partial: PAM50 cord territories + Yeh ML | Hybrid authored + atlas-guided | Yes, FIRE-0/1 |
| Spinothalamic | Cord territory only; no named cerebral STT bundle | Mostly authored schematic | Yes, with explicit schematic labelling |
| Lateral CST | Strong cerebral + PAM50 cord | Hybrid | Yes, first |
| visual | Strong OR/CN II; weak fibre sorting | BP3D anterior path + atlas-guided OR + authored sorting | Yes, FIRE-2 |
| Pupillary reflex | No circuit atlas | Authored bilateral circuit on BP3D | Yes, as a circuit—not as a tract import |
| Stretch reflex | No reflex atlas | Authored segmental inset | Later, after peripheral-context scope decision |

**Sprint 1B therefore gives FIRE IT a GO for a hybrid pathway-geometry sprint, and a NO-GO for simply downloading a tractography atlas and calling the first six pathways solved.**
