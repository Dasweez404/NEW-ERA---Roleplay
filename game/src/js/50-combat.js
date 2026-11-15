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
  const b = FOE[tid] || FOE.porteur; const hp = Math.round(b.hp * (0.5 + 0.4 * tier) * 0.45);
  return Object.assign({ tid, tier, name: name || b.n, hp, hpMax: hp, atk: b.atk + 2 * tier, def: b.def + 2 * tier - 1, dmg: Math.ceil((b.dmg + 2 * tier) * 1.8), sp: b.sp, m: !!b.m, stun: 0, shield: 0, buff: 0, fore: 0, dash: 0, dead: false, weak: 0 }, extra);
}
const FOE_BY_FAC = { fa: ['soldat', 'droide', 'centaure', 'gorgone', 'harpie'], arena: ['gladiateur'], check: ['mercenaire'], slummer: ['voyou'], galleon: ['pirate'], saibogu: ['cyborg'], necropunks: ['necro'], ragnaroks: ['ragnarok'], optimum: ['optimum'], committed: ['secte'], manacorp: ['garde'], gamma: ['cyborg', 'garde'], fallen: ['fallen'], noir: ['mercenaire', 'garde'], omega: ['porteur'] };
function foesFor(fid, tier, n = 2) {
  const out = []; const pool = FOE_BY_FAC[fid];
  for (let i = 0; i < n; i++) {
    if (pool) out.push(mkFoe(pick(pool), tier));
    else { const mem = DATA.chars.filter(c => c.faction === fid && G.world.npc[c.id].alive && G.world.npc[c.id].st !== 'ally' && !Object.values(F).some(f => f.leaders.includes(c.id))); const c = mem.length ? pick(mem) : null; out.push(mkFoe('porteur', tier, c ? c.name + ' (' + F[fid].name + ')' : 'Membre de ' + F[fid].name, c ? { cid: c.id } : {})); }
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
const clog = (t, c = '') => { if (!CB) return; CB.log.push({ t, c }); };
const fname = f => f.name.replace(/\s*\(.*\)/, '');
const powName = tag => { const p = pcPowers().find(p => p.tags.includes(tag)); return p ? p.name : 'Pouvoir'; };
function primAttr() { const a = STYLES[G.pc.style].prim; return a === 'maitrise' ? 'corps' : a; }
function dmgBase() { const w = weaponOf(); return 3 + Math.floor(A(primAttr()) / 2) + (w ? w.dmg : 0) + (CB.rage ? 6 : 0) + (hasRole('combattant') ? 1 : 0) + ((G.pc.faction === 'fa' || G.pc.flags.antigeno) ? 2 : 0); }
function powMul() { return (G.pc.ptype === 'hybride' ? 0.8 : 1) * (CB.boost || 1); }
const hitBonus = () => (CB.hitBuff || 0) + PK('pierce') + (CB.rage ? 3 : 0);
// ── Un affrontement = quelques « temps ». À chaque temps : un choix, un dé, une conséquence. ──
function startCombat(cfg) {
  if (cfg.foes.length > 3) { const keep = cfg.foes.slice(0, 3); keep.forEach(f => { f.hp = f.hpMax = Math.round(f.hpMax * 1.15); }); cfg.foes = keep; }
  CB = { cfg, foes: cfg.foes, round: 1, log: [], tier: Math.max(...cfg.foes.map(f => Math.round(f.atk / 2))), dodge: PK('dodge'), shield: PK('shield'), lb: !!PK('lastbreath'), weakDone: false, hitBuff: 0, boost: 1, rage: false, noItems: false, wasAwake: false, drones: 0, counter: 0, guardAll: 0, pops: [], twist: null };
  CB.foes.forEach(f => { f.dead = false; f.stun = 0; });
  clog(cfg.intro || 'Le combat commence !');
  nextTwist(); CB.preview = !cfg.noPreview; if (CB.preview) renderPreview(); else engage();
}
function engage() {
  if (!CB) return;
  CB.preview = false;
  if (PK('first')) { const t0 = aliveFoes()[0]; if (t0) { hurtFoe(t0, dmgBase(), false, 'Initiative —'); if (!aliveFoes().length) return finishCombat('win'); } }
  renderCombat();
}
function nextTwist() {
  CB.twist = null; const f = pick(aliveFoes()); if (!f || !f.sp.length || chance(0.4)) return; const sp = pick(f.sp); const n = fname(f);
  CB.twist = { sp, f, ...({ shield: { cat: 'atk', mod: -2, t: `${n} se couvre d’un bouclier : frapper de front est plus dur.` }, rebound: { cat: 'atk', mod: -2, t: `${n} dévie les projectiles.` }, dash: { cat: 'feint', mod: -3, t: `${n} est insaisissable : les feintes sont plus dures.` }, foresight: { cat: 'feint', mod: -2, t: `${n} anticipe tes gestes.` }, shock: { cat: 'tac', mod: -2, t: `${n} prépare une onde de choc : difficile de garder son sang-froid.` }, buff: { cat: 'dmg', mod: 0, t: `${n} se galvanise : il frappera plus fort ce temps-ci.` }, restore: { cat: 'heal', mod: 0, t: `${n} se régénère si tu ne le presses pas.` } }[sp] || { cat: null, mod: 0, t: '' }) };
  if (!CB.twist.t) CB.twist = null;
}
const twistMod = cat => (CB.twist && CB.twist.cat === cat) ? CB.twist.mod : 0;
const avgDef = () => { const a = aliveFoes(); return a.length ? a.reduce((t, f) => t + f.def, 0) / a.length : 0; };
function rollMove(m) { // jet unique de l’action
  const dc = 10 + Math.round(avgDef()); const extra = hitBonus() + (m.bonus || 0) + twistMod(m.cat);
  return check(m.attr, dc, m.tags, extra);
}
function hurtFoe(f, base, kc, label) {
  const d0 = Math.max(1, Math.round(base) + PK('dmg') + rint(-1, 2)); const d = kc ? Math.round(d0 * 1.6) : d0; const i = CB.foes.indexOf(f);
  if (f.shield) { f.shield = 0; pop('f' + i, 'BLOQUÉ', 'miss'); clog(`Le bouclier de ${fname(f)} absorbe le coup.`, 'log-miss'); return 0; }
  f.hp -= d; pop('f' + i, `−${d}`, kc ? 'crit' : 'dmg'); clog(`${label} ${fname(f)} : ${d} dégâts${kc ? ' (CRITIQUE)' : ''}.`, 'log-hit');
  if (PK('weaken') && !CB.weakDone) { CB.weakDone = true; f.dmg = Math.max(1, f.dmg - PK('weaken') * 2); clog(`${fname(f)} est affaibli.`, 'warnc'); }
  if (PK('stun') && f.hp > 0 && chance(PK('stun') / 100)) { f.stun = 1; clog(`${fname(f)} est sidéré !`, 'warnc'); }
  if (PK('drain')) { const pc = G.pc; const g = Math.min(PK('drain'), pc.hpMax - pc.hp); if (g > 0) { pc.hp += g; clog(`Absorption : +${g} PV.`, 'good'); } }
  if (f.hp <= 0) { f.dead = true; clog(`${fname(f)} est hors combat.`, 'good'); }
  return d;
}
const firstFoe = () => aliveFoes()[0];
// ── Les actions proposées ──
function offense() {
  const pc = G.pc; const tags = Object.keys(powerTags()).filter(x => POWER_FX[x]); const w = weaponOf(); const wd = dmgBase();
  const pd = Math.round((4 + A('maitrise') + (pc.ptype === 'elementaire' ? 3 : 0) + PK('dmg')) * powMul());
  if (tags.includes('combat') && pc.en >= POWER_FX.combat.cost && pd > wd) return { id: 'power', ic: '✦', label: `${powName('combat')} : frappe de pouvoir`, sub: `${POWER_FX.combat.cost} énergie · dégâts élevés`, attr: 'maitrise', tags: ['combat'], cat: 'atk', cost: POWER_FX.combat.cost, mul: pd / wd, kind: 'hit' };
  return { id: 'strike', ic: '⚔', label: 'Frapper de front', sub: w ? w.n : 'À mains nues', attr: primAttr(), tags: ['combat'], cat: 'atk', mul: 1, bonus: hasRole('combattant') ? 1 : 0, kind: 'hit' };
}
function feint() { return { id: 'feint', ic: '💨', label: 'Feinte et contre', sub: 'Moins de dégâts, mais l’ennemi frappe dans le vide', attr: 'agilite', tags: ['mobility', 'stealth'], cat: 'feint', mul: 0.7, bonus: G.pc.style === 'flanker' ? 2 : 0, kind: 'feint' }; }
function tactic() {
  const pc = G.pc; const tags = Object.keys(powerTags()); const heal = ['nanosoin', 'kit', 'bandage'].find(id => hasItem(id));
  if (pc.hp < pc.hpMax * 0.5 && heal && !CB.noItems) return { id: 'item', ic: '💊', label: `Se soigner (${ITEMS[heal].n})`, sub: ITEMS[heal].desc + ' · pas de jet', kind: 'item', item: heal };
  if (aliveFoes().some(f => f.m) && (hasCap('hack'))) return { id: 'hack', ic: '💻', label: 'Pirater la machine', sub: 'Une machine ennemie est neutralisée', attr: 'intellect', tags: ['hack'], cat: 'tac', cost: tags.includes('hack') ? POWER_FX.hack.cost : 0, kind: 'hack' };
  if (tags.includes('control') && aliveFoes().length >= 2 && pc.en >= POWER_FX.control.cost) return { id: 'bind', ic: '🕸', label: `${powName('control')} : entraver`, sub: 'Tous les ennemis sont paralysés ce temps-ci', attr: 'maitrise', tags: ['control'], cat: 'tac', cost: POWER_FX.control.cost, kind: 'bind' };
  if (pc.hp < pc.hpMax * 0.6 && tags.includes('heal') && pc.en >= POWER_FX.heal.cost) return { id: 'heal', ic: '💚', label: `${powName('heal')} : te régénérer`, sub: `${POWER_FX.heal.cost} énergie · soigne ~25 %`, kind: 'heal', cost: POWER_FX.heal.cost };
  if (tags.includes('social') || A('charisme') >= 6) return { id: 'intim', ic: '🗣', label: 'Intimider', sub: 'Les ennemis hésitent : peu ou pas de riposte', attr: 'charisme', tags: ['social'], cat: 'tac', kind: 'intim' };
  return { id: 'guard', ic: '🛡', label: 'Se mettre en garde', sub: 'Aucune riposte ce temps-ci, +2 énergie', attr: 'corps', tags: ['defense'], cat: 'tac', kind: 'guard' };
}
function techMove() { const pc = G.pc; const st = STYLES[pc.style]; return { id: 'tech', ic: '★', label: `Technique : ${st.tech.name}`, sub: `${cap(st.tech.text)} · ${st.tech.cost} énergie`, attr: primAttr(), tags: ['combat', ...(pc.style === 'flanker' ? ['mobility'] : [])], cat: 'atk', cost: st.tech.cost, kind: 'tech', lock: (pc.style === 'performer' && !pcPowers().length) ? 'Requiert un pouvoir' : pc.en < st.tech.cost ? 'Énergie insuffisante' : null }; }
function moves() {
  const pc = G.pc; const L = [offense(), feint(), tactic(), techMove()]; const sg = sigMove(); if (sg) L.push(sg);
  if (pcPowers().length && pc.hp <= pc.hpMax * 0.4 && !CB.wasAwake) L.push({ id: 'awaken', ic: '⚡', label: 'ÉVEIL', sub: pc.ptype === 'zoologique' ? 'Bête féroce incontrôlable' : pc.ptype === 'elementaire' ? 'Demi-dieu' : pc.ptype === 'hybride' ? 'Éveil partiel' : 'Capacités au maximum', kind: 'awaken', cls: 'danger' });
  return L;
}
function oddsOf(m) { if (!m.attr) return null; const dc = 10 + Math.round(avgDef()); return [m.attr, dc, m.tags, hitBonus() + (m.bonus || 0) + twistMod(m.cat)]; }
// ── Résolution d’un temps ──
function play(m) {
  if (!CB) return; CB.preview = false;
  const pc = G.pc; CB.log = []; CB.pops = []; CB.safe = 0;
  if (m.cost) pc.en = Math.max(0, pc.en - m.cost);
  if (m.kind === 'awaken') { awaken(); }
  else if (m.kind === 'sig') { sigDo(m); }
  else if (m.kind === 'item') { takeItem(m.item); const it = ITEMS[m.item]; if (it.use === 'hp40') pc.party.forEach(a => { if (a.inj > 0) { a.inj = 0; a.hp = Math.ceil(a.hpMax / 2); } }); const h0 = pc.hp; pc.hp = Math.min(pc.hpMax, pc.hp + (it.use === 'hp40' ? 40 : 15)); clog(`${it.n} : +${pc.hp - h0} PV.`, 'good'); pop('pc', `+${pc.hp - h0}`, 'ok'); CB.sev = 0.2; }
  else if (m.kind === 'heal') { const g = Math.round(pc.hpMax * 0.25); pc.hp = Math.min(pc.hpMax, pc.hp + g); pc.party.forEach(a => { if (a.inj <= 0) a.hp = Math.min(a.hpMax, a.hp + Math.round(g / 2)); }); clog(`${powName('heal')} : +${g} PV.`, 'good'); pop('pc', `+${g}`, 'ok'); CB.sev = 0.2; }
  else {
    const r = rollMove(m); const crit = r.crit || (PK('crit') && r.r >= 19); const f = firstFoe(); const base = dmgBase() * (m.mul || 1);
    CB.sev = 0.6; if (r.fumble) CB.sev = 0.9;
    if (!r.ok) { pop('pc', 'RATÉ', 'miss'); clog(pick([`Ton geste échoue : ${fname(f)} te contre.`, `${fname(f)} lit ton mouvement et réplique.`, 'Tu perds le rythme.']), 'log-miss'); if (m.kind === 'bind' || m.kind === 'hack') clog('L’effet ne prend pas.', 'log-miss'); }
    else {
      CB.sev = 0.2;
      if (m.kind === 'hit') hurtFoe(f, base, crit, m.id === 'power' ? `${powName('combat')} frappe` : 'Tu frappes');
      else if (m.kind === 'feint') { hurtFoe(f, base, crit, 'Feinte réussie sur'); CB.sev = 0; clog('Ils frappent dans le vide.', 'good'); }
      else if (m.kind === 'intim') { aliveFoes().forEach(x => { x.stun = Math.max(x.stun, 1); x.dmg = Math.max(1, x.dmg - 1); }); clog('Ton regard les glace : ils reculent.', 'good'); CB.sev = 0; }
      else if (m.kind === 'bind') { aliveFoes().forEach(x => { x.stun = Math.max(x.stun, 1); }); clog('Les ennemis sont entravés.', 'good'); CB.sev = 0; }
      else if (m.kind === 'hack') { const mc = aliveFoes().find(x => x.m) || f; mc.hp = 0; mc.dead = true; pop('f' + CB.foes.indexOf(mc), 'HS', 'dmg'); clog(`${fname(mc)} est neutralisé.`, 'good'); }
      else if (m.kind === 'guard') { pc.en = Math.min(pc.enMax, pc.en + 2); clog('Tu tiens bon, l’ennemi s’épuise.', 'good'); CB.sev = 0; }
      else if (m.kind === 'tech') styleTech(m, f, crit);
    }
  }
  CB.round++; endBeat();
}
function styleTech(m, f, crit) {
  const s = G.pc.style; const dmg = dmgBase();
  if (s === 'brawler') { hurtFoe(f, dmg, crit, 'Premier coup sur'); const f2 = firstFoe(); if (f2) hurtFoe(f2, dmg, false, 'Deuxième coup sur'); }
  else if (s === 'performer') hurtFoe(f, Math.round((6 + A('maitrise') * 1.5) * powMul()), crit, `Surcharge de ${pcPowers()[0].name} sur`);
  else if (s === 'juggernaut') { CB.shield += 8; CB.counter = 4; clog('Carapace : tu encaisses et prépares la riposte.', 'good'); }
  else if (s === 'protector') { CB.shield += 8; CB.guardAll = 1; clog('Rempart : tu prends les coups pour ton équipe.', 'good'); }
  else if (s === 'flanker') { hurtFoe(f, dmg + 2, true, 'Tu surgis dans le dos de'); CB.dodge++; }
  else if (s === 'ranger') hurtFoe(f, dmg + 3, true, 'Tir précis sur');
  else if (s === 'assist') { aliveFoes().forEach(x => { x.dmg = Math.max(1, x.dmg - 2); x.def = Math.max(0, x.def - 1); }); CB.hitBuff += 2; clog('Déstabiliser : les adversaires vacillent, ton camp est galvanisé.', 'good'); }
  else if (s === 'engineer') { CB.drones++; clog('Gadget improvisé : un drone de combat se déploie.', 'good'); }
  CB.sev = Math.min(CB.sev, 0.2);
}
function awaken() {
  const pc = G.pc; CB.wasAwake = true; pc.awakened++; const t = pc.ptype; const free = stoneCount() >= 8;
  clog('⚡ ÉVEIL ! Une émotion démesurée déferle…', 'acc');
  if (t === 'zoologique') { CB.rage = true; CB.noItems = true; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.2)); clog('Tu deviens une bête féroce : dégâts décuplés, mais plus aucun objet.', 'warnc'); }
  else if (t === 'surnaturel') { CB.boost = 1.5; pc.en = pc.enMax; CB.hitBuff += 2; clog('Tes capacités sont amplifiées à leur maximum.', 'good'); }
  else if (t === 'elementaire') { CB.boost = 1.6; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.5)); pc.en = pc.enMax; CB.shield += 10; clog('Tu es transformé en demi-dieu.', 'good'); }
  else { CB.boost = 1.2; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.25)); pc.en = Math.min(pc.enMax, pc.en + 6); clog('Un éveil partiel : tu n’atteindras jamais le plein potentiel de tes deux pouvoirs.', 'good'); }
  CB.sev = 0.1; CB.awk = free ? 0 : 1;
}
function flee() {
  if (!CB) return;
  const dc = 11 + CB.foes.length + CB.tier * 2; const r = check('agilite', dc, ['mobility']); CB.log = []; CB.pops = [];
  if (r.ok) { clog('Tu t’échappes !', 'good'); return finishCombat('flee'); }
  clog('Impossible de fuir : on te rattrape.', 'log-dmg'); CB.sev = 0.7; CB.round++; endBeat();
}
// fin du temps : alliés, gadgets, riposte, récupération
function endBeat() {
  const pc = G.pc;
  if (!aliveFoes().length) return finishCombat('win');
  for (let i = 0; i < CB.drones; i++) { const f = pick(aliveFoes()); if (!f) break; hurtFoe(f, 3, false, 'Ton drone touche'); }
  pc.party.forEach(a => { if (a.inj > 0 || !aliveFoes().length) return; const f = pick(aliveFoes()); if (chance(0.65)) hurtFoe(f, Math.max(2, Math.round(a.atk / 2)), false, `${CH[a.id].name} frappe`); });
  if (!aliveFoes().length) return finishCombat('win');
  retaliate(CB.sev == null ? 0.5 : CB.sev);
  if (pc.hp <= 0) return loseCombat(false);
  if (!aliveFoes().length) return finishCombat('win');
  aliveFoes().forEach(f => { if (f.stun > 0) f.stun--; if (f.sp.includes('restore') && f.hp < f.hpMax * 0.5 && CB.twist && CB.twist.sp === 'restore') f.hp = Math.min(f.hpMax, f.hp + Math.round(f.hpMax * 0.2)); });
  pc.en = Math.min(pc.enMax, pc.en + 1 + PK('energy'));
  if (PK('regen') && pc.hp < pc.hpMax) { pc.hp = Math.min(pc.hpMax, pc.hp + PK('regen')); clog(`Récupération : +${PK('regen')} PV.`, 'good'); }
  if (PK('allyheal')) pc.party.forEach(a => { if (a.inj <= 0 && CH[a.id]) a.hp = Math.min(a.hpMax, a.hp + PK('allyheal')); });
  if (CB.round > 8) { clog('Les survivants battent en retraite.', 'good'); CB.foes.forEach(f => { if (!f.dead) { f.dead = true; f.hp = 0; } }); return finishCombat('win'); }
  nextTwist(); renderCombat();
}
function retaliate(sev) {
  const pc = G.pc; if (sev <= 0) return;
  const hostile = aliveFoes().filter(f => f.stun <= 0); if (!hostile.length) { clog('Les ennemis, sonnés, ne ripostent pas.', 'good'); return; }
  if (CB.dodge > 0) { CB.dodge--; pop('pc', 'ESQUIVE', 'ok'); clog('Tu esquives la riposte !', 'good'); return; }
  let total = 0;
  hostile.forEach(f => {
    const allies = pc.party.filter(a => a.inj <= 0);
    const dmg = Math.max(1, Math.round(f.dmg * sev * (0.8 + Math.random() * 0.4)) + ((CB.twist && CB.twist.sp === 'buff' && CB.twist.f === f) ? 2 : 0));
    if (allies.length && chance(CB.guardAll ? 0.05 : 0.25)) { const a = pick(allies); a.hp -= dmg; clog(`${fname(f)} blesse ${CH[a.id].name} (${dmg}).`, 'log-dmg'); if (a.hp <= 0) { a.hp = 0; a.inj = 4; clog(`${CH[a.id].name} est mis hors combat !`, 'log-dmg'); } return; }
    let d = Math.max(1, dmg - PK('def') - Math.floor(pcArm() / 2) - (hasRole('gardien') ? 1 : 0)); total += d;
    if (PK('thorns')) { f.hp -= PK('thorns'); if (f.hp <= 0) { f.dead = true; clog(`${fname(f)} s’écroule contre tes défenses.`, 'good'); } }
    if (CB.counter && !f.dead) { f.hp -= CB.counter; if (f.hp <= 0) f.dead = true; }
  });
  if (CB.shield > 0 && total > 0) { const ab = Math.min(CB.shield, total); CB.shield -= ab; total -= ab; clog(`Ton bouclier absorbe ${ab}.`, 'good'); }
  if (total > 0) { pc.hp = Math.max(0, pc.hp - total); CB.hurt = true; pop('pc', `−${total}`, 'dmg'); clog(`On te frappe : ${total} dégâts.`, 'log-dmg'); if (pc.hp <= 0 && CB.lb) { CB.lb = false; pc.hp = 1; clog('Dernier souffle : tu t’accroches à 1 PV !', 'good'); } }
  CB.counter = 0;
}
const pcArm = () => { const a = armorOf(); return a ? a.def : 0; };
// ── Affichage : tout tient en un coup d’œil ──
function renderCombat() {
  const cfg = CB.cfg; const pc = G.pc; CB.prev = CB.prev || {}; const bars = [];
  const rows = h('div', { class: 'foes' }, CB.foes.map((f, i) => {
    const bi = h('i', { style: `width:${(CB.prev[i] != null ? CB.prev[i] : Math.max(0, f.hp)) / f.hpMax * 100}%` }); bars.push([bi, Math.max(0, f.hp) / f.hpMax * 100]); CB.prev[i] = Math.max(0, f.hp);
    return h('div', { class: 'frow' + (f.dead ? ' dead' : ''), 'data-k': 'f' + i }, foeIcon(f, 26), h('span', { class: 'fn' }, fname(f)), h('div', { class: 'bar hp mini' }, bi), h('span', { class: 'fv' }, f.dead ? 'à terre' : f.stun > 0 ? '⚡ sonné' : ''));
  }));
  const st = [CB.shield ? `🛡 ${CB.shield}` : '', CB.dodge ? `💨 esquive ×${CB.dodge}` : '', CB.drones ? `🤖 ×${CB.drones}` : '', CB.rage ? 'BÊTE FÉROCE' : ''].filter(Boolean).join(' · ');
  const me = h('div', { class: 'frow me', 'data-k': 'pc' }, h('span', { class: 'fn' }, 'Toi'), h('div', { class: 'bar hp mini' }, h('i', { style: `width:${pc.hp / pc.hpMax * 100}%` })), h('span', { class: 'fv' }, `${pc.hp}/${pc.hpMax} · ⚡${pc.en}`));
  const rlog = h('div', { class: 'rlog' }, CB.log.slice(-5).map(l => h('div', { class: l.c }, l.t)));
  const tw = CB.twist ? h('div', { class: 'small badc' }, '⚠ ' + CB.twist.t) : null;
  const pops = CB.pops || []; CB.pops = []; const hurt = CB.hurt; CB.hurt = false;
  const hook = () => {
    const delay = UI.scene && UI.scene.roll ? 560 : 0;
    requestAnimationFrame(() => setTimeout(() => bars.forEach(([b, w]) => { b.style.width = w + '%'; }), delay));
    setTimeout(() => {
      let dmgF = false, dmgP = false, miss = false;
      pops.forEach((p, n) => { const host = document.querySelector(`.combat [data-k="${p.k}"]`); if (!host) return; if (p.cls === 'dmg' || p.cls === 'crit') { if (p.k === 'pc') dmgP = true; else dmgF = true; host.classList.add('hit'); } if (p.cls === 'miss') miss = true;
        const el = h('span', { class: 'pop ' + p.cls, style: `animation-delay:${n * 140}ms` }, p.txt); host.append(el); setTimeout(() => el.remove(), 1500 + n * 140); });
      if (dmgF) { sfx('hit'); buzz(20); } else if (miss) sfx('miss'); if (dmgP || hurt) { setTimeout(() => { sfx('hurt'); shake(); flash('#ff2a6d'); }, 180); }
    }, delay);
  };
  show({ compact: true, after: hook, kicker: `AFFRONTEMENT · temps ${CB.round}`, title: cfg.title, text: [], extra: h('div', { class: 'combat' }, rows, me, st ? h('div', { class: 'small acc' }, st) : null, rlog, tw), choices: combatChoices() });
}
function combatChoices() {
  const pc = G.pc; const L = [];
  moves().forEach((m, i) => L.push(C(m.label, () => play(m), { ic: m.ic, sub: m.sub, odds: oddsOf(m), cls: m.cls || (i === 0 ? 'safe' : ''), req: { ok: () => m.lock || (m.cost && pc.en < m.cost ? 'Énergie insuffisante' : null) } })));
  if (CB.cfg.canFlee !== false) L.push(C('Fuir', flee, { odds: ['agilite', 11 + CB.cfg.foes.length + CB.tier * 2, ['mobility']], cls: 'back' }));
  else if (CB.cfg.lethal !== 'death') L.push(C('Se rendre', () => { clog('Tu poses les armes.'); loseCombat(true); }, { cls: 'back' }));
  return L;
}
function finishCombat(kind) {
  const cfg = CB.cfg; const pc = G.pc; const awoke = CB.wasAwake; const free = stoneCount() >= 8; const rage = CB.rage;
  if (CB.rage && !free) { pc.en = 0; }
  const rounds = CB.round; const tier = CB.tier; const foes = CB.foes; const bm = CB.bonusMoney || 0, bx = CB.bonusXp, bl = CB.bonusLoot, bq = CB.quiet; CB = null;
  if (kind === 'flee') { G.score.fled = (G.score.fled || 0) + 1; return cfg.onFlee ? cfg.onFlee() : hub(); }
  G.score.wins = (G.score.wins || 0) + 1;
  const xp = Math.round(foes.reduce((t, f) => t + f.hpMax / 3, 0));
  const L = fx(Object.assign({ xp: xp * (bx ? 2 : 1) }, cfg.loot || {}, bm ? { money: ((cfg.loot || {}).money || 0) + bm } : {}, bl ? { item: { capsule: 1 } } : {}));
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
