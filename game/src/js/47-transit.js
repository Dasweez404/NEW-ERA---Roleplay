// ───────── Animation « métro » : un point blanc zoomé suit les lignes vectorielles de l'Orbitrail ─────────
const otPt = x => typeof x === 'string' ? (x.startsWith('@') ? x.slice(1).split('|').slice(1).map(Number) : [OT_ST[x][0], OT_ST[x][1]]) : x;
// géométrie exacte d'un tronçon (stations + points de passage de la ligne vectorielle)
function edgeGeom(a, b, line) {
  for (const path of OT_LINES[line].p) {
    const st = path.map((x, i) => [x, i]).filter(([x]) => typeof x === 'string' && !x.startsWith('@'));
    for (let k = 0; k + 1 < st.length; k++) {
      const [s1, i1] = st[k], [s2, i2] = st[k + 1];
      if (s1 === a && s2 === b) return [path.slice(i1, i2 + 1).map(otPt)];
      if (s1 === b && s2 === a) return [path.slice(i1, i2 + 1).map(otPt).reverse()];
    }
  }
  // traversée du Pacifique : on sort par le bord de la carte et on ressort de l'autre côté
  const toEdge = (s) => { for (const path of OT_LINES[line].p) { const i = path.indexOf(s); if (i < 0) continue; for (const dir of [-1, 1]) { const seg = [otPt(s)]; for (let j = i + dir; j >= 0 && j < path.length; j += dir) { const it = path[j]; if (typeof it === 'string' && it.startsWith('@')) { seg.push(otPt(it)); return seg; } if (typeof it === 'string') break; seg.push(it); } } } return [otPt(s)]; };
  return [toEdge(a), toEdge(b).reverse()];
}
function routeGeom(r) {
  if (r.custom) { const pts = r.custom.slice(); let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return { pts, stops: [{ id: r.steps[0].from, at: 0, i: 0 }, { id: r.steps[0].to, at: len, i: pts.length - 1 }], len, jumps: [] }; }
  const pts = [], stops = [], jumps = []; let len = 0;
  const add = p => { const l = pts[pts.length - 1]; if (l) len += Math.hypot(p[0] - l[0], p[1] - l[1]); pts.push(p); };
  r.steps.forEach((s, n) => {
    const segs = edgeGeom(s.from, s.to, s.line);
    if (n === 0) { pts.push(segs[0][0]); stops.push({ id: s.from, at: 0, i: 0 }); }
    segs.forEach((seg, k) => seg.forEach((p, j) => { if (j === 0) { if (k === 1) { pts.push(p); jumps.push(pts.length - 1); } return; } add(p); }));
    stops.push({ id: s.to, at: len, i: pts.length - 1 });
  });
  return { pts, stops, len, jumps };
}
function transit(r, from, to, done) {
  let finished = false; const finish = () => { if (finished) return; finished = true; done(); };
  if (REDUCED || !r || !r.steps || !r.steps.length) return finish();
  const G_ = routeGeom(r); const first = G_.pts[0];
  const svg = mapEl({ dark: true }); const NS = 'http://www.w3.org/2000/svg';
  const mk = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const trail = mk('polyline', { fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .9, filter: 'drop-shadow(0 0 4px #fff)' });
  const halo = mk('circle', { r: 20, fill: '#fff', opacity: .25, class: 'dothalo' }); const dot = mk('circle', { r: 8, fill: '#fff', stroke: '#27f0ff', 'stroke-width': 3 });
  svg.append(trail, halo, dot);
  const cap = h('div', { class: 'tcap' }); const bar = h('div', { class: 'tbar' }, h('i'));
  const view = h('div', { class: 'transit' }, svg, h('div', { class: 'tover' }, cap, bar), h('div', { class: 'tskip' }, 'toucher pour passer ›'));
  const lineChip = ln => ln && OT_LINES[ln] ? `<span class="lchip" style="background:${OT_LINES[ln].c === '#151515' ? '#e8e8f0' : OT_LINES[ln].c}">${ln}</span>` : `<span class="lchip" style="background:#fff">${r.vehicle || '•'}</span>`;
  const sc = { kicker: 'ORBITRAIL', title: `${capName(from)} → ${capName(to)}`, text: [], extra: view, choices: [C('Passer ›', finish, { cls: 'back' })] };
  show(sc); sfx('train');
  let W0 = 2000, cx = 1000, cy = 487, camW = W0; let s = 0, state = 'zoom', t0 = performance.now(), last = t0, pause = 0, visited = 0; const total = G_.len;
  const baseSpeed = Math.max(260, total / 7.5); const ZW = 380;
  const stationAt = i => { const o = G_.stops[i]; return o; };
  const posAt = d => { // point à la distance d le long de la polyligne, en respectant les sauts
    let acc = 0; for (let i = 1; i < G_.pts.length; i++) { const a = G_.pts[i - 1], b = G_.pts[i]; const jump = G_.jumps.includes(i); const sl = jump ? 0 : Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc + sl >= d || i === G_.pts.length - 1) { if (jump) return { x: b[0], y: b[1], i, jump: true }; const k = sl ? Math.min(1, (d - acc) / sl) : 1; return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, i }; } acc += sl; }
    const e = G_.pts[G_.pts.length - 1]; return { x: e[0], y: e[1], i: G_.pts.length - 1 };
  };
  const setCap = (st) => { const nm = OT_ST[st.id][2]; const next = G_.stops[visited + 1]; const ln = r.steps[Math.min(visited, r.steps.length - 1)].line; cap.innerHTML = `${lineChip(ln)} <b>${esc(nm)}</b>${next ? ` <span class="mut">→ ${esc(OT_ST[next.id][2])}</span>` : ' <span class="acc">terminus</span>'}`; };
  setCap(G_.stops[0]);
  const aspect = () => { const b = view.getBoundingClientRect(); return (b.height || 300) / (b.width || 400); };
  const setView = () => { const hh = camW * aspect(); svg.setAttribute('viewBox', `${cx - camW / 2} ${cy - hh / 2} ${camW} ${hh}`); };
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const frame = now => {
    if (finished || UI.scene !== sc) { finished = true; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (state === 'zoom') { const k = Math.min(1, (now - t0) / 900); const e = ease(k); camW = W0 + (ZW - W0) * e; cx = 1000 + (first[0] - 1000) * e; cy = 487 + (first[1] - 487) * e; if (k >= 1) { state = 'move'; sfx('train'); } }
    else if (state === 'move') {
      if (pause > 0) { pause -= dt; }
      else {
        const nxt = G_.stops[visited + 1]; const dist = nxt ? Math.abs(nxt.at - s) : 0; const prevd = G_.stops[visited] ? Math.abs(s - G_.stops[visited].at) : 999;
        const sp = baseSpeed * (0.28 + 0.72 * Math.min(1, Math.min(dist, prevd) / 110)); s = Math.min(total, s + sp * dt);
        if (nxt && s >= nxt.at - 0.5) { s = nxt.at; visited++; const st = G_.stops[visited]; sfx('tick'); buzz(12); pause = visited >= G_.stops.length - 1 ? 0 : 0.28; setCap(st); bar.firstChild.style.width = (visited / (G_.stops.length - 1) * 100) + '%'; if (visited >= G_.stops.length - 1) { state = 'arrive'; t0 = now; } }
      }
      const p = posAt(s); const tx = p.x, ty = p.y; const jumped = p.jump && Math.hypot(tx - cx, ty - cy) > 400; if (jumped) { cx = tx; cy = ty; flash('#27f0ff'); } else { cx += (tx - cx) * Math.min(1, dt * 6); cy += (ty - cy) * Math.min(1, dt * 6); }
    }
    else if (state === 'arrive') { const k = Math.min(1, (now - t0) / 900); const e = ease(k); camW = ZW + (ZW * 0.7 - ZW) * e; if (k >= 1) return finish(); }
    const p = posAt(s); dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y); halo.setAttribute('r', 16 + 6 * Math.sin(now / 160));
    const tp = G_.pts.slice(0, p.i).filter((q, i) => true); tp.push([p.x, p.y]); trail.setAttribute('points', tp.map(q => q.join(',')).join(' '));
    setView(); requestAnimationFrame(frame);
  };
  setView(); requestAnimationFrame(frame);
  view.addEventListener('click', finish);
}
