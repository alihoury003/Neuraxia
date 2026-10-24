#!/usr/bin/env python3
"""Compare Sprint 1B BodyParts3D coverage with the Sprint 1 spike inventory.

Counts are generated from the curated BodyParts3D concept JSON and the spike
GLB's declared mesh/index accessors. Domain scores are an explicit editorial
rubric for a brain+spinal-cord teaching atlas; they are not a claim that one
mesh count equals anatomical quality.
"""

from __future__ import annotations

import argparse
import json
import struct
from collections import Counter
from pathlib import Path
from typing import Any

SPIKE_DEFAULT_CATEGORIES = {
    "axis",
    "cortex",
    "cranial",
    "deep",
    "meninges",
    "ventricles",
    "white",
}

CRANIAL_NERVES = [
    ("I", "olfactory"),
    ("II", "optic nerve"),
    ("III", "oculomotor"),
    ("IV", "trochlear"),
    ("V", "trigeminal"),
    ("VI", "abducens"),
    ("VII", "facial nerve"),
    ("VIII", "vestibulocochlear"),
    ("IX", "glossopharyngeal"),
    ("X", "vagus"),
    ("XI", "accessory nerve"),
    ("XII", "hypoglossal"),
]

CANONICAL_CHECKS = {
    "Claustrum": "claustrum",
    "Nucleus accumbens": "accumbens",
    "Deep cerebellar nuclei": "deep cerebellar",
    "Inferior olive": "inferior olive",
    "Septum pellucidum": "septum pellucidum",
    "Pineal body": "pineal",
    "Pituitary gland": "pituitary",
    "Central canal of spinal cord": "central canal",
    "Olfactory tract": "olfactory tract",
    "Optic radiation": "optic radiation",
    "Corona radiata": "corona radiata",
    "Cingulum": "cingulum",
    "Superior longitudinal fasciculus": "superior longitudinal",
    "Inferior longitudinal fasciculus": "inferior longitudinal",
    "Arcuate fasciculus": "arcuate fascic",
    "Uncinate fasciculus": "uncinate",
    "Cerebellar peduncles": "cerebellar peduncle",
    "Cranial nerve nuclei": "nucleus of cranial",
}

DOMAIN_SCORES = [
    {
        "domain": "Cerebral cortex and cortical granularity",
        "weight": 15,
        "bp3d_score_0_5": 4.3,
        "spike_score_0_5": 2.0,
        "bp3d_rationale": "25 named cortical units per hemisphere (24 gyri/lobules plus insula); lobe views must be derived by metadata aggregation. Missing separate paracentral lobule, transverse temporal gyri and inferior-frontal subdivisions.",
        "spike_rationale": "Six cortical units per hemisphere (five lobes plus insula), useful for orientation but too coarse for gyral teaching/localisation.",
    },
    {
        "domain": "Deep gray matter, diencephalon and Hypothalamus",
        "weight": 15,
        "bp3d_score_0_5": 4.0,
        "spike_score_0_5": 3.0,
        "bp3d_rationale": "Basal ganglia cores plus 12 paired Hypothalamic/preoptic/periventricular nuclei, geniculate bodies, colliculi, habenula and pineal body. Missing claustrum, nucleus accumbens, thalamic nuclear subdivisions and basal-forebrain nuclei.",
        "spike_rationale": "Strong basal-ganglia set and uniquely includes claustrum and nucleus accumbens, but almost no Hypothalamic nuclear detail.",
    },
    {
        "domain": "Brainstem and cerebellum",
        "weight": 15,
        "bp3d_score_0_5": 2.7,
        "spike_score_0_5": 2.5,
        "bp3d_rationale": "Pons, medulla, cerebral crura, colliculi, red nuclei and substantia nigra are separate; cerebellum remains one gross mesh. Missing nearly all cranial-nerve/reticular/tegmental nuclei, inferior olive, cerebellar lobes/vermis/hemispheres, deep cerebellar nuclei and peduncles.",
        "spike_rationale": "One gross brainstem and cerebellum, but uniquely includes inferior olives and deep cerebellar nuclei.",
    },
    {
        "domain": "Ventricles and CSF spaces",
        "weight": 10,
        "bp3d_score_0_5": 4.8,
        "spike_score_0_5": 4.4,
        "bp3d_rationale": "Lateral/third/fourth ventricles, aqueduct, interventricular foramen, bilateral choroid plexus and central canal are selectable.",
        "spike_rationale": "Same ventricular core except no separate central canal.",
    },
    {
        "domain": "White matter, commissures and named internal pathways",
        "weight": 15,
        "bp3d_score_0_5": 2.5,
        "spike_score_0_5": 2.0,
        "bp3d_rationale": "Corpus callosum, anterior/posterior commissures, fornices, internal capsules, striae, mammillothalamic tracts and collicular brachia. No named long association bundles, corona radiata subdivisions, optic/auditory radiations, lemnisci or spinal tracts; temporal white-matter labels are geometrically suspect and hidden.",
        "spike_rationale": "Core commissures/fornices/internal capsules and septum pellucidum, but fewer small named bundles and the same absence of tract-level pathway geometry.",
    },
    {
        "domain": "Cranial nerves I–XII",
        "weight": 15,
        "bp3d_score_0_5": 4.4,
        "spike_score_0_5": 3.3,
        "bp3d_rationale": "All 12 nerves are present bilaterally at proximal/main-trunk level, plus optic/olfactory tracts and trigeminal divisions. Distal vagal geometry needs adjudication and remains hidden.",
        "spike_rationale": "Most main nerves plus distal trigeminal branches; no explicit vestibulocochlear/cochlear/vestibular nerve and no olfactory tract in the inventory.",
    },
    {
        "domain": "Spinal cord and cauda equina",
        "weight": 10,
        "bp3d_score_0_5": 1.4,
        "spike_score_0_5": 1.3,
        "bp3d_rationale": "Whole cord, cauda equina and central canal only. No cord levels/segments, gray-matter horns/columns, white-matter funiculi/tracts, rootlets or spinal meninges as selectable CNS anatomy.",
        "spike_rationale": "Whole cord and cauda equina only within the app-default CNS set; roots/ganglia exist elsewhere in the full spike but are peripheral/spinal-nerve context rather than internal cord anatomy.",
    },
    {
        "domain": "Meninges and immediate context",
        "weight": 5,
        "bp3d_score_0_5": 2.4,
        "spike_score_0_5": 3.0,
        "bp3d_rationale": "Falx cerebri, a whole-brain dural shell (hidden by default), pituitary and pineal context; only the right half of tentorium cerebelli exists in the selected source set.",
        "spike_rationale": "Falx and a tentorium concept are present, but no pineal/pituitary context in the spike inventory.",
    },
]


def classify_spike(raw_name: str) -> str:
    n = raw_name.lower()
    if "spinal ganglia" in n or "anterior root of spinal" in n or "posterior root of spinal" in n:
        return "roots"
    if "falx" in n or "tentorium" in n:
        return "meninges"
    if any(k in n for k in ("ventricle", "aqueduct", "interventricular", "choroid")):
        return "ventricles"
    if any(k in n for k in ("corpus callosum", "internal capsule", "fornix", "commissure", "septum pellucidum")):
        return "white"
    if any(
        k in n
        for k in (
            "thalamus",
            "mammillary",
            "caudate",
            "putamen",
            "globus",
            "hippocampus",
            "amygdala",
            "Hypothalamus",
            "substantia nigra",
            "red nucleus",
            "subthalamic",
            "deep cerebellar",
            "inferior olive",
            "accumbens",
            "claustrum",
        )
    ):
        return "deep"
    if any(k in n for k in ("brainstem", "cerebellum", "spinal cord", "cauda equina")):
        return "axis"
    if "lobe" in n or "insula" in n:
        return "cortex"
    if any(
        k in n
        for k in (
            "optic",
            "olfactory",
            "oculomotor",
            "trochlear",
            "trigeminal",
            "abducens",
            "facial nerve",
            "vestibulocochlear",
            "cochlear nerve",
            "vestibular nerve",
            "glossopharyngeal",
            "vagus",
            "accessory nerve",
            "hypoglossal",
            "maxillary",
            "ophthalmic nerve",
            "mandibular",
            "lingual nerve",
            "buccal nerve",
            "inferior alveolar",
            "mental nerve",
            "mylohyoid",
            "chorda tympani",
        )
    ):
        return "cranial"
    return "peripheral"


def read_glb_json(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    length = struct.unpack_from("<I", data, 12)[0]
    return json.loads(data[20 : 20 + length].decode("utf-8"))


def spike_inventory(path: Path) -> list[dict[str, Any]]:
    gltf = read_glb_json(path)
    rows = []
    for node in gltf.get("nodes", []):
        if "mesh" not in node:
            continue
        mesh = gltf["meshes"][int(node["mesh"])]
        name = str(node.get("name") or mesh.get("name") or "")
        triangles = 0
        vertices = 0
        for primitive in mesh.get("primitives", []):
            pos = gltf["accessors"][int(primitive["attributes"]["POSITION"])]
            idx = gltf["accessors"][int(primitive["indices"])]
            vertices += int(pos["count"])
            triangles += int(idx["count"]) // 3
        category = classify_spike(name)
        rows.append(
            {
                "name": name,
                "category": category,
                "app_default": category in SPIKE_DEFAULT_CATEGORIES,
                "vertices": vertices,
                "triangles": triangles,
            }
        )
    return rows


def contains(names: list[str], needle: str) -> bool:
    return any(needle in name.lower() for name in names)


def cranial_presence(names: list[str]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for numeral, needle in CRANIAL_NERVES:
        hits = sorted(name for name in names if needle in name.lower())
        # VIII can be represented by separate cochlear/vestibular names.
        if numeral == "VIII":
            hits = sorted(
                name
                for name in names
                if "vestibulocochlear" in name.lower()
                or "cochlear nerve" in name.lower()
                or "vestibular nerve" in name.lower()
            )
        # Optic tract/chiasm should not make the optic nerve row ambiguous.
        result[numeral] = {"needle": needle, "present": bool(hits), "matches": hits}
    return result


def weighted_score(key: str) -> float:
    return round(
        sum(float(row["weight"]) * float(row[key]) / 5.0 for row in DOMAIN_SCORES),
        2,
    )


def render_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# Neuraxia Sprint 1B — anatomical completeness scorecard")
    lines.append("")
    lines.append(
        "Scope: selectable brain + spinal-cord anatomy for Layer 0. Counts are generated from the curated "
        "BodyParts3D concept JSON and the Sprint 1 spike GLB inventory. Domain scores use the transparent "
        "0–5 rubric embedded in `pipeline/score_dataset_completeness.py`; they judge coverage and teaching "
        "granularity, not mesh beauty or source accuracy."
    )
    lines.append("")
    lines.append("## Headline inventories")
    lines.append("")
    lines.append("| Measure | BodyParts3D Sprint 1B | Z-derived Sprint 1 spike |")
    lines.append("|---|---:|---:|")
    bp = report["bp3d"]
    spike = report["spike"]
    lines.append(f"| Selectable concepts/meshes in comparison set | {bp['concepts']} | {spike['default_meshes']} app-default of {spike['all_meshes']} total |")
    lines.append(f"| Triangles in comparison set (source for BP; spike GLB) | {bp['source_triangles']:,} | {spike['default_triangles']:,} app-default |")
    lines.append(f"| Cortical units | {bp['cortex_concepts']} | {spike['categories'].get('cortex', 0)} |")
    lines.append(f"| Deep concepts | {bp['categories'].get('deep', 0)} | {spike['categories'].get('deep', 0)} |")
    lines.append(f"| Cranial concepts in comparison set | {bp['categories'].get('cranial', 0)} | {spike['categories'].get('cranial', 0)} |")
    lines.append(f"| Named cranial nerves represented | {bp['cranial_nerves_present']}/12 | {spike['cranial_nerves_present']}/12 |")
    lines.append(f"| Weighted teaching-atlas score | **{report['weighted_scores']['bp3d']:.1f}/100** | **{report['weighted_scores']['spike']:.1f}/100** |")
    lines.append("")

    lines.append("## Domain scores")
    lines.append("")
    lines.append("| Domain | Weight | BP3D /5 | Spike /5 | Interpretation |")
    lines.append("|---|---:|---:|---:|---|")
    for row in DOMAIN_SCORES:
        winner = "BP3D" if row["bp3d_score_0_5"] > row["spike_score_0_5"] else ("Spike" if row["spike_score_0_5"] > row["bp3d_score_0_5"] else "Tie")
        lines.append(
            f"| {row['domain']} | {row['weight']} | {row['bp3d_score_0_5']:.1f} | {row['spike_score_0_5']:.1f} | {winner} ahead |"
        )
    lines.append("")
    for row in DOMAIN_SCORES:
        lines.append(f"### {row['domain']}")
        lines.append("")
        lines.append(f"- **BodyParts3D:** {row['bp3d_rationale']}")
        lines.append(f"- **Spike:** {row['spike_rationale']}")
        lines.append("")

    lines.append("## Canonical presence checks")
    lines.append("")
    lines.append("| Structure / system | BP3D | Spike |")
    lines.append("|---|---|---|")
    for label, check in report["canonical_checks"].items():
        lines.append(
            f"| {label} | {'yes' if check['bp3d'] else 'no'} | {'yes' if check['spike_default'] else 'no'} |"
        )
    lines.append("")

    lines.append("## What BodyParts3D adds over the spike")
    lines.append("")
    lines.extend(
        [
            "- Gyral-level cortex: 25 named units per hemisphere rather than lobe-level surfaces.",
            "- Hypothalamic nuclear detail: 12 paired Hypothalamic/preoptic/periventricular nuclei.",
            "- Separate pons, medulla and cerebral crura instead of one undifferentiated brainstem mesh.",
            "- Lateral/medial geniculate bodies, superior/inferior colliculi, habenula, pineal body and pituitary context.",
            "- Central canal of the spinal cord.",
            "- Bilateral vestibulocochlear nerves and olfactory tracts; all cranial nerves I–XII are represented.",
            "- Full object-level FJ/BP/header-concept provenance and file hashes for every selectable concept.",
            "",
        ]
    )

    lines.append("## What the spike has that BodyParts3D lacks")
    lines.append("")
    lines.extend(
        [
            "- Claustrum and nucleus accumbens.",
            "- Deep cerebellar nuclei and inferior olives.",
            "- Septum pellucidum as a distinct named sheet (BodyParts3D has a broader `Septum of telencephalon`).",
            "- A tentorium concept beyond BodyParts3D's right-half-only geometry (object-level provenance in the spike remains unresolved).",
            "- More distal trigeminal branch geometry, which is outside Sprint 1B's proximal-cranial focus.",
            "",
        ]
    )

    lines.append("## Shared production gaps")
    lines.append("")
    lines.extend(
        [
            "- No selectable spinal-cord segmental levels, gray-matter horns/columns, funiculi or ascending/descending tracts.",
            "- No named optic/auditory radiations, cingulum, longitudinal/uncinate/arcuate fasciculi, corona-radiata subdivisions, lemnisci or cerebellar peduncles.",
            "- No systematic cranial-nerve, reticular-formation, raphe, tegmental or dorsal-column nuclei.",
            "- No cerebellar hemispheres/vermis/lobules as a teaching parcellation.",
            "- No production-ready neuron-order, synapse, decussation or direction fields for FIRE IT; those must be authored as a separate pathway graph and geometry set.",
            "",
        ]
    )

    lines.append("## Decision")
    lines.append("")
    lines.append(
        f"BodyParts3D is the correct production foundation: **{report['weighted_scores']['bp3d']:.1f}/100 versus "
        f"{report['weighted_scores']['spike']:.1f}/100** on this explicit Layer-0 rubric, with much stronger cortical, "
        "Hypothalamic, brainstem-subdivision and provenance granularity. It is not yet a complete neuroanatomy atlas. "
        "The production roadmap should add missing internal nuclei and cord/tract anatomy from separately licensed or "
        "original faculty-reviewed geometry rather than silently importing the unresolved spike meshes."
    )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--concepts",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation/bp3d-cns-concepts.json"),
    )
    ap.add_argument(
        "--spike",
        type=Path,
        default=Path("/home/user/neuraxia/research/body-atlas/nervous.glb"),
    )
    ap.add_argument(
        "--report-dir",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/reports"),
    )
    args = ap.parse_args()

    dataset = json.loads(args.concepts.read_text(encoding="utf-8"))
    concepts = dataset["concepts"]
    bp_names = [str(c["display_name"]) for c in concepts]
    spike_rows = spike_inventory(args.spike)
    spike_default_rows = [r for r in spike_rows if r["app_default"]]
    spike_default_names = [str(r["name"]) for r in spike_default_rows]

    bp_categories = Counter(str(c["category"]) for c in concepts)
    spike_categories = Counter(str(r["category"]) for r in spike_default_rows)

    bp_cranial = cranial_presence(bp_names)
    spike_cranial = cranial_presence(spike_default_names)

    report: dict[str, Any] = {
        "method": {
            "bp3d_inventory": str(args.concepts),
            "spike_inventory": str(args.spike),
            "spike_comparison_set": "Sprint 1 app-default categories: axis, cortex, cranial, deep, meninges, ventricles, white",
            "score_scale": "0–5 per weighted teaching domain, normalised to 100",
        },
        "bp3d": {
            "concepts": len(concepts),
            "components": sum(int(c["component_count"]) for c in concepts),
            "source_triangles": sum(int(c["total_source_triangles"]) for c in concepts),
            "source_vertices": sum(int(c["total_source_vertices"]) for c in concepts),
            "categories": dict(sorted(bp_categories.items())),
            "cortex_concepts": int(bp_categories.get("cortex", 0)),
            "cranial_nerve_presence": bp_cranial,
            "cranial_nerves_present": sum(bool(v["present"]) for v in bp_cranial.values()),
            "names": bp_names,
        },
        "spike": {
            "all_meshes": len(spike_rows),
            "default_meshes": len(spike_default_rows),
            "all_triangles": sum(int(r["triangles"]) for r in spike_rows),
            "default_triangles": sum(int(r["triangles"]) for r in spike_default_rows),
            "all_vertices": sum(int(r["vertices"]) for r in spike_rows),
            "default_vertices": sum(int(r["vertices"]) for r in spike_default_rows),
            "categories": dict(sorted(spike_categories.items())),
            "cranial_nerve_presence": spike_cranial,
            "cranial_nerves_present": sum(bool(v["present"]) for v in spike_cranial.values()),
            "default_names": spike_default_names,
            "all_inventory": spike_rows,
        },
        "canonical_checks": {
            label: {
                "needle": needle,
                "bp3d": contains(bp_names, needle),
                "spike_default": contains(spike_default_names, needle),
            }
            for label, needle in CANONICAL_CHECKS.items()
        },
        "domain_scores": DOMAIN_SCORES,
        "weighted_scores": {
            "bp3d": weighted_score("bp3d_score_0_5"),
            "spike": weighted_score("spike_score_0_5"),
        },
    }

    args.report_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.report_dir / "dataset-completeness-scorecard.json"
    md_path = args.report_dir / "dataset-completeness-scorecard.md"
    json_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    md_path.write_text(render_markdown(report), encoding="utf-8")
    print(json.dumps(report["weighted_scores"], indent=2))
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
