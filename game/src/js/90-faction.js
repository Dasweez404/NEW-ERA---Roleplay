// ───────── Factions : rejoindre, décisions, succession, direction, territoires ─────────
function ownedStates() { return DATA.states.filter(s => G.world.terr[s.id] === 'pc'); }
function factionMenu() {
  const pc = G.pc; const f = F[pc.faction]; const W = G.world; const L = [];
  if (pc.faction === 'civils') return joinMenu();
  const nxt = MERIT_STEPS[pc.grade + 1]; const lead = W.leader[pc.faction];
  L.push(C('Relations entre factions', () => relationGraph(), { ic: '🕸', sub: 'L’arbre géant : qui est allié ou ennemi, autour de la tienne.' }));
  if (pc.grade < 4) L.push(C(`Épreuve de grade (${gradeNames(pc)[pc.grade + 1]})`, () => { const o = promoOffer(); if (o) missionBrief(o); }, { req: { ok: () => pc.merit >= nxt ? null : `Il te faut ${nxt} de mérite (tu as ${pc.merit}) : fais des missions pour ta faction` }, sub: 'Réussis une mission d’épreuve : tu montes en grade, tu pèses plus, mais ta prime augmente aussi.' }));
  L.push(C('Réunion des décisions (conseil)', () => EVENT_FN.council(), { sub: pc.grade === 0 ? 'Recrue : tu n’as aucune voix au chapitre.' : `Ton niveau de décision : ${['aucun', 'voter', 'proposer', 'décider localement', 'décider en grand', 'trancher'][pc.grade]}.` }));
  if (pc.grade === 4) L.push(C('Prétendre à la tête de la faction', successionMenu, { sub: 'Relève, duel, attente ou fondation de ta propre faction.' }));
  squadTile(L);
  if (pc.grade >= 5) L.push(C('Diriger la faction', leaderMenu, { sub: 'Territoires, batailles, alliances, budget.', cls: 'safe' }));
  if (pc.faction === 'fallen' && pc.implant) L.push(C('Faire retirer l’implant', removeImplantMenu, { cls: 'danger' }));
  L.push(C('Fonder ta propre faction', foundFaction, { req: { grade: 3, money: 3000, party: 2, ok: () => pc.ownFaction ? 'Tu en diriges déjà une' : null }, sub: 'Nom, objectif, QG. Tu pars avec ton groupe : tu es le chef.' }));
  L.push(C('Quitter la faction', leaveFaction, { cls: 'danger', sub: 'Traître pour ses alliés.' }));
  L.push(C('← Retour', actionsMenu));
  const nm = lead === 'pc' ? 'toi' : lead && CH[lead] ? CH[lead].name : 'personne (vacant)';
  show({ extra: lead && lead !== 'pc' && CH[lead] ? portrait(lead, 110) : null, kicker: `Fondée en ${f.founded}`, title: f.name, text: [`Objectif : ${esc(f.goal)}`, `Chef : <b>${esc(nm)}</b> · ton grade : ${esc(gradeName())} ${'★'.repeat(pc.grade)} · mérite ${pc.merit}${nxt ? ' / ' + nxt : ''}.`, `<span class="mut">Puissance ${(W.fac[pc.faction] || { power: 10 }).power}/100 · trésorerie ${fmt((W.fac[pc.faction] || { money: 0 }).money)} ¢ · ${DATA.chars.filter(c => c.faction === pc.faction && W.npc[c.id].alive).length} membres vivants · QG : ${esc(stateName(f.hq))}${ownedStates().length ? ' · tes territoires : ' + ownedStates().map(s => esc(s.name)).join(', ') : ''}.</span>`], choices: L });
}
// ───────── Rejoindre une faction ─────────
function joinMenu() {
  const pc = G.pc; const L = [];
  Object.keys(F).filter(k => !['civils', 'fallen', 'noir', 'own'].includes(k)).sort((a, b) => (pc.rep[b] || 0) - (pc.rep[a] || 0)).forEach(fid => {
    const f = F[fid]; const rep = pc.rep[fid] || 0; const dc = (f.secret ? 19 : 14) - Math.floor(rep / 10) + (fid === 'fa' ? 2 : 0);
    L.push(C(`${f.name}${f.secret ? ' (secret)' : ''}`, () => joinFaction(fid, dc), { sub: `${f.goal} — réputation ${repLevel(rep)}`, odds: ['charisme', dc, ['social']], req: { ok: () => fid === 'fa' && pc.ptype !== 'aucun' ? 'La Force d’Autorité n’accepte que des gens sans pouvoir' : fid === 'omega' ? 'L’Omega Force recrute elle-même des enfants géno-porteurs' : null } }));
  });
  L.push(C('← Retour', actionsMenu)); show({ kicker: 'Affiliation', title: 'Rejoindre une faction', text: ['Tu es sans faction : une simple recrue d’aucun camp. Les 31 groupes recrutent… à leur manière. Un jet de charisme, ta réputation et ton pouvoir décident.'], choices: L });
}
function joinFaction(fid, dc) {
  const pc = G.pc; const r = check('charisme', dc, ['social']); advance(1); if (G.status !== 'play') return;
  if (!r.ok) return show({ kicker: F[fid].name, title: 'Refus', text: ['On ne te fait pas confiance. « Reviens quand tu auras fait tes preuves. »', checkLine(r)], fx: fx({ rep: { [fid]: -2 }, spill: false }), choices: [C('Continuer', hub)] });
  pc.faction = fid; pc.grade = 0; pc.merit = 0; pc.heat = Math.max(0, pc.heat); const L = fx({ rep: { [fid]: 15 } }); pc.heat = Math.max(pc.heat, minHeat());
  if (!isAnti(fid) && fid !== 'fa') pc.heat = 0; logEntry(`Tu rejoins ${F[fid].name}.`); G.board = null; recalc();
  show({ kicker: F[fid].name, title: 'Bienvenue', text: [`Tu es désormais <b>recrue</b> de ${esc(F[fid].name)}. En tant que recrue, tu n’as aucune voix dans les décisions. Fais tes preuves pour monter en grade.`, checkLine(r)], fx: L, choices: [C('Continuer', hub)] });
}
function leaveFaction() {
  const pc = G.pc; const old = pc.faction;
  show({ kicker: 'Départ', title: 'Quitter ' + F[old].name + ' ?', text: ['Tes ex-camarades ne te le pardonneront pas, et leurs alliés non plus.'], choices: [C('Partir quand même', () => { const L = fx({ rep: { [old]: -25 }, spill: true }); pc.faction = 'civils'; pc.merit = 0; pc.grade = 0; pc.implant = pc.implant; if (old === 'fa') pc.flags.defected = true; pc.heat = isAnti(old) ? pc.heat : Math.max(pc.heat, 10); G.board = null; recalc(); logEntry('Tu quittes ' + F[old].name + '.'); show({ title: 'Seul', text: ['Tu n’as plus de faction.'], fx: L, choices: [C('Continuer', hub)] }); }, { cls: 'danger' }), C('Rester', factionMenu)] });
}
// ───────── Succession / devenir chef ─────────
function successionMenu() {
  const pc = G.pc; const fid = pc.faction; const W = G.world; const lead = W.leader[fid]; const vac = pc.flags.vacant === fid || !lead; const L = [];
  const lc = lead && lead !== 'pc' ? CH[lead] : null; const nm = lc ? lc.name : 'le chef';
  L.push(C(`Être choisi comme la relève par ${nm}`, () => { const r = check('charisme', dcOf(4), ['social']); advance(2); if (G.status !== 'play') return; if (r.ok) becomeLeader(fid, `${esc(nm)} te désigne devant l’assemblée : « Elle est prête. »`, 'relève'); else show({ title: 'Pas encore', text: ['« Tu n’es pas prêt(e), » répond le chef.', checkLine(r)], choices: [C('Continuer', hub)] }); }, { odds: ['charisme', dcOf(4), ['social']], req: { ok: () => (pc.rep[fid] || 0) < 60 ? `Requiert 60 de réputation avec ${F[fid].name} (tu as ${pc.rep[fid] || 0})` : vac ? 'Il n’y a plus de chef à convaincre' : null }, sub: 'Voie pacifique : réputation, confiance, grade.' }));
  L.push(C(`Défier ${nm} en duel`, () => { startCombat({ title: `Duel pour la tête de ${F[fid].name}`, foes: [mkFoe('porteur', 5, lc ? lc.name + ' (chef)' : 'Le chef', { hp: 60, hpMax: 60, cid: lc ? lc.id : undefined })], lethal: 'death', canFlee: false, intro: 'Le cercle se referme. Tout le monde regarde.', onWin: l => { if (lc) { G.world.npc[lead].alive = false; newsPush(`${lc.name} est mort${lc.gender === 'F' ? 'e' : ''} en duel face à ${pc.name}.`); } L2 = fx({ rep: { [fid]: -10 } }); becomeLeader(fid, 'Le chef tombe. Les yeux se tournent vers toi, et personne ne bronche.', 'tué', l); } }); var L2; }, { cls: 'danger', req: { ok: () => vac ? 'Il n’y a plus de chef à défier' : null }, sub: 'Si tu gagnes, tu l’as tué : certains alliés du chef t’en voudront.' }));
  L.push(C('Éliminer le chef en secret', () => { const r = check('agilite', dcOf(5), ['stealth']); advance(2); if (G.status !== 'play') return; if (r.ok) { if (lc) { G.world.npc[lead].alive = false; newsPush(`${lc.name} est retrouvé mort dans des circonstances troubles.`); } becomeLeader(fid, 'Le chef est retrouvé mort. Personne ne sait. Tu hérites de la place.', 'tué', fx({ rep: { [fid]: -4 } })); } else { show({ title: 'Démasqué', text: ['Le chef t’a vu venir. Tu es exclu de la faction.', checkLine(r)], fx: fx({ rep: { [fid]: -50 }, heat: 6 }), choices: [C('Continuer', () => { pc.faction = 'civils'; pc.grade = 0; pc.merit = 0; G.board = null; hub(); })] }); } }, { cls: 'danger', odds: ['agilite', dcOf(5), ['stealth']], req: { ok: () => vac ? 'Il n’y a plus de chef' : null } }));
  L.push(C('Prendre la tête (le chef est mort)', () => becomeLeader(fid, 'Le fauteuil est vide. L’assemblée t’acclame.', 'mort'), { req: { ok: () => vac ? null : 'Le chef est toujours en vie' }, cls: 'safe' }));
  L.push(C('← Retour', factionMenu)); show({ kicker: 'Succession', title: 'La tête de ' + F[fid].name, text: ['« Soit tu es la relève, soit tu l’as tué, soit il est mort. » À toi de choisir.'], choices: L });
}
function becomeLeader(fid, text, how, extra) {
  const pc = G.pc; const W = G.world; W.leader[fid] = 'pc'; pc.grade = 5; pc.merit = Math.max(pc.merit, MERIT_STEPS[5]); delete pc.flags.vacant; recalc(); pc.hp = pc.hpMax; pc.heat = Math.max(pc.heat, minHeat()); G.board = null; G.score.leader = 1;
  splash({ title: 'CHEF', sub: F[fid].name, icon: '👑', color: '#ffe83a', ms: 2200 }); logEntry(`Tu deviens ${how === 'relève' ? 'la relève et ' : ''}le chef de ${F[fid].name}.`); newsPush(`${pc.name} prend la tête de ${F[fid].name}.`);
  show({ kicker: 'CHEF', title: `Tu diriges ${F[fid].name}`, text: [text, 'Tu décides de tout, tu es recherché sur toute la planète (prime ⭐⭐⭐⭐ pour les factions ANTI), et chaque mois, des décisions t’attendent. Menu « Ta faction → Diriger la faction ».'], fx: extra || [], choices: [C('Continuer', hub)] });
}
EVENT_FN.succession = function (fid) { show({ kicker: F[fid].name, title: 'Le chef est mort', text: [`${esc(F[fid].name)} n’a plus de chef. Tu es Bras droit : tu peux prendre la tête (menu Ta faction → Prétendre à la tête).`], choices: [C('Prendre la tête maintenant', () => becomeLeader(fid, 'Le fauteuil est vide. Tu t’y installes.', 'mort')), C('Plus tard', hub)] }); };
// ───────── Fonder sa propre faction ─────────
function restoreOwn() { const o = G.pc.ownFaction; if (o) F.own = Object.assign({}, o); }
function foundFaction() {
  const pc = G.pc; const inp = h('input', { type: 'text', maxlength: 28, placeholder: 'Nom de ta faction', value: '' });
  const sel = h('select', {}, ['Résistance (contre le Nouveau Régime)', 'Marché Noir (profit et contrebande)', 'Humanitaire (protéger les plus faibles)', 'Chaos (semer le trouble)'].map((t, i) => h('option', { value: i }, t)));
  show({ kicker: 'Fondation', title: 'Ta propre faction', text: ['Tu pars avec ton groupe et 3000 ¢ de caisse. Tu en seras le chef, mais tu rompras avec ton ancienne faction.'], extra: h('div', {}, h('div', {}, 'Nom : ', inp), h('div', { style: 'margin-top:8px' }, 'Orientation : ', sel)), choices: [C('Fonder', () => { const nm = (inp.value || '').trim() || 'Les Indépendants'; doFound(nm, +sel.value); }), C('Annuler', factionMenu)] });
}
function doFound(name, kind) {
  const pc = G.pc; const old = pc.faction; const al = [['uplift', 'vigilante', 'clairobscur'], ['arena', 'check', 'galleon'], ['siha', 'hem', 'umami'], ['necropunks', 'slummer']][kind]; const en = [['fa', 'optimum'], ['fa', 'uplift'], ['slummer', 'manacorp'], ['fa', 'vigilante']][kind];
  pc.money -= 3000; const L = fx({ rep: { [old]: -20 }, spill: true }); const f = { id: 'own', letter: '', name, desc: 'Une faction fondée par ' + pc.name + '.', founded: dateOf(G.wk).y, hqText: stateName(G.loc), perception: 'Nouvelle venue', goal: ['Renverser le Nouveau Régime', 'S’enrichir et alimenter le Marché Noir', 'Protéger les plus démunis', 'Survivre et semer le chaos'][kind], hq: G.loc, leaders: [], anti: true, secret: false, lore: '', allies: al, enemies: en };
  F.own = f; pc.ownFaction = Object.assign({}, f); G.world.fac.own = { power: 12 + pc.party.length * 4, money: 800, terr: [], war: {}, ally: {} }; G.world.leader.own = 'pc';
  pc.faction = 'own'; pc.grade = 5; pc.merit = MERIT_STEPS[5]; pc.rep.own = 100; pc.heat = Math.max(pc.heat, 60); G.board = null; recalc(); logEntry(`Tu fondes ${name}.`);
  show({ kicker: 'FONDATION', title: name, text: ['Un nom, une adresse, une poignée de fidèles. C’est le début d’une faction.', 'Plus tu recruteras et conquerras de territoires, plus ta puissance grandira.'], fx: L, choices: [C('Continuer', hub)] });
}
// ───────── Direction de faction (grade 5) ─────────
function leaderMenu() {
  const pc = G.pc; const W = G.world; const wf = W.fac[pc.faction] || (W.fac[pc.faction] = { power: 15, money: 0, terr: [], war: {}, ally: {} }); const terr = ownedStates(); const L = [];
  L.push(C('Attaquer un territoire', attackMenu, { sub: 'Prendre le contrôle d’un État (revenu mensuel, score).', req: { money: 300 } }));
  L.push(C('Fortifier un territoire (400 ¢)', () => { const s = pick(terr); if (!s) return; wf.power = Math.min(100, wf.power + 2); pc.money -= 400; show({ kicker: 'Fortification', title: 'Défenses renforcées', text: [`Tu fais fortifier ${esc(s.name)} : sa défense augmente.`], choices: [C('Continuer', leaderMenu)] }); }, { req: { money: 400, ok: () => terr.length ? null : 'Tu ne contrôles aucun territoire' } }));
  L.push(C('Recrutement massif (600 ¢)', () => { pc.money -= 600; wf.power = Math.min(100, wf.power + 6); advance(2); show({ kicker: 'Recrutement', title: 'Une vague de recrues', text: ['Des dizaines d’anonymes rejoignent ta faction.'], fx: fx({ xp: 20 }), choices: [C('Continuer', leaderMenu)] }); }, { req: { money: 600 } }));
  L.push(C('Diplomatie : alliance ou guerre', diplomacy));
  L.push(C('Frapper la Force d’Autorité (assaut sur une base de zone)', assaultFA, { cls: 'danger', req: { ok: () => G.world.era === 'newera' ? 'Le Nouveau Régime est tombé' : wf.power < 30 ? `Ta puissance est insuffisante (${wf.power}/30)` : pc.party.length < 2 ? 'Il te faut au moins 2 alliés' : null } }));
  L.push(C('Lever des fonds (taxer, contrebande)', () => { advance(1); if (G.status !== 'play') return; const g = rint(400, 900) + terr.length * 150; show({ kicker: 'Budget', title: 'Levée de fonds', text: ['Tes lieutenants collectent « les contributions ».'], fx: fx({ money: g, rep: { civils: -3, noir: 3 } }), choices: [C('Continuer', leaderMenu)] }); }));
  L.push(C('← Retour', factionMenu));
  show({ kicker: F[pc.faction].name, title: 'Diriger la faction', text: [`Puissance : <b>${wf.power}/100</b>. Territoires : <b>${terr.length}</b> (${terr.map(s => esc(s.name)).join(', ') || 'aucun'}). Ta prime : ${starStr(wantedStars())}.`, 'Chef, tu tranches. Les ennemis de ta faction deviennent les tiens, et réciproquement.'], choices: L });
}
function neighbors(stateId) { const st = stationOf(stateId); const out = new Set(); (OT.adj[st] || []).forEach(e => out.add(OT_ST[e.to][3])); return [...out]; }
function attackMenu() {
  const pc = G.pc; const W = G.world; const mine = new Set([...ownedStates().map(s => s.id), F[pc.faction].hq]); const cand = new Set();
  mine.forEach(s => neighbors(s).forEach(n => { if (W.terr[n] !== 'pc') cand.add(n); })); mine.forEach(s => { if (W.terr[s] !== 'pc') cand.add(s); });
  const L = [...cand].map(sid => { const o = W.terr[sid]; const nm = o === 'fa' ? 'Force d’Autorité' : F[o] ? F[o].name : o; const tier = o === 'fa' ? 4 : stoneTier(o); return C(`${S[sid].name} — tenu par ${nm}`, () => attackTerritory(sid, o, tier), { sub: `Difficulté ${stars(tier)} · coût 300 ¢`, req: { money: 300 } }); });
  L.push(C('← Retour', leaderMenu)); show({ kicker: 'Offensive', title: 'Quel territoire attaquer ?', text: ['Tu peux attaquer les États voisins de ton QG ou de tes territoires (par l’Orbitrail).'], choices: L });
}
function attackTerritory(sid, owner, tier) {
  const pc = G.pc; const W = G.world; const wf = W.fac[pc.faction]; pc.money -= 300;
  const foes = owner === 'fa' ? [mkFoe('soldat', Math.min(5, tier)), mkFoe('centaure', Math.min(5, tier)), mkFoe(tier >= 4 ? 'cyclope' : 'droide', Math.min(5, tier))] : foesFor(owner, Math.min(5, tier), 3);
  const orig = hitBuffInit();
  startCombat({ title: `Bataille pour ${S[sid].name}`, foes, lethal: owner === 'fa' ? 'capture' : lethalOf(owner), intro: `Ta faction passe à l’offensive à ${capName(sid)}.`, onWin: L => { W.terr[sid] = 'pc'; wf.power = Math.min(100, wf.power + 4); G.score.terr = Math.max(G.score.terr || 0, ownedStates().length); newsPush(`${F[pc.faction].name} contrôle désormais ${S[sid].name}.`); advance(1); show({ kicker: 'VICTOIRE', title: `${S[sid].name} est à toi`, text: [`Ton drapeau flotte sur ${esc(capName(sid))}. Le territoire rapportera 120 ¢ par mois. La F.A. et les rivaux voudront le reprendre.`], fx: [...L, ...fx({ rep: { [owner === 'fa' ? 'civils' : owner]: owner === 'fa' ? 4 : -8 }, heat: 4, xp: 30 })], choices: [C('Continuer', leaderMenu)] }); } });
  if (CB) CB.hitBuff = Math.floor(wf.power / 25);
}
function hitBuffInit() { return 0; }
function assaultFA() {
  const pc = G.pc; const W = G.world; const wf = W.fac[pc.faction]; advance(1); if (G.status !== 'play') return;
  const foes = [mkFoe('prometh', 5), mkFoe('centaure', 5), mkFoe('soldat', 5), mkFoe('harpie', 4)];
  startCombat({ title: 'Assaut sur une base de zone de la F.A.', foes, lethal: 'capture', intro: 'Les sirènes hurlent : tes troupes enfoncent les portes.', onWin: L => { const loot = rint(2000, 3500); wf.power = Math.min(100, wf.power + 8); W.fac.fa.power = Math.max(10, W.fac.fa.power - 6); const s = pick(DATA.states.filter(x => W.terr[x.id] === 'fa')); if (s) { W.terr[s.id] = 'pc'; newsPush(`${F[pc.faction].name} prend ${s.name} d’assaut.`); } newsPush(`Une base de la Force d’Autorité est tombée.`); show({ kicker: 'VICTOIRE', title: 'Une base de la F.A. a chuté', text: ['Les mechas sont à terre. L’annonce fera le tour de la planète.'], fx: [...L, ...fx({ money: loot, heat: 10, xp: 120, rep: { fa: -15 } })], choices: [C('Continuer', leaderMenu)] }); } });
  if (CB) CB.hitBuff = Math.floor(wf.power / 25);
}
function diplomacy() {
  const pc = G.pc; const W = G.world; const me = pc.faction; const L = [];
  Object.keys(F).filter(f => f !== me && !['civils', 'fallen', 'noir', 'own'].includes(f)).forEach(fid => {
    const rel = relation(me, fid);
    if (rel >= 2) L.push(C(`${F[fid].name} : allié`, () => { const r = check('charisme', dcOf(3), ['social']); if (r.ok) { setRel(me, fid, 0); show({ title: 'Alliance rompue', text: ['L’alliance est dissoute, à l’amiable.'], fx: fx({ rep: { [fid]: -10 } }), choices: [C('Continuer', diplomacy)] }); } else show({ title: 'Refusé', text: ['Ils ne veulent pas rompre.'], choices: [C('Continuer', diplomacy)] }); }, { sub: 'Rompre l’alliance' }));
    else if (rel === 0) L.push(C(`Proposer une alliance à ${F[fid].name}`, () => { const dc = dcOf(3) - Math.floor((pc.rep[fid] || 0) / 10); const r = check('charisme', dc, ['social', 'strat']); advance(1); if (r.ok) { setRel(me, fid, 2); show({ kicker: 'Alliance', title: 'Alliance conclue', text: [`${esc(F[fid].name)} et ${esc(F[me].name)} s’allient.`, checkLine(r)], fx: fx({ rep: { [fid]: 12 }, xp: 25 }), choices: [C('Continuer', diplomacy)] }); } else show({ title: 'Refus poli', text: ['Pas maintenant.', checkLine(r)], choices: [C('Continuer', diplomacy)] }); }, { odds: ['charisme', dcOf(3) - Math.floor((pc.rep[fid] || 0) / 10), ['social', 'strat']], req: { ok: () => (pc.rep[fid] || 0) < -20 ? 'Ils te détestent' : null } }));
    if (rel > -2) L.push(C(`Déclarer la guerre à ${F[fid].name}`, () => { setRel(me, fid, -2); show({ title: 'Guerre', text: [`${esc(F[fid].name)} est désormais ton ennemi juré.`], fx: fx({ rep: { [fid]: -40 }, xp: 10 }), choices: [C('Continuer', diplomacy)] }); }, { cls: 'danger' }));
  });
  L.push(C('← Retour', leaderMenu)); show({ kicker: 'Diplomatie', title: 'Alliances et guerres', text: ['Les alliés de tes alliés t’apprécient ; les alliés de tes ennemis te détestent.'], choices: L.slice(0, 40) });
}
function setRel(a, b, v) { G.world.rel = G.world.rel || {}; G.world.rel[a + '|' + b] = v; G.world.rel[b + '|' + a] = v; }
EVENT_FN.terrAttack = function () {
  const pc = G.pc; const terr = ownedStates(); if (!terr.length) return hub(); const s = pick(terr); const att = G.world.era === 'newera' ? pick(Object.keys(F).filter(f => isAnti(f))) : chance(0.6) ? 'fa' : pick(Object.keys(F).filter(f => isAnti(f) && f !== pc.faction)); const tier = 3;
  show({ kicker: 'Territoire attaqué', title: `${S[s.id].name} est attaqué`, text: [`${att === 'fa' ? 'La Force d’Autorité' : esc(F[att].name)} contre-attaque à ${esc(capName(s.id))}.`], choices: [C('Aller défendre en personne', () => startCombat({ title: `Défense de ${S[s.id].name}`, foes: att === 'fa' ? [mkFoe('soldat', tier), mkFoe('centaure', tier)] : foesFor(att, tier, 2), lethal: att === 'fa' ? 'capture' : lethalOf(att), onWin: L => show({ title: 'Territoire tenu', text: ['L’assaut est repoussé.'], fx: [...L, ...fx({ xp: 30 })], choices: [C('Continuer', hub)] }), onLose: () => { G.world.terr[s.id] = att; defeatOutcome(att === 'fa' ? 'capture' : 'robbed', 'Tu perds le territoire.'); } })), C('Déléguer à ton stratège', () => { const r = check('intellect', dcOf(tier), ['strat']); if (r.ok) show({ title: 'Tenu', text: ['Tes lieutenants tiennent bon.', checkLine(r)], choices: [C('Continuer', hub)] }); else { G.world.terr[s.id] = att; show({ title: 'Perdu', text: [`${esc(S[s.id].name)} tombe.`, checkLine(r)], choices: [C('Continuer', hub)] }); } }, { odds: ['intellect', dcOf(tier), ['strat']] }), C('Abandonner le territoire', () => { G.world.terr[s.id] = att; hub(); }, { cls: 'danger' })] });
};
// ───────── Conseil : décisions de faction (accès selon le grade) ─────────
EVENT_FN.council = function () {
  const pc = G.pc; const fid = pc.faction; const f = F[fid]; const g = pc.grade; const wf = G.world.fac[fid] || { power: 15, money: 0 };
  if (g === 0) return show({ kicker: f.name, title: 'Réunion de ta faction', text: [`${esc(leaderName(fid))} et les cadres tranchent sans toi : tu écoutes au fond de la salle. En tant que recrue, tu n’as aucune voix.`], choices: [C('Voter', () => { }, { req: { grade: 1 } }), C('Proposer un plan', () => { }, { req: { grade: 2 } }), C('Décider', () => { }, { req: { grade: 3 } }), C('Écouter et retenir (+XP)', () => { show({ title: 'Tu apprends', text: ['Tu retiens les noms, les rapports de force, les petites vengeances.'], fx: fx({ xp: 8 }), choices: [C('Continuer', hub)] }); }, { cls: 'safe' })] });
  const topics = [
    { t: 'Prochaine cible', d: `Le conseil de ${f.name} doit choisir la prochaine cible.`, o: [['Voter pour l’offensive contre le Nouveau Régime', 1, () => ({ rep: { fa: -6 }, merit: 5, heat: 2 }), 'La faction frappe la F.A. Ta voix a compté.'], ['Proposer de frapper un rival du Marché Noir', 2, () => ({ rep: { noir: -6 }, merit: 7, xp: 20 }), 'Ton plan est adopté.'], ['Décider d’une opération de grande ampleur', 3, () => ({ merit: 10, xp: 40, heat: 4, money: -300 }), 'Tu lances toi-même l’opération.']] },
    { t: 'Budget', d: 'Il reste des fonds. À quoi les consacrer ?', o: [['Voter pour l’armement', 1, () => ({ merit: 4, xp: 10 }), 'La faction s’arme.'], ['Proposer d’investir dans les abris et soins', 2, () => ({ rep: { civils: 6 }, merit: 6 }), 'Les quartiers voisins te remercient.'], ['Décider d’un budget de recherche (pistes de pierres antiques)', 3, () => ({ merit: 8, xp: 10, _clue: true }), 'Les chercheurs reviennent avec un indice.']] },
    { t: 'Dissension', d: 'Deux lieutenants s’affrontent sur la stratégie. Le conseil se tourne vers toi.', o: [['Voter pour l’aile dure', 1, () => ({ merit: 3, rep: { fa: -3 } }), 'L’aile dure l’emporte.'], ['Proposer un compromis', 2, () => ({ merit: 7, xp: 15 }), 'Un compromis boiteux, mais ça tient.'], ['Trancher et exclure l’un des deux', 3, () => ({ merit: 6, xp: 10, rep: { [fid]: -3 } }), 'Tu exclus un lieutenant : la faction obéit, mais murmure.']] },
    { t: 'Offre du Nouveau Régime', d: 'Un émissaire propose l’amnistie à la faction en échange de noms.', o: [['Voter pour refuser', 1, () => ({ merit: 4, rep: { [fid]: 2 } }), 'La faction refuse.'], ['Proposer de lui livrer de faux noms', 2, () => ({ merit: 8, xp: 20, rep: { fa: 2 } }), 'Tu prends l’émissaire à son propre piège.'], ['Décider d’accepter et livrer un rival (trahison !)', 3, () => ({ merit: 6, money: 600, rep: { [fid]: -8, fa: 6 }, heat: -6 }), 'Tu vends un rival. Les alliés de ta victime t’en voudront.']] },
  ];
  const tp = pick(topics);
  const L = tp.o.map(([lab, mg, eff, res]) => C(`${lab}${mg > 1 ? '' : ''}`, () => { const e = eff(); const clue = e._clue; delete e._clue; const L2 = fx(Object.assign({}, e)); if (clue) { const l = stoneClueGain(); if (l) L2.push({ t: 'Piste : ' + l, c: 'acc' }); } advance(1); if (G.status !== 'play') return; wf.power = Math.min(100, (wf.power || 0) + 1); show({ kicker: f.name, title: 'Décision prise', text: [res], fx: L2, choices: [C('Continuer', hub)] }); }, { req: { grade: mg }, sub: `Niveau requis : ${['', 'voter', 'proposer', 'décider', 'décider', 'trancher'][mg]}` }));
  L.push(C('S’abstenir', hub));
  show({ kicker: `${f.name} · ${gradeName()}`, title: `Conseil : ${tp.t}`, text: [esc(tp.d), `Plus ton grade est élevé, plus ta voix pèse : tu peux ${g >= 3 ? 'décider' : g >= 2 ? 'proposer' : 'voter'}.`], choices: L });
};
