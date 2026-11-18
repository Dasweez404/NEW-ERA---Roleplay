// ───────── Combat V2 : intentions annoncées, main de 3 cartes, 3 à 5 rounds courts ─────────
// Chaque ennemi annonce son geste (frappe / feinte / garde). Tu joues UNE carte parmi 3 : Attaque, Garde ou Ruse.
// Garde contre la frappe, Attaque contre la feinte, Ruse contre la garde. La main change à chaque round.
const INTENT = { atk: { ic: '🗡', n: 'va frapper', w: 'Frappe' }, fnt: { ic: '🌀', n: 'prépare une feinte', w: 'Feinte' }, grd: { ic: '🛡', n: 'se met en garde', w: 'Garde' }, stn: { ic: '💫', n: 'est sonné', w: 'Sonné' } };
const CTYPE = { atk: { n: 'Attaque', ic: '⚔' }, grd: { n: 'Garde', ic: '🛡' }, rus: { n: 'Ruse', ic: '🌀' } };
// [intention][type de carte] = [dégâts infligés ×, dégâts reçus ×, étiquette]
const MATRIX = {
  atk: { grd: [0.8, 0.15, 'contre'], atk: [1.0, 1.0, 'échange'], rus: [0.3, 1.0, 'risqué'] },
  fnt: { atk: [1.5, 0, 'contre'], rus: [0.8, 0.3, 'échange'], grd: [0.2, 0.5, 'risqué'] },
  grd: { rus: [1.5, 0, 'contre'], grd: [0.4, 0, 'échange'], atk: [0.4, 0, 'bloqué'] },
};
// Puissance : UNE seule échelle (1 à 10) tirée de la somme des attributs (étoiles + progression + pierres) et un peu du matériel.
function pcPower() { const pc = G.pc; const w = weaponOf(), a = armorOf(); const sum = ATTRS.reduce((t, x) => t + A(x.id), 0); return clamp(sum / 5.6 + 0.12 * ((w ? w.dmg : 0) + (a ? a.def : 0)), 1, 10); }
function pcLevel() { return clamp(Math.round(pcPower()), 1, 8); }
const rr = (a, b) => a + Math.random() * (b - a);
const pcBase = () => { const w = weaponOf(); return 3.2 + 1.15 * pcPower() + (w ? w.dmg * 0.4 : 0) + PK('dmg') * 0.4; };
const foeHit = f => Math.max(1, Math.round((2.6 + 2 * (f.tier || 1) + f.dmg * 0.09) * rr(0.9, 1.1)));
const dmgMul = () => 1 + 0.1 * (CB.nextBonus || 0) + 0.05 * (CB.hitBuff || 0) + ((CB.boost || 1) - 1) + (CB.rage ? 0.3 : 0);
function rollIntent(f) {
  if (f.stun > 0) return 'stn';
  const sp = f.sp || []; let a = 55, n = 25, g = 20;
  if (sp.includes('dash')) n += 20; if (sp.includes('shield') || sp.includes('foresight')) g += 15; if (sp.includes('buff')) a += 15; if (f.m) { a += 25; n = 5; }
  return wpick([['atk', a], ['fnt', n], ['grd', g]], x => x[1])[0];
}
function rollIntents() { CB.foes.forEach(f => { if (!f.dead) f.intent = rollIntent(f); }); if (!CB.foes[CB.tgt] || CB.foes[CB.tgt].dead) CB.tgt = Math.max(0, CB.foes.findIndex(f => !f.dead)); }
const target = () => CB.foes[CB.tgt] && !CB.foes[CB.tgt].dead ? CB.foes[CB.tgt] : aliveFoes()[0];
// ── Les cartes ──
function cardPool() {
  const pc = G.pc; const P = []; const add = (c, w = 1) => P.push({ c, w });
  const w = weaponOf();
  add({ id: 'frappe', type: 'atk', name: 'Frappe', ic: '⚔', cost: 0, mult: 1.0, txt: w ? w.n : 'À mains nues' }, 2);
  add({ id: 'parade', type: 'grd', name: 'Parade', ic: '🛡', cost: 0, mult: 0.9, txt: 'Tu encaisses puis ripostes · +1 énergie si rien à parer', run: () => { if (target() && target().intent === 'grd') pc.en = Math.min(pc.enMax, pc.en + 1); } }, 2);
  add({ id: 'feinte', type: 'rus', name: 'Feinte', ic: '🌀', cost: 0, mult: 0.9, txt: 'Prendre à revers' }, 2);
  const st = STYLES[pc.style]; const stType = (pc.style === 'juggernaut' || pc.style === 'protector') ? 'grd' : (pc.style === 'flanker' || pc.style === 'assist') ? 'rus' : 'atk';
  add({ id: 'tech', type: stType, name: st.tech.name, ic: '★', cost: st.tech.cost, mult: 1.4, txt: cap(st.tech.text), run: techEffect }, 1);
  if (pc.ptype !== 'aucun') {
    const tags = Object.keys(powerTags()).filter(x => POWER_FX[x]);
    const PWC = {
      combat: { type: 'atk', mult: 1.6 * (pc.ptype === 'hybride' ? 0.8 : 1), txt: 'Frappe de pouvoir : très gros dégâts' },
      control: { type: 'rus', mult: 0.6, txt: 'Entrave : les ennemis sont sonnés au prochain round', run: () => { (CB.foes.length >= 2 ? aliveFoes() : [target()]).forEach(x => { if (x) x.stunNext = 1; }); } },
      defense: { type: 'grd', mult: 0.4, txt: 'Bouclier : absorbe 10 dégâts', run: () => { CB.shield += 10; } },
      heal: { type: 'grd', mult: 0, txt: 'Régénération : +25 % PV', run: () => { const g = Math.round(pc.hpMax * 0.25); pc.hp = Math.min(pc.hpMax, pc.hp + g); pop('pc', `+${g}`, 'ok'); clog(`${powName('heal')} : +${g} PV.`, 'good'); pc.party.forEach(a => { if (a.inj <= 0) a.hp = Math.min(a.hpMax, a.hp + Math.round(a.hpMax * 0.25)); }); } },
      mobility: { type: 'rus', mult: 0.8, txt: 'Esquive : aucun dégât ce round', run: () => { CB.dodge++; } },
      stealth: { type: 'rus', mult: 0.6, txt: 'Disparaît : prochaine carte +50 %', run: () => { CB.nextBonus += 5; } },
      hack: { type: 'atk', mult: 1.0, txt: 'Pirate une machine : elle est neutralisée', need: () => aliveFoes().some(x => x.m), run: () => { const mc = aliveFoes().find(x => x.m); if (mc) { mc.hp = 0; clog(`${fname(mc)} est neutralisé.`, 'good'); } } },
      scout: { type: 'rus', mult: 0.6, txt: 'Analyse : prochaine carte +40 %', run: () => { CB.nextBonus += 4; } },
      social: { type: 'rus', mult: 0.5, txt: 'Intimide : leurs coups −30 % (2 rounds)', run: () => { CB.weak = 2; } },
      tech: { type: 'atk', mult: 0.8, txt: 'Drone : frappe un ennemi chaque round', run: () => { CB.drone = (CB.drone || 0) + 3; } },
    };
    tags.forEach(t => { const d = PWC[t]; if (!d || (d.need && !d.need())) return; add({ id: 'pw_' + t, type: d.type, name: powName(t), ic: '✦', cost: POWER_FX[t].cost, mult: d.mult, txt: d.txt, run: d.run, pow: true }, 1); });
    const sg = sigMove(); if (sg && !sg.lock) add({ id: 'sig', type: 'atk', name: sg.label.replace('Signature : ', ''), ic: '✦', cost: sg.cost, mult: 1.2, txt: 'Signature : coup décisif garanti', forced: true, run: () => sigDo(sg), sig: true }, 1);
    if (pcPowers().length && pc.hp <= pc.hpMax * 0.4 && !CB.wasAwake) add({ id: 'awaken', type: 'atk', name: 'ÉVEIL', ic: '⚡', cost: 0, mult: 1.5, txt: 'Plus tu es blessé, plus c’est probable', forced: true, danger: true, run: () => { const p = 0.3 + (1 - pc.hp / pc.hpMax) * 0.6; if (chance(p)) awaken(); else { CB.failAwake = true; clog('L’Éveil ne vient pas.', 'log-miss'); } } }, 3);
  }
  const heal = ['nanosoin', 'kit', 'bandage'].find(id => hasItem(id)); if (heal && !CB.noItems && pc.hp < pc.hpMax * 0.75) add({ id: 'item', type: 'grd', name: ITEMS[heal].n, ic: '💊', cost: 0, mult: 0.3, txt: ITEMS[heal].desc, run: () => { takeItem(heal); const it = ITEMS[heal]; if (it.use === 'hp40') pc.party.forEach(a => { if (a.inj > 0) { a.inj = 0; a.hp = Math.ceil(a.hpMax / 2); } }); const h0 = pc.hp; pc.hp = Math.min(pc.hpMax, pc.hp + (it.use === 'hp40' ? 40 : 15)); pop('pc', `+${pc.hp - h0}`, 'ok'); clog(`${it.n} : +${pc.hp - h0} PV.`, 'good'); } }, 2);
  return P;
}
function drawHand() {
  const pc = G.pc; const pool = cardPool().filter(x => x.c.cost <= pc.en); let hand = [];
  for (let tries = 0; tries < 6; tries++) {
    const left = pool.slice(); hand = [];
    while (hand.length < 3 && left.length) { const e = wpick(left, x => x.w); hand.push(e.c); left.splice(left.indexOf(e), 1); }
    if (new Set(hand.map(c => c.type)).size >= 2) break;
  }
  CB.hand = hand;
}
function cardOutcome(card) { const t = target(); if (!t) return ['échange', 1, 1]; if (card.forced) return ['contre', 1.5, 0]; if (t.stun > 0) return ['sonné', 1.3, 0]; const m = MATRIX[t.intent][card.type]; return [m[2], m[0], m[1]]; }
// ── Lancement ──
function roundsFor2(cfg, foes, gap) { if (cfg.rounds) return cfg.rounds; const t = Math.max(...foes.map(f => f.tier || 1)); let n = 4; if (foes.length === 1 && gap <= -1) n = 3; if (foes.length >= 3 || t >= 5 || gap >= 2) n = 5; return n; }
function startCombat(cfg) {
  if (cfg.foes.length > 3) cfg.foes = cfg.foes.slice(0, 3);
  scaleFoes(cfg); dedupeFoes(cfg.foes);
  CB = { cfg, foes: cfg.foes, N: 4, round: 1, hist: [], log: [], pops: [], tier: Math.max(...cfg.foes.map(f => f.tier || Math.round(f.atk / 2))), dodge: PK('dodge'), shield: PK('shield'), lb: !!PK('lastbreath'), hitBuff: 0, boost: 1, rage: false, noItems: false, wasAwake: false, nextBonus: 0, halve: 0, weak: 0, drone: 0, tgt: 0, good: 0, pops2: [], sig: {}, W: 0, Lz: 0 };
  CB.foes.forEach(f => { f.dead = false; f.stun = 0; f.stunNext = 0; f.hp = f.hpMax; });
  CB.thr = threat(); CB.N = roundsFor2(cfg, CB.foes, CB.thr.gap);
  clog(cfg.intro || 'Le combat commence !');
  if (cfg.noPreview) return beginDuel();
  if (CB.thr.gap <= -2) return sweepAway();
  if (CB.thr.gap >= 1) { CB.preview = true; return renderPreview(); }
  beginDuel();
}
function engage() { if (!CB) return; CB.preview = false; beginDuel(); }
function vfx(text, cls) { if (typeof REDUCED !== 'undefined' && REDUCED) return; const el = h('div', { class: 'vfx ' + cls }, text); document.body.append(el); setTimeout(() => el.remove(), 950); }
function beginDuel() { if (!CB) return; CB.preview = false; coach('combat'); if (PK('first')) { CB.nextBonus += 3; clog('Initiative : +30 % à ta première carte.', 'good'); } rollIntents(); drawHand(); renderCombat(); }
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
function play(card) {
  if (!CB || CB.over) return; CB.log = []; CB.pops = []; const pc = G.pc; CB.preview = false;
  if (card.cost) pc.en = Math.max(0, pc.en - card.cost);
  const t = target(); const [lab, dm, tm] = cardOutcome(card); const nb = CB.nextBonus; CB.nextBonus = 0;
  if (lab === 'contre') { vfx('CONTRE !', 'good'); sfx('crit'); } else if (lab === 'risqué') vfx('TOUCHÉ !', 'bad'); else if (lab === 'sonné') vfx('OUVERTURE', 'good');
  CB.hist.push(lab === 'contre' || lab === 'sonné' ? 'w' : lab === 'échange' || lab === 'bloqué' ? 'd' : 'l'); if (lab === 'contre') CB.good++;
  // dégâts infligés
  let dmg = Math.round(pcBase() * card.mult * dm * (1 + 0.1 * nb + 0.05 * (CB.hitBuff || 0) + ((CB.boost || 1) - 1) + (CB.rage ? 0.3 : 0)) * rr(0.92, 1.08));
  if (card.pow && card.mult >= 1) dmg = Math.round(dmg * (CB.boost || 1));
  if (card.run) card.run();
  if (t && !t.dead && dmg > 0 && t.hp > 0) { t.hp = Math.max(0, t.hp - dmg); pop('f' + CB.foes.indexOf(t), `−${dmg}`, lab === 'contre' ? 'crit' : 'dmg'); clog(lab === 'contre' ? `Contre parfait ! ${fname(t)} encaisse ${dmg}.` : `${CTYPE[card.type].n} : ${fname(t)} encaisse ${dmg}.`, lab === 'contre' ? 'good' : ''); }
  else if (t && !t.dead && dmg <= 0 && card.mult > 0) clog('Ton geste ne touche rien.', 'log-miss');
  // alliés et drone
  const friends = pc.party.filter(a => a.inj <= 0);
  let ex = 0; friends.forEach(a => { ex += 0.4 + ((CH[a.id] && CH[a.id].stars) || 0) * 0.25; }); ex = Math.min(ex, pcBase() * 0.3); if (CB.drone) ex += CB.drone * pcBase() * 0.08;
  const t2 = target(); if (ex > 0 && t2) { const e = Math.round(ex); t2.hp = Math.max(0, t2.hp - e); if (friends.length) clog(`Ton équipe frappe aussi : ${e}.`, 'good'); }
  CB.foes.forEach(f => { if (!f.dead && f.hp <= 0) { f.dead = true; clog(`${fname(f)} s’effondre.`, 'good'); vfx('K.O.', 'ko'); pop('f' + CB.foes.indexOf(f), 'K.O.', 'crit'); } });
  // dégâts reçus
  if (aliveFoes().length) incoming(card, t, tm);
  // énergie, regen, perks
  pc.en = Math.min(pc.enMax, pc.en + PK('energy')); if (PK('regen') && pc.hp < pc.hpMax) pc.hp = Math.min(pc.hpMax, pc.hp + PK('regen'));
  if (PK('allyheal')) pc.party.forEach(a => { if (a.inj <= 0) a.hp = Math.min(a.hpMax, a.hp + PK('allyheal')); });
  if (lab === 'contre' && PK('drain')) { const g = Math.min(PK('drain') * 2, pc.hpMax - pc.hp); if (g > 0) { pc.hp += g; clog(`Absorption : +${g} PV.`, 'good'); } }
  CB.foes.forEach(x => { if (x.stun > 0) x.stun--; if (x.stunNext) { x.stun = 1; x.stunNext = 0; } }); if (CB.weak > 0) CB.weak--;
  if (pc.hp <= 0) return loseCombat(false);
  if (!aliveFoes().length) { CB.over = true; CB.bilan = `${CB.good} contre${CB.good > 1 ? 's' : ''} · adversaire ${CB.cfg.lethal === 'death' ? 'tué' : CB.cfg.lethal === 'capture' ? 'capturé' : 'hors de combat'}`; return finishCombat('win'); }
  CB.round++; if (CB.round > CB.N) return conclude();
  CB.rerolled = false; rollIntents(); drawHand(); renderCombat();
}
function incoming(card, t, tm) {
  const pc = G.pc; let total = 0; const friends = pc.party.filter(a => a.inj <= 0); const cover = Math.min(0.15, friends.length * 0.05);
  CB.foes.forEach(f => {
    if (f.dead || f.stun > 0 || f.intent === 'grd' || f.intent === 'stn') return;
    let m; if (f === t) m = tm; else m = f.intent === 'atk' ? (card.type === 'grd' ? 0.4 : card.type === 'rus' ? 0.8 : 1.0) : (card.type === 'atk' ? 0 : 0.35);
    if (m <= 0) return;
    let d = foeHit(f) * m * (CB.weak > 0 ? 0.7 : 1) * (pc.hp < pc.hpMax * 0.4 ? 1.1 : 1) * (1 - cover) - PK('def') - Math.floor(pcArm() / 3) - (hasRole('gardien') ? 1 : 0);
    d = Math.max(1, Math.round(d));
    if (friends.length && chance(0.12)) { const a = pick(friends); a.hp -= d; clog(`${fname(f)} blesse ${CH[a.id].name} (${d}).`, 'log-dmg'); if (a.hp <= 0) { a.hp = 0; a.inj = 4; clog(`${CH[a.id].name} est mis hors combat !`, 'log-dmg'); } return; }
    total += d;
  });
  if (CB.dodge > 0 && total > 0) { CB.dodge--; total = 0; pop('pc', 'ESQUIVE', 'ok'); clog('Tu esquives tout !', 'good'); }
  if (CB.shield > 0 && total > 0) { const ab = Math.min(CB.shield, total); CB.shield -= ab; total -= ab; clog(`Ton bouclier absorbe ${ab}.`, 'good'); }
  if (total > 0) { pc.hp = Math.max(0, pc.hp - total); CB.hurt = true; pop('pc', `−${total}`, 'dmg'); clog(`Tu encaisses ${total}.`, 'log-dmg'); if (pc.hp <= 0 && CB.lb) { CB.lb = false; pc.hp = 1; clog('Dernier souffle : tu t’accroches à 1 PV !', 'good'); } }
  else if (!CB.hurt) clog('Tu ne subis rien.', 'good');
}
function reroll() { if (!CB || CB.over || CB.rerolled || G.pc.en < 1) return; G.pc.en--; CB.rerolled = true; CB.log = []; clog('Tu bats les cartes (−1 énergie).'); drawHand(); renderCombat(); }
function flee() {
  if (!CB || CB.over) return; CB.log = []; CB.pops = [];
  const dc = 11 + CB.foes.length + CB.tier * 2; const r = check('agilite', dc, ['mobility']);
  if (r.ok) { clog('Tu t’échappes !', 'good'); return finishCombat('flee'); }
  clog('Impossible de fuir : on te rattrape.', 'log-dmg'); CB.hist.push('l');
  if (CB.preview) { CB.preview = false; rollIntents(); } incoming({ type: 'rus' }, null, 1);
  if (G.pc.hp <= 0) return loseCombat(false);
  CB.round++; if (CB.round > CB.N) return conclude(); CB.rerolled = false; rollIntents(); drawHand(); renderCombat();
}
function sweepAway() { G.pc.hp = Math.max(1, G.pc.hp - Math.round(G.pc.hpMax * 0.03)); CB.foes.forEach(f => { f.dead = true; f.hp = 0; }); CB.over = true; CB.bilan = '💨 Ils ne font pas le poids'; finishCombat('win'); }
function conclude() {
  const cfg = CB.cfg; const pc = G.pc; CB.over = true; const tot = CB.foes.reduce((s, f) => s + f.hpMax, 0), left = CB.foes.reduce((s, f) => s + (f.dead ? 0 : Math.max(0, f.hp)), 0); const ratio = 1 - left / tot;
  if (ratio >= 0.5) { CB.partial = true; CB.bilan = `${CB.good} contre${CB.good > 1 ? 's' : ''} · ils battent en retraite`; return finishCombat('win'); }
  const loss = Math.round(pc.hpMax * 0.12); pc.hp = Math.max(1, pc.hp - loss); toast(`Impasse : tu te replies (−${loss} PV)`);
  if (cfg.canFlee === false) return loseCombat(false); finishCombat('flee');
}
// ── Affichage ──
function renderCombat() {
  const cfg = CB.cfg; const pc = G.pc; CB.prev = CB.prev || {}; const bars = [];
  const rows = h('div', { class: 'foechips duel' }, CB.foes.map((f, i) => {
    const bi = h('i', { style: `width:${(CB.prev[i] != null ? CB.prev[i] : 100)}%` }); const pct = Math.max(0, f.hp) / f.hpMax * 100; bars.push([bi, pct]); CB.prev[i] = pct;
    const it = INTENT[f.intent] || INTENT.stn;
    return h('div', { class: 'fchip' + (f.dead ? ' dead' : '') + (i === CB.tgt && !f.dead ? ' tgt' : ''), 'data-k': 'f' + i, onclick: () => { if (f.dead || CB.over) return; CB.tgt = i; sfx('click'); renderCombat(); } },
      foeIcon(f, 22) || '', h('div', { class: 'fcn' }, h('span', { class: 'fn' }, fname(f)), h('div', { class: 'bar hp mini' }, bi), f.dead ? null : h('span', { class: 'fint ' + (f.intent || '') }, it.ic + ' ' + it.w)));
  }));
  const st = [CB.shield ? `🛡 ${CB.shield}` : '', CB.dodge ? `💨 esquive ×${CB.dodge}` : '', CB.nextBonus ? `+${CB.nextBonus * 10} % prochaine carte` : '', CB.weak ? 'ennemis affaiblis' : '', CB.drone ? '🤖 drone' : '', CB.rage ? 'BÊTE FÉROCE' : ''].filter(Boolean).join(' · ');
  const pips = h('div', { class: 'rpips' }, Array.from({ length: CB.N }, (_, i) => { const x = CB.hist[i]; return h('span', { class: 'rp ' + (x === 'w' ? 'w' : x === 'l' ? 'l' : x === 'd' ? 'd' : i === CB.round - 1 ? 'cur' : '') }, x === 'w' ? '✔' : x === 'l' ? '✖' : x === 'd' ? '–' : i + 1); }));
  const rlog = h('div', { class: 'rlog' }, CB.log.slice(-3).map(l => h('div', { class: l.c }, l.t)));
  const t = target(); const hint = t ? h('div', { class: 'sit' }, `${fname(t)} ${(INTENT[t.intent] || INTENT.stn).n}.`) : null;
  const pops = CB.pops || []; CB.pops = []; const hurt = CB.hurt; CB.hurt = false;
  const hook = () => {
    requestAnimationFrame(() => setTimeout(() => bars.forEach(([b, w]) => { b.style.width = w + '%'; }), 80));
    setTimeout(() => {
      let dmgF = false, dmgP = false;
      pops.forEach((p, n) => { const host = document.querySelector(`.combat [data-k="${p.k}"]`); if (!host) return; if (p.cls === 'dmg' || p.cls === 'crit') { if (p.k === 'pc') dmgP = true; else dmgF = true; host.classList.add('hit'); }
        const el = h('span', { class: 'pop ' + p.cls, style: `animation-delay:${n * 140}ms` }, p.txt); host.append(el); setTimeout(() => el.remove(), 1500 + n * 140); });
      if (dmgF) { sfx('hit'); buzz(20); } if (dmgP || hurt) { setTimeout(() => { sfx('hurt'); shake(); flash('#ff2a6d'); }, 180); }
    }, 60);
  };
  show({ compact: true, after: hook, kicker: `AFFRONTEMENT · ROUND ${Math.min(CB.round, CB.N)}/${CB.N}`, title: cfg.title, text: [], extra: h('div', { class: 'combat' }, h('div', { class: 'chead', 'data-k': 'pc' }, pips), rows, st ? h('div', { class: 'small acc' }, st) : null, hint, rlog), choices: combatChoices(), tiles: true, tcls: 'hand' });
}
function combatChoices() {
  const pc = G.pc; const L = [];
  const TAG = { contre: '✔ CONTRE', 'sonné': '✔ OUVERTURE', 'échange': '≈ ÉCHANGE', 'bloqué': '✖ BLOQUÉ', 'risqué': '✖ RISQUÉ' };
  (CB.hand || []).forEach(card => { const [lab] = cardOutcome(card); const good = lab === 'contre' || lab === 'sonné';
    L.push(C(`${card.name}`, () => play(card), { ic: card.ic, sub: `${TAG[lab]} · ${CTYPE[card.type].n}${card.cost ? ' · ' + card.cost + '⚡' : ''}${['frappe', 'parade', 'feinte'].includes(card.id) ? '' : ' — ' + card.txt}`, cls: good ? 'safe' : (lab === 'risqué' || lab === 'bloqué') ? 'risk' : '' })); });
  if (!CB.rerolled && pc.en >= 1 && !CB.over) L.push(C('Rebattre la main (1⚡)', reroll, { ic: '↻', cls: 'back' }));
  if (CB.cfg.canFlee !== false) L.push(C('Fuir', flee, { odds: ['agilite', 11 + CB.foes.length + CB.tier * 2, ['mobility']], cls: 'back' }));
  else if (CB.cfg.lethal !== 'death') L.push(C('Se rendre', () => { clog('Tu poses les armes.'); loseCombat(true); }, { cls: 'back' }));
  return L;
}
