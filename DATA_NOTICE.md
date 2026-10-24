# Neuraxia — data & licence notice

Neuraxia's **code** is MIT-licensed (see `LICENSE`). The **anatomical data** is not ours to relicense and carries its own terms. Inventory:

| Asset | Source | Terms / status |
|---|---|---|
| `research/sprint-1b/output/*.glb` (182-concept candidate) | Adapted from **BodyParts3D/Anatomography 4.3** (DBCLS), 202 FJ components listed in `research/sprint-1b/curation/bp3d-cns-included-fj.txt` | DBCLS's current page states **CC BY 4.0** with attribution “BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International”, but legacy materials say **CC BY-SA 2.1 Japan**. **Written clarification requested (draft in `research/compliance/`); until resolved, treat these GLBs as internal-review only — do not redistribute publicly or commercially.** Full analysis: `research/sprint-1b/reports/licence-provenance-review.md`. |
| `app/public/models/nervous.glb` (Sprint 1 spike) | Body Atlas export derived from **Z-Anatomy** | Z-Anatomy states CC BY-SA 4.0, but object-level provenance for brain/white-matter parts is unproven and some upstream parts are non-commercial. **Feasibility/comparison only; no geometry from this file ships in the Sprint 1B candidate.** |
| FIRE pathway curves in `app/src/pathways.js` | Original to Neuraxia | Authored schematic segments on BP3D geometry; stations without source meshes are labelled schematic in-app. No tractography atlas data is embedded. |
| Structure dossiers in `app/src/dossiers.js` | Original to Neuraxia | Draft teaching text, **expert review pending** — not medical advice. |

If you fork this repository, you inherit these constraints. When in doubt, keep the GLBs private and ask DBCLS.
