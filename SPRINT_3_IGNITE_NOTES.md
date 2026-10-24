# Sprint 3 — IGNITE proper: pathway timeline engine (2026-10-24)

## Built

**IGNITE console** — a floating timeline deck that appears whenever a pathway is ignited (desktop bottom-centre; phone above the bottom nav in Explore, with the live caption lifting above it):

- **Transport:** play/pause, restart, previous/next **station** stepper, speed cycle 0.5×/1×/2×/4×, and a 0–1000 **scrubber** that seeks every active pathway proportionally (race stays in sync). End state now *holds* (lines + lit stations persist for study) instead of self-disposing; ✕ clears the ignition.
- **Station chips:** every station is a tappable chip (◎ origin · ● station · ○ synapse · ◆ decussation · ⬢ target) that lights as the pulse passes, highlights the current stop, and seeks on tap (with burst + caption). Race shows two labelled rows (DCML 7 + STT 6). The pathway-info station list in the FIRE panel is clickable the same way.
- **Step by synapse:** playback auto-pauses exactly at each synapse/decussation/target so the caption can be read; play releases to the next event.
- **Neuron orders:** vertex-coloured line bands per inter-synapse segment (1° cyan · 2° peach · 3° violet · 4° green) with a legend. Band boundaries are computed in true curve-parameter space (`getUtoTmapping`), so colours change at the synapse stations, not at arc-length approximations.
- **Follow signal:** camera target glides with the pulse head (camera translated by the same delta); any manual orbit input disengages it.
- **✕ Lesion probe:** with the mode armed, tapping a station chip interrupts the pathway there — the pulse clamps at that station, downstream line/markers/chips go dark grey, and a teaching card shows a per-pathway lesion story (6 new `lesion` strings in `pathways.js`, e.g. DCML → sensory ataxia/Romberg; STT → dissociated loss starting 1–2 segments below; pupillary → RAPD vs blown pupil). Tap again to heal. All lesion text is flagged *draft — expert review pending*.
- **Loop** toggle for hands-free repetition.

**Bug fix (latent since Sprint 1C):** station markers were created per *sequence entry* but consumed per *station*, so on CST (6 entries/8 stations), DCML (5/7) and STT the final stations never rendered markers and never fired their captions (e.g. DCML's VPL synapse + cortical arrival). Markers are now per-station with proper kind styling (gold octahedra at decussations, bright synapses); verified by scrubbing DCML to 100% and asserting VPL + postcentral light up.

**Performance:** pathway curves are cached per animation and rebuilt only while the explode value is actually moving (previously `resolvePathCurve` + 160 spaced points ran per frame per pathway).

**Auto-ignition guard:** the on-load vision demo and the Awaken chain now carry sequence tokens — if the user ignites anything themselves, pending auto-ignitions abort instead of stomping the user's pathway/console.

## Verification (headless Chromium on the served one-file build)
- **Sprint 3 suite: ALL CHECKS PASSED** — console appears; DCML 7 chips; pause freezes scrubber (56→56); scrub 65% lights nucleus gracilis + decussation but not VPL; scrub 100% lights VPL + arrival (marker-fix proof); **step-by-synapse auto-paused at scrub exactly 500** (nucleus gracilis); speed 1×→2×; orders legend; lesion at VPL → note + downstream chip lesioned → **signal clamped at scrub exactly 880** and auto-paused; heal clears; station stepper forward/back; race = 2 rows/13 chips; close hides. Phone: console above nav (bottom 770 ≤ nav top 774), caption lifted clear (482 ≤ 493), ignition returns to Explore, CST 8 chips, pause + stepper work.
- **Regressions:** Sprint 2B suite all-pass, Sprint 2A spot-suite all-pass, FIRE geometry test exit 0.
- During testing, a desktop stacking fault was found and fixed: the selected-territory card overlapped the console's left buttons (Restart/Prev/Step unclickable). Console z-index raised above the panels.
- Screenshots: `s3-desktop-console.png`, `s3-desktop-orders.png`, `s3-desktop-lesion.png`, `s3-desktop-race.png`, `s3-phone-console.png` (this folder).

## Limits / honesty notes
- Neuron-order bands count synapse stations in the authored graph — correct for DCML/STT (1°/2°/3°), schematic for vision/pupillary/reflex.
- In race mode only the primary (first) pathway narrates captions; the second pathway's stations still burst and light their chips.
- Lesion darkening applies to the main curve; branch curves (Meyer loop, consensual arm) keep their tint.
- Console is hidden in short-landscape phones (≤500 px height) to preserve the view; rotate to portrait for transport controls.
- FIRE geometry remains the FIRE-0 authored graph (atlas-guided schematic segments); tractography (FIRE-1) is still gated on licence resolution.

## Upload state
This sprint completes the accumulation milestone: **Sprint 2A + 2B + Sprint 3 ship together** in `neuraxia-MILESTONE-sprint3.zip` (root `index.html` = the single-file build for the flat GitHub upload, plus the full `neuraxia-source/` snapshot). Awaiting the owner's GitHub upload; nothing is public-released (DBCLS licence clarification + expert anatomy sign-off still outstanding).
