#!/usr/bin/env python3
"""Convert curated BodyParts3D OBJ concepts to a provenance-rich GLB.

Source BodyParts3D coordinates are millimetres in an LPS-like frame:
+X = subject left, +Y = posterior, +Z = superior. The converter maps them to
right-handed glTF metres as:

    glTF = (source_x, source_z, -source_y) / 1000

so +X remains subject left, +Y is superior, and +Z is anterior. It centres
only Y/Z on the complete included model; X is deliberately not bounding-box
centred, so the source anatomical midline remains exactly at ``x = 0``.

Components assigned to the same Neuraxia concept are merged into one pickable
mesh. Every GLB node and mesh carries `extras.neuraxia` with concept,
category, side, tier, source FJ/BP/concept IDs, hashes and triangle counts.
"""

from __future__ import annotations

import argparse
import csv
import json
import struct
import sys
import time
from pathlib import Path

import numpy as np

# The workspace intentionally does not vendor heavy geometry dependencies.
# /tmp/neuraxia-pydeps is used during Sprint 1B; a normal environment can
# simply install the packages listed in pipeline/README.md.
for candidate in (Path("/tmp/neuraxia-pydeps"),):
    if candidate.exists() and str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

import fast_simplification  # noqa: E402
from scipy.sparse import coo_matrix  # noqa: E402
from scipy.sparse.csgraph import connected_components  # noqa: E402
from pygltflib import (  # noqa: E402
    ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER,
    FLOAT,
    UNSIGNED_INT,
    UNSIGNED_SHORT,
    Accessor,
    Asset,
    Buffer,
    BufferView,
    GLTF2,
    Material,
    Mesh,
    Node,
    PbrMetallicRoughness,
    Primitive,
    Scene,
)

CATEGORY_STYLE: dict[str, dict[str, object]] = {
    "cortex": {"rgba": [0.851, 0.643, 0.557, 0.96], "roughness": 0.62},
    "deep": {"rgba": [0.878, 0.647, 0.557, 1.0], "roughness": 0.58},
    "white": {"rgba": [0.941, 0.902, 0.855, 0.94], "roughness": 0.70},
    "ventricles": {"rgba": [0.125, 0.843, 0.898, 0.48], "roughness": 0.32},
    "axis": {"rgba": [0.788, 0.553, 0.447, 0.98], "roughness": 0.64},
    "cranial": {"rgba": [0.910, 0.765, 0.604, 0.98], "roughness": 0.55},
    "meninges": {"rgba": [0.663, 0.541, 0.486, 0.28], "roughness": 0.80},
    "context": {"rgba": [0.796, 0.718, 0.651, 0.96], "roughness": 0.66},
}

PROFILES: dict[str, dict[str, dict[str, float]]] = {
    "desktop": {
        "cortex": {"retain": 0.28, "cap": 12000},
        "deep": {"retain": 0.35, "cap": 5000},
        "white": {"retain": 0.32, "cap": 10000},
        "ventricles": {"retain": 0.35, "cap": 8000},
        "axis": {"retain": 0.32, "cap": 15000},
        "cranial": {"retain": 0.30, "cap": 5000},
        "meninges": {"retain": 0.15, "cap": 10000},
        "context": {"retain": 0.50, "cap": 1000},
    },
    "mobile": {
        "cortex": {"retain": 0.12, "cap": 6000},
        "deep": {"retain": 0.18, "cap": 2500},
        "white": {"retain": 0.16, "cap": 5000},
        "ventricles": {"retain": 0.18, "cap": 4000},
        "axis": {"retain": 0.16, "cap": 8000},
        "cranial": {"retain": 0.15, "cap": 2500},
        "meninges": {"retain": 0.07, "cap": 5000},
        "context": {"retain": 0.25, "cap": 600},
    },
    "none": {},
}


def parse_obj(path: Path) -> tuple[np.ndarray, np.ndarray]:
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int]] = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("v "):
            p = line.split()
            vertices.append((float(p[1]), float(p[2]), float(p[3])))
        elif line.startswith("f "):
            idx: list[int] = []
            for token in line.split()[1:]:
                raw = token.split("/", 1)[0]
                if not raw:
                    continue
                value = int(raw)
                idx.append(value - 1 if value > 0 else len(vertices) + value)
            for i in range(1, len(idx) - 1):
                faces.append((idx[0], idx[i], idx[i + 1]))
    return np.asarray(vertices, dtype=np.float64), np.asarray(faces, dtype=np.int64)


def weld(vertices: np.ndarray, faces: np.ndarray, tolerance_mm: float = 0.01) -> tuple[np.ndarray, np.ndarray]:
    if len(vertices) == 0:
        return vertices, faces
    keys = np.rint(vertices / tolerance_mm).astype(np.int64)
    unique_keys, inverse = np.unique(keys, axis=0, return_inverse=True)
    inverse = np.asarray(inverse).reshape(-1)
    welded = unique_keys.astype(np.float64) * tolerance_mm
    remapped = inverse[faces]
    valid = (
        (remapped[:, 0] != remapped[:, 1])
        & (remapped[:, 1] != remapped[:, 2])
        & (remapped[:, 2] != remapped[:, 0])
    )
    remapped = remapped[valid]
    if len(remapped):
        remapped = np.unique(remapped, axis=0)
    return welded, remapped.astype(np.int64)


def remove_unused(vertices: np.ndarray, faces: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    if len(faces) == 0:
        return vertices[:0], faces[:0]
    used, inverse = np.unique(faces, return_inverse=True)
    return vertices[used], inverse.reshape(faces.shape).astype(np.int64)


def cleanup(vertices: np.ndarray, faces: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    if len(faces):
        valid = (
            (faces[:, 0] != faces[:, 1])
            & (faces[:, 1] != faces[:, 2])
            & (faces[:, 2] != faces[:, 0])
        )
        faces = faces[valid]
        if len(faces):
            faces = np.unique(faces, axis=0)
    return remove_unused(vertices, faces)


def remove_micro_fragments(
    vertices: np.ndarray,
    faces: np.ndarray,
    *,
    max_faces: int = 4,
    max_diagonal_mm: float = 1.0,
    max_fraction_of_largest: float = 0.01,
) -> tuple[np.ndarray, np.ndarray, int, int]:
    """Remove only unmistakable source specks, never anatomical components.

    Sprint 1B found five two-triangle, submillimetre fragments in
    FJ1825 (Right stria terminalis) on the opposite side of the midline.
    They expanded the concept bounds by ~55 mm while contributing no visible
    anatomy. This filter is intentionally much narrower than a generic
    smallest-component cleanup: a component must satisfy *all three* limits
    (<=4 faces, <=1 mm bounding diagonal, <=1% of the largest component).
    Returns vertices, faces, removed_face_count, removed_component_count.
    """
    if len(vertices) == 0 or len(faces) == 0:
        return vertices, faces, 0, 0

    edges = np.vstack(
        [
            faces[:, [0, 1]],
            faces[:, [1, 2]],
            faces[:, [2, 0]],
        ]
    )
    graph = coo_matrix(
        (np.ones(len(edges), dtype=np.bool_), (edges[:, 0], edges[:, 1])),
        shape=(len(vertices), len(vertices)),
    )
    component_count, labels = connected_components(graph, directed=False)
    if component_count <= 1:
        return vertices, faces, 0, 0

    face_component = labels[faces[:, 0]]
    face_counts = np.bincount(face_component, minlength=component_count)
    largest = int(face_counts.max(initial=0))
    if largest <= max_faces:
        return vertices, faces, 0, 0

    drop_components: set[int] = set()
    for component, count in enumerate(face_counts):
        if count == 0 or count > max_faces:
            continue
        if count / largest > max_fraction_of_largest:
            continue
        component_vertices = vertices[labels == component]
        if len(component_vertices) == 0:
            continue
        diagonal = float(
            np.linalg.norm(
                component_vertices.max(axis=0) - component_vertices.min(axis=0)
            )
        )
        if diagonal <= max_diagonal_mm:
            drop_components.add(component)

    if not drop_components:
        return vertices, faces, 0, 0

    keep_faces = np.array(
        [component not in drop_components for component in face_component], dtype=bool
    )
    removed_faces = int(np.count_nonzero(~keep_faces))
    if removed_faces == 0 or not np.any(keep_faces):
        return vertices, faces, 0, 0
    cleaned_vertices, cleaned_faces = cleanup(vertices, faces[keep_faces])
    return cleaned_vertices, cleaned_faces, removed_faces, len(drop_components)


def simplify_mesh(
    vertices: np.ndarray,
    faces: np.ndarray,
    category: str,
    profile: str,
) -> tuple[np.ndarray, np.ndarray, str, int]:
    source_faces = len(faces)
    if profile == "none" or source_faces == 0:
        return vertices, faces, "none", source_faces
    spec = PROFILES[profile].get(category, {"retain": 0.3, "cap": 8000})
    min_faces = source_faces if source_faces <= 1000 else (500 if profile == "desktop" else 280)
    target = int(round(source_faces * float(spec["retain"])))
    target = max(target, min_faces)
    target = min(target, int(spec["cap"]), source_faces)
    if target >= source_faces * 0.95:
        return vertices, faces, "skipped_small_mesh", target
    reduction = 1.0 - target / source_faces
    try:
        new_vertices, new_faces = fast_simplification.simplify(
            vertices.astype(np.float64),
            faces.astype(np.int64),
            target_reduction=float(reduction),
            agg=6 if profile == "desktop" else 7,
        )
        new_vertices, new_faces = cleanup(
            np.asarray(new_vertices, dtype=np.float64),
            np.asarray(new_faces, dtype=np.int64),
        )
        if len(new_faces) == 0:
            raise RuntimeError("simplifier returned no faces")
        return new_vertices, new_faces, "fast_simplification_quadric", target
    except Exception as exc:  # pragma: no cover - exercised only on bad meshes
        print(f"  simplification fallback ({exc})", file=sys.stderr)
        return vertices, faces, f"fallback_original:{type(exc).__name__}", target


def transform_vertices(vertices: np.ndarray) -> np.ndarray:
    out = np.empty_like(vertices, dtype=np.float64)
    out[:, 0] = vertices[:, 0] / 1000.0
    out[:, 1] = vertices[:, 2] / 1000.0
    out[:, 2] = -vertices[:, 1] / 1000.0
    return out


def compute_normals(vertices: np.ndarray, faces: np.ndarray) -> np.ndarray:
    normals = np.zeros_like(vertices, dtype=np.float64)
    if len(faces):
        tris = vertices[faces]
        face_normals = np.cross(tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0])
        for corner in range(3):
            np.add.at(normals, faces[:, corner], face_normals)
    lengths = np.linalg.norm(normals, axis=1)
    nonzero = lengths > 0
    normals[nonzero] /= lengths[nonzero, None]
    normals[~nonzero] = np.array([0.0, 1.0, 0.0])
    return normals.astype(np.float32)


def append_aligned(blob: bytearray, data: bytes) -> int:
    offset = len(blob)
    blob.extend(data)
    while len(blob) % 4:
        blob.append(0)
    return offset


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--concepts",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation/bp3d-cns-concepts.json"),
    )
    ap.add_argument("--obj-dir", type=Path, default=Path("/tmp/neuraxia-sprint1b/raw-obj"))
    ap.add_argument(
        "--out",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/output/neuraxia-bp3d-cns-desktop.glb"),
    )
    ap.add_argument("--profile", choices=sorted(PROFILES), default="desktop")
    ap.add_argument("--limit", type=int, default=0, help="Only convert the first N concepts (smoke test)")
    args = ap.parse_args()

    started = time.time()
    dataset = json.loads(args.concepts.read_text(encoding="utf-8"))
    concepts = dataset["concepts"]
    if args.limit:
        concepts = concepts[: args.limit]

    obj_by_fj = {p.name.split("_", 1)[0]: p for p in args.obj_dir.glob("*.obj")}

    prepared: list[dict[str, object]] = []
    report_rows: list[dict[str, object]] = []

    for index, concept in enumerate(concepts, start=1):
        concept_id = concept["concept_id"]
        print(f"[{index:03}/{len(concepts):03}] {concept['display_name']} ({concept_id})")
        all_vertices: list[np.ndarray] = []
        all_faces: list[np.ndarray] = []
        vertex_offset = 0
        welded_source_vertices = 0
        micro_fragments_removed_faces = 0
        micro_fragments_removed_components = 0

        for component in concept["components"]:
            fj = component["fj_id"]
            path = obj_by_fj.get(fj)
            if path is None:
                raise SystemExit(f"Missing OBJ for included concept component {fj}")
            vertices, faces = parse_obj(path)
            vertices, faces = weld(vertices, faces)
            vertices, faces = cleanup(vertices, faces)
            vertices, faces, removed_faces, removed_components = remove_micro_fragments(
                vertices, faces
            )
            micro_fragments_removed_faces += removed_faces
            micro_fragments_removed_components += removed_components
            welded_source_vertices += len(vertices)
            all_vertices.append(vertices)
            all_faces.append(faces + vertex_offset)
            vertex_offset += len(vertices)

        vertices = np.vstack(all_vertices) if all_vertices else np.zeros((0, 3))
        faces = np.vstack(all_faces) if all_faces else np.zeros((0, 3), dtype=np.int64)
        welded_faces = len(faces)
        vertices, faces, method, target_faces = simplify_mesh(
            vertices, faces, str(concept["category"]), args.profile
        )
        vertices, faces = cleanup(vertices, faces)
        vertices, faces, removed_faces, removed_components = remove_micro_fragments(
            vertices, faces
        )
        micro_fragments_removed_faces += removed_faces
        micro_fragments_removed_components += removed_components
        transformed = transform_vertices(vertices)

        prepared.append(
            {
                "concept": concept,
                "vertices": transformed,
                "faces": faces,
                "welded_vertices": welded_source_vertices,
                "welded_faces": welded_faces,
                "method": method,
                "target_faces": target_faces,
                "micro_fragments_removed_faces": micro_fragments_removed_faces,
                "micro_fragments_removed_components": micro_fragments_removed_components,
            }
        )

    if not prepared:
        raise SystemExit("No concepts prepared")

    global_min = np.min(np.vstack([p["vertices"].min(axis=0) for p in prepared]), axis=0)
    global_max = np.max(np.vstack([p["vertices"].max(axis=0) for p in prepared]), axis=0)
    global_center = (global_min + global_max) / 2.0
    # Preserve the anatomical midsagittal plane at x=0. A bounding-box centre
    # would shift the midline by the model's left/right extent asymmetry
    # (about 2.3 mm for Sprint 1B), which complicates laterality QA and any
    # future registration to tract/atlas coordinates.
    applied_translation = np.array([0.0, global_center[1], global_center[2]])

    gltf = GLTF2()
    gltf.asset = Asset(
        version="2.0",
        generator="Neuraxia Sprint 1B BodyParts3D OBJ-to-GLB pipeline",
        copyright="BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Sprint 1B curation/conversion by Neuraxia; see sidecar provenance.",
        extras={
            "neuraxia_dataset_id": dataset.get("dataset_id", "neuraxia-bp3d-cns-sprint1b-v0.1"),
            "profile": args.profile,
            "source_dataset": "BodyParts3D/Anatomography 4.3",
            "coordinate_transform": "glTF metres = (source_x, source_z, -source_y)/1000; Y/Z centred on global bounds; X preserved so anatomical midline x=0",
            "anatomical_axes_gltf": {
                "+X": "subject left",
                "+Y": "superior",
                "+Z": "anterior",
                "anatomical_midline_x_m": 0.0,
            },
            "applied_translation_subtracted_m": applied_translation.tolist(),
            "global_bounds_before_centring_m": {
                "min": global_min.tolist(),
                "max": global_max.tolist(),
                "center": global_center.tolist(),
            },
            "review_status": "technical_candidate_pending_faculty_anatomy_review",
        },
    )

    material_by_category: dict[str, int] = {}
    gltf.materials = []
    for category, style in CATEGORY_STYLE.items():
        rgba = style["rgba"]
        material_by_category[category] = len(gltf.materials)
        gltf.materials.append(
            Material(
                name=f"neuraxia-{category}",
                pbrMetallicRoughness=PbrMetallicRoughness(
                    baseColorFactor=rgba,
                    metallicFactor=0.04,
                    roughnessFactor=float(style["roughness"]),
                ),
                alphaMode="BLEND" if float(rgba[3]) < 1 else "OPAQUE",
                doubleSided=True,
            )
        )

    blob = bytearray()
    gltf.buffers = [Buffer(byteLength=0)]
    gltf.bufferViews = []
    gltf.accessors = []
    gltf.meshes = []
    gltf.nodes = []

    for item in prepared:
        concept = item["concept"]
        vertices = (np.asarray(item["vertices"]) - applied_translation).astype(np.float32)
        faces = np.asarray(item["faces"], dtype=np.int64)
        normals = compute_normals(vertices.astype(np.float64), faces)

        pos_bytes = vertices.tobytes(order="C")
        pos_offset = append_aligned(blob, pos_bytes)
        pos_view = len(gltf.bufferViews)
        gltf.bufferViews.append(
            BufferView(buffer=0, byteOffset=pos_offset, byteLength=len(pos_bytes), target=ARRAY_BUFFER)
        )
        pos_accessor = len(gltf.accessors)
        gltf.accessors.append(
            Accessor(
                bufferView=pos_view,
                componentType=FLOAT,
                count=int(len(vertices)),
                type="VEC3",
                min=vertices.min(axis=0).tolist() if len(vertices) else [0, 0, 0],
                max=vertices.max(axis=0).tolist() if len(vertices) else [0, 0, 0],
            )
        )

        normal_bytes = normals.tobytes(order="C")
        normal_offset = append_aligned(blob, normal_bytes)
        normal_view = len(gltf.bufferViews)
        gltf.bufferViews.append(
            BufferView(buffer=0, byteOffset=normal_offset, byteLength=len(normal_bytes), target=ARRAY_BUFFER)
        )
        normal_accessor = len(gltf.accessors)
        gltf.accessors.append(
            Accessor(
                bufferView=normal_view,
                componentType=FLOAT,
                count=int(len(normals)),
                type="VEC3",
            )
        )

        flat_faces = faces.reshape(-1)
        if len(vertices) <= 65535:
            index_array = flat_faces.astype(np.uint16)
            index_type = UNSIGNED_SHORT
        else:
            index_array = flat_faces.astype(np.uint32)
            index_type = UNSIGNED_INT
        index_bytes = index_array.tobytes(order="C")
        index_offset = append_aligned(blob, index_bytes)
        index_view = len(gltf.bufferViews)
        gltf.bufferViews.append(
            BufferView(buffer=0, byteOffset=index_offset, byteLength=len(index_bytes), target=ELEMENT_ARRAY_BUFFER)
        )
        index_accessor = len(gltf.accessors)
        gltf.accessors.append(
            Accessor(
                bufferView=index_view,
                componentType=index_type,
                count=int(len(index_array)),
                type="SCALAR",
            )
        )

        neuraxia_extras = {
            "concept_id": concept["concept_id"],
            "display_name": concept["display_name"],
            "category": concept["category"],
            "subregion": concept["subregion"],
            "side": concept["side"],
            "tier": concept["tier"],
            "default_visible": bool(concept["default_visible"]),
            "source_dataset": concept["source_dataset"],
            "source_fj_ids": concept["source_fj_ids"],
            "source_component_count": concept["component_count"],
            "source_names": [c["source_name"] for c in concept["components"]],
            "obj_header_bp_ids": [c["obj_header_bp_id"] for c in concept["components"]],
            "obj_header_concept_ids": [c["obj_header_concept_id"] for c in concept["components"]],
            "obj_sha256": [c["sha256"] for c in concept["components"]],
            "source_bounds_mm": {"min": concept["bounds_min_mm"], "max": concept["bounds_max_mm"]},
            "source_vertices": concept["total_source_vertices"],
            "source_triangles": concept["total_source_triangles"],
            "welded_vertices": int(item["welded_vertices"]),
            "welded_triangles": int(item["welded_faces"]),
            "micro_fragments_removed_faces": int(item["micro_fragments_removed_faces"]),
            "micro_fragments_removed_components": int(
                item["micro_fragments_removed_components"]
            ),
            "output_vertices": int(len(vertices)),
            "output_triangles": int(len(faces)),
            "simplification_method": str(item["method"]),
            "quality_flags": concept.get("quality_flags", []),
            "review_status": concept.get("review_status", ""),
        }

        mesh = Mesh(
            name=str(concept["display_name"]),
            primitives=[
                Primitive(
                    attributes={"POSITION": pos_accessor, "NORMAL": normal_accessor},
                    indices=index_accessor,
                    material=material_by_category[str(concept["category"])],
                    mode=4,
                )
            ],
            extras={"neuraxia": neuraxia_extras},
        )
        mesh_index = len(gltf.meshes)
        gltf.meshes.append(mesh)
        gltf.nodes.append(
            Node(
                name=str(concept["display_name"]),
                mesh=mesh_index,
                extras={"neuraxia": neuraxia_extras},
            )
        )

        report_rows.append(
            {
                "concept_id": concept["concept_id"],
                "display_name": concept["display_name"],
                "category": concept["category"],
                "subregion": concept["subregion"],
                "side": concept["side"],
                "tier": concept["tier"],
                "default_visible": concept["default_visible"],
                "source_fj_ids": ";".join(concept["source_fj_ids"]),
                "source_vertices": concept["total_source_vertices"],
                "source_triangles": concept["total_source_triangles"],
                "welded_vertices": item["welded_vertices"],
                "welded_triangles": item["welded_faces"],
                "micro_fragments_removed_faces": item["micro_fragments_removed_faces"],
                "micro_fragments_removed_components": item[
                    "micro_fragments_removed_components"
                ],
                "target_triangles": item["target_faces"],
                "output_vertices": len(vertices),
                "output_triangles": len(faces),
                "triangle_retention_vs_source": round(
                    len(faces) / max(1, int(concept["total_source_triangles"])), 6
                ),
                "simplification_method": item["method"],
                "output_bounds_min_m": ";".join(str(x) for x in vertices.min(axis=0).tolist()),
                "output_bounds_max_m": ";".join(str(x) for x in vertices.max(axis=0).tolist()),
                "quality_flags": ";".join(concept.get("quality_flags", [])),
            }
        )

    gltf.buffers[0].byteLength = len(blob)
    gltf.set_binary_blob(bytes(blob))
    gltf.scenes = [Scene(name="Neuraxia BodyParts3D CNS Sprint 1B", nodes=list(range(len(gltf.nodes))))]
    gltf.scene = 0

    args.out.parent.mkdir(parents=True, exist_ok=True)
    gltf.save_binary(str(args.out))

    report_json = args.out.with_suffix(".build-report.json")
    report_csv = args.out.with_suffix(".build-report.csv")
    total_source_triangles = sum(int(r["source_triangles"]) for r in report_rows)
    total_output_triangles = sum(int(r["output_triangles"]) for r in report_rows)
    total_output_vertices = sum(int(r["output_vertices"]) for r in report_rows)
    report = {
        "output": str(args.out),
        "output_bytes": args.out.stat().st_size,
        "profile": args.profile,
        "concepts": len(report_rows),
        "source_triangles": total_source_triangles,
        "output_triangles": total_output_triangles,
        "output_vertices": total_output_vertices,
        "triangle_retention": total_output_triangles / max(1, total_source_triangles),
        "global_bounds_before_centring_m": {
            "min": global_min.tolist(),
            "max": global_max.tolist(),
            "center": global_center.tolist(),
        },
        "applied_translation_subtracted_m": applied_translation.tolist(),
        "anatomical_midline_x_m": 0.0,
        "elapsed_seconds": round(time.time() - started, 3),
        "rows": report_rows,
    }
    report_json.write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    with report_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(report_rows[0].keys()))
        writer.writeheader()
        writer.writerows(report_rows)

    print(f"Wrote {args.out} ({args.out.stat().st_size} bytes)")
    print(f"Wrote {report_json}")
    print(f"Wrote {report_csv}")
    print(
        json.dumps(
            {
                k: report[k]
                for k in (
                    "concepts",
                    "source_triangles",
                    "output_triangles",
                    "output_vertices",
                    "triangle_retention",
                    "elapsed_seconds",
                )
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
