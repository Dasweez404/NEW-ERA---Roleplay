#!/usr/bin/env python3
"""Sprites HD (pixel-art x10) -> miniatures natives rognées, en base64, dans game/data/sprites.json.
usage : python3 build_sprites.py <dossier des PNG>"""
import base64, io, json, os, sys
from PIL import Image
src = sys.argv[1]; out = {}; bad = 0
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'): continue
    im = Image.open(os.path.join(src, f)).convert('RGBA'); bb = im.getbbox()
    x0, y0, x1, y1 = bb; x0, y0 = x0 // 10 * 10, y0 // 10 * 10; x1, y1 = -(-x1 // 10) * 10, -(-y1 // 10) * 10
    im = im.crop((x0, y0, min(x1, im.width), min(y1, im.height)))
    w, h = max(1, im.width // 10), max(1, im.height // 10)
    small = im.resize((w, h), Image.NEAREST)
    # contrôle de fidélité : on ré-agrandit et on compare
    back = small.resize((w * 10, h * 10), Image.NEAREST).crop((0, 0, im.width, im.height))
    diff = sum(1 for a, b in zip(back.getdata(), im.getdata()) if a != b) / max(1, im.width * im.height)
    if diff > 0.15: bad += 1
    buf = io.BytesIO(); small.save(buf, 'PNG', optimize=True)
    out[f[:-4]] = [w, h, 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()]
json.dump(out, open(os.path.join(os.path.dirname(__file__), '..', 'data', 'sprites.json'), 'w'), separators=(',', ':'))
print(len(out), 'sprites;', round(sum(len(v[2]) for v in out.values()) / 1024), 'Ko; peu fidèles à x10 :', bad)
