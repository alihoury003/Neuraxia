# Workspace cleanup — 2026-10-24 (176 MB → 39 MB)

Removed (all regenerable or duplicated elsewhere):

| Removed | Why safe | Regenerate via |
|---|---|---|
| `neuraxia-GITHUB.zip`, `neuraxia-website-ready.zip`, `neuraxia-ONE-FILE.zip`, `neuraxia-one-file/` | Obsolete snapshots; source of truth is `neuraxia/` + the GitHub repo | `git archive` / `pipeline/build_single_file.py` |
| `research/models-spike/` (55 MB Sprint 1 raw OBJs + download chunks) | Feasibility inputs only; the app's spike dataset is `app/public/models/nervous.glb` | `research/bp3d-tools/` downloader |
| `research/body-atlas/nervous.glb` | Byte-identical duplicate (sha256 `211c5a4a…`) of `app/public/models/nervous.glb` | — |
| `research/sprint-1b/output/*.glb` (non-Meshopt, 11 MB) | Pipeline intermediates; served canonical files are the `.meshopt.glb` pair (kept) | `pipeline/convert_obj_to_glb.py` then `gltf-transform meshopt` |
| `research/sprint-1b/metadata/obj2FMA.html` (4.4 MB) | HTML dump; no code references it; text metadata kept | re-fetch from DBCLS archive |
| `brand-icons/**` except `round2/neuraxia-3.png` (22 MB) | Identity explorations superseded by locked Design III; production copy in `brand/` | — |
| QA screenshots in `research/sprint-1e/`, `research/sprint-2/` downscaled to ≤1100 px wide | Still readable evidence | re-run headless suites |

Kept deliberately: all source code, curation + manifests, Meshopt GLBs + provenance sidecars, reports, sprint notes, locked brand source (`brand/neuraxia-mark-design-iii-source.png` + `brand-icons/round2/neuraxia-3.png`), user uploads.
