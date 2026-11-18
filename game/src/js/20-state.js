// ───────── État de partie, création de personnage, sauvegarde ─────────
let G = null;
const SAVE_KEY = 'newera.save.v1', SCORE_KEY = 'newera.scores.v1';
F.fa.allies = ['omega', 'manacorp', 'gamma']; F.omega.allies = ['fa'];
// bonus d'attribut par pierre (IMPROVISÉ : thème de l'élément)
const STONE_ATTR = { lumiere: 'charisme', plante: 'intellect', magma: 'corps', eau: 'maitrise', air: 'agilite', feu: 'corps', fumee: 'agilite', sable: 'intellect', acide: 'maitrise', roche: 'corps', foudre: 'agilite', glace: 'maitrise', gaz: 'charisme', metal: 'intellect', terre: 'corps', tenebres: 'maitrise' };
const START_YEAR = 2071, START_MONTH = 5; // juin 2071 (index 5)
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function dateOf(wk) { const mi = START_MONTH + Math.floor(wk / 4); return { y: START_YEAR + Math.floor(mi / 12), m: mi % 12, w: (wk % 4) + 1, key: (START_YEAR + Math.floor(mi / 12)) + '-' + String((mi % 12) + 1).padStart(2, '0') }; }
function dateStr(wk) { const d = dateOf(wk == null ? G.wk : wk); return `Sem. ${d.w} · ${MONTHS[d.m]} ${d.y}`; }
const monthKey = wk => dateOf(wk).key;

function relation(a, b) {
  if (!a || !b) return 0; if (a === b) return 2;
  if (G && G.world && G.world.rel && G.world.rel[a + '|' + b] != null) return G.world.rel[a + '|' + b];
  const A = F[a], B = F[b]; if (!A || !B) return 0;
  if (A.allies.includes(b) || B.allies.includes(a)) return 2;
  if (A.enemies.includes(b) || B.enemies.includes(a)) return -2;
  return 0;
}
const isAnti = fid => !!(F[fid] && F[fid].anti);
const gradeNames = pc => (pc.faction === 'fa' ? GRADES_FA : pc.faction === 'fallen' ? GRADES_FALLEN : GRADES);
const gradeName = pc => gradeNames(pc || G.pc)[(pc || G.pc).grade];

function statsForChar(c) {
  const total = [13, 16, 19, 22, 25, 28][c.stars] || 14;
  const st = STYLES[c.style] || STYLES.brawler;
  const w = {}; ATTRS.forEach(a => w[a.id] = 1 + (a.id === st.prim ? 3 : 0) + (a.id === st.sec ? 1.5 : 0) + (hashStr(c.id + a.id) % 100) / 100 * 1.4);
  const sum = Object.values(w).reduce((x, y) => x + y, 0); const attrs = {}; let used = 0;
  const rem = total - 10;
  ATTRS.forEach(a => { attrs[a.id] = 2 + Math.floor(rem * w[a.id] / sum); used += attrs[a.id] - 2; });
  let left = rem - used; const order = ATTRS.map(a => a.id).sort((x, y) => w[y] - w[x]);
  for (let i = 0; left > 0; i++, left--) attrs[order[i % 5]]++;
  ATTRS.forEach(a => attrs[a.id] = clamp(attrs[a.id], 1, 12));
  return attrs;
}
function fallbackPowers(c) {
  const out = []; const types = c.ptypes.filter(t => t !== 'aucun');
  types.forEach((t, i) => { const pool = DATA.powers.filter(p => p.type === t); out.push(pool[hashStr(c.id + t + i) % pool.length].id); });
  return out;
}
function gradeFromChar(c) {
  // Les étoiles = puissance, pas position : tout le monde commence Recrue, sauf le chef (le plus puissant de sa faction).
  if (Object.values(F).some(f => f.leaders.includes(c.id))) return 5;
  return 0;
}
function ageNum(s) { const m = String(s).match(/(\d+)-(\d+)/); return m ? Math.round((+m[1] + +m[2]) / 2) : 28; }
function ptypeOf(types) { const t = types.filter(x => x !== 'aucun'); return !t.length ? 'aucun' : t.length > 1 ? 'hybride' : t[0]; }

function blankPC() {
  return {
    name: '', gender: 'N/B', age: 24, origin: 'albion', faction: 'civils', powers: [], ptype: 'aucun', style: 'brawler',
    attrs: { corps: 3, agilite: 3, intellect: 3, charisme: 3, maitrise: 3 }, pts: 0, xp: 0, role: null, roles: [], grade: 0, merit: 0,
    hp: 30, hpMax: 30, en: 10, enMax: 10, money: 300, heat: 0, rep: {}, inv: { capsule: 1, kit: 2 }, eq: { arme: null, armure: null },
    party: [], stones: {}, flags: {}, charId: null, awakened: 0, stim: 0, faux: 0, brouil: 0, implant: null, identity: 'ok', missions: 0, injuredWk: 0,
    ownFaction: null,
  };
}

function initWorld() {
  const W = { stoneHolder: {}, stoneLoc: {}, fac: {}, terr: {}, npc: {}, leader: {}, news: [], era: 'regime', canonDone: {}, stoneClue: {}, stoneLv: {}, flags: {}, wanted: {} };
  DATA.stones.forEach(s => {
    W.stoneHolder[s.id] = s.holder;
    W.stoneLoc[s.id] = s.id === 'lumiere' ? 'albion' : (F[s.holder] ? F[s.holder].hq : s.temple);
    if (s.holder === 'pnj-levant') W.stoneLoc[s.id] = 'levant';
  });
  DATA.factions.forEach(f => {
    const mem = DATA.chars.filter(c => c.faction === f.id);
    const power = clamp(Math.round(mem.reduce((t, c) => t + c.stars * 2 + Math.min(c.ratio, 100) / 30, 0) / 2.2) + 8, 8, 100);
    W.fac[f.id] = { power: f.id === 'fa' ? 100 : power, money: 500 + power * 40, terr: [], war: {}, ally: {} };
    W.leader[f.id] = f.leaders[0] || null;
  });
  DATA.states.forEach(s => W.terr[s.id] = 'fa');
  W.fac.fa.terr = DATA.states.map(s => s.id);
  DATA.chars.forEach(c => {
    const lead = Object.values(F).find(f => f.leaders.includes(c.id));
    W.npc[c.id] = { loc: lead ? lead.hq : c.origin, alive: true, st: 'free', loy: 0, home: c.origin };
  });
  return W;
}

function giveItem(id, n = 1) { G.pc.inv[id] = (G.pc.inv[id] || 0) + n; }
function hasItem(id) { return (G.pc.inv[id] || 0) > 0; }
function takeItem(id, n = 1) { if (!hasItem(id)) return false; G.pc.inv[id] -= n; if (G.pc.inv[id] <= 0) delete G.pc.inv[id]; return true; }

function initRep(pc) {
  Object.keys(F).forEach(fid => {
    let r = 0;
    if (pc.faction && F[pc.faction]) r = relation(pc.faction, fid) * 8;
    if (fid === pc.faction) r = 30 + pc.grade * 10;
    pc.rep[fid] = clamp(r, -100, 100);
  });
  if (pc.faction === 'fa') Object.keys(F).forEach(fid => { if (isAnti(fid)) pc.rep[fid] = -35; });
  if (isAnti(pc.faction)) pc.rep.fa = -40;
  pc.rep.civils = pc.rep.civils || 10; pc.rep.noir = pc.rep.noir || 0;
}

function startGame(spec) {
  const pc = blankPC(); Object.assign(pc, spec.pc);
  pc.hp = pc.hpMax; G = { v: 1, wk: 0, pc, loc: pc.origin, world: null, log: [], status: 'play', score: { stones: 0 }, settings: { mode: spec.mode || 'libre', canon: spec.mode === 'canon' }, ver: 1, ts: Date.now() };
  G.world = initWorld(); G.fresh = true;
  if (pc.charId) { G.world.npc[pc.charId].alive = false; G.world.npc[pc.charId].st = 'pc'; const lead = Object.values(F).find(f => f.leaders.includes(pc.charId)); if (lead) G.world.leader[lead.id] = 'pc'; }
  const f0 = F[pc.faction]; G.loc = (pc.charId && f0 && f0.leaders.includes(pc.charId)) ? f0.hq : pc.origin;
  { const mem = DATA.chars.filter(c => c.faction === pc.faction && c.id !== pc.charId && G.world.npc[c.id].alive && !F[pc.faction].leaders.includes(c.id)); // la moitié de ta faction est dans les parages dès le départ
    shuffle(mem.slice()).slice(0, Math.ceil(mem.length / 2)).forEach(c => { G.world.npc[c.id].loc = G.loc; }); }
  pc.inv = { capsule: 2, kit: 2 }; startKit(pc);
  if (G.settings.mode === 'libre') setupLibre();
  initRep(pc); pc.ptype = ptypeOf(pc.powers.map(id => PW[id].type)); if (typeof rollUnique === 'function') rollUnique();
  if (spec.recruits) spec.recruits.forEach(cid => addAlly(cid, 70));
  pc.heat = Math.max(pc.heat, minHeat());
  recalc(); pc.hp = pc.hpMax; pc.en = pc.enMax;
  logEntry(`Début de l’aventure : ${pc.name}, ${F[pc.faction].name}.`);
  saveGame();
  setTimeout(() => splash({ title: '2071', sub: 'Juin · Le protocole ANTI vient d’être lancé', cls: 'year', color: '#ffe83a', ms: 2200 }), 80);
  return G;
}

function startKit(pc) {
  const w = { brawler: 'matraque', juggernaut: 'matraque', protector: 'matraque', flanker: 'lame', ranger: 'tube', assist: 'tube', engineer: 'outils', performer: null }[pc.style];
  const strong = { brawler: 'gantelets', juggernaut: 'gantelets', protector: 'gantelets', ranger: 'plasma', engineer: 'plasma', assist: 'plasma', flanker: 'tube', performer: null }[pc.style];
  const lv = Math.max(pc.grade, pc.pstars || 0); const wp = lv >= 3 ? strong : w; if (wp && ITEMS[wp].t === 'arme') { giveItem(wp); pc.eq.arme = wp; } else if (w && ITEMS[w].t === 'gadget') giveItem(w);
  if (lv >= 1) { giveItem('gilet'); pc.eq.armure = 'gilet'; } if (lv >= 3) { giveItem('nano'); pc.eq.armure = 'nano'; }
  if (lv >= 2 && !hasItemOf(pc, 'drone')) giveItem('drone');
}
function hasItemOf(pc, id) { return (pc.inv[id] || 0) > 0; }
function charToSpec(c) {
  const grade = gradeFromChar(c); const st = c.style || ['brawler', 'ranger', 'assist', 'flanker'][hashStr(c.id) % 4];
  const cc = Object.assign({}, c, { style: st });
  const powers = c.powers.length ? c.powers.slice() : fallbackPowers(c);
  const mates = DATA.chars.filter(x => x.faction === c.faction && x.id !== c.id && !Object.values(F).some(f => f.leaders.includes(x.id) && f.id !== c.faction)).sort((a, b) => b.stars - a.stars || b.ratio - a.ratio).filter(x => x.stars <= 3).slice(0, Math.max(0, Math.floor((Math.max(grade, c.stars || 0) - 2) / 2))).map(x => x.id);
  return {
    pc: { name: c.name, gender: c.gender, age: ageNum(c.age), origin: c.origin, faction: c.faction, powers, style: st, attrs: statsForChar(cc), grade, pstars: c.stars || 0, merit: MERIT_STEPS[grade] || 0, money: [300, 500, 800, 1200, 1800, 2600][Math.min(5, Math.max(grade, c.stars || 0))], charId: c.id, xp: Math.max(grade, c.stars || 0) * 60 },
    recruits: mates,
  };
}

// ───────── Statistiques dérivées ─────────
function stoneCount() { return Object.keys(G.pc.stones).length; }
function A(id) {
  const pc = G.pc; let v = pc.attrs[id] || 0;
  for (const sid in pc.stones) if (STONE_ATTR[sid] === id) v++;
  const n = stoneCount(); if (n >= 4) v += 1; if (n >= 8) v += 1;
  if (pc.implant && false) v -= 0;
  return v;
}
function recalc() {
  const pc = G.pc; const n = stoneCount();
  pc.hpMax = Math.round(26 + 3.5 * pcPower() + A('corps') * 0.8 + (pc.style === 'juggernaut' ? 6 : 0) + (pc.ptype === 'zoologique' ? 3 : 0) + n * 2);
  pc.enMax = Math.max(0, 5 + Math.round(pcPower()) + Math.round(A('maitrise') * 0.8) + (pc.ptype === 'elementaire' ? 4 : 0) + (pc.ptype === 'hybride' ? -2 : 0) + (pc.ptype === 'aucun' ? -8 : 0) + n);
  pc.hp = clamp(pc.hp, 0, pc.hpMax); pc.en = clamp(pc.en, 0, pc.enMax);
}
function minHeat() {
  const pc = G.pc; if (G.world && G.world.era === 'newera') return 0;
  if (!isAnti(pc.faction)) return 0;
  return [0, 10, 35, 60, 85, 85][pc.grade];
}
function wantedStars() { const h = G.pc.heat; return h >= 85 ? 4 : h >= 60 ? 3 : h >= 35 ? 2 : h >= 10 ? 1 : 0; }
const starStr = n => '⭐'.repeat(n);
function weaponOf() { return G.pc.eq.arme ? ITEMS[G.pc.eq.arme] : null; }
function armorOf() { return G.pc.eq.armure ? ITEMS[G.pc.eq.armure] : null; }
function logEntry(t) { G.log.push({ wk: G.wk, t }); if (G.log.length > 400) G.log.shift(); }
function newsPush(t) { G.world.news.unshift({ wk: G.wk, t }); if (G.world.news.length > 40) G.world.news.pop(); }

function allyData(cid) { return G.pc.party.find(a => a.id === cid); }
function addAlly(cid, loy = 55) {
  if (allyData(cid) || !CH[cid]) return false;
  const c = CH[cid]; const st = c.style || 'brawler';
  const attrs = statsForChar(Object.assign({}, c, { style: st }));
  const hpMax = 20 + attrs.corps * 3 + c.stars * 4;
  G.pc.party.push({ id: cid, loy, hp: hpMax, hpMax, inj: 0, atk: 2 + Math.round((attrs[STYLES[st].prim] + c.stars * 1.5) / 1.6), style: st });
  G.world.npc[cid].st = 'ally';
  return true;
}
function removeAlly(cid, st = 'free') { G.pc.party = G.pc.party.filter(a => a.id !== cid); if (G.world.npc[cid]) G.world.npc[cid].st = st; }
const partyMax = () => 2 + G.pc.grade + (hasRole('leader') ? 1 : 0);
const hasRole = r => G.pc.roles.includes(r);

// ───────── Sauvegarde ─────────
function saveGame() { try { if (G && G.status === 'play') localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { } }
function loadGame() { try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; G = JSON.parse(s); return true; } catch (e) { return false; } }
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function loadScores() { try { return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]'); } catch (e) { return []; } }
function pushScore(rec) { try { const s = loadScores(); s.push(rec); s.sort((a, b) => b.score - a.score); localStorage.setItem(SCORE_KEY, JSON.stringify(s.slice(0, 20))); } catch (e) { } }
