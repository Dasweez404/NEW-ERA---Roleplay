// ───────── Stations fermées et villes confinées ─────────
// Station fermée : plus d'Orbitrail vers cet État (les véhicules passent encore).
// Ville confinée : ni Orbitrail, ni aucun véhicule. Les fermetures sont temporaires.
const CLOSE_STATION = ['Grève des conducteurs', 'Travaux de maintenance sur les voies', 'Alerte à la bombe : quai évacué', 'Inspection de sécurité de la Force d’Autorité', 'Voie endommagée par une pluie de météorites', 'Panne géante du réseau énergétique', 'Gare réservée aux délégations d’un sommet', 'Un train déraillé bloque la voie'];
const CLOSE_LOCK = ['Quarantaine : une souche génotique incontrôlée', 'Couvre-feu militaire de la Force d’Autorité', 'Ville bouclée par un siège de faction', 'Tempête de météorites : toute circulation interdite', 'Cérémonie du Nouveau Régime : zone verrouillée', 'Mutinerie de la garnison : la ville est fermée'];
function closureOf(state) {
  const W = G && G.world; if (!W || !W.closed) return null; const c = W.closed[state]; if (!c) return null;
  if (c.until <= G.wk) { delete W.closed[state]; return null; } return c;
}
function closedMap() { const m = new Map(); if (!G || !G.world || !G.world.closed) return m; Object.keys(G.world.closed).forEach(s => { const c = closureOf(s); if (c) m.set(s, c); }); return m; }
const isLockdown = s => { const c = closureOf(s); return !!(c && c.kind === 'lockdown'); };
const closureLine = c => (c.kind === 'lockdown' ? '🚫 Ville confinée' : '⛔ Station fermée') + ' — ' + c.why;
function closureMonth() {
  const W = G.world; W.closed = W.closed || {};
  Object.keys(W.closed).forEach(s => { const c = W.closed[s]; if (c.until <= G.wk) { delete W.closed[s]; newsPush(`${capName(s)} : ${c.kind === 'lockdown' ? 'le confinement est levé' : 'la station rouvre'}.`); } });
  const act = Object.keys(W.closed).length; if (act >= 3 || !chance(0.4)) return;
  const cand = DATA.states.map(s => s.id).filter(s => s !== G.loc && !W.closed[s]); if (!cand.length) return;
  const s = pick(cand); const lock = chance(0.35);
  W.closed[s] = { kind: lock ? 'lockdown' : 'station', until: G.wk + (lock ? rint(4, 12) : rint(3, 10)), why: pick(lock ? CLOSE_LOCK : CLOSE_STATION) };
  newsPush(`${capName(s)} : ${lock ? 'ville confinée' : 'station fermée'} (${W.closed[s].why.toLowerCase()}).`);
}
