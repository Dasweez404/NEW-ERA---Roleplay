// ───────── Encyclopédie : tous les personnages en mosaïque, avec filtres et tris combinables ─────────
// Un pixel de sprite a la même taille à l'écran pour tous les personnages, quelle que soit la taille de l'image.
const ENC = { f: {}, sort: 'nom', q: '' };
const ENC_AGES = ['10-15ans', '15-20ans', '20-25ans', '25-30ans', '30-35ans', '35-40ans', '40-45ans', '45-50ans', '50-55ans', '55-60ans', '60-65ans', '65-70ans', '70-75ans'];
const encAge = c => { const m = String(c.age || '').match(/\d+/); return m ? +m[0] : 99; };
const GENRES = { H: '♂ Homme', F: '♀ Femme', N: '⚧ Non-binaire', B: '⚧ Non-binaire' };
function encFilters() {
  const chars = DATA.chars; const uniq = f => [...new Set(chars.map(f).filter(x => x != null && x !== ''))];
  const factions = uniq(c => c.faction).sort((a, b) => (F[a] ? F[a].name : a).localeCompare(F[b] ? F[b].name : b));
  const powCats = uniq(c => (c.powers || []).map(p => PW[p] && PW[p].cat)[0]).sort();
  return [
    { k: 'faction', ic: '🏴', n: 'Faction', get: c => c.faction, opts: factions.map(f => [f, F[f] ? F[f].name : f]) },
    { k: 'continent', ic: '🌍', n: 'Continent', get: c => c.continent, opts: uniq(c => c.continent).sort().map(x => [x, x]) },
    { k: 'origin', ic: '📍', n: 'Origine', get: c => c.origin, opts: uniq(c => c.origin).sort((a, b) => stateName(a).localeCompare(stateName(b))).map(x => [x, stateName(x) + (S[x] ? ' · ' + S[x].capital : '')]) },
    { k: 'zone', ic: '🗺', n: 'Zone', get: c => c.zone, opts: uniq(c => c.zone).sort().map(x => [x, x]) },
    { k: 'style', ic: '🎭', n: 'Style de combat', get: c => c.style, opts: Object.keys(STYLES).map(x => [x, STYLES[x].name + ' · ' + STYLES[x].grp]) },
    { k: 'grp', ic: '⚔', n: 'Catégorie de style', get: c => STYLES[c.style] && STYLES[c.style].grp, opts: ['Offensif', 'Défensif', 'Technique', 'Soutien'].map(x => [x, x]) },
    { k: 'ptype', ic: '✨', n: 'Type de pouvoir', get: c => (c.ptypes && c.ptypes[0]) || 'aucun', opts: Object.keys(TYPENAME).map(x => [x, TYPENAME[x]]) },
    { k: 'pcat', ic: '🧬', n: 'Famille de pouvoir', get: c => (c.powers || []).map(p => PW[p] && PW[p].cat)[0], opts: powCats.map(x => [x, cap(String(x))]) },
    { k: 'gender', ic: '⚥', n: 'Genre', get: c => (c.gender === 'B' ? 'N' : c.gender), opts: [['H', GENRES.H], ['F', GENRES.F], ['N', GENRES.N]] },
    { k: 'stars', ic: '⭐', n: 'Prestige', get: c => String(c.stars), opts: [0, 1, 2, 3, 4, 5].map(x => [String(x), x ? '★'.repeat(x) : 'Anonyme']) },
    { k: 'age', ic: '🎂', n: 'Âge', get: c => c.age, opts: ENC_AGES.filter(a => chars.some(c => c.age === a)).map(a => [a, a.replace('ans', ' ans')]) },
    { k: 'lead', ic: '👑', n: 'Rang', get: c => Object.values(F).some(f => f.leaders && f.leaders.includes(c.id)) ? 'chef' : 'membre', opts: [['chef', '👑 Chefs de faction'], ['membre', 'Membres']] },
  ];
}
const ENC_SORTS = [['nom', '🔤 Nom'], ['prestige', '⭐ Prestige ↓'], ['age', '🎂 Âge ↑'], ['faction', '🏴 Faction'], ['origine', '📍 Origine'], ['puissance', '💥 Puissance ↓']];
function encList() {
  const FL = encFilters(); const q = ENC.q.trim().toLowerCase();
  let L = DATA.chars.filter(c => FL.every(f => !ENC.f[f.k] || f.get(c) === ENC.f[f.k]) && (!q || c.name.toLowerCase().includes(q)));
  const cmp = { nom: (a, b) => a.name.localeCompare(b.name), prestige: (a, b) => b.stars - a.stars || a.name.localeCompare(b.name), age: (a, b) => encAge(a) - encAge(b), faction: (a, b) => (F[a.faction] ? F[a.faction].name : '').localeCompare(F[b.faction] ? F[b.faction].name : '') || a.name.localeCompare(b.name), origine: (a, b) => stateName(a.origin).localeCompare(stateName(b.origin)) || a.name.localeCompare(b.name), puissance: (a, b) => (b.ratio || 0) - (a.ratio || 0) }[ENC.sort];
  return L.sort(cmp);
}
// Cases carrées de même taille pour tous ; un pixel de sprite garde la même taille partout (échelle commune, calée sur le plus grand sprite : 98 px de large)
const ENC_MAXW = 98;
const encS = () => innerWidth < 700 ? Math.floor((Math.min(innerWidth, 1240) - 40) / 2) : innerWidth < 1100 ? 230 : 270;
const encK = () => Math.round(((encS() - 10) / ENC_MAXW) * 20) / 20;
const encKBig = () => (innerWidth < 700 ? 3 : 5); // fiche détaillée
function encTile(c, i) {
  const s = SPR[c.id]; const k = encK(); const col = facHue(c.faction); const anim = i != null && i < 70;
  const t = h('button', { class: 'enct' + (anim ? ' in' : ''), title: c.name, style: `--fc:${col};--d:${Math.min(i || 0, 60) * 13}ms;--bd:${(i * 37) % 9 * 0.25}s`, onclick: () => { sfx('click'); t.classList.add('press'); burstAt(t, col, 16); ENC.last = c.id; setTimeout(() => encDetail(c.id), 140); } },
    h('span', { class: 'encimg' }, h('img', { class: 'spr', src: s[2], width: Math.round(s[0] * k), height: Math.round(s[1] * k), alt: c.name, draggable: 'false', loading: 'lazy' })),
    h('span', { class: 'encn' }, c.name), c.stars ? h('span', { class: 'encs' }, '★'.repeat(c.stars)) : null);
  return t;
}
function encyclopediaScreen() {
  G = null; const FL = encFilters(); const grid = h('div', { class: 'encgrid', style: `--S:${encS()}px` }); const count = h('div', { class: 'enccount' });
  const refresh = () => { const L = encList(); ENC.list = L.map(c => c.id); grid.innerHTML = ''; grid.classList.remove('swap'); void grid.offsetWidth; grid.classList.add('swap'); L.forEach((c, i) => grid.append(encTile(c, i))); if (!L.length) grid.append(h('div', { class: 'mut', style: 'padding:20px' }, 'Aucun personnage ne correspond à ces filtres.')); { const from = ENC.shown == null ? 0 : ENC.shown; ENC.shown = L.length; const num = h('b', { class: 'encnum' }, String(from)); count.innerHTML = ''; count.append(num, ` / ${DATA.chars.length} personnages`); countUp(num, from, L.length, 450); } grid.scrollTop = 0; bar.querySelectorAll('select').forEach(s => s.classList.toggle('act', !!s.value)); };
  const sel = (ic, n, opts, val, on, all = 'Tous') => { const s = h('select', { title: n, 'aria-label': n, onchange: e => { sfx('click'); on(e.target.value); refresh(); } }, h('option', { value: '' }, `${ic} ${n} : ${all}`), ...opts.map(([v, l]) => h('option', { value: v }, `${ic} ${l}`))); s.value = val || ''; return s; };
  const search = h('input', { class: 'encq', type: 'search', placeholder: '🔎 Nom…', value: ENC.q, oninput: e => { ENC.q = e.target.value; refresh(); } });
  const sortSel = h('select', { title: 'Trier', 'aria-label': 'Trier', onchange: e => { ENC.sort = e.target.value; refresh(); } }, ENC_SORTS.map(([v, l]) => h('option', { value: v }, '↕ ' + l))); sortSel.value = ENC.sort;
  const reset = h('button', { class: 'tab', onclick: () => { ENC.f = {}; ENC.q = ''; ENC.sort = 'nom'; sfx('click'); encyclopediaScreen(); } }, '🔄 Tout réinitialiser');
  const nAct = () => Object.keys(ENC.f).length;
  const tog = h('button', { class: 'tab encfb', onclick: () => { ENC.open = !ENC.open; sfx('click'); bar.classList.toggle('open', ENC.open); } }, '🎛 Filtres');
  const sels = h('div', { class: 'encsels' }, ...FL.map(f => sel(f.ic, f.n, f.opts, ENC.f[f.k], v => { if (v) ENC.f[f.k] = v; else delete ENC.f[f.k]; tog.textContent = '🎛 Filtres' + (nAct() ? ` (${nAct()})` : ''); })), reset);
  tog.textContent = '🎛 Filtres' + (nAct() ? ` (${nAct()})` : '');
  const bar = h('div', { class: 'encbar' + (ENC.open ? ' open' : '') }, search, sortSel, tog, sels);
  UI.scene = { bare: true, extra: h('div', { class: 'enc' }, h('div', { class: 'enchead' }, h('button', { class: 'ibtn', onclick: titleScreen, title: 'Retour' }, '←'), h('b', {}, '📚 Encyclopédie'), count), bar, grid) }; render(); refresh();
}
function encDetail(id) {
  const c = CH[id]; const s = SPR[id]; const k = encKBig(); const lead = Object.values(F).find(f => f.leaders && f.leaders.includes(id)); const col = facHue(c.faction);
  const list = (ENC.list && ENC.list.includes(id)) ? ENC.list : [id]; const pos = list.indexOf(id);
  const go = d => { sfx('click'); encDetail(list[(pos + d + list.length) % list.length]); };
  let n = 0; const row = (ic, t) => h('div', { class: 'encrow', style: `--i:${n++}` }, h('span', {}, ic), h('span', {}, t));
  const pw = (c.powers || []).map(p => PW[p] ? PW[p].name : p);
  const big = s ? h('div', { class: 'encbig', style: `--fc:${col}` }, h('i', { class: 'encring' }), h('i', { class: 'encscan' }), h('img', { class: 'spr encbigimg', src: s[2], width: s[0] * k, height: s[1] * k, alt: c.name, draggable: 'false' })) : null;
  if (big) { big.addEventListener('pointermove', e => { const r = big.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; big.style.transform = `perspective(500px) rotateY(${x * 22}deg) rotateX(${-y * 22}deg) scale(1.04)`; }); big.addEventListener('pointerleave', () => { big.style.transform = ''; }); big.addEventListener('click', () => { sfx('crit'); burstAt(big, col, 26); big.classList.remove('wiggle'); void big.offsetWidth; big.classList.add('wiggle'); }); }
  UI.scene = { bare: true, extra: h('div', { class: 'enc encd', style: `--fc:${col}` }, h('div', { class: 'enchead' }, h('button', { class: 'ibtn', onclick: () => { sfx('click'); encyclopediaScreen(); }, title: 'Retour' }, '←'), h('b', {}, c.name), lead ? h('span', { class: 'enccount' }, '👑 chef') : null,
      list.length > 1 ? h('button', { class: 'ibtn', onclick: () => go(-1), title: 'Précédent' }, '‹') : null, list.length > 1 ? h('button', { class: 'ibtn', onclick: () => go(1), title: 'Suivant' }, '›') : null),
    h('div', { class: 'encdbody' }, big,
      h('div', { class: 'encinfo' },
        row('🏴', F[c.faction] ? F[c.faction].name : c.faction), row('📍', `${stateName(c.origin)}${S[c.origin] ? ' · ' + S[c.origin].capital : ''} — ${c.continent || ''}`), row('🗺', c.zone || '—'),
        row('🎂', String(c.age || '—').replace('ans', ' ans')), row('⚥', GENRES[c.gender] || '—'), row('⭐', c.stars ? '★'.repeat(c.stars) : 'Anonyme'),
        row('🎭', `${STYLES[c.style] ? STYLES[c.style].name + ' · ' + STYLES[c.style].grp : c.style}`), row('✨', (c.ptypes && c.ptypes.length ? c.ptypes.map(t => TYPENAME[t] || t).join(' + ') : 'Aucun pouvoir')), pw.length ? row('🧬', pw.join(' · ')) : null,
        c.ratio ? row('💥', `Ratio de puissance : ${c.ratio}`) : null))) };
  render(); setTimeout(() => { const b = document.querySelector('.encbig'); if (b) burstAt(b, col, 20); }, 260);
}
