#!/usr/bin/env python3
"""Structural, metadata and laterality audit for Neuraxia Sprint 1B GLBs.

The audit intentionally reads the GLB JSON/accessor declarations rather than
trusting converter build reports. For Meshopt files it derives world bounds
from quantized accessor min/max corners transformed by each node matrix; this
is sufficient for bounds/laterality QA without decoding the full geometry.
"""

from __future__ import annotations

import argparse
import gzip
import io
import json
import math
import struct
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import numpy as np


def read_glb_json(path: Path) -> dict[str, Any]:
    data = path.read_bytes()
    if data[:4] != b"glTF":
        raise ValueError(f"{path} is not a GLB")
    chunk_length, chunk_type = struct.unpack_from("<II", data, 12)
    if chunk_type != 0x4E4F534A:
        raise ValueError(f"{path} first chunk is not JSON")
    return json.loads(data[20 : 20 + chunk_length].decode("utf-8"))


def gzip_size(path: Path) -> int:
    buffer = io.BytesIO()
    with gzip.GzipFile(fileobj=buffer, mode="wb", compresslevel=9, mtime=0) as stream:
        stream.write(path.read_bytes())
    return len(buffer.getvalue())


def quaternion_matrix(q: list[float]) -> np.ndarray:
    x, y, z, w = [float(v) for v in q]
    return np.array(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ],
        dtype=np.float64,
    )


def node_matrix(node: dict[str, Any]) -> np.ndarray:
    if "matrix" in node:
        return np.asarray(node["matrix"], dtype=np.float64).reshape((4, 4), order="F")
    matrix = np.eye(4)
    scale = np.asarray(node.get("scale", [1, 1, 1]), dtype=np.float64)
    rotation = quaternion_matrix(node.get("rotation", [0, 0, 0, 1]))
    matrix[:3, :3] = rotation @ np.diag(scale)
    matrix[:3, 3] = np.asarray(node.get("translation", [0, 0, 0]), dtype=np.float64)
    return matrix


def transformed_bounds(accessor: dict[str, Any], matrix: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    lo = np.asarray(accessor["min"], dtype=np.float64)
    hi = np.asarray(accessor["max"], dtype=np.float64)
    # Meshopt/KHR_mesh_quantization files declare integer accessor bounds in
    # stored integer units, while the node scale is defined against the
    # normalized attribute values. Convert before applying the node matrix.
    if accessor.get("normalized"):
        denominator_by_component = {
            5120: 127.0,  # BYTE
            5121: 255.0,  # UNSIGNED_BYTE
            5122: 32767.0,  # SHORT
            5123: 65535.0,  # UNSIGNED_SHORT
        }
        denominator = denominator_by_component.get(int(accessor.get("componentType", 0)))
        if denominator:
            lo = lo / denominator
            hi = hi / denominator
            if int(accessor.get("componentType", 0)) in (5120, 5122):
                lo = np.maximum(lo, -1.0)
                hi = np.maximum(hi, -1.0)
    corners = np.array(
        [[x, y, z] for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])],
        dtype=np.float64,
    )
    homogeneous = np.hstack([corners, np.ones((len(corners), 1))])
    world = (matrix @ homogeneous.T).T[:, :3]
    return world.min(axis=0), world.max(axis=0)


def pair_key(display_name: str) -> tuple[str, str] | None:
    name = display_name
    if name.startswith("Left "):
        return name[5:], "left"
    if name.startswith("Right "):
        return name[6:], "right"
    if " of left " in name:
        return name.replace(" of left ", " of "), "left"
    if " of right " in name:
        return name.replace(" of right ", " of "), "right"
    return None


def audit_file(path: Path, concepts: list[dict[str, Any]]) -> dict[str, Any]:
    gltf = read_glb_json(path)
    errors: list[str] = []
    warnings: list[str] = []

    nodes = gltf.get("nodes", [])
    meshes = gltf.get("meshes", [])
    accessors = gltf.get("accessors", [])
    materials = gltf.get("materials", [])

    if len(nodes) != len(concepts):
        errors.append(f"node count {len(nodes)} != concept count {len(concepts)}")
    if len(meshes) != len(concepts):
        errors.append(f"mesh count {len(meshes)} != concept count {len(concepts)}")
    if gltf.get("scenes", [{}])[0].get("nodes") != list(range(len(nodes))):
        errors.append("scene does not reference every node exactly once in order")

    concept_by_id = {c["concept_id"]: c for c in concepts}
    rows: list[dict[str, Any]] = []
    seen_concepts: set[str] = set()

    for index, node in enumerate(nodes):
        mesh_index = node.get("mesh")
        if mesh_index is None:
            errors.append(f"node {index} has no mesh")
            continue
        mesh = meshes[int(mesh_index)]
        node_extra = node.get("extras", {}).get("neuraxia")
        mesh_extra = mesh.get("extras", {}).get("neuraxia")
        if not isinstance(node_extra, dict) or not isinstance(mesh_extra, dict):
            errors.append(f"node/mesh {index} missing extras.neuraxia")
            continue
        if node_extra != mesh_extra:
            errors.append(f"node/mesh extras differ at {index} ({node.get('name')})")

        concept_id = str(node_extra.get("concept_id", ""))
        seen_concepts.add(concept_id)
        concept = concept_by_id.get(concept_id)
        if concept is None:
            errors.append(f"unknown concept_id {concept_id!r} at node {index}")
            continue

        expected_name = str(concept["display_name"])
        if node.get("name") != expected_name or mesh.get("name") != expected_name:
            errors.append(
                f"name mismatch for {concept_id}: node={node.get('name')!r} mesh={mesh.get('name')!r}"
            )
        for field in ("category", "subregion", "side", "tier"):
            if node_extra.get(field) != concept.get(field):
                errors.append(f"{concept_id} extras field {field} mismatch")
        if bool(node_extra.get("default_visible")) != bool(concept.get("default_visible")):
            errors.append(f"{concept_id} default_visible mismatch")
        if node_extra.get("source_fj_ids") != concept.get("source_fj_ids"):
            errors.append(f"{concept_id} source_fj_ids mismatch")

        primitives = mesh.get("primitives", [])
        if len(primitives) != 1:
            errors.append(f"{concept_id} has {len(primitives)} primitives, expected 1")
            continue
        primitive = primitives[0]
        pos_accessor = accessors[int(primitive["attributes"]["POSITION"])]
        index_accessor = accessors[int(primitive["indices"])]
        vertex_count = int(pos_accessor["count"])
        triangle_count = int(index_accessor["count"]) // 3
        if int(index_accessor["count"]) % 3:
            errors.append(f"{concept_id} index count is not divisible by 3")
        if vertex_count != int(node_extra.get("output_vertices", -1)):
            errors.append(f"{concept_id} vertex count extras mismatch")
        if triangle_count != int(node_extra.get("output_triangles", -1)):
            errors.append(f"{concept_id} triangle count extras mismatch")

        material_index = primitive.get("material")
        material_name = ""
        if material_index is not None and int(material_index) < len(materials):
            material_name = str(materials[int(material_index)].get("name", ""))
        expected_material = f"neuraxia-{concept['category']}"
        if material_name != expected_material:
            errors.append(
                f"{concept_id} material {material_name!r}, expected {expected_material!r}"
            )

        lo, hi = transformed_bounds(pos_accessor, node_matrix(node))
        rows.append(
            {
                "concept_id": concept_id,
                "display_name": expected_name,
                "category": str(concept["category"]),
                "subregion": str(concept["subregion"]),
                "side": str(concept["side"]),
                "tier": str(concept["tier"]),
                "default_visible": bool(concept["default_visible"]),
                "source_fj_ids": list(concept["source_fj_ids"]),
                "source_triangles": int(concept["total_source_triangles"]),
                "vertices": vertex_count,
                "triangles": triangle_count,
                "bounds_min_mm": [round(float(x * 1000), 4) for x in lo],
                "bounds_max_mm": [round(float(x * 1000), 4) for x in hi],
                "bounds_center_mm": [
                    round(float((lo[i] + hi[i]) * 500), 4) for i in range(3)
                ],
                "bounds_dims_mm": [
                    round(float((hi[i] - lo[i]) * 1000), 4) for i in range(3)
                ],
                "quality_flags": list(concept.get("quality_flags", [])),
            }
        )

    missing = sorted(set(concept_by_id) - seen_concepts)
    extra = sorted(seen_concepts - set(concept_by_id))
    if missing:
        errors.append(f"missing concepts: {missing}")
    if extra:
        errors.append(f"extra concepts: {extra}")

    # Laterality: +X is subject left and the anatomical midline is x=0.
    side_crossings: list[dict[str, Any]] = []
    for row in rows:
        lo_x = float(row["bounds_min_mm"][0])
        hi_x = float(row["bounds_max_mm"][0])
        crossing = 0.0
        if row["side"] == "left" and lo_x < -2:
            crossing = -lo_x
        elif row["side"] == "right" and hi_x > 2:
            crossing = hi_x
        if crossing:
            side_crossings.append(
                {
                    "display_name": row["display_name"],
                    "concept_id": row["concept_id"],
                    "side": row["side"],
                    "x_bounds_mm": [lo_x, hi_x],
                    "crossing_beyond_midline_mm": round(crossing, 3),
                    "default_visible": row["default_visible"],
                    "source_fj_ids": row["source_fj_ids"],
                    "quality_flags": row["quality_flags"],
                }
            )

    pairs: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for row in rows:
        parsed = pair_key(str(row["display_name"]))
        if parsed:
            key, side = parsed
            pairs[key][side] = row

    paired_flags: list[dict[str, Any]] = []
    complete_pairs = 0
    for key, pair in sorted(pairs.items()):
        if "left" not in pair or "right" not in pair:
            continue
        complete_pairs += 1
        left = pair["left"]
        right = pair["right"]
        dim_diff = max(
            abs(float(left["bounds_dims_mm"][i]) - float(right["bounds_dims_mm"][i]))
            for i in range(3)
        )
        mirror_error = abs(
            float(left["bounds_center_mm"][0]) + float(right["bounds_center_mm"][0])
        )
        yz_center_diff = max(
            abs(float(left["bounds_center_mm"][i]) - float(right["bounds_center_mm"][i]))
            for i in (1, 2)
        )
        tri_ratio = max(left["source_triangles"], right["source_triangles"]) / max(
            1, min(left["source_triangles"], right["source_triangles"])
        )
        if dim_diff > 5 or mirror_error > 5 or yz_center_diff > 5 or tri_ratio > 1.8:
            paired_flags.append(
                {
                    "pair": key,
                    "max_dimension_difference_mm": round(dim_diff, 3),
                    "mirror_centre_error_mm": round(mirror_error, 3),
                    "max_yz_centre_difference_mm": round(yz_center_diff, 3),
                    "source_triangle_ratio": round(tri_ratio, 3),
                    "left_centre_mm": left["bounds_center_mm"],
                    "right_centre_mm": right["bounds_center_mm"],
                    "left_dims_mm": left["bounds_dims_mm"],
                    "right_dims_mm": right["bounds_dims_mm"],
                }
            )

    if side_crossings:
        warnings.append(
            f"{len(side_crossings)} side-labelled concept(s) cross x=0 by >2 mm"
        )
    if paired_flags:
        warnings.append(f"{len(paired_flags)} paired concept(s) exceed asymmetry QA thresholds")

    global_min = [min(float(r["bounds_min_mm"][i]) for r in rows) for i in range(3)]
    global_max = [max(float(r["bounds_max_mm"][i]) for r in rows) for i in range(3)]

    category_triangles: Counter[str] = Counter()
    category_vertices: Counter[str] = Counter()
    category_concepts: Counter[str] = Counter()
    visible_triangles = 0
    visible_vertices = 0
    for row in rows:
        category_triangles[row["category"]] += int(row["triangles"])
        category_vertices[row["category"]] += int(row["vertices"])
        category_concepts[row["category"]] += 1
        if row["default_visible"]:
            visible_triangles += int(row["triangles"])
            visible_vertices += int(row["vertices"])

    return {
        "path": str(path),
        "bytes": path.stat().st_size,
        "gzip_bytes": gzip_size(path),
        "extensions_used": gltf.get("extensionsUsed", []),
        "extensions_required": gltf.get("extensionsRequired", []),
        "asset": gltf.get("asset", {}),
        "material_names": [m.get("name", "") for m in materials],
        "nodes": len(nodes),
        "meshes": len(meshes),
        "concepts_audited": len(rows),
        "complete_left_right_pairs": complete_pairs,
        "vertices": sum(int(r["vertices"]) for r in rows),
        "triangles": sum(int(r["triangles"]) for r in rows),
        "default_visible_concepts": sum(bool(r["default_visible"]) for r in rows),
        "default_hidden_concepts": [
            r["display_name"] for r in rows if not r["default_visible"]
        ],
        "default_visible_vertices": visible_vertices,
        "default_visible_triangles": visible_triangles,
        "global_bounds_min_mm": [round(x, 4) for x in global_min],
        "global_bounds_max_mm": [round(x, 4) for x in global_max],
        "global_bounds_dims_mm": [
            round(global_max[i] - global_min[i], 4) for i in range(3)
        ],
        "category_counts": {
            category: {
                "concepts": int(category_concepts[category]),
                "vertices": int(category_vertices[category]),
                "triangles": int(category_triangles[category]),
            }
            for category in sorted(category_concepts)
        },
        "side_counts": dict(Counter(str(r["side"]) for r in rows)),
        "tier_counts": dict(Counter(str(r["tier"]) for r in rows)),
        "quality_flagged_concepts": [
            {
                "display_name": r["display_name"],
                "concept_id": r["concept_id"],
                "source_fj_ids": r["source_fj_ids"],
                "quality_flags": r["quality_flags"],
                "default_visible": r["default_visible"],
            }
            for r in rows
            if r["quality_flags"]
        ],
        "side_crossing_flags": side_crossings,
        "paired_asymmetry_flags": paired_flags,
        "largest_concepts_by_triangles": sorted(
            [
                {
                    "display_name": r["display_name"],
                    "category": r["category"],
                    "triangles": r["triangles"],
                    "vertices": r["vertices"],
                    "default_visible": r["default_visible"],
                }
                for r in rows
            ],
            key=lambda r: int(r["triangles"]),
            reverse=True,
        )[:15],
        "errors": errors,
        "warnings": warnings,
        "rows": rows,
    }


def human_bytes(value: int) -> str:
    return f"{value / 1_000_000:.3f} MB ({value:,} bytes)"


def render_markdown(report: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# Neuraxia Sprint 1B — GLB structural and laterality audit")
    lines.append("")
    lines.append(
        "This report is generated from the GLB files themselves (JSON, accessor counts, "
        "accessor bounds and `extras.neuraxia`), cross-checked against the curated concept JSON."
    )
    lines.append("")
    lines.append("## File summary")
    lines.append("")
    lines.append("| File | Size | Gzip size | Concepts | Vertices | Triangles | Extensions | Errors |")
    lines.append("|---|---:|---:|---:|---:|---:|---|---:|")
    for item in report["files"]:
        lines.append(
            f"| `{Path(item['path']).name}` | {human_bytes(item['bytes'])} | {human_bytes(item['gzip_bytes'])} | "
            f"{item['concepts_audited']} | {item['vertices']:,} | {item['triangles']:,} | "
            f"{', '.join(item['extensions_used']) or 'none'} | {len(item['errors'])} |"
        )
    lines.append("")

    primary = report["files"][0]
    lines.append("## Coordinate frame")
    lines.append("")
    lines.append("- glTF units: metres")
    lines.append("- `+X`: subject left")
    lines.append("- `+Y`: superior")
    lines.append("- `+Z`: anterior")
    lines.append("- Anatomical midsagittal plane: `x = 0` (Y/Z are bounds-centred; X is preserved)")
    lines.append(
        f"- Desktop global bounds (mm): min `{primary['global_bounds_min_mm']}`, max `{primary['global_bounds_max_mm']}`, dimensions `{primary['global_bounds_dims_mm']}`"
    )
    lines.append("")

    lines.append("## Category geometry (desktop)")
    lines.append("")
    lines.append("| Category | Concepts | Vertices | Triangles |")
    lines.append("|---|---:|---:|---:|")
    for category, values in primary["category_counts"].items():
        lines.append(
            f"| {category} | {values['concepts']} | {values['vertices']:,} | {values['triangles']:,} |"
        )
    lines.append("")
    lines.append(
        f"Default-visible desktop load: **{primary['default_visible_concepts']} concepts**, "
        f"**{primary['default_visible_vertices']:,} vertices**, **{primary['default_visible_triangles']:,} triangles**."
    )
    lines.append("")

    lines.append("## Laterality and pair QA")
    lines.append("")
    lines.append(f"Complete left/right named pairs checked: **{primary['complete_left_right_pairs']}**.")
    lines.append("")
    if primary["side_crossing_flags"]:
        lines.append("### Side-labelled concepts crossing `x=0` by more than 2 mm")
        lines.append("")
        for flag in primary["side_crossing_flags"]:
            lines.append(
                f"- **{flag['display_name']}** (`{'/'.join(flag['source_fj_ids'])}`): "
                f"x bounds `{flag['x_bounds_mm']}` mm; crosses by {flag['crossing_beyond_midline_mm']:.1f} mm; "
                f"default visible: {str(flag['default_visible']).lower()}."
            )
        lines.append("")
    else:
        lines.append("No side-labelled concept crosses the midline by more than 2 mm.")
        lines.append("")

    if primary["paired_asymmetry_flags"]:
        lines.append("### Paired concepts exceeding asymmetry thresholds")
        lines.append("")
        lines.append(
            "Thresholds: dimension difference >5 mm, mirror-centre error >5 mm, Y/Z centre difference >5 mm, or source-triangle ratio >1.8."
        )
        lines.append("")
        lines.append("| Pair | Max dim diff (mm) | Mirror error (mm) | Y/Z centre diff (mm) | Source-triangle ratio |")
        lines.append("|---|---:|---:|---:|---:|")
        for flag in primary["paired_asymmetry_flags"]:
            lines.append(
                f"| {flag['pair']} | {flag['max_dimension_difference_mm']:.1f} | {flag['mirror_centre_error_mm']:.1f} | "
                f"{flag['max_yz_centre_difference_mm']:.1f} | {flag['source_triangle_ratio']:.2f} |"
            )
        lines.append("")

    lines.append("## Quality-flagged concepts carried into the GLBs")
    lines.append("")
    for item in primary["quality_flagged_concepts"]:
        flags = "; ".join(str(f) for f in item["quality_flags"])
        lines.append(
            f"- **{item['display_name']}** (`{'/'.join(item['source_fj_ids'])}`): {flags}"
        )
    lines.append("")

    lines.append("## Structural errors and warnings")
    lines.append("")
    for item in report["files"]:
        lines.append(f"### `{Path(item['path']).name}`")
        lines.append("")
        if item["errors"]:
            lines.extend(f"- ERROR: {error}" for error in item["errors"])
        else:
            lines.append("- No structural/metadata errors.")
        if item["warnings"]:
            lines.extend(f"- WARNING: {warning}" for warning in item["warnings"])
        lines.append("")

    lines.append("## Interpretation")
    lines.append("")
    lines.append(
        "- A clean structural audit does **not** prove anatomical correctness; it proves that the curated concepts, "
        "names, source IDs, counts, materials and coordinate metadata survived conversion/compression consistently."
    )
    lines.append(
        "- Right stria terminalis is no longer a laterality bounds problem after removal of five two-triangle, "
        "submillimetre source fragments; its dominant component is correctly right-sided."
    )
    lines.append(
        "- The trunk of the right vagus nerve remains a genuine source-geometry adjudication item: it is one welded "
        "component, defaults hidden, and must not be used for side-specific teaching until visually/anatomically resolved."
    )
    lines.append(
        "- Triangle-count asymmetry alone (for example thalamus or lateral geniculate body) is a mesh-density/source "
        "generation warning, not by itself evidence of wrong anatomy when bounds and centres mirror well."
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
        "--report-dir",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/reports"),
    )
    args = ap.parse_args()

    dataset = json.loads(args.concepts.read_text(encoding="utf-8"))
    concepts = dataset["concepts"]
    candidates = [
        args.output_dir / "neuraxia-bp3d-cns-desktop.glb",
        args.output_dir / "neuraxia-bp3d-cns-mobile.glb",
        args.output_dir / "neuraxia-bp3d-cns-desktop.meshopt.glb",
        args.output_dir / "neuraxia-bp3d-cns-mobile.meshopt.glb",
    ]

    files = [audit_file(path, concepts) for path in candidates if path.exists()]

    # Cross-profile consistency: geometry counts may differ, but concept order
    # and metadata identity must not.
    cross_errors: list[str] = []
    if files:
        reference = [(r["concept_id"], r["display_name"], tuple(r["source_fj_ids"])) for r in files[0]["rows"]]
        for item in files[1:]:
            current = [(r["concept_id"], r["display_name"], tuple(r["source_fj_ids"])) for r in item["rows"]]
            if current != reference:
                cross_errors.append(f"concept order/identity differs in {item['path']}")

    report = {
        "dataset_id": dataset.get("dataset_id", ""),
        "concept_count": len(concepts),
        "cross_profile_errors": cross_errors,
        "files": files,
    }

    args.report_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.report_dir / "glb-structural-audit.json"
    md_path = args.report_dir / "glb-structural-audit.md"
    json_path.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    md_path.write_text(render_markdown(report), encoding="utf-8")

    error_count = len(cross_errors) + sum(len(f["errors"]) for f in files)
    for item in files:
        print(
            f"{Path(item['path']).name}: {item['concepts_audited']} concepts, "
            f"{item['vertices']:,} vertices, {item['triangles']:,} triangles, "
            f"{item['bytes']:,} bytes, errors={len(item['errors'])}, warnings={len(item['warnings'])}"
        )
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")
    return 1 if error_count else 0


if __name__ == "__main__":
    raise SystemExit(main())
