// ───────── Monde vivant : tic mensuel, événements canon, simulation PNJ/factions, événements aléatoires ─────────
const CANON_NAMES = ['Ora', 'Dafa', 'Multi', 'Guano', 'Vracia', 'Jinsei', 'Shinda', 'Alíngua', 'Myrsky', 'Rozko', 'Bot', 'Blackout', 'Rènào', 'Kuini Wai', 'Inkho', 'Viscous', 'Scatter', 'Kiné', 'Crâne', 'Levit', 'Moon Fang', 'Rènào'];
const canonGroup = () => DATA.chars.filter(c => CANON_NAMES.includes(c.name)).map(c => c.id);
const ARC_ARCH = { 0: 'enquete', 1: 'escorte', 2: 'prime', 3: 'course', 4: 'sabotage', 5: 'fouille', 6: 'climat', 7: 'defense', 8: 'liberation', 9: 'defense', 10: 'humanitaire', 11: 'defense', 12: 'escorte', 13: 'defense', 14: 'infiltration', 15: 'liberation', 16: 'infiltration', 17: 'sabotage', 18: 'sabotage', 19: 'defense', 20: 'defense' };

function monthTick() {
  const pc = G.pc; const key = monthKey(); const W = G.world; const month = Math.floor(G.wk / 4);
  if (month % 12 === 0) pc.age++;
  // coût de la vie et soldes
  const cost = 40 + pc.party.length * 25;
  if (pc.money >= cost) pc.money -= cost; else { pc.money = 0; pc.party.forEach(a => a.loy = clamp(a.loy - 8, 0, 100)); }
  const L = [];
  addHeat(-4); if (pc.brouil < 0) pc.brouil = 0;
  // loyauté des alliés
  [...pc.party].forEach(a => {
    a.loy = clamp(a.loy + PK('bond') + (hasRole('leader') ? 2 : 0) + rint(-3, 2) + ((pc.rep[CH[a.id].faction] || 0) < -30 ? -4 : 0), 0, 100);
    if (a.loy <= 12) { const c = CH[a.id]; removeAlly(a.id); newsPush(`${c.name} a quitté ton groupe.`); logEntry(`${c.name} t'a quitté.`); if (chance(0.3) && isAnti(c.faction) === false && wantedStars() > 0) { pc.flags.betrayed = (pc.flags.betrayed || 0) + 1; addHeat(8); logEntry(`${c.name} t'a vendu à la F.A.`); newsPush(`Une dénonciation vise un fugitif.`); } }
  });
  // retraite du chef : si tu es Bras droit et que tu attends, il peut passer la main
  if (pc.faction !== 'civils' && pc.grade === 4 && pc.flags.awaitRetire && W.leader[pc.faction] && W.leader[pc.faction] !== 'pc' && chance(0.14) && !pc.flags.cap) queue('retraiteChef');
  // implant
  if (pc.implant && G.wk >= pc.implant.deadline - 2 && !pc.flags.capnote) { queue('implant'); }
  // captivité : exécution / vente
  if (pc.flags.cap) captiveMonth();
  // événements canon
  if (G.settings.canon) runCanon(key); else if (G.settings.mode === 'libre') libreMonth();
  // simulation PNJ et factions
  simNpcs(); simFactions(); warMonth(); closureMonth();
  if (chance(0.5)) monthNews();
  // menace sur les pierres
  const n = stoneCount();
  if (n > 0 && G.wk - (pc.flags.raidWk == null ? -99 : pc.flags.raidWk) >= 12 && chance(Math.min(0.16, 0.015 + 0.011 * n)) && !pc.flags.cap) { pc.flags.raidWk = G.wk; queue('stoneRaid'); } // rare : au plus un raid par trimestre
  if (n >= 6 && W.era !== 'newera' && chance(0.12)) queue('neo');
  // conseil de faction
  if (pc.grade >= 1 && pc.faction !== 'civils' && !pc.flags.cap && chance(0.55)) queue('council');
  // loyers de territoire
  const terr = DATA.states.filter(s => W.terr[s.id] === 'pc').length; if (terr) { const inc = terr * 120; pc.money += inc; newsPush(`Tes territoires rapportent ${inc} ¢ ce mois-ci.`); }
  G.score.terr = Math.max(G.score.terr || 0, terr);
  if (terr && chance(0.25) && !pc.flags.cap) queue('terrAttack');
  if (pc.implant && G.wk > pc.implant.deadline) { implantBlast(); }
}
function queue(id, arg) { const q = G.pc.flags.queue = G.pc.flags.queue || []; if (!q.some(e => e.id === id)) q.push({ id, arg }); }

// ───────── Événements canon (timeline d'Ora) ─────────
function runCanon(key) {
  const W = G.world;
  DATA.arcs.filter(a => a.date === key).forEach(arc => {
    const idx = DATA.arcs.indexOf(arc);
    newsPush(`Canon · ${arc.title} : ${arc.summary.slice(0, 170)}…`);
    canonGroup().forEach(id => { const n = W.npc[id]; if (n.alive && n.st === 'free') n.loc = arc.state; });
    DATA.stones.filter(s => s.canonDate === key).forEach(s => {
      if (G.pc.stones[s.id]) { newsPush(`L'Alliance (Vigilante Squad) échoue à récupérer la pierre de ${s.name} : quelqu’un l'a devancée.`); G.pc.flags.canonDiverged = true; return; }
      if (W.stoneHolder[s.id] !== 'vigilante') { W.stoneHolder[s.id] = 'vigilante'; W.stoneLoc[s.id] = arc.state; newsPush(`La Vigilante Squad (« l'Alliance ») met la main sur la pierre antique de ${s.name} (${s.canonWhere}).`); }
    });
  });
  if (key === '2074-04') {
    const n = DATA.stones.filter(s => W.stoneHolder[s.id] === 'vigilante').length;
    if (n >= 15 && !G.pc.stones.tenebres) { W.era = 'newera'; newsPush('☀ L’Alliance a vaincu Néo à Paris : les sept doyens se rendent. Le Nouveau Régime est tombé, la Force d’Autorité est démantelée. Une nouvelle ère commence.'); logEntry('Le Nouveau Régime est tombé.'); G.pc.heat = Math.max(0, G.pc.heat - 60); W.fac.fa.power = 10; }
    else { W.era = 'dark'; newsPush('🌑 L’Alliance échoue à réunir les pierres : Néo reste maître du jeu. Le Nouveau Régime resserre l’étau.'); }
  }
}
function canonOffers() {
  const out = []; const pc = G.pc; const now = monthKey();
  if (G.settings.mode === 'libre') return libreOffers();
  if (!G.settings.canon || (pc.rep.vigilante || 0) <= -30) return out;
  DATA.arcs.forEach((arc, i) => {
    const d = arc.date; const cur = G.wk; const mm = dateOf(cur); const ym = mm.y * 12 + mm.m; const [y, m] = d.split('-').map(Number); const am = y * 12 + m - 1;
    if (am > ym || ym - am > 1 || arc.state !== G.loc || pc.flags['canon_' + i]) return;
    out.push({ title: `L’Alliance à ${arc.title.split(',')[0]} (événement canon)`, sub: `${arc.saga} — la Vigilante Squad est dans les parages.`, go: () => canonScene(arc, i) });
  });
  return out;
}
function canonScene(arc, i) {
  const pc = G.pc; const vs = (pc.rep.vigilante || 0);
  show({ kicker: arc.saga, title: arc.title, text: [`<span class="mut">${esc(dateStr())}</span>`, esc(arc.summary), 'Les événements se déroulent sous tes yeux. Que fais-tu ?'], choices: [
    C('Prêter main-forte à l’Alliance', () => { pc.flags['canon_' + i] = true; const o = genOffer('vigilante', clamp(Math.max(2, pc.grade + 1), 2, 5), { arch: ARC_ARCH[i] || 'defense', place: arc.state }); o.canon = true; o.tgtName = 'les ennemis de l’Alliance'; o.pay = Math.round(o.pay * 1.3); o.xp += 20; missionBrief(o); }, { sub: 'Mission spéciale : réputation et récompense accrues auprès de la Vigilante Squad.', cls: 'safe' }),
    C('Les observer de loin et parler à leurs membres', () => { pc.flags['canon_' + i] = true; const here = canonGroup().filter(id => G.world.npc[id].alive && G.world.npc[id].loc === arc.state && G.world.npc[id].st === 'free').map(id => CH[id].name); show({ kicker: arc.title, title: 'À distance', text: [here.length ? `Tu repères : ${esc(here.slice(0, 8).join(', '))}.` : 'Tu n’aperçois plus personne.', 'Tu peux les rencontrer dans le menu « Recruter / rencontrer ».'], fx: fx({ rep: { vigilante: 2 }, xp: 8 }), choices: [C('Continuer', hub)] }); }),
    C('Profiter de l’agitation pour t’en prendre à leurs prises', () => { pc.flags['canon_' + i] = true; stoneMenu(); }, { sub: 'Les pierres obtenues par l’Alliance sont plus faciles à voler dans la confusion.', cls: 'danger' }),
    C('Passer ton chemin', () => { pc.flags['canon_' + i] = true; hub(); })] });
}

// ───────── Simulation légère des PNJ et des factions ─────────
function simNpcs() {
  const W = G.world; const ids = Object.keys(W.npc);
  ids.forEach(id => {
    const n = W.npc[id]; if (!n.alive || n.st !== 'free') return; const c = CH[id];
    const lead = Object.values(F).find(f => W.leader[f.id] === id);
    if (!lead && chance(0.12)) n.loc = chance(0.4) ? n.home : pick(DATA.states).id;
    if (lead) n.loc = F[lead.id].hq;
    const p = lead ? 0.0012 : c.faction === 'fa' ? 0.0006 : 0.0015;
    if (!canonGroup().includes(id) && chance(p)) {
      n.alive = false; newsPush(`${c.name} (${F[c.faction].name}) est mort${c.gender === 'F' ? 'e' : ''}.`);
      if (lead) succession(lead.id, id);
    }
  });
}
function succession(fid, deadId) {
  const W = G.world; const mem = DATA.chars.filter(c => c.faction === fid && W.npc[c.id].alive && c.id !== deadId && W.npc[c.id].st !== 'pc').sort((a, b) => b.stars - a.stars || b.ratio - a.ratio);
  const pc = G.pc;
  if (pc.faction === fid && pc.grade === 4) { W.leader[fid] = null; pc.flags.vacant = fid; newsPush(`${F[fid].name} n’a plus de chef.`); queue('succession', fid); return; }
  if (mem.length) { W.leader[fid] = mem[0].id; newsPush(`${mem[0].name} prend la tête de ${F[fid].name}.`); } else W.leader[fid] = null;
}
function simFactions() {
  const W = G.world; const ids = Object.keys(W.fac).filter(f => !['civils', 'fallen', 'noir'].includes(f));
  ids.forEach(fid => {
    const f = W.fac[fid]; f.power = clamp(f.power + rint(-2, 2) + (fid === G.pc.faction || fid === 'fa' ? 0 : 0), 6, 100);
    if (fid === 'fa' && W.era === 'newera') return;
    if (fid === 'fa' || fid === G.pc.faction) return;
    if (chance(f.power / 100 * 0.05)) {
      const here = DATA.states.map(s => s.id); const st = pick(here); const owner = W.terr[st];
      if (owner === fid || owner === 'pc') return;
      const dp = owner === 'fa' ? (W.era === 'newera' ? 10 : 60) : (W.fac[owner] ? W.fac[owner].power : 20);
      if (f.power + rint(0, 30) > dp + rint(0, 30)) { W.terr[st] = fid; newsPush(`${F[fid].name} prend le contrôle de ${S[st].name} aux dépens de ${F[owner] ? F[owner].name : owner}.`); }
    }
  });
  // retours de bâton de la F.A.
  if (W.era !== 'newera' && chance(0.25)) {
    const st = pick(DATA.states.filter(s => W.terr[s.id] !== 'fa' && W.terr[s.id] !== 'pc')); if (st) { W.terr[st.id] = 'fa'; newsPush(`La Force d’Autorité reprend ${st.name} à ${F[W.terr[st.id]] ? '' : ''}ses occupants.`); }
  }
}
const NEWS = [
  () => `Dérèglement climatique à ${S[pick(DATA.states).id].name} : ${pick(CLIMATE)}.`,
  () => `L’ARENA annonce un nouveau tournoi de gladiateurs près de ${capName(pick(DATA.states).id)}.`,
  () => 'La Force d’Autorité lance une nouvelle campagne de recensement : détecteurs d’ogénite dans les gares.',
  () => 'Mana Corp diffuse un reportage sur « la menace géno-porteuse » : audience record.',
  () => `Incident à ${capName(pick(DATA.states).id)} : un géno-porteur isolé a été abattu.`,
  () => 'Hem Industries inaugure de nouveaux abris à la périphérie d’une métropole.',
  () => 'Le Marché Noir change de monnaie parallèle : les cours s’affolent.',
  () => 'Le Panthéon est signalé en mouvement : une opération d’envergure se prépare.',
  () => stonesUnlocked() ? 'Des rumeurs parlent de pierres antiques « invincibles » découvertes par des archéologues.' : 'Le protocole ANTI s’étend : de nouveaux portiques à radar dans les petites gares.',
  () => 'Un convoi de prisonniers a disparu sur la route du Tartare.',
];
function monthNews() { newsPush(pick(NEWS)()); }
function rumor() {
  const l = stoneClueGain(); if (l) return l;
  return pick(['on dit que le Check recrute en secret.', 'la Force d’Autorité aurait un radar capable de détecter les porteurs à un kilomètre.', 'à Lagos, une ville utopiste résiste au Nouveau Régime.', 'le Sanctuaire Shūshì flotte quelque part au-dessus de la Chine.']);
}

// ───────── Contrôle F.A. ─────────
function controleFA(route) {
  const pc = G.pc; const st = wantedStars(); const tier = clamp(st + 1, 1, 5); const price = 100 * (st + 1);
  const L = [];
  L.push(C('Bluffer et présenter tes papiers', () => ctlRes(check('charisme', dcOf(tier, -1), ['social', 'disguise']), 'Le contrôleur jette un œil, hésite… puis te laisse passer.', 'Le scanner clignote en rouge.'), { odds: ['charisme', dcOf(tier, -1), ['social', 'disguise']] }));
  L.push(C(`Corrompre l’agent (${price} ¢)`, () => { pc.money -= price; ctlRes({ ok: true, r: 0, mod: 0, total: 0, dc: 0, parts: [], crit: false, fumble: false }, 'Un billet glisse dans une main. « Bon voyage. »', ''); }, { req: { money: price }, sub: 'Réussite assurée' }));
  L.push(C('Te perdre dans la foule', () => ctlRes(check('agilite', dcOf(tier), ['stealth', 'mobility']), 'Tu t’éclipses derrière un groupe de voyageurs.', 'On t’a vu t’éloigner : « Halte ! »'), { odds: ['agilite', dcOf(tier), ['stealth', 'mobility']] }));
  if (pc.ptype !== 'aucun') L.push(C('Utiliser ton pouvoir pour passer', () => ctlRes(check('maitrise', dcOf(tier), ['stealth', 'control', 'mobility']), 'Ton pouvoir te couvre : le radar ne voit rien.', 'Ton pouvoir s’active et le radar hurle.'), { odds: ['maitrise', dcOf(tier), ['stealth', 'control', 'mobility']] }));
  if (haveFaux()) L.unshift(C('📄 Présenter tes faux papiers', () => { spendFaux(); ctlRes({ ok: true, r: 0, mod: 0, total: 0, dc: 0, parts: [], crit: false, fumble: false }, 'Les faux papiers passent le scanner. « Bon voyage. »', ''); }, { cls: 'safe', sub: 'Consomme 1 faux papier · réussite assurée' }));
  if (haveBrouil()) L.unshift(C('📡 Activer le brouilleur de radar', () => { spendBrouil(); ctlRes({ ok: true, r: 0, mod: 0, total: 0, dc: 0, parts: [], crit: false, fumble: false }, 'Le portique ne voit rien. Tu passes.', ''); }, { cls: 'safe', sub: 'Consomme 1 brouilleur · réussite assurée' }));
  L.push(C('Se battre', () => startCombat({ title: 'Contrôle de la F.A.', foes: foesFor('fa', Math.min(5, tier), 2), lethal: 'capture', intro: 'Les agents dégainent.', onWin: l => { show({ title: 'Voie libre', text: ['Les agents sont à terre, mais l’alerte est lancée.'], fx: [...l, ...fx({ heat: 6 })], choices: [C('Continuer', hub)] }); } }), { cls: 'danger' }));
  show({ kicker: 'Orbitrail — alerte', title: 'Contrôle de la Force d’Autorité', text: [`À ${esc(capName(G.loc))}, des agents et un portique à radar bloquent le quai. Le radar à géno réagit à l’ogénite que tu portes. ${st ? 'Ton signalement est connu.' : ''}`], choices: L });
}
function ctlRes(r, ok, ko) {
  if (r.ok) return show({ kicker: 'Contrôle', title: 'Tu passes', text: [ok, r.r ? checkLine(r) : ''], choices: [C('Continuer', hub)] });
  const L = fx({ heat: 4 }); const st = wantedStars();
  const foes = foesFor('fa', Math.min(5, st + 1), 2);
  show({ kicker: 'Contrôle', title: 'Repéré !', text: [ko, r.r ? checkLine(r) : '', 'Les agents se déploient !'], fx: L, choices: [C('Se battre', () => startCombat({ title: 'Contrôle de la F.A.', foes, lethal: 'capture', onWin: l => show({ title: 'Voie libre', text: ['Tu t’en sors, mais ça va se savoir.'], fx: l, choices: [C('Continuer', hub)] }) })), C('Fuir', () => { const rf = check('agilite', dcOf(st + 1), ['mobility']); if (rf.ok) pc.flags.escW = G.wk, show({ title: 'Échappé', text: ['Tu t’engouffres dans la foule et les couloirs de service.', checkLine(rf)], choices: [C('Continuer', hub)] }); else capturedScene('Les agents te plaquent au sol.'); }), C('Se rendre', () => capturedScene('Tu lèves les mains.'), { cls: 'danger' })] });
}

// ───────── Événements aléatoires ─────────
function randomTravelEvent() {
  if (!chance(0.32)) return null;
  const pool = [{ w: 3, f: climateEvent }, { w: 3, f: () => banditEvent() }, { w: 2, f: () => randomHubEvent(true) }, { w: 2, f: () => meetEvent() }];
  const e = wpick(pool, x => x.w); return e.f;
}
function climateEvent() {
  const t = CLIMATE ? pick(CLIMATE) : 'un dérèglement'; const tier = clamp(G.pc.grade + 1, 1, 4); const pc = G.pc;
  show({ kicker: 'Dérèglement de l’ogénite', title: 'Phénomène climatique', text: [`En chemin, tu tombes sur ${esc(t)}. Des gens sont piégés.`], choices: [
    C('Mettre ton pouvoir ou ton corps dans la balance', () => { const r = check('maitrise', dcOf(tier), ['control', 'defense', 'mobility']); advance(1); if (r.ok) show({ kicker: 'Dérèglement', title: 'Sauvés', text: ['Tu sauves tout ce que tu peux atteindre.', checkLine(r)], fx: fx({ xp: 25 + tier * 5, rep: { civils: 6 } }), choices: [C('Continuer', hub)] }); else show({ kicker: 'Dérèglement', title: 'Débordé', text: ['Le phénomène te dépasse. Tu es blessé et tu n’as sauvé que quelques-uns.', checkLine(r)], fx: fx({ hp: -rint(5, 12), xp: 10 }), choices: [C('Continuer', hub)] }); }, { odds: ['maitrise', dcOf(tier), ['control', 'defense', 'mobility']] }),
    C('Évacuer ce que tu peux avec une corde et du courage', () => { const r = check('corps', dcOf(tier), ['defense']); advance(1); if (r.ok) show({ title: 'Sauvés', text: ['Tu forces la chaîne humaine à tenir.', checkLine(r)], fx: fx({ xp: 20, rep: { civils: 4 } }), choices: [C('Continuer', hub)] }); else show({ title: 'Trop tard', text: ['Tu as fait ce que tu as pu.', checkLine(r)], fx: fx({ hp: -rint(4, 10) }), choices: [C('Continuer', hub)] }); }, { odds: ['corps', dcOf(tier), ['defense']] }),
    C('Contourner et continuer', hub)] });
}
function banditEvent() {
  const tier = clamp(G.pc.grade, 1, 4); const foes = [mkFoe('voyou', tier), mkFoe('voyou', tier)];
  show({ kicker: 'Mauvaise rencontre', title: 'Des pillards', text: ['Des maraudeurs bloquent la route : « Ton argent, ou ta vie. »'], choices: [C('Se battre', () => startCombat({ title: 'Pillards', foes, lethal: 'robbed', onWin: L => show({ title: 'Débarrassé', text: ['Les pillards fuient en laissant quelques bricoles.'], fx: [...L, ...fx({ money: rint(30, 120) })], choices: [C('Continuer', hub)] }) })), C('Payer (80 ¢)', () => { G.pc.money = Math.max(0, G.pc.money - 80); hub(); }, { req: { money: 80 } }), C('Les baratiner', () => { const r = check('charisme', dcOf(tier), ['social']); if (r.ok) show({ title: 'Passé', text: ['Ils te laissent filer.', checkLine(r)], choices: [C('Continuer', hub)] }); else startCombat({ title: 'Pillards', foes, lethal: 'robbed', onWin: L => hub() }); }, { odds: ['charisme', dcOf(tier), ['social']] })] });
}
function meetEvent() {
  const cs = DATA.chars.filter(c => { const n = G.world.npc[c.id]; return n.alive && n.st === 'free' && n.loc === G.loc && c.faction !== 'civils'; });
  if (!cs.length) return banditEvent(); const c = pick(cs);
  const friendly = (G.pc.rep[c.faction] || 0) >= 15;
  show({ kicker: F[c.faction].name, title: `${c.name} t’aborde`, text: [friendly ? `${esc(c.name)} (${esc(F[c.faction].name)}) te reconnaît et te salue : « Les amis de nos amis… »` : `${esc(c.name)} (${esc(F[c.faction].name)}) te dévisage. L’atmosphère est lourde.`, `Pouvoir : ${esc(charPowerText(c))}.`], choices: [C('Discuter', () => meetNpc(c.id)), friendly ? C('Demander un coup de main (+ objet)', () => show({ title: 'Un cadeau', text: [`${esc(c.name)} te glisse un paquet.`], fx: fx({ item: { [pick(['kit', 'capsule', 'nanosoin'])]: 1 }, rep: { [c.faction]: 1 } }), choices: [C('Continuer', hub)] })) : C('Le provoquer', () => startCombat({ title: c.name, foes: [mkFoe('porteur', clamp(c.stars, 1, 5), c.name, { cid: c.id })], lethal: 'robbed', onWin: L => show({ title: 'Duel', text: ['Il s’incline.'], fx: [...L, ...fx({ rep: { [c.faction]: -6 } })], choices: [C('Continuer', hub)] }) }), { cls: 'danger' }), C('Passer', hub)] });
}
function randomHubEvent(force) {
  const pc = G.pc; const st = wantedStars(); const pool = [];
  pool.push({ w: 3, f: () => { const l = stoneClueGain(); show({ kicker: 'Rumeur', title: 'Un vieux conteur', text: [l ? `Autour d’un feu, un vieux conteur murmure : « ${esc(l)} »` : 'Un vieux conteur parle de rois oubliés et de pierres muta.'], choices: [C('Continuer', hub)] }); } });
  pool.push({ w: 2, f: meetEvent });
  pool.push({ w: 2, f: banditEvent });
  pool.push({ w: 2, f: climateEvent });
  pool.push({ w: 2, f: () => show({ kicker: 'Marché Noir', title: 'Une offre', text: ['Un intermédiaire te glisse une carte : « Le Marché Noir aime les gens qui rendent service. Une information, 100 ¢… ou un service, plus tard. »'], choices: [C('Acheter l’information (100 ¢)', () => { const l = stoneClueGain(); show({ title: 'L’information', text: [l ? esc(l) : 'Rien de neuf, mais il te remercie.'], fx: fx({ money: -100, rep: { noir: 4 } }), choices: [C('Continuer', hub)] }); }, { req: { money: 100 } }), C('Refuser', hub)] }) });
  const calm = pc.flags.escW != null && G.wk - pc.flags.escW <= 5;
  if (st >= 1 && !calm) pool.push({ w: 3 + st, f: () => { const tier = clamp(st, 1, 4); show({ kicker: 'Traque', title: 'Un chasseur de primes', text: ['Un Fallen te suit depuis deux ruelles. L’implant sous sa nuque clignote.'], choices: [C('L’affronter', () => startCombat({ title: 'Chasseur Fallen', foes: [mkFoe('fallen', tier)], lethal: 'capture', onWin: L => show({ title: 'Abattu', text: ['Le Fallen s’effondre.'], fx: [...L, ...fx({ money: 100 * tier })], choices: [C('Continuer', hub)] }) })), C('Le semer', () => { const r = check('agilite', dcOf(tier), ['stealth', 'mobility']); if (r.ok) show({ title: 'Semé', text: ['Tu disparais par une trappe d’égout.', checkLine(r)], choices: [C('Continuer', hub)] }); else startCombat({ title: 'Chasseur Fallen', foes: [mkFoe('fallen', tier)], lethal: 'capture', onWin: L => hub() }); })] }); } });
  if (st >= 1 && !calm && pc.faction !== 'fa' && pc.ptype !== 'zoologique') pool.push({ w: 2, f: () => { const tier = clamp(st, 1, 4); show({ kicker: 'Radar à géno', title: 'Patrouille', text: ['Un Griffon survole le quartier. Ton ogénite réagit au radar.'], choices: [C('Te cacher', () => { const r = check('agilite', dcOf(tier), ['stealth']); if (r.ok) show({ title: 'Caché', text: ['Le drone passe sans te voir.', checkLine(r)], choices: [C('Continuer', hub)] }); else startCombat({ title: 'Griffon', foes: [mkFoe('griffon', tier), mkFoe('soldat', tier)], lethal: 'capture', onWin: L => hub() }); }, { odds: ['agilite', dcOf(tier), ['stealth']] }), C('L’abattre', () => startCombat({ title: 'Griffon', foes: [mkFoe('griffon', tier)], lethal: 'capture', onWin: L => show({ title: 'Abattu', text: ['Le drone s’écrase.'], fx: [...L, ...fx({ heat: 3 })], choices: [C('Continuer', hub)] }) }))] }); } });
  if (stoneCount() === 0 && pc.grade >= 1) pool.push({ w: 1, f: () => arenaInvite() });
  const e = wpick(pool, x => x.w); if (!e) return null; return force ? e.f : (chance(0.7) ? e.f : null);
}
function arenaInvite() {
  show({ kicker: 'L’ARENA', title: 'Un promoteur t’aborde', text: ['« Tu as de l’allure. Un combat, une bourse. L’ARENA paie bien. »'], choices: [C('Accepter de combattre', () => arenaTournament(1)), C('Refuser', hub)] });
}
