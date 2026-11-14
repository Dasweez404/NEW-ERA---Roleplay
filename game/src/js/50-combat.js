// ───────── Combat tour par tour ─────────
const FOE = {
  soldat: { n: 'Soldat de la Force d’Autorité', hp: 20, atk: 0, def: 1, dmg: 2, sp: ['shield', 'rebound', 'buff', 'foresight'] },
  droide: { n: FA_UNITS.droide, hp: 18, atk: 1, def: 1, dmg: 2, sp: ['shock'], m: 1 }, centaure: { n: FA_UNITS.centaure, hp: 28, atk: 0, def: 2, dmg: 2, sp: ['shock', 'shield'], m: 1 },
  gorgone: { n: FA_UNITS.gorgone, hp: 24, atk: 1, def: 2, dmg: 3, sp: ['foresight'], m: 1 }, harpie: { n: FA_UNITS.harpie, hp: 16, atk: 2, def: 3, dmg: 2, sp: ['dash'], m: 1 },
  sirene: { n: FA_UNITS.sirene, hp: 20, atk: 1, def: 2, dmg: 3, sp: ['shock'], m: 1 }, griffon: { n: FA_UNITS.griffon, hp: 18, atk: 2, def: 2, dmg: 3, sp: ['dash'], m: 1 },
  hydre: { n: FA_UNITS.hydre, hp: 22, atk: 1, def: 2, dmg: 2, sp: ['shock'], m: 1 }, cerbere: { n: FA_UNITS.cerbere, hp: 20, atk: 2, def: 1, dmg: 3, sp: ['foresight'], m: 1 },
  chimere: { n: FA_UNITS.chimere, hp: 22, atk: 2, def: 3, dmg: 4, sp: [], m: 1 }, cyclope: { n: FA_UNITS.cyclope, hp: 40, atk: 1, def: 3, dmg: 5, sp: ['shield'], m: 1 },
  atlas: { n: FA_UNITS.atlas, hp: 70, atk: 2, def: 4, dmg: 7, sp: ['shield', 'shock'], m: 1 }, prometh: { n: FA_UNITS.prometh, hp: 66, atk: 3, def: 4, dmg: 7, sp: ['buff', 'shock'], m: 1 },
  epimeth: { n: FA_UNITS.epimeth, hp: 64, atk: 3, def: 5, dmg: 6, sp: ['foresight', 'shield'], m: 1 }, menet: { n: FA_UNITS.menet, hp: 72, atk: 2, def: 4, dmg: 8, sp: ['buff', 'dash'], m: 1 },
  fallen: { n: 'Chasseur Fallen (implant explosif)', hp: 22, atk: 2, def: 2, dmg: 3, sp: ['dash', 'foresight'] },
  mercenaire: { n: 'Mercenaire du Check', hp: 22, atk: 2, def: 1, dmg: 3, sp: ['buff'] }, gladiateur: { n: 'Gladiateur de l’ARENA', hp: 26, atk: 2, def: 2, dmg: 3, sp: ['buff', 'restore'] },
  voyou: { n: 'Voyou des bidonvilles', hp: 16, atk: 0, def: 0, dmg: 2, sp: [] }, pirate: { n: 'Pirate de l’Alliance Galleon', hp: 20, atk: 1, def: 1, dmg: 3, sp: ['buff'] },
  cyborg: { n: 'Cyborg du Projet Saibogu', hp: 26, atk: 1, def: 3, dmg: 3, sp: ['shield'] }, necro: { n: 'Necropunk', hp: 18, atk: 1, def: 0, dmg: 4, sp: ['buff'] },
  ragnarok: { n: 'Guerrier Ragnarök', hp: 28, atk: 1, def: 1, dmg: 4, sp: ['buff'] }, optimum: { n: 'Fanatique du Clan Optimum', hp: 24, atk: 1, def: 1, dmg: 3, sp: ['buff', 'foresight'] },
  secte: { n: 'Gardien de la Secte Committed', hp: 22, atk: 1, def: 1, dmg: 3, sp: ['restore'] }, bete: { n: 'Créature mutante', hp: 26, atk: 1, def: 0, dmg: 4, sp: [] },
  garde: { n: 'Garde du corps', hp: 22, atk: 1, def: 2, dmg: 3, sp: ['shield'] }, porteur: { n: 'Géno-porteur', hp: 22, atk: 1, def: 1, dmg: 3, sp: ['dash', 'buff'] },
};
function mkFoe(tid, tier, name, extra = {}) {
  const b = FOE[tid] || FOE.porteur; const hp = Math.round(b.hp * (0.6 + 0.5 * tier));
  return Object.assign({ tid, name: name || b.n, hp, hpMax: hp, atk: b.atk + 2 * tier, def: b.def + 2 * tier - 1, dmg: b.dmg + 2 * tier, sp: b.sp, m: !!b.m, stun: 0, shield: 0, buff: 0, fore: 0, dash: 0, dead: false, weak: 0 }, extra);
}
const FOE_BY_FAC = { fa: ['soldat', 'droide', 'centaure', 'gorgone', 'harpie'], arena: ['gladiateur'], check: ['mercenaire'], slummer: ['voyou'], galleon: ['pirate'], saibogu: ['cyborg'], necropunks: ['necro'], ragnaroks: ['ragnarok'], optimum: ['optimum'], committed: ['secte'], manacorp: ['garde'], gamma: ['cyborg', 'garde'], fallen: ['fallen'], noir: ['mercenaire', 'garde'], omega: ['porteur'] };
function foesFor(fid, tier, n = 2) {
  const out = []; const pool = FOE_BY_FAC[fid];
  for (let i = 0; i < n; i++) {
    if (pool) out.push(mkFoe(pick(pool), tier));
    else { const mem = DATA.chars.filter(c => c.faction === fid && G.world.npc[c.id].alive && G.world.npc[c.id].st !== 'ally' && !Object.values(F).some(f => f.leaders.includes(c.id))); const c = mem.length ? pick(mem) : null; out.push(mkFoe('porteur', tier, c ? c.name + ' (' + F[fid].name + ')' : 'Membre de ' + F[fid].name)); }
  }
  return out;
}
let CB = null;
const POWER_FX = {
  combat: { n: 'Frappe de pouvoir', cost: 3, d: 'Dégâts élevés' }, control: { n: 'Entraver', cost: 2, d: 'Étourdit la cible 1–2 tours' }, defense: { n: 'Bouclier', cost: 2, d: 'Absorbe des dégâts' },
  heal: { n: 'Régénération', cost: 3, d: 'Soigne toi (et ton groupe)' }, mobility: { n: 'Esquive surnaturelle', cost: 2, d: 'Évite la prochaine attaque' }, stealth: { n: 'Disparaître', cost: 2, d: 'Prochaine frappe critique' },
  hack: { n: 'Piratage', cost: 2, d: 'Neutralise une machine' }, scout: { n: 'Analyse', cost: 1, d: '+3 pour toucher pendant le combat' }, social: { n: 'Intimider', cost: 1, d: 'Affaiblit l’attaque ennemie' }, tech: { n: 'Bricolage', cost: 2, d: 'Déploie un drone qui frappe chaque tour' },
};
const ANTI = {
  buff: { n: 'Buff', d: 'Force infatigable (+4 dégâts, 3 tours)' }, rebound: { n: 'Rebound', d: 'Dévie les projectiles : bouclier 8 et riposte' }, shield: { n: 'Shield', d: 'Corps protégé d’un bouclier de verre (8)' },
  restore: { n: 'Restore', d: 'Auto-régénération d’énergie et de vie' }, foresight: { n: 'Foresight', d: 'Anticipation : défense +3 (3 tours)' }, shock: { n: 'Shock', d: 'Onde de choc : étourdit tous les ennemis' }, dash: { n: 'Dash', d: 'Esquive aérienne (prochaine attaque)' },
};
function pop(k, txt, cls) { if (CB) (CB.pops = CB.pops || []).push({ k, txt, cls }); }
const aliveFoes = () => CB.foes.filter(f => !f.dead);
const target = () => { let t = CB.foes[CB.tgt]; if (!t || t.dead) { t = aliveFoes()[0]; CB.tgt = CB.foes.indexOf(t); } return t; };
const clog = (t, c = '') => { CB.log.push({ t, c }); if (CB.log.length > 40) CB.log.shift(); };
function pcDef() { const pc = G.pc; const a = armorOf(); return 3 + Math.floor(A('agilite') / 2) + (a ? a.def : 0) + (pc.style === 'juggernaut' ? 1 : 0) + (CB && CB.defend ? 3 : 0) + (CB && CB.fore > 0 ? 3 : 0) + (hasRole('gardien') ? 1 : 0); }

function startCombat(cfg) {
  CB = { cfg, foes: cfg.foes, round: 1, log: [], tgt: 0, menu: 'main', shield: 0, defend: false, crit: false, dodge: 0, drones: 0, buff: 0, fore: 0, hitBuff: 0, rage: false, boost: 0, stunPc: 0, noItems: false, wasAwake: false, tier: Math.max(...cfg.foes.map(f => Math.round((f.atk) / 2))) };
  CB.foes.forEach(f => { f.dead = false; });
  clog(cfg.intro || 'Le combat commence !');
  renderCombat();
}
function renderCombat() {
  const cfg = CB.cfg; const pc = G.pc;
  CB.prev = CB.prev || {}; const bars = [];
  const foes = h('div', {}, CB.foes.map((f, i) => h('div', { class: 'foe' + (f.dead ? ' dead' : '') + (i === CB.tgt && !f.dead ? ' tgt' : ''), 'data-k': 'f' + i, onclick: () => { if (!f.dead) { sfx('click'); CB.tgt = i; renderCombat(); } } },
    h('b', {}, f.name), ' ', f.stun > 0 ? h('span', { class: 'warnc' }, '[étourdi] ') : null, f.shield ? h('span', { class: 'acc' }, '[bouclier] ') : null, f.weak ? h('span', { class: 'warnc' }, '[affaibli] ') : null,
    (() => { const bi = h('i', { style: `width:${(CB.prev[i] != null ? CB.prev[i] : Math.max(0, f.hp)) / f.hpMax * 100}%` }); bars.push([bi, Math.max(0, f.hp) / f.hpMax * 100]); CB.prev[i] = Math.max(0, f.hp); return h('div', { class: 'bar hp' }, bi); })(), h('div', { class: 'small mut' }, `PV ${Math.max(0, f.hp)}/${f.hpMax} · attaque +${f.atk} · défense ${f.def} · dégâts ${f.dmg}`))));
  const allies = pc.party.length ? h('div', { class: 'small mut' }, 'Alliés : ' + pc.party.map(a => `${CH[a.id].name} (${a.inj > 0 ? 'hors combat' : a.hp + ' PV'})`).join(', ')) : null;
  const status = h('div', { class: 'small pcstat', 'data-k': 'pc' }, `Toi : ${pc.hp}/${pc.hpMax} PV · ${pc.en}/${pc.enMax} énergie · défense ${pcDef()}${CB.shield ? ' · bouclier ' + CB.shield : ''}${CB.buff > 0 ? ' · Buff' : ''}${CB.rage ? ' · BÊTE FÉROCE' : ''}`);
  const log = h('div', { class: 'log' }, CB.log.slice(-9).map(l => h('div', { class: l.c }, l.t)));
  const pops = CB.pops || []; CB.pops = []; const hurt = CB.hurt; CB.hurt = false;
  const hook = () => {
    requestAnimationFrame(() => bars.forEach(([b, w]) => { b.style.width = w + '%'; }));
    let dmgF = false, dmgP = false, miss = false;
    pops.forEach((p, n) => { const host = document.querySelector(`.combat [data-k="${p.k}"]`); if (!host) return; if (p.cls === 'dmg' || p.cls === 'crit') { if (p.k === 'pc') dmgP = true; else dmgF = true; host.classList.add('hit'); } if (p.cls === 'miss') miss = true;
      const el = h('span', { class: 'pop ' + p.cls, style: `animation-delay:${n * 140}ms;left:${20 + Math.random() * 55}%` }, p.txt); host.append(el); if (p.cls === 'crit') burstAt(host, '#ffe83a', 16); setTimeout(() => el.remove(), 1500 + n * 140); });
    if (dmgF) { sfx('hit'); buzz(20); } else if (miss) sfx('miss'); if (dmgP || hurt) { setTimeout(() => { sfx('hurt'); shake(); flash('#ff3d7f'); }, 180); }
  };
  show({ after: hook, kicker: `COMBAT — tour ${CB.round}`, title: cfg.title, text: [], extra: h('div', { class: 'combat' }, foes, allies, status, log), choices: combatChoices() });
}
function combatChoices() {
  const pc = G.pc; const st = STYLES[pc.style]; const t = target();
  if (CB.menu === 'power') {
    const tags = Object.keys(powerTags()).filter(x => POWER_FX[x]);
    const list = tags.map(tag => { const e = POWER_FX[tag]; const lock = (tag === 'hack' && !t.m) ? 'La cible n’est pas une machine' : null; return Object.assign(C(`${e.n} — ${e.cost} énergie`, () => usePower(tag), { sub: e.d + (pc.en < e.cost ? ' (surcharge risquée !)' : '') }), { lock }); });
    list.push(C('← Retour', () => { CB.menu = 'main'; renderCombat(); })); return list;
  }
  if (CB.menu === 'item') {
    const its = Object.keys(pc.inv).filter(id => ['en8', 'hp15', 'hp40', 'stim'].includes(ITEMS[id].use));
    const l = its.map(id => C(`${ITEMS[id].n} ×${pc.inv[id]}`, () => { useItem(id); clog(`Tu utilises ${ITEMS[id].n}.`, 'good'); CB.menu = 'main'; endPlayerTurn(); }, { sub: ITEMS[id].desc, req: { ok: () => CB.noItems ? 'Tu es en rage : impossible' : null } }));
    if (!its.length) l.push(Object.assign(C('Aucun objet utilisable', () => { }), { lock: 'Sac vide' })); l.push(C('← Retour', () => { CB.menu = 'main'; renderCombat(); })); return l;
  }
  if (CB.menu === 'anti') {
    const l = Object.entries(ANTI).map(([k, e]) => C(`${e.n} — 2 énergie`, () => useAnti(k), { sub: e.d, req: { ok: () => pc.en < 2 ? 'Énergie insuffisante' : null } })); l.push(C('← Retour', () => { CB.menu = 'main'; renderCombat(); })); return l;
  }
  const w = weaponOf(); const hasPow = pcPowers().length > 0; const L = [];
  L.push(C(`Frapper ${t.name}`, () => attack(), { sub: w ? `Arme : ${w.n}` : 'À mains nues', cls: 'safe' }));
  L.push(C('Pouvoir…', () => { CB.menu = 'power'; renderCombat(); }, { req: { ok: () => !hasPow ? 'Tu n’as pas de pouvoir' : null }, sub: 'Utilise ton pouvoir (énergie)' }));
  L.push(C(`Technique de style : ${st.tech.name} — ${st.tech.cost} énergie`, () => styleTech(), { sub: cap(st.tech.text), req: { ok: () => (pc.style === 'performer' && !hasPow) ? 'Requiert un pouvoir' : pc.en < st.tech.cost ? 'Énergie insuffisante' : null } }));
  L.push(C('Défendre', () => { CB.defend = true; clog('Tu te mets en garde et reprends ton souffle.'); fx({ en: 2 }); endPlayerTurn(); }, { sub: '+3 défense ce tour, +2 énergie' }));
  L.push(C('Technique anti-geno…', () => { CB.menu = 'anti'; renderCombat(); }, { req: { ok: () => (pc.faction === 'fa' || pc.flags.antigeno) ? null : 'Technique de la F.A. : formation requise (s’entraîner auprès de la F.A. ou la voler au Marché Noir)' }, sub: 'Buff, Rebound, Shield, Restore, Foresight, Shock, Dash' }));
  L.push(C('Objet…', () => { CB.menu = 'item'; renderCombat(); }));
  const awk = pcPowers().length && pc.hp <= pc.hpMax * 0.4 && !CB.wasAwake;
  L.push(C('⚡ ÉVEIL', () => awaken(), { cls: 'danger', sub: pc.ptype === 'zoologique' ? 'Bête féroce incontrôlable' : pc.ptype === 'elementaire' ? 'Transformation en demi-dieu' : pc.ptype === 'hybride' ? 'Éveil partiel (jamais le plein potentiel)' : 'Capacités amplifiées au maximum', req: { ok: () => !hasPow ? 'Tu n’as pas de pouvoir' : !awk ? 'Les pouvoirs s’éveillent sous une forte émotion : il faut être gravement touché (< 40 % PV)' : null } }));
  if (CB.cfg.canFlee !== false) L.push(C('Fuir', () => flee(), { odds: ['agilite', 11 + CB.cfg.foes.length * 1 + CB.tier * 2, ['mobility']], sub: '' }));
  if (CB.cfg.lethal !== 'death') L.push(C('Se rendre', () => { clog('Tu poses les armes.'); loseCombat(true); }, { cls: 'danger' }));
  return L;
}
function atkMod(tags = ['combat']) { const s = skill(STYLES[G.pc.style].prim === 'maitrise' ? 'corps' : STYLES[G.pc.style].prim, tags); return s.mod + (CB.hitBuff || 0) + (CB.stunPc > 0 ? -3 : 0) + (hasRole('combattant') ? 1 : 0); }
function dmgBase() { const w = weaponOf(); return 3 + Math.floor(A(STYLES[G.pc.style].prim === 'maitrise' ? 'corps' : STYLES[G.pc.style].prim) / 2) + (w ? w.dmg : 0) + (CB.buff > 0 ? 4 : 0) + (CB.rage ? 6 : 0) + (hasRole('combattant') ? 1 : 0); }
function hitFoe(f, dmg, mod, label, o = {}) {
  const r = rint(1, 20); const total = r + mod; const hit = o.auto || r === 20 || (r !== 1 && total >= 10 + f.def);
  const fi = CB.foes.indexOf(f);
  if (f.dash > 0 && !o.auto) { f.dash = 0; pop('f' + fi, 'ESQUIVE', 'miss'); clog(`${f.name} esquive d’un Dash.`, 'log-miss'); return false; }
  if (!hit) { pop('f' + fi, `RATÉ · ${total}`, 'miss'); clog(`${label} ${f.name} : raté (d20 ${r}+${mod}).`, 'log-miss'); return false; }
  let d = Math.max(1, dmg + rint(-1, 2)); if (r === 20 || o.crit) d = Math.round(d * 1.6);
  if (f.shield) { f.shield = 0; pop('f' + fi, 'BLOQUÉ', 'miss'); clog(`Le bouclier de ${f.name} absorbe le coup !`, 'log-miss'); return true; }
  if (f.weak) d += 2; f.hp -= d; pop('f' + fi, `−${d}`, (r === 20 || o.crit) ? 'crit' : 'dmg'); clog(`${label} ${f.name} : ${d} dégâts${r === 20 || o.crit ? ' (CRITIQUE)' : ''} (d20 ${r}+${mod}).`, 'log-hit');
  if (f.hp <= 0) { f.dead = true; clog(`${f.name} est hors combat.`, 'good'); }
  return true;
}
function attack(twice) {
  const t = target(); const mod = atkMod(); let dmg = dmgBase(); let crit = CB.crit; CB.crit = false;
  hitFoe(t, dmg, mod, 'Tu frappes', { crit });
  if (twice && !t.dead) hitFoe(t, dmg, mod - 1, 'Deuxième coup sur');
  endPlayerTurn();
}
function spendEn(cost) {
  const pc = G.pc;
  if (pc.en >= cost) { pc.en -= cost; return true; }
  pc.en = 0; const r = check('maitrise', 12, []);
  if (r.ok) { clog('Tu forces ton pouvoir à bout de souffle… et ça tient.', 'warnc'); return true; }
  const d = 3 + CB.tier * 2; pc.hp = Math.max(0, pc.hp - d); clog(`SURCHARGE ! Le pouvoir te brûle de l’intérieur (−${d} PV).`, 'log-dmg'); return true;
}
function powMul() { return (G.pc.ptype === 'hybride' ? 0.8 : 1) * (CB.boost || 1); }
function usePower(tag) {
  const pc = G.pc; const e = POWER_FX[tag]; const t = target(); CB.menu = 'main';
  spendEn(e.cost); const mm = A('maitrise');
  const mod = skill('maitrise', [tag]).mod + (CB.hitBuff || 0);
  const pname = pcPowers()[0].name;
  const elem = pc.ptype === 'elementaire' ? 3 : 0;
  switch (tag) {
    case 'combat': hitFoe(t, Math.round((4 + mm + elem + (CB.buff > 0 ? 3 : 0)) * powMul()), mod, `${pname} — frappe de pouvoir sur`); break;
    case 'control': { const r = rint(1, 20) + mod; if (r >= 10 + t.def - 2 || t.m && false) { t.stun = 1 + (r >= 18 ? 1 : 0); clog(`${t.name} est entravé par ${pname} !`, 'log-hit'); } else clog(`${pname} glisse sur ${t.name}.`, 'log-miss'); break; }
    case 'defense': CB.shield += Math.round((6 + mm + elem) * powMul()); clog(`${pname} t’enveloppe : bouclier ${CB.shield}.`, 'good'); break;
    case 'heal': { const v = Math.round((8 + mm + elem) * powMul()); pc.hp = Math.min(pc.hpMax, pc.hp + v); pc.party.forEach(a => { if (a.inj <= 0) a.hp = Math.min(a.hpMax, a.hp + 4); }); pop('pc', `+${v}`, 'heal'); clog(`${pname} te régénère (+${v} PV).`, 'good'); break; }
    case 'mobility': CB.dodge = 1; clog(`${pname} : tu te prépares à esquiver.`, 'good'); break;
    case 'stealth': CB.crit = true; CB.dodge = 1; clog(`${pname} : tu disparais des radars. Ta prochaine frappe sera critique.`, 'good'); break;
    case 'hack': { const r = rint(1, 20) + mod; if (r >= 10 + t.def - 1) { t.stun = 2; t.dead = false; clog(`${t.name} est piraté : il reste figé 2 tours.`, 'log-hit'); } else clog(`Le piratage échoue (pare-feu).`, 'log-miss'); break; }
    case 'scout': CB.hitBuff = (CB.hitBuff || 0) + 3; t.weak = 1; clog(`Tu repères les failles de ${t.name} : +3 pour toucher, il prend +2 dégâts.`, 'good'); break;
    case 'social': { t.atk -= 3; t.dmg = Math.max(1, t.dmg - 1); clog(`Tu intimides ${t.name} : son attaque faiblit.`, 'good'); break; }
    case 'tech': CB.drones++; clog('Tu bricoles un drone de combat qui t’épaulera chaque tour.', 'good'); break;
  }
  endPlayerTurn();
}
function useAnti(k) {
  const pc = G.pc; CB.menu = 'main'; if (!spendEn(2)) return;
  if (k === 'buff') { CB.buff = 3; clog('Buff : une force infatigable te gagne.', 'good'); }
  if (k === 'rebound') { CB.shield += 8; CB.rebound = true; clog('Rebound : les projectiles sont déviés.', 'good'); }
  if (k === 'shield') { CB.shield += 8; clog('Shield : ton corps est protégé d’un bouclier de verre.', 'good'); }
  if (k === 'restore') { pc.hp = Math.min(pc.hpMax, pc.hp + 10); pc.en = Math.min(pc.enMax, pc.en + 3); pop('pc', '+10', 'heal'); clog('Restore : tu te régénères.', 'good'); }
  if (k === 'foresight') { CB.fore = 3; clog('Foresight : tu anticipes leurs mouvements.', 'good'); }
  if (k === 'shock') { aliveFoes().forEach(f => f.stun = 1); clog('Shock : une onde de choc étourdit tous tes adversaires !', 'log-hit'); }
  if (k === 'dash') { CB.dodge = 1; clog('Dash : tu t’élèves pour esquiver.', 'good'); }
  endPlayerTurn();
}
function styleTech() {
  const pc = G.pc; const s = pc.style; const t = target(); if (!spendEn(STYLES[s].tech.cost)) return;
  const mod = atkMod(); const dmg = dmgBase();
  if (s === 'brawler') { clog('Enchaînement !', 'good'); attackNoEnd(t, mod, dmg, true); }
  else if (s === 'performer') { const pn = pcPowers()[0]; hitFoe(t, Math.round((6 + A('maitrise') * 1.5) * powMul()), skill('maitrise', ['combat']).mod, `Surcharge de ${pn.name} sur`, { auto: false }); }
  else if (s === 'juggernaut') { CB.shield += 8; CB.counter = 4; clog('Carapace : tu encaisses et prépares la riposte.', 'good'); }
  else if (s === 'protector') { CB.shield += 8; CB.guard = 3; clog('Rempart : tu prends les coups pour ton équipe.', 'good'); }
  else if (s === 'flanker') { clog('Prise à revers !', 'good'); hitFoe(t, dmg + 2, mod + 4, 'Tu surgis dans le dos de', { crit: true }); CB.dodge = 1; }
  else if (s === 'ranger') { hitFoe(t, dmg + 3, mod, 'Tir précis sur', { auto: true, crit: true }); }
  else if (s === 'assist') { aliveFoes().forEach(f => { f.atk -= 2; f.def -= 1; f.weak = 1; }); CB.hitBuff = (CB.hitBuff || 0) + 2; clog('Déstabiliser : les adversaires vacillent, ton camp est galvanisé.', 'good'); }
  else if (s === 'engineer') { CB.drones++; clog('Gadget improvisé : un drone de combat se déploie.', 'good'); }
  endPlayerTurn();
}
function attackNoEnd(t, mod, dmg, twice) { hitFoe(t, dmg, mod, 'Tu frappes'); if (twice && !t.dead) hitFoe(t, dmg, mod - 1, 'Deuxième coup sur'); }
function awaken() {
  const pc = G.pc; CB.wasAwake = true; pc.awakened++; const t = pc.ptype; const free = stoneCount() >= 8;
  clog('⚡ ÉVEIL ! Une émotion démesurée déferle…', 'acc');
  if (t === 'zoologique') { CB.rage = true; CB.noItems = true; CB.hitBuff = (CB.hitBuff || 0) + 4; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.2)); clog('Tu deviens une bête féroce : dégâts décuplés, mais tu perds le contrôle (aucun objet).', 'warnc'); }
  else if (t === 'surnaturel') { CB.boost = 1.5; pc.en = pc.enMax; CB.hitBuff = (CB.hitBuff || 0) + 2; clog('Tes capacités sont amplifiées à leur maximum.', 'good'); }
  else if (t === 'elementaire') { CB.boost = 1.6; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.5)); pc.en = pc.enMax; CB.shield += 10; clog('Tu es transformé en demi-dieu.', 'good'); }
  else { CB.boost = 1.2; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.25)); pc.en = Math.min(pc.enMax, pc.en + 6); clog('Un éveil partiel : tu n’atteindras jamais le plein potentiel de tes deux pouvoirs.', 'good'); }
  CB.awk = free ? 0 : 1; renderCombat();
}
function flee() {
  const dc = 11 + CB.foes.length + CB.tier * 2; const r = check('agilite', dc, ['mobility']);
  if (r.ok) { clog('Tu t’échappes !', 'good'); finishCombat('flee'); } else { clog('Impossible de fuir : on te rattrape.', 'log-dmg'); endPlayerTurn(); }
}
function allyTurn() {
  G.pc.party.forEach(a => {
    if (a.inj > 0 || !aliveFoes().length) return;
    const c = CH[a.id];
    if (a.style === 'protector' && chance(0.6)) { CB.shield += 3; clog(`${c.name} protège ton flanc (+3 bouclier).`, 'good'); return; }
    if (a.style === 'assist' && chance(0.6)) { CB.hitBuff = (CB.hitBuff || 0) + 1; clog(`${c.name} te donne l’ouverture (+1 pour toucher).`, 'good'); return; }
    if (a.style === 'engineer' && chance(0.5)) { const f = pick(aliveFoes()); f.hp -= 4; clog(`${c.name} déploie un drone : ${f.name} perd 4 PV.`, 'log-hit'); if (f.hp <= 0) f.dead = true; return; }
    const f = pick(aliveFoes()); const r = rint(1, 20) + a.atk;
    if (r >= 10 + f.def) { const d = Math.max(1, Math.round(a.atk * 0.9) + rint(0, 2)); f.hp -= d; clog(`${c.name} touche ${f.name} (${d}).`, 'log-hit'); if (f.hp <= 0) { f.dead = true; clog(`${f.name} est hors combat.`, 'good'); } } else clog(`${c.name} rate ${f.name}.`, 'log-miss');
  });
}
function foeTurn() {
  const pc = G.pc;
  aliveFoes().forEach(f => {
    if (pc.hp <= 0) return;
    if (f.stun > 0) { f.stun--; clog(`${f.name} est étourdi.`, 'log-miss'); return; }
    if (f.hp < f.hpMax * 0.4 && f.sp.includes('restore') && chance(0.4)) { f.hp = Math.min(f.hpMax, f.hp + Math.round(f.hpMax * 0.2)); clog(`${f.name} utilise Restore.`, 'warnc'); return; }
    if (f.sp.length && chance(0.22)) {
      const sp = pick(f.sp);
      if (sp === 'shield') { f.shield = 1; clog(`${f.name} active un Shield.`, 'warnc'); return; }
      if (sp === 'buff') { f.dmg += 1; f.buff = 2; clog(`${f.name} utilise Buff : il frappera plus fort.`, 'warnc'); return; }
      if (sp === 'foresight') { f.def += 1; clog(`${f.name} anticipe tes gestes (Foresight).`, 'warnc'); return; }
      if (sp === 'dash') { f.dash = 1; clog(`${f.name} prépare un Dash.`, 'warnc'); return; }
      if (sp === 'rebound') { clog(`${f.name} se prépare à dévier tes projectiles (Rebound).`, 'warnc'); f.rebound = 1; }
      if (sp === 'shock' && chance(0.7)) { CB.stunPc = 2; clog(`${f.name} envoie une onde de choc : tu es étourdi (−3 pour toucher).`, 'log-dmg'); }
    }
    // cible : toi ou un allié
    const ally = pc.party.filter(a => a.inj <= 0); const onAlly = ally.length && chance(CB.guard > 0 ? 0.05 : 0.25);
    if (onAlly) { const a = pick(ally); const c = CH[a.id]; const r = rint(1, 20) + f.atk; if (r >= 10 + 6) { const d = Math.max(1, f.dmg - 1); a.hp -= d; clog(`${f.name} blesse ${c.name} (${d}).`, 'log-dmg'); if (a.hp <= 0) { a.hp = 0; a.inj = 4; clog(`${c.name} est mis hors combat !`, 'log-dmg'); } } else clog(`${f.name} rate ${c.name}.`, 'log-miss'); return; }
    if (CB.dodge > 0) { CB.dodge--; pop('pc', 'ESQUIVE', 'ok'); clog(`${f.name} attaque mais tu esquives.`, 'good'); return; }
    const r = rint(1, 20); const D = pcDef();
    if (r === 20 || (r !== 1 && r + f.atk >= 10 + D)) {
      let d = Math.max(1, f.dmg + rint(-1, 1) - (armorOf() ? Math.floor(armorOf().def / 2) : 0)); if (r === 20) d = Math.round(d * 1.5);
      if (CB.guard > 0) d = Math.max(1, d - 2);
      if (CB.shield > 0) { const ab = Math.min(CB.shield, d); CB.shield -= ab; d -= ab; clog(`Ton bouclier absorbe ${ab}.`, 'good'); if (CB.rebound && ab) { f.hp -= 4; clog(`Rebound : ${f.name} subit 4 dégâts en retour.`, 'log-hit'); if (f.hp <= 0) f.dead = true; } }
      if (d > 0) { pc.hp = Math.max(0, pc.hp - d); pop('pc', `−${d}`, r === 20 ? 'crit' : 'dmg'); CB.hurt = true; clog(`${f.name} te touche : ${d} dégâts.`, 'log-dmg'); }
      if (CB.counter && !f.dead) { f.hp -= CB.counter; clog(`Tu ripostes : ${CB.counter} dégâts.`, 'log-hit'); if (f.hp <= 0) f.dead = true; }
    } else { pop('pc', 'MANQUÉ', 'ok'); clog(`${f.name} te manque.`, 'log-miss'); }
  });
}
function endPlayerTurn() {
  if (!aliveFoes().length) return finishCombat('win');
  for (let i = 0; i < CB.drones; i++) { const f = pick(aliveFoes()); if (!f) break; f.hp -= 3; clog(`Ton drone touche ${f.name} (3).`, 'log-hit'); if (f.hp <= 0) { f.dead = true; clog(`${f.name} est hors combat.`, 'good'); } }
  if (!aliveFoes().length) return finishCombat('win');
  allyTurn();
  if (!aliveFoes().length) return finishCombat('win');
  foeTurn();
  if (G.pc.hp <= 0) return loseCombat(false);
  CB.round++; CB.defend = false; if (CB.buff > 0) CB.buff--; if (CB.fore > 0) CB.fore--; if (CB.guard > 0) CB.guard--; if (CB.stunPc > 0) CB.stunPc--; if (CB.counter) CB.counter = 0; CB.rebound = false;
  CB.foes.forEach(f => { if (f.buff > 0) { f.buff--; if (!f.buff) f.dmg -= 1; } });
  G.pc.en = Math.min(G.pc.enMax, G.pc.en + 1);
  CB.menu = 'main'; renderCombat();
}
function finishCombat(kind) {
  const cfg = CB.cfg; const pc = G.pc; const awoke = CB.wasAwake; const free = stoneCount() >= 8; const rage = CB.rage;
  if (CB.rage && !free) { pc.en = 0; }
  const rounds = CB.round; const tier = CB.tier; const foes = CB.foes; CB = null;
  if (kind === 'flee') { G.score.fled = (G.score.fled || 0) + 1; return cfg.onFlee ? cfg.onFlee() : hub(); }
  G.score.wins = (G.score.wins || 0) + 1;
  const xp = Math.round(foes.reduce((t, f) => t + f.hpMax / 3, 0));
  const L = fx(Object.assign({ xp }, cfg.loot || {}));
  if (awoke && !free) { L.push({ t: 'L’Éveil t’a laissé exsangue : énergie vidée.', c: 'warnc' }); pc.en = 0; }
  cfg.onWin ? cfg.onWin(L, { rounds, awoke, rage }) : show({ title: 'Victoire', text: ['Le calme revient.'], fx: L, choices: [C('Continuer', hub)] });
}
function loseCombat(surrender) {
  const cfg = CB.cfg; const pc = G.pc; CB = null; const lethal = cfg.lethal || 'capture';
  if (cfg.onLose) return cfg.onLose(surrender);
  defeatOutcome(lethal, 'Tu es vaincu.');
}
// Défaite : capture / pillage / mort
function defeatOutcome(lethal, text) {
  const pc = G.pc; pc.hp = Math.max(1, pc.hp);
  if (lethal === 'capture') return capturedScene(text);
  if (lethal === 'robbed') {
    const lost = Math.round(pc.money * 0.5); pc.money -= lost; advance(2); pc.hp = Math.max(1, Math.round(pc.hpMax * 0.3));
    return show({ kicker: 'DÉFAITE', title: 'Dépouillé et laissé pour mort', text: [text, `On te dépouille : <b>−${fmt(lost)} ¢</b>. Tu te réveilles deux semaines plus tard, à moitié mort.`], choices: [C('Continuer', hub)] });
  }
  if (lethal === 'death') {
    if (chance(0.4)) { const d = pcDie('Tué au combat.'); if (d) return show({ kicker: 'DÉFAITE', title: 'Sauvé de justesse', text: [`Tout devient noir… ${esc(d.rescued)} te traîne hors de la mêlée, in extremis. Tu n’auras pas de seconde chance.`], choices: [C('Continuer', hub)] }); return; }
    pc.hp = 1; pc.money = Math.round(pc.money * 0.6); advance(3);
    return show({ kicker: 'DÉFAITE', title: 'Laissé pour mort', text: [text, 'Tu survis par miracle, ruiné et brisé. Trois semaines à te remettre.'], choices: [C('Continuer', hub)] });
  }
  pc.hp = Math.max(1, Math.round(pc.hpMax * 0.4)); advance(1);
  show({ kicker: 'DÉFAITE', title: 'Repli', text: [text, 'Tu t’en sors avec des bleus et ta fierté en miettes.'], choices: [C('Continuer', hub)] });
}
