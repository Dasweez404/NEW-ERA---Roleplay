// ───────── Lot 1 : arbre du pouvoir (par l'usage), réputation par ville, monde visible, némésis — introduits un par un ─────────
const FEAT_WK = { arbre: 0, rep: 3, monde: 6, nem: 10 };
const feat = k => G && G.wk >= FEAT_WK[k];
const FEAT_NEWS = { rep: ['Réputation par ville', 'Chaque ville retient ce que tu y fais : prix, contrats et accueil changent. Tu verras son avis sur tes cartes de contrats.'], monde: ['Monde visible', 'Sur la carte de voyage, un anneau coloré montre qui tient chaque ville.'], nem: ['Quelqu’un te suit', 'Un ennemi pourrait revenir te chercher. Ce que tu fais autour de toi décide qui.'] };
function announceFeats() { // un seul nouvel élément à la fois, une phrase discrète
  const seen = G.pc.flags.feats = G.pc.flags.feats || {};
  for (const k of ['rep', 'monde', 'nem']) { if (!seen[k] && feat(k)) { seen[k] = 1; newsPush(`Nouveau — ${FEAT_NEWS[k][0]} : ${FEAT_NEWS[k][1]}`); toast('Nouveau : ' + FEAT_NEWS[k][0]); return; } }
}
// ── Arbre du pouvoir : on monte en l'utilisant ──
const PX_STEPS = [0, 6, 15];
function pxLevel(pid) { const n = (G.pc.pxp || {})[pid] || 0; return n >= PX_STEPS[2] ? 3 : n >= PX_STEPS[1] ? 2 : 1; }
function pxGain(pid, n = 1) {
  const pc = G.pc; pc.pxp = pc.pxp || {}; const before = pxLevel(pid); pc.pxp[pid] = (pc.pxp[pid] || 0) + n; const after = pxLevel(pid);
  if (after > before) { const k = perkOf(PW[pid]); splash({ title: 'POUVOIR NIV. ' + after, sub: `${PW[pid].name} · ${k.title}`, icon: '✦', color: '#27f0ff', ms: 2000 }); logEntry(`${PW[pid].name} passe au niveau ${after}.`); }
}
const PX_TXT = ['', 'Niveau 1 : signature de base.', 'Niveau 2 : tes effets gagnent 25 %, la signature coûte 1 énergie.', 'Niveau 3 : effets +50 %, la signature s’utilise deux fois par combat.'];
// ── Réputation par ville ──
const cityRep = (s = G.loc) => (G.pc.crep || {})[s] || 0;
const cityLabel = v => v >= 25 ? 'Adorée' : v >= 10 ? 'Appréciée' : v <= -25 ? 'Haïe' : v <= -10 ? 'Mal vue' : 'Neutre';
function cityPerk() { const v = cityRep(); return v >= 25 ? { price: 0.85, offers: 2, txt: 'prix −15 %, 2 contrats de plus' } : v >= 10 ? { price: 0.9, offers: 1, txt: 'prix −10 %, 1 contrat de plus' } : v <= -25 ? { price: 1.25, offers: -1, txt: 'prix +25 %, on te surveille, contrats rares' } : v <= -10 ? { price: 1.1, offers: 0, txt: 'prix +10 %, regards en coin' } : { price: 1, offers: 0, txt: '' }; }
function addCityRep(d, why) {
  if (!d || !G || !feat('rep')) { if (G && d) { G.pc.crep = G.pc.crep || {}; G.pc.crep[G.loc] = clamp(cityRep() + d, -50, 50); } return; }
  const pc = G.pc; pc.crep = pc.crep || {}; const b = cityLabel(cityRep()); pc.crep[G.loc] = clamp(cityRep() + d, -50, 50); const a = cityLabel(cityRep());
  toast(`${capName(G.loc)} · ${d > 0 ? '+' : ''}${d} ${a !== b ? '→ ' + a : '(' + a + ')'}`);
}
const cityLine = () => { if (!feat('rep')) return ''; const v = cityRep(), p = cityPerk(); return `Réputation à ${capName(G.loc)} : <b>${cityLabel(v)}</b> (${v > 0 ? '+' : ''}${v})${p.txt ? ' — ' + p.txt : ''}.`; };
// ── Némésis ──
function nemesisPick() {
  const pc = G.pc, W = G.world; const reps = Object.keys(F).filter(f => !['civils', 'noir', 'own', 'fallen'].includes(f) && f !== pc.faction && (pc.rep[f] || 0) <= -5).sort((a, b) => (pc.rep[a] || 0) - (pc.rep[b] || 0));
  const fac = reps[0] || (wantedStars() >= 2 ? 'fa' : null); if (!fac) return null;
  const mem = DATA.chars.filter(c => c.faction === fac && c.stars >= 2 && W.npc[c.id].alive && W.npc[c.id].st === 'free' && !pc.party.some(p => p.id === c.id)); return mem.length ? pick(mem) : null;
}
function nemesisCard() {
  const pc = G.pc; const f = pc.flags; let n = f.nem; if (n && (!CH[n.cid] || !G.world.npc[n.cid].alive)) n = f.nem = null;
  if (!n) { const c = nemesisPick(); if (!c) return missionCard(); n = f.nem = { cid: c.id, tier: Math.max(1, c.stars - 1), wins: 0, seen: 0 }; }
  const c = CH[n.cid]; const fac = F[c.faction]; f.nemWk = G.wk; n.seen++;
  const mk = () => [mkFoe('porteur', n.tier, c.name, { cid: c.id, hp: Math.round(40 + 10 * n.tier), hpMax: Math.round(40 + 10 * n.tier), dmg: 5 + 2 * n.tier, def: 2 + n.tier }), ...(n.tier >= 3 ? [mkFoe('porteur', n.tier - 1)] : [])];
  const intro = n.seen === 1 ? `${esc(c.name)} de ${esc(fac.name)} te barre la route. « C’est toi. On m’a parlé de ce que tu as fait. »` : n.wins ? `${esc(c.name)} est de retour, plus dur que la dernière fois. « Tu m’as battu. Je me suis entraîné. »` : `${esc(c.name)} réapparaît. « On n’a pas fini. »`;
  show({ extra: portrait(c.id, 130), kicker: 'NÉMÉSIS · ' + capName(G.loc).toUpperCase(), title: c.name, text: [intro, `<span class="mut">${esc(fac.name)} · ${'★'.repeat(n.tier)} · ${esc(charPowerText(c))}</span>`], choices: [
    C('L’affronter', () => startCombat({ title: `${c.name}, ta némésis`, foes: mk(), intro: 'Le coup part avant même la fin de sa phrase.', lethal: 'capture', canFlee: true,
      onWin: L => { n.wins++; n.tier = Math.min(5, n.tier + 1); let t = [`${esc(c.name)} tombe à genoux.`, 'Il se relèvera plus fort.']; const L2 = fx({ xp: 30 + 10 * n.tier, rep: { [c.faction]: -4 } });
        if (n.wins >= 3) { G.world.npc[c.id].st = 'captured'; f.nem = null; t = [`${esc(c.name)} est enfin neutralisé. Ta légende grandit.`]; L2.push(...fx({ merit: 5 })); newsPush(`${c.name} (${fac.name}) a été mis hors d’état de nuire par ${pc.name}.`); }
        show({ kicker: 'NÉMÉSIS', title: n.wins >= 3 ? 'Fin de la traque' : 'Il battra en retraite', text: t, fx: [...L, ...L2], choices: [C('Continuer', hub)] }); },
      onFlee: () => show({ title: 'Tu t’échappes', text: ['Pour cette fois seulement.'], choices: [C('Continuer', hub)] }) }), { ic: '⚔', cls: 'danger' }),
    C('Tenter de le raisonner', () => { const r = check('charisme', 13 + 2 * n.tier, ['social']); if (r.ok) { f.nem = null; show({ kicker: 'NÉMÉSIS', title: 'Une trêve', text: [`${esc(c.name)} hésite, puis baisse sa garde. « Une autre fois. »`, checkLine(r)], fx: fx({ rep: { [c.faction]: 5 } }), choices: [C('Continuer', hub)] }); } else show({ kicker: 'NÉMÉSIS', title: 'Il ne t’écoute pas', text: [checkLine(r)], choices: [C('Se battre', () => hub())] }); }, { ic: '🗣', odds: ['charisme', 13 + 2 * n.tier, ['social']] }),
    C('Fuir', () => { const r = check('agilite', 12 + 2 * n.tier, ['mobility']); show({ kicker: 'NÉMÉSIS', title: r.ok ? 'Tu disparais' : 'Il te rattrape', text: [checkLine(r)], fx: r.ok ? [] : fx({ hp: -rint(3, 8) }), choices: [C('Continuer', hub)] }); }, { ic: '💨', cls: 'back', odds: ['agilite', 12 + 2 * n.tier, ['mobility']] })] });
}
// ── Monde visible : qui tient quoi, sur la carte ──
const facHue = fid => fid === 'pc' ? '#27f0ff' : fid === 'fa' ? '#3d7bff' : `hsl(${hashStr(String(fid)) % 360},80%,60%)`;
// ── Injection dans le fil ──
function lot1Pool(pool) {
  if (feat('nem') && G.wk - (G.pc.flags.nemWk || 0) >= 8 && (wantedStars() >= 2 || Object.keys(G.pc.rep).some(f => !['civils', 'noir'].includes(f) && G.pc.rep[f] <= -5))) pool.push({ w: 12, f: () => { G.pc.flags.spWk = G.wk; nemesisCard(); } });
  if (feat('rep') && cityRep() <= -10) pool.push({ w: 18, f: () => fightMob(`Dans les rues de ${capName(G.loc)}, on te reconnaît. Des regards durs, puis des poings.`, hub) });
}
