// ───────── Retours : ceux qu'on a épargnés reviennent (rarement), les rancunes nourrissent la némésis, l'adversité éveille les pouvoirs ─────────
function returnEligible() { const f = G.pc.flags; return (f.spared || []).some(e => !e.done && G.wk - e.wk >= 8) && G.wk - (f.retWk == null ? -99 : f.retWk) >= 14; }
function returnCard() {
  const pc = G.pc, f = pc.flags; const list = (f.spared || []).filter(e => !e.done && G.wk - e.wk >= 8 && CH[e.id] && G.world.npc[e.id] && G.world.npc[e.id].alive); if (!list.length) return missionCard();
  const e = pick(list); const c = CH[e.id]; const nm = esc(c.name); const fac = F[c.faction]; f.retWk = G.wk; e.done = true;
  if (!e.hostile) {
    const opts = [{ money: 120 * (c.stars + 1) }, { xp: 40 + 12 * c.stars }, { item: { kit: 1, capsule: 1 } }]; const rw = pick(opts); const L = fx(Object.assign({ rep: { [c.faction]: 3 } }, rw));
    return show({ extra: portrait(c.id, 130), kicker: 'UN VISAGE CONNU', title: c.name, text: [`${nm} te retrouve à ${esc(capName(G.loc))}. « Tu m’as laissé la vie sauve. Je n’ai pas oublié. »`, `${nm} te remet quelque chose avant de repartir.`], fx: L, choices: [C('Continuer', hub, { cls: 'cta' })] });
  }
  const tier = clamp(c.stars, 1, 5);
  show({ extra: portrait(c.id, 130), kicker: 'UN VISAGE CONNU', title: c.name, text: [`${nm} (${esc(fac ? fac.name : '')}) te barre la route. « Tu m’as épargné, mais je ne le supporte pas. Cette fois, je me bats pour de bon. »`, '<span class="acc">Tu connais ses coups : +3 à tous tes jets pendant ce combat.</span>'], choices: [
    C('L’affronter', () => startCombat({ title: `${c.name} revient`, foes: [mkFoe('porteur', tier, c.name + (fac ? ' (' + fac.name + ')' : ''), { cid: c.id })], buff: 3, noScale: true, intro: 'Il fonce sans attendre.', lethal: 'capture', onWin: L => show({ kicker: 'RETOUR', title: 'Réglé', text: [`${nm} s’incline. Cette fois, c’est vraiment fini.`], fx: [...L, ...fx({ xp: 30 })], choices: [C('Continuer', hub)] }), onFlee: () => show({ title: 'Tu t’éclipses', text: ['Il ne te suit pas.'], choices: [C('Continuer', hub)] }) }), { ic: '⚔', cls: 'danger' }),
    C('Tenter de le calmer', () => { const r = check('charisme', 12 + 2 * tier, ['social']); show({ kicker: 'RETOUR', title: r.ok ? 'Il baisse les bras' : 'Il ne veut rien entendre', text: [r.ok ? `${nm} soupire et repart, apaisé.` : `${nm} attaque quand même.`, checkLine(r)], fx: r.ok ? fx({ rep: { [c.faction]: 3 }, xp: 14 }) : [], choices: [r.ok ? C('Continuer', hub) : C('Se défendre', () => startCombat({ title: `${c.name} revient`, foes: [mkFoe('porteur', tier, c.name, { cid: c.id })], buff: 3, noScale: true, lethal: 'capture', onWin: L => show({ title: 'Réglé', text: [`${nm} est à terre.`], fx: L, choices: [C('Continuer', hub)] }), onFlee: () => hub() }), { cls: 'danger' })] }); }, { ic: '🗣', odds: ['charisme', 12 + 2 * tier, ['social']] }),
    C('Fuir', () => hub(), { ic: '💨', cls: 'back' })] });
}
// Rancunes : fuir ou perdre contre un personnage nommé nourrit la némésis
const GRUDGE_LINES = ['« Tu t’es enfui devant moi. Pas cette fois. »', '« Je t’ai battu une fois, je recommencerai. »', '« On ne se quitte pas comme ça. »'];
function noteGrudge(foes, how) { try { const f = G.pc.flags; (foes || []).forEach(x => { if (!x.cid || !CH[x.cid] || Object.values(F).some(q => q.leaders && q.leaders.includes(x.cid))) return; f.grudges = f.grudges || []; if (!f.grudges.includes(x.cid) && chance(how === 'lose' ? 0.5 : 0.35)) { f.grudges.push(x.cid); if (f.grudges.length > 6) f.grudges.shift(); } }); } catch (e) { } }
(function () {
  const _fin = finishCombat; finishCombat = function (kind) { let foes = null, thrGap = 0, win = kind !== 'flee'; try { if (CB) { foes = CB.foes.slice(); thrGap = CB.thr ? CB.thr.gap : 0; } } catch (e) { }
    if (foes) { if (kind === 'flee') noteGrudge(foes, 'flee'); else if (thrGap >= 1) { const p = pcPowers()[0]; if (p) { pxGain(p.id, 2); toast('✦ Ton pouvoir s’éveille face à l’adversité'); } } }
    return _fin.apply(this, arguments); };
  const _lose = loseCombat; loseCombat = function (s) { try { if (CB) noteGrudge(CB.foes, 'lose'); } catch (e) { } return _lose.apply(this, arguments); };
  const _pick = nemesisPick; nemesisPick = function () { const f = G.pc.flags; const g = (f.grudges || []).filter(id => CH[id] && G.world.npc[id] && G.world.npc[id].alive && G.world.npc[id].st === 'free' && !G.pc.party.some(p => p.id === id)); if (g.length && chance(0.7)) { const id = pick(g); f.grudges = f.grudges.filter(x => x !== id); f.nemLine = pick(GRUDGE_LINES); return CH[id]; } return _pick.apply(this, arguments); };
})();
