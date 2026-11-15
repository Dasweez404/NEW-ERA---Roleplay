// ───────── Pierres antiques : enquête, temples, détenteurs ─────────
function stoneClueGain() {
  const W = G.world; const unk = DATA.stones.filter(s => !G.pc.stones[s.id] && !W.stoneClue[s.id]);
  if (!unk.length) return null; const s = pick(unk); W.stoneClue[s.id] = true;
  const hold = W.stoneHolder[s.id]; const where = stateName(W.stoneLoc[s.id]);
  logEntry(`Piste : pierre de ${s.name} (${where}).`);
  return hold === 'temple' ? `la pierre de ${s.name} dormirait dans un temple caché, du côté de ${where}.` : hold === 'pnj-levant' ? `la pierre de ${s.name} serait aux mains d’un descendant du peuple du feu, à ${where}.` : hold === 'vigilante' ? `la pierre de ${s.name} est passée à la Vigilante Squad (${where}).` : `la pierre de ${s.name} est détenue par ${F[hold] ? F[hold].name : hold}, du côté de ${where}.`;
}
const repF = h => F[h] ? h : 'civils';
function holderName(h) { return h === 'temple' ? 'aucun (temple caché)' : h === 'pnj-levant' ? 'le descendant du peuple du feu' : h === 'pc' ? 'toi' : F[h] ? F[h].name : h; }
function stoneTier(hid) { if (hid === 'temple') return 3; if (hid === 'fa') return 5; if (hid === 'pnj-levant') return 2; const p = G.world.fac[hid] ? G.world.fac[hid].power : 40; return clamp(Math.round(p / 22) + 1, 2, 5); }

function stoneMenu() {
  const pc = G.pc; const W = G.world; const L = [];
  L.push(C('Mener l’enquête (1 semaine)', () => { advance(1); if (G.status !== 'play') return; const dc = 14 + Math.min(4, stoneCount()); const tags = ['scout', 'relic']; const r = check('intellect', dc, tags, ((pc.rep.artefactors || 0) >= 20 ? 2 : 0) + PK('clue')); if (r.ok) { const l = stoneClueGain(); show({ kicker: 'Enquête', title: l ? 'Une piste' : 'Tout est déjà éclairci', text: [l ? esc(cap(l)) : 'Tu connais déjà tous les détenteurs.', checkLine(r)], fx: fx({ xp: 15 }), choices: [C('Continuer', stoneMenu)] }); } else show({ kicker: 'Enquête', title: 'Rien de concluant', text: ['Des archives incomplètes, des témoins qui se rétractent.', checkLine(r)], choices: [C('Continuer', stoneMenu)] }); }, { odds: ['intellect', 14 + Math.min(4, stoneCount()), ['scout', 'relic']], sub: 'Le Lecteur de glyphes, le rôle d’éclaireur et l’amitié des Artefactors aident.' }));
  DATA.stones.forEach(s => {
    if (pc.stones[s.id]) return;
    const known = !!W.stoneClue[s.id]; const hold = W.stoneHolder[s.id]; const loc = W.stoneLoc[s.id];
    if (!known) return;
    if (G.loc !== loc) { const r = otRoute(G.loc, loc); L.push(C(`Pierre de ${s.name} — rends-toi à ${capName(loc)}`, () => travelMenu(loc), { ic: '🚆', sub: `${holderName(hold)} (${stateName(loc)}) · ${r ? r.hops + ' arrêt(s) · ' + r.cost + ' ¢ en Orbitrail' : 'trajet indisponible'} · touche pour y aller` })); }
    else L.push(C(`Pierre de ${s.name} — ${holderName(hold)} (${stateName(loc)})`, () => stoneAttempt(s.id), { sub: `Difficulté ${stars(stoneTier(hold))}` }));
  });
  L.push(C('Lire les glyphes déjà déchiffrés', glyphLib));
  L.push(C('← Retour', actionsMenu));
  show({ kicker: 'Pierres antiques', title: `Les 16 pierres — ${stoneCount()}/16`, text: [`« Il y a longtemps, 16 civilisations de géno-porteurs se partageaient 16 éclats appelés <i>pierres muta</i>. » Les réunir toutes met fin à la partie : <b>victoire</b>. Plus tu en as, plus tu es puissant — et plus on te traque.`, 'Seules les pistes connues apparaissent dans la liste. Enquête, fouille, tends l’oreille.'], extra: h('div', { class: 'stones' }, DATA.stones.map(s => h('div', { class: 'stone' + (pc.stones[s.id] ? ' have' : ''), style: `background:${s.color};color:${s.color}` }, h('span', { style: 'color:#000' }, s.order)))), choices: L });
}
function glyphLib() {
  const L = DATA.stones.filter(s => G.pc.stones[s.id]).map(s => C(`${s.order}. Pierre de ${s.name}`, () => show({ kicker: `${s.order}. ${s.name}`, title: `Royaume de ${s.name} — ${s.ruler}`, text: [`Origine : ${esc(s.origin)} · Spécialité : ${esc(s.spec)} · Clan de ${s.clan === 'bidh' ? 'Bidh' : 'Kaos'}.`, `<div class="glyph">${esc(s.glyph)}</div>`, `<span class="mut">Anciens détenteurs : ${esc(s.holders)}</span>`, `<span class="mut">Lecture des héros : ${esc(s.heroes)}</span>`], choices: [C('← Retour', glyphLib)] })));
  L.push(C('← Retour', stoneMenu)); show({ kicker: 'Glyphes', title: 'Glyphes déchiffrés', text: L.length > 1 ? [] : ['Tu n’as encore déchiffré aucun glyphe : il faut posséder la pierre.'], choices: L });
}
function stoneAttempt(id) {
  const s = STONE[id]; const W = G.world; const hold = W.stoneHolder[id]; const pc = G.pc; const tier = stoneTier(hold); const dc = dcOf(tier);
  if (hold === 'temple') return templeExpedition(id);
  const hn = holderName(hold); const rep = pc.rep[hold] || 0; const L = [];
  const minGrade = hold === 'fa' ? 3 : hold === 'arena' || hold === 'manacorp' || hold === 'gamma' ? 2 : 0;
  L.push(C(`Voler discrètement la pierre`, () => stoneSteal(id, tier, dc), { odds: ['agilite', dc, ['stealth', 'mobility']], req: { grade: minGrade }, cls: 'risk', sub: 'Si ça échoue, ils te tombent dessus.' }));
  if (hold !== 'fa') L.push(C('Convaincre le détenteur de te la confier ou de te l’échanger', () => stoneTalk(id, tier), { odds: ['charisme', dc - Math.floor(rep / 12), ['social']], req: { ok: () => rep < -15 ? 'Ils te détestent : impossible de négocier' : (pc.faction === hold ? null : null) }, sub: rep >= 40 ? 'Ils t’aiment bien : tes chances sont bonnes.' : 'Une réputation solide avec eux aide beaucoup.' }));
  L.push(C('Rendre d’abord un service important au détenteur', () => { const o = genOffer(hold === 'fa' || hold === 'pnj-levant' ? 'civils' : hold, Math.min(5, tier), {}); o.favor = id; missionBrief(o); }, { sub: 'Une mission pour eux : +réputation, qui débloque la négociation.', req: { ok: () => hold === 'fa' ? 'La Force d’Autorité ne confie jamais une pierre' : null } }));
  L.push(C('Prendre la pierre par la force', () => stoneAssault(id, tier), { cls: 'danger', req: { grade: minGrade }, sub: 'Combat contre les gardiens de la pierre.' }));
  L.push(C('← Retour', stoneMenu));
  show({ kicker: `Pierre de ${s.name}`, title: `Chez ${hn}`, text: [`La pierre de ${esc(s.name)} (royaume ${esc(s.ruler)}) est ${hold === 'pnj-levant' ? 'entre les mains d’un descendant du peuple du feu' : 'gardée par ' + esc(hn)} à ${esc(capName(W.stoneLoc[id]))}.`, `<span class="mut">Ton lien avec ${esc(hn)} : ${repLevel(rep)} (${rep}).</span>`], choices: L });
}
function stoneWin(id, lines, extra) {
  const L = [...(extra || []), ...fx({ stone: id })]; const s = STONE[id];
  const txt = [...lines.filter(x => typeof x === 'string'), `<div class="glyph">« ${esc(s.glyph)} »</div>`, `<span class="mut">Les anciens détenteurs y lisaient : ${esc(s.holders)}</span>`, `<span class="mut">Et toi, tu en déduis : ${esc(s.heroes)}</span>`];
  if (stoneCount() >= 16) return endGame('win', '');
  show({ kicker: 'PIERRE ANTIQUE', title: `La pierre de ${s.name} est à toi !`, text: txt, fx: L, choices: [C('Continuer', hub)] });
}
function stoneSteal(id, tier, dc) {
  const hold = G.world.stoneHolder[id]; const r = check('agilite', dc, ['stealth', 'mobility']); advance(1); if (G.status !== 'play') return;
  if (r.ok) return stoneWin(id, ['Tu t’introduis dans le coffre, remplaces la pierre par un caillou peint et disparais.', checkLine(r)], fx({ rep: { [repF(hold)]: -8 }, heat: 4 }));
  startCombat({ title: `Gardiens de ${holderName(hold)}`, foes: guardsOf(hold, tier), lethal: lethalOf(hold), intro: 'L’alarme retentit : on t’a vu avec la pierre en main !', onWin: L => stoneWin(id, ['Tu as dû te battre, mais tu repars avec la pierre.'], [...L, ...fx({ rep: { [repF(hold)]: -15 }, heat: 6 })]), onFlee: () => show({ title: 'En fuite', text: ['Tu t’enfuis les mains vides.'], fx: fx({ rep: { [repF(hold)]: -8 }, heat: 4 }), choices: [C('Continuer', hub)] }) });
}
function stoneTalk(id, tier, bypassRep) {
  const hold = G.world.stoneHolder[id]; const rep = G.pc.rep[hold] || 0; const dc = dcOf(tier) - Math.floor(rep / 12);
  const r = check('charisme', dc, ['social']); advance(1); if (G.status !== 'play') return;
  if (r.ok && (rep >= 30 || r.crit || G.pc.flags['favor_' + id])) return stoneWin(id, [`${esc(holderName(hold))} t’écoute jusqu’au bout, puis te remet la pierre : « Tu la protégeras mieux que nous. »`, checkLine(r)], fx({ rep: { [repF(hold)]: 3 }, xp: 40 }));
  if (r.ok) return show({ kicker: 'Négociation', title: 'Ils veulent des preuves', text: ['On t’écoute, mais on ne confie pas une pierre à un inconnu. « Rends-nous service d’abord. »', checkLine(r)], fx: fx({ rep: { [repF(hold)]: 4 } }), choices: [C('Continuer', stoneMenu)] });
  show({ kicker: 'Négociation', title: 'Refus', text: ['Ils ne veulent rien entendre.', checkLine(r)], fx: fx({ rep: { [repF(hold)]: -3 } }), choices: [C('Continuer', stoneMenu)] });
}
function guardsOf(hold, tier) { const n = tier >= 4 ? 3 : 2; const g = hold === 'fa' ? [mkFoe('atlas', 5), mkFoe('soldat', 5), mkFoe('centaure', 4)].slice(0, n) : (hold === 'pnj-levant' || hold === 'temple' || !F[hold]) ? foesFor('civils', tier, 2) : foesFor(hold, Math.min(5, tier), n); if (tier >= 4 && hold !== 'fa') { const c = G.world.leader[hold] && CH[G.world.leader[hold]]; if (c) g.push(mkFoe('porteur', Math.min(5, tier), c.name + ' (chef)', { cid: c.id })); } return g; }
function stoneAssault(id, tier) {
  const hold = G.world.stoneHolder[id];
  startCombat({ title: `Assaut : ${holderName(hold)}`, foes: guardsOf(hold, tier), lethal: lethalOf(hold), intro: `Tu fonces sur les gardiens de la pierre de ${STONE[id].name}.`, onWin: L => stoneWin(id, ['Les gardiens à terre, la pierre est à toi.'], [...L, ...fx({ rep: { [repF(hold)]: -25 }, heat: 8 })]) });
}
function templeExpedition(id) {
  const s = STONE[id]; const pc = G.pc; const steps = ['Les glyphes de l’entrée', 'Les mécanismes du temple', 'Le gardien du royaume'];
  const run = (i, wins) => {
    if (i >= 3) { if (wins >= 2) return stoneWin(id, [`Au cœur du temple du royaume de ${esc(s.name)}, la pierre repose sur son autel, intacte, chaude, vivante.`]); return show({ kicker: 'Temple', title: 'Expédition ratée', text: ['Le temple garde son secret. Tu devras revenir, mieux préparé.'], fx: fx({ hp: -rint(5, 12), xp: 15 }), choices: [C('Continuer', hub)] }); }
    const opts = [
      [['Déchiffrer les glyphes', 'intellect', ['scout', 'relic'], 'Le glyphe s’illumine sous tes doigts.', 'Les symboles te résistent.'], ['Forcer le passage avec ton pouvoir', 'maitrise', ['control', 'combat', 'mobility'], 'Ton pouvoir fait céder la pierre.', 'Ton pouvoir s’emballe contre les murs.'], ['Fouiller à la force des bras', 'corps', ['defense'], 'Tu déplaces la dalle à mains nues.', 'La dalle t’écrase une main.']],
      [['Désamorcer les mécanismes', 'intellect', ['tech'], 'Un à un, les engrenages se figent.', 'Un piège se déclenche.'], ['Passer par les failles', 'agilite', ['mobility', 'stealth'], 'Tu esquives chaque lame.', 'Une lame te frôle.'], ['Laisser tes alliés ouvrir la voie', 'charisme', ['ally', 'social'], 'Ton équipe te couvre.', 'Ton équipe se disperse.']],
      [['Affronter le gardien (combat)', 'corps', ['combat'], 'Le gardien de pierre se brise.', 'Le gardien te repousse.'], ['Apaiser le gardien (rites du royaume)', 'charisme', ['social', 'relic'], 'Le gardien s’efface devant toi.', 'Le gardien s’enrage.'], ['Le piéger avec ton pouvoir', 'maitrise', ['control', 'combat'], 'Ton pouvoir l’immobilise.', 'Ton pouvoir glisse sur sa pierre.']],
    ][i];
    show({ kicker: `Temple du royaume de ${s.name} — épreuve ${i + 1}/3`, title: steps[i], text: [`Le temple est un dédale de pierre. Il faut franchir 3 épreuves (2 réussites suffisent). Réussites : ${wins}.`], choices: opts.map(o => C(o[0], () => { const r = check(o[1], dcOf(3), o[2]); advance(1); if (G.status !== 'play') return; show({ kicker: 'Temple', title: r.ok ? 'Réussi' : 'Raté', text: [r.ok ? o[3] : o[4], checkLine(r)], fx: r.ok ? [] : fx({ hp: -rint(2, 6) }), choices: [C('Continuer', () => { if (pc.hp <= 0) pc.hp = 1; run(i + 1, wins + (r.ok ? 1 : 0)); })] }); }, { odds: [o[1], dcOf(3), o[2]] })) });
  };
  run(0, 0);
}

// ───────── Menaces sur les pierres ─────────
EVENT_FN.stoneRaid = function () {
  const pc = G.pc; const n = stoneCount(); if (!n) return hub();
  const sid = pick(Object.keys(pc.stones)); const tier = clamp(Math.ceil(n / 3) + 1, 2, 5); const att = n >= 6 && G.world.era !== 'newera' ? 'fa' : pick(Object.keys(F).filter(f => isAnti(f) && f !== pc.faction && relation(pc.faction, f) <= 0));
  const foes = foesFor(att, tier, 2 + (n > 6 ? 1 : 0));
  show({ kicker: 'Menace', title: `On convoite ta pierre de ${STONE[sid].name}`, text: [`${esc(F[att].name)} a retrouvé ta trace. Une équipe approche de ta planque pour te voler la pierre de ${esc(STONE[sid].name)}.`], choices: [
    C('Défendre la pierre', () => startCombat({ title: `Raid de ${F[att].name}`, foes, lethal: lethalOf(att), onWin: L => show({ title: 'Repoussés', text: ['Ils s’enfuient. La pierre reste à toi.'], fx: [...L, ...fx({ xp: 20, rep: { [att]: -5 } })], choices: [C('Continuer', hub)] }), onLose: () => { loseStone(sid, att); defeatOutcome(lethalOf(att) === 'death' ? 'robbed' : lethalOf(att), `Ils t’arrachent la pierre de ${STONE[sid].name}.`); } })),
    C('Cacher la pierre et brouiller les pistes', () => { const r = check('intellect', dcOf(tier), ['stealth', 'tech']); if (r.ok) show({ title: 'Bien joué', text: ['Les voleurs retournent ta planque pour rien.', checkLine(r)], choices: [C('Continuer', hub)] }); else { loseStone(sid, att); show({ title: 'Trop tard', text: [`Ils trouvent la pierre de ${esc(STONE[sid].name)} et filent avec.`, checkLine(r)], choices: [C('Continuer', hub)] }); } }, { odds: ['intellect', dcOf(tier), ['stealth', 'tech']] }),
    C('Les laisser faire (donner la pierre)', () => { loseStone(sid, att); show({ title: 'Perdue', text: ['Tu as préféré sauver ta peau.'], choices: [C('Continuer', hub)] }); }, { cls: 'danger' })] });
};
EVENT_FN.neo = function () {
  const pc = G.pc; const n = stoneCount();
  show({ kicker: 'NÉO', title: 'Un message de Néo', text: ['Un hologramme s’allume dans ta planque. Sans visage, sans voix, mais tu sais qui c’est. « Tu portes ce qui m’appartient. Rends-le et tu vivras comme un roi. »', `Il s’agit de Néo, conseiller stratégique du Nouveau Régime, insensible à l’ogénite.`], choices: [
    C('Refuser net', () => { const L = fx({ heat: 8, rep: { fa: -10 } }); const foes = [mkFoe('prometh', 5), mkFoe('centaure', 5)]; show({ kicker: 'Néo', title: 'La riposte', text: ['Une escouade d’élite te tombe dessus dans l’heure.'], fx: L, choices: [C('Se battre', () => startCombat({ title: 'Escouade de Néo', foes, lethal: 'capture', onWin: l => show({ title: 'Impossible, et pourtant', text: ['Tu survis à l’escouade de Néo. Ça va faire du bruit.'], fx: [...l, ...fx({ xp: 80 })], choices: [C('Continuer', hub)] }) })), C('Fuir', () => { const r = check('agilite', dcOf(5), ['mobility']); if (r.ok) show({ title: 'Échappé', text: ['Tu t’évanouis dans la nature.', checkLine(r)], choices: [C('Continuer', hub)] }); else capturedScene('Néo ne rate jamais deux fois.'); })] }); }),
    C('Négocier (gagner du temps)', () => { const r = check('charisme', dcOf(5, -2), ['social']); if (r.ok) show({ title: 'Il hésite', text: ['L’hologramme se fige, puis s’éteint. Tu viens de gagner quelques mois.', checkLine(r)], fx: fx({ xp: 40 }), choices: [C('Continuer', hub)] }); else show({ title: 'Il rit', text: ['« Tu me ferais presque de la peine. »', checkLine(r)], fx: fx({ heat: 6 }), choices: [C('Continuer', hub)] }); }, { odds: ['charisme', dcOf(5, -2), ['social']] }),
    C('Vendre une pierre à Néo (+3000 ¢, grade FA)', () => { const sid = pick(Object.keys(pc.stones)); loseStone(sid, 'fa'); show({ title: 'Trahison', text: [`Tu livres la pierre de ${esc(STONE[sid].name)}. L’argent est sur ton compte. L’Alliance l’apprendra.`], fx: fx({ money: 3000, rep: { fa: 25, vigilante: -30, uplift: -20 }, spill: true }), choices: [C('Continuer', hub)] }); }, { cls: 'danger', req: { stones: 1 } })] });
};
