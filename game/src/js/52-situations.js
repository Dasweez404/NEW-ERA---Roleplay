// ───────── Combat : situations narratives, élan et posture ─────────
const elanBonus = () => clamp(Math.trunc((CB.mom || 0) / 2), -2, 3);
const stanceBonus = m => CB.stance === 'rusee' ? (m.attr === 'corps' ? -1 : 2) : (CB.stance === 'offensive' && m.attr === 'corps') ? 1 : 0;
function momUpdate(res, m) {
  const r = CB.lastR || {}; let d = 0;
  if (res === 'win') { d = 2 + (r.crit ? 1 : 0) + (CB.stance === 'offensive' ? 1 : 0) + (m && m.kind === 'gamble' ? 1 : 0) + (m && m.kind === 'rally' ? 1 : 0); }
  else if (res === 'loss') { d = -(CB.stance === 'prudente' ? 1 : 2) - (r.fumble ? 1 : 0); }
  CB.mom = clamp((CB.mom || 0) + d, -6, 6); CB.lastR = null;
  if (d) clog(`Élan ${d > 0 ? '+' : ''}${d} → ${CB.mom > 0 ? '+' : ''}${CB.mom}`, d > 0 ? 'good' : 'log-miss');
}
function momEl() {
  const m = CB.mom || 0; const cells = []; for (let i = -6; i <= 6; i++) cells.push(h('i', { class: 'mc' + (i === 0 ? ' z' : '') + (i === m ? ' on' : '') + (i > 0 && i <= m ? ' p' : '') + (i < 0 && i >= m ? ' n' : '') }));
  return h('div', { class: 'mom' }, h('span', { class: 'ml' }, 'Élan'), h('div', { class: 'mb' }, cells), h('span', { class: 'mv' }, `${m > 0 ? '+' : ''}${m}`), h('span', { class: 'ms small mut' }, m >= 3 ? 'Finisseur prêt' : ''));
}
const OPT = (label, attr, tags, kind, cat, ic, sub, extra) => Object.assign({ id: label, ic, label, sub: sub || '', attr, tags, kind, cat: cat || 'atk' }, extra || {});
const noPower = () => !pcPowers().length;
const SITS = {
  choc: { n: 'Le choc', t: f => `${f} se jette sur toi. Tout se joue sur ta première réaction.`, o: () => [OPT('Tenir et frapper de front', 'corps', ['combat'], 'hit', 'atk', '⚔', 'Force pure', { bonus: weaponOf() ? Math.floor(weaponOf().dmg / 3) : 0 }), OPT('Esquiver et contre-attaquer', 'agilite', ['mobility', 'stealth'], 'feint', 'feint', '💨', 'Si tu perds, tu encaisses moitié moins'), OPT('L’impressionner', 'charisme', ['social'], 'intim', 'tac', '🗣', 'Réussi : leurs ripostes faiblissent'), OPT('Ton pouvoir de combat', 'maitrise', ['combat'], 'hit', 'atk', '✦', '2 énergie · +2 au jet', { cost: 2, bonus: 2, lock: noPower() ? 'Requiert un pouvoir' : null })] },
  garde: { n: 'La garde', t: f => `${f} se couvre, méthodique. Il faut trouver la faille.`, o: () => [OPT('Percer la garde', 'corps', ['combat'], 'hit', 'atk', '⚔', 'Force pure'), OPT('Feinter pour l’ouvrir', 'agilite', ['mobility'], 'feint', 'feint', '💨', 'Si tu perds, tu encaisses moitié moins'), OPT('Provoquer l’erreur', 'charisme', ['social'], 'intim', 'tac', '🗣', 'Réussi : leurs ripostes faiblissent'), OPT('Viser la faille', 'intellect', ['scout'], 'hit', 'atk', '🎯', 'Précision')] },
  blindage: { n: 'Le blindage', t: f => `${f} est une machine. Sa carapace encaisse tout ce qui est brut.`, o: () => [OPT('Pirater ses systèmes', 'intellect', ['hack'], 'hack', 'tac', '💻', 'Neutralise la machine', { bonus: 2, lock: hasCap('hack') ? null : 'Requiert un moyen de pirater' }), OPT('Surcharger son circuit', 'intellect', ['tech'], 'hit', 'atk', '⚡', 'Bricolage'), OPT('Forcer le blindage', 'corps', ['combat'], 'hit', 'atk', '⚔', 'Force brute', { bonus: -1 }), OPT('Ton pouvoir de combat', 'maitrise', ['combat'], 'hit', 'atk', '✦', '2 énergie · +2 au jet', { cost: 2, bonus: 2, lock: noPower() ? 'Requiert un pouvoir' : null })] },
  charge: { n: 'La charge', t: f => `${f} charge, féroce et imprévisible.`, o: () => [OPT('Esquiver la charge', 'agilite', ['mobility'], 'feint', 'feint', '💨', 'Si tu perds, tu encaisses moitié moins'), OPT('Tenir bon', 'corps', ['defense'], 'guard', 'tac', '🛡', 'Encaisser et durer : +2 énergie'), OPT('La dompter du regard', 'charisme', ['social'], 'intim', 'tac', '🗣', 'Réussi : leurs ripostes faiblissent'), OPT('Ton pouvoir de combat', 'maitrise', ['combat'], 'hit', 'atk', '✦', '2 énergie · +2 au jet', { cost: 2, bonus: 2, lock: noPower() ? 'Requiert un pouvoir' : null })] },
  nombre: { n: 'Le nombre', t: () => 'Ils sont plusieurs : il faut diviser pour mieux régner.', o: () => [OPT('Isoler le plus faible', 'agilite', ['stealth', 'mobility'], 'hit', 'atk', '🎯', 'Une cible à la fois'), OPT('Les entraver', 'maitrise', ['control'], 'bind', 'tac', '🕸', 'Prochain round +2', { cost: 2, lock: (!Object.keys(powerTags()).includes('control')) ? 'Requiert un pouvoir de contrôle' : null }), OPT('Tenir la ligne', 'corps', ['defense'], 'guard', 'tac', '🛡', 'Encaisser et durer : +2 énergie'), OPT('Galvaniser tes alliés', 'charisme', ['social', 'ally'], 'rally', 'tac', '📣', 'Réussi : +1 élan', { lock: G.pc.party.length ? null : 'Tu n’as pas d’allié' })] },
  breche: { n: 'La brèche', t: f => `Une ouverture se dessine chez ${f}. Elle ne durera pas.`, o: () => [OPT('Frapper dans l’ouverture', primAttr(), ['combat'], 'hit', 'atk', '⚔', 'Ton attribut principal', { bonus: 2 }), OPT('Plan malin', 'intellect', ['scout', 'strat'], 'hit', 'atk', '🧠', 'Précision'), OPT('Pari risqué', 'agilite', ['mobility'], 'gamble', 'feint', '🎲', '+3 au jet, mais une défaite coûte 50 % de plus', { bonus: 3 })] },
  final: { n: 'L’instant décisif', t: f => `${f} vacille. Un dernier effort pour conclure.`, o: () => [OPT('Coup de grâce', primAttr(), ['combat'], 'hit', 'atk', '⚔', 'Ton attribut principal', { bonus: 1 }), OPT('Tout donner', 'corps', ['combat'], 'gamble', 'atk', '🎲', '+3 au jet, mais une défaite coûte 50 % de plus', { bonus: 3 }), OPT('Un dernier regard', 'charisme', ['social'], 'intim', 'tac', '🗣', 'L’adversaire s’effondre mentalement')] }
};
const BEASTS = new Set(['bete', 'harpie', 'griffon', 'chimere', 'cerbere', 'hydre', 'gorgone', 'sirene', 'centaure']);
function pickSit() {
  const alive = aliveFoes(); const used = CB.usedSit; let id;
  if (CB.round === 1) id = 'choc'; else if (CB.round === CB.N) id = 'final';
  else { const c = []; if (alive.some(f => f.m)) c.push('blindage', 'blindage'); if (alive.some(f => BEASTS.has(f.tid))) c.push('charge', 'charge'); if (alive.length >= 2) c.push('nombre'); c.push('breche', 'garde'); const left = c.filter(x => !used.includes(x)); id = pick(left.length ? left : c); }
  used.push(id); return id;
}
function currentSit() {
  if (!CB.sit || CB.sit.round !== CB.round) { const id = pickSit(); CB.sit = { id, round: CB.round }; }
  const d = SITS[CB.sit.id]; const f = firstFoe(); return { id: CB.sit.id, n: d.n, t: d.t(f ? fname(f) : 'l’ennemi'), o: d.o };
}
function sitMoves() {
  const pc = G.pc; const sit = currentSit(); const L = sit.o().map(m => m); const heal = ['nanosoin', 'kit', 'bandage'].find(id => hasItem(id));
  const fin = techMove(); fin.label = `Finisseur : ${STYLES[pc.style].tech.name}`; fin.sub += ' · élan +3 requis'; if (!(CB.mom >= 3 || CB.round === CB.N)) fin.lock = fin.lock || 'Élan insuffisant (+3 requis)'; fin.bonus = 3; fin.cat = 'atk'; L.push(fin);
  const sg = sigMove(); if (sg) L.push(sg);
  if (pc.hp < pc.hpMax * 0.55 && heal && !CB.noItems) L.push({ id: 'item', ic: '💊', label: `Se soigner (${ITEMS[heal].n})`, sub: ITEMS[heal].desc + ' · round nul', kind: 'item', item: heal });
  else if (pc.hp < pc.hpMax * 0.6 && Object.keys(powerTags()).includes('heal') && pc.en >= POWER_FX.heal.cost) L.push({ id: 'heal', ic: '💚', label: `${powName('heal')} : te régénérer`, sub: `${POWER_FX.heal.cost} énergie · soigne ~25 % · round nul`, kind: 'heal', cost: POWER_FX.heal.cost });
  if (pcPowers().length && pc.hp <= pc.hpMax * 0.4 && !CB.wasAwake) L.push({ id: 'awaken', ic: '⚡', label: 'ÉVEIL', sub: (pc.ptype === 'zoologique' ? 'Bête féroce incontrôlable' : pc.ptype === 'elementaire' ? 'Demi-dieu' : pc.ptype === 'hybride' ? 'Éveil partiel' : 'Capacités au maximum') + ' · round gagné d’office', kind: 'awaken', cls: 'danger' });
  return L;
}
// ── Préparation : choisir sa posture avant de commencer ──
function renderPlan() {
  const foes = CB.foes; const hints = []; if (foes.some(f => f.m)) hints.push('Des machines : piratage et surcharge seront décisifs.'); if (foes.some(f => BEASTS.has(f.tid))) hints.push('Des bêtes : esquive et regard comptent plus que la force.'); if (foes.length >= 2) hints.push('Plusieurs ennemis : isoler ou entraver aide beaucoup.'); if (!hints.length) hints.push('Des adversaires humains : feinte et provocation font la différence.');
  const L = [C('Offensive', () => begin('offensive'), { ic: '⚔', sub: 'Gagner un round te donne +1 d’élan en plus, +1 en force. Une défaite coûte 40 % de plus.' }), C('Équilibrée', () => begin('equilibre'), { ic: '⚖', cls: 'safe', sub: 'Aucun bonus ni malus.' }), C('Prudente', () => begin('prudente'), { ic: '🛡', sub: 'Une défaite coûte 40 % de moins et fait perdre 1 d’élan au lieu de 2.' }), C('Rusée', () => begin('rusee'), { ic: '🎭', sub: '+2 aux jets d’agilité, d’intellect et de charisme, −1 en force.' })];
  show({ compact: true, kicker: 'PRÉPARATION', title: `${CB.cfg.title || 'Un affrontement'} · ${CB.N} rounds`, text: [hints.join(' '), '<span class="mut">Chaque round est une situation différente. L’<b>élan</b> monte quand tu gagnes (+1 aux jets par 2 points) et débloque ton Finisseur à +3.</span>'], choices: L });
}

// La méthode de combat vient de ton rôle et de ta catégorie : plus de choix à faire avant chaque combat.
const STANCE_NAME = { offensive: 'Offensive', equilibre: 'Équilibrée', prudente: 'Prudente', rusee: 'Rusée' };
function autoStance() {
  const pc = G.pc; const byRole = { combattant: 'offensive', artilleur: 'offensive', gardien: 'prudente', medecin: 'prudente', logisticien: 'equilibre', leader: 'equilibre', eclaireur: 'rusee', hacker: 'rusee', costumier: 'rusee', ingenieur: 'rusee', strategiste: 'rusee' };
  const byStyle = { brawler: 'offensive', performer: 'offensive', juggernaut: 'prudente', protector: 'prudente', flanker: 'rusee', ranger: 'rusee', engineer: 'rusee', assist: 'equilibre' };
  const r = (pc.roles || []).find(x => byRole[x]); return r ? byRole[r] : (byStyle[pc.style] || 'equilibre');
}
const stanceLine = () => { const pc = G.pc; const r = (pc.roles || []).find(x => ROLES[x]); return `Ta méthode : <b>${STANCE_NAME[autoStance()]}</b> (${STYLES[pc.style].name}${r ? ' · ' + ROLES[r].name : ''})`; };
