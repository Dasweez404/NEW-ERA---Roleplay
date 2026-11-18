// ───────── Mode libre : scénario général aléatoire (sans la timeline d'Ora) ─────────
const PREMISES = [
  { id: 'anti', t: 'Le protocole ANTI', x: ({ r }) => `Juin 2071 : le Nouveau Régime lance le <b>protocole ANTI</b>. Radars à géno dans les gares, recensement des porteurs, techniques anti-geno enseignées à la Force d’Autorité. <b>${esc(r ? F[r].name : 'Une faction')}</b> est parmi les premières à réagir. La question n’est plus de savoir si l’on se cache, mais comment l’on survit.` },
  { id: 'fragile', t: 'Les premières rafles', x: ({ r }) => `Le protocole ANTI est à peine lancé que les premières rafles commencent. La Force d’Autorité s’organise vite, mais pas partout : <b>${esc(F[r].name)}</b> profite des failles pour s’imposer dans le chaos.` },
  { id: 'neo', t: 'Néo supervise', x: ({ r }) => `Néo, conseiller stratégique du Régime, supervise lui-même le protocole ANTI. Les gares se couvrent de portiques, les listes s’allongent. <b>${esc(F[r].name)}</b> cherche à savoir qui s’y est laissé prendre, et qui y a échappé.` },
  { id: 'noir', t: 'Les primes du Marché Noir', x: ({ r }) => `Avec le protocole ANTI, des primes apparaissent partout : le Marché Noir tient les registres, les chasseurs s’organisent. <b>${esc(F[r].name)}</b> se positionne sur ce nouveau marché, et sur ceux qui y figurent.` },
];
const ARC_TITLES = [['Évasion au Tartare', 'liberation'], ['Révolte des bidonvilles', 'defense'], ['Tournoi clandestin', 'course'], ['Catastrophe de l’ogénite', 'climat'], ['Convoi disparu', 'escorte'], ['Fuite de données', 'infiltration'], ['Chasse à l’homme', 'prime'], ['Fouilles interdites', 'fouille'], ['Épidémie dans les quartiers bas', 'humanitaire'], ['Usine sous haute garde', 'sabotage'], ['Contrebande en cascade', 'contrebande'], ['Enquête sur une disparition', 'enquete']];
function setupLibre() {
  const W = G.world; const pc = G.pc;
  const pool = Object.keys(F).filter(f => (isAnti(f) || F[f].secret) && f !== pc.faction && !['fa'].includes(f));
  // détenteurs et lieux aléatoires
  DATA.stones.forEach(s => {
    const r = Math.random(); let holder, loc;
    if (r < 0.34) { holder = 'temple'; loc = pick(DATA.states).id; }
    else if (r < 0.46) { holder = 'fa'; loc = pick(['mitropa', 'atlante', 'gallica', 'slavo', 'sinotan']); }
    else { holder = pick(pool); loc = F[holder].hq; }
    W.stoneHolder[s.id] = holder; W.stoneLoc[s.id] = CANON_LOC[s.id] || loc; // lieu fixe de chaque pierre, même en mode libre
  });
  const rival = pick(pool); const prem = pick(PREMISES); W.rival = rival; W.premise = { id: prem.id, t: prem.t, text: prem.x({ r: rival }) };
  W.arcs = []; W.rivalStones = 0;
  if (prem.id === 'fragile') { W.fac.fa.power = 62; }
  const q = pc.flags.queue = pc.flags.queue || []; q.unshift({ id: 'premise' });
}
EVENT_FN.premise = function () {
  const p = G.world.premise; if (!p) return hub();
  show({ kicker: 'SCÉNARIO · MODE LIBRE', title: p.t, text: [p.text, typeof startNote === 'function' ? startNote() : ''], choices: [C('Commencer', hub)] });
};
function libreMonth() {
  const W = G.world; const pc = G.pc;
  // intrigues générées
  W.arcs = (W.arcs || []).filter(a => a.exp > G.wk);
  if (chance(W.premise && W.premise.id === 'noir' ? 0.55 : 0.4) && W.arcs.length < 4) {
    const [title, arch] = pick(ARC_TITLES); const state = pick(DATA.states).id; const fac = pick(Object.keys(F).filter(f => isAnti(f)));
    W.arcs.push({ id: G.wk + ':' + state, state, title, arch, fac, exp: G.wk + 12 });
    newsPush(`${title} à ${capName(state)} (${F[fac].name} impliqué).`);
  }
  // le rival collecte les pierres
  if (W.rival && stonesUnlocked() && chance(W.premise && W.premise.id === 'anti' ? 0.16 : 0.1)) {
    const cand = DATA.stones.filter(s => W.stoneHolder[s.id] !== W.rival && W.stoneHolder[s.id] !== 'pc');
    if (cand.length) { const s = pick(cand); W.stoneHolder[s.id] = W.rival; newsPush(`${F[W.rival].name} met la main sur la pierre de ${s.name}.`); }
  }
  const n = DATA.stones.filter(s => W.stoneHolder[s.id] === W.rival).length;
  if (n >= 8 && !W.warned) { W.warned = 1; newsPush(`⚠ ${F[W.rival].name} détient ${n} pierres antiques : le monde retient son souffle.`); logEntry('Le rival détient 8 pierres.'); }
  if (n >= 13) endGame('dead', `${F[W.rival].name} a réuni les pierres antiques. Le monde plie devant lui.`);
}
function libreOffers() {
  const out = []; const W = G.world;
  (W.arcs || []).filter(a => a.state === G.loc && !G.pc.flags['arc_' + a.id]).forEach(a => out.push({ title: `${a.title} (événement)`, sub: `${F[a.fac].name} est impliqué.`, go: () => arcScene(a) }));
  return out;
}
function arcScene(a) {
  const pc = G.pc; pc.flags['arc_' + a.id] = true;
  const o = genOffer(a.fac, clamp(Math.max(2, pc.grade + 1), 2, 5), { arch: a.arch, place: a.state }); o.feed = true; o.pay = Math.round(o.pay * 1.3); o.xp += 20; o.empName = F[a.fac].name;
  show({ kicker: 'ÉVÉNEMENT', title: a.title, text: [`À ${esc(capName(a.state))}, quelque chose se prépare. ${esc(F[a.fac].name)} y est mêlé. Tu es sur place : tu peux t’en mêler.`], choices: [C('S’en mêler', () => missionApproach(o), { ic: '🎯', cls: 'risk' }), C('Passer ton chemin', hub, { cls: 'back' })] });
}
