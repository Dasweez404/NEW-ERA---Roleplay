// ───────── Combat V3 : 3 à 5 rounds, 3 choix simples selon ta catégorie de style, un % affiché ─────────
// Chaque round : tu choisis ENTRE 3 gestes (principal, prudent, pouvoir). Un dé contre un pourcentage décide.
// Round gagné : l'adversaire recule. Round perdu : tu encaisses. Le bilan dépend des rounds gagnés et perdus.
// Ta catégorie (Offensif, Défensif, Technique, Soutien) donne leur forme aux gestes.

// Puissance : UNE seule échelle (1 à 10) tirée de la somme des attributs (étoiles + progression + pierres) et un peu du matériel.
function pcPower() { const pc = G.pc; const w = weaponOf(), a = armorOf(); const sum = ATTRS.reduce((t, x) => t + A(x.id), 0); return clamp(sum / 5.6 + 0.09 * ((w ? w.dmg : 0) + (a ? a.def : 0)), 1, 10); }
function pcLevel() { return clamp(Math.round(pcPower()), 1, 8); }
// Équipe : rendements décroissants. 0 allié = 0, 1 ≈ 0,30, 3 ≈ 0,66, 6 ≈ 0,88.
const teamF = n => 1 - Math.pow(0.7, Math.max(0, n));
const teamK = n => teamF(n) / 0.657;
const rr = (a, b) => a + Math.random() * (b - a);
const foeHit = f => Math.max(1, Math.round((2.6 + 2 * (f.tier || 1) + f.dmg * 0.09) * rr(0.9, 1.1)));
function vfx(text, cls) { if (typeof REDUCED !== 'undefined' && REDUCED) return; const el = h('div', { class: 'vfx ' + cls }, text); document.body.append(el); setTimeout(() => el.remove(), 950); }
function primAttr() { const a = STYLES[G.pc.style].prim; return a === 'maitrise' ? 'corps' : a; }
const hitBonus = () => (CB.rageLeft > 0 ? 4 : 0) + (CB.swarm > 0 ? 2 : 0) + (CB.hitBuff || 0) + PK('pierce') + Math.floor(PK('dmg') / 2) + (CB.rage ? 3 : 0) + (CB.boost > 1 ? 2 : 0);
// Difficulté d'un round : suit le niveau des ennemis (la courbe douce du jeu est appliquée par check())
const roundDc = () => { const a = aliveFoes(); const t = a.length ? a.reduce((s, f) => s + (f.tier || 1), 0) / a.length : 1; return Math.round(19 + 2.5 * t + 1.1 * (CB.foes.length - 1) + Math.min(6, Math.max(0, pcPower() - 4.5) * 1.1)) - (CB.hexLeft > 0 ? 4 : 0); };
const pwMax = () => Math.floor((CB.N + 1) / 3) + (pcPowers().some(p => pxLevel(p.id) >= 3) ? 1 : 0); // pouvoir : 1 round sur 3, 2 sur 5
const needW = () => CB.N >= 4 ? CB.N - 1 : CB.N; // rounds à gagner pour une victoire totale

// ── Intentions ennemies : on voit ce que l'adversaire prépare, et on choisit le geste qui le contre ──
const INTENTS = {
  charge: { ic: '💥', n: 'Charge', tip: 'Gros coup en approche : esquive ou encaisse', mul: 1.4, counter: m => !!m.dodge || (m.sev != null && m.sev <= 0.6 && m.cat !== 'pw') },
  garde: { ic: '🛡', n: 'Garde haute', tip: 'Il se couvre : vise la faille, ne fonce pas', mul: 1, counter: m => m.cat === 'pw' || (m.tags || []).some(t => ['scout', 'social', 'tech', 'ranged', 'control'].includes(t)), penal: m => m.cat === 'mv' && (m.tags || []).includes('combat') && (m.sev || 1) >= 1 && !(m.tags || []).some(t => ['scout', 'tech'].includes(t)) },
  special: { ic: '☄', n: 'Pouvoir', tip: 'Un adversaire utilise son pouvoir : esquive ou garde prudente', mul: 1.3, counter: m => !!m.dodge || m.cat === 'pw' || (m.sev != null && m.sev <= 0.6) },
  rafale: { ic: '🌪', n: 'Rafale', tip: 'Coups rapides : couvre-toi ou coordonne-toi', mul: 1.15, counter: m => (m.tags || []).some(t => ['defense', 'ally'].includes(t)) || !!m.dodge },
};
function nextIntent() {
  dealHand();
  const hostile = aliveFoes(); if (!hostile.length) return CB.intent = null;
  const heavy = hostile.some(f => f.m || (f.tier || 1) >= 4); const keys = Object.keys(INTENTS).filter(k => k !== (CB.intent && CB.intent.k));
  const w = { charge: heavy ? 3 : 2, garde: 2, rafale: hostile.length >= 2 ? 3 : 1 }; const bag = []; keys.forEach(k => { for (let i = 0; i < w[k]; i++) bag.push(k); });
  CB.intent = { k: pick(bag) };
  const named = hostile.filter(f => foePowerOf(f)); if (named.length && chance(0.34)) { const f = pick(named); CB.intent = { k: 'special', foe: f, ab: foePowerOf(f) }; }
  return CB.intent;
}
const intentOf = () => (CB && CB.intent) ? INTENTS[CB.intent.k] : null;
function intentBonus(m) { const it = intentOf(); if (!it || !m || !m.attr) return 0; if (it.counter(m)) return 4; if (it.penal && it.penal(m)) return -2; return 0; }
const isCounter = m => { const it = intentOf(); return !!(it && m && m.attr && it.counter(m)); };

// ── Les 3 gestes, définis par ta catégorie ──
const CAT_DESC = {
  'Offensif': 'Frapper de front (+2 au jet, risque normal) · Feinter et riposter (moitié moins de dégâts si tu perds) · Pouvoir.',
  'Défensif': 'Tenir et repousser (tu encaisses toujours moins) · Se couvrir (presque aucun dégât, +1 énergie) · Pouvoir.',
  'Technique': 'Coup précis (+3 au jet) · Esquiver (une chance sur trois de tout éviter) · Pouvoir.',
  'Soutien': 'Déstabiliser (si tu gagnes, leurs coups faiblissent) · Coordonner l’équipe (mieux avec des alliés, et ils te couvrent) · Pouvoir.',
};
const CATS = {
  'Offensif': [
    { id: 'a', ic: '⚔', label: 'Frapper de front', sub: 'Gros risque, grosse pression', tags: ['combat'], attr: () => primAttr(), bonus: 2, sev: 1.0 },
    { id: 'b', ic: '🌀', label: 'Feinter et riposter', sub: 'Si tu perds, tu encaisses moitié moins', tags: ['mobility', 'stealth'], attr: () => 'agilite', bonus: 1, sev: 0.5 },
  ],
  'Défensif': [
    { id: 'a', ic: '🛡', label: 'Tenir et repousser', sub: 'Tu encaisses toujours moins', tags: ['defense', 'combat'], attr: () => 'corps', bonus: 1, sev: 0.6 },
    { id: 'b', ic: '🧱', label: 'Se couvrir', sub: 'Presque pas de dégâts · +1 énergie', tags: ['defense'], attr: () => 'corps', bonus: 1, sev: 0.3, en: 1 },
  ],
  'Technique': [
    { id: 'a', ic: '🎯', label: 'Coup précis', sub: 'Bon pourcentage, risque normal', tags: ['scout', 'ranged', 'combat'], attr: () => (STYLES[G.pc.style].prim === 'intellect' ? 'intellect' : 'agilite'), bonus: 3, sev: 1.0 },
    { id: 'b', ic: '💨', label: 'Esquiver', sub: 'Une chance sur trois de tout éviter', tags: ['mobility'], attr: () => 'agilite', bonus: 1, sev: 0.45, dodge: 0.33 },
  ],
  'Soutien': [
    { id: 'a', ic: '🗣', label: 'Déstabiliser', sub: 'Si tu gagnes, leurs coups faiblissent', tags: ['social', 'tech'], attr: () => (STYLES[G.pc.style].prim === 'intellect' ? 'intellect' : 'charisme'), bonus: 1, sev: 0.8, weak: 2 },
    { id: 'b', ic: '🤝', label: 'Coordonner l’équipe', sub: 'Mieux avec des alliés, et ils te couvrent', tags: ['ally', 'social'], attr: () => 'charisme', bonus: 1, sev: 0.5 },
  ],
};
function catMoves() { return CATS[STYLES[G.pc.style].grp] || CATS['Offensif']; }
// ── Main de cartes : à chaque round, 3 cartes tirées au sort (ton style en favorise certaines). On fait avec ce qu'on a. ──
const bestAttr = () => ATTRS.reduce((b, a) => A(a.id) > A(b) ? a.id : b, 'corps');
const XCARDS = [
  { id: 'x1', ic: '💥', label: 'Charge furieuse', sub: 'Gros risque, gros jet', tags: ['combat'], attr: () => 'corps', bonus: 3, sev: 1.4, grp: 'Offensif' },
  { id: 'x2', ic: '🗡', label: 'Coup bas', sub: 'Affaiblit leurs coups si tu gagnes', tags: ['stealth', 'combat'], attr: () => 'agilite', bonus: 1, sev: 0.8, weak: 1, grp: 'Offensif' },
  { id: 'x3', ic: '🤺', label: 'Parade', sub: 'Encaisse peu · bon jet', tags: ['defense'], attr: () => 'corps', bonus: 2, sev: 0.5, grp: 'Défensif' },
  { id: 'x4', ic: '🔍', label: 'Viser la faille', sub: 'Excellent contre une garde haute', tags: ['scout', 'tech'], attr: () => 'intellect', bonus: 3, sev: 1.0, grp: 'Technique' },
  { id: 'x5', ic: '📣', label: 'Appel à l’aide', sub: 'Meilleur avec des alliés', tags: ['ally', 'social'], attr: () => 'charisme', bonus: () => Math.min(4, G.pc.party.filter(a => a.inj <= 0).length * 1.5), sev: 0.6, grp: 'Soutien' },
  { id: 'x6', ic: '😈', label: 'Provoquer', sub: 'Leurs coups faiblissent si tu gagnes', tags: ['social'], attr: () => 'charisme', bonus: 1, sev: 0.9, weak: 2, grp: 'Soutien' },
  { id: 'x7', ic: '🎲', label: 'Improviser', sub: 'Ton meilleur attribut, sans bonus', tags: ['combat'], attr: bestAttr, bonus: 0, sev: 0.7 },
  { id: 'x8', ic: '🏃', label: 'Repli tactique', sub: 'Peu de dégâts · une chance d’esquive', tags: ['mobility'], attr: () => 'agilite', bonus: 2, sev: 0.3, dodge: 0.25 },
  { id: 'x9', ic: '🌬', label: 'Canaliser', sub: 'Ton pouvoir à l’état brut', tags: ['control'], attr: () => 'maitrise', bonus: 1, sev: 0.8 },
];
function cardPool() { const grp = STYLES[G.pc.style].grp; const pool = []; Object.entries(CATS).forEach(([g, arr]) => arr.forEach(c => pool.push(Object.assign({ grp: g, w: g === grp ? 3 : 1 }, c, { id: g[0] + c.id })))); XCARDS.forEach(c => pool.push(Object.assign({ w: c.grp === grp ? 3 : c.grp ? 1 : 1.5 }, c))); return pool; }
function dealHand() {
  const pool = cardPool(); const last = (CB && CB.hand) ? CB.hand.map(c => c.id) : []; const hand = [];
  for (let k = 0; k < 3; k++) { const cand = pool.filter(c => !hand.some(h => h.id === c.id) && !(last.includes(c.id) && Math.random() < 0.75)); const c = wpick(cand.length ? cand : pool.filter(c => !hand.some(h => h.id === c.id)), x => x.w); hand.push(c); }
  if (CB) CB.hand = hand; return hand;
}
function abilMove() { const a = pcAbility(); if (!a) return null; return { id: 'abil', pid: a.pid, ic: a.ic, label: `${a.power} : ${a.name}`, sub: a.txt, kind: 'abil', cost: abilCost(a), cls: 'safe', ab: a }; }
function powerMove() {
  const pc = G.pc; const spent = (CB.pwUsed || 0) >= pwMax(); const tags = Object.keys(powerTags()).filter(x => POWER_FX[x]); const ok = m => m && !m.lock && !(m.cost && pc.en < m.cost);
  const base = { ic: '✦', cat: 'pw', sev: 1.0 };
  if (pcPowers().length && pc.hp <= pc.hpMax * 0.4 && !CB.wasAwake) return Object.assign({}, base, { id: 'awaken', kind: 'awaken', ic: '⚡', label: 'ÉVEIL', sub: 'Plus tu es blessé, plus c’est probable', attr: 'maitrise', tags: ['control', 'combat'], bonus: Math.round((1 - pc.hp / pc.hpMax) * 8), cls: 'danger' });
  if (spent) return Object.assign({}, base, { id: 'spent', kind: 'tech', label: 'Pouvoir', sub: `Déjà utilisé (${CB.pwUsed}/${pwMax()} ce combat)`, lock: 'Utilisé', cost: 0 });
  if (tags.includes('heal') && pc.hp < pc.hpMax * 0.5 && pc.en >= POWER_FX.heal.cost && pc.ptype !== 'aucun') return Object.assign({}, base, { id: 'heal', kind: 'heal', ic: '💚', label: `${powName('heal')} : te régénérer`, sub: `Tu récupères ~25 % de PV · ${POWER_FX.heal.cost}⚡ · round nul`, cost: POWER_FX.heal.cost, sev: 0.4 });
  const ab = pc.ptype !== 'aucun' ? abilMove() : null; if (ok(ab)) return Object.assign({}, base, ab, { sub: `${ab.ab.txt} · ${ab.cost}⚡ · niv. ${pxLevel(ab.pid)}` });
  if (tags.includes('combat') && pc.en >= POWER_FX.combat.cost && pc.ptype !== 'aucun') return Object.assign({}, base, { id: 'power', kind: 'hit', label: `Pouvoir : ${powName('combat')}`, sub: `+4 au jet · ${POWER_FX.combat.cost}⚡ · ${pwMax() - (CB.pwUsed || 0)} restant`, attr: 'maitrise', tags: ['combat'], bonus: 4, cost: POWER_FX.combat.cost });
  const st = STYLES[pc.style]; const fin = Object.assign({}, base, { id: 'tech', kind: 'tech', label: `Technique : ${st.tech.name}`, sub: `${cap(st.tech.text)} · ${st.tech.cost + 1}⚡ · ${pwMax() - (CB.pwUsed || 0)} restant`, attr: primAttr(), tags: ['combat'], bonus: 3, cost: st.tech.cost + 1 });
  if (ok(fin)) return fin; fin.lock = 'Énergie insuffisante'; fin.sub = 'Pas assez d’énergie'; return fin;
}
function moves() { const hand = (CB && CB.hand) || dealHand(); return [...hand.map(m => Object.assign({ kind: 'hit', cat: 'mv' }, m, { attr: m.attr(), bonus: typeof m.bonus === 'function' ? m.bonus() : m.bonus })), powerMove()]; }
function oddsOf(m) { if (!m.attr) return null; return [m.attr, roundDc(), m.tags, hitBonus() + (m.bonus || 0) + (CB.nextBonus || 0) + intentBonus(m)]; }

// ── Lancement ──
function roundsFor2(cfg, foes, gap) { if (cfg.rounds) return cfg.rounds; const t = Math.max(...foes.map(f => f.tier || 1)); let n = 4; if (foes.length === 1 && gap <= -1) n = 3; if (foes.length >= 3 || t >= 5 || gap >= 2) n = 5; return n; }
function startCombat(cfg) {
  if (cfg.foes.length > 4) cfg.foes = cfg.foes.slice(0, 4);
  scaleFoes(cfg); dedupeFoes(cfg.foes);
  CB = { cfg, foes: cfg.foes, N: 4, round: 1, W: 0, Lz: 0, hist: [], log: [], pops: [], tier: Math.max(...cfg.foes.map(f => f.tier || Math.round(f.atk / 2))), dodge: PK('dodge'), shield: PK('shield'), lb: !!PK('lastbreath'), hitBuff: 0, boost: 1, rage: false, noItems: false, wasAwake: false, nextBonus: 0, weak: 0, sig: {}, tgt: 0 };
  CB.foes.forEach(f => { f.dead = false; f.stun = 0; f.hp = f.hpMax; });
  if (cfg.buff) { CB.hitBuff += cfg.buff; clog(`Tu connais ses coups : +${cfg.buff} à tous tes jets.`, 'good'); }
  CB.thr = threat(); CB.N = roundsFor2(cfg, CB.foes, CB.thr.gap);
  if (hasAnti('buff')) CB.hitBuff += 1; if (hasAnti('rebound')) CB.shield += 6; if (hasAnti('shield')) CB.shield += 8; if (hasAnti('dash')) CB.dodge += 1;
  clog(cfg.intro || 'Le combat commence !');
  if (cfg.noPreview) return beginDuel();
  if (CB.thr.gap <= -2) return sweepAway();
  if (!cfg.noAuto && cfg.lethal !== 'death' && !cfg.noPreview) { nextIntent(); const mv = moves().filter(m => m.attr && !m.lock && m.kind === 'hit'); const best = mv.reduce((b, m) => Math.max(b, odds(...oddsOf(m))), 0); if (best >= 0.8 && CB.foes.length <= 3) return autoWin(); }
  if (CB.thr.gap === -1 && !cfg.noAuto && cfg.lethal !== 'death') { CB.preview = true; return renderEasy(); }
  if (CB.thr.gap >= 1) { CB.preview = true; return renderPreview(); }
  beginDuel();
}
// Plus de 80 % de réussite sur chaque round : le combat se joue tout seul avec le meilleur geste de chaque main
function autoWin() {
  CB.auto = true; let g = 0; clog('⚡ Victoire quasi certaine : le combat est réglé d’un coup.', 'good');
  while (CB && !CB.over && g++ < 12) { const mv = moves().filter(m => m.attr && !m.lock && m.kind === 'hit'); if (!mv.length) break; mv.sort((a, b) => odds(...oddsOf(b)) - odds(...oddsOf(a))); play(mv[0]); }
}
function engage() { if (!CB) return; CB.preview = false; beginDuel(); }
function beginDuel() { if (!CB) return; CB.preview = false; nextIntent(); coach('combat'); if (PK('first')) { CB.nextBonus += 3; clog('Initiative : +3 à ton premier jet.', 'good'); } renderCombat(); }
// Adversaires à ta portée : on peut régler le combat hors-champ, sans jouer les rounds
function autoResolve() {
  if (!CB) return; const pc = G.pc; const r = Math.random(); CB.over = true;
  const loss = Math.round(pc.hpMax * rr(0.05, 0.13)); pc.hp = Math.max(1, pc.hp - loss);
  if (r < 0.84) { CB.foes.forEach(f => { f.dead = true; f.hp = 0; }); CB.bilan = `⚡ Réglé hors-champ · −${loss} ❤`; return finishCombat('win'); }
  if (r < 0.97) { CB.partial = true; CB.bilan = `⚡ Réglé hors-champ · ils fuient · −${loss} ❤`; return finishCombat('win'); }
  CB.bilan = ''; toast(`Ça tourne mal : tu te replies (−${loss} ❤)`); return CB.cfg.canFlee === false ? loseCombat(false) : finishCombat('flee');
}
function renderEasy() {
  coach('combat'); const cfg = CB.cfg; const T = CB.thr;
  const r = CB.foes.map(f => h('div', { class: 'fcard' }, foeIcon(f, 48) || '', h('div', { class: 'fi2' }, h('div', { class: 'fn2' }, h('b', {}, fname(f))))));
  show({ compact: true, kicker: 'FACE À FACE', title: cfg.title || 'Un affrontement', text: [cfg.intro || '', '<span class="acc">Des adversaires à ta portée : tu peux régler ça d’un coup.</span>'].filter(Boolean), extra: h('div', {}, h('div', { class: 'pvchips' }, h('span', { class: 'pvc', style: `border-color:${T.col};color:${T.col}` }, T.label)), h('div', { class: 'fpv' }, r)), choices: [C('Régler d’un coup', autoResolve, { ic: '⚡', cls: 'cta', sub: 'Rapide, peu de risques, un peu moins d’XP' }), C('Combattre', engage, { ic: '⚔' })] });
}
function renderPreview() {
  coach('combat'); const cfg = CB.cfg; const T = CB.thr;
  const r = CB.foes.map(f => { const t = f.tier || Math.max(1, Math.round(f.atk / 2)); const tags = foeSpecialChips(f).slice(0, 2);
    return h('div', { class: 'fcard' }, foeIcon(f, 64) || '', h('div', { class: 'fi2' }, h('div', { class: 'fn2' }, h('b', {}, fname(f)), h('span', { class: 'fst' }, '★'.repeat(Math.min(5, t)) + '☆'.repeat(Math.max(0, 5 - t)))), tags.length || f.m ? h('div', {}, f.m ? h('span', { class: 'tag' }, 'machine') : null, tags) : null)); });
  const chips = h('div', { class: 'pvchips' }, h('span', { class: 'pvc', style: `border-color:${T.col};color:${T.col}` }, T.label), h('span', { class: 'pvc' }, `${CB.N} rounds`));
  const L = [C(T.gap >= 2 ? 'Tenter malgré tout' : 'Combattre', engage, { ic: '⚔', cls: 'cta' })];
  if (cfg.canFlee !== false) L.push(C('Fuir', flee, { odds: ['agilite', 11 + CB.foes.length + CB.tier * 2, ['mobility']], cls: 'back' }));
  show({ compact: true, kicker: 'FACE À FACE', title: cfg.title || 'Un affrontement', text: [cfg.intro || '', T.gap >= 2 ? '<span class="badc">Une victoire totale est improbable.</span>' : ''].filter(Boolean), extra: h('div', {}, chips, h('div', { class: 'fpv' }, r)), choices: L });
}
// ── Un round ──
function play(m) {
  if (!CB || CB.over) return; CB.log = []; CB.pops = []; CB.preview = false; const pc = G.pc;
  if (m.cost) pc.en = Math.max(0, pc.en - m.cost);
  if (m.cat === 'pw' && m.kind !== 'awaken') CB.pwUsed = (CB.pwUsed || 0) + 1;
  let res = 'loss', sev = m.sev == null ? 1 : m.sev; const nb = CB.nextBonus; CB.nextBonus = 0; let r = null;
  if (m.kind === 'abil') { CB.abil = CB.abil || {}; CB.abil[m.pid] = (CB.abil[m.pid] || 0) + 1; pxGain(m.pid, 1); abilityApply(m.ab); res = m.ab.fam === 'rewind' ? 'draw' : 'win'; if (res === 'draw') sev = 0; pop('f0', res === 'win' ? m.ab.name.toUpperCase() : 'FAILLE', 'crit'); }
  else if (m.kind === 'sig') { sigDo(m); res = 'win'; }
  else if (m.kind === 'heal') { const g = Math.round(pc.hpMax * 0.25); pc.hp = Math.min(pc.hpMax, pc.hp + g); clog(`${powName('heal')} : +${g} PV. Round nul.`, 'good'); pop('pc', `+${g}`, 'ok'); pc.party.forEach(a => { if (a.inj <= 0) a.hp = Math.min(a.hpMax, a.hp + Math.round(a.hpMax * 0.25)); }); res = 'draw'; }
  else if (m.kind === 'item') { takeItem(m.item); const it = ITEMS[m.item]; const h0 = pc.hp; pc.hp = Math.min(pc.hpMax, pc.hp + (it.use === 'hp40' ? 40 : 15)); if (it.use === 'hp40') pc.party.forEach(a => { if (a.inj > 0) { a.inj = 0; a.hp = Math.ceil(a.hpMax / 2); } }); clog(`${it.n} : +${pc.hp - h0} PV. Round nul.`, 'good'); pop('pc', `+${pc.hp - h0}`, 'ok'); res = 'draw'; sev = 0.4; }
  else {
    const cnt = isCounter(m); r = check(m.attr, roundDc(), m.tags, hitBonus() + (m.bonus || 0) + nb + intentBonus(m)); if (CB.adv > 0) { if (!r.ok) { const r2 = check(m.attr, roundDc(), m.tags, hitBonus() + (m.bonus || 0) + nb + intentBonus(m)); if (r2.ok) { r = r2; clog('🍀 Seconde chance : le jet est repris.', 'good'); } } CB.adv--; } CB.lastR = r; const crit = r.crit || (PK('crit') && r.r >= 19);
    if (r.ok) { res = 'win'; if (m.kind === 'tech') techEffect(); if (m.kind === 'awaken') awaken(); if (m.weak) CB.weak = m.weak; if (m.en) pc.en = Math.min(pc.enMax, pc.en + m.en); if (crit) { CB.nextBonus += 2; clog('Coup remarquable : +2 au prochain jet.', 'good'); } }
    else { res = 'loss'; if (r.fumble) sev *= 1.5; if (m.dodge && chance(m.dodge)) { res = 'draw'; sev = 0; clog('Tu esquives tout !', 'good'); pop('pc', 'ESQUIVE', 'ok'); } else if (m.kind === 'awaken') clog('L’Éveil ne vient pas.', 'log-miss'); if (PK('thorns') && chance(Math.min(0.6, PK('thorns') * 0.12))) { res = 'draw'; sev = 0.3; clog('Ta riposte contrebalance : round nul.', 'good'); } }
  }
  if (res === 'win' && hasAnti('shock') && !CB.shockUsed) { CB.shockUsed = true; CB.nextBonus += 2; clog('Onde de choc : +2 au prochain jet.', 'good'); }
  if (res === 'win') { CB.W++; vfx(r && r.crit ? 'CRITIQUE !' : 'ROUND GAGNÉ', 'good'); sfx('hit'); clog(pick(['Tu prends l’avantage.', 'Ton geste fait mouche.', 'Ils reculent d’un pas.']), 'good'); if (PK('weaken') && !CB.weakDone) { CB.weakDone = true; aliveFoes().forEach(x => { x.dmg = Math.max(1, x.dmg - PK('weaken') * 2); }); clog('Tes ennemis faiblissent.', 'warnc'); } if (PK('stun') && chance(PK('stun') / 100)) { CB.nextBonus += 2; clog('Sidérés, ils vacillent : +2 au prochain round.', 'warnc'); } if (PK('drain')) { const g = Math.min(PK('drain') * 2, pc.hpMax - pc.hp); if (g > 0) { pc.hp += g; clog(`Absorption : +${g} PV.`, 'good'); } } }
  else if (res === 'loss') { CB.Lz++; vfx('ROUND PERDU', 'bad'); clog(pick(['Ils lisent ton geste et ripostent.', 'Ton geste échoue.', 'Tu perds le rythme.']), 'log-miss'); }
  if (res === 'loss' && CB.mirror) { CB.mirror = 0; res = 'draw'; sev = 0; clog('🪞 Ta défaite est renvoyée : round nul.', 'good'); }
  if (res === 'loss' && CB.foeStun) { CB.foeStun = 0; res = 'draw'; sev = 0; clog('💫 Leur coup est annulé : round nul.', 'good'); }
  if (res === 'loss' && CB.rageLeft > 0) sev *= 1.25;
  if (res === 'win' && CB.venom > 0) { CB.venom--; CB.W = Math.min(CB.N, CB.W + 1); clog('☠ Le poison achève : un round de plus compté.', 'good'); }
  if (res === 'loss' && CB.intent && CB.intent.k === 'special' && CB.intent.ab) foeAbilityHit(CB.intent.ab);
  if (res === 'loss' && r) { const it = intentOf(); if (it && !(isCounter(m))) { sev *= it.mul; if (it.mul > 1.2) clog(`${it.ic} ${it.n} : tu prends de plein fouet.`, 'log-dmg'); } else if (it && isCounter(m)) sev *= 0.75; }
  if (r && r.ok && isCounter(m)) { CB.combo = (CB.combo || 0) + 1; clog(`${intentOf().ic} Bien lu : tu contres ${intentOf().n}.`, 'good'); if (CB.combo >= 2) { CB.nextBonus += 2; CB.combo = 0; clog('Enchaînement : +2 au prochain jet.', 'good'); } } else if (r) CB.combo = 0;
  if (res === 'loss' || (res === 'draw' && sev > 0)) hurtPc(sev);
  CB.hist.push(res === 'win' ? 'w' : res === 'loss' ? 'l' : 'd');
  CB.fx = res === 'win' ? { pc: (m.cat === 'pw' || m.kind === 'sig') ? 'power' : 'atk', foe: 'hurt' } : res === 'loss' ? { pc: 'hurt', foe: 'atk' } : { pc: 'power' };
  pc.en = Math.min(pc.enMax, pc.en + PK('energy')); if (PK('regen') && pc.hp < pc.hpMax) pc.hp = Math.min(pc.hpMax, pc.hp + PK('regen'));
  if (PK('allyheal')) pc.party.forEach(a => { if (a.inj <= 0) a.hp = Math.min(a.hpMax, a.hp + PK('allyheal')); });
  if (hasAnti('restore')) { if (pc.hp < pc.hpMax) pc.hp = Math.min(pc.hpMax, pc.hp + 1); if (CB.round % 2 === 0) pc.en = Math.min(pc.enMax, pc.en + 1); }
  if (CB.weak > 0) CB.weak--;
  if (CB.rageLeft > 0) CB.rageLeft--; if (CB.hexLeft > 0) CB.hexLeft--; if (CB.swarm > 0) CB.swarm--;
  syncFoes();
  CB.round++; nextIntent();
  if (pc.hp <= 0) return loseCombat(false);
  if (CB.Lz >= CB.N) return conclude();
  if (CB.W >= needW()) return conclude();
  if (CB.round > CB.N) return conclude();
  renderCombat();
}
// Les ennemis tombent au fil des rounds gagnés
function syncFoes() {
  const prog = Math.min(1, CB.W / needW()); const n = CB.foes.length;
  CB.foes.forEach((f, i) => { const k = clamp(prog * n - i, 0, 1); const before = f.dead; f.hp = Math.round(f.hpMax * (1 - k)); f.dead = k >= 1; if (f.dead && !before) { clog(`${fname(f)} s’effondre.`, 'good'); pop('f' + i, 'K.O.', 'crit'); } else if (k > 0 && !f.dead) pop('f' + i, '−', 'dmg'); });
}
function hurtPc(sev) {
  const pc = G.pc; const hostile = aliveFoes().filter(f => f.stun <= 0); if (!hostile.length) return;
  if (CB.dodge > 0 && sev >= 0.5) { CB.dodge--; pop('pc', 'ESQUIVE', 'ok'); clog('Tu esquives la riposte !', 'good'); return; }
  const friends = pc.party.filter(a => a.inj <= 0); const cover = 0.10 * teamK(friends.length) + 0.05 * Math.max(0, 1 - teamK(friends.length) * 1.5); let tot = 0;
  hostile.forEach(f => {
    let d = foeHit(f) * 0.95 * sev * (pc.hp < pc.hpMax * 0.4 ? 1.1 : 1) * (CB.weak > 0 ? 0.75 : 1) * (1 - cover) - PK('def') - (hasAnti('foresight') ? 1 : 0) - Math.floor(pcArm() / 3) - (hasRole('gardien') ? 1 : 0);
    d = Math.max(1 + Math.floor(pc.hpMax * 0.015 * (f.tier || 1) / 2), Math.round(d)); // les ennemis restent dangereux, même face à une grosse armure
    if (friends.length && chance(0.03 + 0.05 * teamK(friends.length))) { const a = pick(friends); a.hp -= d; clog(`${fname(f)} blesse ${CH[a.id].name} (${d}).`, 'log-dmg'); if (a.hp <= 0) { a.hp = 0; a.inj = 4; clog(`${CH[a.id].name} est mis hors combat !`, 'log-dmg'); } return; }
    tot += d;
  });
  if (CB.swarm > 0 && tot > 0) { const ab = Math.min(3, tot); tot -= ab; clog(`🐝 Tes alliés invoqués encaissent ${ab}.`, 'good'); }
  if (CB.shield > 0 && tot > 0) { const ab = Math.min(CB.shield, tot); CB.shield -= ab; tot -= ab; clog(`Ton bouclier absorbe ${ab}.`, 'good'); }
  if (tot > 0) { pc.hp = Math.max(0, pc.hp - tot); CB.hurt = true; pop('pc', `−${tot}`, 'dmg'); clog(`Tu encaisses ${tot}.`, 'log-dmg'); if (pc.hp <= 0 && CB.lb) { CB.lb = false; pc.hp = 1; clog('Dernier souffle : tu t’accroches à 1 PV !', 'good'); } }
}
function flee() {
  if (!CB || CB.over) return; CB.log = []; CB.pops = [];
  const dc = 11 + CB.foes.length + CB.tier * 2; const r = check('agilite', dc, ['mobility']);
  if (r.ok) { clog('Tu t’échappes !', 'good'); const cb = CB; CB.fx = { pc: 'flee' }; renderCombat(); return void setTimeout(() => { if (CB === cb) finishCombat('flee'); }, 700); }
  clog('Impossible de fuir : on te rattrape.', 'log-dmg'); CB.Lz++; CB.hist.push('l'); CB.preview = false; hurtPc(1); CB.round++;
  if (G.pc.hp <= 0) return loseCombat(false); if (CB.Lz >= CB.N || CB.round > CB.N) return conclude(); renderCombat();
}
function sweepAway() { G.pc.hp = Math.max(1, G.pc.hp - Math.round(G.pc.hpMax * 0.05)); CB.foes.forEach(f => { f.dead = true; f.hp = 0; }); CB.over = true; CB.bilan = '💨 Ils ne font pas le poids'; finishCombat('win'); }
function conclude() {
  const { W, Lz, N } = CB; const cfg = CB.cfg; const pc = G.pc; CB.over = true; const hist = CB.hist.map(x => x === 'w' ? '✔' : x === 'l' ? '✖' : '–').join(' ');
  const fate = cfg.lethal === 'death' ? 'tué' : cfg.lethal === 'capture' ? 'capturé' : 'hors de combat';
  if (Lz >= N) { toast(`${hist} · Défaite`); return loseCombat(false); }
  if (W >= needW()) { CB.foes.forEach(f => { f.dead = true; f.hp = 0; }); CB.bilan = `${hist} · adversaire ${fate}`; return finishCombat('win'); }
  if (W > Lz) { CB.partial = true; CB.bilan = `${hist} · il s’enfuit, blessé`; return finishCombat('win'); }
  let txt = W === Lz ? 'impasse, chacun se replie' : 'tu es blessé, tu te replies'; if (W < Lz) { const loss = Math.round(pc.hpMax * 0.12); pc.hp = Math.max(1, pc.hp - loss); txt += ` (−${loss} PV)`; }
  toast(`${hist} · ${txt}`);
  if (cfg.canFlee === false) return loseCombat(false); finishCombat('flee');
}
// ── Affichage ──
// Ton sprite et ceux de ton équipe en tête du combat
function teamStrip() {
  const pc = G.pc; const me = pcSprite(); const mates = pc.party.filter(a => a.inj <= 0 && hasSpr(a.id)).slice(0, 4);
  const foes = CB.foes.map((f, i) => [f, i]).filter(([f]) => f.cid && hasSpr(f.cid));
  if (!(me && hasSpr(me)) && !mates.length && !foes.length) return null;
  const fx = CB.fx || {}; CB.fx = null; const first = !CB.entered; CB.entered = true;
  const fp = fx.pc ? ' ' + fx.pc : '', ff = fx.foe ? ' ' + fx.foe : '';
  const left = h('div', { class: 'cside l' }, ...mates.map((a, i) => h('div', { class: 'cmate' + (first ? ' enter-l' : '') + (fx.pc === 'atk' || fx.pc === 'power' ? ' assist' : ''), style: `animation-delay:${(i + 1) * 90}ms`, title: CH[a.id] ? CH[a.id].name : '' }, sprFit(a.id, 40, 'portrait'))), me && hasSpr(me) ? h('div', { class: 'cme' + (first ? ' enter-l' : '') + fp, 'data-k': 'pc' }, sprFit(me, 72, 'portrait'), fx.pc === 'power' ? h('i', { class: 'aura' }) : null) : null);
  const right = h('div', { class: 'cside r' }, ...foes.map(([f, i]) => h('div', { class: 'cfoe' + (first ? ' enter-r' : '') + (f.dead ? ' ko' : ff), style: `animation-delay:${i * 110}ms` }, sprFit(f.cid, 72, 'portrait'))));
  const spark = fx.pc === 'atk' ? h('i', { class: 'spark r' }, '💥') : fx.pc === 'power' ? h('i', { class: 'spark r pw' }, '✦') : fx.foe === 'atk' ? h('i', { class: 'spark l' }, '💢') : null;
  return h('div', { class: 'cstage' }, left, spark, h('div', { class: 'cvs' }, fx.pc === 'atk' || fx.pc === 'power' ? '⚔' : fx.foe === 'atk' ? '🗡' : ''), right);
}
function intentChip() { const it = intentOf(); if (!it || CB.over) return null; return h('div', { class: 'intent' }, h('span', { class: 'iic' }, it.ic), h('div', {}, h('b', {}, CB.intent.ab ? `${fname(CB.intent.foe)} : ${FAMS[CB.intent.ab.fam].ic} ${CB.intent.ab.name} (${CB.intent.ab.power})` : 'Il prépare : ' + it.n), h('div', { class: 'small mut' }, it.tip))); }
function renderCombat() {
  if (CB && CB.auto) return;
  const cfg = CB.cfg; const pc = G.pc; CB.prev = CB.prev || {}; const bars = [];
  const rows = h('div', { class: 'foechips' }, CB.foes.map((f, i) => {
    const bi = h('i', { style: `width:${(CB.prev[i] != null ? CB.prev[i] : 100)}%` }); const pct = Math.max(0, f.hp) / f.hpMax * 100; bars.push([bi, pct]); CB.prev[i] = pct;
    return h('div', { class: 'fchip' + (f.dead ? ' dead' : ''), 'data-k': 'f' + i }, foeIcon(f, 44) || '', h('div', { class: 'fcn' }, h('span', { class: 'fn' }, fname(f)), h('div', { class: 'bar hp mini' }, bi)));
  }));
  const st = [CB.shield ? `🛡 ${CB.shield}` : '', CB.dodge ? `💨 esquive ×${CB.dodge}` : '', CB.nextBonus ? `+${CB.nextBonus} prochain jet` : '', CB.weak ? 'ennemis affaiblis' : '', CB.rage ? 'BÊTE FÉROCE' : ''].filter(Boolean).join(' · ');
  const need = needW();
  const pips = h('div', { class: 'rpips' }, Array.from({ length: CB.N }, (_, i) => { const x = CB.hist[i]; return h('span', { class: 'rp ' + (x === 'w' ? 'w' : x === 'l' ? 'l' : x === 'd' ? 'd' : i === CB.round - 1 ? 'cur' : '') }, x === 'w' ? '✔' : x === 'l' ? '✖' : x === 'd' ? '–' : i + 1); }));
  const goal = h('div', { class: 'small mut' }, `Gagne ${need} round${need > 1 ? 's' : ''} sur ${CB.N} pour les battre · ${CB.W} gagné${CB.W > 1 ? 's' : ''}, ${CB.Lz} perdu${CB.Lz > 1 ? 's' : ''}`);
  const rlog = h('div', { class: 'rlog' }, CB.log.slice(-2).map(l => h('div', { class: l.c }, l.t)));
  const pops = CB.pops || []; CB.pops = []; const hurt = CB.hurt; CB.hurt = false;
  const hook = () => {
    requestAnimationFrame(() => setTimeout(() => bars.forEach(([b, w]) => { b.style.width = w + '%'; }), 80));
    setTimeout(() => {
      let dmgF = false, dmgP = false;
      pops.forEach((p, n) => { const host = document.querySelector(`.combat [data-k="${p.k}"]`); if (!host) return; if (p.cls === 'dmg' || p.cls === 'crit') { if (p.k === 'pc') dmgP = true; else dmgF = true; host.classList.add('hit'); }
        const el = h('span', { class: 'pop ' + p.cls, style: `animation-delay:${n * 140}ms` }, p.txt); host.append(el); setTimeout(() => el.remove(), 1500 + n * 140); });
      if (dmgP || hurt) { setTimeout(() => { sfx('hurt'); shake(); flash('#ff2a6d'); }, 180); }
    }, 60);
  };
  show({ compact: true, after: hook, kicker: `AFFRONTEMENT · ROUND ${Math.min(CB.round, CB.N)}/${CB.N}`, title: cfg.title, text: [], extra: h('div', { class: 'combat' }, teamStrip(), h('div', { class: 'chead', 'data-k': 'pc' }, pips), rows, intentChip(), goal, st ? h('div', { class: 'small acc' }, st) : null, rlog), choices: combatChoices(), tiles: true, tcls: 'hand' });
}
function combatChoices() {
  const pc = G.pc; const L = [];
  moves().forEach((m, i) => L.push(C(m.label, () => play(m), { ic: m.ic, sub: (isCounter(m) ? '✔ Contre ce qu’il prépare · ' : '') + m.sub, odds: m.kind === 'sig' || m.kind === 'heal' ? undefined : oddsOf(m), cls: m.cls || (i === 0 ? 'safe' : ''), req: { ok: () => m.lock || (m.cost && pc.en < m.cost ? 'Énergie insuffisante' : null) } })));
  CB.allyUsed = CB.allyUsed || {}; pc.party.filter(a => a.inj <= 0 && CH[a.id] && !CB.allyUsed[a.id]).slice(0, 2).forEach(a => { const c = CH[a.id]; const ab = (c.powers || []).length ? powerAbility(c.powers[0]) : null; if (!ab) return;
    L.push(C(`${c.name} : ${ab.name}`, () => { CB.allyUsed[a.id] = 1; abilityApply(ab, c.name); sfx('win'); burst(innerWidth / 2, 200, '#27f0ff', 18); syncFoes(); if (CB.W >= needW()) return conclude(); renderCombat(); }, { ic: ab.ic, sub: `${ab.txt} · allié, 1×/combat, sans coûter de round`, cls: 'back' })); });
  const heal = ['nanosoin', 'kit', 'bandage'].find(id => hasItem(id));
  if (heal && !CB.noItems && pc.hp < pc.hpMax * 0.55) L.push(C(`Se soigner (${ITEMS[heal].n})`, () => play({ kind: 'item', item: heal, sev: 0.4 }), { ic: '💊', sub: 'Round nul', cls: 'back' }));
  const pw = moves()[moves().length - 1]; if (hasItem('capsule') && !CB.noItems && (pc.en < pc.enMax * 0.4 || (pw && pw.lock))) L.push(C('Utiliser une Capsule OGEN', () => { takeItem('capsule'); pc.en = Math.min(pc.enMax, pc.en + 8); clog('Capsule OGEN : +8 énergie.', 'good'); sfx('win'); renderCombat(); }, { ic: '⚡', sub: 'Recharge 8 énergie · ne prend pas de round', cls: 'back' }));
  if (hasItem('stimulant') && !CB.noItems && !CB.stimUsed && CB.round === 1) L.push(C('Utiliser un stimulant', () => { takeItem('stimulant'); CB.stimUsed = true; CB.hitBuff += 3; clog('Stimulant : +3 à tous tes jets.', 'good'); sfx('win'); renderCombat(); }, { ic: '💉', sub: '+3 à tous les jets de ce combat · ne prend pas de round', cls: 'back' }));
  if (pc.en >= 2 && !CB.over && CB.pushRd !== CB.round) L.push(C('Forcer le prochain geste', () => { pc.en -= 2; CB.nextBonus += 3; CB.pushRd = CB.round; clog('Tu puises dans tes réserves : +3 au prochain jet.', 'good'); sfx('win'); renderCombat(); }, { ic: '⚡', sub: '+3 au jet · 2⚡ · ne prend pas de round', cls: 'back' }));
  if (CB.cfg.canFlee !== false) L.push(C('Fuir', flee, { odds: ['agilite', 11 + CB.foes.length + CB.tier * 2, ['mobility']], cls: 'back' }));
  else if (CB.cfg.lethal !== 'death') L.push(C('Se rendre', () => { clog('Tu poses les armes.'); loseCombat(true); }, { cls: 'back' }));
  return L;
}
