# Sprint 2A — DISSECT proper (first tools)

Date: 2026-10-24
Status: implemented and browser-tested on the one-file build; real-device confirmation owed.

## Delivered

### Selected-structure actions (Details sheet / card)
- **Focus** — camera to the structure.
- **Solo** — isolate toggle (drives the existing isolate mode).
- **Ghost others** — everything else drops to x-ray opacity; selected stays solid.
- **Ghost this / Make solid** — per-structure ghost set.
- **Hide / Show** — per-structure hidden set; hidden wins over isolate/categories. Explicitly selecting a structure (search/tap) un-hides it.
- **Pulse here** — local teaching flare (burst), honestly captioned as local — not an invented tract.
- **FIRE routes through this structure** — derived live from the FIRE graph definitions (entries + station entries); tapping one ignites that circuit. Structures with no graph route say so explicitly.
- **Restore hidden / ghosted** (Slice lab section) with a live count; clears hidden/ghosted/ghost-others/isolate.

Material state is centralised in `applyGhostMode()` (global ghost preset + per-structure ghost + ghost-others compose by minimum opacity).

### Slice lab (clipping planes)
- Sagittal / Axial / Coronal plane, position slider (−100…+100% of the CNS bounding box from centre), flip kept side, reset.
- World-space `THREE.Plane` on entry materials only (`localClippingEnabled`); FIRE lines/markers and the selection box are not clipped.
- Raycast selection respects the plane (clipped-away fragments can't be tapped).
- Anatomical note + caption state which side is kept (subject-left = +X, superior = +Y, anterior = +Z). A subtle PlaneHelper shows the cut.
- Axis/flip buttons auto-enable the slice.

### Guided tours
Three narrated routes ("First incision", "Deep relay empire", "Crossing stories") with a tour player card (progress, dots, Back/Next/Exit, Esc to exit). Steps compose existing systems only: layer presets, selection+focus (without forcing the Details sheet open), camera views, explode, Slice lab, and timed FIRE ignitions. Starting a tour restores structure modes and clears any slice; finishing restores the overview.

## Verification (headless Chromium + SwiftShader, final one-file bytes)
- Sprint 2A suite: all checks passed — actions render; related FIRE for thalamus = spinothalamic; Solo → 1 visible mesh; Hide → 170/171 + restore count; slice enable/position/note; full "First incision" run incl. midline slice step (corpus callosum) and clean finish; "Deep relay empire" thalamus → Hypothalamus; "Crossing stories" ignites DCML; desktop axial auto-enable.
- Sprint 1E responsive suite: all pass. FIRE geometry regression: pass. No page errors / failed requests.
- QA screenshots in this folder (`s2-*.png`).

## Honest limits / next
- Slice plane is anchored to the assembled model's bounding box; combining slice with heavy disassembly is visually interesting but not anatomically registered.
- "Pulse here" is a local flare; arbitrary-structure tract tracing waits for registered tractography (FIRE-1) — no invented routes.
- Tours assume the BP3D dataset (default / one-file); on the comparison spike some steps degrade to narration + camera moves.
- Still owed: real iPhone/iPad pass, DBCLS licence clarification, expert anatomy sign-off. Suggested Sprint 2B: labels/leader lines + neighbour mode, then ENTER journeys polish.
