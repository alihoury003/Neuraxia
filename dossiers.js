/**
 * NEURAXIA Sprint 1C — structure dossier seed data.
 *
 * Keyed by structure "family": the BP3D concept_id with any left-/right-
 * prefix removed, so one dossier serves both sides. Content is concise,
 * clinically oriented teaching text. EVERY entry is a DRAFT pending expert
 * neuroanatomy review — the UI badges it as such. Do not present these as
 * faculty-validated until the review gate in SPRINT_1B_DECISION_REPORT.md
 * is cleared.
 *
 * Fields:
 *   fx     — what it does / what it is, in one or two lines
 *   pearl  — the clinical hook an examiner actually asks about
 *   path   — pathway / circuit role (feeds FIRE IT teaching)
 */

export const DOSSIER_REVIEW_STATE = 'draft — expert review pending';

const D = (fx, pearl, path) => ({ fx, pearl, path });

export const DOSSIERS = {
  'thalamus': D(
    'The great relay of the diencephalon: almost every sensory stream destined for cortex synapses here first (VPL/VPM body & face, LGN vision, MGN hearing), alongside motor (VA/VL) and limbic (anterior, mediodorsal) relays.',
    'A small thalamic stroke can cause dense contralateral sensory loss — and later, burning thalamic pain (Déjerine–Roussy syndrome).',
    'Third-order relay for DCML and spinothalamic pathways; origin of the thalamic radiations to postcentral cortex.'
  ),
  'Hypothalamus': D(
    'The body\'s homeostatic headquarters — temperature, hunger, thirst, circadian rhythm, autonomic output and pituitary control are integrated in its small nuclei around the third ventricle.',
    'Hypothalamic lesions produce combinations no cortical lesion can: disordered temperature, appetite, sleep and endocrine failure together.',
    'Master node of the limbic–autonomic interface; receives fornix input via mammillary bodies (Papez circuit).'
  ),
  'internal-capsule': D(
    'A compact white-matter funnel between thalamus/caudate medially and lentiform nucleus laterally. Its posterior limb packs corticospinal fibres (face→leg, front to back) and somatosensory radiations into a few millimetres.',
    'Because everything is packed so tightly, a tiny lacunar infarct here causes a dense contralateral face-arm-leg hemiparesis — the classic "capsular stroke".',
    'FIRE IT highway: lateral CST descends through the posterior limb; third-order sensory fibres ascend through it to cortex.'
  ),
  'corpus-callosum': D(
    'The largest commissural system in the brain — roughly 200 million axons linking homotopic cortical areas of the two hemispheres (genu, body, splenium).',
    'Surgical callosotomy for epilepsy produces split-brain phenomena: the left hand literally does not know what the right hemisphere saw.',
    'Interhemispheric transfer; splenial fibres carry visual information between occipital cortices.'
  ),
  'hippocampus': D(
    'Sea-horse-shaped allocortex in the medial temporal lobe essential for forming new declarative memories; its output leaves via the fornix.',
    'Bilateral hippocampal damage (the famous patient H.M.) abolishes new long-term memory formation while leaving intellect and old memories intact.',
    'Entry point of the Papez circuit: hippocampus → fornix → mammillary bodies → anterior thalamus → cingulate.'
  ),
  'amygdala': D(
    'Almond-shaped nuclear complex at the temporal pole assigning emotional salience — fear conditioning, threat detection and autonomic arousal.',
    'Bilateral amygdala destruction (Klüver–Bucy syndrome) produces placidity, hyperorality and loss of fear.',
    'Outputs via stria terminalis and ventral amygdalofugal pathway to Hypothalamus and brainstem autonomic centres.'
  ),
  'caudate-nucleus': D(
    'C-shaped striatal nucleus hugging the lateral ventricle; with the putamen it forms the input stage of the basal ganglia, receiving cortical glutamatergic drive.',
    'Caudate atrophy gives the "boxed-out" frontal horns on imaging in Huntington disease — chorea with dementia.',
    'Striatal gate of the direct/indirect motor loops through globus pallidus and substantia nigra pars reticulata.'
  ),
  'putamen': D(
    'The outer lentiform nucleus; principally motor territory of the striatum, somatotopically organised for the contralateral body.',
    'The putamen is a favourite site for hypertensive intracerebral haemorrhage — sudden dense hemiplegia with gaze deviation toward the lesion.',
    'Motor striatum: cortex → putamen → pallidum → thalamus → cortex loop that gates the corticospinal output.'
  ),
  'globus-pallidus': D(
    'The output-tuning core of the basal ganglia: external segment shapes the indirect pathway, internal segment tonically inhibits thalamus to brake unwanted movement.',
    'Pallidal deep-brain stimulation is a mainstay therapy for dystonia and advanced Parkinson disease.',
    'GPi output (with SNr) sets the gain on thalamocortical motor drive.'
  ),
  'substantia-nigra': D(
    'Midbrain nucleus whose pars compacta dopaminergic neurons project to striatum; pars reticulata is a basal-ganglia output nucleus. Its dark neuromelanin gives the "black substance" its name.',
    'Loss of pars compacta dopamine neurons = Parkinson disease: bradykinesia, rigidity, rest tremor.',
    'Nigrostriatal dopamine modulates direct (D1, go) and indirect (D2, no-go) pathways.'
  ),
  'subthalamic-nucleus': D(
    'Small lens-shaped glutamatergic nucleus — the accelerator of the indirect pathway, driving GPi/SNr output.',
    'A subthalamic lesion releases wild flinging movements of the contralateral limbs: hemiballismus.',
    'Hyperdirect pathway target: cortex → STN → GPi for rapid stopping of movement; a prime DBS target.'
  ),
  'red-nucleus': D(
    'Midbrain tegmental nucleus receiving cerebellar output and giving rise to the rubrospinal tract, mostly influencing upper-limb flexor tone.',
    'Midbrain lesions here combine a third-nerve palsy with contralateral tremor/ataxia (Benedikt syndrome).',
    'Cerebello-rubro-spinal side-loop modulating the corticospinal command.'
  ),
  'precentral-gyrus': D(
    'Primary motor cortex (Brodmann 4) on the anterior bank of the central sulcus — the homunculus, with giant Betz cells giving the fastest corticospinal axons.',
    'A lesion here weakens the contralateral body in a homuncular pattern; face and hand dominate because they own the most cortical territory.',
    'Origin station of the lateral corticospinal tract in FIRE IT.'
  ),
  'postcentral-gyrus': D(
    'Primary somatosensory cortex (areas 3, 1, 2): discriminative touch, vibration and proprioception are mapped here in a sensory homunculus.',
    'Cortical sensory loss is distinctive — astereognosis and agraphesthesia with preserved crude touch point to parietal cortex, not cord.',
    'Final cortical target of both DCML (fine touch) and spinothalamic (localised pain) third-order neurons.'
  ),
  'insula': D(
    'The hidden fifth lobe, buried in the lateral sulcus: interoception, taste, visceral sensation and the affective dimension of pain.',
    'Insular strokes can abolish the unpleasantness of pain while its location is still perceived — pain asymbolia.',
    'Receives spinothalamic affective input via posterior thalamus; key node of the salience network.'
  ),
  'cingulate-gyrus': D(
    'Limbic cortex arching above the corpus callosum; anterior parts drive motivation and pain affect, posterior parts feed memory networks.',
    'Anterior cingulate damage can produce akinetic mutism — awake, eyes tracking, but utterly without drive to act.',
    'Papez circuit relay between anterior thalamus and entorhinal/hippocampal memory systems.'
  ),
  'cuneus': D(
    'Medial occipital wedge above the calcarine sulcus; with the lingual gyrus it frames primary visual cortex (V1) — cuneus maps the inferior visual field.',
    'A lesion above the calcarine sulcus causes an inferior quadrantanopia — the reverse of a temporal-lobe (Meyer loop) lesion.',
    'Upper-bank terminus of the optic radiation (Baumgarten/parietal loop fibres).'
  ),
  'lingual-gyrus': D(
    'Medial occipital gyrus below the calcarine sulcus forming the lower bank of V1; maps the superior visual field.',
    'Posterior cerebral artery infarction here can cause a superior quadrantanopia or, with splenium involvement, alexia without agraphia.',
    'Lower-bank terminus of the optic radiation (Meyer temporal loop fibres).'
  ),
  'fornix': D(
    'The great arched output tract of the hippocampus, sweeping from alveus/fimbria over the thalamus to the mammillary bodies and septal area.',
    'Forniceal injury (e.g. after colloid-cyst surgery at the foramen of Monro) can cause a dense amnesic syndrome.',
    'Second link of the Papez circuit; pre- and post-commissural fibres split around the anterior commissure.'
  ),
  'mammillary-bodies': D(
    'Paired pea-sized posterior Hypothalamic nuclei relaying hippocampal output to the anterior thalamus via the mammillothalamic tract.',
    'Haemorrhagic atrophy here in thiamine deficiency underlies the amnesia of Wernicke–Korsakoff syndrome.',
    'Papez circuit: fornix in, mammillothalamic tract out.'
  ),
  'lateral-geniculate-body': D(
    'The thalamic visual relay: six layers keeping eye-of-origin and retinal eccentricity in strict register before projecting to V1.',
    'LGN lesions produce homonymous field defects that respect the horizontal meridian — a sectoranopia hints at its dual (anterior/posterior choroidal) supply.',
    'Synapse station of the visual pathway between optic tract and optic radiation.'
  ),
  'medial-geniculate-body': D(
    'The thalamic auditory relay, receiving the brachium of the inferior colliculus and projecting through the auditory radiation to Heschl gyri.',
    'Because hearing is bilaterally represented from the brainstem up, unilateral lesions here rarely cause noticeable deafness.',
    'Final subcortical station of the central auditory pathway.'
  ),
  'superior-colliculus': D(
    'Midbrain tectal centre for reflexive orienting of eyes and head toward visual stimuli, and the target of the retinal pupillary-reflex branch via its brachium.',
    'Dorsal midbrain compression (Parinaud syndrome, classically a pineal tumour) paralyses upgaze and the light reflex while sparing accommodation.',
    'Tectospinal/tectobulbar orienting; pretectal arm of the pupillary light reflex passes through its brachium.'
  ),
  'inferior-colliculus': D(
    'Obligatory midbrain relay of the auditory pathway, integrating binaural input from the lateral lemniscus before the medial geniculate body.',
    'Lesions disturb sound localisation far more than hearing thresholds.',
    'Lateral lemniscus → inferior colliculus → brachium → MGN → auditory cortex.'
  ),
  'cerebral-crus': D(
    'The ventral midbrain foot carrying descending cortical fibres in strict order: frontopontine, corticospinal/corticobulbar (middle), temporopontine.',
    'A crural lesion gives contralateral hemiparesis with an ipsilateral third-nerve palsy — Weber syndrome, the crossed sign that localises to midbrain.',
    'Corticospinal descent between internal capsule above and pontine base below.'
  ),
  'pons': D(
    'The bridge: basilar part relays cortex to cerebellum through pontine nuclei and middle cerebellar peduncles, while the tegmentum houses cranial-nerve nuclei V–VIII and gaze centres.',
    'Massive ventral pontine infarction causes locked-in syndrome — quadriplegia and anarthria with preserved consciousness and vertical eye movements.',
    'Corticospinal fibres thread between pontine nuclei; medial lemniscus and spinal lemniscus ascend in the tegmentum.'
  ),
  'medulla-oblongata': D(
    'The caudal brainstem: pyramids and their decussation ventrally, dorsal-column nuclei behind, and the cardiorespiratory reticular machinery within.',
    'Lateral medullary (Wallenberg) syndrome is the great crossed-sensory lesson: ipsilateral face, contralateral body pain/temperature loss — with vertigo, Horner and dysphagia.',
    'Site of BOTH great FIRE decussations: pyramidal (motor) and internal arcuate/sensory (DCML).'
  ),
  'cerebellum': D(
    'The little brain: fine-tunes movement by comparing intended with actual performance. Vermis governs trunk/gait, hemispheres govern ipsilateral limbs.',
    'Cerebellar signs are IPSILATERAL to the lesion — the great exception learners forget, because its pathways cross twice.',
    'Receives pontine mossy fibres and olivary climbing fibres; output via deep nuclei → superior peduncle → red nucleus/thalamus.'
  ),
  'spinal-cord': D(
    'The neuraxis below the foramen magnum: butterfly gray matter wrapped in ascending and descending white-matter funiculi, ending as the conus near L1/L2.',
    'Cord syndromes are pure pathway logic — Brown-Séquard hemisection splits DCML (ipsilateral) from spinothalamic (contralateral) loss below the lesion.',
    'FIRE-0 builds its tract ribbons on this mesh\'s real centreline: posterior columns, lateral CST and anterolateral system.'
  ),
  'cauda-equina': D(
    'The horse\'s tail of lumbosacral roots descending from the conus to their exit foramina within the lumbar cistern.',
    'Cauda equina syndrome (saddle anaesthesia, bladder retention, flaccid leg weakness) is a surgical emergency — and is LMN, unlike conus lesions.',
    'Lumbar puncture is performed below L2 precisely because only these mobile roots float here.'
  ),
  'optic-nerve': D(
    'Strictly a CNS tract, not a peripheral nerve: 1.2 million retinal ganglion-cell axons myelinated by oligodendrocytes, wrapped in meninges continuous with the subarachnoid space.',
    'That meningeal sleeve is why raised intracranial pressure swells the disc — papilloedema — and why meningiomas can grow along it.',
    'First segment of both the visual pathway and the pupillary light reflex afferent arm.'
  ),
  'optic-chiasm': D(
    'The partial crossing where nasal-retinal fibres decussate and temporal fibres stay ipsilateral, reorganising the image by visual hemifield.',
    'Compression from below by a pituitary adenoma classically produces bitemporal hemianopia — the patient bumps into door frames on both sides.',
    'The sorting station of the visual pathway: after the chiasm, each tract carries the contralateral hemifield.'
  ),
  'optic-tract': D(
    'Post-chiasmal fibres sweeping around the cerebral crus to the lateral geniculate body, with a pupillary branch leaving for the pretectum.',
    'Tract lesions cause an incongruous homonymous hemianopia with a relative afferent pupillary defect — a rare localising combination.',
    'Carries the contralateral hemifield to LGN; gives off the brachium branch for the light reflex.'
  ),
  'olfactory-nerve': D(
    'The only sensory system reaching cortex without a thalamic relay: receptor axons pierce the cribriform plate to the olfactory bulb.',
    'These fila are sheared in head injury at the cribriform plate — post-traumatic anosmia, sometimes with CSF rhinorrhoea.',
    'Smell projects directly to piriform cortex and amygdala — hence its visceral grip on memory and emotion.'
  ),
  'olfactory-tract': D(
    'White-matter band from olfactory bulb to the anterior perforated substance, dividing into medial and lateral striae.',
    'Tumours beneath the frontal lobe here can cause Foster Kennedy syndrome: ipsilateral anosmia and optic atrophy with contralateral papilloedema.',
    'A CNS tract in cranial-nerve clothing — myelinated by oligodendrocytes like the optic nerve.'
  ),
  'oculomotor-nerve': D(
    'CN III: most extraocular muscles, levator palpebrae, and the parasympathetic fibres for pupil constriction travelling on its superficial aspect.',
    'Pupil involvement separates surgical from medical III palsies: compression (posterior communicating aneurysm) hits the superficial pupil fibres first; diabetic microvascular palsy spares them.',
    'Efferent arm of the pupillary light reflex: Edinger–Westphal → CN III → ciliary ganglion → sphincter pupillae.'
  ),
  'trochlear-nerve': D(
    'CN IV: the thinnest cranial nerve, the only one to exit dorsally and to decussate completely, supplying the superior oblique.',
    'Its long intracranial course makes it the nerve most often injured in head trauma — patients tilt their head away from the lesion to fuse images.',
    'Superior oblique: intorsion and depression in adduction ("SO4").'
  ),
  'trigeminal-nerve': D(
    'CN V: sensation of the face in three divisions (V1–V3) plus motor to the muscles of mastication; its spinal nucleus for pain/temperature descends to the upper cervical cord.',
    'That long spinal nucleus explains Wallenberg syndrome\'s ipsilateral facial pain/temperature loss and the "onion-skin" pattern of perioral sparing.',
    'The face\'s counterpart of DCML/STT: trigeminal lemnisci carry discriminative and pain streams to VPM.'
  ),
  'abducens-nerve': D(
    'CN VI: the long climb from pons over the petrous apex to the lateral rectus — the eye\'s abductor.',
    'Its tethered course makes VI palsy a classic false-localising sign of raised intracranial pressure.',
    'Pontine abducens nucleus also houses the horizontal gaze machinery via the MLF to the opposite medial rectus.'
  ),
  'facial-nerve': D(
    'CN VII: muscles of facial expression, taste from the anterior two-thirds of the tongue, stapedius and lacrimal/salivary parasympathetics. The forehead receives bilateral upper-motor input.',
    'Forehead sparing separates a central (UMN) facial weakness from Bell palsy (LMN), where the whole half of the face — forehead included — fails.',
    'Its nucleus wraps the abducens nucleus, forming the facial colliculus in the floor of the fourth ventricle.'
  ),
  'vestibulocochlear-nerve': D(
    'CN VIII: hearing and balance from inner ear to pontomedullary junction, travelling with the facial nerve through the internal acoustic meatus.',
    'A vestibular schwannoma at the cerebellopontine angle grows here — unilateral sensorineural hearing loss and tinnitus, later stretching V and VII.',
    'Cochlear division feeds the only sensory system that is bilateral from the second synapse onward.'
  ),
  'glossopharyngeal-nerve': D(
    'CN IX: taste and sensation from the posterior third of the tongue, the carotid sinus baroreceptor afferents, stylopharyngeus and parotid parasympathetics.',
    'It is the afferent limb of the gag reflex (IX in, X out) and of carotid-sinus blood-pressure control.',
    'Solitary nucleus input links taste and visceral sensation to Hypothalamic/autonomic output.'
  ),
  'vagus-nerve': D(
    'CN X: the wanderer — parasympathetic command of thorax and abdomen to the splenic flexure, plus laryngeal muscles and visceral sensation.',
    'The left recurrent laryngeal branch loops under the aortic arch: hoarseness can be the presenting sign of an apical lung tumour or aortic aneurysm (Ortner syndrome).',
    'Dorsal motor nucleus and nucleus ambiguus anchor medullary autonomic and swallowing circuits.'
  ),
  'accessory-nerve': D(
    'CN XI: sternocleidomastoid and trapezius, its spinal root ascending from C1–C5 through the foramen magnum to exit via the jugular foramen.',
    'It crosses the posterior triangle of the neck superficially — a favourite casualty of lymph-node biopsy, causing shoulder drop.',
    'Test it: shrug (trapezius) and turn the head against resistance (contralateral SCM).'
  ),
  'hypoglossal-nerve': D(
    'CN XII: pure motor to the tongue, emerging between pyramid and olive and exiting through its own hypoglossal canal.',
    'The tongue deviates TOWARD a lower-motor XII lesion ("the tongue licks its wounds") — with atrophy and fasciculations on that side.',
    'Medial medullary syndrome triad: ipsilateral XII, contralateral hemiparesis and proprioception loss.'
  ),
  'lateral-ventricle': D(
    'C-shaped CSF cavity of each hemisphere (frontal, temporal and occipital horns) lined by ependyma, draining through the interventricular foramen to the third ventricle.',
    'Its shape is a fossil of cortical development — and its walls (caudate, thalamus, hippocampus) are a ready-made anatomy exam.',
    'Start of the ventricular voyage: choroid plexus here produces much of the ~500 mL of CSF made daily.'
  ),
  'third-ventricle': D(
    'Midline slit between the thalami and hypothalami; its floor is Hypothalamus, its roof the tela choroidea.',
    'A colloid cyst at its anterior end can intermittently ball-valve the foramen of Monro — positional headaches and sudden hydrocephalus.',
    'Connects lateral ventricles (via foramina of Monro) to the cerebral aqueduct.'
  ),
  'cerebral-aqueduct': D(
    'The narrowest channel of the CSF system, ~15 mm long through the midbrain periaqueductal gray.',
    'Its narrowness makes it the classic site of congenital stenosis — obstructive hydrocephalus with a normal fourth ventricle.',
    'Chokepoint between third and fourth ventricles; surrounded by pain-modulating periaqueductal gray.'
  ),
  'fourth-ventricle': D(
    'Tent-shaped cavity between brainstem and cerebellum; CSF exits through foramina of Luschka and Magendie into the subarachnoid space.',
    'Paediatric tumours love this address — medulloblastoma and ependymoma present with obstructive hydrocephalus and morning vomiting.',
    'Its floor (rhomboid fossa) displays the bumps of cranial-nerve nuclei VI, VII, X and XII.'
  ),
  'choroid-plexus': D(
    'Fenestrated capillary tufts clothed in secretory ependyma producing cerebrospinal fluid — roughly 500 mL/day, turning over the CSF volume ~3 times daily.',
    'Choroid plexus papillomas can cause hydrocephalus by OVERPRODUCING CSF — one of the few hypersecretory causes.',
    'The blood–CSF barrier lives in its tight-junctioned epithelium.'
  ),
  'central-canal-of-spinal-cord': D(
    'The slender CSF channel continuing the ventricular system down the cord\'s core, largely occluded in adults.',
    'Dilatation here (syringomyelia) interrupts crossing spinothalamic fibres — the suspended, cape-like loss of pain and temperature with preserved touch.',
    'Anatomical proof of the FIRE teaching point: spinothalamic fibres cross in the anterior white commissure just ventral to this canal.'
  ),
  'pineal-body': D(
    'Midline epithalamic gland secreting melatonin under suprachiasmatic control; calcifies with age, making it a radiological midline landmark.',
    'Pineal-region tumours compress the tectal plate → Parinaud syndrome (upgaze palsy, light-near dissociation) and aqueductal hydrocephalus.',
    'Circadian output arm: SCN → sympathetic chain → pineal melatonin rhythm.'
  ),
  'pituitary-gland': D(
    'The master endocrine gland hanging from the Hypothalamus in the sella turcica; anterior lobe under portal-vessel control, posterior lobe a Hypothalamic axon terminal field.',
    'Its stalk passes the optic chiasm — a pituitary macroadenoma announces itself to the neuro-ophthalmologist as bitemporal hemianopia.',
    'Shown as context: the effector through which Hypothalamic nuclei command the endocrine system.'
  ),
  'anterior-commissure': D(
    'Compact round bundle crossing before the fornix columns, linking olfactory and anterior temporal cortices of the two sides.',
    'Its ventral relation to the foramen of Monro makes it a surgical landmark in third-ventricular approaches.',
    'The older of the two great telencephalic commissures (the corpus callosum is the newer, larger one).'
  ),
  'falx-cerebri': D(
    'Sickle of dura descending into the longitudinal fissure between the hemispheres, housing the superior and inferior sagittal sinuses in its edges.',
    'Parasagittal meningiomas arise from it — classically causing contralateral leg weakness by compressing the paracentral lobule.',
    'A rigid partition: mass effect shoves the cingulate gyrus beneath it in subfalcine herniation.'
  ),
  'right-half-of-tentorium-cerebelli': D(
    'The tent-shaped dural roof of the posterior fossa separating occipital/temporal lobes from the cerebellum, with the incisura for the midbrain. (BodyParts3D models only this right half.)',
    'The uncus herniates over its free edge in raised ICP — compressing CN III (blown pupil) and the posterior cerebral artery.',
    'Defines supra- vs infra-tentorial compartments — the first sorting question in posterior-fossa surgery.'
  ),
  'cerebral-dura-mater': D(
    'The tough outer meningeal envelope of the brain, fused to skull periosteum except where it splits to form venous sinuses and partitions.',
    'Its arterial companion is the story of the extradural haematoma: middle meningeal artery bleeding strips dura from skull after temporal fracture.',
    'Shown in the optional layer — enable it to appreciate the container every other structure lives in.'
  ),
  'suprachiasmatic-nucleus': D(
    'Tiny Hypothalamic nucleus above the optic chiasm receiving direct retinal input — the master circadian clock.',
    'Destroy it and sleep shatters into arrhythmic fragments, though total sleep time is preserved.',
    'Retinohypothalamic tract entrains clock → pineal melatonin and autonomic rhythms.'
  ),
  'paraventricular-nucleus-of-hypothalamus': D(
    'Magnocellular source of oxytocin and vasopressin (ADH) shipped down axons to the posterior pituitary, plus parvocellular neurons driving the HPA axis (CRH).',
    'Also a descending autonomic command nucleus — one of the few places where endocrine and autonomic control share an address.',
    'Hypothalamo-hypophyseal tract to posterior pituitary; projections to brainstem and cord autonomic centres.'
  ),
  'supraoptic-nucleus': D(
    'Magnocellular Hypothalamic nucleus synthesising vasopressin and oxytocin for release from the posterior pituitary.',
    'Damage to this system (or the stalk) causes central diabetes insipidus — litres of dilute urine and unquenchable thirst.',
    'Partner of the paraventricular nucleus in neurohypophyseal secretion.'
  ),
  'arcuate-nucleus-of-hypothalamus': D(
    'Infundibular nucleus sensing leptin, insulin and ghrelin; its POMC (satiety) and NPY/AgRP (hunger) neurons are the first-order appetite switchboard.',
    'It is also the source of most releasing hormones (GHRH, dopamine-as-PIF) delivered to the portal vessels at the median eminence.',
    'Tuberoinfundibular output governs anterior pituitary secretion.'
  ),
  'ventromedial-nucleus-of-hypothalamus': D(
    'Classic "satiety centre": integrates leptin and glucose signals to restrain feeding and shape autonomic tone.',
    'Bilateral lesions produce hyperphagia and rage — the mirror image of lateral Hypothalamic aphagia.',
    'Reciprocal partner of the lateral hypothalamic area in energy-balance circuits.'
  ),
  'lateral-hypothalamic-nucleus': D(
    'The "feeding centre" and arousal engine: orexin/hypocretin neurons here stabilise wakefulness and reward-seeking.',
    'Selective loss of its orexin neurons causes narcolepsy with cataplexy.',
    'Orexin projections brace the monoaminergic arousal system (locus coeruleus, raphe, tuberomammillary nucleus).'
  ),
  'stria-terminalis': D(
    'Slender limbic tract carrying amygdala output in the groove between caudate and thalamus to septal and Hypothalamic targets.',
    'It is the anatomical signature of the bed nucleus of the stria terminalis — a hub of sustained anxiety as opposed to phasic fear.',
    'Amygdala’s dorsal output route, complementing the ventral amygdalofugal pathway.'
  ),
  'mammillothalamic-tract': D(
    'Compact bundle from mammillary bodies to anterior thalamic nuclei — the third link of Papez memory circuit.',
    'It is visible as a dot on sagittal MRI at the foramen of Monro — a useful surgical landmark.',
    'Mammillary → anterior thalamus → cingulate memory relay.'
  ),
  'habenula': D(
    'Epithalamic relay translating limbic forebrain signals into midbrain monoamine control — increasingly implicated in depression and aversion.',
    'Its stria medullaris input and fasciculus retroflexus output make it one of the most conserved circuits in vertebrates.',
    'Lateral habenula inhibits dopamine/serotonin centres — an "anti-reward" brake.'
  ),
  'superior-temporal-gyrus': D(
    'Lateral temporal gyrus containing Heschl transverse gyri (primary auditory cortex) and, posteriorly on the dominant side, Wernicke receptive language area.',
    'A posterior dominant-hemisphere lesion gives fluent but empty speech with poor comprehension — Wernicke aphasia.',
    'Terminus of the auditory radiation from the medial geniculate body.'
  ),
  'inferior-frontal-gyrus': D(
    'Contains Broca area (pars opercularis/triangularis, areas 44/45) in the dominant hemisphere — the motor planning of speech.',
    'Lesion = Broca aphasia: effortful, telegraphic speech with relatively preserved comprehension and frustrated awareness.',
    'Connected to Wernicke area by the arcuate/SLF system — cortical language loop.'
  ),
  'angular-gyrus': D(
    'Parietal association cortex at the temporo-parietal junction integrating vision, language and number.',
    'Dominant angular lesions give Gerstmann tetrad: agraphia, acalculia, finger agnosia, left–right confusion.',
    'A default-mode and semantic-network hub.'
  ),
  'supramarginal-gyrus': D(
    'Inferior parietal lobule wrapping the end of the lateral sulcus; phonological processing and body-schema integration.',
    'Dominant lesions contribute to conduction aphasia — fluent speech, good comprehension, disproportionately poor repetition.',
    'Linked to Broca and Wernicke areas in the perisylvian language network.'
  ),
  'parahippocampal-gyrus': D(
    'Medial temporal gyrus housing entorhinal cortex — the gateway through which neocortex speaks to the hippocampus.',
    'Entorhinal cortex is where Alzheimer neurofibrillary pathology begins (Braak stage I) — memory fails first.',
    'Perforant path: entorhinal layer II → dentate gyrus, the entry of the trisynaptic circuit.'
  ),
  'precuneus': D(
    'Medial parietal hub of the default-mode network — self-referential thought, episodic retrieval and visuospatial imagery.',
    'Among the earliest sites of hypometabolism in Alzheimer disease on FDG-PET.',
    'Dense reciprocal links with posterior cingulate and medial temporal memory systems.'
  ),
  'superior-parietal-lobule': D(
    'Dorsal-stream parietal cortex computing body-in-space: proprioceptive maps for reaching and manipulation.',
    'Lesions impair stereognosis and two-point discrimination — "cortical" sensory signs.',
    'Dorsal visual stream ("where/how") with frontal eye and premotor fields.'
  ),
  'fusiform-gyrus': D(
    'Ventrolateral occipitotemporal gyrus containing high-level visual areas, including the fusiform face area.',
    'Right fusiform lesions can cause prosopagnosia — faces seen perfectly but recognised by voice instead.',
    'Ventral visual stream ("what") from occipital to anterior temporal cortex.'
  ),
  'straight-gyrus': D(
    'Medial orbital frontal gyrus (gyrus rectus) involved in value judgement and social regulation.',
    'Orbitofrontal damage classically unmakes personality — the Phineas Gage lesson — before it touches intellect.',
    'Part of orbitomedial prefrontal networks with amygdala and ventromedial striatum.'
  ),
  /* — Sprint 1D expansion — */
  'anterior-nucleus-of-hypothalamus': D(
    'Anterior Hypothalamic nucleus: parasympathetic and heat-dissipation control (sweating, vasodilation) in thermoregulation.',
    'Anterior = “air conditioning”, posterior = “heating”: anterior lesions cause hyperthermia, posterior lesions poikilothermia.',
    'Integrates preoptic temperature signals with autonomic output to brainstem and cord.'
  ),
  'posterior-nucleus-of-hypothalamus': D(
    'Posterior Hypothalamic nucleus: sympathetic activation, heat conservation/production and arousal (histaminergic tuberomammillary neighbours).',
    'Stimulation here produces a full sympathetic “fight-or-flight” pattern — pressor, mydriasis, piloerection.',
    'Descending projections to periaqueductal gray and medullary autonomic centres.'
  ),
  'dorsomedial-nucleus-of-hypothalamus': D(
    'Relay between brainstem visceral input, the suprachiasmatic clock and other Hypothalamic effectors; shapes daily rhythms of feeding and cortisol.',
    'In classic experiments its lesions blunt growth and circadian organisation rather than one single drive.',
    'NTS → dorsomedial nucleus → paraventricular/lateral Hypothalamic autonomic circuits.'
  ),
  'medial-preoptic-nucleus': D(
    'Warm-sensitive preoptic neurons that set the body-temperature set-point and drive male-typical and parental behaviours in animal models.',
    'Prostaglandin E2 acts here during fever — antipyretics work by resetting this very thermostat.',
    'Median preoptic → dorsomedial/raphe pallidus thermoeffector pathway.'
  ),
  'lateral-preoptic-nucleus': D(
    'Preoptic area beside the optic chiasm containing sleep-active VLPO-adjacent populations and osmosensitive neurons of the lamina terminalis region.',
    'Damage in this neighbourhood can impair both sleep initiation and thirst-driven drinking.',
    'GABA/galanin sleep neurons inhibit the arousal system (flip-flop switch with orexin).'
  ),
  'periventricular-nucleus': D(
    'Thin sheet of neurons hugging the third-ventricle wall; source of somatostatin that restrains growth-hormone release.',
    'Its periventricular position puts it first in line for signals arriving through the CSF and median eminence.',
    'Short projections to median eminence portal capillaries.'
  ),
  'tuber-cinereum': D(
    'The raised floor of the third ventricle between mammillary bodies and infundibulum — surface landmark over the arcuate nucleus and median eminence.',
    'Hamartomas here are a classic cause of gelastic (laughing) seizures and precocious puberty in children.',
    'Roof of the tuberoinfundibular system feeding the portal circulation.'
  ),
  'lamina-terminalis': D(
    'Thin rostral wall of the third ventricle housing the OVLT — a circumventricular organ sensing blood osmolality and angiotensin II.',
    'Because the OVLT lacks a blood–brain barrier, it is where circulating pyrogens and osmolality “talk” to the brain.',
    'OVLT → median preoptic → supraoptic/paraventricular thirst and ADH circuits.'
  ),
  'interventricular-foramen': D(
    'The foramen of Monro: each lateral ventricle drains through this short channel into the third ventricle, bounded by fornix and thalamus.',
    'A colloid cyst parked here can ball-valve both foramina — positional headache and sudden obstructive hydrocephalus.',
    'Gate 1 of the ventricular voyage; choroid plexus and thalamostriate vein mark it surgically.'
  ),
  'posterior-commissure': D(
    'Small white-matter bundle crossing the rostral aqueduct, carrying pretectal fibres to the contralateral Edinger–Westphal nucleus.',
    'It is the anatomical reason the consensual light reflex exists — and a landmark the pineal region surgeon respects.',
    'Crossing arm of the pupillary light-reflex pathway in FIRE.'
  ),
  'commissure-of-fornix-of-forebrain': D(
    'Hippocampal commissure (psalterium): fibres crossing beneath the splenium linking the two hippocampal formations via the fornices.',
    'It rides with the fornix at the foramen of Monro — the neighbourhood where colloid-cyst surgery risks memory.',
    'Inter-hippocampal limb of the Papez circuit.'
  ),
  'stria-medullaris-of-thalamus': D(
    'Slender epithalamic bundle carrying septal/preoptic input along the thalamic roof to the habenula.',
    'Together with the habenular commissure it frames the pineal recess — imaging landmark territory.',
    'Input arm of the habenular anti-reward circuit.'
  ),
  'septum-of-telencephalon': D(
    'Septal area medial to the nucleus accumbens region: pleasure/reward modulation, theta-rhythm pacing of hippocampus via cholinergic projections.',
    'Medial septal cholinergic loss contributes to hippocampal dysfunction in Alzheimer disease.',
    'Septohippocampal projection through the fornix sets hippocampal theta.'
  ),
  'brachium-of-superior-colliculus': D(
    'Fibre arm linking retina/pretectum with the superior colliculus — the exit ramp pupillary fibres take from the optic tract.',
    'Because these fibres leave before the LGN, the light reflex survives occipital (cortical) blindness — a bedside localiser.',
    'Afferent arm waypoint of the pupillary light reflex in FIRE.'
  ),
  'brachium-of-inferior-colliculus': D(
    'Fibre arm carrying auditory output from inferior colliculus to the medial geniculate body.',
    'It is the visible “bridge” between the two posterior thalamic bumps on a dorsal brainstem view.',
    'Penultimate link of the central auditory pathway.'
  ),
  'ophthalmic-nerve': D(
    'V1 division of trigeminal: sensation from forehead, orbit, cornea and anterior scalp; travels in the cavernous sinus wall and superior orbital fissure.',
    'Herpes zoster ophthalmicus on the nasal tip (Hutchinson sign) warns of ocular involvement via the nasociliary branch.',
    'Afferent limb of the corneal reflex (V1 in, VII out).'
  ),
  'maxillary-nerve': D(
    'V2 division of trigeminal: midface, upper teeth and palate sensation, exiting via foramen rotundum to the pterygopalatine fossa.',
    'Its infraorbital branch is the one numb after an orbital-floor “blow-out” fracture.',
    'Pure sensory division to trigeminal ganglion → principal/spinal trigeminal nuclei.'
  ),
  'mandibular-nerve': D(
    'V3: the only trigeminal division with motor fibres — muscles of mastication — plus lower-face, lower-teeth and anterior-tongue general sensation via foramen ovale.',
    'The inferior alveolar branch is the dentist’s target; lingual involvement after third-molar surgery is a classic complaint.',
    'Motor root joins V3 distal to the ganglion — jaw jerk tests its mesencephalic proprioceptive loop.'
  ),
  'superior-frontal-gyrus': D(
    'Dorsolateral and medial prefrontal territory for working memory, self-monitoring and, medially, the supplementary motor area near its caudal end.',
    'SMA lesions cause a transient syndrome of contralateral akinesia and (dominant side) mutism that famously recovers.',
    'Prefrontal node of executive and default-mode borderlands.'
  ),
  'middle-frontal-gyrus': D(
    'Dorsolateral prefrontal cortex (areas 9/46): working memory, planning and the frontal eye field near its caudal pole.',
    'Destructive lesions deviate the eyes TOWARD the lesion; irritative (seizure) lesions drive them away — the frontal-eye-field rule.',
    'Frontoparietal control network with superior parietal lobule.'
  ),
  'middle-temporal-gyrus': D(
    'Lateral temporal association cortex for semantic knowledge and language comprehension interfaces.',
    'Part of the territory that, when injured in the dominant hemisphere, degrades word meaning while fluency survives.',
    'Ventral language stream partner of the angular gyrus and anterior temporal lobe.'
  ),
  'inferior-temporal-gyrus': D(
    'High-level visual cortex of the ventral stream — complex object and category representations feeding the fusiform and anterior temporal lobe.',
    'Lesions contribute to visual agnosias: seeing the parts, missing the object.',
    '“What” pathway from occipital cortex toward the temporal pole.'
  ),
  'lateral-occipital-gyrus': D(
    'Extrastriate visual cortex for shape and object structure between V1 and temporal/parietal streams.',
    'Bilateral damage can produce apperceptive agnosia despite intact acuity and fields.',
    'Fork of ventral (what) and dorsal (where/how) visual streams.'
  ),
  'superior-occipital-gyrus': D(
    'Dorsal extrastriate cortex feeding the parietal dorsal stream for spatial vision and visually guided action.',
    'Posterior parietal-occipital injury underlies elements of Balint syndrome (simultanagnosia, optic ataxia).',
    'Dorsal-stream relay toward superior parietal lobule.'
  ),
  'anterior-orbital-gyrus': D(
    'Front part of the orbitofrontal cortex: value assignment, decision under uncertainty and social inhibition.',
    'Orbitofrontal injury releases disinhibition and poor judgement long before memory or IQ move.',
    'Reciprocal loops with amygdala, ventromedial striatum and mediodorsal thalamus.'
  ),
  'posterior-orbital-gyrus': D(
    'Caudal orbitofrontal cortex above the olfactory trigone, integrating smell, taste and visceral value signals.',
    'It sits in anterior-communicating-artery aneurysm territory — basal forebrain injury here can add confabulation to amnesia.',
    'Secondary olfactory cortex partner of piriform cortex and insula.'
  ),
  'medial-orbital-gyrus': D(
    'Medial orbitofrontal/ventromedial prefrontal cortex: reward valuation, extinction of fear and self-referential affect.',
    'Functional hyperactivity patterns here feature in depression imaging; lesions blunt emotional decision-making (Iowa gambling task).',
    'vmPFC → amygdala/ventral striatum affective control loop.'
  ),
  'lateral-orbital-gyrus': D(
    'Lateral orbitofrontal cortex: punishment, reversal learning and suppressing previously rewarded responses.',
    'Overactivity is implicated in obsessive–compulsive circuitry — the orbitofronto-striatal loop.',
    'Lateral OFC → caudate loop of the CSTC (cortico-striato-thalamo-cortical) system.'
  ),
  'half-of-tentorium-cerebelli': D(
    'The tent-shaped dural roof of the posterior fossa separating occipital/temporal lobes from the cerebellum (BodyParts3D models one half).',
    'The uncus herniates over its free edge in raised ICP — compressing CN III (blown pupil) and the posterior cerebral artery.',
    'Defines supra- vs infra-tentorial compartments — the first sorting question in posterior-fossa surgery.'
  ),
  'white-matter-of-temporal-lobe': D(
    'BodyParts3D models this as a hemisphere-scale white-matter mass rather than discrete temporal tracts, so Neuraxia keeps it in the optional context layer.',
    'Treat it as a volume reference, not as Meyer loop or uncinate geometry — named tracts arrive with the FIRE registration work.',
 'Context only; no pathway claims are made from this mesh.'
  ),
};

export function familyOf(conceptId) {
  if (!conceptId) return '';
  return conceptId.replace(/^(left|right)-/, '');
}

export function getDossier(entry) {
  const id = entry?.neuraxia?.concept_id;
  if (id && DOSSIERS[id]) return DOSSIERS[id];
  const fam = familyOf(id);
  if (fam && DOSSIERS[fam]) return DOSSIERS[fam];
  // Spike dataset has no concept ids: fall back to name matching.
  const n = (entry?.name || '').toLowerCase().replace(/^(left|right)\s+/, '').replace(/\s+/g, '-');
  return DOSSIERS[n] || null;
}
