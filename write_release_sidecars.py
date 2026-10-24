#!/usr/bin/env python3
"""Write attribution/provenance sidecars for Sprint 1B candidate GLBs."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

OFFICIAL_ATTRIBUTION = (
    "BodyParts3D, © The Database Center for Life Science licensed under "
    "CC Attribution 4.0 International"
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_provenance(
    concepts_path: Path,
    output_dir: Path,
    audit_path: Path,
) -> dict[str, Any]:
    dataset = json.loads(concepts_path.read_text(encoding="utf-8"))
    audit = json.loads(audit_path.read_text(encoding="utf-8")) if audit_path.exists() else {}

    output_files = []
    for item in audit.get("files", []):
        path = Path(item["path"])
        output_files.append(
            {
                "filename": path.name,
                "path": str(path),
                "bytes": item["bytes"],
                "gzip_bytes": item["gzip_bytes"],
                "sha256": sha256(path),
                "concepts": item["concepts_audited"],
                "vertices": item["vertices"],
                "triangles": item["triangles"],
                "extensions_used": item["extensions_used"],
                "structural_errors": item["errors"],
            }
        )

    components: list[dict[str, Any]] = []
    for concept in dataset["concepts"]:
        for component in concept["components"]:
            components.append(
                {
                    "neuraxia_concept_id": concept["concept_id"],
                    "display_name": concept["display_name"],
                    "category": concept["category"],
                    "subregion": concept["subregion"],
                    "side": concept["side"],
                    "tier": concept["tier"],
                    "default_visible": concept["default_visible"],
                    "fj_id": component["fj_id"],
                    "source_name": component["source_name"],
                    "obj_header_bp_id": component["obj_header_bp_id"],
                    "obj_header_concept_id": component["obj_header_concept_id"],
                    "catalogue_bp_id_first_mapping_only": component[
                        "catalogue_bp_id_first_mapping"
                    ],
                    "catalogue_fma_id_first_mapping_only": component[
                        "catalogue_fma_id_first_mapping"
                    ],
                    "compatibility_version": component["compatibility_version"],
                    "build_up_logic": component["build_up_logic"],
                    "source_obj_sha256": component["sha256"],
                    "source_vertices": component["vertices"],
                    "source_triangles": component["triangles"],
                    "absolute_volume_cm3": component["absolute_volume_cm3"],
                    "surface_area_cm2": component["surface_area_cm2"],
                    "bounds_min_mm_source_axes": component["bounds_min_mm"],
                    "bounds_max_mm_source_axes": component["bounds_max_mm"],
                    "selection_bases": component["selection_bases"],
                    "fma2obj_specific_concepts": component["fma2obj_specific_concepts"],
                    "quality_flags": component["quality_flags"],
                }
            )

    return {
        "dataset_id": dataset.get("dataset_id", "neuraxia-bp3d-cns-sprint1b-v0.1"),
        "release_status": (
            "INTERNAL_TECHNICAL_CANDIDATE_ONLY — not cleared for public/commercial "
            "release until the BodyParts3D licence-version ambiguity is settled in "
            "writing and the anatomy passes expert review"
        ),
        "source": {
            "dataset": "BodyParts3D/Anatomography",
            "source_version_evidence": dataset.get("source_version_evidence", ""),
            "acquisition": "Direct FJ OBJ acquisition through Neuraxia's Sprint 1B pipeline; no Z-Anatomy or Body Atlas geometry is included in these candidate GLBs.",
            "official_database_page": "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html",
            "official_download_page": "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html",
            "official_licence_page": "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
            "official_licence_page_last_updated": "2025-02-27",
            "licence_as_currently_stated_by_official_page": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "required_attribution": OFFICIAL_ATTRIBUTION,
            "unresolved_licence_ambiguity": (
                "Legacy BodyParts3D/Anatomography references and some third-party tools state "
                "CC BY-SA 2.1 Japan, and the licence-summary hyperlink embedded in the mirrored "
                "README still points to BY-SA 2.1 JP even though its text says CC BY 4.0. "
                "Neuraxia therefore treats public redistribution terms as unresolved until DBCLS "
                "clarifies which terms govern the acquired 4.3 FJ objects."
            ),
            "noncommercial_material_included": False,
            "z_anatomy_geometry_included": False,
            "body_atlas_spike_geometry_included": False,
        },
        "neuraxia_transformations": [
            "Ontology/hierarchy-assisted candidate selection with explicit manual curation, exclusions, side corrections and merge groups.",
            "Parsed OBJ polygon faces with fan triangulation.",
            "Welded coincident vertices on a 0.01 mm spatial grid.",
            "Removed degenerate/duplicate/unused geometry.",
            "Removed only micro-fragments satisfying all of: <=4 faces, <=1 mm bounding diagonal, <=1% of the largest connected component; removed counts are recorded per concept in the build reports and GLB extras.",
            "Merged source components assigned to the same Neuraxia concept into one pickable mesh.",
            "Applied category/profile-specific quadric simplification with fast-simplification.",
            "Recomputed smooth vertex normals.",
            "Converted source millimetres (left, posterior, superior) to glTF metres as (x, z, -y)/1000, yielding (+X subject left, +Y superior, +Z anterior).",
            "Centred Y/Z on the full-model bounds while preserving anatomical midline x=0.",
            "Assigned Neuraxia category materials and wrote concept/source provenance into node and mesh extras.neuraxia.",
            "Produced Meshopt variants with gltf-transform 4.5.1 using EXT_meshopt_compression and KHR_mesh_quantization, 14-bit position and 10-bit normal quantisation settings.",
        ],
        "coordinate_frame": {
            "units": "metres",
            "+X": "subject left",
            "+Y": "superior",
            "+Z": "anterior",
            "anatomical_midline_x_m": 0.0,
            "note": "Three.js GLTFLoader sanitises Object3D names; apps must use extras.neuraxia.display_name as the canonical label.",
        },
        "inventory": {
            "concepts": len(dataset["concepts"]),
            "included_source_components": len(components),
            "source_obj_hashes_are_per_component": True,
        },
        "output_files": output_files,
        "components": components,
        "concepts": dataset["concepts"],
    }


def render_attribution(provenance: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# Attribution and provenance — Neuraxia Sprint 1B BodyParts3D candidate")
    lines.append("")
    lines.append(f"> {OFFICIAL_ATTRIBUTION}.")
    lines.append("")
    lines.append("## Status")
    lines.append("")
    lines.append(f"**{provenance['release_status']}**")
    lines.append("")
    lines.append(
        "The current official BodyParts3D licence page (last updated 2025-02-27) specifies CC BY 4.0. "
        "However, legacy Anatomography/BodyParts3D references and third-party acquisition tools still state "
        "CC BY-SA 2.1 Japan, and a licence-summary link in the mirrored README points to BY-SA 2.1 JP. "
        "Do not publish or commercially redistribute these adapted GLBs until DBCLS confirms the governing "
        "terms for the acquired 4.3 FJ objects, or a qualified reviewer accepts a conservative share-alike release strategy."
    )
    lines.append("")
    lines.append("## Source")
    lines.append("")
    lines.append("- Database: BodyParts3D / Anatomography")
    lines.append(f"- Version evidence: {provenance['source']['source_version_evidence']}")
    lines.append("- Neuraxia dataset: `" + str(provenance["dataset_id"]) + "`")
    lines.append(f"- Official licence page: {provenance['source']['official_licence_page']}")
    lines.append(f"- Official database page: {provenance['source']['official_database_page']}")
    lines.append("- Z-Anatomy geometry included: **no**")
    lines.append("- Body Atlas Sprint 1 spike geometry included: **no**")
    lines.append("- Non-commercial source material included: **no**")
    lines.append("")
    lines.append("## Neuraxia changes")
    lines.append("")
    for change in provenance["neuraxia_transformations"]:
        lines.append(f"- {change}")
    lines.append("")
    lines.append("## Output checksums")
    lines.append("")
    lines.append("| File | Bytes | Triangles | SHA-256 |")
    lines.append("|---|---:|---:|---|")
    for item in provenance["output_files"]:
        lines.append(
            f"| `{item['filename']}` | {item['bytes']:,} | {item['triangles']:,} | `{item['sha256']}` |"
        )
    lines.append("")
    lines.append("## Machine-readable provenance")
    lines.append("")
    lines.append(
        "`SOURCE_PROVENANCE.json` lists all 182 Neuraxia concepts and all 202 included FJ components with "
        "source names, OBJ-header BP/concept IDs, first-mapping catalogue IDs (explicitly not treated as "
        "complete mappings), source bounds, triangle counts and SHA-256 hashes."
    )
    lines.append("")
    lines.append("## Medical/educational status")
    lines.append("")
    lines.append(
        "These files are a technical candidate pending expert neuroanatomy review. They are not a clinical, "
        "surgical-planning or diagnostic product."
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
        "--output-dir",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/output"),
    )
    ap.add_argument(
        "--audit",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/reports/glb-structural-audit.json"),
    )
    args = ap.parse_args()

    provenance = build_provenance(args.concepts, args.output_dir, args.audit)
    json_path = args.output_dir / "SOURCE_PROVENANCE.json"
    md_path = args.output_dir / "ATTRIBUTION.md"
    json_path.write_text(json.dumps(provenance, indent=2, sort_keys=True), encoding="utf-8")
    md_path.write_text(render_attribution(provenance), encoding="utf-8")
    print(f"Wrote {json_path} ({json_path.stat().st_size} bytes)")
    print(f"Wrote {md_path} ({md_path.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
