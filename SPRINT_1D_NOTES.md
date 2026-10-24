# NEURAXIA Sprint 1D — FIRE brain circuits + GitHub readiness

**Date:** 24 October 2026
**Context:** the workspace live-preview does not work for the founder, so verification is automated (geometry regression test, builds) + QA renders, and **GitHub Pages** becomes the delivery channel at the next milestone.

## FIRE: all six V1 pathways are now graphs

Multi-curve support added to the pathway engine (`extraCurves`): secondary fibre populations render alongside the main curve with shared timing/fade.

- **Vision (chiasm sort):** main curve = left temporal-retina fibres (un-crossed); extra curve = right nasal-retina fibres crossing at the ◆ chiasm into the left tract; second extra = Meyer temporal loop to lingual gyrus while the main curve takes the parietal (Baumgarten) loop to a cuneus/lingual calcarine target zone. Test asserts side logic and Meyer-loop anterior/inferior dip.
- **Pupillary light reflex:** CN II → tract → brachium of superior colliculus → ○ pretectal station → ◆ bilateral fork — main curve continues to left EW/CN III/pupil terminus, extra curve crosses via posterior commissure to the right side (consensual). Test asserts both termini land on opposite sides from a shared pretectal point.
- **Stretch reflex:** schematic arc on the cord frame at t=0.8 (far-lateral stand-in points for muscle/periphery, honest captions), ○ single ventral-horn synapse, auto camera-focus on ignite. Test asserts out-of-cord → in-cord synapse → out-of-cord geometry.

QA renders: `fire-brain-circuits-qa.png`, `fire-reflex-qa.png` (renderer `pipeline/render_fire_qa.py`).

## Fixes to Sprint 1C wiring found by audit

A file audit found several late 1C edits had not persisted (markers created per-entry but animated per-station, `resolvePathCurve` unused at the call site, missing ghost/preset listeners, radial-only explode, legacy awaken/search handlers). All re-applied and grep-verified this sprint; the geometry test + build now exercise the real code paths.

## Dossiers: complete coverage

33 more families written (Hypothalamic/preoptic nuclei, orbital/frontal/temporal gyri, trigeminal divisions, commissures, brachia, lamina terminalis…). Coverage is now **104/104 BP3D concept families** — every selectable structure shows function, clinical pearl and pathway role, all still badged draft pending expert review.

## Performance without a preview

- **Adaptive quality (default `?quality=auto`):** if FPS < 38 across three consecutive 600 ms windows, pixel ratio steps down by 0.35 (floor 1.0) with an explanatory caption; `?quality=high` locks full resolution. Resize no longer resets the adapted ratio.
- This protects frame rate on unknown hardware until real-device numbers come back from the Pages build.

## GitHub readiness (done, not yet pushed)

- `git init` + initial commit (88 files, ~41 MB; raw OBJ spike excluded via `.gitignore`).
- `LICENSE` (MIT, code only) + `DATA_NOTICE.md` (dataset terms inventory; GLBs internal-only pending DBCLS clarification).
- `.github/workflows/pages.yml`: geometry regression test → build with `/<repo>/` base → deploy. Base support verified locally (`VITE_BASE=/neuraxia/` build rewrites assets, brand files and model URLs correctly).
- `GITHUB_DEPLOY.md`: 5-minute push checklist, identity/amend instructions, Pages switch, and the **private-first** recommendation until licence + anatomy gates clear.
- DBCLS clarification email drafted and ready to send: `research/compliance/DBCLS_licence_clarification_email.md` (attach the 202-FJ list).

## Verification

- `node scripts/test-fire-geometry.mjs` — all six FIRE pathways pass side-logic/finiteness checks (also wired into CI).
- `npm run build` (default + Pages base) passes; `dist/models/` carries all three GLBs via the Vite plugin.

## Next milestone (the push)

1. Founder creates the GitHub repo and pushes (private first), enables Pages.
2. Send DBCLS email; recruit faculty reviewer with the dossier pack.
3. First real-device FPS numbers from the Pages site → tune auto-quality thresholds.
4. Sprint 2 DISSECT proper: dossier references field, structure-to-pathway cross-links (“ignite from any structure”), curated camera tours.
