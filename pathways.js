/**
 * NEURAXIA Sprint 1C — FIRE-0 pathway graph (first three long tracts).
 *
 * This is the foundation layer specified by
 * research/sprint-1b/reports/fire-pathway-geometry-audit.md:
 * a pathway is a GRAPH of stations and events — neuron order, side before/
 * after, synapses, decussations — not one decorative polyline.
 *
 * Geometry honesty:
 *  - Cerebral/brainstem waypoints are anchored to real BP3D structure centres
 *    with small anatomical offsets (segment source_type:
 *    "atlas_guided_schematic" — routes follow standard atlas descriptions,
 *    no tractography bundle has been registered yet).
 *  - Cord segments ride the BP3D spinal-cord mesh's own computed centreline
 *    with cross-sectional territory offsets (posterior / lateral /
 *    anterolateral), so they follow real cord curvature
 *    (source_type: "authored_schematic_on_source_centreline").
 *  - Synapse/decussation stations that BP3D lacks as meshes (nucleus
 *    gracilis, VPL, dorsal horn, anterior horn) are MARKERS, rendered and
 *    captioned as schematic stations — never implied to be source meshes.
 *
 * Coordinate convention (app world): subject left = +X, anterior = +Z,
 * superior = +Y. "Right body" therefore lives at negative X.
 */

export const FIRE_SOURCE_NOTE =
  'FIRE-0 graph · authored schematic segments on the BP3D cord centreline; cerebral routes follow atlas descriptions. Tractography registration (Yeh/ENIGMA) is a later, separately licensed step.';

export function buildFireGraphPathways(ctx) {
  const { findEntry, getEntryCenter, cordPointAt, radius } = ctx;
  const r = radius;
  const C = (entry, dx = 0, dy = 0, dz = 0) => {
    const p = getEntryCenter(entry);
    p.x += dx * r; p.y += dy * r; p.z += dz * r;
    return p;
  };
  const midlineAt = (entry, dy = 0, dz = 0) => {
    const top = cordPointAt(0, 0, 0);
    const c = getEntryCenter(entry);
    return new ctx.Vector3(top.x, c.y + dy * r, c.z + dz * r);
  };

  const precentralR = findEntry(/^Right precentral gyrus$/i);
  const capsuleR = findEntry(/^Right internal capsule$/i);
  const crusR = findEntry(/^Right cerebral crus$/i);
  const pons = findEntry(/^Pons$/i);
  const medulla = findEntry(/^Medulla oblongata$/i);
  const cord = findEntry(/^Spinal cord$/i);
  const thalamusR = findEntry(/^Right thalamus$/i);
  const thalamusL = findEntry(/^Left thalamus$/i);
  const postcentralR = findEntry(/^Right postcentral gyrus$/i);
  const postcentralL = findEntry(/^Left postcentral gyrus$/i);

  const cst = {
    key: 'cst',
    kind: 'graph',
    label: 'lateral corticospinal tract',
    kicker: 'FIRE · LATERAL CORTICOSPINAL',
    intro: 'Right motor cortex commands the LEFT body. Watch where the side flips.',
    color: 0xffb199,
    duration: 8200,
    entries: [precentralR, capsuleR, crusR, pons, medulla, cord],
    chain: 'UMN (precentral) → posterior limb → crus → pons → pyramid → ◆ pyramidal decussation → lateral CST → ○ anterior horn → LMN',
    crossing: '◆ Pyramidal decussation · caudal medulla (~90% of fibres cross)',
    buildPoints: () => [
      C(precentralR),
      C(capsuleR),
      C(crusR),
      C(pons, -0.02, 0, 0.03),
      C(medulla, -0.015, 0.02, 0.02),
      midlineAt(medulla, -0.035, 0.012),
      cordPointAt(0.08, 0.8, -0.05),
      cordPointAt(0.4, 0.8, -0.05),
      cordPointAt(0.65, 0.8, -0.05),
      cordPointAt(0.68, 0.25, 0.35),
    ],
    stations: [
      { at: 0.0, kind: 'origin', label: 'UMN · right precentral gyrus', entry: precentralR, caption: 'Upper motor neuron ignites in layer V of the right precentral gyrus.' },
      { at: 0.13, kind: 'station', label: 'Posterior limb, internal capsule', entry: capsuleR, caption: 'Axons funnel through the posterior limb — face to leg, front to back.' },
      { at: 0.25, kind: 'station', label: 'Right cerebral crus', entry: crusR, caption: 'The command occupies the middle of the right cerebral crus.' },
      { at: 0.37, kind: 'station', label: 'Basilar pons', entry: pons, caption: 'Threads descend between pontine nuclei, still on the right.' },
      { at: 0.47, kind: 'station', label: 'Right medullary pyramid', entry: medulla, caption: 'Bundled into the right pyramid on the ventral medulla.' },
      { at: 0.57, kind: 'decussation', label: '◆ Pyramidal decussation', entry: medulla, caption: '◆ DECUSSATION: ~90% of fibres cross in the caudal medulla. The signal is now LEFT-sided.' },
      { at: 0.78, kind: 'station', label: 'Left lateral corticospinal tract', entry: cord, caption: 'Descending in the LEFT lateral funiculus, the tract shrinks as fibres peel off at each level.' },
      { at: 1.0, kind: 'synapse', label: '○ Anterior horn (schematic station)', entry: cord, caption: '○ SYNAPSE: onto interneurons and lower motor neurons of the left anterior horn. The next cell leaves the cord.' },
    ],
  };

  const dcml = {
    key: 'dcml',
    kind: 'graph',
    label: 'dorsal column–medial lemniscus',
    kicker: 'FIRE · FINE TOUCH & PROPRIOCEPTION',
    intro: 'Left-leg fine touch climbs UNcrossed — until one precise medullary moment.',
    color: 0x20d7e5,
    duration: 8600,
    entries: [cord, medulla, pons, thalamusR, postcentralR],
    chain: '1° neuron → fasciculus gracilis (ipsilateral) → ○ nucleus gracilis → ◆ internal arcuate decussation → medial lemniscus → ○ VPL → postcentral cortex',
    crossing: '◆ Sensory (internal arcuate) decussation · caudal medulla, AFTER the first synapse',
    buildPoints: () => [
      cordPointAt(0.9, 0.3, -0.75),
      cordPointAt(0.55, 0.3, -0.75),
      cordPointAt(0.2, 0.3, -0.75),
      cordPointAt(0.03, 0.3, -0.6),
      C(medulla, 0.015, -0.01, -0.03),
      midlineAt(medulla, 0.008, -0.005),
      C(pons, -0.012, -0.02, -0.01),
      C(pons, -0.014, 0.02, -0.015),
      C(thalamusR),
      C(postcentralR),
    ],
    stations: [
      { at: 0.0, kind: 'origin', label: '1° neuron · left fasciculus gracilis', entry: cord, caption: 'First-order axon enters and ascends in the LEFT posterior column — gracilis for the lower body.' },
      { at: 0.3, kind: 'station', label: 'Ipsilateral ascent, no synapse', entry: cord, caption: 'Still the same axon, still uncrossed: posterior-column fibres do NOT synapse in the cord.' },
      { at: 0.5, kind: 'synapse', label: '○ Nucleus gracilis (schematic station)', entry: medulla, caption: '○ FIRST SYNAPSE: nucleus gracilis in the caudal medulla. The second-order neuron begins.' },
      { at: 0.59, kind: 'decussation', label: '◆ Internal arcuate decussation', entry: medulla, caption: '◆ DECUSSATION: internal arcuate fibres sweep across the midline — the great sensory decussation.' },
      { at: 0.73, kind: 'station', label: 'Right medial lemniscus', entry: pons, caption: 'Now in the RIGHT medial lemniscus, climbing through pons and midbrain toward thalamus.' },
      { at: 0.88, kind: 'synapse', label: '○ VPL thalamus (schematic station)', entry: thalamusR, caption: '○ SECOND SYNAPSE: VPL of the right thalamus. Third-order fibres take the posterior limb to cortex.' },
      { at: 1.0, kind: 'target', label: 'Right postcentral gyrus', entry: postcentralR, caption: 'Arrival: right postcentral gyrus — vibration, joint position, discriminative touch of the LEFT leg.' },
    ],
  };

  const stt = {
    key: 'stt',
    kind: 'graph',
    label: 'spinothalamic (anterolateral) system',
    kicker: 'FIRE · PAIN & TEMPERATURE',
    intro: 'Right-sided pain crosses almost immediately. Compare its crossing story with fine touch.',
    color: 0xff7a90,
    duration: 8600,
    entries: [cord, medulla, pons, thalamusL, postcentralL],
    chain: '1° neuron → ○ dorsal horn → ◆ anterior white commissure (same level) → anterolateral cord → spinal lemniscus → ○ VPL → postcentral cortex (+ insula / cingulate affect)',
    crossing: '◆ Anterior white commissure · within ~1–2 segments of entry — the earliest crossing of the three',
    buildPoints: () => [
      cordPointAt(0.82, -0.45, -0.45),
      cordPointAt(0.8, -0.1, 0.25),
      cordPointAt(0.79, 0.45, 0.5),
      cordPointAt(0.5, 0.7, 0.5),
      cordPointAt(0.18, 0.7, 0.5),
      C(medulla, 0.03, 0, 0.005),
      C(pons, 0.025, 0.01, -0.01),
      C(thalamusL),
      C(postcentralL),
    ],
    stations: [
      { at: 0.0, kind: 'synapse', label: '○ Dorsal horn, right (schematic station)', entry: cord, caption: '○ IMMEDIATE SYNAPSE: pain/temperature synapse in the RIGHT dorsal horn (substantia gelatinosa gates it).' },
      { at: 0.1, kind: 'decussation', label: '◆ Anterior white commissure', entry: cord, caption: '◆ DECUSSATION: second-order axons cross in the anterior white commissure within a segment or two — NOT in the medulla.' },
      { at: 0.38, kind: 'station', label: 'Left anterolateral cord', entry: cord, caption: 'Ascending in the LEFT anterolateral funiculus — sacral fibres most lateral (remember sacral sparing).' },
      { at: 0.62, kind: 'station', label: 'Spinal lemniscus, brainstem', entry: pons, caption: 'Through the lateral medulla (Wallenberg territory) as the spinal lemniscus, joining toward the thalamus.' },
      { at: 0.84, kind: 'synapse', label: '○ VPL thalamus (schematic station)', entry: thalamusL, caption: '○ SYNAPSE: left VPL localises the pain; parallel branches to insula and cingulate make it hurt.' },
      { at: 1.0, kind: 'target', label: 'Left postcentral gyrus', entry: postcentralL, caption: 'Arrival: left postcentral cortex registers RIGHT-sided pain and temperature.' },
    ],
  };

  /* ── Sprint 1D: visual fibre sorting, pupillary circuit, stretch reflex ── */

  const opticNerveL = findEntry(/^Left optic nerve/i);
  const opticNerveR = findEntry(/^Right optic nerve/i);
  const chiasm = findEntry(/^Optic chiasm$/i);
  const opticTractL = findEntry(/^Left optic tract$/i);
  const lgnL = findEntry(/^Left lateral geniculate body$/i);
  const cuneusL = findEntry(/^Left cuneus$/i);
  const lingualL = findEntry(/^Left lingual gyrus$/i);
  const brachiumSCL = findEntry(/^Brachium of left superior colliculus$/i);
  const posteriorCommissure = findEntry(/^Posterior commissure$/i);
  const cn3L = findEntry(/^Left oculomotor nerve$/i);
  const cn3R = findEntry(/^Right oculomotor nerve$/i);
  const crusL = findEntry(/^Left cerebral crus$/i);
  const crusR2 = findEntry(/^Right cerebral crus$/i);

  // Calcarine target: midpoint between cuneus (upper bank) and lingual (lower bank).
  const calcarine = () => C(cuneusL).lerp(C(lingualL), 0.5);

  const vision = {
    key: 'vision',
    kind: 'graph',
    label: 'visual pathway — left visual hemifield',
    kicker: 'FIRE · VISION & THE CHIASM SORT',
    intro: 'Two half-retinas, one hemifield: watch nasal fibres cross and temporal fibres stay.',
    color: 0x20d7e5,
    duration: 8800,
    entries: [opticNerveL, opticNerveR, chiasm, opticTractL, lgnL, cuneusL, lingualL],
    chain: 'Retinal ganglion cells → optic nerve → ◆ chiasm (nasal cross, temporal stay) → optic tract → ○ LGN → optic radiation (Meyer + Baumgarten loops) → calcarine V1',
    crossing: '◆ Partial decussation at the chiasm — the only FIRE crossing that sorts by FIELD, not by body side',
    // Main curve: LEFT eye temporal-retina fibres (do not cross) + parietal loop.
    buildPoints: () => [
      C(opticNerveL, 0.01, 0, 0.02),
      C(chiasm, 0.012, 0, 0),
      C(opticTractL),
      C(lgnL),
      C(lgnL, 0.035, 0.02, -0.055),
      C(cuneusL, 0.015, 0.01, 0.045),
      calcarine(),
    ],
    extraCurves: [
      {
        // RIGHT eye nasal-retina fibres: cross at chiasm, join the left tract.
        color: 0x7ce7f4,
        buildPoints: () => [
          C(opticNerveR, -0.01, 0, 0.02),
          C(chiasm, -0.01, 0.004, 0.004),
          C(chiasm, 0.014, -0.004, -0.006),
          C(opticTractL, 0, -0.006, -0.004),
          C(lgnL, 0, -0.006, 0),
        ],
      },
      {
        // Meyer loop: LGN → anterior temporal sweep → lingual (lower bank).
        color: 0x7ce7f4,
        buildPoints: () => [
          C(lgnL),
          C(lgnL, 0.035, -0.03, 0.06),
          C(lgnL, 0.045, -0.04, -0.02),
          C(lingualL, 0.02, -0.01, 0.06),
          calcarine(),
        ],
      },
    ],
    stations: [
      { at: 0.0, kind: 'origin', label: 'Retina (eye not modelled — nerve is the afferent)', entry: opticNerveL, caption: 'Ganglion-cell axons leave both eyes. Main line: LEFT temporal retina — it will NOT cross. Pale line: RIGHT nasal retina — it will.' },
      { at: 0.16, kind: 'decussation', label: '◆ Optic chiasm — partial decussation', entry: chiasm, caption: '◆ THE SORT: nasal fibres cross, temporal fibres stay. After the chiasm each tract carries one visual HEMIFIELD, not one eye — that is why retrochiasmal lesions cause homonymous defects.' },
      { at: 0.34, kind: 'station', label: 'Left optic tract — LEFT hemifield assembled', entry: opticTractL, caption: 'Both fibre populations now travel together in the left optic tract: the entire left visual field of both eyes.' },
      { at: 0.52, kind: 'synapse', label: '○ Lateral geniculate body', entry: lgnL, caption: '○ SYNAPSE: LGN keeps eye-of-origin in separate layers. From here the radiation fans out — pale loop dips into the temporal lobe (Meyer), main loop takes the parietal route (Baumgarten).' },
      { at: 0.78, kind: 'station', label: 'Optic radiation', entry: cuneusL, caption: 'Meyer loop lesions (temporal) knock out the upper field (“pie in the sky”); parietal-loop lesions the lower. The loops ARE the clinical signs.' },
      { at: 1.0, kind: 'target', label: 'Calcarine cortex (cuneus/lingual target zone)', entry: cuneusL, caption: 'Arrival: V1 around the calcarine sulcus — cuneus above maps the inferior field, lingual below the superior field.' },
    ],
  };

  // Schematic midbrain station points for the pupillary circuit.
  const pretectal = () => C(posteriorCommissure, 0, -0.012, -0.018);
  const ewPoint = side => {
    const crus = side === 'L' ? crusL : crusR2;
    const cn3 = side === 'L' ? cn3L : cn3R;
    return C(crus).lerp(C(cn3), 0.35).add(new ctx.Vector3(side === 'L' ? 0.006 * r / 0.412 : -0.006 * r / 0.412, 0.02 * r, -0.01 * r));
  };
  const pupilPoint = side => {
    const on = side === 'L' ? opticNerveL : opticNerveR;
    return C(on, 0, 0.004, 0.055);
  };

  const pupillary = {
    key: 'pupillary',
    kind: 'graph',
    label: 'pupillary light reflex — direct + consensual',
    kicker: 'FIRE · PUPILLARY LIGHT REFLEX',
    intro: 'Light in the LEFT eye. Both pupils answer — find the fork that makes it consensual.',
    color: 0xc9a7ff,
    duration: 9000,
    entries: [opticNerveL, chiasm, opticTractL, brachiumSCL, posteriorCommissure, cn3L, cn3R],
    chain: 'Retina → CN II → chiasm → optic tract → brachium of superior colliculus → ○ pretectal olivary nucleus → BILATERAL ◆ → ○ Edinger–Westphal ×2 → CN III → ○ ciliary ganglion → sphincter pupillae ×2',
    crossing: '◆ Bilateral split at the pretectum — part crosses in the posterior commissure. This fork is why the consensual reflex exists',
    buildPoints: () => [
      C(opticNerveL, 0.008, 0, 0.02),
      C(chiasm, 0.008, 0.004, 0),
      C(opticTractL, 0, 0.004, 0),
      C(brachiumSCL),
      pretectal(),
      ewPoint('L'),
      C(cn3L),
      pupilPoint('L'),
    ],
    extraCurves: [
      {
        // Consensual arm: pretectum → posterior commissure → right EW → right CN III → right pupil.
        color: 0xa98ae0,
        buildPoints: () => [
          pretectal(),
          C(posteriorCommissure, -0.008, -0.006, -0.01),
          ewPoint('R'),
          C(cn3R),
          pupilPoint('R'),
        ],
      },
    ],
    stations: [
      { at: 0.0, kind: 'origin', label: 'Left retina → CN II', entry: opticNerveL, caption: 'Light hits the left retina; intrinsically photosensitive ganglion cells fire into the optic nerve.' },
      { at: 0.22, kind: 'station', label: 'Optic tract → brachium of superior colliculus', entry: brachiumSCL, caption: 'Pupillary fibres LEAVE the visual highway before the LGN, exiting via the brachium of the superior colliculus — which is why cortical blindness can spare the light reflex.' },
      { at: 0.48, kind: 'synapse', label: '○ Pretectal olivary nucleus (schematic station)', entry: posteriorCommissure, caption: '○ SYNAPSE: pretectal olivary nucleus in the dorsal midbrain (marker — BP3D has no mesh for it).' },
      { at: 0.58, kind: 'decussation', label: '◆ Bilateral projection (posterior commissure)', entry: posteriorCommissure, caption: '◆ THE FORK: pretectal output reaches BOTH Edinger–Westphal nuclei, part crossing in the posterior commissure. One afferent signal, two motor answers.' },
      { at: 0.72, kind: 'synapse', label: '○ Edinger–Westphal → CN III (schematic station)', entry: cn3L, caption: '○ Preganglionic parasympathetics join CN III (on its surface — first to suffer in compression). A second synapse waits in the ciliary ganglion.' },
      { at: 1.0, kind: 'target', label: 'Sphincter pupillae — BOTH pupils (schematic termini)', entry: cn3R, caption: 'Short ciliary nerves contract both sphincters: left DIRECT, right CONSENSUAL. A unilateral afferent lesion breaks both responses to that eye — the RAPD (Marcus Gunn) sign.' },
    ],
  };

  const reflex = {
    key: 'reflex',
    kind: 'graph',
    label: 'monosynaptic stretch reflex (schematic arc)',
    kicker: 'FIRE · STRETCH REFLEX',
    intro: 'The fastest circuit in this atlas: out of the cord, one synapse, straight back. Everything peripheral is schematic — no muscle is modelled yet.',
    color: 0x9fe870,
    duration: 5200,
    entries: [cord],
    chain: 'Muscle spindle → Ia afferent → dorsal root ganglion → dorsal root → ○ α-motor neuron (ONE synapse) → ventral root → same muscle',
    crossing: 'No decussation — the only FIRE circuit that never crosses, never ascends, and answers in ~30 ms',
    buildPoints: () => [
      cordPointAt(0.8, 7.5, 0.4),
      cordPointAt(0.8, 3.4, -0.2),
      cordPointAt(0.8, 0.85, -0.6),
      cordPointAt(0.8, 0.3, 0.45),
      cordPointAt(0.8, 1.8, 0.8),
      cordPointAt(0.8, 7.5, 1.4),
    ],
    stations: [
      { at: 0.0, kind: 'origin', label: 'Muscle spindle (schematic — periphery not modelled)', entry: cord, caption: 'A tendon tap stretches the spindle. The Ia afferent races centrally at ~100 m/s.' },
      { at: 0.28, kind: 'station', label: 'Dorsal root ganglion (schematic station)', entry: cord, caption: 'Cell body in the dorsal root ganglion — a pseudounipolar neuron whose central process enters the cord. Herpes zoster sleeps in exactly this ganglion.' },
      { at: 0.52, kind: 'synapse', label: '○ α-motor neuron, ventral horn (schematic station)', entry: cord, caption: '○ THE ONE SYNAPSE: Ia directly excites the α-motor neuron of the SAME muscle — while a Ia inhibitory interneuron (not drawn) silences the antagonist.' },
      { at: 1.0, kind: 'target', label: 'Same muscle contracts (schematic terminus)', entry: cord, caption: 'Ventral root → nerve → neuromuscular junction → contraction. Brisk in UMN lesions (lost descending inhibition), absent in LMN lesions — the tendon hammer localises.' },
    ],
  };

  return { cst, dcml, stt, vision, pupillary, reflex };
}
