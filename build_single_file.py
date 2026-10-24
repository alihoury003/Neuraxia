#!/usr/bin/env python3
"""Assemble the Neuraxia ONE-FILE edition: a single self-contained index.html.

Why: GitHub web uploads from some devices flatten/drop folders. A single
file removes every folder/path failure mode — upload one index.html to a
repo root and GitHub Pages (branch deploy) just works.

Input : app/dist/ built with VITE_BASE='./' (relative asset refs)
Output: /home/user/neuraxia-one-file/index.html
        /home/user/neuraxia-ONE-FILE.zip  (index.html + READ-ME-FIRST.txt)

Embedded: compiled JS + CSS inline, brand mark (downscaled JPEG data URI),
and the two BodyParts3D Meshopt GLBs as base64 in window.__EMBEDDED_MODELS__
(consumed by the embedded-model path in app/src/main.js). The Sprint 1
spike GLB is intentionally omitted (comparison-only; keeps the file lean).
"""

import base64
import hashlib
import io
import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, '/tmp/neuraxia-pydeps')
from PIL import Image

ROOT = Path('/home/user/neuraxia')
DIST = ROOT / 'app' / 'dist'
OUT_DIR = Path('/home/user/neuraxia-one-file')
OUT_DIR.mkdir(exist_ok=True)

html = (DIST / 'index.html').read_text(encoding='utf-8')

# --- inline CSS ------------------------------------------------------------
m = re.search(r'<link rel="stylesheet"[^>]*href="\./assets/([^"]+\.css)"[^>]*>', html)
assert m, 'CSS asset not found in dist/index.html'
css = (DIST / 'assets' / m.group(1)).read_text(encoding='utf-8')
html = html.replace(m.group(0), f'<style>\n{css}\n</style>')

# --- inline JS -------------------------------------------------------------
m = re.search(r'<script type="module"[^>]*src="\./assets/([^"]+\.js)"[^>]*></script>', html)
assert m, 'JS asset not found in dist/index.html'
js = (DIST / 'assets' / m.group(1)).read_text(encoding='utf-8')
js_safe = js.replace('</script', '<\\/script')
module_tag = m.group(0)

# --- brand mark → compact data URI -----------------------------------------
img = Image.open(DIST / 'brand' / 'neuraxia-mark.png').convert('RGB')
img.thumbnail((512, 512), Image.LANCZOS)
buf = io.BytesIO()
img.save(buf, 'JPEG', quality=86)
brand_uri = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
# Longest-first: Vite rebases the CSS reference to ../brand/... (CSS lives in
# assets/); a naive ./brand replace leaves a stray '.' → url(.data:...) 414s.
for variant in ('../brand/neuraxia-mark.png', './brand/neuraxia-mark.png',
                '/brand/neuraxia-mark.png', 'brand/neuraxia-mark.png'):
    html = html.replace(variant, brand_uri)
assert 'neuraxia-mark.png' not in html, 'brand path still present'
assert 'url(.' not in html.replace('url(data:', ''), 'dangling CSS url(.'

# --- models → base64 ---------------------------------------------------------
models = {}
for key, fname in (('bp3d-desktop', 'neuraxia-bp3d-cns-desktop.meshopt.glb'),
                   ('bp3d-mobile', 'neuraxia-bp3d-cns-mobile.meshopt.glb')):
    raw = (DIST / 'models' / fname).read_bytes()
    models[key] = (base64.b64encode(raw).decode(), hashlib.sha256(raw).hexdigest())

embedded_js = 'window.__EMBEDDED_MODELS__={' + ','.join(
    f'"{k}":"{v[0]}"' for k, v in models.items()) + '};'
replacement = f'<script>{embedded_js}</script>\n<script type="module">\n{js_safe}\n</script>'
html = html.replace(module_tag, replacement)

# --- assertions --------------------------------------------------------------
for forbidden in ('./assets/', './brand/', './models/', 'src="/', 'href="/'):
    assert forbidden not in html, f'external ref remains: {forbidden}'
for key, (b64, sha) in models.items():
    assert hashlib.sha256(base64.b64decode(b64)).hexdigest() == sha, f'hash mismatch {key}'
assert 'window.__EMBEDDED_MODELS__' in html

out_html = OUT_DIR / 'index.html'
out_html.write_text(html, encoding='utf-8')
size = out_html.stat().st_size
print(f'single-file index.html: {size:,} bytes ({size/1e6:.2f} MB)')
for k, (_, sha) in models.items():
    print(f'  embedded {k}: sha256 {sha[:16]}… ✓')

readme = """NEURAXIA — ONE-FILE EDITION
============================

Upload ONLY the file  index.html  to the ROOT of your GitHub repo
(overwriting the index.html already there). Everything — the 3D
engine, styling, logo and both anatomy models — is inside that one
file. No folders needed.

Steps:
1. Open your repo → "Add file" → "Upload files" → choose index.html
   → Commit changes.
2. Settings → Pages → "Deploy from a branch" → main → / (root). (Done already? skip.)
3. Wait 1-2 minutes. Open your site link in a NEW tab
   (close the old tab first — Safari loves caching the broken page).

You should see the black NEURAXIA loading screen, then the living brain.
The other loose files in the repo can stay; only index.html matters now.
Comparison "Sprint 1 spike" model is not embedded in this edition.
"""
(OUT_DIR / 'READ-ME-FIRST.txt').write_text(readme, encoding='utf-8')

zip_path = Path('/home/user/neuraxia-ONE-FILE.zip')
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    z.write(out_html, 'index.html')
    z.write(OUT_DIR / 'READ-ME-FIRST.txt', 'READ-ME-FIRST.txt')
print(f'zip: {zip_path} ({zip_path.stat().st_size:,} bytes)')
