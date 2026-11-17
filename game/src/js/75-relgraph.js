// ───────── Arbre des relations entre factions, centré sur la tienne (vectoriel, déplaçable, zoomable) ─────────
function relCenter() { const pc = G.pc; return F[pc.faction] ? pc.faction : 'civils'; }
function relBetween(a, b) { // -2 ennemi · 0 neutre · 2 allié, pour deux factions ; depuis le joueur sans faction : selon sa réputation
  if (a === 'civils' || b === 'civils') { const o = a === 'civils' ? b : a; const v = G.pc.rep[o] || 0; return v >= 15 ? 2 : v <= -15 ? -2 : 0; }
  return relation(a, b);
}
function relLayout() {
  const c = relCenter(); const ids = Object.keys(F).filter(f => f !== c && !['civils', 'noir', 'fallen'].includes(f) && (f !== 'own' || c === 'own') && G.world.fac[f]);
  const allies = ids.filter(f => relBetween(c, f) >= 2), foes = ids.filter(f => relBetween(c, f) <= -2), others = ids.filter(f => !allies.includes(f) && !foes.includes(f));
  const pos = { [c]: [0, 0] }; const place = (arr, r, a0, a1) => arr.forEach((f, i) => { const a = arr.length === 1 ? (a0 + a1) / 2 : a0 + (a1 - a0) * i / (arr.length - 1); pos[f] = [Math.cos(a) * r, Math.sin(a) * r]; });
  place(allies, 340, -Math.PI * 0.45, Math.PI * 0.45); place(foes, 340, Math.PI * 0.55, Math.PI * 1.45);
  const R = 640; others.sort((a, b) => hashStr(a) - hashStr(b)).forEach((f, i) => { const a = (i / Math.max(1, others.length)) * Math.PI * 2 + 0.2; pos[f] = [Math.cos(a) * R, Math.sin(a) * R]; });
  return { c, ids: [c, ...allies, ...foes, ...others], pos, allies, foes, others };
}
function panZoom(svg, wrap, vb0) {
  let vb = Object.assign({}, vb0); const ptrs = new Map(); let moved = false, sx = 0, sy = 0, lastD = 0; const cw = () => wrap.clientWidth || 360, ch = () => wrap.clientHeight || 420;
  const apply = () => { vb.h = vb.w * ch() / cw(); svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); svg.style.setProperty('--gs', (vb.w / cw()).toFixed(2)); svg.classList.toggle('far', vb.w > 1250); };
  const zoomAt = (f, rx = .5, ry = .5) => { const nw = clamp(vb.w / f, 360, 3400); const cx = vb.x + vb.w * rx, cy = vb.y + vb.h * ry; vb.w = nw; vb.h = nw * ch() / cw(); vb.x = cx - vb.w * rx; vb.y = cy - vb.h * ry; apply(); };
  svg.style.touchAction = 'none';
  svg.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = false; sx = e.clientX; sy = e.clientY; lastD = 0; });
  svg.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 7) { moved = true; try { svg.setPointerCapture(e.pointerId); } catch (x) { } } if (!moved) return;
    if (ptrs.size === 1) { vb.x -= (e.clientX - p[0]) * vb.w / cw(); vb.y -= (e.clientY - p[1]) * vb.h / ch(); apply(); }
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const r = wrap.getBoundingClientRect(); if (lastD) zoomAt(d / lastD, ((a[0] + b[0]) / 2 - r.left) / r.width, ((a[1] + b[1]) / 2 - r.top) / r.height); lastD = d; } });
  const up = e => { ptrs.delete(e.pointerId); lastD = 0; setTimeout(() => { if (!ptrs.size) moved = false; }, 60); };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', e => { e.preventDefault(); const r = wrap.getBoundingClientRect(); zoomAt(Math.pow(1.0011, -e.deltaY), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }, { passive: false });
  setTimeout(apply, 0); setTimeout(apply, 120); if (window.ResizeObserver) new ResizeObserver(apply).observe(wrap);
  return { zoomIn: () => zoomAt(1.5), zoomOut: () => zoomAt(1 / 1.5), reset: () => { vb = Object.assign({}, vb0); apply(); }, wasDrag: () => moved };
}
function relationGraph(selId) {
  const pc = G.pc, W = G.world; const L = relLayout(); const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a, ...k) => { const e = document.createElementNS(NS, t); for (const x in a) e.setAttribute(x, a[x]); k.flat().forEach(c => e.append(c.nodeType ? c : document.createTextNode(c))); return e; };
  const svg = el('svg', { viewBox: '-760 -760 1520 1520', class: 'relsvg' }); const sel = selId || L.c;
  svg.append(el('rect', { x: -2000, y: -2000, width: 4000, height: 4000, fill: '#0a0a14' }));
  [300, 640].forEach(r => svg.append(el('circle', { cx: 0, cy: 0, r, fill: 'none', stroke: '#1b1b2e', 'stroke-width': 2, 'stroke-dasharray': '6 10' })));
  const col = v => v >= 2 ? '#5be3a0' : '#ff3d7f';
  // liens entre toutes les paires reliées
  const ids = L.ids; const gEdges = el('g', { class: 'redges' });
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const a = ids[i], b = ids[j]; const v = relBetween(a, b); if (!v) continue; const [x1, y1] = L.pos[a], [x2, y2] = L.pos[b]; const mine = a === L.c || b === L.c; const hot = a === sel || b === sel;
    const mx = (x1 + x2) / 2 * 0.55, my = (y1 + y2) / 2 * 0.55; gEdges.append(el('path', { d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}`, fill: 'none', stroke: col(v), 'stroke-width': hot ? 6 : mine ? 4 : 1.6, opacity: hot ? 1 : mine ? .85 : (sel && sel !== L.c ? .08 : .3), 'stroke-dasharray': v < 0 ? '10 7' : 'none' })); }
  svg.append(gEdges);
  const info = h('div', { class: 'relinfo' });
  const show1 = id => { const f = F[id]; const wf = W.fac[id] || { power: 10 }; const v = relBetween(L.c, id); const rep = pc.rep[id] || 0; const ld = W.leader[id]; const ln = ld === 'pc' ? 'toi' : ld && CH[ld] ? CH[ld].name : '—';
    const al = Object.keys(F).filter(x => x !== id && !['civils', 'noir', 'fallen'].includes(x) && relBetween(id, x) >= 2).map(x => F[x].name), en = Object.keys(F).filter(x => x !== id && !['civils', 'noir', 'fallen'].includes(x) && relBetween(id, x) <= -2).map(x => F[x].name);
    info.innerHTML = ''; info.append(h('div', { class: 'rn' }, f.name, id === L.c ? h('span', { class: 'small acc' }, ' ★ ta faction') : null), h('div', { class: 'small mut' }, esc2(f.goal)), id === L.c ? null : h('div', {}, `Avec ${F[L.c].name} : `, h('b', { class: v >= 2 ? 'good' : v <= -2 ? 'badc' : 'mut' }, v >= 2 ? 'alliés' : v <= -2 ? 'ennemis' : 'neutres'), ` · ta réputation : ${repLevel(rep)} (${rep})`), h('div', { class: 'small' }, `Chef : ${ln} · Puissance ${wf.power}/100`), h('div', { class: 'small' }, h('span', { class: 'good' }, 'Alliés : '), al.join(', ') || '—'), h('div', { class: 'small' }, h('span', { class: 'badc' }, 'Ennemis : '), en.join(', ') || '—')); };
  const esc2 = s => s || '';
  L.ids.forEach(id => { const [x, y] = L.pos[id]; const wf = W.fac[id] || { power: 10 }; const r = id === L.c ? 78 : 36 + wf.power / 100 * 26; const outer = L.others.includes(id); const v = id === L.c ? 0 : relBetween(L.c, id); const g = el('g', { class: 'rnode' + (id === sel ? ' on' : '') + (outer && id !== sel ? ' out' : ''), transform: `translate(${x} ${y})` });
    g.append(el('circle', { r: r + 7, fill: 'none', stroke: id === sel ? '#fcee09' : 'none', 'stroke-width': 4 }), el('circle', { r, fill: id === L.c ? '#fcee09' : '#12121f', stroke: id === L.c ? '#fcee09' : v >= 2 ? '#5be3a0' : v <= -2 ? '#ff3d7f' : '#4a4e72', 'stroke-width': 5 }));
    g.append(el('text', { y: r + 30, class: 'rlabel' + (id === L.c ? ' me' : '') }, F[id].name.replace(/^(Les |La |Le |L')/, '').slice(0, 15)), el('text', { y: r * 0.32, class: 'rglyph', style: `font-size:${Math.round(r * 0.95)}px` }, id === L.c ? '★' : (F[id].letter || F[id].name.replace(/^(Les |La |Le |L')/, '')[0])));
    g.addEventListener('click', () => { if (pz.wasDrag()) return; relationGraph(id); }); svg.append(g); });
  const wrap = h('div', { class: 'relwrap' }, svg); const pz = panZoom(svg, wrap, { x: -700, y: -700, w: 1400, h: 1400 });
  const btns = h('div', { class: 'mapbtns' }, h('button', { class: 'ibtn', onclick: pz.zoomIn }, '＋'), h('button', { class: 'ibtn', onclick: pz.zoomOut }, '－'), h('button', { class: 'ibtn', onclick: pz.reset }, '⤢'));
  const legend = h('div', { class: 'maplegend' }, h('span', { class: 'lg g' }, '━ alliés'), h('span', { class: 'lg r' }, '┅ ennemis'), h('span', { class: 'lg y' }, '★ toi au centre'));
  show1(sel);
  show({ compact: true, kicker: 'RELATIONS', title: 'Qui est avec qui', text: [], extra: h('div', {}, h('div', { class: 'mapbox' }, btns, wrap, legend), info), choices: [C('← Retour', () => (pc.faction === 'civils' ? actionsMenu() : factionMenu()), { cls: 'back' })] });
}
