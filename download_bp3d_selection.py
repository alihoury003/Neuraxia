#!/usr/bin/env python3
"""Acquire an explicit FJ selection for the Neuraxia BodyParts3D pipeline.

Existing Sprint 1 OBJ files are reused when present. Missing meshes are
requested in small batches from the Anatomography endpoint through the already
audited MIT-licensed 4.3 downloader code in `research/bp3d-tools`.
Raw OBJ files should normally be directed to /tmp or another scratch area;
the reproducible selection and output GLBs are the preserved artifacts.
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import logging
import shutil
import zipfile
from pathlib import Path
from types import ModuleType


def load_downloader(path: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location("bp3d_download_43", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Cannot load downloader: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fj_from_filename(path: Path) -> str:
    return path.name.split("_", 1)[0]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--fj-list",
        type=Path,
        default=Path("/home/user/neuraxia/research/sprint-1b/curation/bp3d-cns-download-list.txt"),
    )
    ap.add_argument(
        "--manifest",
        type=Path,
        default=Path("/home/user/neuraxia/research/bp3d-tools/MANIFEST.csv"),
    )
    ap.add_argument(
        "--downloader",
        type=Path,
        default=Path("/home/user/neuraxia/research/bp3d-tools/download_bodyparts3d_4.3.py"),
    )
    ap.add_argument(
        "--local-root",
        type=Path,
        default=Path("/home/user/neuraxia/research/models-spike/bp3d-brain-cord"),
    )
    ap.add_argument("--out", type=Path, default=Path("/tmp/neuraxia-sprint1b/raw-obj"))
    ap.add_argument("--chunk-size", type=int, default=40)
    args = ap.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    logger = logging.getLogger("neuraxia_download")

    wanted = [
        line.strip()
        for line in args.fj_list.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    manifest = {
        row["fj_id"]: row
        for row in csv.DictReader(args.manifest.open(newline="", encoding="utf-8"))
    }
    unknown = [fj for fj in wanted if fj not in manifest]
    if unknown:
        raise SystemExit(f"FJ ids missing from manifest: {unknown}")

    args.out.mkdir(parents=True, exist_ok=True)
    chunk_dir = args.out.parent / "_download_chunks"
    chunk_dir.mkdir(parents=True, exist_ok=True)

    sources: dict[str, tuple[Path, str]] = {}

    # Reuse Sprint 1 downloads. These are byte-identical endpoint objects for
    # the same FJ IDs and avoid unnecessary traffic.
    local_index: dict[str, Path] = {}
    if args.local_root.exists():
        for path in args.local_root.rglob("*.obj"):
            local_index.setdefault(fj_from_filename(path), path)
    for fj in wanted:
        src = local_index.get(fj)
        if src is None:
            continue
        dst = args.out / src.name
        if not dst.exists():
            shutil.copy2(src, dst)
        sources[fj] = (dst, "reused_sprint1_local")

    missing = [fj for fj in wanted if fj not in sources]
    logger.info("Wanted %d FJ; reused %d; downloading %d", len(wanted), len(sources), len(missing))

    if missing:
        dl = load_downloader(args.downloader)
        cookies = args.out.parent / "_session_cookies.txt"
        dl.get_session(cookies)
        for start in range(0, len(missing), args.chunk_size):
            batch = missing[start : start + args.chunk_size]
            batch_number = start // args.chunk_size
            zpath = chunk_dir / f"chunk_{batch_number:03d}.zip"
            if not dl._zip_ok(zpath):
                bp_ids = sorted({manifest[fj]["bp_id"] for fj in batch})
                logger.info("Downloading chunk %d: %d FJ", batch_number, len(batch))
                dl.download_zip(batch, bp_ids, zpath, cookies)
                if not dl._zip_ok(zpath):
                    raise SystemExit(f"Downloaded chunk is not a valid zip: {zpath}")
            with zipfile.ZipFile(zpath) as zf:
                for member in zf.namelist():
                    if not member.lower().endswith(".obj"):
                        continue
                    name = Path(member).name
                    fj = fj_from_filename(Path(name))
                    if fj not in batch or fj in sources:
                        continue
                    dst = args.out / name
                    if not dst.exists():
                        dst.write_bytes(zf.read(member))
                    sources[fj] = (dst, "downloaded_anatomography_4.3")

    still_missing = [fj for fj in wanted if fj not in sources]
    manifest_path = args.out.parent / "download-manifest.csv"
    with manifest_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["fj_id", "source_name", "obj_path", "acquisition", "bytes"],
        )
        writer.writeheader()
        for fj in wanted:
            path, acquisition = sources.get(fj, (Path(""), "missing"))
            writer.writerow(
                {
                    "fj_id": fj,
                    "source_name": manifest[fj]["name"],
                    "obj_path": str(path),
                    "acquisition": acquisition,
                    "bytes": path.stat().st_size if str(path) and path.exists() else 0,
                }
            )

    logger.info("Wrote %s", manifest_path)
    if still_missing:
        logger.error("Missing %d FJ: %s", len(still_missing), still_missing)
        return 1
    logger.info("All %d selected OBJ files acquired in %s", len(wanted), args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
