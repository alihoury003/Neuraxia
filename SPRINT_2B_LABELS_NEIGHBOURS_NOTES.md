# Sprint 2B — Floating labels + neighbour mode (2026-10-24)

## Built

**Floating labels with leader lines** (Controls → "Floating labels · landmarks", off by default)
- 25 curated landmark rules resolved by name at model prep (thalami, cortex M1/S1, corpus callosum, deep nuclei, ventricles, brainstem, cord, cauda equina…).
- 2D-projected HTML pills + SVG leader lines, updated every 2nd frame. Four placement candidates per label (above/right/left/below); collisions resolved against already-placed labels **and UI panels** (brand bar, controls, details, caption, tour card, bottom nav, touch hint). Viewport margins keep labels out of the bottom nav / tour card zones.
- Label budget: 8 (≤700 px), 12 (≤1100 px), 16 (desktop); neighbour mode 7/9. Deep/white-matter labels only appear when their territory is actually revealed (ghost x-ray, deep preset via ghost, ghost-others, isolate, slice on, or during a tour) — no floating names over structures you can't see. The selected structure is always labelled when labels are on, and tour stops auto-label even with the toggle off.

**Neighbour mode** (Details → structure actions → "Neighbours" toggle)
- Computes up to 8 neighbours live: first FIRE-graph adjacency (previous/next stations in authored pathways, labelled "FIRE · <pathway>"), then spatial neighbours by **mesh bounding-box gap** over currently-visible entries ("adjacent" or "~N mm away" on the BP3D metre scale).
- Neighbours glow copper, float as neighbour labels, and list as tappable chips in Details (tap → selection moves and neighbours recompute). Explicitly captioned as a teaching approximation computed from bounding boxes — **not** a reviewed surgical adjacency atlas.
- Restore / deselect clears the mode; tours reset it via `restoreStructureModes`.

**Workspace cleanup (same turn):** 176 MB → 39 MB. See `research/WORKSPACE_CLEANUP_2026-10-24.md`. Nothing canonical removed; all deletions regenerable or duplicated. Build artefacts (`neuraxia-ONE-FILE.zip`, `neuraxia-one-file/`) are intentionally **not** left in the workspace — rebuild with `pipeline/build_single_file.py` at the milestone.

## Verification (headless Chromium, served one-file build)
- **Sprint 2B suite: ALL CHECKS PASSED** — desktop: ≥5 landmark labels, zero overlaps, deep labels in deep/x-ray, 8 neighbour chips for Left thalamus with labelled relations (Pons + postcentral via FIRE spinothalamic; fornix, stria terminalis… spatial), neighbour labels float, chip tap moves selection to Pons. Phone: 5 labels within budget, none under the bottom nav, neighbour chips in Details, neighbour labels in Explore.
- **Sprint 2A regression spot-suite: ALL PASSED** (slice enable, tour start, tour reaches corpus-callosum slice step 5/6, solo isolates visible count to 1).
- **FIRE geometry test: exit 0.**
- Screenshots: `s2b-desktop-labels.png`, `s2b-desktop-neighbours.png`, `s2b-phone-labels.png`, `s2b-phone-neighbours.png` (this folder).

## Limits / honesty notes
- Bounding-box adjacency overestimates "touching" for interleaved gyri — sorted by gap then centre distance; fine for orientation teaching, not operative planning.
- Label anchors use bounding-box centres; very curved structures (fornix, cauda equina) anchor mid-arc, not on the surface.
- Desktop: the live caption can overlap the tall details column on short viewports (pre-existing; candidate for the Sprint 5 polish pass).

## Upload state
Sprint 2A + 2B are **not yet uploaded** anywhere. Per owner's instruction, the next milestone ships **one** ZIP containing everything not yet uploaded (starting with Sprint 2A): current `neuraxia/` source + a freshly built one-file `index.html` for the flat GitHub upload path.
