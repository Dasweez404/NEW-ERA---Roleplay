// ───────── Sprites des personnages (HD Sprites : miniatures pixel-art embarquées) ─────────
const SPR = SPR_DATA;
const FOE_SPR = { soldat: '0001', droide: '0002', centaure: '0003', gorgone: '0004', cyclope: '0005', atlas: '0005', prometh: '0005', epimeth: '0005', menet: '0005' };
const hasSpr = id => !!(id && SPR[id]);
function sprFit(id, hpx, cls) {
  // échelle ENTIÈRE et identique pour tous les sprites d'un même contexte : proportions fidèles, pixels nets
  const s = SPR[id]; if (!s) return null; let k = Math.max(1, Math.round(hpx / 40));
  const maxW = Math.max(hpx * 1.9, 110); while (k > 1 && s[0] * k > maxW) k--;
  return h('img', { class: 'spr ' + (cls || ''), src: s[2], width: s[0] * k, height: s[1] * k, alt: '', draggable: 'false' });
}
const pcSprite = () => (G && G.pc && (G.pc.charId || G.pc.sprite)) || null;
const foeSprite = f => f.cid || FOE_SPR[f.tid] || null;
const portrait = (id, hpx) => { const e = sprFit(id, hpx, 'portrait'); return e ? h('div', { class: 'portwrap' }, e) : null; };
function spritePicker(back, onPick) {
  // grille d'apparences : au choix parmi tous les personnages
  const mine = DATA.chars.filter(c => hasSpr(c.id));
  let list = shuffle(mine).slice(0, 48); let filt = 'all';
  const grid = h('div', { class: 'sprgrid' });
  const draw = () => { grid.innerHTML = ''; list.forEach(c => grid.append(h('button', { class: 'sprbtn', title: c.name, onclick: () => { sfx('click'); onPick(c.id); } }, sprFit(c.id, 84), h('span', {}, c.name)))); };
  draw();
  const bar = h('div', { class: 'row', style: 'margin:8px 0' }, h('button', { class: 'btn alt', onclick: () => { list = shuffle(mine.filter(c => filt === 'all' || c.faction === filt)).slice(0, 48); draw(); } }, '🎲 Autres visages'),
    h('select', { onchange: e => { filt = e.target.value; list = shuffle(mine.filter(c => filt === 'all' || c.faction === filt)).slice(0, 48); draw(); } }, h('option', { value: 'all' }, 'Toutes les factions'), ...Object.keys(F).filter(f => f !== 'own').map(f => h('option', { value: f }, F[f].name))));
  show({ kicker: 'Apparence', title: 'Choisis ton look', text: ['L’apparence est purement cosmétique : choisis le sprite qui te représente (un même visage peut exister en PNJ).'], extra: h('div', {}, bar, grid), choices: [C('Sans apparence', () => onPick(null)), C('← Retour', back)] });
}
