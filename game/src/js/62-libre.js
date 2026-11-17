// ───────── Mode libre : scénario général aléatoire (sans la timeline d'Ora) ─────────
const PREMISES = [
  { id: 'course', t: 'La course aux pierres', x: ({ r }) => `Une rumeur court : les seize pierres muta existent. <b>${esc(F[r].name)}</b> s’est lancé dans la chasse et accumule déjà des alliés. Si personne ne l’arrête, il finira par dominer le monde.` },
  { id: 'fragile', t: 'Le Régime vacille', x: ({ r }) => `Le Nouveau Régime fissure : scandales, mutineries, oligarques qui se déchirent. Dans la panique, <b>${esc(F[r].name)}</b> cherche les pierres antiques pour s’emparer du vide.` },
  { id: 'neo', t: 'Néo regarde', x: ({ r }) => `Néo, conseiller du Régime, veut les pierres avant tout le monde. Il laisse <b>${esc(F[r].name)}</b> fouiller à sa place… en attendant de lui reprendre ses trouvailles.` },
  { id: 'noir', t: 'La guerre du Marché Noir', x: ({ r }) => `Le Marché Noir se déchire. <b>${esc(F[r].name)}</b> profite du chaos pour rafler les pierres antiques et les armes de ses rivaux.` },
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
    W.stoneHolder[s.id] = holder; W.stoneLoc[s.id] = loc;
  });
  const rival = pick(pool); const prem = pick(PREMISES); W.rival = rival; W.premise = { id: prem.id, t: prem.t, text: prem.x({ r: rival }) };
  W.arcs = []; W.rivalStones = 0;
  if (prem.id === 'fragile') { W.fac.fa.power = 62; }
  const q = pc.flags.queue = pc.flags.queue || []; q.unshift({ id: 'premise' });
}
EVENT_FN.premise = function () {
  const p = G.world.premise; if (!p) return hub();
  show({ kicker: 'SCÉNARIO · MODE LIBRE', title: p.t, text: [p.text, 'Ce scénario est tiré au hasard : tu l’écris à ta façon. Cherche les pierres antiques, fais grandir ta faction, ou prends ta retraite quand tu veux.'], choices: [C('Commencer', hub)] });
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
  if (W.rival && chance(W.premise && W.premise.id === 'course' ? 0.16 : 0.1)) {
    const cand = DATA.stones.filter(s => W.stoneHolder[s.id] !== W.rival && W.stoneHolder[s.id] !== 'pc');
    if (cand.length) { const s = pick(cand); W.stoneHolder[s.id] = W.rival; W.stoneLoc[s.id] = F[W.rival].hq; newsPush(`${F[W.rival].name} met la main sur la pierre de ${s.name}.`); }
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
