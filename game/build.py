#!/usr/bin/env python3
"""Assemble le jeu en UN SEUL fichier HTML jouable hors-ligne : game/new-era.html
   python3 build.py
"""
import glob, json, os
here = os.path.dirname(os.path.abspath(__file__))
data = open(os.path.join(here, 'data', 'data.json'), encoding='utf-8').read()
css = open(os.path.join(here, 'src', 'style.css'), encoding='utf-8').read()
tpl = open(os.path.join(here, 'src', 'index.template.html'), encoding='utf-8').read()
js = '\n'.join(open(p, encoding='utf-8').read() for p in sorted(glob.glob(os.path.join(here, 'src', 'js', '*.js'))))
data = data.replace('</', '<\\/')
out = tpl.replace('/*__CSS__*/', css).replace('/*__DATA__*/', 'const DATA=' + data + ';').replace('/*__JS__*/', js)
dst = os.path.join(here, 'new-era.html')
open(dst, 'w', encoding='utf-8').write(out)
print('OK', dst, round(len(out) / 1024), 'Ko')
