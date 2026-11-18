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
  // Les factions ennemies se battent en groupe : un homme de plus assez souvent, et jamais seuls quand elles ont les moyens
  if (fid !== 'civils' && G && G.pc) {
    // Plus tu as de pierres, plus on t'envoie de hauts gradés ; plus tu es recherché, plus ils viennent nombreux
    const sc = typeof stoneCount === 'function' ? stoneCount() : 0, ws = typeof wantedStars === 'function' ? wantedStars() : 0;
    tier = Math.min(5, tier + Math.min(2, Math.floor(sc / 3))); n += Math.floor(ws / 2) + (ws >= 4 ? 1 : 0);
  }
  if (fid !== 'civils') { if (n >= 2 && tier >= 2 && chance(0.6)) { n++; if (tier >= 4 && chance(0.4)) n++; } else if (n === 1 && tier >= 2 && chance(0.5)) n++; }
  const n0 = Math.min(n, 2); n = Math.min(4, n);
  const out = []; const pool = FOE_BY_FAC[fid]; const used = new Set();
  const mem = pool ? null : shuffle(DATA.chars.filter(c => c.faction === fid && c.stars <= Math.max(1, tier) && G.world.npc[c.id].alive && G.world.npc[c.id].st !== 'ally' && !Object.values(F).some(f => f.leaders.includes(c.id))));
  for (let i = 0; i < n; i++) {
    if (pool) { const left = pool.filter(t => !used.has(t)); const tid = pick(left.length ? left : pool); used.add(tid); out.push(mkFoe(tid, i >= n0 ? Math.max(1, tier - 1) : tier)); }
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
  combat: { n: 'Frappe de pouvoir', cost: 5, d: 'Dégâts élevés' }, control: { n: 'Entraver', cost: 4, d: 'Étourdit la cible 1–2 tours' }, defense: { n: 'Bouclier', cost: 4, d: 'Absorbe des dégâts' },
  heal: { n: 'Régénération', cost: 5, d: 'Soigne toi (et ton groupe)' }, mobility: { n: 'Esquive surnaturelle', cost: 4, d: 'Évite la prochaine attaque' }, stealth: { n: 'Disparaître', cost: 4, d: 'Prochaine frappe critique' },
  hack: { n: 'Piratage', cost: 4, d: 'Neutralise une machine' }, scout: { n: 'Analyse', cost: 3, d: '+3 pour toucher pendant le combat' }, social: { n: 'Intimider', cost: 3, d: 'Affaiblit l’attaque ennemie' }, tech: { n: 'Bricolage', cost: 4, d: 'Déploie un drone qui frappe chaque tour' },
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
// ── Un affrontement = quelques rounds (3 à 5), une décision par round. Le bilan dépend des rounds gagnés. ──
// ── Les décisions proposées ──
// ── Résolution d’un round ──
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
// ── Bilan ──
// ── Affichage ──
function finishCombat(kind) {
  const cfg = CB.cfg; const pc = G.pc; const awoke = CB.wasAwake; const free = stoneCount() >= 8; const rage = CB.rage;
  if (CB.rage && !free) { pc.en = 0; }
  const bil = CB.bilan; const rounds = CB.N; const partial = !!CB.partial; const thr = CB.thr || { mul: 1 }; const tier = CB.tier; const foes = CB.foes; const bm = CB.bonusMoney || 0, bx = CB.bonusXp, bl = CB.bonusLoot, bq = CB.quiet; CB = null;
  if (kind === 'flee') { G.score.fled = (G.score.fled || 0) + 1; G.pc.flags.escW = G.wk; return cfg.onFlee ? cfg.onFlee() : hub(); }
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
  if (lethal === 'capture') {
    const st = wantedStars(); const p = clamp(0.05 + 0.06 * st, 0.05, 0.35);
    if (chance(p)) { const d = pcDie('Abattu lors de ton arrestation.'); if (d) return show({ kicker: 'DÉFAITE', title: 'Tiré à bout portant', text: ['Un agent tire. Tout devient noir…', `${esc(d.rescued)} t’arrache à la mêlée, in extremis. Tu n’auras pas de seconde chance.`], choices: [C('Continuer', hub)] }); return; }
    return capturedScene(text);
  }
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
