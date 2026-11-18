// ───────── Cœur des règles : jets, effets, réputation, prime, temps, fin de partie ─────────
function pcPowers() { return G.pc.powers.map(id => PW[id]).filter(Boolean); }
function powerTags() {
  const m = {}; const hyb = G.pc.ptype === 'hybride';
  pcPowers().forEach(p => p.tags.forEach(t => { const b = Math.max(1, (p.type === 'elementaire' ? 3 : 2) - (hyb ? 1 : 0)); m[t] = Math.max(m[t] || 0, b + (G.pc.awakened ? 0 : 0)); }));
  return m;
}
function gearTags() {
  const t = new Set(); const pc = G.pc;
  Object.keys(pc.inv).forEach(id => { const it = ITEMS[id]; if (it && it.t === 'gadget' && it.tags) it.tags.forEach(x => t.add(x)); });
  Object.keys(pc.inv).forEach(id => { const it = ITEMS[id]; if (it && it.t === 'vehicule' && it.v.armed) { t.add('combat'); t.add('ranged'); } });
  const w = weaponOf(); if (w) (w.tags || []).forEach(x => t.add(x));
  const a = armorOf(); if (a) (a.tags || []).forEach(x => t.add(x));
  return t;
}
function hasCap(tag) { return !!powerTags()[tag] || G.pc.roles.some(r => ROLES[r].tag === tag) || gearTags().has(tag) || STYLES[G.pc.style].tag === tag; }

function skill(attrId, tags = []) {
  const pc = G.pc; const parts = [[AT[attrId].short, A(attrId)]]; let mod = A(attrId);
  const pt = powerTags(); let best = 0, bt = null;
  tags.forEach(t => { if ((pt[t] || 0) > best) { best = pt[t]; bt = t; } });
  if (best) { parts.push([`pouvoir (${TAGNAME[bt] || bt})`, best]); mod += best; }
  const rts = []; pc.roles.forEach(r => { if (tags.includes(ROLES[r].tag)) rts.push(ROLES[r].name); });
  if (rts.length) { parts.push([`rôle ${rts[0]}`, 2]); mod += 2; }
  if (tags.includes(STYLES[pc.style].tag)) { parts.push(['style de combat', 1]); mod += 1; }
  const gt = gearTags(); const gm = Math.min(3, tags.filter(t => gt.has(t)).length * 2);
  if (gm) { parts.push(['équipement', gm]); mod += gm; }
  if (tags.includes('ally') && pc.party.length) { const b = Math.round(4 * teamF(pc.party.filter(a => a.inj <= 0).length)); if (b) { parts.push(['alliés', b]); mod += b; } }
  if (!tags.includes('ally') && pc.party.length) { const b = Math.round(3 * teamF(pc.party.filter(a => a.inj <= 0).length)); if (b) { parts.push(['équipe', b]); mod += b; } }
  const pb = perkChk(tags); if (pb) { parts.push(['particularité', pb]); mod += pb; }
  if (PK('night') && typeof envTime === 'function' && envTime() === 'night') { parts.push(['nuit', PK('night')]); mod += PK('night'); }
  if (pc.stim > 0) { parts.push(['stimulant', 3]); mod += 3; }
  if (pc.enMax > 0 && pc.en <= 0 && pc.ptype !== 'aucun') { parts.push(['épuisé', -1]); mod -= 1; }
  { const hr = pc.hp / pc.hpMax; const wp = hr < 0.2 ? 3 : hr < 0.4 ? 2 : hr < 0.6 ? 1 : 0; if (wp) { parts.push(['blessé', -wp]); mod -= wp; } }
  if (pc.implant) { parts.push(['implant (nerfs)', -1]); mod -= 1; }
  { const bonus = mod - A(attrId); if (bonus > 6) { const cut = Math.floor((bonus - 6) / 2); parts.push(['plafond des bonus', -cut]); mod -= cut; } }
  return { mod, parts };
}
// Équilibrage : les difficultés (dc) écrites dans le jeu sont recalées sur une courbe douce (±9 % par niveau d'écart),
// et les bonus cumulés (pouvoir, rôle, style, matériel, équipe…) sont plafonnés pour qu'un perso spécialisé reste battable.
const dcEff = dc => Math.round(3.8 + 0.58 * dc);
function check(attrId, dc, tags = [], extra = 0) {
  const s = skill(attrId, tags); const r = rint(1, 20); const mod = s.mod + extra; const total = r + mod; const d = dcEff(dc);
  const res = { r, total, dc: d, mod, parts: s.parts, crit: r === 20, fumble: r === 1, attr: attrId };
  res.ok = res.crit || (!res.fumble && total >= d); res.quick = res.ok && !res.crit && clamp((21 - (d - mod)) / 20, 0.08, 0.93) >= 0.85;
  if (G.pc.stim > 0) G.pc.stim = 0;
  UI.roll = res;
  return res;
}
function odds(attrId, dc, tags = [], extra = 0) { const m = skill(attrId, tags).mod + extra; return clamp((21 - (dcEff(dc) - m)) / 20, 0.08, 0.93); }
const dcOf = (tier, mod = 0) => 10 + 3 * tier + mod;
function checkLine(r) { return `🎲 d20 ${r.r} + ${r.mod} = ${r.total} contre ${r.dc} — ${r.crit ? 'RÉUSSITE CRITIQUE' : r.fumble ? 'ÉCHEC CRITIQUE' : r.ok ? 'réussite' : 'échec'}`; }

// ───────── Réputation / prime ─────────
function repLevel(v) { return v <= -60 ? 'Ennemi juré' : v <= -20 ? 'Hostile' : v <= -10 ? 'Méfiant' : v < 15 ? 'Neutre' : v < 50 ? 'Amical' : v < 80 ? 'Allié' : 'Frère d’armes'; }
function addRep(fid, d, opts = {}) {
  if (!F[fid] || !d) return;
  const pc = G.pc; const before = pc.rep[fid] || 0; pc.rep[fid] = clamp(before + d, -100, 100);
  if (opts.spill === false) return;
  Object.keys(F).forEach(g => {
    if (g === fid || g === 'civils' || g === 'fallen') return;
    const rel = relation(fid, g); if (!rel) return;
    let k = 0;
    if (d > 0) k = rel > 0 ? 0.4 : -0.3; else k = rel > 0 ? 0.5 : 0.2;   // trahir un groupe : ses alliés t'en veulent aussi
    const dd = Math.round(d * k); if (dd) pc.rep[g] = clamp((pc.rep[g] || 0) + dd, -100, 100);
  });
}
function addHeat(n, lines) {
  const pc = G.pc; if (!n) return;
  if (G.world.era === 'newera' && n > 0) n = Math.ceil(n / 2);
  const s0 = wantedStars(); pc.heat = clamp(pc.heat + n, minHeat(), 100); const s1 = wantedStars();
  if (lines) { if (s1 > s0) lines.push({ t: `Ta prime augmente : ${starStr(s1)} — ${WANTED_TXT[s1]}`, c: 'badc' }); else if (s1 < s0) lines.push({ t: `Ta prime baisse : ${s1 ? starStr(s1) : 'plus de prime'}`, c: 'good' }); }
}
// Points de compétence : le k-ᵉ point demande de plus en plus d'XP (80 + 18 par point déjà gagné, cumulés)
const lvlFromXp = xp => { let k = 0, need = 0; while (k < 80) { need += 80 + 18 * k; if (xp < need) break; k++; } return k; };
function addXp(n) { const pc = G.pc; const o = lvlFromXp(pc.xp); pc.xp += n; pc.pts += lvlFromXp(pc.xp) - o; }

function fx(o) {
  const L = []; const pc = G.pc; const line = (t, c = '') => L.push({ t, c });
  if (o.money) { pc.money = Math.max(0, pc.money + o.money); line(`${o.money > 0 ? '+' : ''}${fmt(o.money)} ¢`, o.money > 0 ? 'good' : 'badc'); }
  if (o.xp) { const p0 = pc.pts; addXp(o.xp); line(`+${o.xp} XP`, 'good'); if (pc.pts > p0) line(`Niveau supérieur : +${pc.pts - p0} point${pc.pts - p0 > 1 ? 's' : ''}`, 'acc'); }
  if (o.hp) { const before = pc.hp; const dmg = o.hp < 0 && pc.hp < pc.hpMax * 0.4 ? Math.round(o.hp * 1.2) : o.hp; pc.hp = clamp(pc.hp + dmg, 0, pc.hpMax); line(`${o.hp > 0 ? '+' : ''}${pc.hp - before} PV`, o.hp > 0 ? 'good' : 'badc'); }
  if (o.en) { const b = pc.en; pc.en = clamp(pc.en + o.en, 0, pc.enMax); line(`${o.en > 0 ? '+' : ''}${pc.en - b} énergie`, o.en > 0 ? 'good' : 'badc'); }
  if (o.heat) addHeat(o.heat, L);
  if (o.merit && pc.faction !== 'civils') { pc.merit = Math.max(0, pc.merit + o.merit); line(`${o.merit > 0 ? '+' : ''}${o.merit} mérite (${F[pc.faction].name})`, o.merit > 0 ? 'good' : 'badc'); }
  if (o.rep) for (const fid in o.rep) { if (!F[fid]) continue; addRep(fid, o.rep[fid], { spill: o.spill }); line(`${F[fid].name} : ${o.rep[fid] > 0 ? '+' : ''}${o.rep[fid]} (${repLevel(pc.rep[fid])})`, o.rep[fid] > 0 ? 'good' : 'badc'); }
  if (o.item) for (const id in o.item) { giveItem(id, o.item[id]); line(`Obtenu : ${ITEMS[id].n}${o.item[id] > 1 ? ' ×' + o.item[id] : ''}`, 'good'); }
  if (o.attr) for (const a in o.attr) { pc.attrs[a] += o.attr[a]; line(`${AT[a].short} +${o.attr[a]}`, 'good'); recalc(); }
  if (o.flag) { (Array.isArray(o.flag) ? o.flag : [o.flag]).forEach(f => pc.flags[f] = true); }
  if (o.news) newsPush(o.news);
  if (o.log) logEntry(o.log);
  if (o.stone) L.push(...gainStone(o.stone));
  if (o.ally) { const ok = addAlly(o.ally, o.loy || 60); if (ok) line(`${CH[o.ally].name} rejoint ton groupe.`, 'good'); }
  recalc(); return L;
}
function gainStone(id) {
  const s = STONE[id]; const pc = G.pc; const L = [];
  if (pc.stones[id]) return L;
  pc.stones[id] = G.wk; G.world.stoneHolder[id] = 'pc'; G.world.stoneLoc[id] = G.loc; G.score.stones = Math.max(G.score.stones, stoneCount());
  splash({ title: 'PIERRE ' + s.name.toUpperCase(), sub: `${stoneCount()}/16 pierres antiques`, color: s.color, icon: '💎', ms: 2300 }); sfx('stone'); buzz([30, 40, 80]);
  L.push({ t: `✨ Pierre antique de ${s.name} obtenue (${stoneCount()}/16) ! +1 ${AT[STONE_ATTR[id]].short}`, c: 'acc' });
  logEntry(`Pierre de ${s.name} obtenue.`);
  newsPush(`La pierre antique ${s.name} a changé de mains.`);
  recalc(); pc.hp = Math.min(pc.hpMax, pc.hp + 4); pc.en = Math.min(pc.enMax, pc.en + 2);
  const n = stoneCount(); if (n === 4) L.push({ t: '🌟 Résonance : 4 pierres — +1 à tous les attributs.', c: 'acc' });
  if (n === 8) L.push({ t: '🌟 Aura : 8 pierres — tes pouvoirs s’éveillent plus facilement et sans risque.', c: 'acc' });
  if (n === 12) L.push({ t: '⚠️ Convergence : 12 pierres — le Panthéon et Néo te traquent désormais.', c: 'warnc' });
  return L;
}
function loseStone(id, toFaction) {
  delete G.pc.stones[id]; G.world.stoneHolder[id] = toFaction; G.world.stoneLoc[id] = F[toFaction] ? F[toFaction].hq : G.loc; recalc();
  logEntry(`Pierre de ${STONE[id].name} perdue.`);
}

// ───────── Temps ─────────
function advance(weeks) {
  for (let i = 0; i < weeks; i++) {
    G.wk++;
    const pc = G.pc;
    pc.hp = Math.min(pc.hpMax, pc.hp + Math.max(1, Math.round(pc.hpMax * 0.02))); pc.en = Math.min(pc.enMax, pc.en + (G.wk % 2 ? 1 : 0));
    pc.party.forEach(a => { if (a.inj > 0) a.inj--; if (a.inj <= 0) a.hp = Math.min(a.hpMax, a.hp + 3); });
    if (G.wk % 4 === 0) { monthTick(); const dd = dateOf(G.wk); if (dd.m === 0) splash({ title: String(dd.y), sub: 'Une nouvelle année commence', cls: 'year' }); }
    if (G.status !== 'play') return;
  }
}

// ───────── Fin de partie ─────────
function isLeader() { return G.pc.grade >= 5; }
function computeScore(kind) {
  const pc = G.pc, s = G.score; let sc = 0;
  sc += stoneCount() * 600 + pc.grade * 400 + pc.merit * 2 + Math.round(pc.money / 25);
  sc += Object.values(pc.rep).filter(v => v >= 50).length * 80 + pc.party.length * 60 + (s.missions || 0) * 15;
  sc += (s.terr || 0) * 200 + (s.wins || 0) * 25 + (isLeader() ? 1500 : 0) + Math.floor(G.wk / 4) * 10 + (s.saved || 0) * 30;
  if (G.world.era === 'newera') sc += 1500;
  if (kind === 'win') sc += 15000; if (kind === 'dead') sc = Math.round(sc * 0.6); if (kind === 'retire') sc = Math.round(sc * 1.25);
  return Math.round(sc);
}
function endGame(kind, cause) {
  G.status = kind; const sc = computeScore(kind);
  pushScore({ name: G.pc.name, faction: F[G.pc.faction].name, score: sc, kind, grade: G.pc.grade, stones: stoneCount(), months: Math.floor(G.wk / 4), date: dateStr() });
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  showEnding(kind, cause, sc);
}
function pcDie(cause) {
  const ally = G.pc.party.find(a => a.loy >= 70 && a.inj <= 0 && chance(0.5));
  if (ally && !G.pc.flags.rescued && chance(0.6)) {
    G.pc.flags.rescued = true; G.pc.hp = 3;
    return { rescued: CH[ally.id].name };
  }
  endGame('dead', cause); return null;
}

// Options à seuil d'attribut : certaines options ne s'ouvrent que si tu as assez de Corps, de Charisme… (jamais toutes : la plus adaptée reste libre).
const gateNeed = t => clamp(3 + Math.round(t * 1.1), 4, 9);
function gateSet(opts, tier) {
  const need = gateNeed(tier); const g = new Map(); if (opts.length < 2) return g;
  const best = opts.reduce((bi, o, i) => A(o.attr) > A(opts[bi].attr) ? i : bi, 0);
  opts.forEach((o, i) => { if (i !== best && hashStr(o.lab) % 3 === 0) g.set(i, need); });
  return g;
}
