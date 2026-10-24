#!/usr/bin/env python3
"""Fingerprint BodyParts3D OBJ meshes for duplicate adjudication.

For every OBJ this records the file's own provenance header, SHA-256, vertex
and face counts, bounds, signed/absolute volume, surface area, degenerate
triangle count and connected-component count. These measurements distinguish
three situations that names alone cannot:

* complementary left/right or sequential components of one concept;
* alternate generations of the same component occupying the same bounds;
* genuinely different fragments that merely share a display name.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

BOUNDS_RE = re.compile(
    r"Bounds\(mm\)\s*:\s*\(([^)]+)\)-\(([^)]+)\)", re.IGNORECASE
)


def parse_header(text_lines: list[str]) -> dict[str, str]:
    header: dict[str, str] = {}
    for line in text_lines[:40]:
        if not line.startswith("#"):
            if header:
                break
            continue
        clean = line[1:].strip()
        if ":" in clean:
            key, value = clean.split(":", 1)
            header[key.strip().lower()] = value.strip()
    return header


def header_bounds(header: dict[str, str]) -> tuple[np.ndarray | None, np.ndarray | None]:
    raw = ""
    for key, value in header.items():
        if key.startswith("bounds"):
            raw = f"Bounds(mm): {value}"
            break
    m = BOUNDS_RE.search(raw)
    if not m:
        return None, None
    lo = np.array([float(x) for x in m.group(1).split(",")], dtype=np.float64)
    hi = np.array([float(x) for x in m.group(2).split(",")], dtype=np.float64)
    return lo, hi


def parse_obj(path: Path) -> tuple[dict[str, str], np.ndarray, np.ndarray, int, int]:
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    header = parse_header(lines)
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int]] = []
    face_records = 0
    normal_count = 0

    for line in lines:
        if line.startswith("v "):
            parts = line.split()
            if len(parts) >= 4:
                vertices.append((float(parts[1]), float(parts[2]), float(parts[3])))
        elif line.startswith("vn "):
            normal_count += 1
        elif line.startswith("f "):
            face_records += 1
            indices: list[int] = []
            for token in line.split()[1:]:
                raw_index = token.split("/", 1)[0]
                if not raw_index:
                    continue
                idx = int(raw_index)
                if idx < 0:
                    idx = len(vertices) + idx
                else:
                    idx -= 1
                indices.append(idx)
            if len(indices) >= 3:
                for i in range(1, len(indices) - 1):
                    faces.append((indices[0], indices[i], indices[i + 1]))

    return (
        header,
        np.asarray(vertices, dtype=np.float64),
        np.asarray(faces, dtype=np.int64),
        face_records,
        normal_count,
    )


def component_stats(vertices: np.ndarray, faces: np.ndarray) -> tuple[int, float, int]:
    if len(vertices) == 0 or len(faces) == 0:
        return 0, 0.0, 0
    used = np.unique(faces)
    rows = np.concatenate([faces[:, 0], faces[:, 1], faces[:, 1], faces[:, 2], faces[:, 2], faces[:, 0]])
    cols = np.concatenate([faces[:, 1], faces[:, 0], faces[:, 2], faces[:, 1], faces[:, 0], faces[:, 2]])
    graph = coo_matrix(
        (np.ones(len(rows), dtype=np.uint8), (rows, cols)),
        shape=(len(vertices), len(vertices)),
    )
    _, labels = connected_components(graph, directed=False)
    used_labels = labels[used]
    _, counts = np.unique(used_labels, return_counts=True)
    isolated = len(vertices) - len(used)
    return int(len(counts)), float(counts.max() / len(used)) if len(used) else 0.0, int(isolated)


def audit_one(path: Path) -> dict[str, object]:
    fj = path.name.split("_", 1)[0]
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    header, vertices, faces, face_records, normal_count = parse_obj(path)

    if len(vertices):
        lo = vertices.min(axis=0)
        hi = vertices.max(axis=0)
        center = (lo + hi) / 2
        dims = hi - lo
        centroid = vertices.mean(axis=0)
    else:
        lo = hi = center = dims = centroid = np.zeros(3)

    signed_volume_mm3 = 0.0
    surface_area_mm2 = 0.0
    degenerate = 0
    if len(faces):
        tris = vertices[faces]
        signed_volume_mm3 = float(
            np.einsum("ij,ij->", tris[:, 0], np.cross(tris[:, 1], tris[:, 2])) / 6.0
        )
        cross = np.cross(tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0])
        areas = 0.5 * np.linalg.norm(cross, axis=1)
        surface_area_mm2 = float(areas.sum())
        degenerate = int(np.count_nonzero(areas <= 1e-12))

    hlo, hhi = header_bounds(header)
    header_bounds_max_delta = ""
    if hlo is not None and hhi is not None and len(vertices):
        header_bounds_max_delta = round(
            float(max(np.max(np.abs(hlo - lo)), np.max(np.abs(hhi - hi)))), 6
        )

    comps, largest_fraction, isolated = component_stats(vertices, faces)

    def fmt(v: np.ndarray) -> str:
        return ";".join(f"{x:.4f}" for x in v)

    return {
        "fj_id": fj,
        "filename": path.name,
        "sha256": digest,
        "obj_bytes": path.stat().st_size,
        "header_file_id": header.get("file id", ""),
        "header_representation_id": header.get("representation id", ""),
        "header_concept_id": header.get("concept id", ""),
        "header_english_name": header.get("english name", ""),
        "header_compatibility_version": header.get("compatibility version", ""),
        "header_build_up_logic": header.get("build-up logic", ""),
        "header_volume_cm3": header.get("volume(cm3)", ""),
        "vertices": int(len(vertices)),
        "normals": int(normal_count),
        "face_records": int(face_records),
        "triangles_after_fan_triangulation": int(len(faces)),
        "degenerate_triangles": degenerate,
        "connected_components_used_vertices": comps,
        "largest_component_used_vertex_fraction": round(largest_fraction, 6),
        "isolated_vertices": isolated,
        "bounds_min_mm": fmt(lo),
        "bounds_max_mm": fmt(hi),
        "bounds_center_mm": fmt(center),
        "bounds_dims_mm": fmt(dims),
        "bounds_diagonal_mm": round(float(np.linalg.norm(dims)), 4),
        "vertex_centroid_mm": fmt(centroid),
        "signed_volume_cm3": round(signed_volume_mm3 / 1000.0, 6),
        "absolute_volume_cm3": round(abs(signed_volume_mm3) / 1000.0, 6),
        "surface_area_cm2": round(surface_area_mm2 / 100.0, 6),
        "header_bounds_max_delta_mm": header_bounds_max_delta,
        "x_side_by_bounds": (
            "positive_x_left_half"
            if lo[0] >= -2 and hi[0] > 2
            else "negative_x_right_half"
            if hi[0] <= 2 and lo[0] < -2
            else "crosses_midline_or_midline"
        ),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--candidates",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation/bp3d-cns-candidates.csv"),
    )
    ap.add_argument("--obj-dir", type=Path, default=Path("/tmp/neuraxia-sprint1b/raw-obj"))
    ap.add_argument(
        "--out-dir",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation"),
    )
    args = ap.parse_args()

    candidate_rows = list(csv.DictReader(args.candidates.open(newline="", encoding="utf-8")))
    obj_by_fj = {p.name.split("_", 1)[0]: p for p in args.obj_dir.glob("*.obj")}

    rows: list[dict[str, object]] = []
    missing: list[str] = []
    for candidate in candidate_rows:
        fj = candidate["fj_id"]
        path = obj_by_fj.get(fj)
        if path is None:
            missing.append(fj)
            continue
        print(f"Auditing {fj} {candidate['source_name']}")
        result = audit_one(path)
        result.update(
            {
                "source_name": candidate["source_name"],
                "category": candidate["category"],
                "subregion": candidate["subregion"],
                "tier": candidate["tier"],
                "concept_key_provisional": candidate["concept_key_provisional"],
                "duplicate_group_size": candidate["duplicate_group_size"],
                "duplicate_group_fj_ids": candidate["duplicate_group_fj_ids"],
            }
        )
        rows.append(result)

    if missing:
        raise SystemExit(f"Missing OBJ files for: {missing}")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = args.out_dir / "bp3d-obj-geometry-fingerprints.csv"
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    json_path = args.out_dir / "bp3d-obj-geometry-fingerprints.json"
    json_path.write_text(json.dumps(rows, indent=2, sort_keys=True), encoding="utf-8")

    duplicate_rows = [r for r in rows if int(r["duplicate_group_size"]) > 1]
    dup_path = args.out_dir / "bp3d-duplicate-fingerprints.csv"
    with dup_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sorted(duplicate_rows, key=lambda r: (str(r["source_name"]).lower(), str(r["fj_id"]))))

    print(f"Wrote {csv_path} ({len(rows)} meshes)")
    print(f"Wrote {json_path}")
    print(f"Wrote {dup_path} ({len(duplicate_rows)} duplicate-group meshes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
