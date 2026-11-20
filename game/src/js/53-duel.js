// ───────── Combat V3 : 3 à 5 rounds, 3 choix simples selon ta catégorie de style, un % affiché ─────────
// Chaque étape : tu choisis une décision parmi quelques options (tirées selon ton style, ton rôle, ta classe de pouvoir). Un dé contre un pourcentage décide.
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
const hitBonus = () => (CB.rageLeft > 0 ? 4 : 0) + (CB.swarm > 0 ? 2 : 0) + (CB.hitBuff || 0) + PK('pierce') + Math.floor(PK('dmg') / 2) + (CB.rage ? 3 : 0) + (CB.boost > 1 ? 2 : 0);
// Difficulté d'un round : suit le niveau des ennemis (la courbe douce du jeu est appliquée par check())
const roundDc = () => { const a = aliveFoes(); const t = a.length ? a.reduce((s, f) => s + (f.tier || 1), 0) / a.length : 1; return Math.round(19 + 2.5 * t + 1.1 * (CB.foes.length - 1) + Math.min(6, Math.max(0, pcPower() - 4.5) * 1.1)) - (CB.hexLeft > 0 ? 4 : 0); };
const lead = () => CB.W - CB.Lz; // l'avance : positive = tu prends le dessus
const pwMax = () => Math.floor(((CB.T || 3) + 1) / 3) + (pcPowers().some(p => pxLevel(p.id) >= 3) ? 1 : 0); // pouvoir : 1 round sur 3, 2 sur 5
const needW = () => CB.T || 3; // avance à prendre pour l'emporter (la durée varie : on ne compte plus de rounds)

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

// ── Confrontations : pas de système de combat, seulement des DÉCISIONS. Tes attributs en jugent ; ton pouvoir, ta classe et ton rôle ouvrent des options. ──
const CAT_DESC = {
  'Offensif': 'Tes décisions de front sont plus sûres (+2). Ton pouvoir, ta classe de pouvoir et ton rôle ouvrent des options en plus.',
  'Défensif': 'Tenir sa position est plus sûr (+2) et te protège. Ton pouvoir, ta classe de pouvoir et ton rôle ouvrent des options en plus.',
  'Technique': 'Lire la situation est plus sûr (+2). Ton pouvoir, ta classe de pouvoir et ton rôle ouvrent des options en plus.',
  'Soutien': 'Intimider, négocier ou rallier est plus sûr (+2). Ton pouvoir, ta classe de pouvoir et ton rôle ouvrent des options en plus.',
};
const MODES = { combat: 'AFFRONTEMENT', embuscade: 'EMBUSCADE', guerre: 'GUERRE' };
function confMode(cfg) { if (cfg.mode) return cfg.mode; const t = `${cfg.title || ''} ${cfg.intro || ''}`; if (/embuscade|guet-apens|piège|surgi/i.test(t)) return 'embuscade'; if (/assaut|escarmouche|guerre|territoire|siège|bataille|raid|offensive/i.test(t)) return 'guerre'; return 'combat'; }
const DEC = {
  combat: { front: ['Attaquer de front', 'Tu fonces sur {f}', 'Ton assaut fait plier {f}.', '{f} encaisse et te repousse.'], flank: ['Contourner et frapper', 'Prendre à revers', 'Tu les prends à revers.', 'Ils anticipent ton mouvement.'], tactic: ['Viser la faille', 'Observer, puis frapper juste', 'Tu repères le point faible et tu frappes juste.', 'Ton analyse arrive trop tard.'], talk: ['Intimider ou négocier', 'Faire douter {f}', 'Ton aplomb fait hésiter {f}.', '{f} ne se laisse pas impressionner.'], hold: ['Tenir sa position', 'Encaisser et reprendre la main', 'Tu encaisses et tu reprends la main.', 'Tu cèdes du terrain.'] },
  embuscade: { front: ['Riposter tout de suite', 'Retourner le piège', 'Tu retournes l’embuscade contre eux.', 'Tu es pris sous le feu.'], flank: ['Se jeter à couvert', 'Trouver un abri et un angle', 'Tu trouves un abri et un angle de tir.', 'Pas d’abri : tu es à découvert.'], tactic: ['Repérer l’issue', 'Chercher la brèche', 'Une brèche dans leur dispositif !', 'Tu ne vois aucune sortie.'], talk: ['Crier, bluffer', 'Faire croire à des renforts', 'Ils croient à un renfort : ils reculent.', 'Le bluff ne prend pas.'], hold: ['Faire bloc', 'Serrer les rangs', 'Tu tiens le choc.', 'Tu es submergé.'] },
  guerre: { front: ['Charger la ligne', 'Briser leur front', 'Votre charge rompt leur ligne.', 'La charge s’enlise.'], flank: ['Manœuvre de flanc', 'Déborder sur le côté', 'Vous enfoncez leur flanc.', 'Le flanc était couvert.'], tactic: ['Lire le champ de bataille', 'Anticiper leur plan', 'Tu devines leur plan et tu le contres.', 'Le front est trop confus.'], talk: ['Rallier les tiens', 'Galvaniser les troupes', 'Les rangs se resserrent derrière toi.', 'Personne n’entend dans le vacarme.'], hold: ['Tenir la ligne', 'Ne pas reculer d’un pas', 'La ligne tient.', 'La ligne plie.'] },
};
const PHASE = {
  combat: ['{f} et les siens se déploient devant toi. Comment ouvres-tu ?', 'L’affrontement s’engage. {f} cherche une ouverture.', 'La tension monte : tout peut basculer.', 'Dernier échange, tout se joue maintenant.', 'Ils faiblissent, mais il reste de quoi te surprendre.'],
  embuscade: ['Des silhouettes surgissent : {f} et les siens t’attendaient.', 'Le piège se referme. Il faut réagir vite.', 'Tu gagnes quelques secondes. Que fais-tu ?', 'Leur dispositif se disloque peu à peu.', 'Une dernière décision pour sortir de là.'],
  guerre: ['Le front s’étend devant toi : {f} mène leur ligne.', 'Les lignes se heurtent, la mêlée gronde.', 'Un tournant s’annonce sur le champ de bataille.', 'Les réserves entrent en jeu.', 'L’issue de la bataille se joue ici.'],
};
const fillF = t => String(t || '').replace(/\{f\}/g, () => { const f = CB && aliveFoes()[0] ? fname(aliveFoes()[0]) : 'l’adversaire'; return f; });
function primAttr() { const a = STYLES[G.pc.style].prim; return a === 'maitrise' ? 'corps' : a; }
// Les cinq décisions de base : chacune est jugée par un attribut
const BASE = [
  { id: 'front', ic: '⚔', attr: 'corps', tags: ['combat'], bonus: 1, sev: 1.0, grp: 'Offensif' },
  { id: 'flank', ic: '🌀', attr: 'agilite', tags: ['mobility', 'stealth'], bonus: 0, sev: 0.6, dodge: 0.25, style: 'flanker' },
  { id: 'tactic', ic: '🧠', attr: 'intellect', tags: ['scout', 'tech'], bonus: 1, sev: 0.9, weak: 1, grp: 'Technique' },
  { id: 'talk', ic: '🗣', attr: 'charisme', tags: ['social'], bonus: 0, sev: 0.7, weak: 2, grp: 'Soutien' },
  { id: 'hold', ic: '🛡', attr: 'corps', tags: ['defense'], bonus: 0, sev: 0.35, shield: 5, grp: 'Défensif' },
];
// Options propres à un rôle : [libellé, attribut, étiquettes, effet de famille, texte de réussite]
const ROLE_ACT = {
  eclaireur: ['Repérer la faille', 'agilite', ['scout'], 'reveal', 'Tu repères tout ce qui se cache.'], combattant: ['Technique de combat', 'corps', ['combat'], 'ambush', 'Ton savoir-faire fait la différence.'],
  artilleur: ['Tir de couverture', 'agilite', ['ranged'], 'ambush', 'Ton tir cloue tout le monde sur place.'], leader: ['Ordre de groupe', 'charisme', ['social', 'ally'], 'swarm', 'Les tiens suivent ton ordre sans hésiter.'],
  medecin: ['Soigner sous le feu', 'intellect', ['heal'], 'regen', 'Tu soignes sans lâcher la situation.'], ingenieur: ['Piège improvisé', 'intellect', ['tech'], 'hex', 'Un piège improvisé les désoriente.'],
  costumier: ['Leurre et déguisement', 'charisme', ['disguise'], 'hex', 'Ils poursuivent la mauvaise silhouette.'], hacker: ['Pirater leurs systèmes', 'intellect', ['hack'], 'stun', 'Leurs systèmes tombent en panne.'],
  gardien: ['Former un rempart', 'corps', ['defense'], 'guard', 'Tu fais un rempart de ton corps.'], logisticien: ['Mobiliser le matériel', 'intellect', ['logi'], 'lucky', 'Le bon outil au bon moment.'],
  infiltre: ['Disparaître puis frapper', 'agilite', ['stealth'], 'ambush', 'Tu disparais, et frappes là où ils ne regardent pas.'], pilote: ['Manœuvre de véhicule', 'agilite', ['mobility'], 'rewind', 'Une manœuvre impossible : tu changes la donne.'],
  diplomate: ['Négocier la reddition', 'charisme', ['social'], 'mirror', 'Ils baissent la garde, le temps d’une trêve.'], dompteur: ['Calmer les bêtes et les foules', 'maitrise', ['control'], 'gravity', 'Tout le monde ralentit autour de toi.'],
  strategiste: ['Plan tactique', 'intellect', ['strat'], 'reveal', 'Ton plan se déroule sans accroc.'],
};
// Options propres à la classe de pouvoir
const CLASS_ACT = { zoologique: ['Instinct animal', 'agilite', ['scout', 'mobility'], 'Ton instinct te guide mieux qu’aucune réflexion.'], surnaturel: ['Libérer ton pouvoir', 'maitrise', ['control', 'combat'], 'Ton pouvoir se déchaîne.'], elementaire: ['Façonner l’élément', 'maitrise', ['control', 'defense'], 'L’élément t’obéit.'], hybride: ['Forme hybride', 'corps', ['combat', 'mobility'], 'Ta forme hybride dépasse leurs attentes.'] };
const bestAttr = () => ATTRS.reduce((b, a) => A(a.id) > A(b) ? a.id : b, 'corps');
// Tirage des décisions de base : trois sur cinq, selon ton style, jamais les mêmes d'un tour à l'autre
function dealHand() {
  const pc = G.pc; const grp = STYLES[pc.style].grp; const mode = (CB && CB.mode) || 'combat'; const last = (CB && CB.hand) ? CB.hand.map(c => c.id) : [];
  const pool = BASE.map(b => Object.assign({ w: (b.grp === grp || b.style === pc.style) ? 3 : 1.4 }, b)); const hand = [];
  for (let k = 0; k < 3; k++) { const cand = pool.filter(c => !hand.some(h => h.id === c.id) && !(last.includes(c.id) && Math.random() < 0.7)); const c = wpick(cand.length ? cand : pool.filter(c => !hand.some(h => h.id === c.id)), x => x.w); const d = DEC[mode][c.id]; const fav = (c.grp === grp || c.style === pc.style) ? 2 : 0;
    hand.push(Object.assign({}, c, { label: d[0], sub: d[1], okT: d[2], koT: d[3], bonus: c.bonus + fav, cat: 'mv', favs: fav })); }
  if (CB) CB.hand = hand; return hand;
}
// Options spéciales : rôle, classe de pouvoir (jamais plus de trois)
function specialOptions() {
  const pc = G.pc; const out = []; const mode = (CB && CB.mode) || 'combat';
  const roles = shuffle(pc.roles.filter(r => ROLE_ACT[r])).slice(0, 2);
  roles.forEach(r => { const [lab, attr, tags, fam, okT] = ROLE_ACT[r]; out.push({ id: 'role_' + r, ic: ROLE_IC[r] || '🎭', label: lab, sub: `Rôle : ${ROLES[r].name}`, attr, tags: [...tags, ROLES[r].tag], bonus: 3, sev: 0.7, cat: 'mv', kind: 'hit', okT, koT: 'Ton idée ne suffit pas, cette fois.', fam, role: true, cls: 'safe' }); });
  const ca = pc.ptype && CLASS_ACT[pc.ptype]; if (ca && pc.en >= 2) out.push({ id: 'class', ic: pc.ptype === 'zoologique' ? '🐾' : pc.ptype === 'elementaire' ? '🌊' : pc.ptype === 'hybride' ? '🧬' : '✨', label: ca[0], sub: `Pouvoir ${TYPENAME[pc.ptype].toLowerCase()} · 2⚡`, attr: ca[1], tags: ca[2], bonus: 3, sev: 1.0, cost: 2, cat: 'mv', kind: 'hit', okT: ca[3], koT: 'Ton pouvoir t’échappe un instant.', cls: 'safe' });
  return out.slice(0, 3);
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
function moves() { const hand = (CB && CB.hand) || dealHand(); const base = hand.map(m => Object.assign({ kind: 'hit' }, m)); const sp = specialOptions().map(m => Object.assign({ kind: 'hit' }, m)); return [...base, ...sp, powerMove()]; }
function oddsOf(m) { if (!m.attr) return null; return [m.attr, roundDc(), m.tags, hitBonus() + (m.bonus || 0) + (CB.nextBonus || 0) + intentBonus(m)]; }


// ── Lancement ──
function roundsFor2(cfg, foes, gap) { return cfg.rounds || 9; } // plafond de sécurité seulement : la confrontation s'arrête quand l'avance est prise ou perdue
function startCombat(cfg) {
  if (cfg.foes.length > 4) cfg.foes = cfg.foes.slice(0, 4);
  scaleFoes(cfg); dedupeFoes(cfg.foes);
  CB = { cfg, foes: cfg.foes, N: 4, round: 1, W: 0, Lz: 0, hist: [], log: [], pops: [], tier: Math.max(...cfg.foes.map(f => f.tier || Math.round(f.atk / 2))), dodge: PK('dodge'), shield: PK('shield'), lb: !!PK('lastbreath'), hitBuff: 0, boost: 1, rage: false, noItems: false, wasAwake: false, nextBonus: 0, weak: 0, sig: {}, tgt: 0 };
  CB.foes.forEach(f => { f.dead = false; f.stun = 0; f.hp = f.hpMax; });
  CB.mode = confMode(cfg); if (CB.mode === 'embuscade' && !cfg.buff && !cfg.noAmbushMalus) { CB.nextBonus -= 2; clog('Pris par surprise : −2 à ta première décision.', 'log-dmg'); }
  if (cfg.buff) { CB.hitBuff += cfg.buff; clog(`Tu connais ses coups : +${cfg.buff} à tous tes jets.`, 'good'); }
  CB.thr = threat(); CB.N = roundsFor2(cfg, CB.foes, CB.thr.gap); CB.T = clamp(2 + (CB.foes.length >= 3 ? 1 : 0) + (CB.thr.gap >= 1 ? 1 : 0), 2, 4); CB.Lmax = 3;
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
  CB.auto = true; let g = 0; clog('⚡ Victoire quasi certaine : les décisions se prennent d’elles-mêmes.', 'good');
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
  const chips = h('div', { class: 'pvchips' }, h('span', { class: 'pvc', style: `border-color:${T.col};color:${T.col}` }, T.label), h('span', { class: 'pvc' }, `${CB.T} d’avance à prendre`));
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
    if (r.ok) { res = 'win'; if (m.kind === 'tech') techEffect(); if (m.kind === 'awaken') awaken(); if (m.weak) CB.weak = m.weak; if (m.shield) { CB.shield += m.shield; } if (m.fam) abilityApply({ fam: m.fam, mag: 1, pid: null, name: m.label, power: m.sub }, 'ton rôle'); if (m.en) pc.en = Math.min(pc.enMax, pc.en + m.en); if (crit) { CB.nextBonus += 2; clog('Coup remarquable : +2 au prochain jet.', 'good'); } }
    else { res = 'loss'; if (r.fumble) sev *= 1.5; if (m.dodge && chance(m.dodge)) { res = 'draw'; sev = 0; clog('Tu esquives tout !', 'good'); pop('pc', 'ESQUIVE', 'ok'); } else if (m.kind === 'awaken') clog('L’Éveil ne vient pas.', 'log-miss'); if (PK('thorns') && chance(Math.min(0.6, PK('thorns') * 0.12))) { res = 'draw'; sev = 0.3; clog('Ta riposte contrebalance : round nul.', 'good'); } }
  }
  if (res === 'win' && hasAnti('shock') && !CB.shockUsed) { CB.shockUsed = true; CB.nextBonus += 2; clog('Onde de choc : +2 au prochain jet.', 'good'); }
  if (res === 'win') { CB.W++; vfx(r && r.crit ? 'CRITIQUE !' : 'ROUND GAGNÉ', 'good'); sfx('hit'); clog(m.okT ? fillF(m.okT) : pick(['Tu prends l’avantage.', 'Ta décision fait mouche.', 'Ils reculent d’un pas.']), 'good'); if (PK('weaken') && !CB.weakDone) { CB.weakDone = true; aliveFoes().forEach(x => { x.dmg = Math.max(1, x.dmg - PK('weaken') * 2); }); clog('Tes ennemis faiblissent.', 'warnc'); } if (PK('stun') && chance(PK('stun') / 100)) { CB.nextBonus += 2; clog('Sidérés, ils vacillent : +2 au prochain round.', 'warnc'); } if (PK('drain')) { const g = Math.min(PK('drain') * 2, pc.hpMax - pc.hp); if (g > 0) { pc.hp += g; clog(`Absorption : +${g} PV.`, 'good'); } } }
  else if (res === 'loss') { CB.Lz++; vfx('ROUND PERDU', 'bad'); clog(m.koT ? fillF(m.koT) : pick(['Ils lisent ton geste et ripostent.', 'Ta décision échoue.', 'Tu perds le rythme.']), 'log-miss'); }
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
  if (lead() <= -CB.Lmax) return conclude();
  if (lead() >= CB.T) return conclude();
  if (CB.round > CB.N) return conclude();
  renderCombat();
}
// Les ennemis tombent au fil des rounds gagnés
function syncFoes() {
  const prog = Math.min(1, Math.max(0, lead()) / needW()); const n = CB.foes.length;
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
  if (G.pc.hp <= 0) return loseCombat(false); if (lead() <= -CB.Lmax || CB.round > CB.N) return conclude(); renderCombat();
}
function sweepAway() { G.pc.hp = Math.max(1, G.pc.hp - Math.round(G.pc.hpMax * 0.05)); CB.foes.forEach(f => { f.dead = true; f.hp = 0; }); CB.over = true; CB.bilan = '💨 Ils ne font pas le poids'; finishCombat('win'); }
function conclude() {
  const { W, Lz } = CB; const cfg = CB.cfg; const pc = G.pc; CB.over = true; const hist = CB.hist.map(x => x === 'w' ? '✔' : x === 'l' ? '✖' : '–').join(' '); const ld = W - Lz;
  const fate = cfg.lethal === 'death' ? 'tué' : cfg.lethal === 'capture' ? 'capturé' : 'hors de combat';
  if (ld <= -CB.Lmax) { toast(`${hist} · Défaite`); return loseCombat(false); }
  if (ld >= CB.T) { CB.foes.forEach(f => { f.dead = true; f.hp = 0; }); CB.bilan = `${hist} · adversaire ${fate}`; return finishCombat('win'); }
  if (ld > 0) { CB.partial = true; CB.bilan = `${hist} · il s’enfuit, blessé`; return finishCombat('win'); }
  let txt = ld === 0 ? 'impasse, chacun se replie' : 'tu es blessé, tu te replies'; if (ld < 0) { const loss = Math.round(pc.hpMax * 0.12); pc.hp = Math.max(1, pc.hp - loss); txt += ` (−${loss} PV)`; }
  toast(`${hist} · ${txt}`);
  if (cfg.canFlee === false) return loseCombat(false); finishCombat('flee');
}
// ── Affichage : une situation, des décisions ──
function foesStrip() {
  const fs = CB.foes.map(f => { const sp = foeIcon(f, 44); return h('div', { class: 'fchip' + (f.dead ? ' dead' : ''), 'data-k': 'f' + CB.foes.indexOf(f) }, sp || '', h('div', { class: 'fcn' }, h('span', { class: 'fn' }, fname(f)), f.cid && CH[f.cid] ? h('span', { class: 'fst' }, '★'.repeat(Math.min(5, CH[f.cid].stars || 0)) || '·') : null)); });
  return h('div', { class: 'foechips' }, fs);
}
function intentChip() { const it = intentOf(); if (!it || CB.over) return null; return h('div', { class: 'intent' }, h('span', { class: 'iic' }, it.ic), h('div', {}, h('b', {}, CB.intent.ab ? `${fname(CB.intent.foe)} : ${FAMS[CB.intent.ab.fam].ic} ${CB.intent.ab.name} (${CB.intent.ab.power})` : 'Ce qui se prépare : ' + it.n), h('div', { class: 'small mut' }, it.tip))); }
function renderCombat() {
  if (CB && CB.auto) return; const cfg = CB.cfg; const mode = CB.mode || 'combat'; const need = needW();
  const T = CB.T, Lm = CB.Lmax, ld = Math.max(-Lm, Math.min(T, lead()));
  const dots = h('div', { class: 'tens' }, h('span', { class: 'tl' }, '😣'), ...Array.from({ length: T + Lm + 1 }, (_, i) => { const v = i - Lm; return h('i', { class: 'ts ' + (v === ld ? 'cur' : v < 0 ? 'neg' : v > 0 ? 'pos' : 'mid') + (v === 0 ? ' zero' : '') }); }), h('span', { class: 'tl' }, '😎'));
  const sit = fillF((PHASE[mode] || PHASE.combat)[Math.min(CB.round - 1, 4)]);
  const st = [CB.shield ? `🛡 ${CB.shield}` : '', CB.dodge ? `💨 esquive ×${CB.dodge}` : '', CB.nextBonus ? `${CB.nextBonus > 0 ? '+' : ''}${CB.nextBonus} prochain jet` : '', CB.weak ? 'ennemis affaiblis' : ''].filter(Boolean).join(' · ');
  const goal = h('div', { class: 'small mut' }, `Prends ${T} d’avance pour l’emporter · tu cèdes à −${Lm} · ${CB.W} réussie${CB.W > 1 ? 's' : ''}, ${CB.Lz} manquée${CB.Lz > 1 ? 's' : ''}`);
  const rlog = h('div', { class: 'rlog' }, CB.log.slice(-2).map(l => h('div', { class: l.c }, l.t)));
  show({ compact: true, kkind: mode, kicker: `${MODES[mode]} · DÉCISION ${CB.round}`, title: cfg.title, text: [sit], extra: h('div', { class: 'combat' }, foesStrip(), dots, intentChip(), goal, st ? h('div', { class: 'small acc' }, st) : null, rlog), choices: combatChoices(), tiles: true, tcls: 'hand' });
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
