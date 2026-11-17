// ───────── Combat : situations narratives, élan et posture ─────────
const elanBonus = () => clamp(CB.mom || 0, 0, 2);
const stanceBonus = m => CB.stance === 'rusee' ? (m.attr === 'corps' ? -1 : 2) : (CB.stance === 'offensive' && m.attr === 'corps') ? 1 : 0;
function momUpdate(res, m) { const r = CB.lastR || {}; if (res === 'win') CB.mom = Math.min(6, (CB.mom || 0) + 1 + (r.crit ? 1 : 0)); else if (res === 'loss') CB.mom = 0; CB.lastR = null; }
function momEl() { const m = CB.mom || 0; const T = CB.thr; return h('div', { class: 'mom2' }, h('span', { class: 'pvc', style: `border-color:${T.col};color:${T.col}` }, T.label), m >= 1 ? h('span', { class: 'pvc streak' }, `🔥 série ×${m}${m >= 2 ? ' · pouvoir prêt' : ''}`) : null); }
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
function sitMoves() { return [attackMove(), protectMove(), powerMove()]; }
function attackMove() {
  const w = weaponOf(); const machine = aliveFoes().some(f => f.m) && hasCap('hack');
  if (machine) return { id: 'hack', ic: '💻', label: 'Pirater', sub: 'Neutralise la machine', attr: 'intellect', tags: ['hack'], cat: 'tac', bonus: 2, kind: 'hack' };
  return { id: 'strike', ic: '⚔', label: 'Attaquer', sub: w ? w.n : 'À mains nues', attr: primAttr(), tags: ['combat'], cat: 'atk', bonus: (w ? Math.floor(w.dmg / 3) : 0) + (hasRole('combattant') ? 1 : 0), kind: 'hit' };
}
function protectMove() {
  const pc = G.pc; const heal = ['nanosoin', 'kit', 'bandage'].find(id => hasItem(id));
  if (pc.hp < pc.hpMax * 0.45 && heal && !CB.noItems) return { id: 'item', ic: '💊', label: 'Se soigner', sub: ITEMS[heal].n + ' · round nul', kind: 'item', item: heal };
  const body = primAttr() === 'corps';
  return body ? { id: 'guard', ic: '🛡', label: 'Se protéger', sub: 'Dégâts −60 % si tu perds', attr: 'corps', tags: ['defense'], cat: 'tac', kind: 'guard' } : { id: 'feint', ic: '💨', label: 'Esquiver', sub: 'Dégâts −50 % si tu perds', attr: 'agilite', tags: ['mobility', 'stealth'], cat: 'feint', kind: 'feint' };
}
function powerMove() {
  const pc = G.pc; const ok = m => m && !m.lock && !(m.cost && pc.en < m.cost);
  if (pcPowers().length && pc.hp <= pc.hpMax * 0.4 && !CB.wasAwake) return { id: 'awaken', ic: '⚡', label: 'ÉVEIL', sub: 'Round gagné d’office · risqué', kind: 'awaken', cls: 'danger' };
  const fin = techMove(); fin.label = `Pouvoir : ${STYLES[pc.style].tech.name}`; fin.bonus = 3; fin.cat = 'atk'; fin.sub = `${cap(STYLES[pc.style].tech.text)} · ${STYLES[pc.style].tech.cost} énergie`;
  const ready = (CB.mom || 0) >= 2 || CB.round === CB.N; if (ok(fin) && ready) return fin;
  const sg = sigMove(); if (ok(sg)) { sg.label = sg.label.replace('Signature : ', 'Pouvoir : '); sg.sub = 'Round gagné d’office · ' + sg.cost + ' énergie'; return sg; }
  const off = offense(); if (off.id === 'power' && ok(off)) { off.label = 'Pouvoir : ' + powName('combat'); off.sub = '+3 au jet · ' + off.cost + ' énergie'; return off; }
  fin.lock = fin.lock || (ready ? 'Énergie insuffisante' : 'Gagne un round pour charger'); fin.sub = 'Pas encore prêt'; return fin;
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
