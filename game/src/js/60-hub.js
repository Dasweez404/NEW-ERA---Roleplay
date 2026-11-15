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

function actionsMenu() {
  if (G.status !== 'play') return;
  const pc = G.pc; recalc();
  if (pc.flags.cap) return capturedMenu();
  const f = F[pc.faction];
  const L = [];
  L.push(C('Voyager (Orbitrail)', travelMenu, { ic: '🚆', sub: 'Se déplacer d’État en État. Chaque trajet est suivi par les autorités.' }));
  L.push(C('Pierres antiques', stoneMenu, { ic: '💎', sub: `${stoneCount()}/16 · indices, temples, détenteurs` }));
  L.push(C('Faction : ' + f.name, factionMenu, { ic: '🏴', sub: pc.faction === 'civils' ? 'Tu n’as pas de faction : tu peux en rejoindre une.' : `${gradeName()} · réputation ${repLevel(pc.rep[pc.faction] || 0)}` }));
  L.push(C('En ville', cityMenu, { ic: '🏙', sub: 'Repos, marché, recrues, entraînement, retraite.' }));
  L.unshift(C('Contrats ici', () => contractCard(), { ic: '🎯', sub: 'Missions de ta faction, du Marché Noir, de notables locaux.' }));
  L.unshift(C('Continuer l’aventure', hub, { ic: '▶', cls: 'safe', sub: 'Missions, rencontres, événements : tout arrive ici, carte après carte.' }));
  show({ kicker: 'ACTIONS · ' + dateStr(), title: `${capName(G.loc)} · ${stateName(G.loc)}`, text: hubText().slice(0, 1), choices: L, tiles: true, banner: true });
}
function cityMenu() {
  const pc = G.pc; const L = [];
  baseTile(L); atelierTile(L);
  L.push(C('Se reposer', restMenu, { ic: '🛏', sub: 'Soigner, recharger, se faire oublier.' }));
  L.push(C('Marché', () => shopMenu(false), { ic: '🛒', sub: 'Armes, armures, gadgets, soins.' }));
  L.push(C('Recruter', recruitMenu, { ic: '🤝', sub: `Groupe : ${pc.party.length}/${partyMax()}` }));
  L.push(C('S’entraîner', trainMenu, { ic: '🎓', sub: 'Expérience, rôles, formation anti-geno.' }));
  L.push(C('Retraite', retireConfirm, { ic: '🌴', sub: 'Terminer la partie avec un bonus de score (×1,25).', cls: 'danger' }));
  L.push(C('← Retour', actionsMenu, { cls: 'back' }));
  show({ kicker: 'EN VILLE', title: capName(G.loc), text: [], choices: L, tiles: true });
}
function pendingEvents() {
  // événements en attente (ex. conseil de faction, menace sur pierre) posés par monthTick
  const q = G.pc.flags.queue; if (q && q.length) { const e = q.shift(); if (!q.length) delete G.pc.flags.queue; const fn = EVENT_FN[e.id]; if (fn) { fn(e.arg); return () => { }; } }
  return null;
}
const EVENT_FN = {};

// ───────── Voyager ─────────
function travelMenu(pre) {
  const here = G.loc; const ids = DATA.states.map(s => s.id).filter(i => i !== here); let sel = null; let box; const reco = recoStates();
  const info = h('div', { class: 'travelinfo' }, h('span', { class: 'mut' }, 'Touche une destination, puis touche-la encore pour partir.'));
  const select = to => {
    const r = otRoute(here, to); if (!r) return; const weeks = 1 + Math.floor((r.hops - 1) / 4);
    if (sel === to) { if (G.pc.money < r.cost) { toast('Pas assez de crédits (' + r.cost + ' ¢)'); return; } return travelGo(to, r, weeks); }
    sel = to; sfx('click'); box.setRoute(r);
    info.innerHTML = ''; info.append(h('b', {}, `${capName(here)} → ${capName(to)}`), h('span', { class: 'mut' }, ` · ${routeText(r)}`), h('div', {}, `${r.hops} arrêt(s) · ${weeks} sem. · `, h('b', { class: G.pc.money < r.cost ? 'badc' : 'acc' }, r.cost + ' ¢'), ` · contrôle ~${Math.round(detectChance() * 100)} %${pc_hasFaux() ? ' (faux papiers)' : ''}`), feat('monde') && G.world.terr[to] ? h('div', { class: 'small mut' }, 'Contrôle : ' + (G.world.terr[to] === 'pc' ? 'ta faction' : F[G.world.terr[to]] ? F[G.world.terr[to]].name : G.world.terr[to])) : null, reco.has(to) ? h('div', { class: 'recotxt2' }, '★ Conseillé : ' + reco.get(to).join(' · ')) : null, h('div', { class: G.pc.money < r.cost ? 'badc' : 'acc' }, G.pc.money < r.cost ? 'Pas assez de crédits' : '▶ Touche encore ' + capName(to) + ' pour partir'));
  };
  box = mapBox({ here, pick: new Set(ids), onPick: select, reco, terr: feat('monde') });
  if (pre) setTimeout(() => select(pre), 30);
  show({ kicker: 'Orbitrail', title: 'Où veux-tu aller ?', text: [], extra: h('div', {}, box, info), choices: [C('Choisir dans la liste', travelList), C('🛴 Voyager autrement (véhicule)', vehicleMenu, { sub: 'Trottinette, vélo volant, hoverboard, skis, voiture, vaisseau…' }), C('← Retour', actionsMenu, { cls: 'back' })] });
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
function travelGo(to, r, weeks) {
  const pc = G.pc; pc.money -= r.cost; const from = G.loc;
  const used = [];
  if (pc.faux > 0) { pc.faux--; used.push('faux papiers'); } if (pc.brouil > 0) { pc.brouil--; used.push('brouilleur'); }
  const ctl = chance(detectChance());
  transit(r, from, to, () => {
    G.loc = to; advance(weeks); if (G.status !== 'play') return;
    logEntry(`Voyage : ${capName(from)} → ${capName(to)}.`);
    if (ctl) return controleFA(r);
    const ev = randomTravelEvent(); if (ev) return ev();
    contractCard(`Le train glisse sans histoire jusqu’à ${esc(capName(to))}. ${used.length ? 'Tu as utilisé : ' + used.join(', ') + '. ' : ''}Avant de reprendre l’intrigue, quelques contrats se présentent.`);
  });
}
function travelHover() {
  show({ kicker: 'Scout-hover', title: 'Cap sur…', text: ['Hors du réseau : pas de contrôle de gare, mais les dérèglements de l’ogénite ne préviennent pas. Coût : 120 ¢ de carburant (capsules OGEN), 1 à 3 semaines.'], choices: [...CONT.flatMap(ct => DATA.states.filter(s => s.continent === ct && s.id !== G.loc).map(s => C(`${s.capital} — ${s.name}`, () => hoverGo(s.id), { sub: ct, req: { money: 120 } }))), C('← Retour', travelMenu)] });
}
function hoverGo(to) {
  G.pc.money -= 120; const from = G.loc; G.loc = to; advance(rint(1, 3)); if (G.status !== 'play') return; logEntry(`Vol en scout-hover vers ${capName(to)}.`);
  if (chance(0.45)) return climateEvent(); show({ kicker: 'Scout-hover', title: 'Vol sans encombre', text: [`Tu atterris à ${esc(capName(to))}. Personne ne sait que tu es là.`], choices: [C('Continuer', hub)] });
}

// ───────── Repos ─────────
function restMenu() {
  const pc = G.pc; const L = [];
  L.push(C('Dormir quelques jours (1 semaine)', () => doRest(1), { sub: 'Récupère ~25 % PV et énergie. Gratuit.' }));
  L.push(C('Se faire soigner correctement (2 semaines, 80 ¢)', () => doRest(2, 80), { sub: 'Récupère tout. Soigne aussi les alliés.', req: { money: 80 } }));
  L.push(C('Se mettre au vert pendant 1 mois', () => lieLow(), { sub: 'La prime baisse ; tu récupères tout, mais ton argent fond (coût de la vie 60 ¢).', req: { money: 60 } }));
  L.push(C('Chercher un contact des Siha Mujahaz (soins clandestins)', () => { addRep('siha', 2, { spill: false }); doRest(1, 0, true); }, { sub: 'Soins gratuits mais discrets, si la Siha t’apprécie.', req: { rep: { siha: 10 } } }));
  L.push(C('← Retour', cityMenu)); show({ kicker: 'Repos', title: 'Se reposer', text: ['Un lit, un toit, quelques jours sans courir. Mais le monde, lui, ne s’arrête pas.'], choices: L });
}
function doRest(weeks, cost = 0, free) {
  const pc = G.pc; pc.money -= cost; advance(weeks); if (G.status !== 'play') return;
  const full = weeks >= 2 || free; const dh = full ? pc.hpMax : Math.round(pc.hpMax * 0.25), de = full ? pc.enMax : Math.round(pc.enMax * 0.25);
  pc.hp = Math.min(pc.hpMax, pc.hp + dh + PK('rest') * 4); pc.en = Math.min(pc.enMax, pc.en + de); if (full) pc.party.forEach(a => { a.inj = 0; a.hp = a.hpMax; });
  const ev = chance(0.18) && randomHubEvent(); if (ev) return ev();
  show({ kicker: 'Repos', title: 'Tu te sens mieux', text: ['Les jours passent. Les bleus s’effacent.'], choices: [C('Continuer', hub)] });
}
function lieLow() {
  const pc = G.pc; pc.money -= 60; const L = []; advance(4); if (G.status !== 'play') return;
  if (pc.heat > minHeat()) { addHeat(-12, L); } pc.hp = pc.hpMax; pc.en = pc.enMax; pc.party.forEach(a => { a.inj = 0; a.hp = a.hpMax; });
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
  L.push(C('Entraînement intensif (1 semaine, 100 ¢)', () => { pc.money -= 100; advance(1); if (G.status !== 'play') return; const L2 = fx({ xp: rint(20, 40) }); show({ kicker: 'Entraînement', title: 'Sueur et progrès', text: ['Une semaine à repousser tes limites.'], fx: L2, choices: [C('Continuer', trainMenu)] }); }, { req: { money: 100 } }));
  L.push(C('Formation aux techniques anti-geno (3 semaines, 500 ¢)', () => { pc.money -= 500; advance(3); if (G.status !== 'play') return; pc.flags.antigeno = true; show({ kicker: 'Formation', title: 'Techniques anti-geno', text: ['Buff, Rebound, Shield, Restore, Foresight, Shock, Dash : accessibles à toutes, enseignées à la F.A. — tu les maîtrises désormais (+2 dégâts, +1 défense en combat).'], choices: [C('Continuer', hub)] }); }, { req: { money: 500, notFlag: 'antigeno' } }));
  const cap = 1 + Math.floor(pc.grade / 2);
  L.push(C(`Choisir un rôle (${pc.roles.length}/${cap})`, roleMenu, { sub: pc.roles.length ? pc.roles.map(r => ROLES[r].name).join(', ') : 'Éclaireur, combattant, artilleur, leader, médecin, ingénieur…', req: { ok: () => pc.missions < 3 ? 'Il faut avoir mené au moins 3 missions pour qu’on te reconnaisse un rôle' : null } }));
  L.push(C('Répartir les points d’attribut', () => { UI.tab = 'perso'; render(); }, { req: { ok: () => pc.pts > 0 ? null : 'Aucun point disponible (l’expérience en donne : 1 point tous les 80 XP)' } }));
  L.push(C('← Retour', cityMenu)); show({ kicker: 'Progression', title: 'S’entraîner', text: [`XP : ${pc.xp} · points disponibles : ${pc.pts}`], choices: L });
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
  show({ kicker: 'Retraite', title: 'Raccrocher ?', text: ['Tu peux poser les armes et vivre de ce que tu as accumulé. La partie s’arrête : ton score est multiplié par 1,25.', `Score actuel estimé : <b>${fmt(computeScore('retire'))}</b>.`], choices: [C('Prendre ma retraite', () => endGame('retire', '')), C('Non, continuer', hub)] });
}
