// ───────── Conflits entre factions : guerres, incidents de frontière, embuscades, choix de camp ─────────
const WAR_FAC = () => Object.keys(G.world.fac).filter(f => !['civils', 'fallen', 'noir', 'own'].includes(f) && F[f]);
const enemiesOf = fid => WAR_FAC().filter(x => x !== fid && relation(fid, x) <= -2);
const warKey = (a, b) => [a, b].sort().join('|');
function warLog(t) { const W = G.world; W.warLog = W.warLog || []; W.warLog.unshift(`${dateStr(G.wk)} — ${t}`); W.warLog.length = Math.min(W.warLog.length, 12); newsPush(t); }
function terrOf(fid) { return DATA.states.map(s => s.id).filter(s => G.world.terr[s] === fid); }
function warMonth() {
  const W = G.world; W.war = W.war || {}; const ids = WAR_FAC();
  // ruptures et trêves : le monde ne reste jamais calme
  if (chance(0.22)) { const a = pick(ids), b = pick(ids.filter(x => x !== a)); if (b && relation(a, b) > -2) { setRel(a, b, -2); warLog(`Rupture entre ${F[a].name} et ${F[b].name} : les hostilités commencent.`); } }
  if (chance(0.05)) { const hot = Object.keys(W.war).filter(k => W.war[k] > 6); if (hot.length) { const [a, b] = pick(hot).split('|'); setRel(a, b, 0); delete W.war[warKey(a, b)]; warLog(`Trêve fragile entre ${F[a].name} et ${F[b].name}.`); } }
  // plus tu as de pierres, plus tes ennemis déclarent la guerre à ta faction
  { const n = stoneCount(), pf = G.pc.faction; if (n >= 2 && pf !== 'civils' && F[pf] && chance(Math.min(0.3, 0.03 * n))) { const foes = WAR_FAC().filter(x => F[x] && x !== pf && relation(pf, x) <= 0 && relation(pf, x) > -2); if (foes.length) { const e = pick(foes); setRel(pf, e, -2); warLog(`${F[e].name} déclare la guerre à ${F[pf].name} : la rumeur de tes pierres antiques les rend avides.`); } } }
  // affrontements : 2 à 4 par mois
  const pairs = []; ids.forEach(a => enemiesOf(a).forEach(b => { if (a < b) pairs.push([a, b]); }));
  for (let i = 0; i < Math.min(pairs.length, rint(2, 4)); i++) {
    const [a, b] = pick(pairs); const fa = W.fac[a], fb = W.fac[b]; if (!fa || !fb) continue;
    const key = warKey(a, b); W.war[key] = (W.war[key] || 0) + 1;
    const sa = fa.power + rint(0, 35), sb = fb.power + rint(0, 35); const win = sa >= sb ? a : b, lose = win === a ? b : a;
    W.fac[win].power = clamp(W.fac[win].power + rint(1, 3), 6, 100); W.fac[lose].power = clamp(W.fac[lose].power - rint(2, 5), 6, 100);
    const lt = terrOf(lose); const kind = chance(0.4) && lt.length && lose !== 'fa';
    if (kind) { const st = pick(lt); W.terr[st] = win; warLog(`${F[win].name} écrase ${F[lose].name} et lui arrache ${S[st].name}.`); }
    else warLog(pick([`Embuscade sanglante : ${F[win].name} décime une patrouille de ${F[lose].name}.`, `${F[win].name} et ${F[lose].name} s’affrontent aux portes d’une ville : ${F[win].name} tient la rue.`, `Raid de ${F[win].name} sur un entrepôt de ${F[lose].name}.`, `Sabotage : ${F[lose].name} perd un convoi, ${F[win].name} nie toute implication.`]));
    // pertes parmi les membres
    if (chance(0.5)) { const mem = DATA.chars.filter(c => c.faction === lose && W.npc[c.id].alive && W.npc[c.id].st !== 'ally' && !F[lose].leaders.includes(c.id) && !G.pc.party.some(p => p.id === c.id)); if (mem.length) { const c = pick(mem); if (chance(0.5)) { W.npc[c.id].alive = false; warLog(`${c.name} (${F[lose].name}) est tué dans la guerre contre ${F[win].name}.`); } else { W.npc[c.id].st = 'captured'; warLog(`${c.name} (${F[lose].name}) est capturé par ${F[win].name}.`); } } }
  }
}
// ───────── Cartes jouables ─────────
const wTier = () => Math.max(1, tiersForGrade()[0]);
function frontCard() {
  const pc = G.pc, W = G.world; const en = enemiesOf(pc.faction); if (!en.length || pc.faction === 'civils') return missionCard();
  const e = pick(en), ef = F[e], mf = F[pc.faction]; const t = wTier();
  const win = (txt, extra) => L => show({ kicker: 'FRONT', title: 'Victoire sur ' + ef.name, text: [txt], fx: [...L, ...fx(Object.assign({ merit: 4 + t, money: 60 + 40 * t, rep: { [pc.faction]: 5, [e]: -10 }, heat: 3 }, extra || {}))], choices: [C('Continuer', hub)] });
  const swing = (dp, steal) => { W.fac[e].power = clamp(W.fac[e].power - dp, 6, 100); W.fac[pc.faction].power = clamp(W.fac[pc.faction].power + 3, 6, 100); const lt = terrOf(e); if (steal && lt.length) { const st = pick(lt); W.terr[st] = pc.faction; warLog(`${mf.name} reprend ${S[st].name} à ${ef.name} grâce à ${pc.name}.`); } };
  show({ kicker: 'GUERRE', title: `${mf.name} contre ${ef.name}`, text: [`La tension a explosé. ${esc(ef.name)} attaque les nôtres sur ${esc(capName(G.loc))} : les patrouilles tombent, les rues se vident. On attend de toi un geste.`, 'Ne rien faire, c’est laisser les tiens mourir.'], choices: [
    C(`Monter à l’assaut de ${ef.name}`, () => startCombat({ title: 'Escarmouche : ' + ef.name, foes: foesFor(e, t, rint(3, 4)), lethal: 'capture', intro: `${ef.name} se déploie. Pas de quartier.`, onWin: L => { swing(8, true); win('Leur ligne cède. Ton camp avance, et on chante ton nom.')(L); }, onFlee: () => show({ title: 'Repli', text: ['Tu laisses les tiens tenir seuls. On s’en souviendra.'], fx: fx({ rep: { [pc.faction]: -6 } }), choices: [C('Continuer', hub)] }) }), { ic: '⚔', cls: 'risk', sub: 'Combat · bonne récompense, prime en hausse' }),
    C('Infiltrer leur camp et saboter', () => { const r = check('agilite', 12 + 3 * t, ['stealth']); advance(1); if (G.status !== 'play') return; if (r.ok) { swing(6, false); show({ kicker: 'FRONT', title: 'Sabotage réussi', text: [`Dépôts en flammes, armes inutilisables : ${esc(ef.name)} vacille.`, checkLine(r)], fx: fx({ merit: 3 + t, rep: { [pc.faction]: 4, [e]: -8 }, xp: 15 }), choices: [C('Continuer', hub)] }); } else startCombat({ title: 'Repéré par ' + ef.name, foes: foesFor(e, t, 2), lethal: 'capture', intro: 'Une alarme. Ils te sautent dessus.', onWin: win('Tu t’en sors de justesse et fais payer ta découverte.') }); }, { ic: '🕶', odds: ['agilite', 12 + 3 * t, ['stealth']], sub: 'Discret, mais un échec te met au combat' }),
    C('Rester en retrait', () => { W.fac[pc.faction].power = clamp(W.fac[pc.faction].power - 3, 6, 100); show({ kicker: 'FRONT', title: 'Tu détournes les yeux', text: ['Les tiens encaissent seuls. Certains te regardent différemment.'], fx: fx({ rep: { [pc.faction]: -5 }, merit: -2 }), choices: [C('Continuer', hub)] }); }, { cls: 'back' })] });
}
function ambushCard(fromTerr) {
  const pc = G.pc; pc.flags.ambushDone = true; const cand = Object.keys(F).filter(f => !['civils', 'noir', 'own', 'fallen'].includes(f) && f !== pc.faction && ((pc.rep[f] || 0) <= -10 || relation(pc.faction, f) <= -2));
  const e = fromTerr || (cand.length ? pick(cand) : null); if (!e) return missionCard(); const ef = F[e]; const t = wTier();
  show({ kicker: 'EMBUSCADE', title: `${ef.name} t’attend`, text: [`Des silhouettes se détachent des ombres près de ${esc(capName(G.loc))}. L’emblème de ${esc(ef.name)}. Ils te cherchaient${relation(pc.faction, e) <= -2 ? ' : tu portes les couleurs de leurs ennemis' : ''}.`], choices: [
    C('Se battre', () => startCombat({ title: 'Embuscade : ' + ef.name, foes: foesFor(e, t, rint(3, 4)), lethal: 'capture', intro: 'Pas le temps de parler.', onWin: L => show({ kicker: 'EMBUSCADE', title: 'Ils reculent', text: ['Les survivants disparaissent. Mais leur faction n’oubliera pas.'], fx: [...L, ...fx({ xp: 10 + 5 * t, rep: { [e]: -6 }, merit: 2 })], choices: [C('Continuer', hub)] }), onFlee: () => hub() }), { ic: '⚔', cls: 'risk' }),
    C('Tenter de filer', () => { const r = check('agilite', 12 + 2 * t, ['mobility', 'stealth']); if (r.ok) G.pc.flags.escW = G.wk, show({ kicker: 'EMBUSCADE', title: 'Tu leur échappes', text: ['Tu disparais dans la foule.', checkLine(r)], choices: [C('Continuer', hub)] }); else startCombat({ title: 'Cernés', foes: foesFor(e, t, 3), lethal: 'capture', intro: 'Ils te rattrapent, plus nombreux.', onWin: L => show({ title: 'Tu tiens bon', text: ['Tu survis, à bout de souffle.'], fx: L, choices: [C('Continuer', hub)] }) }); }, { ic: '💨', odds: ['agilite', 12 + 2 * t, ['mobility', 'stealth']] }),
    C('Négocier', () => { const r = check('charisme', 13 + 2 * t, ['social']); if (r.ok) show({ kicker: 'EMBUSCADE', title: 'Un accord bancal', text: ['Tu leur parles de partager le terrain. Ils baissent les armes… pour cette fois.', checkLine(r)], fx: fx({ rep: { [e]: 3 } }), choices: [C('Continuer', hub)] }); else startCombat({ title: 'Négociation ratée', foes: foesFor(e, t, 2), lethal: 'capture', intro: 'On ne te laisse pas finir ta phrase.', onWin: L => show({ title: 'Tu t’en sors', text: ['Tu as eu de la chance.'], fx: L, choices: [C('Continuer', hub)] }) }); }, { ic: '🗣', odds: ['charisme', 13 + 2 * t, ['social']] })] });
}
function sideCard() {
  const pc = G.pc; const ids = WAR_FAC().filter(f => f !== pc.faction); const pairs = []; ids.forEach(a => ids.forEach(b => { if (a < b && relation(a, b) <= -2) pairs.push([a, b]); }));
  if (!pairs.length) return missionCard(); const [a, b] = pick(pairs); const fa = F[a], fb = F[b];
  const pay = 100 + 50 * wTier();
  const back = (x, y) => () => { const W = G.world; W.fac[x].power = clamp(W.fac[x].power + 3, 6, 100); W.fac[y].power = clamp(W.fac[y].power - 3, 6, 100); show({ kicker: 'CHOIX DE CAMP', title: `Tu soutiens ${F[x].name}`, text: [`${esc(F[y].name)} apprendra qui a pesé dans la balance. Et ses alliés aussi.`], fx: fx({ money: pay, rep: { [x]: 10, [y]: -12 }, xp: 12 }), choices: [C('Continuer', hub)] }); };
  show({ kicker: 'CHOIX DE CAMP', title: `${fa.name} et ${fb.name} s’affrontent`, text: [`Deux factions se disputent ${esc(capName(G.loc))} et chacune veut ton aide. L’une paie ${pay} ¢. L’autre promet des faveurs.`, 'Aider l’une, c’est s’attirer l’hostilité de l’autre — et de leurs alliés.'], choices: [
    C(`Aider ${fa.name}`, back(a, b), { ic: '🤝' }), C(`Aider ${fb.name}`, back(b, a), { ic: '🤝' }),
    C('Exploiter le chaos (vendre aux deux)', () => { const r = check('charisme', 15, ['social']); if (r.ok) show({ kicker: 'CHOIX DE CAMP', title: 'Double jeu réussi', text: ['Tu vends deux fois le même renseignement.', checkLine(r)], fx: fx({ money: pay * 2, heat: 2 }), choices: [C('Continuer', hub)] }); else show({ kicker: 'CHOIX DE CAMP', title: 'Démasqué', text: ['Les deux camps t’ont à l’œil.', checkLine(r)], fx: fx({ rep: { [a]: -10, [b]: -10 }, heat: 4 }), choices: [C('Continuer', hub)] }); }, { ic: '🎭', cls: 'risk', odds: ['charisme', 15, ['social']] }),
    C('Rester neutre', hub, { cls: 'back' })] });
}
function conflictPool(pool) {
  const pc = G.pc, W = G.world; const en = enemiesOf(pc.faction).length;
  if (pc.faction !== 'civils' && en) pool.push({ w: 16 + 4 * Math.min(4, en), f: frontCard });
  const hostile = Object.keys(F).filter(f => !['civils', 'noir', 'own', 'fallen'].includes(f) && f !== pc.faction && (pc.rep[f] || 0) <= -10).length;
  if (pc.flags.ambushDone) { pool.push({ w: 10, f: sideCard }); return; }
  pool.push({ w: 6 + 4 * hostile + 4 * Math.min(3, wantedStars()), f: () => ambushCard() });
  pool.push({ w: 10, f: sideCard });
  const owner = W.terr[G.loc]; if (owner && owner !== pc.faction && owner !== 'pc' && F[owner] && relation(pc.faction, owner) <= -2) pool.push({ w: 28, f: () => ambushCard(owner) });
}
