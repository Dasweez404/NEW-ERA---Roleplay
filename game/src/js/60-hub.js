// ───────── Hub : menu principal du tour, voyage, repos, marché, recrutement, rôles, retraite ─────────
function npcsHere() { return DATA.chars.filter(c => { const n = G.world.npc[c.id]; return n.alive && n.st === 'free' && n.loc === G.loc && c.faction !== 'civils'; }); }

// Le menu éclair n'existe plus : « actionsMenu » ramène à la scène en cours (ou à la ville).
function parkOpen(fn) { if (CB) return toast('Pas pendant un combat'); if (!UI.parked) UI.parked = UI.scene; closeSheet(); fn(); }
function resumeScene() { const s = UI.parked; UI.parked = null; if (s) { UI.scene = s; render(true); return; } if (G.pc.flags.stage === 'ville') return cityMenu(); hub(); }
function actionsMenu() { resumeScene(); }
function enterCity() { const f = G.pc.flags; f.stage = 'ville'; const b = (typeof isBaseHere === 'function' && isBaseHere() ? 1 : 0) + (typeof atelierHere === 'function' && atelierHere() ? 1 : 0); f.cityActs = 1; cityMenu(); }
function cityMenu() {
  const pc = G.pc, f = pc.flags; f.stage = 'ville'; if (f.cityActs == null) f.cityActs = 1; const left = f.cityActs; const L = [];
  if (left <= 0) { if (!f.recapDone && f.snap) { f.recapDone = true; UI.recap = recapChips(); } return travelMenu(); }
  if (left > 0) {
    const T = []; baseTile(T); atelierTile(T); if (typeof endingTile === 'function') endingTile(T);
    T.push(C('Se reposer', restMenu, { ic: '🛏', sub: 'Soigner, recharger, se faire oublier.' }));
    T.push(C('Marché', () => shopMenu(), { ic: '🛒', sub: 'Armes, armures, gadgets, soins.' }));
    T.push(C('Recruter', recruitMenu, { ic: '🤝', sub: `Groupe : ${pc.party.length}/${partyMax()}` }));
    T.push(C('S’entraîner', trainMenu, { ic: '🎓', sub: 'Expérience, rôles, formation anti-geno.' }));
    const hpR = pc.hp / pc.hpMax, light = !weaponOf() || !armorOf();
    const rec = hpR < 0.6 || pc.en < pc.enMax * 0.3 ? 'Se reposer' : (pc.money >= 250 && light) ? 'Marché' : (pc.party.length < Math.min(2, partyMax()) && pc.money >= 300) ? 'Recruter' : 'S’entraîner';
    T.forEach(c => { if (c.label === rec) { c.sub = '★ Conseillé · ' + (c.sub || ''); c.cls = ((c.cls || '') + ' safe').trim(); } });
    T.forEach(c => { const g = c.go; c.go = () => { f.cityMark = cityMark(); f.cityActs--; g(); }; }); L.push(...T);
    { const sq = typeof stoneQuestHere === 'function' ? stoneQuestHere() : null; if (sq) { const lv = G.world.stoneLv[sq.id] || 0; L.push(C(lv >= 3 ? `La pierre de ${sq.name} est ici` : `Enquêter : pierre de ${sq.name}`, () => stoneQuestCard(sq), { ic: '💎', cls: 'risk', sub: lv >= 3 ? 'Tu connais sa cachette : tente de la récupérer (ne coûte pas d’action de ville).' : 'Un indice t’y a mené (ne coûte pas d’action de ville).' })); } }
  }
  { const q = []; const pcx = pc; const heal = ['nanosoin', 'kit'].find(id => hasItem(id)); if (heal && pcx.hp < pcx.hpMax * 0.7) q.push(C(`Utiliser ${ITEMS[heal].n}`, () => { useItem(heal); toast(`${ITEMS[heal].n} utilisé`); sfx('win'); cityMenu(); }, { ic: '💊', cls: 'safe', sub: `${ITEMS[heal].desc} · n’utilise pas ton action` })); if (hasItem('capsule') && pcx.en < pcx.enMax * 0.5) q.push(C('Utiliser une Capsule OGEN', () => { useItem('capsule'); toast('+8 énergie'); sfx('win'); cityMenu(); }, { ic: '⚡', cls: 'safe', sub: 'Recharge 8 énergie · n’utilise pas ton action' })); L.unshift(...q); }
  coach('ville'); show({ kicker: 'EN VILLE · ' + capName(G.loc).toUpperCase(), title: 'Une action ici, puis tu repars', text: [(typeof feat === 'function' && feat('rep')) ? `<span class="mut">${esc(zoneOf())} · ${cityLabel(cityRep())}${cityPerk().txt ? ' · ' + cityPerk().txt : ''}</span>` : ''].filter(Boolean), choices: L, tiles: true });
}
function pendingEvents() {
  // événements en attente (ex. conseil de faction, menace sur pierre) posés par monthTick
  const q = G.pc.flags.queue; if (q && q.length) { const e = q.shift(); if (!q.length) delete G.pc.flags.queue; const fn = EVENT_FN[e.id]; if (fn) { fn(e.arg); return () => { }; } }
  return null;
}
const EVENT_FN = {};

// ───────── Voyager ─────────
// Moyen de déplacement par défaut : le dernier véhicule utilisé (changement d'un tap, sans quitter l'écran)
const curVeh = () => { const m = G.pc.flags.mode; return (m && ITEMS[m] && hasItem(m)) ? m : null; };
function cycleMode() { const L = [null, ...myVehicles()]; const i = L.indexOf(curVeh()); G.pc.flags.mode = L[(i + 1) % L.length]; sfx('click'); travelMenu(); }
function travelMenu(pre) {
  const here = G.loc; const ids = DATA.states.map(s => s.id).filter(i => i !== here); let sel = null; let box; const reco = recoStates(); const vid = curVeh(); const vreach = vid ? new Set(ids.filter(i => vehicleOk(vid, here, i))) : null; const freeSet = new Set(neighbors(here).filter(n => !closureOf(n)));
  const info = h('div', { class: 'travelinfo' }, h('div', { class: 'mut' }, 'Touche une destination, puis touche-la encore pour partir.'));
  const ownerName = to => { const o = G.world.terr[to]; return o === 'pc' ? 'ta faction' : F[o] ? F[o].name : (o || '—'); };
  const select = to => {
    if (vid) {
      const v = ITEMS[vid].v; const r = vehicleOk(vid, here, to); if (!r) { toast(`${ITEMS[vid].n} : hors de portée (touche ${v.ic} pour changer de moyen)`); return; }
      const wk = Math.max(1, Math.ceil(r.hops / v.spd)); const fuel = 10 + r.hops * 6;
      if (sel === to) { if (G.pc.money < fuel) { toast('Carburant insuffisant (' + fuel + ' ¢)'); return; } return vehicleGo(vid, to, wk, fuel, r); }
      sel = to; sfx('click'); box.setRoute(r); info.innerHTML = ''; info.append(h('div', { class: 'tvrow' }, h('b', { class: 'tvd' }, `${capName(here)} → ${capName(to)}`), h('span', { class: 'tvm' }, h('span', { class: G.pc.money < fuel ? 'badc' : 'acc' }, `${fuel} ¢`), ` · ${wk} sem.`)), h('div', { class: 'tvchips' }, h('span', { class: 'pvc' }, `${v.ic} ${ITEMS[vid].n}`), h('span', { class: 'pvc' }, `${r.hops} arrêt${r.hops > 1 ? 's' : ''}`), h('span', { class: 'pvc' }, v.legal ? 'légal' : 'ILLÉGAL')), h('div', { class: 'acc small' }, `▶ Touche encore ${capName(to)} pour partir`)); return;
    }
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
  box = mapBox({ here, pick: vreach || new Set(ids), onPick: select, reco, terr: feat('monde'), stones: stoneHints(), leads: leadMap(), closed: closedMap(), focus: focusIds });
  const W0 = G.world; const clues = DATA.stones.filter(s => !G.pc.stones[s.id] && (W0.stoneLv[s.id] || W0.stoneClue[s.id]));
  const clueRow = clues.length ? h('div', { class: 'stleads' }, clues.map(s => { const lv = W0.stoneLv[s.id] || 1; const loc = W0.stoneLoc[s.id];
    return h('button', { class: 'stlead', style: `--c:${s.color}`, onclick: () => { if (lv >= 2 && loc !== here) { sfx('click'); select(loc); } else if (lv >= 2) toast('C’est ici : l’enquête se fait pendant ton séjour.'); else toast(`Rumeur : zone ${zoneOf(loc)}. Les 💎 creux marquent les États possibles.`); } }, `💎 ${s.name} · `, h('b', {}, lv >= 2 ? capName(loc) : `zone ${zoneOf(loc)}`), h('i', {}, '◆'.repeat(lv) + '◇'.repeat(3 - lv))); })) : null;
  const ms = box.querySelector('.mapscroll') || box; ms.style.position = 'relative'; ms.append(h('button', { class: 'mapcorner', onclick: cycleMode, title: 'Changer de moyen de déplacement' }, vid ? ITEMS[vid].v.ic + ' ' + ITEMS[vid].n : (myVehicles().length ? '🚆 Orbitrail · changer' : '🚆 Orbitrail')));
  if (pre) setTimeout(() => select(pre), 30);
  const recap = UI.recap; UI.recap = null;
  const quickIds = [...new Set([...focusIds.slice(1), ...neighbors(here)])].filter(x => S[x] && !closureOf(x)).slice(0, 3);
  const quick = vid ? [] : quickIds.map(id => { let r = otRoute(here, id); if (!r) return null; if (freeSet.has(id)) r = Object.assign({}, r, { cost: 0 }); const wk = 1 + Math.floor((r.hops - 1) / 4); const why = (reco.get(id) || [])[0] || (leadMap().has(id) ? leadTitle(leadMap().get(id)) : freeSet.has(id) ? 'Station voisine' : '');
    return C(`${capName(id)}`, () => { if (G.pc.money < r.cost) return toast('Pas assez de crédits (' + r.cost + ' ¢)'); travelGo(id, r, wk); }, { ic: '🚆', sub: `${why ? why + ' · ' : ''}${r.cost ? r.cost + ' ¢' : 'gratuit'} · ${wk} sem.`, cls: 'safe' }); }).filter(Boolean);
  const back = (UI.parked || (G.pc.flags.stage === 'ville' && G.pc.flags.cityActs > 0)) ? [C('← Retour', () => (UI.parked ? resumeScene() : cityMenu()), { cls: 'back' })] : [];
  coach('voyage'); show({ compact: true, kicker: 'Orbitrail', title: 'Où veux-tu aller ?', text: [], extra: h('div', {}, recap ? h('div', { class: 'recapbar' }, h('div', { class: 'recap-h' }, `BILAN · ${capName(recap.loc)}${recap.wks ? ' · ' + recap.wks + ' sem.' : ''}`), fxHTML(recap.chips.length ? recap.chips : [{ t: 'Rien de notable', c: '' }])) : null, h('div', { class: 'qgos' }, quick.map(c => h('button', { class: 'qgo', onclick: () => { sfx('click'); c.go(); } }, h('b', {}, '🚆 ' + c.label), h('small', {}, c.sub)))), clueRow, box, info), choices: back });
}
function travelConfirm(to) { travelMenu(to); }
const haveFaux = () => (G.pc.inv.faux || 0) + (G.pc.faux || 0) > 0, haveBrouil = () => (G.pc.inv.brouilleur || 0) + (G.pc.brouil || 0) > 0;
const pc_hasFaux = haveFaux;
function spendFaux() { const pc = G.pc; if (pc.inv.faux) takeItem('faux'); else if (pc.faux > 0) pc.faux--; }
function spendBrouil() { const pc = G.pc; if (pc.inv.brouilleur) takeItem('brouilleur'); else if (pc.brouil > 0) pc.brouil--; }
function detectChance() {
  const pc = G.pc; if (pc.faction === 'fa' && !pc.flags.defected) return 0.02;
  let p = 0.04 + wantedStars() * 0.1 + ((pc.ptype !== 'zoologique' && pc.ptype !== 'aucun') ? 0.08 : 0) + (G.world.era === 'dark' ? 0.08 : 0);
  if (G.world.era === 'newera') p = 0.01;
  p -= PK('travel') / 100;
  return clamp(p, 0.02, 0.75);
}
function transferStop(r) { // changer de ligne : faible chance d'être arrêté et de devoir faire escale
  if (!r || !r.legs || r.legs.length < 2) return null; const pc = G.pc; const p = 0.07 + wantedStars() * 0.02;
  for (let i = 0; i < r.legs.length - 1; i++) if (chance(p)) {
    const st = r.legs[i].to; const state = OT_ST[st][3]; if (closureOf(state)) continue; let k = 0; for (let j = 0; j <= i; j++) k += r.legs[j].stops;
    const r2 = { steps: r.steps.slice(0, k), legs: r.legs.slice(0, i + 1), hops: k, cost: 0, path: r.path.slice(0, k + 1) };
    const pool = [...enemiesOf(pc.faction), ...Object.keys(F).filter(f => !['civils', 'noir', 'own', 'fallen', 'fa'].includes(f) && f !== pc.faction && (pc.rep[f] || 0) <= -5)];
    const kind = pc.faction === 'fa' ? 'faction' : (pool.length && chance(0.5) ? 'faction' : 'fa'); if (kind === 'faction' && !pool.length) continue;
    return { state, r2, kind, fid: kind === 'faction' ? pick(pool) : 'fa', weeks: Math.max(1, Math.round((i + 1) / r.legs.length * 2)) };
  }
  return null;
}
function travelGo(to, r, weeks) {
  const pc = G.pc; pc.money -= r.cost; const from = G.loc;
  const used = [];
  const ctl = chance(detectChance());
  const stop = transferStop(r);
  if (stop) return transit(stop.r2, from, stop.state, () => {
    G.loc = stop.state; pc.flags.stage = 'contrats'; pc.flags.acts = {}; pc.flags.cityActs = null; advance(stop.weeks); if (G.status !== 'play') return;
    logEntry(`Escale forcée à ${capName(stop.state)}.`);
    show({ kicker: 'ORBITRAIL · ESCALE FORCÉE', title: stop.kind === 'fa' ? 'Le train s’arrête' : 'Des intrus à bord', text: [stop.kind === 'fa' ? `À la correspondance de ${esc(capName(stop.state))}, la Force d’Autorité fait descendre tout le monde : contrôle général.` : `À la correspondance de ${esc(capName(stop.state))}, des membres de ${esc(F[stop.fid].name)} montent dans ta rame. Ils te cherchaient.`, '<span class="mut">Tu devras refaire ton trajet depuis cette ville.</span>'], choices: [C('Continuer', () => (stop.kind === 'fa' ? controleFA(stop.r2) : ambushCard(stop.fid)), { cls: 'cta' })] });
  });
  transit(r, from, to, () => {
    G.loc = to; pc.flags.stage = 'contrats'; pc.flags.acts = {}; pc.flags.cityActs = null; advance(weeks); if (G.status !== 'play') return;
    logEntry(`Voyage : ${capName(from)} → ${capName(to)}.`); if (chance(0.12)) { const tl = Math.max(1, Math.min(Math.round(pc.hpMax * rr(0.04, 0.08)), pc.hp - 1)); pc.hp -= tl; toast(`🥱 Voyage éprouvant : −${tl} PV`); }
    if (ctl) return controleFA(r);
    const ev = randomTravelEvent(); if (ev) return ev();
    contractCard(used.length ? 'Tu as utilisé : ' + used.join(', ') + '.' : 'Le train glisse sans histoire.');
  });
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
  L.push(C('← Retour', cityBack)); show({ kicker: 'Repos', title: 'Se reposer', text: ['Un lit, un toit, quelques jours sans courir. Mais le monde, lui, ne s’arrête pas.'], choices: L });
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
  L.push(C('← Retour', cityBack)); show({ kicker: 'Rencontres', title: 'Qui est dans le coin ?', text: ['Les gens que tu peux rencontrer à ' + esc(capName(G.loc)) + '. Un chef de faction ne s’engage pas en quelques mots.'], choices: L });
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
  if (lead && lead.id === pc.faction && G.world.leader[pc.faction] === cid) { const ct = pc.flags.chiefWk; const cool = ct != null && G.wk - ct < 8; const here = G.world.npc[cid].loc === G.loc; const ac = pc.flags.chiefTemp;
    L.push(C('Lui demander son aide (temporaire)', () => chiefHelp(cid), { ic: '🆘', sub: `Il t’accompagne ${CHIEF_DESTS} destinations, puis retourne à ses devoirs. Une fois toutes les 8 semaines.`, req: { ok: () => ac ? 'Il est déjà à tes côtés' : !here ? 'Il n’est pas ici (' + capName(G.world.npc[cid].loc) + ')' : cool ? 'Il t’a déjà aidé récemment' : G.world.npc[cid].st === 'captured' ? 'Il est captif' : null } })); }
  L.push(C('Parler et se renseigner', () => { if (tension(cid, {}, 0.12)) return; const L2 = fx({ rep: { [c.faction]: 1 }, spill: false }); show({ kicker: c.name, title: 'Une conversation', text: [`${esc(c.name)} te parle de ${esc(F[c.faction].name)} : « ${esc(F[c.faction].goal)} »`, G.world.stoneClue && lead ? '' : `Il te glisse une rumeur : ${rumor()}`], fx: L2, choices: [C('Continuer', cityMenu)] }); }));
  if (isAnti(c.faction) && c.stars && pc.faction !== c.faction) L.push(C('Le dénoncer à la Force d’Autorité (récompense)', () => betray(cid), { cls: 'danger', sub: 'Trahison : sa faction et ses alliés t’en voudront.' }));
  L.push(C('← Retour', recruitMenu));
  show({ extra: portrait(c.id, 150), kicker: F[c.faction].name, title: c.name, text: [`${esc(c.name)} — ${c.gender === 'H' ? 'homme' : c.gender === 'F' ? 'femme' : 'non-binaire'}, ${esc(c.age)}. Origine : ${esc(stateName(c.origin))}. Style : ${STYLES[c.style || 'brawler'].name}.`, `Pouvoir : ${esc(charPowerText(c))}.`, lead ? '<b>Chef de sa faction.</b>' : '', `Ton lien avec sa faction : ${repLevel(rep)} (${rep}).`], choices: L });
}
// Une discussion peut déraper : insulte, vieux contentieux, faction ennemie… et finir en bagarre
function tension(cid, ctx, p0) {
  const c = CH[cid], pc = G.pc; if (!c || pc.faction === c.faction && !ctx.bad) return false;
  const rep = pc.rep[c.faction] || 0; const foe = (isAnti(c.faction) !== isAnti(pc.faction)) || rep < -10;
  const p = p0 + (foe ? 0.25 : 0) + (rep > 25 ? -0.1 : 0) + (ctx.bad ? 0.15 : 0); if (Math.random() > p) return false;
  const tier = clamp(c.stars, 1, 5); const fn = () => startCombat({ title: `${c.name} t’attaque`, foes: [mkFoe('porteur', tier, c.name + ' (' + F[c.faction].name + ')', { cid: c.id })], noScale: true, lethal: 'capture', intro: 'Les mots ne suffisent plus.',
    onWin: L => show({ kicker: c.name, title: 'Calmé', text: [`${esc(c.name)} recule, la mâchoire serrée. La discussion est close.`], fx: [...L, ...fx({ rep: { [c.faction]: -3 }, xp: 12 })], choices: [C('Continuer', cityMenu)] }),
    onFlee: () => show({ title: 'Tu t’éclipses', text: ['Tu tournes les talons avant que ça dégénère davantage.'], fx: fx({ rep: { [c.faction]: -2 } }), choices: [C('Continuer', cityMenu)] }) });
  show({ extra: portrait(c.id, 130), kicker: c.name, title: 'Ça dégénère', text: [`${esc(c.name)} change de ton. ${ctx.line || 'Un mot de trop, un regard de travers.'}`, 'Sa main s’approche de son arme.'], choices: [
    C('Se battre', fn, { cls: 'danger', ic: '⚔️' }),
    C('Tenter de le calmer', () => { const r = check('charisme', 12 + 2 * tier, ['social']); if (r.ok) show({ kicker: c.name, title: 'Ça retombe', text: [`${esc(c.name)} souffle et baisse la garde.`, checkLine(r)], fx: fx({ xp: 8 }), choices: [C('Continuer', cityMenu)] }); else { show({ kicker: c.name, title: 'Raté', text: ['Il ne veut plus rien entendre.', checkLine(r)], choices: [C('Se défendre', fn, { cls: 'danger' })] }); } }, { odds: ['charisme', 12 + 2 * tier, ['social']], ic: '🕊️' }),
    C('Partir sans un mot', () => { const L2 = fx({ rep: { [c.faction]: -1 } }); show({ title: 'Tu t’éloignes', text: ['Tu laisses tomber. Il te suit des yeux.'], fx: L2, choices: [C('Continuer', cityMenu)] }); })] });
  return true;
}
function recruit(cid, price, viaCha) {
  const c = CH[cid]; const pc = G.pc;
  if (viaCha) { const r = check('charisme', 12 + c.stars * 2, ['social']); if (!r.ok) { if (tension(cid, { bad: true, line: 'Ton insistance l’agace.' }, 0.3)) return; return show({ kicker: c.name, title: 'Refus', text: [`${esc(c.name)} te regarde de haut en bas. « Non. »`, checkLine(r)], choices: [C('Continuer', cityMenu)] }); } }
  pc.money -= price; addAlly(cid, viaCha ? 50 : 60); addRep(c.faction, -2, { spill: false });
  logEntry(`${c.name} rejoint ton groupe.`);
  show({ kicker: c.name, title: 'Une recrue', text: [`${esc(c.name)} te rejoint. Veille à sa loyauté : les ordres douteux et les échecs la font baisser.`], choices: [C('Continuer', cityMenu)] });
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
  L.push(C(`Techniques anti-géno (${antiKnown().length}/7)`, antiMenu, { ic: '🧬', sub: 'Une technique par séance · 300 🪙', req: { ok: () => antiKnown().length >= 7 ? 'Tu les maîtrises toutes' : null } }));
  const cap = roleCap();
  L.push(C(`Choisir un rôle (${pc.roles.length}/${cap})`, roleMenu, { sub: pc.roles.length ? pc.roles.map(r => ROLES[r].name).join(', ') : 'Éclaireur, combattant, artilleur, leader, médecin, ingénieur…', req: { ok: () => pc.grade < 1 ? 'Les rôles se choisissent à ta première promotion' : null } }));
  L.push(C('← Retour', cityBack));
  const left = capActs(L, 'train', /rôle/i);
  show({ kicker: 'Progression', title: 'S’entraîner', text: [`<span class="mut">XP ${pc.xp} · ${left ? 'une séance possible' : 'séance déjà faite'} dans cette ville</span>`], choices: L, tiles: true });
}
const roleCap = () => 2 + Math.floor(G.pc.grade / 2);
function roleMenu() {
  const pc = G.pc; const cap = roleCap(); const L = []; const free = !pc.flags.roleTaken && !pc.roles.length; const cost = free ? 0 : 150;
  Object.entries(ROLES).forEach(([id, r]) => {
    const has = pc.roles.includes(id); const rq = { attr: {}, ok: () => (!has && pc.roles.length >= cap) ? `Tu ne peux pas avoir plus de ${cap} rôle(s) à ton grade` : null };
    if (r.req.attr) rq.attr[r.req.attr[0]] = r.req.attr[1]; if (r.req.grade) rq.grade = r.req.grade;
    const okStyle = !r.req.style || r.req.style.includes(pc.style);
    const lockStyle = okStyle ? null : `Style requis : ${r.req.style.map(s => STYLES[s].name).join(' / ')}`;
    const ch = C(`${has ? '✔ ' : ''}${r.name}`, () => { if (has) pc.roles = pc.roles.filter(x => x !== id); else { pc.money -= cost; pc.roles.push(id); pc.flags.roleTaken = true; } logEntry(has ? `Tu abandonnes le rôle ${r.name}.` : `Tu deviens ${r.name}.`); toast(has ? `Rôle abandonné : ${r.name}` : `${ROLE_IC[id] || ''} Tu deviens ${r.name}`); sfx('win'); if (pc.flags.rolePromo) { pc.flags.rolePromo = false; return hub(); } cityMenu(); }, { ic: ROLE_IC[id] || '◆', sub: `${r.desc}${has ? ' · rôle acquis' : free ? ' · 🎁 gratuit (premier rôle)' : ' · 150 ¢'}`, cls: has ? 'safe' : '', req: has ? null : Object.assign(rq, free ? {} : { money: 150 }) });
    if (lockStyle && !has) ch.lock = ch.lock || lockStyle; L.push(ch);
  });
  L.push(C(pc.flags.rolePromo ? 'Plus tard' : '← Retour', () => { if (pc.flags.rolePromo) { pc.flags.rolePromo = false; return hub(); } trainMenu(); }, pc.flags.rolePromo ? { cls: 'back' } : undefined)); show({ kicker: 'Rôles', title: `Choisir un rôle (${pc.roles.length}/${cap})`, text: ['Un rôle donne +2 aux jets de son domaine et ouvre des contrats dédiés. Touche un rôle acquis pour l’abandonner.'], choices: L, tiles: true });
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

// ───────── Bilan de la destination (bandeau sur la carte de départ) ─────────
function recapChips() {
  const pc = G.pc, s = pc.flags.snap; const sg = n => (n > 0 ? '+' : '') + n; const chips = [];
  const add = (ic, v, unit) => { if (v) chips.push({ t: `${ic} ${sg(v)}${unit}`, c: v > 0 ? 'good' : 'badc' }); };
  add('₵', pc.money - s.money, ' ¢'); add('✦', pc.xp - s.xp, ' XP'); add('🎖', pc.merit - s.merit, ' mérite'); add('♥', pc.hp - s.hp, ' PV'); add('💎', stoneCount() - s.st, ' pierre');
  const rv = Object.keys(pc.rep).map(k => [k, (pc.rep[k] || 0) - ((s.rep || {})[k] || 0)]).filter(x => x[1]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
  if (rv) chips.push({ t: `🤝 ${F[rv[0]] ? F[rv[0]].name : rv[0]} ${sg(rv[1])}`, c: rv[1] > 0 ? 'good' : 'badc' });
  return { loc: s.loc, wks: G.wk - s.wk, chips };
}

// « ← Retour » d'un sous-menu de ville : si tu n'as rien fait dedans, l'action t'est rendue.
const cityMark = () => { const pc = G.pc; return [pc.money, Math.round(pc.hp), pc.en, G.wk, pc.roles.length, pc.party.length, Object.values(pc.inv).reduce((a, b) => a + b, 0), pc.xp].join('|'); };
function cityBack() { const f = G.pc.flags; if (f.cityMark && f.cityMark === cityMark() && (f.cityActs || 0) <= 0) f.cityActs = 1; f.cityMark = null; cityMenu(); }

// ───────── Techniques anti-géno : à apprendre une par une ─────────
const ANTI_IC = { buff: ['💪', 'Force infatigable : +1 à tous tes jets de combat'], rebound: ['🔄', 'Dévie les projectiles : bouclier de 6 au départ'], shield: ['🛡', 'Corps de verre : bouclier de 8 au départ'], restore: ['💚', 'Régénération : +1 ❤ par round, +1 ⚡ un round sur deux'], foresight: ['👁', 'Anticipation : −1 dégât sur chaque coup reçu'], shock: ['⚡', 'Onde de choc : ton premier round gagné donne +2 au suivant'], dash: ['💨', 'Esquive aérienne : tu évites la première riposte'] };
const antiKnown = () => Object.keys(G.pc.flags.anti || {}).filter(k => G.pc.flags.anti[k]);
const hasAnti = id => !!(G.pc.flags.anti && G.pc.flags.anti[id]);
function antiMenu() {
  const pc = G.pc; const L = Object.keys(ANTI_IC).map(id => { const known = hasAnti(id); const [ic, d] = ANTI_IC[id];
    return C(`${known ? '✔ ' : ''}${ANTI[id].n}`, () => { if (known) return; pc.money -= 300; advance(1); if (G.status !== 'play') return; pc.flags.anti = pc.flags.anti || {}; pc.flags.anti[id] = true; logEntry(`Technique anti-géno : ${ANTI[id].n}.`); toast(`${ic} ${ANTI[id].n} apprise`); sfx('win'); cityMenu(); }, { ic, sub: d, cls: known ? 'safe' : '', req: known ? { ok: () => 'Déjà apprise' } : { money: 300 } }); });
  L.push(C('← Retour', cityBack)); show({ kicker: 'Techniques anti-géno', title: `${antiKnown().length}/7 maîtrisées`, text: ['Enseignées à la F.A., accessibles à toutes. Une seule par séance.'], choices: L, tiles: true });
}

// ───────── Demander l'aide de son propre chef : il ne rejoint pas ton groupe, il intervient quelques destinations ─────────
const CHIEF_DESTS = 2;
function chiefHelp(cid) {
  const pc = G.pc; const c = CH[cid]; const nm = esc(c.name);
  if (!allyData(cid)) { addAlly(cid, 90); const a = allyData(cid); if (a) { a.temp = true; a.hp = a.hpMax; } }
  pc.flags.chiefTemp = { id: cid, left: CHIEF_DESTS }; pc.flags.chiefWk = G.wk; logEntry(`${c.name}, chef de ta faction, t’accompagne quelque temps.`);
  show({ extra: portrait(cid, 130), kicker: 'APPUI DU CHEF', title: `${nm} te rejoint`, text: [`« Je te prête mon aide, mais ne compte pas sur moi plus longtemps. » ${nm} t’accompagne pour ${CHIEF_DESTS} destinations, puis reprendra ses responsabilités.`], fx: fx({ xp: 6 }), choices: [C('Continuer', cityMenu, { cls: 'cta' })] });
}
function chiefTick() {
  const pc = G.pc, t = pc.flags.chiefTemp; if (!t) return; t.left--;
  if (t.left > 0) return;
  pc.flags.chiefTemp = null; if (allyData(t.id)) { removeAlly(t.id, 'free'); toast(`${CH[t.id].name} retourne à ses devoirs`); logEntry(`${CH[t.id].name} te quitte pour reprendre la direction de la faction.`); }
}
