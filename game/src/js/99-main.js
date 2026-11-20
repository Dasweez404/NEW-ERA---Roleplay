// ───────── Écran titre, création de personnage, fin de partie ─────────
const NAME_A = ['Ka', 'Mi', 'Ro', 'Ta', 'Ne', 'Sa', 'Lu', 'Vo', 'Ze', 'Ari', 'Bo', 'Cy', 'Da', 'El', 'Fa', 'Gi', 'Hy', 'Io', 'Ju', 'Ko', 'Le', 'Ma', 'No', 'Os', 'Pa', 'Qu', 'Ri', 'Su', 'Th', 'Un', 'Vi', 'Wa', 'Xe', 'Yu'];
const NAME_B = ['ra', 'lo', 'mi', 'na', 'ko', 'ven', 'tis', 'sha', 'dor', 'ex', 'lun', 'ri', 'zan', 'bel', 'cio', 'dra', 'fin', 'gor', 'hex', 'jin', 'lax', 'mor', 'nyx', 'pho', 'rex', 'sol', 'tor', 'vik', 'zen'];
const randName = () => cap(pick(NAME_A).toLowerCase() + pick(NAME_B) + (chance(0.4) ? pick(NAME_B) : ''));
let CR = null;

function lastHero() { try { const sg = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (!sg || !sg.pc) return null; const sp = sg.pc.charId || sg.pc.sprite; return { sp: hasSpr(sp) ? sp : null, name: sg.pc.name, faction: F[sg.pc.faction] ? F[sg.pc.faction].name : '', grade: sg.pc.grade || 0, wk: sg.wk || 0 }; } catch (e) { return null; } }
function titleScreen() {
  G = null; const sc = hasSave(); const hero = sc ? lastHero() : null; const wide = innerWidth >= 860;
  const btn = (n, t, sub, f, go) => h('button', { class: 'tbtn' + (go ? ' go' : ''), style: `--i:${n}`, onclick: () => { sfx('click'); f(); } }, h('span', { class: 'tn' }, String(n).padStart(2, '0')), h('span', { class: 'tt' }, h('b', {}, t), sub ? h('small', {}, sub) : null), h('span', { class: 'ta' }, '›'));
  const city = pick(DATA.states).id;
  const side = h('div', { class: 'tside' }, hero && hero.sp ? h('div', { class: 'tfloat' }, h('div', { class: 'tring' }), sprFit(hero.sp, wide ? 320 : 150, 'tspr'), h('div', { class: 'tcap' }, h('b', {}, hero.name), h('span', {}, `${hero.faction} · ${rankStr(hero.grade)}`))) : h('div', { class: 'tfloat emblem' }, h('div', { class: 'tring' }), atomSVG()));
  const menu = h('div', { class: 'tmenu' }, ...(sc ? [btn(1, 'Continuer', hero ? `${hero.name} · semaine ${hero.wk}` : 'Reprendre ta partie', () => { if (loadGame()) { restoreOwn(); G.fresh = true; hub(); } }, true)] : []), btn(sc ? 2 : 1, 'Nouvelle partie', 'Libre ou canon, ton personnage ou un des 441', newGameMenu, !sc), btn(sc ? 3 : 2, 'Meilleurs scores', '', scoresScreen), btn(sc ? 4 : 3, 'Encyclopédie', 'Les personnages, avec filtres', encyclopediaScreen), btn(sc ? 5 : 4, 'Règles', 'But, jets, grades, primes', rulesScreen));
  UI.scene = { bare: true, extra: h('div', { class: 'title2' }, h('div', { class: 'tbg' }, envBanner(city, 340, 'night')), h('div', { class: 'tgrid' }),
    h('div', { class: 'tmain' }, h('div', { class: 'tleft' }, h('div', { class: 'tkick' }, 'CRATÈS · 2071'), h('h1', { class: 'tlogo' }, h('img', { src: LOGO_TITLE, alt: 'NEW ERA', draggable: 'false' })), h('p', { class: 'tlore' }, 'Les météorites, la génotite, l’ogénite… et le Nouveau Régime qui traque les géno-porteurs. Choisis ton camp. Survis au protocole ANTI.'), menu), side),
    h('div', { class: 'tfoot' }, '52 États · 31 factions · 441 personnages')) };
  UI.after = []; render(); runAfter();
}
function rulesScreen(back) { show({ kicker: 'Règles', title: 'Comment jouer', text: [], extra: tabAide(), choices: [C('← Retour', typeof back === 'function' ? back : titleScreen)] }); }
function aboutScreen() {
  show({ kicker: 'À propos', title: 'Fidélité et libertés prises', text: [
    '<b>Repris tel quel des documents :</b> l’histoire (2048 → 2071+), les 52 États et leurs capitales, les 31 factions (26 du protocole ANTI + 5 secrètes) et la Force d’Autorité, les 3 types de pouvoirs + hybrides, l’annuaire complet de 434 pouvoirs avec leurs porteurs, les 441 personnages du tableur, les 8 styles de combat, les 16 pierres antiques (royaumes, souverains, clans Bidh/Kaos, glyphes), la frise d’Ora (juin 2071 → 2074), la carte de l’Orbitrail (13 lignes).',
    '<b>Improvisé (à valider) :</b> les 5 attributs (choix de l’utilisateur), les règles de jeu (jets, énergie, éveil, primes), les relations précises entre factions (déduites de la timeline), les faiblesses de pouvoir, la liste des détenteurs de pierres au début de la partie (déduite des textes), les temples des pierres cachées, les dates intermédiaires de certains arcs, les prix, les ennemis types.',
    '<b>Orbitrail :</b> transcrite à la main depuis l’image : vérifie les lignes sur la carte (quand tu voyages) et dis-moi s’il manque ou s’il y a trop d’un lien.',
    '<b>Notes sur les sources :</b> le PDF dit « Sanctuaire Shūshì » alors que le tableur écrit « Hépíng » ; « costumier » apparaît deux fois dans ta liste de rôles (une seule entrée conservée) ; quelques erreurs de description dans l’annuaire des pouvoirs (par exemple l’Éléphant décrit « du poisson hérisson ») ont été ignorées : les noms et numéros de porteurs sont gardés.',
  ], choices: [C('← Retour', titleScreen)] });
}
function scoresScreen() {
  const s = loadScores(); const t = h('table', { class: 't' }, h('tr', {}, ['#', 'Nom', 'Faction', 'Score', 'Fin', 'Pierres', 'Mois'].map(x => h('th', {}, x))));
  s.forEach((r, i) => t.append(h('tr', {}, h('td', {}, i + 1), h('td', {}, r.name), h('td', {}, r.faction), h('td', {}, fmt(r.score)), h('td', {}, { win: '🏆 16 pierres', retire: '🌴 Retraite', dead: '☠ Mort' }[r.kind]), h('td', {}, r.stones), h('td', {}, r.months))));
  show({ kicker: 'Hall of fame', title: 'Meilleurs scores', text: s.length ? [] : ['Aucune partie terminée pour le moment.'], extra: s.length ? t : null, choices: [C('📖 Journaux de bord', runsScreen, { ic: '📖', sub: 'Relire tes parties terminées.' }), C('← Retour', titleScreen)] });
}
function newGameMenu() {
  const canon = UI.mode === 'canon';
  const sw = h('div', { class: 'modesw', role: 'group', 'aria-label': 'Type de scénario' },
    h('button', { class: 'mseg' + (canon ? '' : ' on'), onclick: () => { UI.mode = 'libre'; sfx('click'); newGameMenu(); } }, h('b', {}, 'Libre'), h('small', {}, 'Scénario aléatoire')),
    h('button', { class: 'mseg' + (canon ? ' on' : ''), onclick: () => { UI.mode = 'canon'; sfx('click'); newGameMenu(); } }, h('b', {}, 'Canon'), h('small', {}, 'Timeline d’Ora')));
  UI.len = UI.len || (() => { try { return localStorage.getItem('newera.len') || 'normal'; } catch (e) { return 'normal'; } })();
  const lsw = h('div', { class: 'modesw three', role: 'group', 'aria-label': 'Durée de partie' }, Object.keys(LENS).map(k => h('button', { class: 'mseg' + (UI.len === k ? ' on' : ''), onclick: () => { UI.len = k; try { localStorage.setItem('newera.len', k); } catch (e) { } sfx('click'); newGameMenu(); } }, h('b', {}, LENS[k].n), h('small', {}, k === 'court' ? '2 cartes par ville' : k === 'long' ? 'rythme posé' : 'équilibrée'))));
  const desc = h('div', { class: 'modedesc' }, canon ? 'Les sagas de la Vigilante Squad se déroulent dans le monde, dans l’ordre de la timeline. Tu t’y glisses.' : 'Chaque partie tire au hasard le contexte : détenteurs des pierres, rival, intrigues. Rien n’est écrit d’avance.');
  show({ kicker: 'Nouvelle partie', title: 'Qui es-tu ?', text: [], extra: h('div', {}, h('div', { class: 'small mut', style: 'margin-bottom:6px;letter-spacing:.1em;text-transform:uppercase' }, 'Type de scénario'), sw, desc, h('div', { class: 'small mut', style: 'margin:10px 0 6px;letter-spacing:.1em;text-transform:uppercase' }, 'Durée de la partie'), lsw), choices: [
    C('Personnage customisé', () => { CR = { name: '', gender: 'N/B', age: 24, faction: null, origin: null, ptype: null, powers: [], style: null, base: { corps: 2, agilite: 2, intellect: 2, charisme: 2, maitrise: 2 }, add: { corps: 0, agilite: 0, intellect: 0, charisme: 0, maitrise: 0 }, canon: true }; crName(); }, { sub: 'Nom, faction, origine, pouvoir, style, attributs. 🎲 à chaque étape.', cls: 'safe', ic: '🧬' }),
    C('Un personnage existant, au hasard', () => randomChar(), { sub: 'Tiré parmi les 441 du tableur, tout est pré-rempli.', ic: '🎲' }),
    C('Choisir un personnage existant', browseChars, { sub: 'Mosaïque des 441, avec filtres.', ic: '📇' }),
    C('← Retour', titleScreen, { cls: 'back' })] });
}
// ── personnage existant ──
function randomChar() { const c = pick(DATA.chars); charCard(c.id, true); }
function browseChars() { return encyclopediaScreen({ pick: id => charCard(id, false), back: newGameMenu, title: 'Choisir un personnage' }); }
function browseCharsOld() {
  const L = Object.keys(F).filter(k => !['own'].includes(k)).map(fid => C(F[fid].name, () => browseFaction(fid), { sub: `${DATA.chars.filter(c => c.faction === fid).length} personnage(s)` }));
  L.push(C('← Retour', newGameMenu)); show({ kicker: 'Personnages', title: 'Choisir une faction', text: [], choices: L });
}
function browseFaction(fid) {
  const L = DATA.chars.filter(c => c.faction === fid).sort((a, b) => b.stars - a.stars || b.ratio - a.ratio).map(c => C(`${c.name}${Object.values(F).some(f => f.leaders.includes(c.id)) ? ' — CHEF' : ''}`, () => charCard(c.id, false), { img: c.id, sub: `${c.stars ? '★'.repeat(c.stars) + ' · ' : ''}${charPowerText(c)} · ${STYLES[c.style || 'brawler'].name}` }));
  L.push(C('← Retour', browseChars)); show({ kicker: F[fid].name, title: 'Personnages', text: [], choices: L });
}
function charCard(cid, rnd) {
  const c = CH[cid]; const spec = charToSpec(c); const lead = Object.values(F).find(f => f.leaders.includes(cid));
  const att = spec.pc.attrs;
  show({ extra: portrait(c.id, 170), kicker: F[c.faction].name, title: c.name, text: [`${c.gender === 'H' ? 'Homme' : c.gender === 'F' ? 'Femme' : 'Non-binaire'}, ${esc(c.age)}. Origine : ${esc(stateName(c.origin))}. Style : <b>${STYLES[spec.pc.style].name}</b>.`, `Pouvoir : <b>${esc(charPowerText(c))}</b>${c.ptypes.length > 1 ? ' (hybride)' : ''}.`, `Grade de départ : <b>${esc(gradeNames(spec.pc.faction === 'fa' ? { faction: 'fa' } : { faction: spec.pc.faction })[spec.pc.grade])} ${'★'.repeat(spec.pc.grade)}</b>${lead ? ' — <b>CHEF DE FACTION : tu commences avec toutes les responsabilités.</b>' : ''}.`, `Attributs : ${ATTRS.map(a => a.short + ' ' + att[a.id]).join(' · ')}.`, spec.recruits.length ? `Équipiers de départ : ${esc(spec.recruits.map(i => CH[i].name).join(', '))}.` : ''],
    choices: [C(`Jouer ${c.name}`, () => { spec.mode = UI.mode || 'libre'; startGame(spec); hub(); }, { cls: 'safe' }), rnd ? C('🎲 Tirer un autre personnage', randomChar) : null, C('← Retour', rnd ? newGameMenu : browseChars)] });
}
// ── personnage customisé ──
function crSteps() { return ['Nom', 'Faction', 'Origine', 'Pouvoir', 'Style', 'Attributs', 'Résumé']; }
function crHead(i, title, text, choices, extra) { show({ kicker: `Création — étape ${i + 1}/7 · ${crSteps()[i]}`, title, text, extra, choices }); }
function crName() {
  const inp = h('input', { type: 'text', maxlength: 24, placeholder: 'Ton nom', value: CR.name }); const g = h('select', {}, ['H', 'F', 'N/B'].map(x => h('option', { value: x, selected: x === CR.gender ? 'selected' : null }, { H: 'Homme', F: 'Femme', 'N/B': 'Non-binaire' }[x]))); const age = h('input', { type: 'number', min: 12, max: 70, value: CR.age });
  crHead(0, 'Ton nom', ['Ton nom, ton genre, ton âge. Les adolescents, les jeunes adultes et les personnes âgées sont les plus touchés par l’éveil de pouvoirs.'], [C('Suivant →', () => { CR.name = (inp.value || '').trim() || randName(); CR.gender = g.value; CR.age = clamp(+age.value || 24, 12, 70); crFaction(); }), C('🎲 Au hasard (tout)', () => { crRandomAll(); }), C('← Retour', newGameMenu)],
    h('div', {}, h('div', {}, inp), h('div', { class: 'row', style: 'margin-top:8px' }, g, age), h('button', { class: 'btn alt', style: 'margin-top:8px', onclick: () => { inp.value = randName(); } }, '🎲 Nom au hasard')));
}
function crFaction() {
  const L = Object.keys(F).filter(k => !['civils', 'fallen', 'noir', 'own'].includes(k)).map(fid => { const f = F[fid]; return C(`${f.name}${f.secret ? ' (secrète)' : ''}`, () => { CR.faction = fid; if (fid === 'fa') { CR.ptype = 'aucun'; CR.powers = []; } crOrigin(); }, { sub: `${f.goal} — QG : ${stateName(f.hq)}${fid === 'fa' ? ' · sans pouvoir' : ''}` }); });
  L.push(C('🎲 Faction au hasard', () => { const ks = Object.keys(F).filter(k => !['civils', 'fallen', 'noir', 'own'].includes(k)); CR.faction = pick(ks); if (CR.faction === 'fa') { CR.ptype = 'aucun'; CR.powers = []; } crOrigin(); })); L.push(C('Sans faction (civil) — tu pourras en rejoindre une', () => { CR.faction = 'civils'; crOrigin(); }));
  L.push(C('← Retour', crName)); crHead(1, 'Ta faction', ['Choisis une des 31 factions (26 du protocole ANTI + 5 groupes secrets) ou la Force d’Autorité (sans pouvoir). Tu commenceras comme <b>recrue</b> : aucune voix dans les décisions, mais aucune prime non plus.'], L);
}
function crOrigin() {
  const L = []; CONT.forEach(ct => DATA.states.filter(s => s.continent === ct).forEach(s => L.push(C(`${s.name} (${s.capital})`, () => { CR.origin = s.id; crPower(); }, { sub: `${ct} · ${s.countries} · pop. ${s.pop}` }))));
  L.push(C('🎲 Origine au hasard', () => { CR.origin = pick(DATA.states).id; crPower(); })); L.push(C('← Retour', crFaction)); crHead(2, 'Ton origine', ['L’un des 52 États de la Coalition. Chaque État a un chef-lieu qui remplace sa capitale.'], L);
}
function crPower() {
  if (CR.faction === 'fa') { CR.ptype = 'aucun'; CR.powers = []; return crStyle(); }
  const L = [];
  ['zoologique', 'surnaturel', 'elementaire'].forEach(t => L.push(C(`${TYPENAME[t]} — ${DATA.powers.filter(p => p.type === t).length} pouvoirs`, () => powerPick({ types: [t], n: 1 }), { sub: TYPEDESC[t] })));
  L.push(C('Hybride — deux pouvoirs', () => powerPick({ types: ['zoologique', 'surnaturel', 'elementaire'], n: 2 }), { sub: TYPEDESC.hybride }));
  L.push(C('Aucun pouvoir (humain)', () => { CR.ptype = 'aucun'; CR.powers = []; crStyle(); }, { sub: 'Tu comptes sur ton équipement et tes techniques.' }));
  L.push(C('🎲 Pouvoir au hasard', () => { const r = Math.random(); if (r < 0.7) CR.powers = [randPower('zoologique').id]; else if (r < 0.93) CR.powers = [randPower('surnaturel').id]; else if (r < 0.96) CR.powers = [randPower('elementaire').id]; else CR.powers = [randPower('zoologique').id, randPower('surnaturel').id]; CR.ptype = ptypeOf(CR.powers.map(i => PW[i].type)); crStyle(); }, { sub: 'Proportions réalistes : 99 % de zoologiques dans le monde, mais ici un peu plus de variété.' }));
  L.push(C('← Retour', crOrigin)); crHead(3, 'Ton pouvoir', ['Quatre types de pouvoirs : zoologiques, surnaturels, élémentaires, hybrides. Une fois le type choisi, tu descends : catégorie › sous-catégorie › pouvoir. Les doublons avec un personnage existant sont autorisés.'], L);
}
const randPower = t => pick(DATA.powers.filter(p => p.type === t));
function powerPick(o, state) {
  state = state || { path: [], got: [] };
  const { types, n } = o; const got = state.got;
  const pool = DATA.powers.filter(p => types.includes(p.type) && (got.length === 0 || (got[0].type !== p.type || (p.type === 'surnaturel' && got[0].type === 'surnaturel')) ) && !got.some(g => g.id === p.id));
  const t = types.length > 1 ? state.path[0] : null; let L = []; let head = ''; let crumbs = ['Types', ...state.path];
  const back = () => { if (state.path.length) { state.path.pop(); powerPick(o, state); } else if (state.got.length) { state.got.pop(); powerPick(o, state); } else crPower(); };
  let filtered = pool;
  if (types.length > 1 && !t) {
    head = 'Choisis un type de pouvoir'; const ts = [...new Set(pool.map(p => p.type))];
    L = ts.map(x => C(`${TYPENAME[x]} (${pool.filter(p => p.type === x).length})`, () => { state.path = [x]; powerPick(o, state); }, { sub: TYPEDESC[x] }));
  } else {
    const ty = t || types[0]; filtered = pool.filter(p => p.type === ty); const cat = state.path[types.length > 1 ? 1 : 0]; const sub = state.path[types.length > 1 ? 2 : 1];
    if (!cat) { head = `${TYPENAME[ty]} — catégorie`; const cs = [...new Set(filtered.map(p => p.cat))]; L = cs.map(x => C(`${x} (${filtered.filter(p => p.cat === x).length})`, () => { state.path.push(x); powerPick(o, state); })); }
    else {
      const inCat = filtered.filter(p => p.cat === cat); const subs = [...new Set(inCat.map(p => p.sub))];
      if (!sub && subs.length > 1) { head = `${cat} — sous-catégorie`; L = subs.map(x => C(`${x} (${inCat.filter(p => p.sub === x).length})`, () => { state.path.push(x); powerPick(o, state); })); }
      else { const list = sub ? inCat.filter(p => p.sub === sub) : inCat; head = `${sub || cat} — pouvoir`; L = list.map(p => C(`${p.name}`, () => crPicked(o, state, p), { sub: `${p.desc} Étiquettes : ${p.tags.map(x => TAGNAME[x]).join(', ')}. ✦ Particularité — ${perkText(p)}.${p.carriers.length ? ' Porteur(s) : ' + p.carriers.map(i => CH[i] ? CH[i].name : i).join(', ') : ''}` })); }
    }
    const randHere = () => crPicked(o, state, pick(filtered));
    L.push(C('🎲 Au hasard dans cette catégorie', randHere));
  }
  L.push(C('← Retour', back));
  crHead(3, got.length ? 'Ton second pouvoir' : n === 2 ? 'Ton premier pouvoir' : 'Ton pouvoir', [`<span class="crumbs">${esc(crumbs.join(' › '))}</span>`, n === 2 ? (got.length ? `Premier pouvoir : <b>${esc(got[0].name)}</b>. L’hybride ne peut pas combiner deux pouvoirs de la même famille (hors deux surnaturels) ; il n’atteindra jamais le plein potentiel de chacun.` : 'Hybride : tu maîtrises deux pouvoirs à la fois, mais jamais à leur plein potentiel.') : '', head], L);
}
function crPicked(o, state, p) {
  state.got.push(p);
  if (o.n === 2 && state.got.length < 2) { state.path = []; return powerPick(o, state); }
  CR.powers = state.got.map(x => x.id); CR.ptype = ptypeOf(state.got.map(x => x.type)); crStyle();
}
function crStyle() {
  const L = Object.entries(STYLES).map(([id, s]) => C(`${s.name} — ${s.grp}`, () => { CR.style = id; crAttrs(); }, { sub: `${s.desc} Technique : ${s.tech.name}. En combat : ${CAT_DESC[s.grp] || ''}` }));
  L.push(C('🎲 Style au hasard', () => { CR.style = pick(Object.keys(STYLES)); crAttrs(); })); L.push(C('← Retour', crPower));
  crHead(4, 'Ton style de combat', ['Huit catégories de géno-porteurs, deux par famille : offensifs (Brawler, Performer), défensifs (Juggernaut, Protector), techniques (Flanker, Ranger), soutiens (Assist, Engineer).'], L);
}
function crPool() { return 5 + (CR.ptype === 'elementaire' ? -2 : 0) + (CR.ptype === 'aucun' ? 2 : 0); }
function crAttrs() {
  const st = STYLES[CR.style]; const bonus = { corps: 0, agilite: 0, intellect: 0, charisme: 0, maitrise: 0 }; bonus[st.prim] += 2; bonus[st.sec] += 1; if (CR.ptype === 'zoologique') bonus.agilite += 1;
  const used = () => Object.values(CR.add).reduce((x, y) => x + y, 0);
  const row = a => { const v = 2 + bonus[a.id] + CR.add[a.id]; return h('div', { class: 'attr' }, h('div', { class: 'n' }, a.name), h('button', { class: 'tab', onclick: () => { if (CR.add[a.id] > 0) { CR.add[a.id]--; crAttrs(); } } }, '−'), h('b', {}, v), h('button', { class: 'tab', onclick: () => { if (used() < crPool() && v < 8) { CR.add[a.id]++; crAttrs(); } } }, '+'), h('span', { class: 'mut small' }, `base 2 + style ${bonus[a.id] || 0} + points ${CR.add[a.id]}`)); };
  crHead(5, 'Tes attributs', [`Cinq attributs. Points à répartir : <b>${crPool() - used()}</b> sur ${crPool()}${CR.ptype === 'elementaire' ? ' (−2 : les élémentaires sont déjà très puissants)' : CR.ptype === 'aucun' ? ' (+2 : pas de pouvoir)' : ''}. Maximum 8 au départ.`, `Ton style (${st.name}) donne +2 ${AT[st.prim].short} et +1 ${AT[st.sec].short}${CR.ptype === 'zoologique' ? ' ; la forme animale donne +1 Agilité' : ''}.`],
    [C('Suivant →', crSummary, { req: { ok: () => crPool() - used() > 0 ? `Il te reste ${crPool() - used()} point(s) à répartir (ou tire au hasard)` : null } }), C('🎲 Répartir au hasard', () => { CR.add = { corps: 0, agilite: 0, intellect: 0, charisme: 0, maitrise: 0 }; let p = crPool(); while (p > 0) { const a = pick(ATTRS).id; if (2 + bonus[a] + CR.add[a] < 8) { CR.add[a]++; p--; } } crAttrs(); }), C('Tout remettre à zéro', () => { CR.add = { corps: 0, agilite: 0, intellect: 0, charisme: 0, maitrise: 0 }; crAttrs(); }), C('← Retour', crStyle)],
    h('div', {}, ATTRS.map(row)));
  CR._bonus = bonus;
}
function crLook() { spritePicker(crSummary, id => { CR.sprite = id; crSummary(); }); }
function crSummary() {
  const attrs = {}; ATTRS.forEach(a => attrs[a.id] = 2 + CR._bonus[a.id] + CR.add[a.id]);
  const ps = CR.powers.map(id => PW[id].name).join(' + ') || 'aucun';
  crHead(6, CR.name, [CR.sprite ? '' : '<span class="mut">Pense à choisir ton apparence (sprite).</span>',`${CR.gender === 'H' ? 'Homme' : CR.gender === 'F' ? 'Femme' : 'Non-binaire'}, ${CR.age} ans — origine <b>${esc(stateName(CR.origin))}</b> (${esc(capName(CR.origin))}).`, `Faction : <b>${esc(F[CR.faction].name)}</b> (recrue). Pouvoir : <b>${esc(ps)}</b> (${TYPENAME[CR.ptype]}). Style : <b>${STYLES[CR.style].name}</b>.`, `Attributs : ${ATTRS.map(a => a.short + ' ' + attrs[a.id]).join(' · ')}.`, 'Départ : juin 2071, le protocole ANTI vient d’être lancé. Les 16 pierres sont dispersées.'],
    [C(CR.sprite ? 'Changer mon apparence' : '🎭 Choisir mon apparence', crLook, { img: CR.sprite }), C('Commencer l’aventure', () => { startGame({ mode: UI.mode || 'libre', pc: { sprite: CR.sprite, name: CR.name, gender: CR.gender, age: CR.age, origin: CR.origin, faction: CR.faction, powers: CR.powers, style: CR.style, attrs, grade: 0, money: 300 } }); hub(); }, { cls: 'safe' }), C('← Retour', crAttrs)],
    h('p', { class: 'small mut', style: 'margin-top:10px' }, UI.mode === 'canon' ? 'Mode canon : la timeline d’Ora se déroule dans le monde.' : 'Mode libre : le scénario général est tiré au hasard au lancement.'));
}
function crRandomAll() {
  CR.name = randName(); CR.gender = pick(['H', 'F', 'N/B']); CR.age = rint(16, 45);
  CR.faction = pick(Object.keys(F).filter(k => !['civils', 'fallen', 'noir', 'own'].includes(k))); CR.origin = pick(DATA.states).id;
  if (CR.faction === 'fa') { CR.ptype = 'aucun'; CR.powers = []; } else { const r = Math.random(); CR.powers = r < 0.7 ? [randPower('zoologique').id] : r < 0.93 ? [randPower('surnaturel').id] : r < 0.96 ? [randPower('elementaire').id] : [randPower('zoologique').id, randPower('surnaturel').id]; CR.ptype = ptypeOf(CR.powers.map(i => PW[i].type)); }
  CR.sprite = pick(DATA.chars.filter(c => c.gender === CR.gender || CR.gender === 'N/B')).id; CR.style = pick(Object.keys(STYLES)); CR.add = { corps: 0, agilite: 0, intellect: 0, charisme: 0, maitrise: 0 };
  const st = STYLES[CR.style]; const bonus = { corps: 0, agilite: 0, intellect: 0, charisme: 0, maitrise: 0 }; bonus[st.prim] += 2; bonus[st.sec] += 1; if (CR.ptype === 'zoologique') bonus.agilite += 1; CR._bonus = bonus;
  let p = crPool(); while (p > 0) { const a = pick(ATTRS).id; if (2 + bonus[a] + CR.add[a] < 8) { CR.add[a]++; p--; } }
  crSummary();
}
// ───────── Fin de partie ─────────
function showEnding(kind, cause, sc) {
  const pc = G.pc; const alt = kind === 'win' ? ENDINGS.find(e => e.id === cause) : null; const title = alt ? alt.title : kind === 'win' ? '🏆 LES 16 PIERRES !' : kind === 'retire' ? '🌴 Retraite' : '☠ Fin de ta route';
  const txt = alt ? [...alt.text, '<b>Tu as gagné la partie.</b>'] : kind === 'win' ? ['La seizième pierre s’illumine au creux de ta main. Les seize éclats vibrent à l’unisson, comme un seul cœur : l’aura de toutes les civilisations passées déferle, et le monde retient son souffle. <b>Tu as gagné la partie.</b>'] : kind === 'retire' ? [`${esc(pc.name)} raccroche. Quelque part, loin des radars, tu vis de tes souvenirs, de tes amis et de ton argent. Les histoires de tes exploits circuleront longtemps.`] : [esc(cause || 'Tu es mort.'), 'Le monde de Cratès est cruel avec ceux qui s’approchent trop des pierres, des chefs et de Néo.'];
  if (kind === 'win') { splash({ title: alt ? alt.n.toUpperCase() : '16 / 16', sub: alt ? 'UNE AUTRE FIN' : 'LES PIERRES ANTIQUES', icon: alt ? alt.ic : '🏆', color: '#ffe83a', ms: 2800, force: true }); sfx('crit'); } else if (kind === 'dead') { splash({ title: 'FIN', sub: 'Ta route s’arrête ici', icon: '☠', color: '#ff3d7f', ms: 2200, force: true }); sfx('lose'); }
  const t = h('table', { class: 't' }); [['Pierres antiques', stoneCount() * 600], ['Grade', pc.grade * 400], ['Mérite', pc.merit * 2], ['Fortune', Math.round(pc.money / 25)], ['Alliés', pc.party.length * 60], ['Missions', (G.score.missions || 0) * 15], ['Territoires', (G.score.terr || 0) * 200], ['Combats gagnés', (G.score.wins || 0) * 25], ['Vies sauvées', (G.score.saved || 0) * 30], ['Durée (mois)', Math.floor(G.wk / 4) * 10]].forEach(([k, v]) => t.append(h('tr', {}, h('td', {}, k), h('td', {}, v))));
  const scores = loadScores(); const rank = scores.findIndex(s => s.score === sc && s.name === pc.name) + 1;
  UI.scene = { kicker: dateStr(), title, text: [...txt, `<b>Score final : ${fmt(sc)}</b>${kind === 'dead' ? ' (×0,6)' : kind === 'retire' ? ' (×1,25)' : ' (+15 000)'} — ${rank ? 'classement : #' + rank : ''}`], extra: t, choices: [C('Meilleurs scores', () => { G = null; scoresScreen(); }), C('📖 Journal de bord', runsScreen), C('Menu principal', titleScreen)] };
  render();
}
// ───────── Démarrage ─────────
window.addEventListener('DOMContentLoaded', () => { titleScreen(); });
if (document.readyState !== 'loading') titleScreen();

// Logo d'onglet
try { let ic = document.querySelector('link[rel=icon]'); if (!ic) { ic = document.createElement('link'); ic.rel = 'icon'; document.head.appendChild(ic); } ic.type = 'image/svg+xml'; ic.href = LOGO_TAB; } catch (e) { }
