#!/usr/bin/env python3
"""Orthographic QA render of FIRE tract routes over the BP3D silhouette.

Input : /tmp/fire-curves.json (dumped by the Node geometry test harness)
Output: research/sprint-1c/fire-0-tract-qa.png (long tracts) and
        research/sprint-1d/fire-brain-circuits-qa.png (vision/pupillary/reflex)
Markers: ◆ amber diamond = decussation, ○ white ring = synapse.
"""
import json, os
from PIL import Image, ImageDraw, ImageFont

D = json.load(open('/tmp/fire-curves.json'))
cloud = D['cloud']

def fonts():
    try:
        return (ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20),
                ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26),
                ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15))
    except Exception:
        f = ImageFont.load_default()
        return f, f, f

FONT, FONTB, FONTS = fonts()
COLORS = {'cst': (255, 177, 153), 'dcml': (32, 215, 229), 'stt': (255, 122, 144),
          'vision': (32, 215, 229), 'pupillary': (201, 167, 255), 'reflex': (159, 232, 112)}

def render(path, tract_names, title_lines, ycrop=None, ywindow=None, W=1600, H=1000):
    pts_all = [p for p in cloud if (ycrop is None or p[1] > ycrop) and (ywindow is None or (ywindow[0] < p[1] < ywindow[1]))]
    ys = [p[1] for p in pts_all]
    ymin, ymax = min(ys), max(ys)
    img = Image.new('RGB', (W, H), (7, 7, 8))
    dr = ImageDraw.Draw(img, 'RGBA')

    def panel(x0, title, proj, flip):
        pw = W // 2
        xs = [proj(p) for p in pts_all]
        xmin, xmax = min(xs), max(xs)
        s = min((pw - 90) / max(xmax - xmin, 1e-6), (H - 200) / max(ymax - ymin, 1e-6))
        cx, cy = x0 + pw / 2, 95 + (H - 210) / 2
        xmid, ymid = (xmin + xmax) / 2, (ymin + ymax) / 2
        def T(p):
            x = proj(p)
            if flip: x = xmin + xmax - x
            return (cx + (x - xmid) * s, cy - (p[1] - ymid) * s)
        for p in pts_all:
            X, Y = T(p)
            dr.ellipse([X - 1.6, Y - 1.6, X + 1.6, Y + 1.6], fill=(120, 96, 82, 105))
        dr.text((x0 + 30, 26), title, fill=(244, 239, 232), font=FONTB)
        return T

    Ts = [panel(0, 'FRONTAL  (← subject left)', lambda p: p[0], True),
          panel(W // 2, 'SAGITTAL  (← anterior)', lambda p: p[2], True)]

    for T in Ts:
        dr.line([T(p) for p in D['cordCenters']], fill=(240, 230, 218, 150), width=2)
        for name in tract_names:
            col = COLORS[name]
            for extra in D['tracts'].get(name + '__extras', []):
                dr.line([T(p) for p in extra], fill=col + (150,), width=3, joint='curve')
            dr.line([T(p) for p in D['tracts'][name]], fill=col + (235,), width=4, joint='curve')
            for st in D['stations'][name]:
                X, Y = T(st['point'])
                if st['kind'] == 'decussation':
                    r = 9
                    dr.polygon([(X, Y - r), (X + r, Y), (X, Y + r), (X - r, Y)], fill=(255, 217, 168, 255))
                elif st['kind'] == 'synapse':
                    dr.ellipse([X - 8, Y - 8, X + 8, Y + 8], outline=(234, 252, 255, 255), width=3)
                else:
                    dr.ellipse([X - 4.5, Y - 4.5, X + 4.5, Y + 4.5], fill=col + (255,))

    y = H - 150
    for line, fnt, col in title_lines:
        dr.text((30, y), line, fill=col, font=fnt)
        y += 30
    lx = 30
    for name in tract_names:
        dr.line([(lx, H - 52), (lx + 44, H - 52)], fill=COLORS[name], width=5)
        dr.text((lx + 54, H - 63), name.upper(), fill=(244, 239, 232), font=FONTS)
        lx += 240
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print('saved', path)

cord_top_y = max(p[1] for p in D['cordCenters'])

render('/home/user/neuraxia/research/sprint-1c/fire-0-tract-qa.png',
       ['cst', 'dcml', 'stt'],
       [('NEURAXIA · FIRE long tracts — routes computed on the real BP3D cord centreline', FONT, (244, 239, 232)),
        ('◆ decussation    ○ synapse (schematic station where BP3D has no mesh)    pale line = cord centreline', FONTS, (170, 163, 157)),
        ('CST crosses: medulla · DCML: medulla after synapse · STT: at cord level', FONTS, (170, 163, 157))])

render('/home/user/neuraxia/research/sprint-1d/fire-brain-circuits-qa.png',
       ['vision', 'pupillary'],
       [('NEURAXIA · FIRE brain circuits — chiasm sort (cyan) & pupillary fork (violet)', FONT, (244, 239, 232)),
        ('VISION: temporal fibres stay, nasal fibres cross at ◆ chiasm; pale cyan = Meyer loop.   PUPILLARY: ◆ pretectal fork → both pupils', FONTS, (170, 163, 157)),
        ('○ synapse — LGN (real mesh) · pretectal/EW/ciliary stations are schematic markers (no BP3D meshes)', FONTS, (170, 163, 157))],
       ycrop=cord_top_y - 0.06)

render('/home/user/neuraxia/research/sprint-1d/fire-reflex-qa.png',
       ['reflex'],
       [('NEURAXIA · stretch reflex — schematic arc on the cord centreline (periphery not modelled)', FONT, (244, 239, 232)),
        ('Muscle → dorsal root → ○ ONE synapse in ventral horn → back to same muscle. No decussation, no ascent.', FONTS, (170, 163, 157)),
        ('Lateral excursion is schematic stand-in for spinal nerve / muscle until a peripheral-context source is licensed.', FONTS, (170, 163, 157))],
       ywindow=(-0.23, 0.02))
