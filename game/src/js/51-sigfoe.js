// ───────── Capacité signature active en combat + aperçu visuel de l'adversaire ─────────
function sigMove() {
  const ps = pcPowers(); if (!ps.length) return null; CB.sig = CB.sig || {};
  const p = ps.find(x => !CB.sig[x.id]) || ps[0]; const k = perkOf(p); if (!k) return null; const used = !!CB.sig[p.id]; const cost = 2;
  return { id: 'sig', pid: p.id, ic: '✦', label: `Signature : ${k.title}`, sub: `${p.name} · ${SIG_TXT[k.effs[0].id] || 'effet de pouvoir'} · ${cost} énergie · une fois par combat`, kind: 'sig', cost, cls: 'safe', lock: used ? 'Déjà utilisée dans ce combat' : null };
}
const SIG_TXT = { dodge: 'esquive les 2 prochaines ripostes', shield: 'bouclier massif', dmg: 'frappe surpuissante', regen: 'soigne 30 % de ta vie', energy: 'recharge la moitié de ton énergie', stun: 'sidère tous les ennemis', thorns: 'renvoie les coups reçus', crit: 'coup critique garanti', first: 'frappe éclair puis esquive', def: 'garde de fer', weaken: 'affaiblit tous les ennemis', allyheal: 'soigne ton équipe', drain: 'frappe qui te soigne', lastbreath: 'te remet debout et te protège', pierce: 'frappe qui ignore les boucliers', night: 'frappe de l’ombre', cash: 'butin garanti en cas de victoire', xp: 'expérience doublée en cas de victoire', quiet: 'ta prime ne monte pas', loot: 'butin garanti', bond: 'galvanise ton équipe', travel: 'te dérobe aux coups', rest: 'te soigne 20 %', fix: 'bouclier improvisé', clue: 'analyse : +3 pour toucher' };
function sigDo(m) {
  const pc = G.pc; const p = PW[m.pid]; const k = perkOf(p); const e = k.effs[0]; const id = e.id; const f = firstFoe(); CB.sig[m.pid] = 1; CB.sev = 0.2;
  clog(`✦ ${k.title} !`, 'acc'); const big = (mul, crit) => { if (f) hurtFoe(f, dmgBase() * mul + e.mag, crit, `${k.title} frappe`); };
  const heal = pct => { const g = Math.round(pc.hpMax * pct); pc.hp = Math.min(pc.hpMax, pc.hp + g); pop('pc', `+${g}`, 'ok'); clog(`+${g} PV.`, 'good'); };
  if (id === 'dodge' || id === 'travel') { CB.dodge += 2; CB.sev = 0; }
  else if (id === 'shield' || id === 'fix' || id === 'def') { CB.shield += 6 + e.mag * 2; CB.sev = 0.1; }
  else if (id === 'dmg' || id === 'night') big(1.8, false);
  else if (id === 'crit') big(1.5, true);
  else if (id === 'pierce') { if (f) f.shield = 0; big(1.6, false); }
  else if (id === 'first') { big(1.3, false); CB.dodge++; }
  else if (id === 'drain') { big(1.4, false); heal(0.15); }
  else if (id === 'regen' || id === 'rest') heal(id === 'rest' ? 0.2 : 0.3);
  else if (id === 'energy') { pc.en = Math.min(pc.enMax, pc.en + Math.ceil(pc.enMax / 2)); clog('Énergie rechargée.', 'good'); }
  else if (id === 'stun') { aliveFoes().forEach(x => { x.stun = Math.max(x.stun, 1); }); CB.sev = 0; clog('Tous les ennemis sont sidérés.', 'good'); }
  else if (id === 'thorns') { CB.counter = 4 + e.mag * 2; clog('Tes ennemis paieront chaque coup.', 'good'); }
  else if (id === 'weaken') { aliveFoes().forEach(x => { x.dmg = Math.max(1, x.dmg - 2); x.def = Math.max(0, x.def - 1); }); clog('Les ennemis vacillent.', 'good'); }
  else if (id === 'allyheal' || id === 'bond') { heal(0.15); pc.party.forEach(a => { a.hp = Math.min(a.hpMax, a.hp + Math.round(a.hpMax * 0.3)); if (a.inj > 0) { a.inj = 0; a.hp = Math.ceil(a.hpMax / 3); } }); CB.hitBuff += 1; }
  else if (id === 'lastbreath') { CB.lb = true; heal(0.15); CB.shield += 4; }
  else if (id === 'cash') CB.bonusMoney = (CB.bonusMoney || 0) + 100; else if (id === 'xp') CB.bonusXp = 1;
  else if (id === 'loot') CB.bonusLoot = 1; else if (id === 'quiet') CB.quiet = 1;
  else { CB.hitBuff += 3; clog('Ton pouvoir affûte tes gestes : +3 pour toucher.', 'good'); }
}
// ── Aperçu visuel de l'adversaire (silhouette vectorielle) ──
const FOE_LOOK = { droide: 'droid', centaure: 'beast', gorgone: 'beast', harpie: 'wing', sirene: 'beast', griffon: 'wing', hydre: 'beast', cerbere: 'beast', chimere: 'beast', cyclope: 'mech', atlas: 'mech', prometh: 'mech', epimeth: 'mech', menet: 'mech', bete: 'beast', cyborg: 'cyb', soldat: 'helm', mercenaire: 'cap', gladiateur: 'horn', voyou: 'cap', pirate: 'cap', necro: 'mohawk', ragnarok: 'horn', optimum: 'helm', secte: 'mask', garde: 'helm', fallen: 'mask', porteur: 'plain' };
const FOE_HUE = { fa: '#3d7bff', droide: '#3d7bff', soldat: '#3d7bff', arena: '#ff8a1f', gladiateur: '#ff8a1f', mercenaire: '#c9d1ff', voyou: '#8ee08e', pirate: '#27f0ff', cyborg: '#27f0ff', necro: '#ff3d7f', ragnarok: '#ff6a3d', optimum: '#b026ff', secte: '#b026ff', garde: '#cfd3e6', fallen: '#ff2a2a', bete: '#d4a017', porteur: '#fcee09' };
function foeIcon(f, px) {
  if (f.cid && typeof hasSpr === 'function' && hasSpr(f.cid)) return h('span', { class: 'foeico' }, sprFit(f.cid, px));
  const look = FOE_LOOK[f.tid] || 'plain'; const col = FOE_HUE[f.tid] || FOE_HUE[f.fid] || '#fcee09'; const dk = '#0b0b16'; const sk = '#e8c9a8';
  const body = (w = 22) => `<rect x="${32 - w / 2}" y="28" width="${w}" height="24" fill="${col}"/><rect x="${32 - w / 2 - 6}" y="30" width="6" height="18" fill="${col}"/><rect x="${32 + w / 2}" y="30" width="6" height="18" fill="${col}"/><rect x="24" y="52" width="6" height="10" fill="${dk}"/><rect x="34" y="52" width="6" height="10" fill="${dk}"/>`;
  const head = `<rect x="25" y="14" width="14" height="14" fill="${sk}"/><rect x="28" y="19" width="2" height="3" fill="${dk}"/><rect x="34" y="19" width="2" height="3" fill="${dk}"/>`;
  let g;
  if (look === 'droid') g = `<rect x="22" y="12" width="20" height="16" fill="#9aa0c8"/><rect x="26" y="17" width="12" height="4" fill="#ff2a6d"/><rect x="31" y="4" width="2" height="8" fill="#9aa0c8"/><circle cx="32" cy="4" r="2" fill="#ff2a6d"/>${body(24)}`;
  else if (look === 'mech') g = `<rect x="14" y="26" width="36" height="28" fill="#6b708f"/><rect x="22" y="10" width="20" height="16" fill="#9aa0c8"/><circle cx="32" cy="18" r="5" fill="#ff2a6d"/><rect x="6" y="28" width="8" height="22" fill="#6b708f"/><rect x="50" y="28" width="8" height="22" fill="#6b708f"/><rect x="18" y="54" width="10" height="8" fill="${dk}"/><rect x="36" y="54" width="10" height="8" fill="${dk}"/>`;
  else if (look === 'beast') g = `<polygon points="22,18 26,6 30,16" fill="${col}"/><polygon points="34,16 38,6 42,18" fill="${col}"/><rect x="20" y="16" width="24" height="18" fill="${col}"/><rect x="25" y="22" width="4" height="4" fill="#fff"/><rect x="35" y="22" width="4" height="4" fill="#fff"/><rect x="26" y="28" width="12" height="3" fill="${dk}"/><rect x="14" y="34" width="36" height="18" fill="${col}"/><rect x="16" y="52" width="6" height="10" fill="${dk}"/><rect x="42" y="52" width="6" height="10" fill="${dk}"/>`;
  else if (look === 'wing') g = `<polygon points="4,30 28,26 28,44" fill="${col}"/><polygon points="60,30 36,26 36,44" fill="${col}"/>${head}<rect x="26" y="28" width="12" height="22" fill="${col}"/>`;
  else { g = head + body(); if (look === 'helm') g += `<rect x="24" y="11" width="16" height="9" fill="${col}"/><rect x="26" y="19" width="12" height="3" fill="${dk}"/>`; else if (look === 'cap') g += `<rect x="24" y="12" width="16" height="5" fill="${col}"/><rect x="38" y="15" width="6" height="2" fill="${col}"/>`; else if (look === 'horn') g += `<rect x="24" y="11" width="16" height="6" fill="${col}"/><polygon points="24,12 20,4 26,10" fill="#fff"/><polygon points="40,12 44,4 38,10" fill="#fff"/>`; else if (look === 'mohawk') g += `<polygon points="28,14 30,3 34,3 36,14" fill="${col}"/>`; else if (look === 'mask') g += `<rect x="25" y="18" width="14" height="10" fill="#f2f3ff"/><rect x="28" y="21" width="3" height="3" fill="${dk}"/><rect x="34" y="21" width="3" height="3" fill="${dk}"/>`; else if (look === 'cyb') g += `<rect x="25" y="14" width="7" height="14" fill="#9aa0c8"/><rect x="33" y="19" width="6" height="3" fill="#ff2a6d"/>`; }
  return h('span', { class: 'foeico', html: `<svg viewBox="0 0 64 64" width="${px}" height="${px}" shape-rendering="crispEdges" aria-hidden="true">${g}</svg>` });
}
function foeSpecialChips(f) { return (f.sp || []).map(s => ANTI[s] ? h('span', { class: 'tag', title: ANTI[s].d }, ANTI[s].n) : null).filter(Boolean); }
function renderPreview() {
  const cfg = CB.cfg; const cards = h('div', { class: 'fpv' }, CB.foes.map(f => {
    const t = f.tier || Math.max(1, Math.round(f.atk / 2));
    return h('div', { class: 'fcard' }, foeIcon(f, 88), h('div', { class: 'fi2' }, h('b', {}, fname(f)), h('div', { class: 'small mut' }, `Menace ${'★'.repeat(Math.min(5, t))}${'☆'.repeat(Math.max(0, 5 - t))}${f.m ? ' · machine' : ''}`), h('div', { class: 'bar hp mini' }, h('i', { style: 'width:100%' })), h('div', { class: 'small' }, `${f.hpMax} PV · dégâts ${f.dmg}`), h('div', {}, foeSpecialChips(f))));
  }));
  const L = [C('Combattre', engage, { ic: '⚔', cls: 'cta' })];
  if (cfg.canFlee !== false) L.push(C('Fuir', flee, { odds: ['agilite', 11 + CB.foes.length + CB.tier * 2, ['mobility']], cls: 'back' }));
  show({ compact: true, kicker: 'FACE À FACE', title: cfg.title || 'Un affrontement', text: [cfg.intro || ''], extra: cards, choices: L });
}
