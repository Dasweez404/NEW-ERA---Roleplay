#!/usr/bin/env python3
"""Assemble le jeu en UN SEUL fichier HTML jouable hors-ligne : game/new-era.html
   python3 build.py
"""
import glob, json, os
here = os.path.dirname(os.path.abspath(__file__))
data = open(os.path.join(here, 'data', 'data.json'), encoding='utf-8').read()
sp = open(os.path.join(here, 'data', 'sprites.json'), encoding='utf-8').read()
import os as _o
env = open(os.path.join(here, 'data', 'envs.json'), encoding='utf-8').read() if _o.path.exists(os.path.join(here, 'data', 'envs.json')) else '{}'
css = open(os.path.join(here, 'src', 'style.css'), encoding='utf-8').read()
tpl = open(os.path.join(here, 'src', 'index.template.html'), encoding='utf-8').read()
js = '\n'.join(open(p, encoding='utf-8').read() for p in sorted(glob.glob(os.path.join(here, 'src', 'js', '*.js'))))
data = data.replace('</', '<\\/')
out = tpl.replace('/*__CSS__*/', css).replace('/*__SPR__*/', 'const SPR_DATA=' + sp + ';const ENV_IMG=' + env + ';').replace('/*__DATA__*/', 'const DATA=' + data + ';').replace('/*__JS__*/', js)
dst = os.path.join(here, 'new-era.html')
open(dst, 'w', encoding='utf-8').write(out)
print('OK', dst, round(len(out) / 1024), 'Ko')

# ── variante « artifact » : fragment sans <html>/<head>/<body>, publiable tel quel sur claude.ai
frag = ('<title>NEW ERA</title>\n<style>' + css + '</style>\n<div id="app"></div>\n<script>\nconst DATA=' + data + ';\nconst SPR_DATA=' + sp + ';\nconst ENV_IMG=' + env + ';\n</script>\n<script>\n' + js + '\n</script>\n')
open(os.path.join(here, 'new-era.artifact.html'), 'w', encoding='utf-8').write(frag)
import shutil; shutil.copy(dst, os.path.join(here, '..', 'index.html'))
print('OK artifact + index.html')
