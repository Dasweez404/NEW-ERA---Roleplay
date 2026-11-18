// ───────── Inspirations Night City Legend : butin à choisir, décisions décisives, vies uniques, demi-points d'attribut ─────────
function decisive(text, go) {
  const prev = (UI.scene && UI.scene.noLevel && UI.lvlPrev) ? UI.lvlPrev : UI.scene; flash('#ff3d7f'); sfx('lose');
  show({ compact: true, kicker: 'DÉCISION DÉCISIVE', title: 'Es-tu sûr ?', text: [text, '<span class="badc">Ce choix aura des conséquences durables.</span>'], choices: [C('Je confirme', go, { cls: 'danger', ic: '⚠' }), C('Revenir en arrière', () => { if (prev && !prev.noLevel) { UI.scene = prev; render(true); } else hub(); }, { cls: 'back' })] });
}
// ── Butin : on choisit UNE récompense parmi trois ──
function lootPick(o, quality) {
  const pc = G.pc; const crit = quality === 'crit'; const pool = [];
  const money = Math.max(60, Math.round((o.pay || 100) * 0.5 * (crit ? 1.5 : 1)));
  pool.push({ w: 3, ic: '💰', t: `${money} ¢`, d: 'De l’argent frais', ap: () => fx({ money }) });
  pool.push({ w: pc.hp < pc.hpMax * 0.7 ? 6 : 2, ic: '🩹', t: 'Soins', d: `+${crit ? 50 : 35} % de santé`, ap: () => { pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * (crit ? 0.5 : 0.35))); } });
  const id = pick(['capsule', 'kit', 'nanosoin', 'stimulant', 'bandage', 'cafe', 'boisson', 'jumelles', 'crochets', 'grappin', 'radio']); if (ITEMS[id]) pool.push({ w: 3, ic: '🎁', t: ITEMS[id].n, d: 'Un objet utile', ap: () => giveItem(id) });
  const xp = 20 + 8 * (o.tier || 1) + (crit ? 15 : 0); pool.push({ w: 2, ic: '⭐', t: `+${xp} XP`, d: 'De l’expérience', ap: () => fx({ xp }) });
  const at = pick(ATTRS); pool.push({ w: 2, ic: '🧬', t: 'Un demi-point', d: `${at.name} +½`, ap: () => addHalf(at.id) });
  if (G.wk >= 6) pool.push({ w: 2, ic: '💎', t: 'Un indice', d: 'Sur les pierres antiques', ap: () => { const l = stoneClueGain(); toast(l ? '💎 ' + cap(l).slice(0, 70) : 'Rien de neuf'); } });
  if (feat('rep')) pool.push({ w: 2, ic: '🤝', t: 'Réputation', d: `+8 dans la zone ${zoneOf()}`, ap: () => addCityRep(8) });
  const opts = []; const bag = pool.slice(); while (opts.length < 3 && bag.length) { const tw = bag.reduce((t, x) => t + x.w, 0); let r = Math.random() * tw, k = 0; for (; k < bag.length; k++) { r -= bag[k].w; if (r <= 0) break; } opts.push(bag.splice(Math.min(k, bag.length - 1), 1)[0]); }
  sfx('crit'); flash('#fcee09');
  show({ kicker: 'BUTIN', title: crit ? 'Choisis ta récompense ★' : 'Choisis ta récompense', text: [], choices: opts.map(p => C(p.t, () => { p.ap(); sfx('coin'); buzz(30); logEntry(`Butin : ${p.t}.`); hub(); }, { ic: p.ic, sub: p.d })), tiles: true });
}
// ── Demi-points d'attribut (entraînement, butin) ──
function addHalf(id) { const pc = G.pc; pc.half = pc.half || {}; pc.half[id] = (pc.half[id] || 0) + 1; if (pc.half[id] >= 2) { pc.half[id] = 0; if (pc.attrs[id] < 12) { pc.attrs[id]++; recalc(); toast(`${AT[id].short} +1`); return true; } } else toast(`${AT[id].short} +½`); return false; }
function trainAttr(id) {
  const pc = G.pc; pc.money -= 100; advance(1); if (G.status !== 'play') return; const up = addHalf(id);
  show({ kicker: 'Entraînement', title: up ? `${AT[id].name} +1 !` : 'Un demi-point', text: [up ? 'La séance paie : l’attribut monte.' : 'Une séance de plus et l’attribut montera.'], fx: fx({ xp: 5 }), choices: [C('Continuer', cityMenu, { cls: 'cta' })] });
}
// ── Traits permanents et coups du sort : chaque vie est différente ──
const TRAITS = { dur: ['Dur à cuire', 'shield', 3], vif: ['Vif', 'dodge', 1], chanceux: ['Chanceux', 'loot', 10], charmeur: ['Charmeur', 'c_social', 1], bricoleur: ['Bricoleur', 'c_tech', 1], discret: ['Discret', 'quiet', 15], voyageur: ['Voyageur', 'travel', 5], endurant: ['Endurant', 'regen', 1] };
function traitSum(id) { const pc = G && G.pc; if (!pc || !pc.traits) return 0; return pc.traits.reduce((t, k) => t + (TRAITS[k] && TRAITS[k][1] === id ? TRAITS[k][2] : 0), 0); }
const traitNames = () => (G.pc.traits || []).map(k => `${TRAITS[k][0]} (${PERKS[TRAITS[k][1]][1](TRAITS[k][2])})`);
const TWISTS = [
  ['Un héritage inattendu', 'Un oncle lointain t’a laissé 800 ¢.', pc => { pc.money += 800; }],
  ['Un ami bien placé', 'Quelqu’un de ton passé te doit un service : un allié te rejoint.', pc => { const c = DATA.chars.find(x => x.faction === pc.faction && x.stars <= 2 && G.world.npc[x.id].st === 'free' && x.id !== pc.charId); if (c) addAlly(c.id, 60); else pc.money += 300; }],
  ['Du matériel volé', 'Tu as mis la main sur une arme qui n’aurait pas dû être là.', pc => { const id = pick(['hache', 'arbalete', 'cloueur', 'pareballes']); giveItem(id); equipIfFree(id); }],
  ['Une vieille dette', 'Tu dois 300 ¢ à quelqu’un de peu commode.', pc => { pc.money = Math.max(0, pc.money - 300); pc.heat = (pc.heat || 0) + 4; }],
  ['Un casier', 'Tes ennuis passés te rattrapent : on te connaît déjà un peu.', pc => { pc.heat = (pc.heat || 0) + 10; }],
  ['Une rumeur', 'Un vieux conteur t’a glissé quelque chose sur les pierres antiques.', pc => { const w = G.wk; G.wk = 99; stoneClueGain(); G.wk = w; }],
  ['Blessé au départ', 'Tu commences la partie amoindri, une vieille blessure.', pc => { pc.hp = Math.max(1, Math.round(pc.hpMax * 0.7)); }]
];
function rollUnique() {
  const pc = G.pc; if (pc.flags.uniq) return; const smp = (n, k) => shuffle([...Array(n).keys()]).slice(0, k);
  pc.flags.uniq = { deeds: smp(DEEDS.length, Math.round(DEEDS.length * 0.35)), cityEv: smp(CITY_EV.length, 2), camps: [pick(Object.keys(CAMPS))] };
  pc.traits = shuffle(Object.keys(TRAITS)).slice(0, 2);
  const t = pick(TWISTS); try { t[2](pc); } catch (e) { } pc.flags.twist = { n: t[0], d: t[1] };
}
const uniqSkip = (kind, key) => ((G.pc.flags.uniq || {})[kind] || []).includes(key);
const startNote = () => { const pc = G.pc; if (!pc.flags.twist) return ''; return `<span class="mut">Coup du sort : <b>${esc(pc.flags.twist.n)}</b>. ${esc(pc.flags.twist.d)} · Traits : ${traitNames().map(esc).join(', ')}.</span>`; };
