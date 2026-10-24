# Sprint 1E — Phone & Tablet Shell

Date: 2026-10-24
Status: implemented and browser-tested; real-device Safari confirmation still owed.

## What changed

- Compact layouts now apply at **≤1100 px** instead of stacking the desktop panels.
- The selected-structure card and the full control panel became mutually exclusive sheets above a persistent bottom bar:
  - **Explore** — clean 3D view with live caption and a one-time touch hint.
  - **Details** — selected territory / dossier sheet.
  - **FIRE** — controls sheet auto-scrolled to the pathway graph section.
  - **Controls** — controls sheet from the top (dataset + search first).
- Tapping/searching a structure on compact layouts opens **Details** automatically.
- Igniting a pathway, Awaken, ventricular journey, and camera views return to **Explore** so the animation is visible.
- Sheets have close (×) buttons; only one sheet can be open at a time.
- iPhone/tablet details:
  - `viewport-fit=cover`, safe-area insets, `100dvh` shell.
  - Search input is 16 px (prevents iOS focus zoom); the controls sheet raises while searching and stays put until a result tap lands (delayed blur).
  - Minimum ~44 px touch targets; larger slider/checkbox hit areas.
  - Canvas uses `touch-action:none` for OrbitControls gestures; sheets keep native momentum scrolling with overscroll containment.
  - Short landscape phones hide caption/hint/tagline to preserve the 3D view.
- Camera framing now fits the CNS bounding box to the current aspect ratio (`fittedDistance`) for initial/reset/front/side/top views.
- Model profile heuristic widened: phones and coarse-pointer tablets ≤1100 px use the lighter mobile Meshopt GLB.
- Adaptive resolution restored: in `quality=auto`, sustained <28 FPS lowers pixel ratio in 0.25 steps (floor 1.0).

## Verification (headless Chromium + SwiftShader, one-file build)

Viewports: 390×844 phone, 820×1180 tablet portrait, 1024×768 tablet landscape, 844×390 phone landscape, 1440×900 desktop.

All checks passed: clean Explore start, sheet exclusivity/positioning, FIRE section alignment, ignite→Explore, search→Details, tablet sheet anchoring, landscape chrome reduction, desktop regression (no mobile nav, side panels intact). No page errors or failed requests. `app/scripts/test-fire-geometry.mjs` still passes.

QA screenshots in this folder (`resp-*.png`).

## Not changed / still owed

- Anatomy asset, dossiers and FIRE graphs unchanged; DBCLS licence clarification and expert anatomy sign-off remain release gates.
- Real iPhone/iPad Safari pass (gestures, keyboard, FPS) to be confirmed on device.
