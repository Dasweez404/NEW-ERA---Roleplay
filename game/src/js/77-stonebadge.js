// ───────── Pierres antiques : un emoji chacune, silhouette noire tant qu'elle n'est pas obtenue, bonus au survol ─────────
const STONE_EMOJI = { lumiere: '🌟', plante: '🌿', magma: '🌋', eau: '💧', air: '🌪️', feu: '🔥', fumee: '💨', sable: '⏳', acide: '🧪', roche: '🪨', foudre: '⚡', glace: '❄️', gaz: '🫧', metal: '⚙️', terre: '🌍', tenebres: '🌑' };
// Bonus passif de chaque pierre possédée (même catalogue que les particularités de pouvoir)
const STONE_BONUS = { lumiere: ['bond', 1], plante: ['regen', 1], magma: ['dmg', 1], eau: ['rest', 1], air: ['travel', 3], feu: ['c_social', 1], fumee: ['c_stealth', 1], sable: ['c_heal', 1], acide: ['energy', 1], roche: ['loot', 5], foudre: ['c_mobility', 1], glace: ['fix', 3], gaz: ['xp', 5], metal: ['c_tech', 1], terre: ['shield', 3], tenebres: ['first', 1] };
function stoneBonusSum(id) { let t = 0; if (!G || !G.pc) return 0; DATA.stones.forEach(s => { if (G.pc.stones[s.id] && STONE_BONUS[s.id] && STONE_BONUS[s.id][0] === id) t += STONE_BONUS[s.id][1]; }); return t; }
function stoneBonusText(s) { const b = STONE_BONUS[s.id]; return b && PERKS[b[0]] ? PERKS[b[0]][1](b[1]) : ''; }
function stoneBadge(s) {
  const have = !!G.pc.stones[s.id]; const el = h('button', { class: 'stone2' + (have ? ' have' : ''), style: `--c:${s.color}`, 'data-tip': `${s.name}${have ? '' : ' (non obtenue)'}\n${stoneBonusText(s)}`, 'aria-label': `Pierre de ${s.name}`, onclick: () => { const on = el.classList.contains('tip'); document.querySelectorAll('.stone2.tip').forEach(x => x.classList.remove('tip')); if (!on) el.classList.add('tip'); } }, h('span', { class: 'em' }, STONE_EMOJI[s.id] || '💎'));
  return el;
}
const stoneGrid = () => h('div', { class: 'stones2' }, DATA.stones.map(stoneBadge));
