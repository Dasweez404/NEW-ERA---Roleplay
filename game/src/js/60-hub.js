// ───────── Hub : menu principal du tour, voyage, repos, marché, recrutement, rôles, retraite ─────────
function hubText() {
  const pc = G.pc; const st = S[G.loc]; const t = [];
  const era = G.world.era === 'newera' ? ' Le Nouveau Régime est tombé : le monde se reconstruit.' : G.wk >= 40 && G.world.era === 'dark' ? ' Néo règne dans l’ombre : la traque redouble.' : '';
  t.push(`Tu es à <b>${esc(capName(G.loc))}</b>, capitale de <b>${esc(st.name)}</b> (${esc(st.countries)}). Population : ${st.pop}.${era}`);
  const zone = ZSHORT(DATA.stateZone[G.loc]); if (zone) t.push(`<span class="mut">Zone de la Force d’Autorité : ${esc(zone)} · Contrôle : ${esc(F[G.world.terr[G.loc]] ? F[G.world.terr[G.loc]].name : G.world.terr[G.loc])}.</span>`);
  const here = npcsHere(); if (here.length) t.push(`<span class="mut">Visages connus dans les parages : ${here.slice(0, 5).map(c => esc(c.name) + ' (' + esc(F[c.faction].name) + ')').join(', ')}.</span>`);
  if (typeof feat === 'function' && feat('ville')) { const ce = cityEventNow().ev; t.push(`<span class="mut">Ce soir à ${esc(capName(G.loc))} : ${esc(ce.k)}.</span>`); }
  const n = G.world.news[0]; if (n && G.wk - n.wk < 8) t.push(`<span class="acc">📰 ${esc(n.t)}</span>`);
  if (pc.hp < pc.hpMax * 0.5) t.push('<span class="warnc">Tu es blessé : pense à te reposer.</span>');
  if (pc.pts > 0) t.push(`<span class="acc">Tu as ${pc.pts} point(s) d’attribut à répartir (onglet Perso).</span>`);
  return t;
}
function npcsHere() { return DATA.chars.filter(c => { const n = G.world.npc[c.id]; return n.alive && n.st === 'free' && n.loc === G.loc && c.faction !== 'civils'; }); }

// Le menu éclair n'existe plus : « actionsMenu » ramène à la scène en cours (ou à la ville).
function parkOpen(fn) { if (CB) return toast('Pas pendant un combat'); if (!UI.parked) UI.parked = UI.scene; closeSheet(); fn(); }
function resumeScene() { const s = UI.parked; UI.parked = null; if (s) { UI.scene = s; render(true); return; } if (G.pc.flags.stage === 'ville') return cityMenu(); hub(); }
function actionsMenu() { resumeScene(); }
function enterCity() { const f = G.pc.flags; f.stage = 'ville'; const b = (typeof isBaseHere === 'function' && isBaseHere() ? 1 : 0) + (typeof atelierHere === 'function' && atelierHere() ? 1 : 0); f.cityActs = 1; cityMenu(); }
function cityMenu() {
  const pc = G.pc, f = pc.flags; f.stage = 'ville'; if (f.cityActs == null) f.cityActs = 1; const left = f.cityActs; const L = [];
  if (left <= 0) { if (!f.recapDone && f.snap) { f.recapDone = true; return recapCard(); } return travelMenu(); }
  if (left > 0) {
    const T = []; baseTile(T); atelierTile(T);
    T.push(C('Se reposer', restMenu, { ic: '🛏', sub: 'Soigner, recharger, se faire oublier.' }));
    T.push(C('Marché', () => shopMenu(), { ic: '🛒', sub: 'Armes, armures, gadgets, soins.' }));
    T.push(C('Recruter', recruitMenu, { ic: '🤝', sub: `Groupe : ${pc.party.length}/${partyMax()}` }));
    T.push(C('S’entraîner', trainMenu, { ic: '🎓', sub: 'Expérience, rôles, formation anti-geno.' }));
    const hpR = pc.hp / pc.hpMax, light = !weaponOf() || !armorOf();
    const rec = hpR < 0.6 || pc.en < pc.enMax * 0.3 ? 'Se reposer' : (pc.money >= 250 && light) ? 'Marché' : (pc.party.length < Math.min(2, partyMax()) && pc.money >= 300) ? 'Recruter' : 'S’entraîner';
    T.forEach(c => { if (c.label === rec) { c.sub = '★ Conseillé · ' + (c.sub || ''); c.cls = ((c.cls || '') + ' safe').trim(); } });
    T.forEach(c => { const g = c.go; c.go = () => { f.cityActs--; g(); }; }); L.push(...T);
  }
  coach('ville'); show({ kicker: 'EN VILLE · ' + capName(G.loc).toUpperCase(), title: 'Une action ici, puis tu repars', text: [(typeof feat === 'function' && feat('rep')) ? `<span class="mut">${esc(zoneOf())} · ${cityLabel(cityRep())}${cityPerk().txt ? ' · ' + cityPerk().txt : ''}</span>` : ''].filter(Boolean), choices: L, tiles: true });
}
function pendingEvents() {
  // événements en attente (ex. conseil de faction, menace sur pierre) posés par monthTick
  const q = G.pc.flags.queue; if (q && q.length) { const e = q.shift(); if (!q.length) delete G.pc.flags.queue; const fn = EVENT_FN[e.id]; if (fn) { fn(e.arg); return () => { }; } }
  return null;
}
const EVENT_FN = {};

// ───────── Voyager ─────────
function travelMenu(pre) {
  const here = G.loc; const ids = DATA.states.map(s => s.id).filter(i => i !== here); let sel = null; let box; const reco = recoStates(); const freeSet = new Set(neighbors(here).filter(n => !closureOf(n)));
  const info = h('div', { class: 'travelinfo' }, h('div', { class: 'mut' }, 'Touche une destination, puis touche-la encore pour partir.'));
  const ownerName = to => { const o = G.world.terr[to]; return o === 'pc' ? 'ta faction' : F[o] ? F[o].name : (o || '—'); };
  const select = to => {
    const cl = closureOf(to); if (cl) { sel = to; sfx('click'); info.innerHTML = ''; info.append(h('div', { class: 'tvrow' }, h('b', { class: 'tvd' }, capName(to)), h('span', { class: 'tvm badc' }, cl.kind === 'lockdown' ? 'Ville confinée' : 'Station fermée')), h('div', { class: 'leadwhy' }, closureLine(cl)), h('div', { class: 'mut small' }, (cl.kind === 'lockdown' ? 'Aucun train ni véhicule ne peut y entrer' : 'Plus aucune rame ne s’y arrête ; un véhicule peut encore t’y conduire') + ` — jusqu’à la semaine ${cl.until}.`)); return; }
    let r = otRoute(here, to); if (!r) return; if (freeSet.has(to)) r = Object.assign({}, r, { cost: 0 }); const weeks = 1 + Math.floor((r.hops - 1) / 4);
    if (sel === to) { if (G.pc.money < r.cost) { toast('Pas assez de crédits (' + r.cost + ' ¢)'); return; } return travelGo(to, r, weeks); }
    sel = to; sfx('click'); box.setRoute(r); const poor = G.pc.money < r.cost;
    info.innerHTML = ''; info.append(...[
      leadMap().has(to) ? h('div', { class: 'leadwhy' }, LEAD_KINDS[leadMap().get(to).kind].ic + ' ' + leadTitle(leadMap().get(to))) : null,
      h('div', { class: 'tvrow' }, h('b', { class: 'tvd' }, `${capName(here)} → ${capName(to)}`), h('span', { class: 'tvm' }, h('span', { class: poor ? 'badc' : 'acc' }, r.cost ? `${r.cost} ¢` : 'Gratuit'), ` · ${weeks} sem.`)),
      h('div', { class: 'tvchips' }, h('span', { class: 'pvc' }, `${r.hops} arrêt${r.hops > 1 ? 's' : ''}`), h('span', { class: 'pvc' }, '🏴 ' + ownerName(to)), h('span', { class: 'pvc' }, `contrôle ${Math.round(detectChance() * 100)} %${pc_hasFaux() ? ' ✔ faux papiers' : ''}`), r.legs.length > 1 ? h('span', { class: 'pvc' }, `${r.legs.length - 1} corresp.`) : null, reco.has(to) ? h('span', { class: 'pvc rec' }, '★ ' + reco.get(to)[0]) : null, leadMap().has(to) ? h('span', { class: 'pvc lead' }, '🔴 ' + LEAD_KINDS[leadMap().get(to).kind].d) : null),
      h('div', { class: poor ? 'badc' : 'acc small' }, poor ? 'Pas assez de crédits' : `▶ Touche encore ${capName(to)} pour partir`)].filter(Boolean));
  };
  const prio = new Set([...reco.keys(), ...leadMap().keys()]); stoneHints().forEach((v, k) => { if (v === 'full') prio.add(k); }); const pxy = id => OT_ST[stationOf(id)] || [0, 0]; const hxy = pxy(here);
  const focusIds = [here, ...[...prio].filter(x => x !== here && S[x]).sort((a, b) => Math.hypot(pxy(a)[0] - hxy[0], pxy(a)[1] - hxy[1]) - Math.hypot(pxy(b)[0] - hxy[0], pxy(b)[1] - hxy[1])).slice(0, 3)];
  box = mapBox({ here, pick: new Set(ids), onPick: select, reco, terr: feat('monde'), stones: stoneHints(), leads: leadMap(), closed: closedMap(), focus: focusIds });
  const W0 = G.world; const clues = DATA.stones.filter(s => !G.pc.stones[s.id] && (W0.stoneLv[s.id] || W0.stoneClue[s.id]));
  const clueRow = clues.length ? h('div', { class: 'stleads' }, clues.map(s => { const lv = W0.stoneLv[s.id] || 1; const loc = W0.stoneLoc[s.id];
    return h('button', { class: 'stlead', style: `--c:${s.color}`, onclick: () => { if (lv >= 2 && loc !== here) { sfx('click'); select(loc); } else if (lv >= 2) toast('C’est ici : l’enquête se fait pendant ton séjour.'); else toast(`Rumeur : zone ${zoneOf(loc)}. Les 💎 creux marquent les États possibles.`); } }, `💎 ${s.name} · `, h('b', {}, lv >= 2 ? capName(loc) : `zone ${zoneOf(loc)}`), h('i', {}, '◆'.repeat(lv) + '◇'.repeat(3 - lv))); })) : null;
  const ms = box.querySelector('.mapscroll') || box; ms.style.position = 'relative'; ms.append(h('button', { class: 'mapcorner', onclick: () => vehicleMenu(), title: 'Voyager autrement' }, '🛴 Autre moyen'));
  if (pre) setTimeout(() => select(pre), 30);
  const back = (UI.parked || (G.pc.flags.stage === 'ville' && G.pc.flags.cityActs > 0)) ? [C('← Retour', () => (UI.parked ? resumeScene() : cityMenu()), { cls: 'back' })] : [];
  coach('voyage'); show({ compact: true, kicker: 'Orbitrail', title: 'Où veux-tu aller ?', text: [], extra: h('div', {}, clueRow, box, info), choices: back });
}
function travelList() {
  const here = G.loc; const L = [];
  CONT.forEach(ct => DATA.states.filter(s => s.continent === ct && s.id !== here).forEach(s => { const r = otRoute(here, s.id); L.push(C(`${s.capital} — ${s.name}`, () => travelConfirm(s.id), { sub: `${ct} · ${r.hops} arrêt(s) · ${r.cost} ¢` })); }));
  L.push(C('← Retour', () => travelMenu())); show({ kicker: 'Orbitrail', title: 'Destinations', text: [], choices: L });
}
function routeText(r) { return r.legs.map(l => `ligne ${l.line} : ${OT_ST[l.from][2]} → ${OT_ST[l.to][2]}`).join(' ; '); }
function travelConfirm(to) { travelMenu(to); }
const pc_hasFaux = () => G.pc.faux > 0;
function detectChance() {
  const pc = G.pc; if (pc.faction === 'fa' && !pc.flags.defected) return 0.02;
  let p = 0.04 + wantedStars() * 0.1 + ((pc.ptype !== 'zoologique' && pc.ptype !== 'aucun') ? 0.08 : 0) + (G.world.era === 'dark' ? 0.08 : 0);
  if (pc.faux > 0) p -= 0.2; if (pc.brouil > 0) p -= 0.15; if (G.world.era === 'newera') p = 0.01;
  p -= PK('travel') / 100;
  return clamp(p, 0.02, 0.75);
}
function transferStop(r) { // changer de ligne : faible chance d'être arrêté et de devoir faire escale
  if (!r || !r.legs || r.legs.length < 2) return null; const pc = G.pc; const p = 0.07 + wantedStars() * 0.02;
  for (let i = 0; i < r.legs.length - 1; i++) if (chance(p)) {
    const st = r.legs[i].to; const state = OT_ST[st][3]; if (closureOf(state)) continue; let k = 0; for (let j = 0; j <= i; j++) k += r.legs[j].stops;
    const r2 = { steps: r.steps.slice(0, k), legs: r.legs.slice(0, i + 1), hops: k, cost: 0, path: r.path.slice(0, k + 1) };
    const pool = [...enemiesOf(pc.faction), ...Object.keys(F).filter(f => !['civils', 'noir', 'own', 'fallen', 'fa'].includes(f) && f !== pc.faction && (pc.rep[f] || 0) <= -5)];
    const kind = pool.length && chance(0.5) ? 'faction' : 'fa';
    return { state, r2, kind, fid: kind === 'faction' ? pick(pool) : 'fa', weeks: Math.max(1, Math.round((i + 1) / r.legs.length * 2)) };
  }
  return null;
}
function travelGo(to, r, weeks) {
  const pc = G.pc; pc.money -= r.cost; const from = G.loc;
  const used = [];
  if (pc.faux > 0) { pc.faux--; used.push('faux papiers'); } if (pc.brouil > 0) { pc.brouil--; used.push('brouilleur'); }
  const ctl = chance(detectChance());
  const stop = transferStop(r);
  if (stop) return transit(stop.r2, from, stop.state, () => {
    G.loc = stop.state; pc.flags.stage = 'contrats'; pc.flags.acts = {}; pc.flags.cityActs = null; advance(stop.weeks); if (G.status !== 'play') return;
    logEntry(`Escale forcée à ${capName(stop.state)}.`);
    show({ kicker: 'ORBITRAIL · ESCALE FORCÉE', title: stop.kind === 'fa' ? 'Le train s’arrête' : 'Des intrus à bord', text: [stop.kind === 'fa' ? `À la correspondance de ${esc(capName(stop.state))}, la Force d’Autorité fait descendre tout le monde : contrôle général.` : `À la correspondance de ${esc(capName(stop.state))}, des membres de ${esc(F[stop.fid].name)} montent dans ta rame. Ils te cherchaient.`, '<span class="mut">Tu devras refaire ton trajet depuis cette ville.</span>'], choices: [C('Continuer', () => (stop.kind === 'fa' ? controleFA(stop.r2) : ambushCard(stop.fid)), { cls: 'cta' })] });
  });
  transit(r, from, to, () => {
    G.loc = to; pc.flags.stage = 'contrats'; pc.flags.acts = {}; pc.flags.cityActs = null; advance(weeks); if (G.status !== 'play') return;
    logEntry(`Voyage : ${capName(from)} → ${capName(to)}.`);
    if (ctl) return controleFA(r);
    const ev = randomTravelEvent(); if (ev) return ev();
    contractCard(used.length ? 'Tu as utilisé : ' + used.join(', ') + '.' : 'Le train glisse sans histoire.');
  });
}
function travelHover() {
  show({ kicker: 'Scout-hover', title: 'Cap sur…', text: ['Hors du réseau : pas de contrôle de gare, mais les dérèglements de l’ogénite ne préviennent pas. Coût : 120 ¢ de carburant (capsules OGEN), 1 à 3 semaines.'], choices: [...CONT.flatMap(ct => DATA.states.filter(s => s.continent === ct && s.id !== G.loc && !isLockdown(s.id)).map(s => C(`${s.capital} — ${s.name}`, () => hoverGo(s.id), { sub: ct, req: { money: 120 } }))), C('← Retour', travelMenu)] });
}
function hoverGo(to) {
  G.pc.money -= 120; const from = G.loc; G.loc = to; advance(rint(1, 3)); if (G.status !== 'play') return; logEntry(`Vol en scout-hover vers ${capName(to)}.`);
  if (chance(0.45)) return climateEvent(); show({ kicker: 'Scout-hover', title: 'Vol sans encombre', text: [`Tu atterris à ${esc(capName(to))}. Personne ne sait que tu es là.`], choices: [C('Continuer', hub)] });
}

// ───────── Repos ─────────
function restMenu() {
  const pc = G.pc; const L = [];
  L.push(C('Dormir quelques jours (1 semaine)', () => doRest(1), { sub: 'Récupère ~25 % PV et énergie. Gratuit.' }));
  L.push(C('Se faire soigner correctement (2 semaines, 80 ¢)', () => doRest(2, 80), { sub: 'Récupère ~55 % PV et ~60 % de l’énergie. Soigne les alliés.', req: { money: 80 } }));
  L.push(C('Se mettre au vert pendant 1 mois', () => lieLow(), { sub: 'La prime baisse ; tu récupères tout, mais +70 % PV, ton argent fond (60 ¢).', req: { money: 60 } }));
  L.push(C('Chercher un contact des Siha Mujahaz (soins clandestins)', () => { addRep('siha', 2, { spill: false }); doRest(1, 0, true); }, { sub: 'Soins gratuits mais discrets, si la Siha t’apprécie.', req: { rep: { siha: 10 } } }));
  L.push(C('← Retour', cityMenu)); show({ kicker: 'Repos', title: 'Se reposer', text: ['Un lit, un toit, quelques jours sans courir. Mais le monde, lui, ne s’arrête pas.'], choices: L });
}
function doRest(weeks, cost = 0, free) {
  const pc = G.pc; pc.money -= cost; advance(weeks); if (G.status !== 'play') return;
  const full = weeks >= 2 || free; const dh = Math.round(pc.hpMax * (free ? 0.5 : weeks >= 2 ? 0.55 : 0.25)), de = Math.round(pc.enMax * (free ? 0.4 : full ? 0.6 : 0.25));
  pc.hp = Math.min(pc.hpMax, pc.hp + dh + PK('rest') * 3); pc.en = Math.min(pc.enMax, pc.en + de); if (full) pc.party.forEach(a => { a.inj = 0; a.hp = a.hpMax; });
  const ev = chance(0.18) && randomHubEvent(); if (ev) return ev();
  show({ kicker: 'Repos', title: 'Tu te sens mieux', text: ['Les jours passent. Les bleus s’effacent.'], choices: [C('Continuer', hub)] });
}
function lieLow() {
  const pc = G.pc; pc.money -= 60; const L = []; advance(4); if (G.status !== 'play') return;
  if (pc.heat > minHeat()) { addHeat(-12, L); } pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.7)); pc.en = pc.enMax; pc.party.forEach(a => { a.inj = 0; a.hp = a.hpMax; });
  show({ kicker: 'Profil bas', title: 'Un mois dans l’ombre', text: ['Tu changes de quartier, de coupe, de manières. On t’oublie un peu.'], fx: L, choices: [C('Continuer', hub)] });
}

// ───────── Marché ─────────
function sellMenu() {
  const L = []; Object.keys(G.pc.inv).forEach(id => { const it = ITEMS[id]; const v = Math.round(it.price * 0.4); L.push(C(`Vendre ${it.n} — ${v} ¢`, () => { takeItem(id); G.pc.money += v; if (G.pc.eq.arme === id && !hasItem(id)) G.pc.eq.arme = null; if (G.pc.eq.armure === id && !hasItem(id)) G.pc.eq.armure = null; sellMenu(); }, { sub: it.desc })); });
  L.push(C('← Retour', () => shopMenu())); show({ kicker: 'Marché', title: 'Vendre', text: [`Tu as ${fmt(G.pc.money)} ¢.`], choices: L });
}

// ───────── Recrutement et rencontres ─────────
function recruitPrice(c) { return Math.round((100 + c.stars * 180 + Math.min(c.ratio, 100) * 3) * (hasRole('logisticien') ? 0.85 : 1)); }
function recruitMenu() {
  const pc = G.pc; const here = npcsHere().filter(c => !Object.values(F).some(f => f.leaders.includes(c.id) && G.world.leader[f.id] === c.id && f.id !== pc.faction) || true);
  const L = [];
  if (pc.faction !== 'civils' && F[pc.faction]) { const roster = DATA.chars.filter(c => c.faction === pc.faction && G.world.npc[c.id].alive && G.world.npc[c.id].st === 'free'); if (roster.length) L.push(C(`Annuaire de ${F[pc.faction].name} (${roster.length} membres)`, () => factionRoster(0), { ic: '📇', sub: 'Tous les membres vivants de ta faction, où qu’ils soient.' })); }
  here.slice(0, 12).forEach(c => { const lead = Object.values(F).some(f => G.world.leader[f.id] === c.id); L.push(C(`${c.name} — ${F[c.faction].name}`, () => meetNpc(c.id), { img: c.id, sub: `${c.stars ? 'Prestige ' + '★'.repeat(c.stars) : 'Anonyme'} · ${STYLES[c.style || 'brawler'].name} · ${charPowerText(c)}${lead ? ' · CHEF DE FACTION' : ''}` })); });
  if (!here.length) L.push(Object.assign(C('Personne de remarquable ici', () => { }), { lock: 'Essaie une autre ville, ou le QG d’une faction' }));
  L.push(C('Chercher des rumeurs et des visages (1 semaine)', () => { advance(1); if (G.status !== 'play') return; const ev = randomHubEvent(true); if (ev) ev(); else show({ title: 'Rien', text: ['Une semaine à traîner dans les bars et les marchés. Rien de neuf.'], choices: [C('Continuer', hub)] }); }));
  L.push(C('← Retour', cityMenu)); show({ kicker: 'Rencontres', title: 'Qui est dans le coin ?', text: ['Les gens que tu peux rencontrer à ' + esc(capName(G.loc)) + '. Un chef de faction ne s’engage pas en quelques mots.'], choices: L });
}
function factionRoster(page) {
  const pc = G.pc; const all = DATA.chars.filter(c => c.faction === pc.faction && G.world.npc[c.id].alive && G.world.npc[c.id].st === 'free').sort((a, b) => b.stars - a.stars); const per = 8; const pages = Math.max(1, Math.ceil(all.length / per)); page = clamp(page, 0, pages - 1);
  const L = all.slice(page * per, page * per + per).map(c => C(`${c.name}${G.world.npc[c.id].loc === G.loc ? ' · ici' : ' · ' + capName(G.world.npc[c.id].loc)}`, () => meetNpc(c.id), { img: c.id, sub: `${c.stars ? 'Prestige ' + '★'.repeat(c.stars) : 'Anonyme'} · ${STYLES[c.style || 'brawler'].name} · ${charPowerText(c)}` }));
  if (page > 0) L.push(C('← Page précédente', () => factionRoster(page - 1), { cls: 'back' })); if (page < pages - 1) L.push(C('Page suivante →', () => factionRoster(page + 1)));
  L.push(C('← Retour', recruitMenu)); show({ kicker: F[pc.faction].name, title: 'Annuaire de la faction', text: [`${all.length} membres vivants. Page ${page + 1}/${pages}.`], choices: L });
}
function meetNpc(cid) {
  const c = CH[cid]; const pc = G.pc; const price = recruitPrice(c); const rep = pc.rep[c.faction] || 0;
  const lead = Object.values(F).find(f => G.world.leader[f.id] === cid);
  const joinable = c.faction !== pc.faction ? rep >= 20 : true;
  const L = [];
  L.push(C(`Lui proposer de rejoindre ton groupe (${price} ¢)`, () => recruit(cid, price, false), { req: { money: price, ok: () => lead ? 'C’est un chef de faction : il ne quittera pas ses responsabilités' : pc.party.length >= partyMax() ? 'Groupe complet (monte en grade ou prends le rôle de Leader)' : (c.faction !== pc.faction && rep < 20) ? `Sa faction ne te fait pas assez confiance (réputation ${rep}/20)` : null } }));
  L.push(C('Le convaincre par le charisme (gratuit)', () => recruit(cid, 0, true), { odds: ['charisme', 12 + c.stars * 2, ['social']], req: { ok: () => lead ? 'C’est un chef de faction' : pc.party.length >= partyMax() ? 'Groupe complet' : null } }));
  L.push(C('Parler et se renseigner', () => { const L2 = fx({ rep: { [c.faction]: 1 }, spill: false }); show({ kicker: c.name, title: 'Une conversation', text: [`${esc(c.name)} te parle de ${esc(F[c.faction].name)} : « ${esc(F[c.faction].goal)} »`, G.world.stoneClue && lead ? '' : `Il te glisse une rumeur : ${rumor()}`], fx: L2, choices: [C('Continuer', recruitMenu)] }); }));
  if (isAnti(c.faction) && c.stars && pc.faction !== c.faction) L.push(C('Le dénoncer à la Force d’Autorité (récompense)', () => betray(cid), { cls: 'danger', sub: 'Trahison : sa faction et ses alliés t’en voudront.' }));
  L.push(C('← Retour', recruitMenu));
  show({ extra: portrait(c.id, 150), kicker: F[c.faction].name, title: c.name, text: [`${esc(c.name)} — ${c.gender === 'H' ? 'homme' : c.gender === 'F' ? 'femme' : 'non-binaire'}, ${esc(c.age)}. Origine : ${esc(stateName(c.origin))}. Style : ${STYLES[c.style || 'brawler'].name}.`, `Pouvoir : ${esc(charPowerText(c))}.`, lead ? '<b>Chef de sa faction.</b>' : '', `Ton lien avec sa faction : ${repLevel(rep)} (${rep}).`], choices: L });
}
function recruit(cid, price, viaCha) {
  const c = CH[cid]; const pc = G.pc;
  if (viaCha) { const r = check('charisme', 12 + c.stars * 2, ['social']); if (!r.ok) { return show({ kicker: c.name, title: 'Refus', text: [`${esc(c.name)} te regarde de haut en bas. « Non. »`, checkLine(r)], choices: [C('Continuer', recruitMenu)] }); } }
  pc.money -= price; addAlly(cid, viaCha ? 50 : 60); addRep(c.faction, -2, { spill: false });
  logEntry(`${c.name} rejoint ton groupe.`);
  show({ kicker: c.name, title: 'Une recrue', text: [`${esc(c.name)} te rejoint. Veille à sa loyauté : les ordres douteux et les échecs la font baisser.`], choices: [C('Continuer', recruitMenu)] });
}
function betray(cid) {
  const c = CH[cid]; const money = 150 * c.stars + 100;
  G.world.npc[cid].st = 'captured'; const L = fx({ money, rep: { [c.faction]: -30, fa: 8 }, heat: 0, xp: 10 });
  newsPush(`${c.name} (${F[c.faction].name}) a été arrêté après une dénonciation.`); logEntry(`Tu as dénoncé ${c.name}.`);
  show({ kicker: 'Trahison', title: 'Dénoncé', text: [`Tu glisses le nom de ${esc(c.name)} à la Force d’Autorité. Une heure plus tard, un escadron fond sur son repaire.`, 'Sa faction ne l’oubliera pas. Ses alliés non plus.'], fx: L, choices: [C('Continuer', hub)] });
}

// ───────── Entraînement et rôles ─────────
function trainMenu() {
  const pc = G.pc; const L = [];
  ATTRS.forEach(a => { const hv = (pc.half || {})[a.id] || 0; const [ic] = (typeof ATTR_LOOK !== 'undefined' && ATTR_LOOK[a.id]) || ['◆']; L.push(C(a.name, () => trainAttr(a.id), { ic, sub: `½ point · ${hv}/2 · actuel ${A(a.id)} · 100 ¢`, req: { money: 100, ok: () => pc.attrs[a.id] >= 12 ? 'Au maximum' : null } })); });
  L.push(C('Formation aux techniques anti-geno (3 semaines, 500 ¢)', () => { pc.money -= 500; advance(3); if (G.status !== 'play') return; pc.flags.antigeno = true; show({ kicker: 'Formation', title: 'Techniques anti-geno', text: ['Buff, Rebound, Shield, Restore, Foresight, Shock, Dash : accessibles à toutes, enseignées à la F.A. — tu les maîtrises désormais (+2 dégâts, +1 défense en combat).'], choices: [C('Continuer', hub)] }); }, { req: { money: 500, notFlag: 'antigeno' } }));
  const cap = 1 + Math.floor(pc.grade / 2);
  L.push(C(`Choisir un rôle (${pc.roles.length}/${cap})`, roleMenu, { sub: pc.roles.length ? pc.roles.map(r => ROLES[r].name).join(', ') : 'Éclaireur, combattant, artilleur, leader, médecin, ingénieur…', req: { ok: () => pc.missions < 3 ? 'Il faut avoir mené au moins 3 missions pour qu’on te reconnaisse un rôle' : null } }));
  L.push(C('← Retour', cityMenu));
  const left = capActs(L, 'train', /rôle/i);
  show({ kicker: 'Progression', title: 'S’entraîner', text: [`<span class="mut">XP ${pc.xp} · ${left ? 'une séance possible' : 'séance déjà faite'} dans cette ville</span>`], choices: L, tiles: true });
}
function roleMenu() {
  const pc = G.pc; const cap = 1 + Math.floor(pc.grade / 2); const L = [];
  Object.entries(ROLES).forEach(([id, r]) => {
    const has = pc.roles.includes(id); const rq = { attr: {}, ok: () => (!has && pc.roles.length >= cap) ? `Tu ne peux pas avoir plus de ${cap} rôle(s) à ton grade` : null };
    if (r.req.attr) rq.attr[r.req.attr[0]] = r.req.attr[1]; if (r.req.grade) rq.grade = r.req.grade;
    const okStyle = !r.req.style || r.req.style.includes(pc.style);
    const lockStyle = okStyle ? null : `Style requis : ${r.req.style.map(s => STYLES[s].name).join(' / ')}`;
    const ch = C(`${has ? '✔ ' : ''}${r.name}`, () => { if (has) pc.roles = pc.roles.filter(x => x !== id); else { pc.money -= 150; pc.roles.push(id); } logEntry(has ? `Tu abandonnes le rôle ${r.name}.` : `Tu deviens ${r.name}.`); roleMenu(); }, { sub: `${r.desc} ${r.perk}${has ? '' : ' — formation 150 ¢'}`, req: has ? null : Object.assign(rq, { money: 150 }) });
    if (lockStyle && !has) ch.lock = ch.lock || lockStyle; L.push(ch);
  });
  L.push(C('← Retour', trainMenu)); show({ kicker: 'Rôles', title: 'Choisir un rôle', text: ['Un rôle change tes missions : options exclusives, bonus aux jets, recrutement et coûts.'], choices: L });
}

// ───────── Retraite ─────────
function retireConfirm() {
  const pc = G.pc, W = G.world; const lead = W.leader[pc.faction] === 'pc';
  const R = [[wantedStars() <= 1, 'Prime de 1 étoile au maximum', 'Ta prime est trop haute : on te retrouverait.'], [pc.money >= 3000, '3 000 ¢ pour repartir de zéro', `Il te manque ${fmt(3000 - pc.money)} ¢.`], [G.wk >= 26, 'Au moins 26 semaines dans ce monde', 'Trop tôt : on ne disparaît pas après si peu.'], [!lead, 'Ne pas diriger une faction', 'Transmets ta faction ou quitte-la d’abord.'], [G.wk - (pc.flags.retireWk == null ? -99 : pc.flags.retireWk) >= 8, 'Pas de tentative récente', 'Une tentative a échoué récemment : attends un peu.']];
  const bad = R.find(x => !x[0]);
  show({ kicker: 'RETRAITE', title: 'Disparaître', text: ['On n’échappe pas à ce monde si facilement. Pour que personne ne te cherche, il faut remplir quelques conditions, puis réussir une dernière épreuve : une nouvelle identité, des traces effacées et une dernière poursuite.', ...R.map(x => `${x[0] ? '✔' : '✖'} ${x[1]}`), `Score actuel estimé : <b>${fmt(computeScore('retire'))}</b> (×1,25 si tu réussis).`], choices: [C('Organiser ma disparition', startVanish, { cls: 'danger', req: { ok: () => bad ? bad[2] : null } }), C('Non, continuer', () => (UI.parked ? resumeScene() : hub()), { cls: 'back' })] });
}
function startVanish() {
  const pc = G.pc; const st = { ok: 0, i: 0 }; const tier = Math.max(1, wantedStars()); const dc = 12 + 2 * tier;
  const T = [
    { t: 'Une nouvelle identité', x: 'Sans nom, pas de retraite possible.', o: [['Des faux papiers parfaits (400 ¢)', 'money', 400], ['Les fabriquer toi-même', 'intellect', ['tech', 'hack']], ['Convaincre un fonctionnaire', 'charisme', ['social', 'disguise']]] },
    { t: 'Effacer tes traces', x: 'Fichiers, caméras, témoins : il faut tout faire disparaître.', o: [['Brouiller les registres', 'intellect', ['hack']], ['Disparaître de quartier en quartier', 'agilite', ['stealth']], ['Acheter le silence (500 ¢)', 'money', 500]] },
    { t: 'La dernière poursuite', x: 'Quelqu’un t’a retrouvé au dernier moment…', o: [['Fuir à travers la ville', 'agilite', ['mobility']], ['Régler ça en combat', 'fight'], ['Négocier ta sortie', 'charisme', ['social']]] }
  ];
  const fail = () => { pc.flags.retireWk = G.wk; pc.money = Math.max(0, pc.money - 1000); show({ kicker: 'RETRAITE', title: 'Tu es repéré', text: ['Quelqu’un t’a reconnu, ou un maillon a lâché. Tu perds 1 000 ¢ et ta prime monte. On ne disparaît pas comme ça.'], fx: fx({ heat: 6 }), choices: [C('Continuer', hub)] }); };
  const stepEnd = (ok, text) => { if (ok) st.ok++; st.i++; if (st.i >= 3) return st.ok >= 2 ? endGame('retire', '') : fail(); show({ kicker: 'RETRAITE', title: ok ? 'Étape franchie' : 'Étape ratée', text: [text, `<span class="mut">${st.ok} réussie(s) sur ${st.i}. Il en faut 2 sur 3.</span>`], choices: [C('Continuer', next)] }); };
  const next = () => { const s = T[st.i]; show({ kicker: `RETRAITE · ÉTAPE ${st.i + 1}/3`, title: s.t, text: [s.x], choices: s.o.map(([lab, attr, tags]) => C(lab, () => {
    if (attr === 'money') { if (pc.money < tags) return toast('Pas assez de crédits'); pc.money -= tags; return stepEnd(true, 'L’argent règle le problème.'); }
    if (attr === 'fight') return startCombat({ title: 'La dernière poursuite', foes: foesFor(chance(0.5) ? 'fa' : (enemiesOf(pc.faction)[0] || 'fa'), Math.min(5, tier), 2), lethal: 'capture', intro: 'Ils te rattrapent à la sortie de la ville.', onWin: L => { stepEnd(true, 'Tu t’en sors : ils ne te suivront plus.'); }, onFlee: () => stepEnd(false, 'Tu t’échappes, mais ils savent où tu vas.') });
    const r = check(attr, dc, tags); stepEnd(r.ok, (r.ok ? 'Ça passe. ' : 'Ça coince. ') + checkLine(r)); }, { odds: (attr === 'money' || attr === 'fight') ? null : [attr, dc, tags], ic: attr === 'money' ? '💰' : attr === 'fight' ? '⚔' : '🎲', req: attr === 'money' ? { money: tags } : undefined })) }); };
  next();
}

// ───────── Objectifs : tout ce qui t'attend, au même endroit ─────────
function objectives() {
  const pc = G.pc, W = G.world, f = pc.flags; const L = [];
  if (pc.faction !== 'civils' && pc.grade < 5) { const nx = MERIT_STEPS[pc.grade + 1]; if (nx) L.push(pc.merit >= nx ? { ic: '🎖', t: 'Épreuve de grade', sub: 'Ton mérite est suffisant : elle t’attend à la prochaine arrivée.' } : { ic: '🎖', t: `Grade suivant : ${gradeNames(pc)[pc.grade + 1]}`, sub: `Mérite ${pc.merit}/${nx} — fais des contrats pour ta faction.` }); }
  if (f.camp && CAMPS[f.camp.id]) L.push({ ic: '📖', t: `Campagne : ${CAMPS[f.camp.id].n}`, sub: `Chapitre ${f.camp.ch + 1}/${CAMPS[f.camp.id].ch.length} — la suite arrive dans la trame.` });
  DATA.stones.filter(s => !pc.stones[s.id] && (W.stoneLv[s.id] || W.stoneClue[s.id])).forEach(s => { const lv = W.stoneLv[s.id] || 1, loc = W.stoneLoc[s.id]; L.push(lv >= 2 ? { ic: '💎', t: `Pierre de ${s.name}`, sub: `Piste à ${capName(loc)} (${stateName(loc)}).`, go: () => travelMenu(loc) } : { ic: '💎', t: `Pierre de ${s.name}`, sub: `Rumeur : zone ${zoneOf(loc)}. Cherche d’autres indices.` }); });
  leadMap().forEach((ld, st) => { L.push({ ic: '🔴', t: leadTitle(ld), sub: `Opportunité à ${capName(st)}.`, go: () => travelMenu(st) }); });
  if (pc.implant) L.push({ ic: '💥', t: 'Implant explosif', sub: `Livre une prime avant le ${dateStr(pc.implant.deadline)}.` });
  if (wantedStars() >= 2) L.push({ ic: '⭐', t: `Prime ${starStr(wantedStars())}`, sub: 'Fais-toi oublier : mois au vert, faux papiers, ou fais tomber ta prime.' });
  return L;
}
function objectivesMenu() {
  const L = objectives().map(o => C(o.t, o.go ? () => { UI.parked = null; o.go(); } : () => { }, { ic: o.ic, sub: o.sub, cls: o.go ? '' : '' }));
  if (!L.length) L.push(Object.assign(C('Rien d’urgent', () => { }), { lock: 'Explore, fais des contrats : de nouveaux objectifs apparaîtront.' }));
  L.push(C('← Retour', actionsMenu)); show({ kicker: 'Objectifs', title: `${objectives().length} chose${objectives().length > 1 ? 's' : ''} à garder en tête`, text: [`<span class="mut">Pierres : ${stoneCount()}/16 · Destination n° ${G.pc.flags.dest || 1}</span>`], choices: L });
}

// ───────── Bilan avant de repartir (court) ─────────
function recapCard() {
  const pc = G.pc, s = pc.flags.snap; const d = (a, b) => a - b; const sg = n => (n > 0 ? '+' : '') + n;
  const chips = []; const add = (ic, v, unit, bad) => { if (v) chips.push({ t: `${ic} ${sg(v)}${unit}`, c: (v > 0) !== !!bad ? 'good' : 'badc' }); };
  add('₵', d(pc.money, s.money), ' ¢'); add('✦', d(pc.xp, s.xp), ' XP'); add('🎖', d(pc.merit, s.merit), ' mérite'); add('♥', d(pc.hp, s.hp), ' PV'); add('💎', d(stoneCount(), s.st), ' pierre');
  const rv = Object.keys(pc.rep).map(k => [k, (pc.rep[k] || 0) - ((s.rep || {})[k] || 0)]).filter(x => x[1]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
  if (rv) chips.push({ t: `🤝 ${F[rv[0]] ? F[rv[0]].name : rv[0]} ${sg(rv[1])}`, c: rv[1] > 0 ? 'good' : 'badc' });
  const wks = G.wk - s.wk;
  show({ kicker: `BILAN · ${capName(s.loc).toUpperCase()}`, title: 'Avant de repartir', text: [wks ? `<span class="mut">${wks} semaine${wks > 1 ? 's' : ''} passée${wks > 1 ? 's' : ''} ici.</span>` : ''].filter(Boolean), fx: chips.length ? chips : [{ t: 'Rien de notable cette fois.', c: '' }], choices: [C('Choisir ma destination', () => travelMenu(), { ic: '🚆', cls: 'cta' })] });
}
