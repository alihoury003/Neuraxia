#!/usr/bin/env python3
"""Resolve Sprint 1B BodyParts3D candidates into final teachable concepts.

This is the adjudication layer between the ontology candidate pool and the
OBJ->GLB converter. It is intentionally explicit: alternate model generations
are excluded by FJ ID with a reason; complementary components are grouped
under one Neuraxia concept; and the few source side-label conflicts detected
from OBJ bounds are recorded rather than silently overwritten.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

EXCLUSIONS: dict[str, str] = {
    # Alternate generations occupying the same bounds as the selected mesh.
    "FJ1746": "Alternate lower-resolution generation of left inferior temporal gyrus; FJ7473 selected from the coherent high-resolution FJ747x cortical family.",
    "FJ1747": "Alternate lower-resolution generation of right inferior temporal gyrus; FJ7473M selected from the coherent high-resolution FJ747x cortical family.",
    "FJ1835": "Broader alternate generation of left superior parietal lobule (32.81 cm3 versus 17.18 cm3 for FJ7463); excluded provisionally to avoid double-volume overlap, pending visual/faculty review.",
    "FJ1836": "Broader alternate generation of right superior parietal lobule (32.78 cm3 versus 17.14 cm3 for FJ7463M); excluded provisionally to avoid double-volume overlap, pending visual/faculty review.",
    "FJ7500": "Alternate lower-resolution generation of left lingual gyrus occupying the FJ7475 bounds.",
    "FJ7500M": "Alternate lower-resolution generation of right lingual gyrus occupying the FJ7475M bounds.",
    "FJ7484": "Alternate tessellation of left anterior nucleus of Hypothalamus with identical bounds/volume to FJ7483; FJ7483 selected because it is a single indexed component before welding.",
    "FJ7484M": "Alternate tessellation of right anterior nucleus of Hypothalamus with identical bounds/volume to FJ7483M; FJ7483M selected because it is a single indexed component before welding.",
    "FJ1803": "Unsided choroid-plexus component geometrically duplicate of FJ3855 (right lateral ventricle); FJ1755 + FJ3855 selected as explicit left/right concepts.",
    "FJ1843": "Source name says Tentorium cerebelli, but bounds/geometry are the same right-sided component as FJ3889; FJ3889 selected because its concept/name explicitly says right half.",
    "FJ7446": "Alternate generation of right half of tentorium cerebelli overlapping FJ3889, with 822 indexed components and 9 degenerate triangles; FJ3889 selected.",
    "FJ3848": "Exact alternate duplicate of pituitary gland FJ1796 (same centre, dimensions and volume).",
    "FJ7503": "Alternate right-half generation of optic chiasm; FJ7505/FJ7505M pair selected because each is a single indexed component.",
    "FJ7503M": "Alternate left-half generation of optic chiasm; FJ7505/FJ7505M pair selected because each is a single indexed component.",
    "FJ4034": "Named trunk of right oculomotor nerve but bounds do not match the left trunk or FJ4033; treated as a non-matching distal/segmental alternate and excluded from the proximal core.",
    "FJ1381": "Alternate right trochlear nerve generation whose bounds/volume do not match the left FJ3981; FJ4039 selected as the mirror-matching component.",
    "FJ1363": "Alternate/segmental right ophthalmic nerve component whose bounds do not match left FJ3921; FJ4019 selected as the mirror-matching component.",
}

# Components that together form one selectable Neuraxia concept.
GROUPS: dict[str, dict[str, object]] = {
    "cerebellum": {
        "display_name": "Cerebellum",
        "fjs": ["FJ1781", "FJ1830"],
        "side": "bilateral",
        "reason": "Complementary positive-X (left) and negative-X (right) halves; merge as one cerebellum concept.",
    },
    "Hypothalamus": {
        "display_name": "Hypothalamus",
        "fjs": ["FJ1760", "FJ1808"],
        "side": "bilateral",
        "reason": "Complementary left/right Hypothalamic halves; individual Hypothalamic nuclei remain separate concepts.",
    },
    "lamina-terminalis": {
        "display_name": "Lamina terminalis",
        "fjs": ["FJ1764", "FJ1812"],
        "side": "midline",
        "reason": "Adjacent thin midline components with identical Y/Z bounds; merge as one lamina terminalis.",
    },
    "medulla-oblongata": {
        "display_name": "Medulla oblongata",
        "fjs": ["FJ1769", "FJ1831"],
        "side": "bilateral",
        "reason": "Complementary left/right halves; merge as one medulla concept.",
    },
    "pons": {
        "display_name": "Pons",
        "fjs": ["FJ1775", "FJ1822"],
        "side": "bilateral",
        "reason": "Complementary left/right halves; merge as one pons concept.",
    },
    "tuber-cinereum": {
        "display_name": "Tuber cinereum",
        "fjs": ["FJ1780", "FJ1828"],
        "side": "bilateral",
        "reason": "Complementary left/right components; merge as one tuber cinereum concept.",
    },
    "optic-chiasm": {
        "display_name": "Optic chiasm",
        "fjs": ["FJ7505", "FJ7505M"],
        "side": "midline",
        "reason": "Selected left/right halves of the cleaner optic-chiasm generation; merge as one midline concept.",
    },
    "mammillary-bodies": {
        "display_name": "Mammillary bodies",
        "fjs": ["FJ7485", "FJ7485M"],
        "side": "bilateral",
        "reason": "Positive-X and negative-X mammillary components form the paired mammillary bodies; merge for Sprint 1B concept granularity.",
    },
    "left-olfactory-nerve": {
        "display_name": "Left olfactory nerve",
        "fjs": ["FJ3915", "FJ3916", "FJ3917", "FJ3918", "FJ3919", "FJ3920"],
        "side": "left",
        "reason": "Six separate olfactory fila/components at staggered Y positions; merge as the left olfactory nerve concept.",
    },
    "right-olfactory-nerve": {
        "display_name": "Right olfactory nerve",
        "fjs": ["FJ4013", "FJ4014", "FJ4015", "FJ4016", "FJ4017", "FJ4018"],
        "side": "right",
        "reason": "Six separate olfactory fila/components at staggered Y positions; merge as the right olfactory nerve concept.",
    },
    "left-cerebral-crus": {
        "display_name": "Left cerebral crus",
        "fjs": ["FJ1770", "FJ7504"],
        "side": "left",
        "reason": "Orthographic overlays show adjacent/partially overlapping segments along the crus rather than exact alternates; merge as one left cerebral crus concept pending faculty visual review.",
    },
    "right-cerebral-crus": {
        "display_name": "Right cerebral crus",
        "fjs": ["FJ1817", "FJ7504M"],
        "side": "right",
        "reason": "Orthographic overlays show adjacent/partially overlapping segments along the crus rather than exact alternates; merge as one right cerebral crus concept pending faculty visual review.",
    },
}

RENAMES: dict[str, tuple[str, str, str, str]] = {
    # fj -> display, concept id, side, note
    "FJ1755": ("Left choroid plexus", "left-choroid-plexus", "left", "Source name is unsided; bounds are entirely positive-X (subject left)."),
    "FJ3855": ("Right choroid plexus", "right-choroid-plexus", "right", "Source specifies choroid plexus of right lateral ventricle."),
    "FJ7499": ("Left periventricular nucleus", "left-periventricular-nucleus", "left", "Source name is unsided; bounds are positive-X (subject left)."),
    "FJ7499M": ("Right periventricular nucleus", "right-periventricular-nucleus", "right", "Source name is unsided; bounds are negative-X (subject right)."),
    "FJ3901": ("Right glossopharyngeal nerve", "right-glossopharyngeal-nerve", "right", "Source label says left, but all geometry is negative-X (subject right); recorded as a source side-label anomaly."),
    "FJ3939": ("Left glossopharyngeal nerve", "left-glossopharyngeal-nerve", "left", "Geometry is positive-X (subject left), consistent with the source label; paired with corrected FJ3901."),
    "FJ1735": ("Brachium of right superior colliculus", "brachium-of-right-superior-colliculus", "right", "Source label says left, but all geometry is negative-X (subject right); recorded as a source side-label anomaly."),
    "FJ1736": ("Brachium of left superior colliculus", "brachium-of-left-superior-colliculus", "left", "Source label says right, but all geometry is positive-X (subject left); recorded as a source side-label anomaly."),
    "FJ4426": ("Spinal cord", "spinal-cord", "midline", "Teachable display name for source concept 'Neural tissue of spinal cord'."),
    "FJ1759": ("Left hippocampus", "left-hippocampus", "left", "Short display name for source 'Left hippocampus proper'."),
    "FJ1807": ("Right hippocampus", "right-hippocampus", "right", "Short display name for source 'Right hippocampus proper'."),
    "FJ7498": ("Left fornix", "left-fornix", "left", "Short display name for source 'Left fornix of forebrain'."),
    "FJ7498M": ("Right fornix", "right-fornix", "right", "Short display name for source 'Right fornix of forebrain'."),
    "FJ7486": ("Left mammillothalamic tract", "left-mammillothalamic-tract", "left", "Short display name for source 'Left mammillothalamic tract of Hypothalamus'."),
    "FJ7486M": ("Right mammillothalamic tract", "right-mammillothalamic-tract", "right", "Short display name for source 'Right mammillothalamic tract of Hypothalamus'."),
    "FJ3890": ("Cerebral dura mater", "cerebral-dura-mater", "bilateral", "Short display name for source 'Cerebral hemisphere segment of dura mater'; default hidden because it is a whole-brain shell."),
}

QUALITY_FLAGS: dict[str, str] = {
    "FJ1758": "suspected_name_geometry_scope_mismatch: source says temporal-lobe white matter, but bounds/volume span almost the whole cerebral hemisphere; default hidden pending expert review",
    "FJ1806": "suspected_name_geometry_scope_mismatch: source says temporal-lobe white matter, but bounds/volume span almost the whole cerebral hemisphere; default hidden pending expert review",
    "FJ3890": "whole_brain_dural_shell_default_hidden",
    "FJ4425": "many_indexed_components_before_spatial_weld",
    "FJ4426": "many_indexed_components_before_spatial_weld; 7 degenerate triangles in source",
    "FJ3901": "source_side_label_conflicts_with_bounds",
    "FJ1735": "source_side_label_conflicts_with_bounds",
    "FJ1736": "source_side_label_conflicts_with_bounds",
    "FJ1825": "source_contains_five_two_triangle_submillimetre_micro_fragments_on_opposite_side_removed_by_converter; dominant component is correctly right-sided",
    "FJ4024": "side_geometry_review_required: one welded component labelled trunk of right vagus nerve crosses extensively into positive-X (subject-left) bounds; default hidden pending anatomical adjudication",
}

DEFAULT_HIDDEN_FJ = {"FJ1758", "FJ1806", "FJ3890", "FJ3926", "FJ4024"}
DEFAULT_HIDDEN_TIERS = {"cranial_division_pool"}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def parse_vector(value: str) -> list[float]:
    return [float(x) for x in value.split(";") if x != ""]


def display_default(source_name: str) -> str:
    if source_name.startswith("Trunk of "):
        rest = source_name[len("Trunk of ") :]
        return rest[:1].upper() + rest[1:]
    return source_name


def side_from_display(name: str) -> str:
    n = name.lower()
    if re.search(r"\bleft\b", n):
        return "left"
    if re.search(r"\bright\b", n):
        return "right"
    return "midline_or_unspecified"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--candidates",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation/bp3d-cns-candidates.csv"),
    )
    ap.add_argument(
        "--fingerprints",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation/bp3d-obj-geometry-fingerprints.csv"),
    )
    ap.add_argument(
        "--out-dir",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation"),
    )
    args = ap.parse_args()

    candidates = {
        r["fj_id"]: r
        for r in csv.DictReader(args.candidates.open(newline="", encoding="utf-8"))
    }
    fingerprints = {
        r["fj_id"]: r
        for r in csv.DictReader(args.fingerprints.open(newline="", encoding="utf-8"))
    }

    fj_to_group: dict[str, str] = {}
    for concept_id, spec in GROUPS.items():
        for fj in spec["fjs"]:
            if fj in fj_to_group:
                raise SystemExit(f"{fj} is assigned to multiple groups")
            fj_to_group[fj] = concept_id

    rows: list[dict[str, object]] = []
    for fj in sorted(candidates, key=lambda x: (candidates[x]["source_name"].lower(), x)):
        c = candidates[fj]
        f = fingerprints.get(fj, {})
        excluded = fj in EXCLUSIONS
        group_id = fj_to_group.get(fj, "")
        if group_id:
            spec = GROUPS[group_id]
            concept_id = group_id
            display_name = str(spec["display_name"])
            side = str(spec["side"])
            decision_type = "include_component_of_merged_concept"
            reason = str(spec["reason"])
        elif fj in RENAMES:
            display_name, concept_id, side, note = RENAMES[fj]
            decision_type = "include_renamed_for_display_or_side"
            reason = note
        else:
            display_name = display_default(c["source_name"])
            concept_id = slugify(display_name)
            side = side_from_display(display_name)
            decision_type = "include_single_component"
            reason = "No same-name alternate required exclusion; retained as a single-component concept."

        if excluded:
            status = "excluded"
            decision_type = "exclude_alternate_or_duplicate"
            reason = EXCLUSIONS[fj]
            concept_id = slugify(display_default(c["source_name"]))
            display_name = display_default(c["source_name"])
            side = side_from_display(display_name)
            group_id = ""
        else:
            status = "included"

        tier_final = c["tier"]
        if tier_final in {"cranial_proximal_pool", "cranial_division_pool"}:
            tier_final = "cranial_optional"
        elif tier_final == "cranial_proximal":
            tier_final = "cranial_proximal"

        default_visible = (
            status == "included"
            and fj not in DEFAULT_HIDDEN_FJ
            and c["tier"] not in DEFAULT_HIDDEN_TIERS
        )

        catalogue_bp = c["catalogue_bp_id_first_mapping"]
        catalogue_fma = c["catalogue_fma_id_first_mapping"]
        header_bp = f.get("header_representation_id", "")
        header_fma = f.get("header_concept_id", "")
        identifier_note = ""
        if catalogue_bp != header_bp or catalogue_fma != header_fma:
            identifier_note = (
                "Catalogue first-mapping BP/FMA differs from OBJ header BP/concept; "
                "OBJ header is treated as object-level provenance and catalogue values retained separately."
            )

        rows.append(
            {
                "fj_id": fj,
                "status": status,
                "decision_type": decision_type,
                "decision_reason": reason,
                "concept_id": concept_id,
                "display_name": display_name,
                "source_name": c["source_name"],
                "category": c["category"],
                "subregion": c["subregion"],
                "side_curated": side,
                "tier_final": tier_final,
                "default_visible": str(default_visible).lower(),
                "merge_group": group_id,
                "quality_flags": QUALITY_FLAGS.get(fj, ""),
                "catalogue_bp_id_first_mapping": catalogue_bp,
                "catalogue_fma_id_first_mapping": catalogue_fma,
                "obj_header_bp_id": header_bp,
                "obj_header_concept_id": header_fma,
                "identifier_note": identifier_note,
                "obj_header_compatibility_version": f.get("header_compatibility_version", ""),
                "obj_header_build_up_logic": f.get("header_build_up_logic", ""),
                "obj_sha256": f.get("sha256", ""),
                "catalogue_faces": c["catalogue_faces"],
                "audited_triangles": f.get("triangles_after_fan_triangulation", ""),
                "audited_vertices": f.get("vertices", ""),
                "absolute_volume_cm3": f.get("absolute_volume_cm3", ""),
                "bounds_min_mm": f.get("bounds_min_mm", ""),
                "bounds_max_mm": f.get("bounds_max_mm", ""),
                "root_concepts": c["root_concepts"],
                "selection_bases": c["selection_bases"],
                "fma2obj_specific_concepts": c["fma2obj_specific_concepts"],
                "review_status": "geometry_fingerprinted_pending_faculty_review",
            }
        )

    included = [r for r in rows if r["status"] == "included"]

    # Safety gate: after group/rename/exclusion logic, no two included FJs may
    # claim the same concept unless they are an explicit merge group.
    concept_to_fjs: dict[str, list[str]] = defaultdict(list)
    for row in included:
        concept_to_fjs[str(row["concept_id"])].append(str(row["fj_id"]))
    unresolved = {
        concept: fjs
        for concept, fjs in concept_to_fjs.items()
        if len(fjs) > 1 and concept not in GROUPS
    }
    if unresolved:
        raise SystemExit(f"Unresolved included duplicate concepts: {unresolved}")

    concepts: list[dict[str, object]] = []
    for concept_id, fjs in sorted(concept_to_fjs.items()):
        component_rows = [next(r for r in included if r["fj_id"] == fj) for fj in fjs]
        mins: list[list[float]] = []
        maxs: list[list[float]] = []
        components: list[dict[str, object]] = []
        for r in component_rows:
            f = fingerprints[str(r["fj_id"])]
            mins.append(parse_vector(f["bounds_min_mm"]))
            maxs.append(parse_vector(f["bounds_max_mm"]))
            components.append(
                {
                    "fj_id": r["fj_id"],
                    "source_name": r["source_name"],
                    "obj_header_bp_id": r["obj_header_bp_id"],
                    "obj_header_concept_id": r["obj_header_concept_id"],
                    "catalogue_bp_id_first_mapping": r["catalogue_bp_id_first_mapping"],
                    "catalogue_fma_id_first_mapping": r["catalogue_fma_id_first_mapping"],
                    "compatibility_version": r["obj_header_compatibility_version"],
                    "build_up_logic": r["obj_header_build_up_logic"],
                    "sha256": r["obj_sha256"],
                    "vertices": int(f["vertices"]),
                    "triangles": int(f["triangles_after_fan_triangulation"]),
                    "absolute_volume_cm3": float(f["absolute_volume_cm3"]),
                    "surface_area_cm2": float(f["surface_area_cm2"]),
                    "bounds_min_mm": parse_vector(f["bounds_min_mm"]),
                    "bounds_max_mm": parse_vector(f["bounds_max_mm"]),
                    "selection_bases": r["selection_bases"],
                    "fma2obj_specific_concepts": r["fma2obj_specific_concepts"],
                    "quality_flags": r["quality_flags"],
                }
            )
        combined_min = [min(v[i] for v in mins) for i in range(3)]
        combined_max = [max(v[i] for v in maxs) for i in range(3)]
        first = component_rows[0]
        concepts.append(
            {
                "concept_id": concept_id,
                "display_name": first["display_name"],
                "category": first["category"],
                "subregion": first["subregion"],
                "side": first["side_curated"],
                "tier": first["tier_final"],
                "default_visible": any(r["default_visible"] == "true" for r in component_rows),
                "component_count": len(components),
                "source_fj_ids": fjs,
                "total_source_vertices": sum(int(c["vertices"]) for c in components),
                "total_source_triangles": sum(int(c["triangles"]) for c in components),
                "total_absolute_volume_cm3": round(sum(float(c["absolute_volume_cm3"]) for c in components), 6),
                "bounds_min_mm": combined_min,
                "bounds_max_mm": combined_max,
                "components": components,
                "curation_decision": sorted(set(str(r["decision_reason"]) for r in component_rows)),
                "quality_flags": sorted(set(str(r["quality_flags"]) for r in component_rows if r["quality_flags"])),
                "review_status": "geometry_fingerprinted_pending_faculty_review",
                "source_dataset": "BodyParts3D/Anatomography 4.3 via FJ endpoint acquisition",
            }
        )

    args.out_dir.mkdir(parents=True, exist_ok=True)
    curation_csv = args.out_dir / "bp3d-cns-curation.csv"
    with curation_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    concepts_json = args.out_dir / "bp3d-cns-concepts.json"
    concepts_json.write_text(
        json.dumps(
            {
                "dataset_id": "neuraxia-bp3d-cns-sprint1b-v0.1",
                "source_dataset": "BodyParts3D/Anatomography",
                "source_version_evidence": "FMA2Obj.txt header: Data Version 4.3; Objects set 4.3; Tree version FMA3.0. OBJ headers carry Compatibility version 4.3.",
                "concept_count": len(concepts),
                "included_component_meshes": len(included),
                "concepts": concepts,
            },
            indent=2,
            sort_keys=True,
        ),
        encoding="utf-8",
    )

    included_list = args.out_dir / "bp3d-cns-included-fj.txt"
    included_list.write_text("\n".join(str(r["fj_id"]) for r in included) + "\n", encoding="utf-8")

    summary = {
        "candidate_meshes": len(rows),
        "included_component_meshes": len(included),
        "excluded_component_meshes": len(rows) - len(included),
        "final_concepts": len(concepts),
        "included_source_triangles": sum(int(fingerprints[str(r["fj_id"])]["triangles_after_fan_triangulation"]) for r in included),
        "included_source_vertices": sum(int(fingerprints[str(r["fj_id"])]["vertices"]) for r in included),
        "default_visible_concepts": sum(1 for c in concepts if c["default_visible"]),
        "by_category": {},
        "by_tier": {},
        "merge_groups": {k: v["fjs"] for k, v in GROUPS.items()},
        "excluded_fj": EXCLUSIONS,
    }
    for field, target in (("category", "by_category"), ("tier", "by_tier")):
        counter: dict[str, dict[str, int]] = {}
        for c in concepts:
            key = str(c[field])
            bucket = counter.setdefault(key, {"concepts": 0, "components": 0, "source_triangles": 0})
            bucket["concepts"] += 1
            bucket["components"] += int(c["component_count"])
            bucket["source_triangles"] += int(c["total_source_triangles"])
        summary[target] = counter

    summary_path = args.out_dir / "bp3d-cns-curation-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, sort_keys=True), encoding="utf-8")

    print(f"Wrote {curation_csv}")
    print(f"Wrote {concepts_json} ({len(concepts)} concepts)")
    print(f"Wrote {included_list} ({len(included)} included FJ)")
    print(f"Wrote {summary_path}")
    print(json.dumps({k: summary[k] for k in ("candidate_meshes", "included_component_meshes", "excluded_component_meshes", "final_concepts", "included_source_triangles", "included_source_vertices", "default_visible_concepts", "by_category", "by_tier")}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
