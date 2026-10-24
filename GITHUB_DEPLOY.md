# Publishing Neuraxia on GitHub — milestone checklist

The repo is already initialised locally with an initial commit. Publishing takes ~5 minutes:

## 1. Set your identity (once)
```bash
cd neuraxia
git config user.name "Your Name"
git config user.email "you@example.com"
# claim the workspace-made initial commit as yours:
git commit --amend --reset-author --no-edit
```

## 2. Create the repo & push
Create an **empty** repository on GitHub (e.g. `neuraxia`) — do not add a README/license there — then:
```bash
git remote add origin https://github.com/<you>/neuraxia.git
git branch -M main
git push -u origin main
```

## 3. Turn on GitHub Pages
Repo → **Settings → Pages → Source: “GitHub Actions”**.
The workflow in `.github/workflows/pages.yml` will test (FIRE geometry regression), build with the correct `/<repo>/` base, and deploy `app/dist`.
Your site: `https://<you>.github.io/neuraxia/`

Notes:
- If you name the repo `<you>.github.io`, edit `VITE_BASE` in the workflow to `/`.
- Every later `git push` to `main` redeploys automatically.
- `?dataset=spike`, `?profile=mobile`, `?quality=high` query switches all work on Pages.

## ⚠️ Before making the repo PUBLIC — licence gate
The adapted BodyParts3D GLBs are **internal-only** until DBCLS answers the licence clarification (draft ready in `research/compliance/DBCLS_licence_clarification_email.md`) and an expert reviews the anatomy. Recommended order:

1. Push to a **private** repo first; enable Pages (private-repo Pages needs GitHub Pro/Team, or keep Pages off until public).
2. Send the DBCLS email; get faculty review.
3. Flip the repo public → Pages goes live for free.

See `DATA_NOTICE.md` for the full data-licence inventory.
