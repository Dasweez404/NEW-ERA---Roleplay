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
  return Object.assign({ tid, tier, auto: Object.keys(extra).every(k => k === 'cid'), name: cap(name || b.n), hp, hpMax: hp, atk: b.atk + 2 * tier, def: b.def + 2 * tier - 1, dmg: Math.ceil((b.dmg + 2 * tier) * 1.8), sp: b.sp, m: !!b.m, stun: 0, shield: 0, buff: 0, fore: 0, dash: 0, dead: false, weak: 0 }, extra);
}
const FOE_BY_FAC = { fa: ['soldat', 'droide', 'centaure', 'gorgone', 'harpie'], arena: ['gladiateur'], check: ['mercenaire'], slummer: ['voyou'], galleon: ['pirate'], saibogu: ['cyborg'], necropunks: ['necro'], ragnaroks: ['ragnarok'], optimum: ['optimum'], committed: ['secte'], manacorp: ['garde'], gamma: ['cyborg', 'garde'], fallen: ['fallen'], noir: ['mercenaire', 'garde'], omega: ['porteur'] };
function foesFor(fid, tier, n = 2) {
  const out = []; const pool = FOE_BY_FAC[fid]; const used = new Set();
  const mem = pool ? null : shuffle(DATA.chars.filter(c => c.faction === fid && c.stars <= Math.max(1, tier) && G.world.npc[c.id].alive && G.world.npc[c.id].st !== 'ally' && !Object.values(F).some(f => f.leaders.includes(c.id))));
  for (let i = 0; i < n; i++) {
    if (pool) { const left = pool.filter(t => !used.has(t)); const tid = pick(left.length ? left : pool); used.add(tid); out.push(mkFoe(tid, tier)); }
    else { const c = mem[i] || null; out.push(mkFoe('porteur', tier, c ? c.name + ' (' + F[fid].name + ')' : 'Membre de ' + F[fid].name, c ? { cid: c.id } : {})); }
  }
  if (pool && n >= 2 && G.world && G.world.npc && F[fid] && chance(0.4)) {
    const cs = shuffle(DATA.chars.filter(c => c.faction === fid && c.stars <= Math.max(0, tier - 1) && G.world.npc[c.id] && G.world.npc[c.id].alive && G.world.npc[c.id].st !== 'ally' && !Object.values(F).some(f => f.leaders.includes(c.id))));
    if (cs.length) { const c = cs[0]; const k = out.length - 1; out[k] = mkFoe(out[k].tid, tier, c.name + ' (' + F[fid].name + ')', { cid: c.id }); }
  }
  return out;
}
const FOE_ALIAS = {
  necro: ['Fervent Necropunk', 'Sbire de la Mort', 'Adepte du Chaos', 'Croque-mort punk', 'Disciple Necropunk'],
  ragnarok: ['Berserker Ragnarök', 'Fils de Odin', 'Pillard du Nord', 'Hache-fer Ragnarök', 'Skald belliqueux'],
  optimum: ['Zélote Optimum', 'Adepte de la Perfection', 'Disciple Optimum', 'Évangéliste Optimum', 'Inquisiteur Optimum'],
  secte: ['Fidèle Committed', 'Prêcheur armé', 'Acolyte de la Secte', 'Sentinelle Committed', 'Convaincu'],
  voyou: ['Racaille des bidonvilles', 'Petit caïd', 'Coupe-jarret', 'Gamin des rues armé', 'Tire-laine'],
  pirate: ['Forban Galleon', 'Écumeur', 'Matelot Galleon', 'Boucanier', 'Flibustier'],
  mercenaire: ['Soldat de fortune', 'Mercenaire sans nom', 'Lame à louer', 'Contractuel du Check', 'Tireur à gages'],
  gladiateur: ['Combattant de l’ARENA', 'Champion de seconde zone', 'Duelliste de l’ARENA', 'Vétéran des gradins', 'Bête de ring'],
  cyborg: ['Prototype Saibogu', 'Sujet augmenté', 'Unité Saibogu', 'Chair-et-acier', 'Cobaye de Saibogu'],
  garde: ['Vigile corpo', 'Agent de sécurité', 'Sentinelle privée', 'Cerbère d’entreprise', 'Gorille de service'],
  fallen: ['Traqueur Fallen', 'Rôdeur implanté', 'Chasseur de primes Fallen', 'Exécuteur Fallen', 'Pisteur Fallen'],
  porteur: ['Géno-porteur', 'Affilié', 'Adhérent', 'Recrue', 'Partisan', 'Homme de main', 'Fidèle', 'Sbire', 'Agent'],
  soldat: ['Soldat de la F.A.', 'Fusilier F.A.', 'Garde de l’Autorité', 'Trooper F.A.', 'Sentinelle F.A.'],
  droide: ['Droïde de combat', 'Unité robotique', 'Automate F.A.', 'Drone sentinelle'],
  bete: ['Créature mutante', 'Bête enragée', 'Mutant des ruines', 'Rôdeur difforme'],
};
function dedupeFoes(foes) {
  const cnt = {}; foes.forEach(f => { cnt[f.name] = (cnt[f.name] || 0) + 1; }); const used = new Set(foes.map(f => f.name)); const seen = {};
  foes.forEach(f => {
    if (cnt[f.name] < 2) return; const base = f.name; seen[base] = (seen[base] || 0) + 1; if (seen[base] === 1) return;
    const al = FOE_ALIAS[f.tid] || FOE_ALIAS.porteur; const gen = /^Membre de /.test(base) ? base.slice(10) : null;
    const opts = shuffle(al.slice()).map(x => gen ? x + ' · ' + gen : x).filter(x => !used.has(x));
    if (opts.length) { f.name = opts[0]; used.add(f.name); } else { f.name = base + ' ' + String.fromCharCode(63 + seen[base]); }
  });
}
let CB = null;
const POWER_FX = {
  combat: { n: 'Frappe de pouvoir', cost: 4, d: 'Dégâts élevés' }, control: { n: 'Entraver', cost: 3, d: 'Étourdit la cible 1–2 tours' }, defense: { n: 'Bouclier', cost: 3, d: 'Absorbe des dégâts' },
  heal: { n: 'Régénération', cost: 4, d: 'Soigne toi (et ton groupe)' }, mobility: { n: 'Esquive surnaturelle', cost: 3, d: 'Évite la prochaine attaque' }, stealth: { n: 'Disparaître', cost: 3, d: 'Prochaine frappe critique' },
  hack: { n: 'Piratage', cost: 3, d: 'Neutralise une machine' }, scout: { n: 'Analyse', cost: 2, d: '+3 pour toucher pendant le combat' }, social: { n: 'Intimider', cost: 2, d: 'Affaiblit l’attaque ennemie' }, tech: { n: 'Bricolage', cost: 3, d: 'Déploie un drone qui frappe chaque tour' },
};
const ANTI = {
  buff: { n: 'Buff', d: 'Force infatigable (+4 dégâts, 3 tours)' }, rebound: { n: 'Rebound', d: 'Dévie les projectiles : bouclier 8 et riposte' }, shield: { n: 'Shield', d: 'Corps protégé d’un bouclier de verre (8)' },
  restore: { n: 'Restore', d: 'Auto-régénération d’énergie et de vie' }, foresight: { n: 'Foresight', d: 'Anticipation : défense +3 (3 tours)' }, shock: { n: 'Shock', d: 'Onde de choc : étourdit tous les ennemis' }, dash: { n: 'Dash', d: 'Esquive aérienne (prochaine attaque)' },
};
function pop(k, txt, cls) { if (CB) (CB.pops = CB.pops || []).push({ k, txt, cls }); }
const aliveFoes = () => CB.foes.filter(f => !f.dead);
const clog = (t, c = '') => { if (!CB) return; CB.log.push({ t, c }); };
const fname = f => cap(f.name.replace(/\s*\(.*\)/, ''));
const powName = tag => { const p = pcPowers().find(p => p.tags.includes(tag)); return p ? p.name : 'Pouvoir'; };
function primAttr() { const a = STYLES[G.pc.style].prim; return a === 'maitrise' ? 'corps' : a; }
const powMul = () => (G.pc.ptype === 'hybride' ? 0.8 : 1) * (CB.boost || 1);
const hitBonus = () => (CB.hitBuff || 0) + PK('pierce') + Math.floor(PK('dmg') / 2) + (CB.rage ? 3 : 0) + (CB.boost > 1 ? 2 : 0);
const firstFoe = () => aliveFoes()[0];
// ── Un affrontement = quelques rounds (3 à 5), une décision par round. Le bilan dépend des rounds gagnés. ──
function roundsFor(cfg, foes) { if (cfg.rounds) return cfg.rounds; const t = Math.max(...foes.map(f => f.tier || Math.round(f.atk / 2))); return t >= 5 || (foes.length >= 3 && t >= 3) ? 5 : (t >= 3 || foes.length >= 3) ? 4 : 3; }
function startCombat(cfg) {
  if (cfg.foes.length > 3) cfg.foes = cfg.foes.slice(0, 3);
  scaleFoes(cfg);
  dedupeFoes(cfg.foes);
  CB = { cfg, foes: cfg.foes, N: 5, mom: 0, stance: null, usedSit: [], sit: null, round: 1, W: 0, Lz: 0, hist: [], log: [], tier: Math.max(...cfg.foes.map(f => Math.round(f.atk / 2))), dodge: PK('dodge'), shield: PK('shield'), lb: !!PK('lastbreath'), weakDone: false, hitBuff: 0, boost: 1, rage: false, noItems: false, wasAwake: false, nextBonus: 0, halve: 0, pops: [], twist: null, sig: {} };
  CB.foes.forEach(f => { f.dead = false; f.stun = 0; f.hp = f.hpMax; });
  CB.thr = threat(); CB.N = cfg.rounds || ((CB.thr.gap >= 2 || CB.tier >= 5) ? 5 : 3);
  clog(cfg.intro || 'Le combat commence !'); CB.twist = null;
  if (cfg.noPreview) { CB.preview = false; return begin('equilibre'); }
  if (CB.thr.gap <= -2) return sweepAway();
  if (CB.thr.gap >= 1) { CB.preview = true; return renderPreview(); }
  CB.preview = false; begin(autoStance());
}
function engage() { if (!CB) return; CB.preview = false; begin(autoStance()); }
function begin(stance) {
  if (!CB) return; CB.preview = false; CB.stance = stance; CB.planned = true; coach('combat');
  if (PK('first')) { CB.nextBonus += 3; clog('Initiative : +3 à ton premier jet.', 'good'); }
  renderCombat();
}
function nextTwist() { CB.twist = null; }
const twistMod = cat => (CB.twist && CB.twist.cat === cat) ? CB.twist.mod : 0;
const avgDef = () => { const a = aliveFoes(); return a.length ? a.reduce((t, f) => t + f.def, 0) / a.length : 0; };
const roundDc = () => 14 + Math.round(avgDef() * 0.7);
// ── Les décisions proposées ──
function offense() {
  const pc = G.pc; const tags = Object.keys(powerTags()).filter(x => POWER_FX[x]); const w = weaponOf();
  if (tags.includes('combat') && pc.en >= POWER_FX.combat.cost && pc.ptype !== 'aucun') return { id: 'power', ic: '✦', label: `${powName('combat')} : frappe de pouvoir`, sub: `${POWER_FX.combat.cost} énergie · +3 au jet`, attr: 'maitrise', tags: ['combat'], cat: 'atk', cost: POWER_FX.combat.cost, bonus: 3, kind: 'hit' };
  return { id: 'strike', ic: '⚔', label: 'Frapper de front', sub: w ? w.n : 'À mains nues', attr: primAttr(), tags: ['combat'], cat: 'atk', bonus: (w ? Math.floor(w.dmg / 3) : 0) + (hasRole('combattant') ? 1 : 0), kind: 'hit' };
}
function feint() { return { id: 'feint', ic: '💨', label: 'Feinte et contre', sub: 'Si tu perds ce round, tu encaisses moitié moins', attr: 'agilite', tags: ['mobility', 'stealth'], cat: 'feint', bonus: G.pc.style === 'flanker' ? 2 : 0, kind: 'feint' }; }
function tactic() {
  const pc = G.pc; const tags = Object.keys(powerTags()); const heal = ['nanosoin', 'kit', 'bandage'].find(id => hasItem(id));
  if (pc.hp < pc.hpMax * 0.5 && heal && !CB.noItems) return { id: 'item', ic: '💊', label: `Se soigner (${ITEMS[heal].n})`, sub: ITEMS[heal].desc + ' · round nul (ni gagné ni perdu)', kind: 'item', item: heal };
  if (aliveFoes().some(f => f.m) && hasCap('hack')) return { id: 'hack', ic: '💻', label: 'Pirater la machine', sub: 'Une machine ennemie est neutralisée', attr: 'intellect', tags: ['hack'], cat: 'tac', cost: tags.includes('hack') ? POWER_FX.hack.cost : 0, bonus: 2, kind: 'hack' };
  if (tags.includes('control') && aliveFoes().length >= 2 && pc.en >= POWER_FX.control.cost) return { id: 'bind', ic: '🕸', label: `${powName('control')} : entraver`, sub: 'Les ennemis sont paralysés : prochain round +2', attr: 'maitrise', tags: ['control'], cat: 'tac', cost: POWER_FX.control.cost, kind: 'bind' };
  if (pc.hp < pc.hpMax * 0.6 && tags.includes('heal') && pc.en >= POWER_FX.heal.cost) return { id: 'heal', ic: '💚', label: `${powName('heal')} : te régénérer`, sub: `${POWER_FX.heal.cost} énergie · soigne ~25 % · round nul`, kind: 'heal', cost: POWER_FX.heal.cost };
  if (tags.includes('social') || A('charisme') >= 6) return { id: 'intim', ic: '🗣', label: 'Intimider', sub: 'Ils hésitent : tes défaites coûtent moitié moins ensuite', attr: 'charisme', tags: ['social'], cat: 'tac', kind: 'intim' };
  return { id: 'guard', ic: '🛡', label: 'Se mettre en garde', sub: 'Si tu perds ce round, tu encaisses 60 % de moins ; +2 énergie', attr: 'corps', tags: ['defense'], cat: 'tac', kind: 'guard' };
}
function techMove() { const pc = G.pc; const st = STYLES[pc.style]; return { id: 'tech', ic: '★', label: `Technique : ${st.tech.name}`, sub: `${cap(st.tech.text)} · ${st.tech.cost} énergie · +2 au jet`, attr: primAttr(), tags: ['combat', ...(pc.style === 'flanker' ? ['mobility'] : [])], cat: 'atk', cost: st.tech.cost, bonus: 2, kind: 'tech', lock: (pc.style === 'performer' && !pcPowers().length) ? 'Requiert un pouvoir' : pc.en < st.tech.cost ? 'Énergie insuffisante' : null }; }
function moves() { return sitMoves(); }
function oddsOf(m) { if (!m.attr) return null; return [m.attr, roundDc(), m.tags, hitBonus() + (m.bonus || 0) + CB.nextBonus + twistMod(m.cat) + elanBonus() + stanceBonus(m)]; }
// ── Résolution d’un round ──
function play(m) {
  if (!CB || CB.over) return; CB.preview = false; CB.spec = false; CB.stance = CB.stance || 'equilibre'; CB.sit = null; CB.log = []; CB.pops = [];
  const pc = G.pc; if (m.cost) pc.en = Math.max(0, pc.en - m.cost);
  let res = 'draw', sev = 1; const nb = CB.nextBonus; CB.nextBonus = 0;
  if (m.kind === 'sig') { sigDo(m); res = 'win'; }
  else if (m.kind === 'item') { takeItem(m.item); const it = ITEMS[m.item]; if (it.use === 'hp40') pc.party.forEach(a => { if (a.inj > 0) { a.inj = 0; a.hp = Math.ceil(a.hpMax / 2); } }); const h0 = pc.hp; pc.hp = Math.min(pc.hpMax, pc.hp + (it.use === 'hp40' ? 40 : 15)); clog(`${it.n} : +${pc.hp - h0} PV. Round nul.`, 'good'); pop('pc', `+${pc.hp - h0}`, 'ok'); sev = 0.4; res = 'loss0'; }
  else if (m.kind === 'heal') { const g = Math.round(pc.hpMax * 0.25); pc.hp = Math.min(pc.hpMax, pc.hp + g); clog(`${powName('heal')} : +${g} PV. Round nul.`, 'good'); pop('pc', `+${g}`, 'ok'); sev = 0.4; res = 'loss0'; }
  else {
    const r = check(m.attr, roundDc(), m.tags, hitBonus() + (m.bonus || 0) + nb + twistMod(m.cat) + elanBonus() + stanceBonus(m)); CB.lastR = r; const f = firstFoe(); const crit = r.crit || (PK('crit') && r.r >= 19);
    if (r.ok) {
      res = 'win'; const win = { hit: [`Ton coup passe la garde de ${fname(f)}.`, `${fname(f)} recule sous l’impact.`, `Un enchaînement net : ${fname(f)} encaisse.`], feint: [`Tu dupes ${fname(f)} et ripostes.`, 'Une feinte parfaite.'], intim: ['Ton regard les glace : ils reculent.'], bind: ['Les ennemis sont entravés.'], hack: [`${fname(aliveFoes().find(x => x.m) || f)} est neutralisé.`], guard: ['Tu tiens bon, l’ennemi s’épuise.'], tech: ['Ta technique fait mouche.'], awaken: ['⚡ Ton pouvoir s’éveille !'] }[m.kind] || ['Tu gagnes ce round.'];
      clog(pick(win) + (crit ? ' (CRITIQUE)' : ''), 'log-hit'); pop('f0', 'ROUND GAGNÉ', crit ? 'crit' : 'dmg');
      if (m.kind === 'intim') CB.halve = 2; if (m.kind === 'bind') { CB.nextBonus += 2; aliveFoes().forEach(x => { x.stun = 1; }); } if (m.kind === 'guard') pc.en = Math.min(pc.enMax, pc.en + 1);
      if (m.kind === 'hack') { const mc = aliveFoes().find(x => x.m); if (mc) mc.dmg = 1; }
      if (m.kind === 'tech') techEffect(); if (m.kind === 'awaken') awaken();
      if (crit) CB.nextBonus += 1;
    } else {
      res = 'loss'; sev = m.kind === 'feint' ? 0.5 : m.kind === 'guard' ? 0.4 : m.kind === 'gamble' ? 1.5 : 1; if (r.fumble) sev *= 1.5; sev *= (CB.stance === 'offensive' ? 1.4 : CB.stance === 'prudente' ? 0.6 : 1); clog(pick([`${fname(f)} lit ton mouvement et réplique.`, `Ton geste échoue : ${fname(f)} te contre.`, 'Tu perds le rythme.']), 'log-miss'); pop('pc', 'ROUND PERDU', 'miss');
      if (PK('thorns') && chance(Math.min(0.6, PK('thorns') * 0.12))) { res = 'draw'; sev = 0.3; clog('Ta riposte contrebalance : round nul.', 'good'); }
    }
  }
  if (res === 'loss0') res = 'draw';
  if (res === 'win') { CB.W++; if (PK('weaken') && !CB.weakDone) { CB.weakDone = true; aliveFoes().forEach(x => { x.dmg = Math.max(1, x.dmg - PK('weaken') * 2); }); clog('Tes ennemis faiblissent.', 'warnc'); } if (PK('stun') && chance(PK('stun') / 100)) { CB.nextBonus += 2; clog('Sidérés, ils vacillent : +2 au prochain round.', 'warnc'); } if (PK('drain')) { const g = Math.min(PK('drain') * 2, pc.hpMax - pc.hp); if (g > 0) { pc.hp += g; clog(`Absorption : +${g} PV.`, 'good'); } } }
  if (res === 'loss') CB.Lz++;
  if (res === 'loss' || (res === 'draw' && sev > 0)) hurtPc(sev);
  CB.hist.push(res === 'win' ? 'w' : res === 'loss' ? 'l' : 'd'); momUpdate(res, m);
  pc.en = Math.min(pc.enMax, pc.en + PK('energy')); if (PK('regen') && pc.hp < pc.hpMax) { pc.hp = Math.min(pc.hpMax, pc.hp + PK('regen')); }
  if (PK('allyheal')) pc.party.forEach(a => { if (a.inj <= 0) a.hp = Math.min(a.hpMax, a.hp + PK('allyheal')); });
  if (CB.halve > 0) CB.halve--; aliveFoes().forEach(x => { if (x.stun > 0) x.stun--; });
  CB.round++; const ratio = 1 - CB.W / CB.N; CB.foes.forEach(x => { x.hp = Math.max(0, Math.round(x.hpMax * ratio)); });
  if (pc.hp <= 0) return loseCombat(false);
  if (CB.round > CB.N) return conclude();
  nextTwist(); renderCombat();
}
function techEffect() {
  const s = G.pc.style;
  if (s === 'juggernaut' || s === 'protector') { CB.shield += 8; clog('Ta garde est de fer : bouclier +8.', 'good'); }
  else if (s === 'flanker') { CB.dodge++; clog('Prise à revers : tu esquiveras la prochaine riposte.', 'good'); }
  else if (s === 'ranger') { CB.nextBonus += 3; clog('Tir précis : +3 au prochain round.', 'good'); }
  else if (s === 'assist') { CB.hitBuff += 1; aliveFoes().forEach(x => { x.dmg = Math.max(1, x.dmg - 1); }); clog('Déstabiliser : les adversaires vacillent, ton camp est galvanisé.', 'good'); }
  else if (s === 'engineer') { CB.hitBuff += 1; clog('Gadget improvisé : un drone te couvre (+1 aux jets).', 'good'); }
  else if (s === 'brawler') { CB.nextBonus += 2; clog('Enchaînement : +2 au prochain round.', 'good'); }
  else if (s === 'performer') { CB.nextBonus += 3; clog('Surcharge : +3 au prochain round.', 'good'); }
}
function hurtPc(sev) {
  const pc = G.pc; const hostile = aliveFoes().filter(f => f.stun <= 0); if (!hostile.length) { clog('Les ennemis, sonnés, ne ripostent pas.', 'good'); return; }
  if (CB.dodge > 0 && sev >= 0.5) { CB.dodge--; pop('pc', 'ESQUIVE', 'ok'); clog('Tu esquives la riposte !', 'good'); return; }
  let total = 0;
  hostile.forEach(f => {
    const dmg = Math.max(1, Math.round(f.dmg * 0.95 * sev * (G.pc.hp < G.pc.hpMax * 0.4 ? 1.2 : 1) * (CB.halve > 0 ? 0.5 : 1) * (0.8 + Math.random() * 0.4)) + ((CB.twist && CB.twist.sp === 'buff' && CB.twist.f === f) ? 2 : 0));
    const allies = pc.party.filter(a => a.inj <= 0);
    if (allies.length && chance(0.2)) { const a = pick(allies); a.hp -= dmg; clog(`${fname(f)} blesse ${CH[a.id].name} (${dmg}).`, 'log-dmg'); if (a.hp <= 0) { a.hp = 0; a.inj = 4; clog(`${CH[a.id].name} est mis hors combat !`, 'log-dmg'); } return; }
    total += Math.max(1, dmg - PK('def') - Math.floor(pcArm() / 2) - (hasRole('gardien') ? 1 : 0));
  });
  if (CB.shield > 0 && total > 0) { const ab = Math.min(CB.shield, total); CB.shield -= ab; total -= ab; clog(`Ton bouclier absorbe ${ab}.`, 'good'); }
  if (total > 0) { pc.hp = Math.max(0, pc.hp - total); CB.hurt = true; pop('pc', `−${total}`, 'dmg'); clog(`Tu encaisses ${total} dégâts.`, 'log-dmg'); if (pc.hp <= 0 && CB.lb) { CB.lb = false; pc.hp = 1; clog('Dernier souffle : tu t’accroches à 1 PV !', 'good'); } }
}
const pcArm = () => { const a = armorOf(); return a ? a.def : 0; };
function awaken() {
  const pc = G.pc; CB.wasAwake = true; pc.awakened++; const t = pc.ptype; const free = stoneCount() >= 8;
  clog('⚡ ÉVEIL ! Une émotion démesurée déferle : round gagné.', 'acc');
  if (t === 'zoologique') { CB.rage = true; CB.noItems = true; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.2)); clog('Bête féroce : jets +3, mais plus aucun objet.', 'warnc'); }
  else if (t === 'surnaturel') { CB.boost = 1.5; pc.en = pc.enMax; CB.hitBuff += 2; clog('Tes capacités sont amplifiées à leur maximum.', 'good'); }
  else if (t === 'elementaire') { CB.boost = 1.6; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.5)); pc.en = pc.enMax; CB.shield += 10; clog('Tu es transformé en demi-dieu.', 'good'); }
  else { CB.boost = 1.2; pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.25)); pc.en = Math.min(pc.enMax, pc.en + 6); clog('Un éveil partiel.', 'good'); }
  CB.awk = free ? 0 : 1;
}
function flee() {
  if (!CB || CB.over) return; CB.log = []; CB.pops = [];
  const dc = 11 + CB.foes.length + CB.tier * 2; const r = check('agilite', dc, ['mobility']);
  if (r.ok) { clog('Tu t’échappes !', 'good'); return finishCombat('flee'); }
  clog('Impossible de fuir : on te rattrape.', 'log-dmg'); CB.Lz++; CB.hist.push('l'); hurtPc(1); CB.round++; if (G.pc.hp <= 0) return loseCombat(false); if (CB.round > CB.N) return conclude(); nextTwist(); renderCombat();
}
// ── Bilan ──
function sweepAway() {
  const T = CB.thr; G.pc.hp = Math.max(1, G.pc.hp - Math.round(G.pc.hpMax * 0.03)); CB.foes.forEach(f => { f.dead = true; f.hp = 0; }); CB.over = true; CB.bilan = '💨 Ils ne font pas le poids'; finishCombat('win');
}
function conclude() {
  const { W, Lz, N } = CB; const cfg = CB.cfg; const pc = G.pc; CB.over = true; const hist = CB.hist.map(x => x === 'w' ? '✔' : x === 'l' ? '✖' : '–').join(' ');
  const fate = cfg.lethal === 'death' ? 'tué' : cfg.lethal === 'capture' ? 'capturé' : 'hors de combat';
  if (Lz >= N) { toast(`${hist} · Défaite`); return loseCombat(false); }
  if (W >= N) { CB.bilan = `${hist} · adversaire ${fate}`; return finishCombat('win'); }
  if (W > Lz) { CB.partial = true; CB.bilan = `${hist} · il s’enfuit, blessé`; return finishCombat('win'); }
  let txt = W === Lz ? 'impasse, chacun se replie' : 'tu es blessé, tu te replies'; if (W < Lz) { const loss = Math.round(pc.hpMax * 0.2); pc.hp = Math.max(1, pc.hp - loss); txt += ` (−${loss} PV)`; }
  toast(`${hist} · ${txt}`);
  if (cfg.canFlee === false) return loseCombat(false); finishCombat('flee');
}
// ── Affichage ──
function renderCombat() {
  const cfg = CB.cfg; const pc = G.pc; CB.prev = CB.prev || {}; const bars = [];
  const rows = h('div', { class: 'foechips' }, CB.foes.map((f, i) => {
    const bi = h('i', { style: `width:${(CB.prev[i] != null ? CB.prev[i] : 100)}%` }); const pct = Math.max(0, f.hp) / f.hpMax * 100; bars.push([bi, pct]); CB.prev[i] = pct;
    return h('div', { class: 'fchip' + (f.dead ? ' dead' : ''), 'data-k': 'f' + i }, foeIcon(f, 22) || '', h('div', { class: 'fcn' }, h('span', { class: 'fn' }, fname(f) + (f.stun > 0 ? ' ⚡' : '')), h('div', { class: 'bar hp mini' }, bi)));
  }));
  const st = [CB.shield ? `🛡 ${CB.shield}` : '', CB.dodge ? `💨 esquive ×${CB.dodge}` : '', CB.nextBonus ? `+${CB.nextBonus} prochain jet` : '', CB.rage ? 'BÊTE FÉROCE' : ''].filter(Boolean).join(' · ');
  const pips = h('div', { class: 'rpips' }, Array.from({ length: CB.N }, (_, i) => { const x = CB.hist[i]; return h('span', { class: 'rp ' + (x === 'w' ? 'w' : x === 'l' ? 'l' : x === 'd' ? 'd' : i === CB.round - 1 ? 'cur' : '') }, x === 'w' ? '✔' : x === 'l' ? '✖' : x === 'd' ? '–' : i + 1); }));
  const rlog = h('div', { class: 'rlog' }, CB.log.slice(-2).map(l => h('div', { class: l.c }, l.t)));
  const tw = null; const sit = currentSit(); const sitEl = h('div', { class: 'sit' }, sit.t);
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
  show({ compact: true, after: hook, kicker: `AFFRONTEMENT · ROUND ${Math.min(CB.round, CB.N)}/${CB.N}`, title: cfg.title, text: [], extra: h('div', { class: 'combat' }, h('div', { class: 'chead', 'data-k': 'pc' }, pips, momEl()), rows, st ? h('div', { class: 'small acc' }, st) : null, sitEl, rlog, tw), choices: combatChoices() });
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
  const bil = CB.bilan; const rounds = CB.N; const partial = !!CB.partial; const thr = CB.thr || { mul: 1 }; const tier = CB.tier; const foes = CB.foes; const bm = CB.bonusMoney || 0, bx = CB.bonusXp, bl = CB.bonusLoot, bq = CB.quiet; CB = null;
  if (kind === 'flee') { G.score.fled = (G.score.fled || 0) + 1; return cfg.onFlee ? cfg.onFlee() : hub(); }
  G.score.wins = (G.score.wins || 0) + 1;
  const xp = Math.round(foes.reduce((t, f) => t + f.hpMax / 3, 0) * thr.mul * (partial ? 0.5 : 1));
  const L = fx(Object.assign({ xp: xp * (bx ? 2 : 1) }, cfg.loot || {}, bm ? { money: ((cfg.loot || {}).money || 0) + bm } : {}, bl ? { item: { capsule: 1 } } : {}));
  if (bil) L.unshift({ t: bil, c: 'bilan' });
  if (awoke && !free) { L.push({ t: 'L’Éveil t’a laissé exsangue : énergie vidée.', c: 'warnc' }); pc.en = 0; }
  const info = { rounds, awoke, rage, partial, total: !partial };
  const vf = !partial && !cfg.noVerdict && foes.find(f => f.cid && f.dead && CH[f.cid] && G.world.npc[f.cid] && G.world.npc[f.cid].alive && G.world.npc[f.cid].st !== 'ally' && !Object.values(F).some(x => x.leaders.includes(f.cid)) && !(pc.flags.nem && pc.flags.nem.cid === f.cid));
  if (vf) return verdictCard(vf, L, L2 => cfg.onWin ? cfg.onWin(L2, info) : show({ title: 'Victoire', text: ['Le calme revient.'], fx: L2, choices: [C('Continuer', hub)] }));
  cfg.onWin ? cfg.onWin(L, info) : show({ title: 'Victoire', text: ['Le calme revient.'], fx: L, choices: [C('Continuer', hub)] });
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
    const lost = Math.round(pc.money * ((pc.base && pc.base.lvl >= 2) ? 0.25 : 0.5)); pc.money -= lost; advance(2); pc.hp = Math.max(1, Math.round(pc.hpMax * 0.3));
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

function pcLevel() { const pc = G.pc; const w = weaponOf(), a = armorOf(); return clamp(Math.round(pc.grade + (A(primAttr()) - 5) / 3 + (w ? w.dmg / 4 : 0) + (a ? a.def / 4 : 0)), 1, 6); }
function threat() {
  const foes = CB.foes; const t = Math.max(...foes.map(f => f.tier || Math.round(f.atk / 2))) + (foes.length >= 3 ? 1 : 0); const lv = pcLevel(); const gap = t - lv;
  const L = gap <= -2 ? ['Insignifiant', 0.25, '#5be3a0'] : gap === -1 ? ['Facile', 0.6, '#5be3a0'] : gap === 0 ? ['Équilibré', 1, '#fcee09'] : gap === 1 ? ['Dangereux', 1.3, '#ff8a1f'] : ['Écrasant', 1.6, '#ff3d7f'];
  return { gap, label: L[0], mul: L[1], col: L[2], foe: t, you: lv };
}

// Les ennemis suivent ton niveau : un perso gradé affronte des adversaires à sa mesure (on reste « petit »)
function scaleFoes(cfg) {
  if (cfg.noScale || !G || !G.pc) return; const lv = pcLevel(); if (lv < 4) return;
  cfg.foes.forEach(f => { if (!f.auto || f.cid) return; const want = clamp(lv + pick([-1, 0, 0, 0, 1]), 1, 8); if ((f.tier || 1) < want) { const nf = mkFoe(f.tid, want, f.name, f.cid ? { cid: f.cid } : {}); Object.assign(f, nf); } });
  if (lv >= 5 && cfg.foes.length < 3 && chance(0.3)) { const base = cfg.foes.find(f => f.auto); if (base) cfg.foes.push(mkFoe(base.tid, Math.max(1, base.tier - 2), null, {})); }
}

// Sort du vaincu : un vrai personnage battu n'est pas forcément capturé, c'est toi qui décides
function verdictCard(f, L, go) {
  const pc = G.pc; const c = CH[f.cid]; const fac = c.faction; const fn = F[fac] ? F[fac].name : fac; const rk = F[fac] ? fac : 'civils'; const bonus = 120 * ((c.stars || 0) + 1);
  const end = (txt, o, extra) => { const L2 = [...L, ...fx(o)]; if (extra) extra(); show({ kicker: 'SORT DU VAINCU', title: esc(c.name), text: [txt], fx: L2.slice(L.length), choices: [C('Continuer', () => go(L))] }); };
  show({ extra: portrait(c.id, 110), kicker: 'VICTOIRE · SORT DU VAINCU', title: esc(c.name), text: [`${esc(c.name)} (${esc(fn)}) est à terre, à ta merci. Que fais-tu ?`], choices: [
    C('L’épargner', () => end(`Tu baisses ton arme. « Je n’oublierai pas, » souffle ${esc(c.name)} avant de disparaître.`, { rep: { [rk]: 4 }, xp: 10 }, () => { pc.flags['debt_' + c.id] = true; addKarma(1); }), { ic: '🕊', sub: 'Il te devra une faveur. Réputation +.', cls: 'safe' }),
    C('Le capturer et le livrer', () => end(`Tu le ligotes et le remets à qui de droit. La prime tombe : <b>+${bonus} ¢</b>.`, { money: bonus, rep: { [rk]: -8 } }, () => { G.world.npc[c.id].st = 'captured'; newsPush(`${c.name} (${fn}) a été capturé${c.gender === 'F' ? 'e' : ''} lors d’un affrontement.`); }), { ic: '⛓', sub: `+${bonus} ¢ · sa faction t’en voudra.` }),
    C('L’achever', () => end(`Tu ne laisses aucune chance à ${esc(c.name)}. Quelqu’un finira par le savoir.`, { rep: { [rk]: -14 }, heat: 4 }, () => { G.world.npc[c.id].alive = false; addKarma(-2); newsPush(`${c.name} (${fn}) est mort${c.gender === 'F' ? 'e' : ''} dans un affrontement.`); }), { ic: '☠', sub: 'Plus de menace… mais karma, réputation et prime en pâtissent.', cls: 'danger', heavy: 'On ne revient pas d’un tel geste.' })] });
}
