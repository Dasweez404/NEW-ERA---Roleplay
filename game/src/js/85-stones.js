// ───────── Pierres antiques : enquête, temples, détenteurs ─────────
function stoneClueGain() {
  const W = G.world; W.stoneLv = W.stoneLv || {}; const fl = G.pc.flags; if (!stonesUnlocked()) return null; const sc0 = stoneCount(); if (G.wk - (fl.clueWk == null ? -99 : fl.clueWk) < (sc0 >= 3 ? 0 : sc0 >= 1 ? 1 : 2)) return null; // plus tu as de pierres, plus les pistes affluent
  { const act = DATA.stones.filter(s => !G.pc.stones[s.id] && (W.stoneLv[s.id] || W.stoneClue[s.id])).length; if (act >= 3 + Math.floor(stoneCount() / 3)) return null; }
  const lvOf = id => W.stoneLv[id] || (W.stoneClue[id] ? 1 : 0); const rest = DATA.stones.filter(s => !G.pc.stones[s.id]);
  const unk = rest.filter(s => !lvOf(s.id)), deep = rest.filter(s => lvOf(s.id) >= 1 && lvOf(s.id) < 3);
  let s, lv; if (unk.length && (!deep.length || chance(0.5))) { s = pick(unk); lv = chance(0.6 + 0.04 * sc0) ? 2 : 1; } else if (deep.length) { s = pick(deep); lv = Math.min(3, lvOf(s.id) + (chance(0.4 + 0.05 * sc0) ? 2 : 1)); } else return null;
  W.stoneLv[s.id] = lv; W.stoneClue[s.id] = true; fl.clueWk = G.wk; const loc = W.stoneLoc[s.id]; const hold = W.stoneHolder[s.id];
  logEntry(`Indice ${lv}/3 : pierre de ${s.name}.`);
  if (lv === 1) return `une rumeur parle de la pierre de ${s.name}, quelque part en zone ${zoneOf(loc)} (des 💎 creux marquent les États possibles : ouvre la carte quand tu choisis ta destination).`;
  if (lv === 2) return `la pierre de ${s.name} serait du côté de ${capName(loc)} (${stateName(loc)}). Un 💎 violet marque cet État sur la carte de l’Orbitrail (au moment de choisir ta destination) : une enquête t’y attendra.`;
  return hold === 'temple' ? `la pierre de ${s.name} dort dans un temple oublié près de ${capName(loc)}. Tu sais maintenant où chercher.` : hold === 'pnj-levant' ? `la pierre de ${s.name} est aux mains d’un descendant du peuple du feu, à ${capName(loc)}.` : `la pierre de ${s.name} est détenue par ${F[hold] ? F[hold].name : hold}, à ${capName(loc)}. Tu connais leurs défenses.`;
}
// États où un indice fait apparaître un 💎 sur la carte de l'Orbitrail
function stoneHints() {
  const W = G.world; const m = new Map(); const lvOf = id => W.stoneLv[id] || (W.stoneClue[id] ? 1 : 0);
  DATA.stones.forEach(s => { if (G.pc.stones[s.id]) return; const lv = lvOf(s.id); if (!lv) return; const loc = W.stoneLoc[s.id];
    if (lv >= 2) m.set(loc, 'full'); else { const z = zoneOf(loc); DATA.states.forEach(st => { if (zoneOf(st.id) === z && !m.has(st.id)) m.set(st.id, 'hollow'); }); } });
  return m;
}
const stoneQuestHere = () => { const W = G.world; return DATA.stones.find(s => !G.pc.stones[s.id] && (W.stoneLv[s.id] || 0) >= 2 && W.stoneLoc[s.id] === G.loc) || null; };
function stoneQuestCard(s) {
  const W = G.world; const lv = W.stoneLv[s.id] || 2; const hold = W.stoneHolder[s.id]; const dc = 14 + Math.min(4, stoneCount());
  const go = () => stoneAttempt(s.id); const L = [];
  if (lv >= 3) { L.push(C('Tenter de la récupérer', go, { ic: '💎', cls: 'risk' })); L.push(C('Pas maintenant', hub, { cls: 'back' })); }
  else { L.push(C('Enquêter sur place', () => { const r = check('intellect', dc, ['scout', 'relic'], PK('clue')); advance(1); if (G.status !== 'play') return; if (r.ok) { W.stoneLv[s.id] = 3; show({ kicker: 'ENQUÊTE · PIERRE ANTIQUE', title: 'Tu tiens la piste', text: [esc(cap(stoneClueText(s))), 'Tu pourras tenter de la récupérer à la fin de ta mission principale.', checkLine(r)], fx: fx({ xp: 20 }), choices: [C('Continuer', hub)] }); } else show({ kicker: 'ENQUÊTE · PIERRE ANTIQUE', title: 'Rien de concluant', text: ['Les témoins se rétractent, les archives sont incomplètes.', checkLine(r)], choices: [C('Continuer', hub)] }); }, { odds: ['intellect', dc, ['scout', 'relic']], ic: '🔍' })); L.push(C('Tenter de la récupérer sans enquête', go, { ic: '💎', cls: 'risk', sub: 'Plus risqué : tu ignores ce qui t’attend.' })); L.push(C('Pas maintenant', hub, { cls: 'back' })); }
  show({ kicker: lv >= 3 ? 'PIERRE ANTIQUE · RÉCUPÉRATION' : 'ENQUÊTE · PIERRE ANTIQUE', title: `La pierre de ${s.name}`, text: [lv >= 3 ? `Tu sais ce qui t’attend : ${hold === 'temple' ? 'un temple oublié' : esc(holderName(hold))}. Royaume ${esc(s.ruler)} — ${esc(s.spec)}.` : `Ton indice t’a mené jusqu’ici. La pierre du royaume ${esc(s.ruler)} est tout près, mais il faut d’abord trouver où.`], choices: L });
}
function stoneClueText(s) { const W = G.world; const hold = W.stoneHolder[s.id]; const loc = W.stoneLoc[s.id]; return hold === 'temple' ? `la pierre de ${s.name} dort dans un temple oublié près de ${capName(loc)}.` : hold === 'pnj-levant' ? `la pierre de ${s.name} est aux mains d’un descendant du peuple du feu.` : `la pierre de ${s.name} est détenue par ${F[hold] ? F[hold].name : hold}.`; }
const repF = h => F[h] ? h : 'civils';
function holderName(h) { return h === 'temple' ? 'aucun (temple caché)' : h === 'pnj-levant' ? 'le descendant du peuple du feu' : h === 'pc' ? 'toi' : F[h] ? F[h].name : h; }
function stoneTier(hid) { if (hid === 'temple') return 3; if (hid === 'fa') return 5; if (hid === 'pnj-levant') return 2; const p = G.world.fac[hid] ? G.world.fac[hid].power : 40; return clamp(Math.round(p / 22) + 1, 2, 5); }

function stoneMenu() {
  const pc = G.pc; const W = G.world; const L = [];
  L.push(C('Lire les glyphes déjà déchiffrés', glyphLib));
  L.push(C('← Retour', actionsMenu));
  const known = DATA.stones.filter(s => !pc.stones[s.id] && (W.stoneLv[s.id] || W.stoneClue[s.id]));
  const cards = h('div', { class: 'stclues' }, known.length ? known.map(s => { const lv = W.stoneLv[s.id] || 1; const loc = W.stoneLoc[s.id];
    return h('div', { class: 'stclue', style: `--c:${s.color}` }, h('b', {}, `Pierre de ${s.name}`), h('span', { class: 'stlv' }, '◆'.repeat(lv) + '◇'.repeat(3 - lv)), h('div', { class: 'small mut' }, lv === 1 ? `Rumeur : zone ${zoneOf(loc)}.` : lv === 2 ? `Quelque part près de ${capName(loc)}. Une quête t’y attend.` : `${esc2(stoneClueText(s))}`)); }) : [h('div', { class: 'mut small' }, G.wk < 6 ? 'Les pierres sont encore des légendes. Les premiers indices arriveront au fil de tes aventures.' : 'Aucun indice pour l’instant. Les missions et les rencontres en livrent parfois.')]);
  show({ kicker: 'Pierres antiques', title: `${stoneCount()}/16`, text: ['<span class="mut">Même nature que la génotite : les pierres sont apparues sur Terre en même temps que l’éveil. Les indices font apparaître des 💎 sur la carte de l’Orbitrail. Va là-bas : l’enquête se fera pendant ton séjour, et la pierre se récupère à la fin de la quête principale.</span>'], extra: h('div', {}, stoneGrid(), cards), choices: L });
}
const esc2 = t => cap(t);
function glyphLib() {
  const L = DATA.stones.filter(s => G.pc.stones[s.id]).map(s => C(`${s.order}. Pierre de ${s.name}`, () => show({ kicker: `${s.order}. ${s.name}`, title: `Royaume de ${s.name} — ${s.ruler}`, text: [`Origine : ${esc(s.origin)} · Spécialité : ${esc(s.spec)} · Clan de ${s.clan === 'bidh' ? 'Bidh' : 'Kaos'}.`, `<div class="glyph">${esc(s.glyph)}</div>`, `<span class="mut">Anciens détenteurs : ${esc(s.holders)}</span>`, `<span class="mut">Lecture des héros : ${esc(s.heroes)}</span>`], choices: [C('← Retour', glyphLib)] })));
  L.push(C('← Retour', stoneMenu)); show({ kicker: 'Glyphes', title: 'Glyphes déchiffrés', text: L.length > 1 ? [] : ['Tu n’as encore déchiffré aucun glyphe : il faut posséder la pierre.'], choices: L });
}
// ── Alignement moral : l'écart entre toi et le détenteur fait varier la balance ──
const moralOf = f => (f === 'pnj-levant' || f === 'temple' || !F[f]) ? 0 : moralBase(f);
const moralGap = f => Math.abs(karma() - moralOf(f));
const moralIc = v => v >= 6 ? '😇' : v <= -6 ? '😈' : '😐';
function allyStone(id, hold) {
  const pc = G.pc; pc.stoneAlly = pc.stoneAlly || {}; const s = STONE[id]; const L = fx({ stone: id }); pc.stoneAlly[id] = hold; G.world.stoneHolder[id] = hold; setRel(pc.faction, hold, 2); G.world.stoneLoc[id] = CANON_LOC[id] || G.world.stoneLoc[id];
  L.push(...fx({ rep: { [hold]: 6 }, xp: 50 })); addKarma(1); logEntry(`Alliance avec ${F[hold].name} : la pierre de ${s.name} compte pour toi.`); newsPush(`${F[hold].name} s’allie à ${pc.name} et partage la pierre de ${s.name}.`);
  if (stoneCount() >= 16) return endGame('win', '');
  show({ kicker: 'ALLIANCE', title: `La pierre de ${s.name} compte pour toi`, text: [`${esc(F[hold].name)} garde la pierre, mais vous êtes liés : elle est comptée dans ta quête tant que l’alliance tient.`, '<span class="mut">Si vous vous brouillez (guerre, trahison), la pierre cesse de compter. Tu peux aussi la prendre de force plus tard.</span>'], fx: L, choices: [C('Continuer', hub)] });
}
function checkAlliedStones() {
  const pc = G.pc; if (!pc.stoneAlly) return; Object.keys(pc.stoneAlly).forEach(id => { const hold = pc.stoneAlly[id]; if (!F[hold] || relation(pc.faction, hold) < 2 || G.world.stoneHolder[id] !== hold) { delete pc.stones[id]; delete pc.stoneAlly[id]; if (G.world.stoneHolder[id] === 'pc') G.world.stoneHolder[id] = hold; recalc(); newsPush(`L’alliance avec ${F[hold] ? F[hold].name : hold} est rompue : la pierre de ${STONE[id].name} ne compte plus pour ${pc.name}.`); logEntry(`Alliance rompue : la pierre de ${STONE[id].name} ne compte plus.`); } });
}
function stoneAttempt(id) {
  const s = STONE[id]; const W = G.world; const hold = W.stoneHolder[id]; const pc = G.pc; const tier = stoneTier(hold); const dc = dcOf(tier);
  if (hold === 'temple') return templeExpedition(id);
  const hn = holderName(hold); const rep = pc.rep[hold] || 0; const L = [];
  const minGrade = hold === 'fa' ? 3 : hold === 'arena' || hold === 'manacorp' || hold === 'gamma' ? 2 : 0;
  L.push(C(`Voler discrètement la pierre`, () => stoneSteal(id, tier, dc), { odds: ['agilite', dc, ['stealth', 'mobility']], req: { grade: minGrade }, cls: 'risk', sub: 'Si ça échoue, ils te tombent dessus.' }));
  if (hold !== 'fa') L.push(C('Convaincre le détenteur de te la confier ou de te l’échanger', () => stoneTalk(id, tier), { odds: ['charisme', dc - Math.floor(rep / 12), ['social']], req: { ok: () => rep < -15 ? 'Ils te détestent : impossible de négocier' : (pc.faction === hold ? null : null) }, sub: rep >= 40 ? 'Ils t’aiment bien : tes chances sont bonnes.' : 'Une réputation solide avec eux aide beaucoup.' }));
  L.push(C('Rendre d’abord un service important au détenteur', () => { const o = genOffer(hold === 'fa' || hold === 'pnj-levant' ? 'civils' : hold, Math.min(5, tier), {}); o.favor = id; missionBrief(o); }, { sub: 'Une mission pour eux : +réputation, qui débloque la négociation.', req: { ok: () => hold === 'fa' ? 'La Force d’Autorité ne confie jamais une pierre' : null } }));
  { const gap = moralGap(hold); const canAlly = F[hold] && hold !== 'fa' && hold !== 'pnj-levant' && !(pc.stoneAlly && pc.stoneAlly[id]); const adc = dc + Math.round(gap / 3) - Math.floor(rep / 12) - (relation(pc.faction, hold) >= 2 ? 4 : 0) - (pc.faction === hold ? 6 : 0) + stoneCount();
    if (canAlly) L.push(C('Proposer une alliance : la pierre compte pour toi', () => { const r = check('charisme', adc, ['social', 'strat']); advance(1); if (G.status !== 'play') return; if (r.ok) return allyStone(id, hold); show({ kicker: 'ALLIANCE', title: 'Ils refusent', text: [gap >= 14 ? 'Vos idéaux sont trop éloignés : ils ne te font pas confiance.' : 'Ils veulent plus de garanties avant de s’engager.', checkLine(r)], fx: fx({ rep: { [hold]: -3 } }), choices: [C('Continuer', () => stoneAttempt(id))] }); }, { ic: '🤝', odds: ['charisme', adc, ['social', 'strat']], req: { ok: () => gap >= 26 ? 'Vos idéaux sont inconciliables' : rep < -25 ? 'Ils te haïssent trop' : rep < 20 ? 'Rends-leur d’abord un service (réputation 20+ avec eux)' : null }, sub: `Difficulté +${stoneCount()} (leur méfiance monte avec tes pierres) · ${moralIc(karma())} toi · ${moralIc(moralOf(hold))} eux · écart ${Math.round(gap)} (${gap <= 6 ? 'proches : alliance facile' : gap >= 16 ? 'éloignés : alliance difficile' : 'écart moyen'}) · réversible` })); }
  L.push(C('Prendre la pierre par la force', () => stoneAssault(id, tier), { cls: 'danger', req: { grade: minGrade }, sub: `Affrontement contre les gardiens de la pierre. ${moralGap(hold) <= 6 ? 'Ils te ressemblent : lourd à porter moralement.' : moralOf(hold) < karma() - 8 ? 'Leur camp est moins juste que le tien.' : ''}` }));
  L.push(C('Pas maintenant', hub, { cls: 'back' }));
  show({ kicker: `Pierre de ${s.name}`, title: `Chez ${hn}`, text: [`La pierre de ${esc(s.name)} (royaume ${esc(s.ruler)}) est ${hold === 'pnj-levant' ? 'entre les mains d’un descendant du peuple du feu' : 'gardée par ' + esc(hn)} à ${esc(capName(W.stoneLoc[id]))}.`, `<span class="mut">Alignement : toi ${moralIc(karma())} ${karmaName()} · eux ${moralIc(moralOf(hold))} · écart ${Math.round(moralGap(hold))}</span>`, `<span class="mut">Ton lien avec ${esc(hn)} : ${repLevel(rep)} (${rep}).</span>`], choices: L });
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
  if (r.ok) return show({ kicker: 'Négociation', title: 'Ils veulent des preuves', text: ['On t’écoute, mais on ne confie pas une pierre à un inconnu. « Rends-nous service d’abord. »', checkLine(r)], fx: fx({ rep: { [repF(hold)]: 4 } }), choices: [C('Continuer', () => stoneAttempt(id))] });
  show({ kicker: 'Négociation', title: 'Refus', text: ['Ils ne veulent rien entendre.', checkLine(r)], fx: fx({ rep: { [repF(hold)]: -3 } }), choices: [C('Continuer', () => stoneAttempt(id))] });
}
function guardsOf(hold, tier) { const n = tier >= 4 ? 3 : 2; const g = hold === 'fa' ? [mkFoe('atlas', 5), mkFoe('soldat', 5), mkFoe('centaure', 4)].slice(0, n) : (hold === 'pnj-levant' || hold === 'temple' || !F[hold]) ? foesFor('civils', tier, 2) : foesFor(hold, Math.min(5, tier), n); if (tier >= 4 && hold !== 'fa') { const c = G.world.leader[hold] && CH[G.world.leader[hold]]; if (c) g.push(mkFoe('porteur', Math.min(5, tier), c.name + ' (chef)', { cid: c.id })); } return g; }
function stoneAssault(id, tier) {
  const hold = G.world.stoneHolder[id];
  startCombat({ title: `Assaut : ${holderName(hold)}`, foes: guardsOf(hold, tier), lethal: lethalOf(hold), intro: `Tu fonces sur les gardiens de la pierre de ${STONE[id].name}.`, onWin: L => { const gap = moralGap(hold); const near = gap <= 6, far = gap >= 16; addKarma(near ? -2 : far && moralOf(hold) < karma() ? 1 : -0.5); stoneWin(id, ['Les gardiens à terre, la pierre est à toi.', near ? 'Ils étaient de ton bord, ou presque : ça pèse.' : far && moralOf(hold) < karma() ? 'Tu libères la pierre d’un camp qui n’aurait pas dû la garder.' : ''].filter(Boolean), [...L, ...fx({ rep: { [repF(hold)]: Math.round(-25 * (near ? 1.4 : far ? 0.6 : 1)) }, heat: 8 })]); } });
}
function templeExpedition(id) {
  const s = STONE[id]; const pc = G.pc; const steps = ['Les glyphes de l’entrée', 'Les mécanismes du temple', 'La salle de l’autel'];
  const run = (i, wins) => {
    if (i >= 3) { if (wins >= 2) return stoneWin(id, [`Au cœur du temple du royaume de ${esc(s.name)}, la pierre repose sur son autel, intacte, chaude, vivante.`]); return show({ kicker: 'Temple', title: 'Expédition ratée', text: ['Le temple garde son secret. Tu devras revenir, mieux préparé.'], fx: fx({ hp: -rint(5, 12), xp: 15 }), choices: [C('Continuer', hub)] }); }
    const opts = [
      [['Déchiffrer les glyphes', 'intellect', ['scout', 'relic'], 'Le glyphe s’illumine sous tes doigts.', 'Les symboles te résistent.'], ['Forcer le passage avec ton pouvoir', 'maitrise', ['control', 'combat', 'mobility'], 'Ton pouvoir fait céder la pierre.', 'Ton pouvoir s’emballe contre les murs.'], ['Fouiller à la force des bras', 'corps', ['defense'], 'Tu déplaces la dalle à mains nues.', 'La dalle t’écrase une main.']],
      [['Désamorcer les mécanismes', 'intellect', ['tech'], 'Un à un, les engrenages se figent.', 'Un piège se déclenche.'], ['Passer par les failles', 'agilite', ['mobility', 'stealth'], 'Tu esquives chaque lame.', 'Une lame te frôle.'], ['Laisser tes alliés ouvrir la voie', 'charisme', ['ally', 'social'], 'Ton équipe te couvre.', 'Ton équipe se disperse.']],
      [['Soutenir la voûte qui s’effondre', 'corps', ['defense', 'combat'], 'Tu tiens la pierre le temps de passer.', 'Un pan de roche s’abat près de toi.'], ['Retrouver les rites du royaume disparu', 'charisme', ['relic', 'social'], 'Tu recomposes l’ancien rituel : l’autel s’ouvre.', 'Les gestes te sont étrangers : rien ne bouge.'], ['Canaliser la pierre avec ton pouvoir', 'maitrise', ['control', 'relic'], 'Ton pouvoir répond à celui de la pierre.', 'Ton pouvoir se perd dans la roche.']],
    ][i];
    show({ kicker: `Temple du royaume de ${s.name} — épreuve ${i + 1}/3`, title: steps[i], text: [`Le temple est un dédale de pierre. Il faut franchir 3 épreuves (2 réussites suffisent). Réussites : ${wins}.`], choices: opts.map(o => C(o[0], () => { const r = check(o[1], dcOf(3), o[2]); advance(1); if (G.status !== 'play') return; show({ kicker: 'Temple', title: r.ok ? 'Réussi' : 'Raté', text: [r.ok ? o[3] : o[4], checkLine(r)], fx: r.ok ? [] : fx({ hp: -rint(2, 6) }), choices: [C('Continuer', () => { if (pc.hp <= 0) pc.hp = 1; run(i + 1, wins + (r.ok ? 1 : 0)); })] }); }, { odds: [o[1], dcOf(3), o[2]] })) });
  };
  run(0, 0);
}

// ───────── Menaces sur les pierres ─────────
EVENT_FN.stoneRaid = function () {
  const pc = G.pc; const n = stoneCount(); if (!n) return hub();
  const sid = pick(Object.keys(pc.stones).filter(x => !(pc.stoneAlly && pc.stoneAlly[x])).concat([]).length ? Object.keys(pc.stones).filter(x => !(pc.stoneAlly && pc.stoneAlly[x])) : Object.keys(pc.stones)); const tier = clamp(Math.ceil(n / 3) + 1, 2, 5); const att = n >= 6 && G.world.era !== 'newera' ? 'fa' : pick(Object.keys(F).filter(f => isAnti(f) && f !== pc.faction && relation(pc.faction, f) <= 0));
  const foes = foesFor(att, tier, 3 + (n > 6 ? 1 : 0));
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
