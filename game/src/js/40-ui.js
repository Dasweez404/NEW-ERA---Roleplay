// ───────── Interface ─────────
const UI = { tab: 'perso', scene: null, tabOpen: true };
const PCN = () => esc(G.pc.name);

// Conditions d'accès (choix verrouillés mais visibles)
function reqReason(rq) {
  if (!rq) return null;
  if (rq.ok) { const r = rq.ok(); if (r) return r; }
  if (!G) return null; const pc = G.pc;
  if (rq.money && pc.money < rq.money) return `Requiert ${fmt(rq.money)} ¢ (tu as ${fmt(pc.money)} ¢)`;
  if (rq.grade != null && pc.grade < rq.grade) return `Requiert le grade « ${gradeNames(pc)[rq.grade]} » (tu es « ${gradeName()} »)`;
  if (rq.maxGrade != null && pc.grade > rq.maxGrade) return 'Réservé aux grades inférieurs';
  if (rq.attr) for (const [a, n] of Object.entries(rq.attr)) if (A(a) < n) return `Requiert ${AT[a].short} ${n} (tu as ${A(a)})`;
  if (rq.cap && !hasCap(rq.cap)) return `Requiert une capacité « ${TAGNAME[rq.cap] || rq.cap} » (pouvoir, rôle ou équipement)`;
  if (rq.power && !pcPowers().length) return 'Requiert un pouvoir';
  if (rq.noPower && pcPowers().length) return 'Impossible avec un pouvoir';
  if (rq.role && !hasRole(rq.role)) return `Requiert le rôle « ${ROLES[rq.role].name} »`;
  if (rq.item && !hasItem(rq.item)) return `Requiert : ${ITEMS[rq.item].n}`;
  if (rq.rep) for (const [f, n] of Object.entries(rq.rep)) if ((pc.rep[f] || 0) < n) return `Requiert ${n} de réputation avec ${F[f].name} (tu as ${pc.rep[f] || 0})`;
  if (rq.stones != null && stoneCount() < rq.stones) return `Requiert ${rq.stones} pierre(s) antique(s)`;
  if (rq.faction) { const l = [].concat(rq.faction); if (!l.includes(pc.faction)) return `Réservé à : ${l.map(x => F[x].name).join(', ')}`; }
  if (rq.notFaction) { const l = [].concat(rq.notFaction); if (l.includes(pc.faction)) return `Impossible pour : ${F[pc.faction].name}`; }
  if (rq.style) { const l = [].concat(rq.style); if (!l.includes(pc.style)) return `Style de combat requis : ${l.map(x => STYLES[x].name).join(' / ')}`; }
  if (rq.party && pc.party.filter(a => a.inj <= 0).length < rq.party) return `Requiert ${rq.party} allié(s) en forme`;
  if (rq.flag && !pc.flags[rq.flag]) return rq.flagWhy || 'Condition narrative non remplie';
  if (rq.notFlag && pc.flags[rq.notFlag]) return 'Déjà fait';
  if (rq.heatMin != null && pc.heat < rq.heatMin) return 'Tu n’es pas assez recherché pour ça';
  if (rq.heatMax != null && pc.heat > rq.heatMax) return `Trop risqué : ta prime est trop élevée`;
  if (rq.ptype && ![].concat(rq.ptype).includes(pc.ptype)) return `Réservé aux pouvoirs : ${[].concat(rq.ptype).map(t => TYPENAME[t]).join(', ')}`;
  if (rq.leader && !isLeader()) return 'Réservé aux chefs de faction (grade 5)';
  return null;
}
// fabrique de choix
function C(label, go, o = {}) {
  const lock = reqReason(o.req);
  let sub = o.sub || '';
  if (o.odds && !lock) { const [a, dc, tags, ex] = o.odds; const p = odds(a, dc, tags || [], ex || 0); sub = `${AT[a].short} contre difficulté ${dc} — environ ${Math.round(p * 100)} % de réussite` + (sub ? ' · ' + sub : ''); }
  return { label, go, sub, cls: o.cls || (o.odds ? (odds(...[o.odds[0], o.odds[1], o.odds[2] || [], o.odds[3] || 0]) < .4 ? 'risk' : '') : ''), lock };
}
const fxHTML = L => L && L.length ? h('div', { class: 'fx' }, L.map(l => h('div', { class: l.c || '' }, l.t))) : null;

function show(sc) { if (G && G.status !== 'play' && !sc.final) return; UI.scene = sc; render(); window.scrollTo({ top: 0 }); }
function paragraphs(t) { return [].concat(t || []).map(x => typeof x === 'string' ? h('p', { html: x }) : x); }

function hudEl() {
  const pc = G.pc; const st = wantedStars(); const f = F[pc.faction];
  return h('div', { class: 'hud' },
    h('div', {}, h('div', { class: 'nm' }, pc.name, pc.ownFaction ? '' : ''), h('div', { class: 'sub' }, `${f.name} · ${gradeName()} ${'★'.repeat(pc.grade)}`)),
    h('div', { class: 'pill' }, '📍 ' + stateName(G.loc) + ' (' + capName(G.loc) + ')'),
    h('div', { class: 'pill' }, '🗓 ' + dateStr()),
    h('div', { class: 'pill' }, '💰 ' + fmt(pc.money) + ' ¢'),
    h('div', { class: 'pill', title: WANTED_TXT[st] }, st ? 'Prime ' + starStr(st) : 'Prime : aucune'),
    h('div', { class: 'pill' }, '💎 ' + stoneCount() + '/16'),
    h('div', { class: 'hudbars' },
      h('div', {}, `PV ${pc.hp}/${pc.hpMax}`, h('div', { class: 'bar hp' }, h('i', { style: `width:${pc.hp / pc.hpMax * 100}%` }))),
      h('div', {}, `Énergie ${pc.en}/${pc.enMax}`, h('div', { class: 'bar en' }, h('i', { style: `width:${pc.enMax ? pc.en / pc.enMax * 100 : 0}%` })))),
    h('div', { style: 'margin-left:auto' }, h('button', { class: 'btn alt', onclick: () => { saveGame(); toast('Partie sauvegardée.'); } }, '💾'), ' ', h('button', { class: 'btn alt', onclick: () => { if (confirm('Quitter vers le menu ? (la partie est sauvegardée)')) { saveGame(); titleScreen(); } } }, '☰')));
}
function toast(t) { const el = h('div', { style: 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#000;border:1px solid var(--acc);padding:8px 16px;border-radius:10px;z-index:99' }, t); document.body.append(el); setTimeout(() => el.remove(), 1600); }

function choicesEl(list) {
  return h('div', { class: 'choices' }, list.filter(Boolean).map(c => h('button', { class: 'ch ' + (c.cls || ''), disabled: !!c.lock, onclick: () => { if (!c.lock) c.go(); } },
    h('div', { class: 'l' }, c.label), c.sub ? h('div', { class: 's' }, c.sub) : null, c.lock ? h('div', { class: 'lockwhy' }, c.lock) : null)));
}

function render() {
  const app = $('#app'); app.innerHTML = '';
  const sc = UI.scene; if (!sc) return;
  if (sc.bare) { app.append(h('div', {}, sc.extra)); return; }
  const main = h('div', { class: 'card scene' },
    sc.kicker ? h('div', { class: 'kicker' }, sc.kicker) : null,
    h('div', { class: 'title' }, sc.title), paragraphs(sc.text), fxHTML(sc.fx), sc.extra || null, sc.choices ? choicesEl(sc.choices) : null);
  const live = G && G.status === 'play';
  if (live) app.append(hudEl());
  app.append(h('div', { class: 'layout' + (live ? '' : ' solo') }, main, live ? sideEl() : null));
}

// ───────── Panneau latéral ─────────
const TABS = [['perso', '🧍 Perso'], ['inv', '🎒 Sac'], ['groupe', '👥 Groupe'], ['factions', '🏴 Factions'], ['pierres', '💎 Pierres'], ['carte', '🗺 Carte'], ['journal', '📜 Journal'], ['aide', '❓ Règles']];
function sideEl() {
  const box = h('div', { class: 'card side' });
  box.append(h('div', { class: 'tabs' }, TABS.map(([k, n]) => h('button', { class: 'tab' + (UI.tab === k ? ' on' : ''), onclick: () => { UI.tab = k; render(); } }, n))));
  box.append(({ perso: tabPerso, inv: tabInv, groupe: tabGroupe, factions: tabFactions, pierres: tabPierres, carte: tabCarte, journal: tabJournal, aide: tabAide }[UI.tab])());
  return box;
}
function powerLine(p) { return h('div', {}, h('b', {}, p.name), ' ', h('span', { class: 'mut' }, `(${TYPENAME[p.type]} › ${p.cat}${p.sub && p.sub !== 'Éléments' ? ' › ' + p.sub : ''})`), h('div', {}, p.tags.map(t => h('span', { class: 'tag' }, TAGNAME[t] || t)))); }
function tabPerso() {
  const pc = G.pc; const box = h('div');
  box.append(h('div', { class: 'kv' }, h('b', {}, 'Origine'), `${stateName(pc.origin)} (${capName(pc.origin)})`, h('b', {}, 'Faction'), F[pc.faction].name, h('b', {}, 'Style'), `${STYLES[pc.style].name} — ${STYLES[pc.style].desc}`,
    h('b', {}, 'Âge'), `${pc.age} ans`, h('b', {}, 'Rôles'), pc.roles.length ? pc.roles.map(r => ROLES[r].name).join(', ') : 'aucun (à choisir au fil du temps)',
    h('b', {}, 'Identité'), pc.faction === 'fa' ? 'Officier de la F.A.' : (pc.ptype === 'zoologique' || pc.ptype === 'aucun') ? 'Identité civile possible' : 'Porteur fiché (pas d’identité civile complète)'));
  box.append(h('h3', {}, 'Pouvoir : ' + TYPENAME[pc.ptype]));
  if (!pcPowers().length) box.append(h('div', { class: 'mut' }, 'Aucun pouvoir : tu comptes sur ton équipement, tes techniques anti-geno et ta tête.'));
  pcPowers().forEach(p => box.append(powerLine(p)));
  if (pc.ptype !== 'aucun') box.append(h('div', { class: 'small mut', style: 'margin-top:4px' }, 'Faiblesse : ' + WEAK[pc.ptype === 'hybride' ? (PW[pc.powers[0]].type) : pc.ptype]));
  box.append(h('h3', {}, 'Attributs' + (pc.pts ? ` — ${pc.pts} point(s) à répartir` : '')));
  ATTRS.forEach(a => {
    const v = A(a.id); const pips = h('div', { class: 'pips' }); for (let i = 0; i < Math.min(v, 16); i++) pips.append(h('span', { class: 'pip on' }));
    box.append(h('div', { class: 'attr', title: a.desc }, h('div', { class: 'n' }, a.short), pips, h('b', {}, v), pc.pts > 0 && pc.attrs[a.id] < 12 ? h('button', { class: 'tab', onclick: () => { pc.attrs[a.id]++; pc.pts--; recalc(); render(); } }, '+') : null));
  });
  box.append(h('h3', {}, 'Progression'));
  const nxt = MERIT_STEPS[pc.grade + 1];
  box.append(h('div', { class: 'kv' }, h('b', {}, 'Grade'), `${gradeName()} (${pc.grade}/5)`, h('b', {}, 'Mérite'), nxt != null ? `${pc.merit} / ${nxt} pour le grade suivant` : `${pc.merit}`, h('b', {}, 'XP'), `${pc.xp}`, h('b', {}, 'Prime'), wantedStars() ? starStr(wantedStars()) + ' ' + WANTED_TXT[wantedStars()] : 'aucune', h('b', {}, 'Éveil'), pc.awakened ? `déjà éveillé ${pc.awakened} fois` : 'jamais éveillé'));
  if (pc.implant) box.append(h('div', { class: 'badc small' }, '⚠ Implant explosif actif — doit être remplacé par une prime avant le ' + dateStr(pc.implant.deadline)));
  return box;
}
function tabInv() {
  const pc = G.pc; const box = h('div');
  const eq = (slot, label) => h('div', {}, h('b', {}, label + ' : '), pc.eq[slot] ? ITEMS[pc.eq[slot]].n : h('span', { class: 'mut' }, 'aucun'));
  box.append(eq('arme', 'Arme'), eq('armure', 'Armure'));
  const ids = Object.keys(pc.inv);
  if (!ids.length) box.append(h('div', { class: 'mut', style: 'margin-top:8px' }, 'Sac vide.'));
  ids.forEach(id => {
    const it = ITEMS[id]; const row = h('div', { style: 'margin-top:8px;border-top:1px dashed var(--line);padding-top:6px' }, h('b', {}, it.n + (pc.inv[id] > 1 ? ' ×' + pc.inv[id] : '')), h('div', { class: 'small mut' }, it.desc));
    const btns = h('div', { class: 'row', style: 'margin-top:3px' });
    if (it.t === 'arme' || it.t === 'armure') { const slot = it.t === 'arme' ? 'arme' : 'armure'; btns.append(h('button', { class: 'tab', onclick: () => { pc.eq[slot] = pc.eq[slot] === id ? null : id; render(); } }, pc.eq[slot] === id ? 'Déséquiper' : 'Équiper')); }
    if (it.t === 'conso' && ['en8', 'hp15', 'hp40'].includes(it.use)) btns.append(h('button', { class: 'tab', onclick: () => { useItem(id); render(); } }, 'Utiliser'));
    row.append(btns); box.append(row);
  });
  return box;
}
function useItem(id) {
  const it = ITEMS[id]; const pc = G.pc; if (!takeItem(id)) return;
  if (it.use === 'en8') pc.en = Math.min(pc.enMax, pc.en + 8);
  if (it.use === 'hp15') pc.hp = Math.min(pc.hpMax, pc.hp + 15);
  if (it.use === 'hp40') { pc.hp = Math.min(pc.hpMax, pc.hp + 40); pc.party.forEach(a => { if (a.inj > 0) { a.inj = 0; a.hp = Math.ceil(a.hpMax / 2); } }); }
  if (it.use === 'stim') pc.stim = 1;
}
function tabGroupe() {
  const pc = G.pc; const box = h('div', {}, h('div', { class: 'small mut' }, `Groupe : ${pc.party.length}/${partyMax()} (le grade et le rôle de Leader augmentent la taille).`));
  if (!pc.party.length) box.append(h('div', { class: 'mut', style: 'margin-top:8px' }, 'Tu voyages seul. Recrute des gens dans le menu « Recruter ».'));
  pc.party.forEach(a => { const c = CH[a.id]; box.append(h('div', { style: 'margin-top:8px;border-top:1px dashed var(--line);padding-top:6px' }, h('b', {}, c.name), ` — ${F[c.faction].name}`, h('div', { class: 'small' }, `${STYLES[a.style].name} · PV ${a.hp}/${a.hpMax} · loyauté ${a.loy}${a.inj > 0 ? ' · blessé (' + a.inj + ' sem.)' : ''}`),
    h('div', { class: 'small mut' }, charPowerText(c)), h('button', { class: 'tab', onclick: () => { if (confirm('Renvoyer ' + c.name + ' ?')) { removeAlly(a.id); addRep(c.faction, -3); render(); } } }, 'Renvoyer'))); });
  return box;
}
function charPowerText(c) { const ps = (c.powers.length ? c.powers : fallbackPowers(c)).map(id => PW[id].name); return ps.length ? ps.join(' + ') : 'sans pouvoir'; }
function tabFactions() {
  const pc = G.pc; const box = h('div', {}, h('div', { class: 'small mut' }, 'Trahir une faction braque ses alliés contre toi.'));
  const ids = Object.keys(F).filter(f => f !== 'civils').sort((a, b) => (pc.rep[b] || 0) - (pc.rep[a] || 0));
  const t = h('table', { class: 't' }); ids.forEach(fid => { const v = pc.rep[fid] || 0; t.append(h('tr', {}, h('td', {}, F[fid].name + (fid === pc.faction ? ' ★' : '')), h('td', { class: v >= 15 ? 'good' : v <= -20 ? 'badc' : 'mut' }, repLevel(v)), h('td', {}, v))); });
  box.append(t); return box;
}
function tabPierres() {
  const box = h('div'); const g = h('div', { class: 'stones' });
  DATA.stones.forEach(s => g.append(h('div', { class: 'stone' + (G.pc.stones[s.id] ? ' have' : ''), style: `background:${s.color};color:${s.color}`, title: `${s.order}. ${s.name}` }, h('span', { style: 'color:#000;mix-blend-mode:normal' }, s.order))));
  box.append(g, h('div', { class: 'small mut', style: 'margin:6px 0' }, `${stoneCount()}/16. Les 16 pierres réunies = victoire immédiate.`));
  DATA.stones.forEach(s => {
    const have = !!G.pc.stones[s.id]; const known = have || G.world.stoneClue[s.id];
    const hold = G.world.stoneHolder[s.id];
    const where = have ? 'Tu la possèdes.' : known ? `${hold === 'temple' ? 'Cachée dans un temple' : hold === 'pnj-levant' ? 'Détenue par un descendant du peuple du feu' : 'Détenue par ' + (F[hold] ? F[hold].name : hold)} — ${stateName(G.world.stoneLoc[s.id])}` : 'Localisation inconnue (enquête nécessaire).';
    box.append(h('div', { style: 'margin-top:6px' }, h('b', { style: `color:${s.color}` }, `${s.order}. Pierre de ${s.name}`), ` · Royaume ${s.ruler}`, h('div', { class: 'small mut' }, where)));
    if (have) box.append(h('div', { class: 'glyph small' }, s.glyph, h('div', { class: 'mut' }, 'Anciens détenteurs : ' + s.holders), h('div', { class: 'mut' }, 'Lecture des héros : ' + s.heroes)));
  });
  return box;
}
function tabJournal() {
  const box = h('div'); box.append(h('h3', {}, 'Quêtes et objectifs')); box.append(questList());
  box.append(h('h3', {}, 'Actualités du monde'));
  const n = h('div', { class: 'news scroll', style: 'max-height:220px' }); G.world.news.slice(0, 12).forEach(x => n.append(h('div', {}, h('span', { class: 'mut' }, dateStr(x.wk) + ' — '), x.t)));
  if (!G.world.news.length) n.append(h('div', { class: 'mut' }, 'Rien à signaler.')); box.append(n);
  box.append(h('h3', {}, 'Ton journal')); const j = h('div', { class: 'news scroll', style: 'max-height:240px' }); G.log.slice(-25).reverse().forEach(x => j.append(h('div', {}, h('span', { class: 'mut' }, dateStr(x.wk) + ' — '), x.t))); box.append(j); return box;
}
function questList() {
  const pc = G.pc; const W = G.world; const d = h('div', { class: 'small' }); const li = (t, c) => d.append(h('div', { class: c || '', style: 'padding:2px 0' }, '• ' + t));
  li(`<principale> Réunir les 16 pierres antiques : ${stoneCount()}/16.`.replace('<principale>', 'Quête principale :'), 'acc');
  const known = DATA.stones.filter(s => !pc.stones[s.id] && W.stoneClue[s.id]); known.slice(0, 5).forEach(s => li(`   Piste — pierre de ${s.name} : ${holderName(W.stoneHolder[s.id])}, ${stateName(W.stoneLoc[s.id])}.`, 'mut'));
  if (!known.length && stoneCount() < 16) li('   Aucune piste connue : mène l’enquête ou tends l’oreille (rumeurs, fouilles).', 'mut');
  if (pc.faction !== 'civils') { const nx = MERIT_STEPS[pc.grade + 1]; if (pc.grade < 5) li(`Faction : ${F[pc.faction].name} — mérite ${pc.merit}${nx ? '/' + nx : ''} pour le grade « ${gradeNames(pc)[pc.grade + 1]} »${nx && pc.merit >= nx && pc.grade < 4 ? ' (épreuve disponible !)' : ''}${pc.grade === 4 ? ' — prétends à la tête (menu Ta faction)' : ''}.`); }
  else li('Rejoins une faction (menu Ta faction) pour progresser en grade.');
  if (pc.implant) li(`Implant explosif : livre une prime avant le ${dateStr(pc.implant.deadline)} (ou fais-le retirer).`, 'badc');
  if (pc.flags.cap) li('Tu es captif : évade-toi, négocie ou accepte ton sort.', 'badc');
  const ter = DATA.states.filter(s => W.terr[s.id] === 'pc').length; if (ter) li(`Territoires contrôlés : ${ter}.`);
  if (typeof canonOffers === 'function') canonOffers().forEach(c => li('Événement canon ici : ' + c.title, 'acc'));
  return d;
}
function tabAide() {
  return h('div', { class: 'small', html: `<h3>Règles rapides</h3>
<p><b>But :</b> obtenir le plus gros score. Victoire immédiate avec les <b>16 pierres antiques</b>. Tu peux aussi <b>prendre ta retraite</b> (bonus de score) — mourir divise ton score.</p>
<p><b>Jets :</b> d20 + attribut + bonus (pouvoir, rôle, style, équipement, alliés) contre une difficulté. Le pourcentage est affiché.</p>
<p><b>Grade :</b> 1 à 5 ★ (5 = chef de faction). Plus tu montes, plus tu es recherché (<b>prime</b> ⭐ à ⭐⭐⭐⭐), plus tu es puissant. Recrue : aucune voix dans les décisions.</p>
<p><b>Prime :</b> ⭐ pays · ⭐⭐ État · ⭐⭐⭐ continent · ⭐⭐⭐⭐ monde. Les captifs peuvent être interrogés, emprisonnés, vendus, exécutés — ou devenir Fallen.</p>
<p><b>Pouvoirs :</b> alimentés par l’énergie (batterie). Sans énergie, la surcharge fait mal. L’Éveil (bouton en combat) est puissant mais risqué.</p>
<p><b>Orbitrail :</b> 13 lignes. Chaque voyage est suivi par les autorités : faux papiers et brouilleurs aident.</p>
<p><b>Réputation :</b> aider une faction plaît à ses alliés, la trahir braque ses alliés.</p>
<p class="mut">Choix verrouillés = visibles : argent, attribut, grade, rôle, lien ou pouvoir manquant.</p>` });
}

// ───────── Carte de l'Orbitrail (SVG) ─────────
function mapEl(o = {}) {
  const NS = 'http://www.w3.org/2000/svg'; const el = (t, a, ...k) => { const e = document.createElementNS(NS, t); for (const x in a) e.setAttribute(x, a[x]); k.flat().forEach(c => e.append(c.nodeType ? c : document.createTextNode(c))); return e; };
  const svg = el('svg', { viewBox: '0 0 2000 975', class: 'map' });
  const pt = x => typeof x === 'string' ? (x.startsWith('@') ? x.slice(1).split('|').slice(1).map(Number) : [OT_ST[x][0], OT_ST[x][1]]) : x;
  for (const [ln, L] of Object.entries(OT_LINES)) L.p.forEach(path => {
    const pts = path.map(pt).map(p => p.join(',')).join(' ');
    svg.append(el('polyline', { points: pts, fill: 'none', stroke: L.c, 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    path.forEach(x => { if (typeof x === 'string' && x.startsWith('@')) { const [n, px, py] = x.slice(1).split('|'); svg.append(el('circle', { cx: px, cy: py, r: 9, fill: '#fff', stroke: '#000', 'stroke-width': 4 }), el('text', { x: +px - 14, y: +py - 16 }, n)); } });
  });
  for (const [id, v] of Object.entries(OT_ST)) {
    const [x, y, name, state, stub, dx, dy] = v; const here = o.here === state; const go = o.pick && o.pick.has(state);
    const g = el('g', { class: 'st' + (go ? ' go' : '') });
    if (stub) g.append(el('rect', { x: x - 3, y: y - 12, width: 6, height: 24, fill: '#111' })); else g.append(el('circle', { cx: x, cy: y, r: 12, fill: here ? '#ffd23f' : go ? '#bff5d0' : '#fff', stroke: '#000', 'stroke-width': 5 }));
    if (here) g.append(el('circle', { cx: x, cy: y, r: 22, fill: 'none', stroke: '#ff3d6e', 'stroke-width': 4 }));
    g.append(el('text', { x: x + dx, y: y + dy }, name));
    if (go) { g.addEventListener('click', () => o.onPick(state)); g.append(el('circle', { cx: x, cy: y, r: 20, fill: 'transparent' })); }
    svg.append(g);
  }
  return svg;
}
function tabCarte() {
  const box = h('div'); box.append(mapEl({ here: G.loc }), h('div', { class: 'small mut' }, 'Carte de l’Orbitrail (13 lignes). Tu es à ' + capName(G.loc) + '. Les traversées du Pacifique relient Toronto↔Tokyo (ligne 1) et Lima↔Nouméa (ligne 3).'));
  const legend = h('div', { class: 'row small', style: 'margin-top:6px' }); Object.entries(OT_LINES).forEach(([n, L]) => legend.append(h('span', {}, h('span', { style: `display:inline-block;width:14px;height:8px;background:${L.c};border:1px solid #000;margin-right:3px` }), n))); box.append(legend);
  return box;
}
