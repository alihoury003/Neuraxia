#!/usr/bin/env python3
"""Render orthographic comparison sheets for Sprint 1B.

This is a QA/contact-sheet renderer, not the product renderer. It draws a
deterministic sample of filled triangles in coronal, sagittal and axial
projections so that gross orientation, laterality, centring and category
coverage can be inspected without a browser/GPU.
"""

from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.collections import PolyCollection

for candidate in (Path("/tmp/neuraxia-pydeps"),):
    if candidate.exists() and str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

import trimesh  # noqa: E402
from scipy.spatial.transform import Rotation  # noqa: E402

COLORS: dict[str, tuple[float, float, float, float]] = {
    "cortex": (0.851, 0.643, 0.557, 0.52),
    "deep": (0.95, 0.68, 0.52, 0.62),
    "white": (0.941, 0.902, 0.855, 0.45),
    "ventricles": (0.125, 0.843, 0.898, 0.62),
    "axis": (0.788, 0.553, 0.447, 0.62),
    "cranial": (0.98, 0.82, 0.55, 0.58),
    "meninges": (0.72, 0.62, 0.58, 0.30),
    "context": (0.80, 0.72, 0.65, 0.60),
    "peripheral": (0.45, 0.43, 0.42, 0.30),
    "roots": (0.65, 0.60, 0.54, 0.45),
}

DEFAULT_SPIKE = {"cortex", "deep", "white", "ventricles", "axis", "cranial", "meninges"}


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


def _read_glb_json_and_bin(path: Path) -> tuple[dict, bytes]:
    data = path.read_bytes()
    if data[:4] != b"glTF":
        raise ValueError("Not a binary glTF file")
    _version, _length = struct.unpack_from("<II", data, 4)
    offset = 12
    gltf_json: dict | None = None
    binary = b""
    while offset < len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == 0x4E4F534A:  # JSON
            gltf_json = json.loads(chunk.decode("utf-8"))
        elif chunk_type == 0x004E4942:  # BIN\0
            binary = chunk
    if gltf_json is None:
        raise ValueError("GLB JSON chunk missing")
    return gltf_json, binary


def _accessor_array(gltf: dict, binary: bytes, accessor_index: int) -> np.ndarray:
    accessor = gltf["accessors"][accessor_index]
    view = gltf["bufferViews"][accessor["bufferView"]]
    dtype_by_component = {
        5120: np.int8,
        5121: np.uint8,
        5122: np.int16,
        5123: np.uint16,
        5125: np.uint32,
        5126: np.float32,
    }
    components_by_type = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
    dtype = np.dtype(dtype_by_component[int(accessor["componentType"])]).newbyteorder("<")
    components = components_by_type[accessor["type"]]
    count = int(accessor["count"])
    item_bytes = dtype.itemsize * components
    stride = int(view.get("byteStride", item_bytes))
    start = int(view.get("byteOffset", 0)) + int(accessor.get("byteOffset", 0))
    raw = np.frombuffer(binary, dtype=np.uint8, count=stride * count, offset=start)
    if stride == item_bytes:
        array = raw.view(dtype).reshape(count, components)
    else:
        array = np.lib.stride_tricks.as_strided(
            raw,
            shape=(count, item_bytes),
            strides=(stride, 1),
        ).view(dtype).reshape(count, components)
    array = np.array(array, copy=True)
    if accessor.get("normalized"):
        info = np.iinfo(dtype) if np.issubdtype(dtype, np.integer) else None
        if info is not None:
            array = array.astype(np.float64) / info.max
            if np.issubdtype(dtype, np.signedinteger):
                array = np.maximum(array, -1.0)
    return array


def _node_matrix(node: dict) -> np.ndarray:
    if "matrix" in node:
        return np.asarray(node["matrix"], dtype=np.float64).reshape((4, 4), order="F")
    translation = np.asarray(node.get("translation", [0, 0, 0]), dtype=np.float64)
    rotation = np.asarray(node.get("rotation", [0, 0, 0, 1]), dtype=np.float64)
    scale = np.asarray(node.get("scale", [1, 1, 1]), dtype=np.float64)
    matrix = np.eye(4)
    matrix[:3, :3] = Rotation.from_quat(rotation).as_matrix() @ np.diag(scale)
    matrix[:3, 3] = translation
    return matrix


def custom_scene_meshes(path: Path):
    """Small uncompressed/quantized GLB reader for the Sprint 1 spike.

    Trimesh 5.1.1 fails on that file's buffer layout; this reader implements
    the subset needed for a QA render: one embedded buffer, POSITION/index
    accessors (including normalized integer positions), and node TRS/matrix
    transforms. It is not used for the Neuraxia-authored GLBs.
    """
    gltf, binary = _read_glb_json_and_bin(path)
    nodes = gltf.get("nodes", [])
    meshes = gltf.get("meshes", [])

    def walk(node_index: int, parent: np.ndarray):
        node = nodes[node_index]
        world = parent @ _node_matrix(node)
        if "mesh" in node:
            mesh_def = meshes[int(node["mesh"])]
            name = node.get("name") or mesh_def.get("name") or f"mesh-{node['mesh']}"
            for primitive in mesh_def.get("primitives", []):
                positions = _accessor_array(gltf, binary, int(primitive["attributes"]["POSITION"]))
                if "indices" in primitive:
                    faces = _accessor_array(gltf, binary, int(primitive["indices"])).reshape(-1, 3)
                else:
                    faces = np.arange(len(positions), dtype=np.int64).reshape(-1, 3)
                homogeneous = np.hstack([positions.astype(np.float64), np.ones((len(positions), 1))])
                transformed = (world @ homogeneous.T).T[:, :3]
                yield str(name), trimesh.Trimesh(
                    vertices=transformed,
                    faces=np.asarray(faces, dtype=np.int64),
                    process=False,
                )
        for child in node.get("children", []):
            yield from walk(int(child), world)

    roots: list[int] = []
    for scene in gltf.get("scenes", []):
        roots.extend(int(x) for x in scene.get("nodes", []))
    if not roots:
        roots = list(range(len(nodes)))
    for root in roots:
        yield from walk(root, np.eye(4))


def scene_meshes(path: Path):
    try:
        scene = trimesh.load(path, force="scene")
    except Exception:
        yield from custom_scene_meshes(path)
        return
    if isinstance(scene, trimesh.Trimesh):
        yield path.stem, scene
        return
    for node_name in scene.graph.nodes_geometry:
        transform, geometry_name = scene.graph[node_name]
        mesh = scene.geometry[geometry_name].copy()
        mesh.apply_transform(transform)
        # GLTFLoader/node names are not always the same string trimesh uses as
        # a geometry key; graph base_frame metadata is inconsistent across
        # exporters. In our two Sprint files the geometry key is the node name.
        yield str(geometry_name), mesh


def collect(path: Path, category_by_name: dict[str, str], allowed: dict[str, bool] | None = None):
    vertices_list: list[np.ndarray] = []
    faces_list: list[np.ndarray] = []
    colors_list: list[np.ndarray] = []
    offset = 0
    counts: dict[str, int] = {}
    for name, mesh in scene_meshes(path):
        category = category_by_name.get(name)
        if category is None:
            continue
        if allowed is not None and not allowed.get(name, False):
            continue
        if len(mesh.vertices) == 0 or len(mesh.faces) == 0:
            continue
        vertices_list.append(np.asarray(mesh.vertices))
        faces_list.append(np.asarray(mesh.faces) + offset)
        colors_list.append(np.tile(np.array([COLORS.get(category, (1, 1, 1, 0.5))]), (len(mesh.faces), 1)))
        offset += len(mesh.vertices)
        counts[category] = counts.get(category, 0) + 1
    if not vertices_list:
        raise RuntimeError(f"No meshes collected from {path}")
    return np.vstack(vertices_list), np.vstack(faces_list), np.vstack(colors_list), counts


def draw_panel(ax, vertices, faces, colors, horiz: int, vert: int, depth: int, title: str, sample: int = 90000):
    tris = vertices[faces]
    depth_values = tris[:, :, depth].mean(axis=1)
    order = np.argsort(depth_values)
    if len(order) > sample:
        chosen = np.linspace(0, len(order) - 1, sample).astype(int)
        order = order[chosen]
    polys = tris[order][:, :, [horiz, vert]]
    pc = PolyCollection(polys, closed=True, facecolors=colors[order], edgecolors="none", linewidths=0)
    ax.add_collection(pc)
    lo = vertices.min(axis=0)
    hi = vertices.max(axis=0)
    pad_x = max((hi[horiz] - lo[horiz]) * 0.04, 1e-6)
    pad_y = max((hi[vert] - lo[vert]) * 0.04, 1e-6)
    ax.set_xlim(lo[horiz] - pad_x, hi[horiz] + pad_x)
    ax.set_ylim(lo[vert] - pad_y, hi[vert] + pad_y)
    ax.set_aspect("equal", adjustable="box")
    ax.set_facecolor("#070708")
    ax.set_title(title, color="#f4efe8", fontsize=10)
    ax.tick_params(colors="#8f8882", labelsize=6)
    for spine in ax.spines.values():
        spine.set_color("#3b2c26")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--bp3d",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/output/neuraxia-bp3d-cns-desktop.glb"),
    )
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
        "--out-dir",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/reports"),
    )
    args = ap.parse_args()

    concepts = json.loads(args.concepts.read_text(encoding="utf-8"))["concepts"]
    bp_category = {c["display_name"]: c["category"] for c in concepts}
    bp_allowed = {c["display_name"]: bool(c["default_visible"]) for c in concepts}
    bp_vertices, bp_faces, bp_colors, bp_counts = collect(args.bp3d, bp_category, bp_allowed)

    spike_category: dict[str, str] = {}
    spike_allowed: dict[str, bool] = {}
    for name, _mesh in scene_meshes(args.spike):
        category = classify_spike(name)
        spike_category[name] = category
        spike_allowed[name] = category in DEFAULT_SPIKE
    spike_vertices, spike_faces, spike_colors, spike_counts = collect(
        args.spike, spike_category, spike_allowed
    )

    args.out_dir.mkdir(parents=True, exist_ok=True)

    fig, axes = plt.subplots(2, 3, figsize=(16, 10), facecolor="#070708")
    datasets = [
        ("BodyParts3D Sprint 1B candidate — default visible", bp_vertices, bp_faces, bp_colors),
        ("Z-Anatomy-derived Sprint 1 spike — app default categories", spike_vertices, spike_faces, spike_colors),
    ]
    views = [
        (0, 1, 2, "Coronal projection (X–Y)"),
        (2, 1, 0, "Sagittal projection (Z–Y)"),
        (0, 2, 1, "Axial projection (X–Z)"),
    ]
    for row, (label, vertices, faces, colors) in enumerate(datasets):
        for col, (h, v, d, view) in enumerate(views):
            draw_panel(axes[row, col], vertices, faces, colors, h, v, d, f"{label}\n{view}")
    fig.suptitle("NEURAXIA Sprint 1B — dataset orientation and category contact sheet", color="#f4efe8", fontsize=16)
    fig.tight_layout(rect=(0, 0, 1, 0.96))
    comparison_png = args.out_dir / "dataset-side-by-side-contact-sheet.png"
    fig.savefig(comparison_png, dpi=170, facecolor=fig.get_facecolor())
    plt.close(fig)

    # BodyParts3D category layers. Re-collect without the default_visible gate
    # for the layer sheet, then mask faces by category colour blocks from a
    # second collection per category for clarity.
    fig, axes = plt.subplots(2, 4, figsize=(18, 9), facecolor="#070708")
    layer_defs = [
        ("All default visible", None),
        ("Cortex", {"cortex"}),
        ("Deep nuclei + context", {"deep", "context"}),
        ("White matter", {"white"}),
        ("Ventricles / CSF", {"ventricles"}),
        ("Brainstem · cerebellum · cord", {"axis"}),
        ("Cranial nerves", {"cranial"}),
        ("Meninges (default visible only)", {"meninges"}),
    ]
    # Build per-category face masks in the same order collect() encountered.
    # Instead of reconstructing masks, use separate collections.
    for ax, (label, keep_categories) in zip(axes.ravel(), layer_defs):
        if keep_categories is None:
            draw_panel(ax, bp_vertices, bp_faces, bp_colors, 0, 1, 2, label)
        else:
            allowed = {
                c["display_name"]: bool(c["default_visible"]) and c["category"] in keep_categories
                for c in concepts
            }
            try:
                vertices, faces, colors, _ = collect(args.bp3d, bp_category, allowed)
                draw_panel(ax, vertices, faces, colors, 0, 1, 2, label)
            except RuntimeError:
                ax.set_facecolor("#070708")
                ax.set_title(label + "\n(no default-visible meshes)", color="#f4efe8")
    fig.suptitle("BodyParts3D candidate — coronal category layers", color="#f4efe8", fontsize=16)
    fig.tight_layout(rect=(0, 0, 1, 0.95))
    layers_png = args.out_dir / "bp3d-category-layers-contact-sheet.png"
    fig.savefig(layers_png, dpi=170, facecolor=fig.get_facecolor())
    plt.close(fig)

    metadata = {
        "comparison_png": str(comparison_png),
        "layers_png": str(layers_png),
        "bp3d_default_visible_mesh_counts_by_category": bp_counts,
        "bp3d_vertices": int(len(bp_vertices)),
        "bp3d_triangles": int(len(bp_faces)),
        "spike_default_mesh_counts_by_category": spike_counts,
        "spike_vertices": int(len(spike_vertices)),
        "spike_triangles": int(len(spike_faces)),
    }
    (args.out_dir / "render-contact-sheet-metadata.json").write_text(
        json.dumps(metadata, indent=2, sort_keys=True), encoding="utf-8"
    )
    print(json.dumps(metadata, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
