// ───────── Le fil de l'histoire : une carte, deux ou trois choix, un dé, la suite (style Destiny Eleven) ─────────
function hub() {
  if (G.status !== 'play') return;
  const pc = G.pc, fl = pc.flags; UI.parked = null; saveGame(); recalc(); announceFeats();
  if (fl.cap) return capturedMenu();
  let pend = pendingEvents(); if (pend) return pend();
  if (pc.pts > 0) return spendPoints();
  const st = fl.stage || 'contrats';
  if (st === 'contrats') return contractCard();
  if (st === 'ville') return cityMenu();
  if (fl.stoneStep) { fl.stoneStep = false; const sq = stoneQuestHere(); if (sq) return stoneQuestCard(sq); }
  if (G.fresh) G.fresh = false;
  else { advance(1); if (G.status !== 'play') return; if (fl.cap) return capturedMenu(); pend = pendingEvents(); if (pend) return pend(); if (pc.pts > 0) return spendPoints(); }
  if ((fl.storyLeft == null ? 3 : fl.storyLeft) <= 0) return enterCity();
  fl.storyLeft = (fl.storyLeft == null ? 3 : fl.storyLeft) - 1;
  coach('trame'); dealCard();
}
// Niveau gagné : on dépense le point tout de suite, devant toi.
const ATTR_LOOK = { corps: ['💪', '#ff6a3d'], agilite: ['⚡', '#5be3a0'], intellect: ['🧠', '#27f0ff'], charisme: ['🎭', '#ff3d7f'], maitrise: ['✦', '#b026ff'] };
function spendPoints(cont) {
  const pc = G.pc; if (pc.pts <= 0) return cont ? cont() : hub();
  const total = pc.pts; let done = false;
  const gems = h('div', { class: 'lvgems' }); const head = h('div', { class: 'lvhead' }, h('div', { class: 'lvk' }, 'NIVEAU SUPÉRIEUR'), h('div', { class: 'lvn' }, h('span', { class: 'lvplus' }, '+'), h('span', { class: 'lvnum' }, String(pc.pts))), h('div', { class: 'lvsub' }, 'points à répartir'), gems);
  const drawGems = () => { gems.innerHTML = ''; for (let i = 0; i < total; i++) gems.append(h('i', { class: 'lvgem' + (i < pc.pts ? ' on' : '') })); head.querySelector('.lvnum').textContent = String(pc.pts); };
  const cards = h('div', { class: 'lvcards' }, ATTRS.map((a, idx) => {
    const [ic, col] = ATTR_LOOK[a.id] || ['◆', '#fcee09']; const pips = h('div', { class: 'lvpips' }); const val = h('b', { class: 'lvval' });
    const draw = (pop) => { pips.innerHTML = ''; const v = A(a.id); for (let i = 0; i < 12; i++) pips.append(h('i', { class: 'lvp' + (i < v ? ' on' : '') + (pop && i === v - 1 ? ' pop' : '') + (i === v && pc.pts > 0 && v < 12 ? ' nx' : '') })); val.textContent = String(v); };
    const card = h('button', { class: 'lvcard', style: `--c:${col};--d:${idx * 70}ms`, onclick: () => {
      if (done || pc.pts <= 0 || pc.attrs[a.id] >= 12) return; pc.attrs[a.id]++; pc.pts--; recalc(); sfx('win'); buzz(18); draw(true); drawGems(); burstAt(card, col, 26); card.classList.remove('hit'); void card.offsetWidth; card.classList.add('hit');
      cards.querySelectorAll('.lvcard').forEach(c => c.classList.toggle('dim', pc.pts <= 0));
      if (pc.pts <= 0) { done = true; head.classList.add('fin'); head.querySelector('.lvsub').textContent = 'Parfait. Ton personnage progresse.'; flash('#fcee09'); sfx('crit'); setTimeout(() => { cont ? cont() : hub(); }, 1100); }
    } }, h('span', { class: 'lvic' }, ic), h('span', { class: 'lvmid' }, h('span', { class: 'lvname' }, a.name), h('span', { class: 'lvdesc' }, a.desc), pips), val, h('span', { class: 'lvplusb' }, '＋'));
    draw(false); return card;
  }));
  drawGems(); sfx('crit'); burst(innerWidth / 2, 160, '#fcee09', 36);
  show({ noLevel: true, compact: true, bare: false, kicker: '', title: '', text: [], extra: h('div', { class: 'lvl' }, head, cards), choices: [] });
}
function dealCard() {
  const pc = G.pc, W = G.world; let pool = [];
  const promo = promoOffer(); if (promo && chance(0.7)) { promo.feed = true; return missionApproach(promo); }
  pool.push({ w: 34, f: missionCard });
  if (pc.roles.length) pool.push({ w: 10, f: () => { const r = pick(pc.roles); const o = genOffer(pc.faction !== 'civils' ? pc.faction : 'civils', rint(Math.max(1, tiersForGrade()[0]), tiersForGrade()[1]), { arch: pick(ROLE_ARCH[r]) }); o.roleOffer = r; o.feed = true; missionApproach(o); } });
  if (stoneCount() < 16 && G.wk >= 6) pool.push({ w: 9, f: clueCard });
  const co = canonOffers(); if (co.length) pool.push({ w: 50, f: () => co[0].go() });
  if (pc.hp < pc.hpMax * 0.5) pool.push({ w: 80, f: restCard });
  pool.push({ w: 26, f: () => { const ev = randomHubEvent(true); if (ev) ev(); else missionCard(); } });
  pool.push({ w: 9, f: townCard }); pool.push({ w: 8, f: travelCard }); pool.push({ w: 5, f: vehicleCard });
  if (pc.grade >= 1 && pc.faction !== 'civils') pool.push({ w: 8, f: () => EVENT_FN.council() });
  if (pc.faction === 'civils') pool.push({ w: 14, f: joinCard });
  if (pc.implant) pool.push({ w: 25, f: fallenContract });
  conflictPool(pool); pool.push({ w: 16, f: deedCard }); lot1Pool(pool); lot2Pool(pool);
  if (pc.flags.stage === 'story') pool = pool.filter(e => ![missionCard, townCard, travelCard, vehicleCard].includes(e.f));
  const e = wpick(pool, x => x.w); e.f();
}
function missionCard() { if (G.pc.flags.stage === 'story') return deedCard(); contractCard(); }
// Les contrats font partie du fil : on arrive, on choisit un contrat (ou on file), puis l'intrigue continue.
function contractCard(arrive) {
  const pc = G.pc; if (!pc.flags.stage || pc.flags.stage === 'contrats') { pc.flags.stage = 'story'; pc.flags.storyLeft = 3; pc.flags.stoneStep = !!stoneQuestHere(); G.fresh = false; } const offers = getBoard().slice(); const L = []; const cp = feat('rep') ? cityPerk() : { offers: 0 }; const nShow = Math.max(1, 3 + cp.offers);
  if (pc.implant) L.push(C('🔥 Contrat de chasseur Fallen (sauve ton implant)', fallenContract, { cls: 'danger', sub: `Avant le ${dateStr(pc.implant.deadline)} ou ça explose.` }));
  const promo = offers.filter(o => o.promo), rest = shuffle(offers.filter(o => !o.promo));
  [...promo, ...rest].slice(0, nShow).forEach(o => { const a = ARCH[o.arch]; L.push(C(`${o.promo ? '🎖 ÉPREUVE DE GRADE — ' : ''}${a.n}`, () => missionBrief(o), { sub: `${o.empName} contre ${o.tgtName} · ${stars(o.tier)} · ${o.pay} ¢ · ${o.weeks} sem.${o.merit ? ' · +' + o.merit + ' mérite' : ''}`, ic: '🎯', cls: o.promo ? 'risk' : '' })); });
  if (offers.length > nShow) L.push(C('Voir tous les contrats', missionBoard, { ic: '📋', cls: 'back' }));
  L.push(C('Poursuivre l’intrigue', hub, { cls: 'cta', ic: '▶', sub: 'Laisser les contrats : la suite des événements arrive.' }));
  coach('contrats'); show({ arriveBanner: !!arrive, kicker: capName(G.loc).toUpperCase() + ' · CONTRATS', title: arrive ? `Arrivée à ${capName(G.loc)}` : 'Des contrats à prendre', text: [arrive || 'Des contrats à prendre ici.', cityLine()].filter(Boolean), choices: L });
}
function stoneCard(s) {
  const hold = G.world.stoneHolder[s.id];
  show({ kicker: 'PIERRE ANTIQUE', title: `La pierre de ${s.name} est ici`, text: [`Elle est ${hold === 'temple' ? 'cachée dans un temple oublié' : 'aux mains de ' + esc(holderName(hold))}, tout près de toi. Royaume ${esc(s.ruler)} — ${esc(s.spec)}.`], choices: [C('Tenter de la récupérer', () => stoneAttempt(s.id), { ic: '💎', cls: 'risk' }), C('Pas maintenant', hub, { cls: 'back' })] });
}
function leadCard(s) {
  const loc = G.world.stoneLoc[s.id]; const r = otRoute(G.loc, loc); const cost = r ? r.cost : 0;
  show({ kicker: 'PISTE', title: `La pierre de ${s.name}`, text: [`Ta piste te mène à <b>${esc(capName(loc))}</b> (${esc(stateName(loc))}) : ${esc(holderName(G.world.stoneHolder[s.id]))}.`], choices: [C(`Prendre l’Orbitrail (${cost} ¢)`, () => travelConfirm(loc), { ic: '🚆', req: { money: cost } }), C('Pas maintenant', hub, { cls: 'back' })] });
}
function clueCard() {
  const dc = 14 + Math.min(4, stoneCount());
  show({ kicker: 'RUMEUR', title: 'Un indice sur les pierres', text: ['Un vieux conteur, une archive piratée, une fresque effacée… quelque chose parle des seize pierres muta.'], choices: [C('Creuser la piste', () => { const r = check('intellect', dc, ['scout', 'relic'], PK('clue')); advance(1); if (G.status !== 'play') return; const l = r.ok ? stoneClueGain() : null; show({ kicker: 'PIERRES ANTIQUES', title: r.ok ? 'Une piste !' : 'Fausse piste', text: [r.ok ? (l ? esc(cap(l)) : 'Tu sais déjà tout ce qu’il y a à savoir.') : 'Rien de concluant, cette fois.'], fx: r.ok ? fx({ xp: 15 }) : [], choices: [C('Continuer', hub)] }); }, { odds: ['intellect', dc, ['scout', 'relic']], ic: '🔍' }), C('Laisser tomber', hub, { cls: 'back' })] });
}
function restCard() {
  show({ kicker: 'ÉTAT', title: 'Tu tiens à peine debout', text: ['Les blessures s’accumulent. Un faux pas de plus et ça tourne mal.'], choices: [C('Dormir une semaine', () => doRest(1), { ic: '🛏', cls: 'safe' }), C('Se faire soigner (80 ¢)', () => doRest(2, 80), { ic: '💊', req: { money: 80 } }), C('Continuer quand même', () => dealCard(), { cls: 'risk' })] });
}
function townCard() {
  show({ kicker: capName(G.loc).toUpperCase(), title: 'Un moment de répit', text: ['Entre deux coups durs, la ville offre ses boutiques, ses visages et ses salles d’entraînement.'], choices: [C('Faire le tour des marchés', () => shopMenu(false), { ic: '🛒' }), C('Chercher des recrues', recruitMenu, { ic: '🤝' }), C('S’entraîner', trainMenu, { ic: '🎓' }), C('Passer son chemin', hub, { cls: 'back' })] });
}
function travelCard() {
  const arcs = (G.world.arcs || []).filter(a => a.state !== G.loc); const nb = neighbors(G.loc); if (!nb.length && !arcs.length) return missionCard(); const to = arcs.length && chance(0.6) ? pick(arcs).state : pick(nb); const r = otRoute(G.loc, to);
  show({ kicker: 'ORBITRAIL', title: `Un train pour ${capName(to)}`, text: [`Un contact te souffle qu’il se passe quelque chose du côté de <b>${esc(capName(to))}</b> (${esc(stateName(to))}).`], choices: [C(`Monter à bord (${r.cost} ¢)`, () => travelConfirm(to), { ic: '🚆', req: { money: r.cost } }), C('Rester ici', hub, { cls: 'back' })] });
}
function joinCard() {
  const pc = G.pc; const ids = Object.keys(F).filter(k => !['civils', 'fallen', 'noir', 'own', 'omega'].includes(k) && !(k === 'fa' && pc.ptype !== 'aucun') && (pc.rep[k] || 0) > -20);
  if (!ids.length) return missionCard();
  const fid = pick(ids); const f = F[fid]; const dc = (f.secret ? 19 : 14) - Math.floor((pc.rep[fid] || 0) / 10);
  show({ kicker: f.name.toUpperCase(), title: 'On t’a remarqué', text: [`Quelqu’un de <b>${esc(f.name)}</b> t’aborde : « ${esc(f.goal)} Ça t’intéresse ? »`], choices: [C(`Les rejoindre`, () => joinFaction(fid, dc), { odds: ['charisme', dc, ['social']], ic: '🏴' }), C('Décliner', hub, { cls: 'back' })] });
}
