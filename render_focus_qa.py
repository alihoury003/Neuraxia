#!/usr/bin/env python3
"""Focused visual QA for provisional Sprint 1B curation decisions.

Draws source OBJ geometry in anatomical context for the handful of decisions
that bounds/volume fingerprints alone cannot settle: superior-parietal
alternates, tentorium/dura, hemisphere-scale "temporal" white matter,
merged cerebral crura, vagus laterality, and stria terminalis fragments.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.collections import PolyCollection

sys.path.insert(0, str(Path(__file__).resolve().parent))
from convert_obj_to_glb import cleanup, parse_obj, remove_micro_fragments, weld  # noqa: E402


class ObjCache:
    def __init__(self, obj_dir: Path):
        self.obj_dir = obj_dir
        self.paths = {p.name.split("_", 1)[0]: p for p in obj_dir.glob("*.obj")}
        self.cache: dict[str, tuple[np.ndarray, np.ndarray]] = {}

    def get(self, fj: str, *, micro_filter: bool = False) -> tuple[np.ndarray, np.ndarray]:
        key = f"{fj}:{'filtered' if micro_filter else 'raw'}"
        if key in self.cache:
            return self.cache[key]
        path = self.paths[fj]
        vertices, faces = parse_obj(path)
        vertices, faces = weld(vertices, faces)
        vertices, faces = cleanup(vertices, faces)
        if micro_filter:
            vertices, faces, _, _ = remove_micro_fragments(vertices, faces)
        # Source mm (left, posterior, superior) -> display mm
        # (left, superior, anterior).
        display = np.empty_like(vertices, dtype=np.float64)
        display[:, 0] = vertices[:, 0]
        display[:, 1] = vertices[:, 2]
        display[:, 2] = -vertices[:, 1]
        self.cache[key] = (display, faces)
        return self.cache[key]

    def combined(self, fjs: list[str], *, micro_filter=False):
        vertices_list = []
        faces_list = []
        offset = 0
        for fj in fjs:
            vertices, faces = self.get(fj, micro_filter=micro_filter)
            vertices_list.append(vertices)
            faces_list.append(faces + offset)
            offset += len(vertices)
        return np.vstack(vertices_list), np.vstack(faces_list)


def sample_order(count: int, maximum: int) -> np.ndarray:
    if count <= maximum:
        return np.arange(count)
    return np.linspace(0, count - 1, maximum).astype(int)


def draw_layer(ax, vertices, faces, color, horiz, vert, depth, sample=25000):
    tris = vertices[faces]
    order = np.argsort(tris[:, :, depth].mean(axis=1))
    chosen = sample_order(len(order), sample)
    order = order[chosen]
    polys = tris[order][:, :, [horiz, vert]]
    rgba = np.tile(np.array([color], dtype=float), (len(order), 1))
    ax.add_collection(PolyCollection(polys, closed=True, facecolors=rgba, edgecolors="none", linewidths=0))


def layer_bounds(combined_layers):
    mins = []
    maxs = []
    for vertices, _faces in combined_layers:
        mins.append(vertices.min(axis=0))
        maxs.append(vertices.max(axis=0))
    lo = np.min(np.vstack(mins), axis=0)
    hi = np.max(np.vstack(maxs), axis=0)
    pad = np.maximum((hi - lo) * 0.08, 4)
    return lo - pad, hi + pad


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--obj-dir", type=Path, default=Path("/tmp/neuraxia-sprint1b/raw-obj"))
    ap.add_argument(
        "--concepts",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation/bp3d-cns-concepts.json"),
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/reports/focused-curation-qa-contact-sheet.png"),
    )
    args = ap.parse_args()

    concepts = json.loads(args.concepts.read_text(encoding="utf-8"))["concepts"]
    cache = ObjCache(args.obj_dir)

    cortex_fjs = [
        fj
        for concept in concepts
        if concept["category"] == "cortex"
        for fj in concept["source_fj_ids"]
    ]
    temporal_context_fjs = [
        fj
        for concept in concepts
        if concept["category"] == "cortex"
        and any(
            term in concept["display_name"].lower()
            for term in ("temporal", "fusiform", "parahippocampal")
        )
        for fj in concept["source_fj_ids"]
    ]

    pearl = (0.86, 0.82, 0.78, 0.10)
    copper = (0.93, 0.58, 0.38, 0.72)
    cyan = (0.10, 0.82, 0.92, 0.66)
    gold = (0.98, 0.80, 0.42, 0.66)
    violet = (0.72, 0.55, 0.95, 0.62)
    green = (0.45, 0.92, 0.62, 0.66)

    rows = [
        {
            "title": "Superior parietal lobule — included FJ7463/M (copper) vs broader excluded FJ1835/1836 (cyan), cortex context",
            "focus": [["FJ7463", "FJ7463M"], ["FJ1835", "FJ1836"]],
            "layers": [
                (cortex_fjs, pearl, 35000, False),
                (["FJ1835", "FJ1836"], cyan, 25000, False),
                (["FJ7463", "FJ7463M"], copper, 25000, False),
            ],
        },
        {
            "title": "Tentorium — included FJ3889 (copper), excluded FJ1843 (cyan) + FJ7446 (violet), cerebellum/falx context",
            "focus": [["FJ3889", "FJ1843", "FJ7446"]],
            "layers": [
                (["FJ1781", "FJ1830", "FJ7445"], pearl, 25000, False),
                (["FJ7446"], violet, 25000, False),
                (["FJ1843"], cyan, 25000, False),
                (["FJ3889"], copper, 25000, False),
            ],
        },
        {
            "title": "Source-labelled temporal-lobe white matter FJ1758/FJ1806 (cyan) vs temporal cortex (copper) and whole cortex",
            "focus": [["FJ1758", "FJ1806"]],
            "layers": [
                (cortex_fjs, pearl, 35000, False),
                (temporal_context_fjs, copper, 25000, False),
                (["FJ1758", "FJ1806"], cyan, 25000, False),
            ],
        },
        {
            "title": "Cerebral crus merge — FJ1770/FJ1817 (copper/cyan) with FJ7504/FJ7504M (gold/green), pons + internal capsule context",
            "focus": [["FJ1770", "FJ7504", "FJ1817", "FJ7504M"]],
            "layers": [
                (["FJ1775", "FJ1822", "FJ1750", "FJ1751"], pearl, 25000, False),
                (["FJ1770"], copper, 16000, False),
                (["FJ7504"], gold, 16000, False),
                (["FJ1817"], cyan, 16000, False),
                (["FJ7504M"], green, 16000, False),
            ],
        },
        {
            "title": "Vagus trunks — left FJ3926 (copper) vs right-labelled FJ4024 (cyan), medulla/cord context; x=0 is subject midline",
            "focus": [["FJ3926", "FJ4024"]],
            "layers": [
                (["FJ4426", "FJ1769", "FJ1831"], pearl, 25000, False),
                (["FJ3926"], copper, 25000, False),
                (["FJ4024"], cyan, 25000, False),
            ],
        },
        {
            "title": "Stria terminalis after micro-fragment filter — left FJ1778 (copper), right FJ1825 (cyan), thalamus/caudate context",
            "focus": [["FJ1778", "FJ1825"]],
            "layers": [
                (["FJ1782", "FJ1827", "FJ1754", "FJ1802"], pearl, 20000, False),
                (["FJ1778"], copper, 12000, True),
                (["FJ1825"], cyan, 12000, True),
            ],
        },
    ]

    views = [
        (0, 1, 2, "Coronal X–Y"),
        (2, 1, 0, "Sagittal Z–Y"),
        (0, 2, 1, "Axial X–Z"),
    ]

    fig, axes = plt.subplots(len(rows), 3, figsize=(19, 27), facecolor="#070708")
    for row_index, spec in enumerate(rows):
        prepared_layers = []
        for fjs, color, sample, micro_filter in spec["layers"]:
            vertices, faces = cache.combined(fjs, micro_filter=micro_filter)
            prepared_layers.append((vertices, faces, color, sample))
        focus_combined = [cache.combined(fjs) for fjs in spec["focus"]]
        lo, hi = layer_bounds(focus_combined)

        for col_index, (horiz, vert, depth, view_name) in enumerate(views):
            ax = axes[row_index, col_index]
            for vertices, faces, color, sample in prepared_layers:
                draw_layer(ax, vertices, faces, color, horiz, vert, depth, sample=sample)
            ax.set_xlim(lo[horiz], hi[horiz])
            ax.set_ylim(lo[vert], hi[vert])
            ax.set_aspect("equal", adjustable="box")
            ax.set_facecolor("#070708")
            ax.tick_params(colors="#8f8882", labelsize=6)
            for spine in ax.spines.values():
                spine.set_color("#3b2c26")
            if horiz == 0:
                ax.axvline(0, color="#f4efe8", linewidth=0.7, alpha=0.45)
            if vert == 0:
                ax.axhline(0, color="#f4efe8", linewidth=0.7, alpha=0.45)
            title = view_name if row_index else view_name
            ax.set_title(title, color="#cbb9a8", fontsize=9)
        axes[row_index, 0].set_ylabel(spec["title"], color="#f4efe8", fontsize=9, rotation=0, labelpad=145, va="center")

    fig.suptitle(
        "NEURAXIA Sprint 1B — focused curation QA in anatomical context\nCoordinates are source millimetres remapped to (left, superior, anterior); white line x=0 is the midline.",
        color="#f4efe8",
        fontsize=17,
    )
    fig.tight_layout(rect=(0.08, 0, 1, 0.965))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(args.out, dpi=150, facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"Wrote {args.out} ({args.out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
