// ───────── Debug de l'Orbitrail : stations, lignes, correspondances, connexité ─────────
function lineStations(ln) { const seen = []; OT_LINES[ln].p.forEach(path => path.forEach(x => { if (typeof x === 'string' && !x.startsWith('@') && !seen.includes(x)) seen.push(x); })); return seen; }
function orbitrailDebug(sel) {
  const lines = Object.keys(OT_LINES).map(Number); const ids = Object.keys(OT_ST);
  const seen = new Set([ids[0]]); const q = [ids[0]]; while (q.length) { const a = q.pop(); (OT.adj[a] || []).forEach(e => { if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); } }); }
  const lns = id => lines.filter(l => lineStations(l).includes(id));
  const back = () => G && G.status === 'play' ? actionsMenu() : titleScreen();
  const chips = h('div', { class: 'row', style: 'margin:6px 0' }, lines.map(l => h('button', { class: 'tab' + (sel === l ? ' on' : ''), style: `border-color:${OT_LINES[l].c === '#151515' ? '#cfd3e6' : OT_LINES[l].c};${sel === l ? '' : `color:${OT_LINES[l].c === '#151515' ? '#cfd3e6' : OT_LINES[l].c}`}`, onclick: () => orbitrailDebug(sel === l ? null : l) }, 'L' + l + ' · ' + lineStations(l).length)));
  const tb = h('table', { class: 't' }, h('tr', {}, ['Station', 'État', 'Lignes', 'Voisins'].map(x => h('th', {}, x))));
  (sel ? lineStations(sel) : ids).forEach(id => tb.append(h('tr', {}, h('td', {}, OT_ST[id][2] + (OT_ST[id][4] ? ' ▮' : '')), h('td', {}, OT_ST[id][3]), h('td', {}, lns(id).join(' · ')), h('td', {}, [...new Set((OT.adj[id] || []).map(e => OT_ST[e.to][2]))].join(', ')))));
  const sum = `${ids.length} stations · ${OT.edges.length} tronçons · ${lines.length} lignes · réseau connexe : ${seen.size === ids.length ? 'OUI' : 'NON (' + (ids.length - seen.size) + ' isolées)'} · petites stations (▮, arrêts normaux mais secondaires) : ${ids.filter(i => OT_ST[i][4]).map(i => OT_ST[i][2]).join(', ')} · traversées du Pacifique : ${OT_WRAP.map(w => OT_ST[w[0]][2] + '↔' + OT_ST[w[1]][2] + ' (L' + w[2] + ')').join(', ')} : la Terre est une boucle, on les rejoint des deux côtés de la carte.`;
  const ord = sel ? `<b>Ligne ${sel}</b> (${lineStations(sel).map(i => esc(OT_ST[i][2])).join(' → ')})` : 'Choisis une ligne pour la mettre en évidence.';
  show({ kicker: 'DEBUG', title: 'Orbitrail', text: [esc(sum), ord], extra: h('div', {}, chips, mapBox({ hl: sel || null }), h('div', { class: 'scroll', style: 'margin-top:8px;max-height:340px' }, tb)), choices: [C('← Retour', back)] });
}
