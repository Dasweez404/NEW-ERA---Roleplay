// ───────── Capacité signature active en combat + aperçu visuel de l'adversaire ─────────
function sigMove() {
  const ps = pcPowers(); if (!ps.length) return null; CB.sig = CB.sig || {};
  const p = ps.find(x => !CB.sig[x.id]) || ps[0]; const k = perkOf(p); if (!k) return null; const lv = pxLevel(p.id); const used = (CB.sig[p.id] || 0) >= (lv >= 3 ? 2 : 1); const cost = lv >= 2 ? 1 : 2;
  return { id: 'sig', pid: p.id, ic: '✦', label: `Signature : ${k.title}`, sub: `${p.name} · ${SIG_TXT[k.effs[0].id] || 'effet de pouvoir'} · ${cost} énergie · round gagné d’office · ${lv >= 3 ? 'deux' : 'une'} fois · niv. ${lv}`, kind: 'sig', cost, cls: 'safe', lock: used ? 'Déjà utilisée dans ce combat' : null };
}
const SIG_TXT = { dodge: 'esquive les 2 prochaines ripostes', shield: 'bouclier massif', dmg: 'frappe surpuissante', regen: 'soigne 30 % de ta vie', energy: 'recharge la moitié de ton énergie', stun: 'sidère tous les ennemis', thorns: 'renvoie les coups reçus', crit: 'coup critique garanti', first: 'frappe éclair puis esquive', def: 'garde de fer', weaken: 'affaiblit tous les ennemis', allyheal: 'soigne ton équipe', drain: 'frappe qui te soigne', lastbreath: 'te remet debout et te protège', pierce: 'frappe qui ignore les boucliers', night: 'frappe de l’ombre', cash: 'butin garanti en cas de victoire', xp: 'expérience doublée en cas de victoire', quiet: 'ta prime ne monte pas', loot: 'butin garanti', bond: 'galvanise ton équipe', travel: 'te dérobe aux coups', rest: 'te soigne 20 %', fix: 'bouclier improvisé', clue: 'analyse : +3 pour toucher' };
function sigDo(m) {
  const pc = G.pc; const p = PW[m.pid]; const k = perkOf(p); const e = k.effs[0]; const id = e.id; CB.sig[m.pid] = (CB.sig[m.pid] || 0) + 1; pxGain(m.pid, 1);
  clog(`✦ ${k.title} ! Round gagné d’office.`, 'acc'); pop('f0', 'ROUND GAGNÉ', 'crit');
  const heal = pct => { const g = Math.round(pc.hpMax * pct); pc.hp = Math.min(pc.hpMax, pc.hp + g); pop('pc', `+${g}`, 'ok'); clog(`+${g} PV.`, 'good'); };
  if (id === 'dodge' || id === 'travel') CB.dodge += 2;
  else if (id === 'shield' || id === 'fix' || id === 'def') CB.shield += 6 + e.mag * 2;
  else if (id === 'regen' || id === 'rest') heal(id === 'rest' ? 0.2 : 0.3);
  else if (id === 'drain') heal(0.15);
  else if (id === 'energy') { pc.en = Math.min(pc.enMax, pc.en + Math.ceil(pc.enMax / 2)); clog('Énergie rechargée.', 'good'); }
  else if (id === 'stun') { aliveFoes().forEach(x => { x.stun = 1; }); CB.nextBonus += 2; clog('Les ennemis sont sidérés : prochain round +2.', 'good'); }
  else if (id === 'thorns') CB.dodge += 1;
  else if (id === 'weaken') aliveFoes().forEach(x => { x.dmg = Math.max(1, x.dmg - 2); });
  else if (id === 'allyheal' || id === 'bond') { heal(0.15); pc.party.forEach(a => { a.hp = Math.min(a.hpMax, a.hp + Math.round(a.hpMax * 0.3)); if (a.inj > 0) { a.inj = 0; a.hp = Math.ceil(a.hpMax / 3); } }); CB.hitBuff += 1; }
  else if (id === 'lastbreath') { CB.lb = true; heal(0.15); CB.shield += 4; }
  else if (id === 'cash') CB.bonusMoney = (CB.bonusMoney || 0) + 100; else if (id === 'xp') CB.bonusXp = 1;
  else if (id === 'loot') CB.bonusLoot = 1; else if (id === 'quiet') CB.quiet = 1;
  else if (id === 'first' || id === 'crit' || id === 'dmg' || id === 'pierce' || id === 'night') CB.nextBonus += 3 + Math.floor(e.mag / 2);
  else { CB.hitBuff += 2; clog('Ton pouvoir affûte tes gestes : +2 aux jets.', 'good'); }
}
// Visuel d'adversaire : uniquement un sprite fourni (personnage identifié). Sinon rien n'est affiché.
function foeIcon(f, px) { return (f.cid && typeof hasSpr === 'function' && hasSpr(f.cid)) ? h('span', { class: 'foeico' }, sprFit(f.cid, px)) : null; }
function foeSpecialChips(f) { return (f.sp || []).map(s => ANTI[s] ? h('span', { class: 'tag', title: ANTI[s].d }, ANTI[s].n) : null).filter(Boolean); }
function renderPreview() {
  const cfg = CB.cfg; const cards = h('div', { class: 'fpv' }, CB.foes.map(f => {
    const t = f.tier || Math.max(1, Math.round(f.atk / 2));
    return h('div', { class: 'fcard' }, foeIcon(f, 88) || '', h('div', { class: 'fi2' }, h('b', {}, fname(f)), h('div', { class: 'small mut' }, `Menace ${'★'.repeat(Math.min(5, t))}${'☆'.repeat(Math.max(0, 5 - t))}${f.m ? ' · machine' : ''}`), h('div', { class: 'bar hp mini' }, h('i', { style: 'width:100%' })), h('div', { class: 'small' }, `${f.hpMax} PV · dégâts ${f.dmg}`), h('div', {}, foeSpecialChips(f))));
  }));
  const L = [C('Combattre', engage, { ic: '⚔', cls: 'cta' })];
  if (cfg.canFlee !== false) L.push(C('Fuir', flee, { odds: ['agilite', 11 + CB.foes.length + CB.tier * 2, ['mobility']], cls: 'back' }));
  show({ compact: true, kicker: 'FACE À FACE', title: cfg.title || 'Un affrontement', text: [cfg.intro || '', `<span class="mut">Affrontement en <b>${CB.N} rounds</b> : une décision par round. Tu gagnes tout : ton adversaire tombe. Tu gagnes la majorité : il s’enfuit. Tu perds la majorité : tu bats en retraite, blessé. Tu perds tout : c’est la défaite.</span>`], extra: cards, choices: L });
}
