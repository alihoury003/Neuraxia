#!/usr/bin/env python3
"""
Select a reviewable BodyParts3D 4.3 CNS candidate pool for Neuraxia Sprint 1B.

The selector deliberately does not pretend that a name regex is an ontology.
Primary inclusion comes from official/version-stamped FMA2Obj concept->FJ
component mappings, cross-checked against the official IS-A and PART-OF
concept tables. A small number of exact, manually reviewed proximal cranial
nerve patterns are added because the generic FMA11195 "segment of neural tree
organ" root contains the whole peripheral nervous system.

Outputs a candidate pool, not the final shipment list. Duplicate/alternate
components remain visible until `audit_obj_geometry.py` and
`resolve_curation.py` have fingerprinted and adjudicated them.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOTS: dict[str, dict[str, str]] = {
    "FMA50801": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 part_of component expansion for Brain",
    },
    "FMA83143": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 is_a component expansion for cell part cluster of neuraxis",
    },
    "FMA223151": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 is_a component expansion for internal gray matter component",
    },
    "FMA242675": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 part_of component expansion for ventricular system of neuraxis",
    },
    "FMA242770": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 is_a component expansion for wall of ventricular system (choroid plexus)",
    },
    "FMA7647": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 part_of component expansion for spinal cord",
    },
    "FMA62007": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 concept expansion for thalamus",
    },
    "FMA62008": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 concept expansion for Hypothalamus",
    },
    "FMA62033": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 concept expansion for pineal body",
    },
    "FMA13889": {
        "tier": "context",
        "basis": "FMA2Obj 4.3 concept expansion for pituitary gland (neuroanatomical landmark)",
    },
    "FMA75351": {
        "tier": "core",
        "basis": "FMA2Obj 4.3 concept expansion for interventricular foramen",
    },
    "FMA266054": {
        "tier": "meninges",
        "basis": "FMA2Obj 4.3 is_a component expansion for subdivision of cranial dura mater",
    },
}

# Exact, manually adjudicated scope exclusions that a name search can make
# look like selector omissions. They are deliberately kept out of the
# candidate pool and written to bp3d-manual-scope-exclusions.csv.
MANUAL_EXCLUSIONS: dict[str, str] = {
    "FJ1763": "Interpeduncular fossa (FMA83740) is classified under subarachnoid incisure: a midbrain surface depression/CSF fossa, not a solid CNS tissue concept. Sprint 1B Layer 0 includes ventricular CSF volumes but not subarachnoid surface fossae/cisterns; revisit only if a dedicated CSF-surface layer is approved.",
    "FJ1811": "Alternate/component FJ for the same interpeduncular-fossa surface exclusion as FJ1763; not a solid CNS tissue concept in Sprint 1B Layer 0.",
}

MANUAL_FJ: dict[str, dict[str, str]] = {
    "FJ4425": {
        "tier": "core",
        "basis": "Manual Sprint 1B inclusion: cauda equina is required neuraxis context and is not in the spinal-cord root expansion",
    },
    "FJ3914": {
        "tier": "core",
        "basis": "Manual Sprint 1B inclusion: left olfactory tract (CNS white-matter tract)",
    },
    "FJ4012": {
        "tier": "core",
        "basis": "Manual Sprint 1B inclusion: right olfactory tract (CNS white-matter tract)",
    },
}

# Exact proximal cranial-nerve pools. These are candidates for geometric
# adjudication, not automatic shipment. Distal branches of FMA11195 are not
# swept in.
CRANIAL_PATTERNS: list[tuple[str, str]] = [
    (r"^(left|right) olfactory (nerve|tract)$", "cranial_proximal"),
    (r"^(left|right) optic (nerve|tract)$", "cranial_proximal"),
    (r"^optic chiasm$", "cranial_proximal"),
    (r"^trunk of (left|right) oculomotor nerve$", "cranial_proximal"),
    (r"^(left|right) trochlear nerve$", "cranial_proximal"),
    (r"^trunk of (left|right) trigeminal nerve$", "cranial_proximal"),
    (r"^(left|right) abducens nerve$", "cranial_proximal"),
    (r"^trunk of (left|right) facial nerve$", "cranial_proximal"),
    (r"^(left|right) vestibulocochlear nerve$", "cranial_proximal"),
    (r"^(left|right) glossopharyngeal nerve$", "cranial_proximal"),
    (r"^trunk of (left|right) vagus nerve$", "cranial_proximal_pool"),
    (r"^trunk of (left|right) accessory nerve$", "cranial_proximal_pool"),
    (r"^trunk of (left|right) hypoglossal nerve$", "cranial_proximal_pool"),
    (r"^(left|right) ophthalmic nerve$", "cranial_division_pool"),
    (r"^(left|right) mandibular nerve$", "cranial_division_pool"),
    (r"^trunk of (left|right) maxillary nerve$", "cranial_division_pool"),
]

PAIRED_UNSIDED = {
    "cerebellum",
    "choroid plexus of cerebral hemisphere",
    "Hypothalamus",
    "lamina terminalis",
    "mammillary body",
    "medulla oblongata",
    "periventricular nucleus",
    "pons",
    "tuber cinereum",
    "optic chiasm",
}


def read_tsv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def load_concept_names(metadata_dir: Path) -> dict[str, str]:
    names: dict[str, str] = {}
    for filename in ("isa_parts_list_e.txt", "partof_parts_list_e.txt"):
        for row in read_tsv(metadata_dir / filename):
            names.setdefault(row["concept id"], row["en"])
    for filename in (
        "isa_inclusion_relation_list.txt",
        "partof_inclusion_relation_list.txt",
    ):
        for row in read_tsv(metadata_dir / filename):
            names.setdefault(row["parent id"], row["parent name"])
            names.setdefault(row["child id"], row["child name"])
    for filename in ("isa_element_parts.txt", "partof_element_parts.txt"):
        for row in read_tsv(metadata_dir / filename):
            names.setdefault(row["concept id"], row["name"])
    return names


def load_fma2obj(path: Path) -> tuple[dict[str, set[str]], dict[str, set[tuple[str, str, int]]]]:
    """Return concept->FJ and FJ->(concept, relation, component count)."""
    concept_to_fj: dict[str, set[str]] = defaultdict(set)
    fj_to_concepts: dict[str, set[tuple[str, str, int]]] = defaultdict(set)
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not raw or raw.startswith("#"):
            continue
        cols = raw.split("\t")
        if len(cols) < 3:
            continue
        concept, relation = cols[0].strip(), cols[1].strip()
        fjs = [x.strip() for x in cols[2].split("+") if x.strip().startswith("FJ")]
        concept_to_fj[concept].update(fjs)
        for fj in fjs:
            fj_to_concepts[fj].add((concept, relation, len(fjs)))
    return dict(concept_to_fj), dict(fj_to_concepts)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def side_from_name(name: str) -> str:
    n = name.lower()
    if re.search(r"\bleft\b", n):
        return "left"
    if re.search(r"\bright\b", n):
        return "right"
    if n in PAIRED_UNSIDED:
        return "paired_unsided"
    return "midline_or_unspecified"


def classify(name: str, tiers: set[str]) -> str:
    n = name.lower()
    if "meninges" in tiers or any(k in n for k in ("dura mater", "falx cerebri", "tentorium cerebelli")):
        return "meninges"
    if any(k in n for k in ("ventricle", "cerebral aqueduct", "central canal", "choroid plexus", "interventricular foramen")):
        return "ventricles"
    if tiers & {"cranial_proximal", "cranial_proximal_pool", "cranial_division_pool"}:
        return "cranial"
    if n == "pituitary gland":
        return "context"
    if any(k in n for k in ("pons", "medulla oblongata", "cerebellum", "cerebral crus", "spinal cord", "cauda equina")):
        return "axis"
    if any(
        k in n
        for k in (
            "corpus callosum",
            "internal capsule",
            "fornix",
            "commissure",
            "stria ",
            "brachium",
            "mammillothalamic tract",
            "white matter",
            "olfactory tract",
        )
    ):
        return "white"
    if any(k in n for k in ("gyrus", "insula", "cuneus", "precuneus", "parietal lobule")):
        return "cortex"
    return "deep"


def subregion(name: str, category: str) -> str:
    n = name.lower()
    if category == "ventricles":
        return "ventricular system"
    if category == "meninges":
        return "meninges"
    if category == "cranial":
        return "cranial nerve"
    if any(k in n for k in ("spinal cord", "cauda equina")):
        return "spinal cord"
    if "cerebellum" in n:
        return "cerebellum"
    if n == "pons":
        return "pons"
    if "medulla oblongata" in n:
        return "medulla"
    if any(
        k in n
        for k in (
            "cerebral crus",
            "colliculus",
            "red nucleus",
            "substantia nigra",
        )
    ):
        return "midbrain"
    if any(
        k in n
        for k in (
            "thalamus",
            "Hypothalamus",
            "hypothalamic",
            "geniculate",
            "habenula",
            "pineal",
            "mammillary",
            "mammillothalamic",
            "tuber cinereum",
            "preoptic",
            "suprachiasmatic",
            "supraoptic",
            "paraventricular",
            "periventricular",
            "arcuate nucleus",
            "pituitary",
        )
    ):
        return "diencephalon"
    return "telencephalon"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--manifest",
        type=Path,
        default=Path("/home/user/neuraxia/research/bp3d-tools/MANIFEST.csv"),
    )
    ap.add_argument(
        "--metadata-dir",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/metadata"),
    )
    ap.add_argument(
        "--out-dir",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation"),
    )
    args = ap.parse_args()

    manifest = {
        row["fj_id"]: row
        for row in csv.DictReader(args.manifest.open(newline="", encoding="utf-8"))
    }
    concept_names = load_concept_names(args.metadata_dir)
    concept_to_fj, fj_to_concepts = load_fma2obj(args.metadata_dir / "FMA2Obj.txt")

    candidates: dict[str, dict[str, object]] = {}

    def ensure(fj: str) -> dict[str, object] | None:
        row = manifest.get(fj)
        if row is None:
            return None
        if fj not in candidates:
            candidates[fj] = {
                "fj_id": fj,
                "source_name": row["name"],
                "catalogue_bp_id_first_mapping": row["bp_id"],
                "catalogue_fma_id_first_mapping": row["fma_id"],
                "catalogue_faces": int(row["faces"]),
                "catalogue_vertices": int(row["verts"]),
                "catalogue_obj_bytes": int(row["bytes"]),
                "tiers": set(),
                "selection_bases": set(),
                "root_concepts": set(),
            }
        return candidates[fj]

    for root, spec in ROOTS.items():
        for fj in sorted(concept_to_fj.get(root, set())):
            item = ensure(fj)
            if item is None:
                continue
            item["tiers"].add(spec["tier"])
            item["root_concepts"].add(root)
            item["selection_bases"].add(
                f"{root} ({concept_names.get(root, 'name unavailable in 4.0 tables')}): {spec['basis']}"
            )

    for fj, spec in MANUAL_FJ.items():
        item = ensure(fj)
        if item is None:
            continue
        item["tiers"].add(spec["tier"])
        item["selection_bases"].add(spec["basis"])

    compiled_patterns = [
        (re.compile(pattern, re.IGNORECASE), tier, pattern)
        for pattern, tier in CRANIAL_PATTERNS
    ]
    for fj, row in manifest.items():
        for regex, tier, pattern in compiled_patterns:
            if regex.match(row["name"]):
                item = ensure(fj)
                if item is None:
                    continue
                item["tiers"].add(tier)
                item["selection_bases"].add(
                    f"Exact manually reviewed proximal-cranial candidate pattern: {pattern}"
                )

    rows: list[dict[str, object]] = []
    duplicate_groups: dict[str, list[str]] = defaultdict(list)
    for item in candidates.values():
        duplicate_groups[slugify(str(item["source_name"]))].append(str(item["fj_id"]))

    for fj, item in sorted(candidates.items(), key=lambda kv: (str(kv[1]["source_name"]).lower(), kv[0])):
        name = str(item["source_name"])
        tiers = set(item["tiers"])
        category = classify(name, tiers)
        # Pituitary is a landmark/context tier even though it sits in the
        # diencephalic neighbourhood.
        tier = "context" if category == "context" else ""
        if not tier:
            # Most general/highest-priority tier for single-value consumers.
            for candidate in (
                "core",
                "meninges",
                "cranial_proximal",
                "cranial_proximal_pool",
                "cranial_division_pool",
                "context",
            ):
                if candidate in tiers:
                    tier = candidate
                    break
        all_concepts = sorted(fj_to_concepts.get(fj, set()))
        specific = [
            (concept, relation, count)
            for concept, relation, count in all_concepts
            if count <= 4
        ]
        concept_key = slugify(name)
        rows.append(
            {
                "fj_id": fj,
                "source_name": name,
                "display_name_provisional": name,
                "concept_key_provisional": concept_key,
                "duplicate_group_size": len(duplicate_groups[concept_key]),
                "duplicate_group_fj_ids": ";".join(sorted(duplicate_groups[concept_key])),
                "category": category,
                "subregion": subregion(name, category),
                "side_from_source_name": side_from_name(name),
                "tier": tier,
                "all_tiers": ";".join(sorted(tiers)),
                "catalogue_bp_id_first_mapping": item["catalogue_bp_id_first_mapping"],
                "catalogue_fma_id_first_mapping": item["catalogue_fma_id_first_mapping"],
                "catalogue_faces": item["catalogue_faces"],
                "catalogue_vertices": item["catalogue_vertices"],
                "catalogue_obj_bytes": item["catalogue_obj_bytes"],
                "root_concepts": ";".join(sorted(item["root_concepts"])),
                "selection_bases": " | ".join(sorted(item["selection_bases"])),
                "fma2obj_all_concepts": ";".join(
                    f"{c}:{r}:n={n}" for c, r, n in all_concepts
                ),
                "fma2obj_specific_concepts": ";".join(
                    f"{c} ({concept_names.get(c, 'name unavailable in 4.0 tables')}):{r}:n={n}"
                    for c, r, n in specific
                ),
                "status": "candidate_pool_pending_geometry",
            }
        )

    # Exact exclusions from the broad neural-tree root that were not selected.
    neural_tree = concept_to_fj.get("FMA11195", set())
    exclusion_rows: list[dict[str, object]] = []
    for fj in sorted(neural_tree - set(candidates)):
        row = manifest.get(fj)
        if row is None:
            continue
        exclusion_rows.append(
            {
                "fj_id": fj,
                "source_name": row["name"],
                "catalogue_bp_id_first_mapping": row["bp_id"],
                "catalogue_fma_id_first_mapping": row["fma_id"],
                "catalogue_faces": int(row["faces"]),
                "reason": "Not selected from FMA11195 blanket root: distal/peripheral or branch-level neural-tree component outside the Sprint 1B CNS-core/proximal-cranial scope",
            }
        )

    manual_exclusion_rows: list[dict[str, object]] = []
    for fj, reason in sorted(MANUAL_EXCLUSIONS.items()):
        if fj in candidates:
            raise ValueError(f"Manual scope exclusion {fj} was also selected as a candidate")
        row = manifest.get(fj)
        if row is None:
            continue
        manual_exclusion_rows.append(
            {
                "fj_id": fj,
                "source_name": row["name"],
                "catalogue_bp_id_first_mapping": row["bp_id"],
                "catalogue_fma_id_first_mapping": row["fma_id"],
                "hierarchy_concept_ids": ";".join(
                    sorted({concept for concept, _, _ in fj_to_concepts.get(fj, set())})
                ),
                "catalogue_faces": int(row["faces"]),
                "reason": reason,
                "status": "excluded_manual_scope",
            }
        )

    args.out_dir.mkdir(parents=True, exist_ok=True)

    candidate_csv = args.out_dir / "bp3d-cns-candidates.csv"
    with candidate_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    exclusion_csv = args.out_dir / "bp3d-neural-tree-not-selected.csv"
    with exclusion_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(exclusion_rows[0].keys()))
        writer.writeheader()
        writer.writerows(exclusion_rows)

    manual_exclusion_csv = args.out_dir / "bp3d-manual-scope-exclusions.csv"
    with manual_exclusion_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(manual_exclusion_rows[0].keys()))
        writer.writeheader()
        writer.writerows(manual_exclusion_rows)

    download_list = args.out_dir / "bp3d-cns-download-list.txt"
    download_list.write_text("\n".join(row["fj_id"] for row in rows) + "\n", encoding="utf-8")

    summary = {
        "candidate_meshes": len(rows),
        "candidate_faces_catalogue": sum(int(r["catalogue_faces"]) for r in rows),
        "candidate_obj_bytes_catalogue": sum(int(r["catalogue_obj_bytes"]) for r in rows),
        "unique_source_names": len(set(r["source_name"] for r in rows)),
        "by_category": {},
        "by_tier": {},
        "duplicate_name_groups": {
            key: fjs for key, fjs in sorted(duplicate_groups.items()) if len(fjs) > 1
        },
        "neural_tree_not_selected": len(exclusion_rows),
        "manual_scope_exclusions": MANUAL_EXCLUSIONS,
        "roots": ROOTS,
        "manual_fj": MANUAL_FJ,
    }
    for field, target in (("category", "by_category"), ("tier", "by_tier")):
        counter: dict[str, dict[str, int]] = {}
        for row in rows:
            key = str(row[field])
            bucket = counter.setdefault(key, {"meshes": 0, "faces": 0, "bytes": 0})
            bucket["meshes"] += 1
            bucket["faces"] += int(row["catalogue_faces"])
            bucket["bytes"] += int(row["catalogue_obj_bytes"])
        summary[target] = counter

    summary_path = args.out_dir / "bp3d-cns-candidate-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True), encoding="utf-8")

    print(f"Wrote {candidate_csv} ({len(rows)} candidates)")
    print(f"Wrote {exclusion_csv} ({len(exclusion_rows)} neural-tree exclusions)")
    print(f"Wrote {manual_exclusion_csv} ({len(manual_exclusion_rows)} manual scope exclusions)")
    print(f"Wrote {download_list}")
    print(f"Wrote {summary_path}")
    print(json.dumps({k: summary[k] for k in ("candidate_meshes", "candidate_faces_catalogue", "candidate_obj_bytes_catalogue", "unique_source_names", "by_category", "by_tier")}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
