// ───────── Opportunités : des points rouges sur la carte, de bonnes raisons d'aller quelque part ─────────
const LEAD_KINDS = {
  contrat: { ic: '💰', t: s => `Un gros contrat t’attend à ${s}`, d: 'Paie doublée' },
  recrue: { ic: '🤝', t: s => `Quelqu’un de talent cherche une équipe à ${s}`, d: 'Un allié potentiel' },
  crise: { ic: '🆘', t: s => `Une crise éclate à ${s}`, d: 'Réputation et expérience' },
  rival: { ic: '⚔', t: s => `Un rival de ta faction s’installe à ${s}`, d: 'Mérite et prise de guerre' },
  butin: { ic: '📦', t: s => `Une cache sans surveillance à ${s}`, d: 'Un butin, avec un peu d’audace' },
  indic: { ic: '🕵', t: s => `Un indic vend des infos à ${s}`, d: 'Indice sur les pierres' }
};
function ensureLeads() {
  if (!G || !G.world || !G.pc) return; const W = G.world; W.leads = W.leads || {};
  Object.keys(W.leads).forEach(k => { if (W.leads[k].exp < G.wk || k === G.loc && false) delete W.leads[k]; });
  const n = () => Object.keys(W.leads).length; let guard = 0;
  while (n() < 5 && guard++ < 30) {
    const st = pick(DATA.states).id; if (st === G.loc || W.leads[st]) continue;
    const kinds = ['contrat', 'contrat', 'recrue', 'crise', 'rival', 'butin', ...(stonesUnlocked() ? ['indic'] : [])]; const kind = pick(kinds); const l = { kind, st, exp: G.wk + rint(8, 14) };
    if (kind === 'recrue') { const c = pick(DATA.chars.filter(c => c.stars >= 1 && c.stars <= 3 && c.faction !== 'civils' && G.world.npc[c.id].alive && G.world.npc[c.id].st === 'free' && !G.pc.party.some(p => p.id === c.id))); if (!c) continue; l.cid = c.id; G.world.npc[c.id].loc = st; }
    if (kind === 'rival') { const e = enemiesOf(G.pc.faction); l.fid = e.length ? pick(e) : 'fa'; }
    W.leads[st] = l;
  }
}
const leadTitle = l => LEAD_KINDS[l.kind].t(capName(l.st)) + (l.kind === 'recrue' && CH[l.cid] ? ` : ${CH[l.cid].name}` : '');
function leadMap() { const m = new Map(); const L = (G.world && G.world.leads) || {}; Object.keys(L).forEach(k => { if (L[k].exp >= G.wk) m.set(k, L[k]); }); return m; }
function leadAct(l) {
  const pc = G.pc; const W = G.world; delete W.leads[l.st]; const tier = clamp(Math.max(1, pc.grade), 1, 4);
  if (l.kind === 'contrat') { const o = genOffer(pc.faction !== 'civils' ? pc.faction : 'civils', Math.min(5, tier + 1), {}); o.pay *= 2; o.xp = Math.round(o.xp * 1.5); return missionBrief(o); }
  if (l.kind === 'crise') { const o = genOffer('civils', tier, { arch: pick(['humanitaire', 'climat']) }); o.pay = Math.round(o.pay * 1.5); o.xp = Math.round(o.xp * 2); return missionBrief(o); }
  if (l.kind === 'recrue') return CH[l.cid] ? meetNpc(l.cid) : hub();
  if (l.kind === 'rival') { const f = F[l.fid] || F.fa; return show({ kicker: 'OPPORTUNITÉ', title: `${f.name} s’installe ici`, text: ['Leurs hommes tiennent un entrepôt. Les chasser ferait du bruit, et de la gloire.'], choices: [C('Les attaquer', () => startCombat({ title: `Raid contre ${f.name}`, foes: foesFor(l.fid, tier, 2), intro: 'Ils ne vous attendaient pas.', lethal: lethalOf(l.fid), canFlee: true, onWin: L => show({ kicker: 'OPPORTUNITÉ', title: 'Entrepôt nettoyé', text: ['Tu repars avec les honneurs, et leur caisse.'], fx: [...L, ...fx({ merit: 4 + tier, money: 120 * tier, rep: { [l.fid]: -6, civils: 3 }, heat: 3 })], choices: [C('Continuer', hub)] }), onFlee: () => hub() }), { ic: '⚔', cls: 'risk' }), C('Passer', hub, { cls: 'back' })] }); }
  if (l.kind === 'butin') { const dc = 12 + 2 * tier; return show({ kicker: 'OPPORTUNITÉ', title: 'Une cache sans gardien', text: ['Des caisses sous une bâche, une porte mal fermée. Personne en vue.'], choices: [C('S’y glisser', () => { const r = check('agilite', dc, ['stealth']); if (r.ok) lootPick({ pay: 200 * tier, tier }, 'crit'); else show({ kicker: 'OPPORTUNITÉ', title: 'Un piège', text: ['Une alarme, un chien, des coups.', checkLine(r)], fx: fx({ hp: -rint(6, 14), heat: 3 }), choices: [C('Continuer', hub)] }); }, { odds: ['agilite', dc, ['stealth']], ic: '🥷' }), C('Forcer la serrure à la brute', () => { const r = check('corps', dc - 1, ['combat']); if (r.ok) lootPick({ pay: 150 * tier, tier }, 'ok'); else show({ kicker: 'OPPORTUNITÉ', title: 'Le bruit attire du monde', text: ['Des gardes arrivent, trop tard pour t’arrêter mais pas pour te blesser.', checkLine(r)], fx: fx({ hp: -rint(8, 16), heat: 4 }), choices: [C('Continuer', hub)] }); }, { odds: ['corps', dc - 1, ['combat']], ic: '🔨' }), C('Passer', hub, { cls: 'back' })] }); }
  if (l.kind === 'indic') return show({ kicker: 'OPPORTUNITÉ', title: 'Un indic', text: ['Un homme nerveux t’attire dans une ruelle : « Je sais des choses sur les pierres antiques. »'], choices: [C('Payer 150 ¢', () => { pc.money -= 150; const w = G.wk; G.wk = Math.max(G.wk, 6); const t = stoneClueGain(); G.wk = w; show({ kicker: 'OPPORTUNITÉ', title: 'Une piste', text: [t ? cap(t) : 'Il n’a rien de neuf à te vendre. Il s’excuse.'], fx: fx({ xp: 15 }), choices: [C('Continuer', hub)] }); }, { req: { money: 150 }, ic: '💰' }), C('Le faire parler', () => { const r = check('charisme', 14, ['social']); const w = G.wk; G.wk = Math.max(G.wk, 6); const t = r.ok ? stoneClueGain() : null; G.wk = w; show({ kicker: 'OPPORTUNITÉ', title: r.ok ? 'Il craque' : 'Il se rétracte', text: [r.ok ? (t ? cap(t) : 'Il ne sait rien de neuf.') : 'Il s’enfuit dans la nuit.', checkLine(r)], fx: r.ok ? fx({ xp: 15 }) : [], choices: [C('Continuer', hub)] }); }, { odds: ['charisme', 14, ['social']], ic: '🗣' }), C('Passer', hub, { cls: 'back' })] });
  hub();
}
