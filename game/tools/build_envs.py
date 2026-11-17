#!/usr/bin/env python3
"""Images de villes -> bandeaux réduits en base64 dans game/data/envs.json.
usage : python3 build_envs.py <dossier>   (fichiers nommés <id_etat>[_night|_dusk|_day].jpg|png|webp)"""
import base64, io, json, os, sys
from PIL import Image
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'assets', 'envs')
out = {}; tot = 0
for f in sorted(os.listdir(src)):
    name, ext = os.path.splitext(f)
    if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp'): continue
    im = Image.open(os.path.join(src, f)).convert('RGB')
    w = 1000; h = max(1, round(im.height * w / im.width)); im = im.resize((w, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=72, optimize=True, progressive=True)
    out[name] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode(); tot += len(buf.getvalue())
json.dump(out, open(os.path.join(os.path.dirname(__file__), '..', 'data', 'envs.json'), 'w'), separators=(',', ':'))
print(len(out), 'images;', round(tot / 1024), 'Ko')
