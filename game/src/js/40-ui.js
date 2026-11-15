// ───────── Interface ─────────
const UI = { mode: 'libre', tab: 'perso', scene: null, sheetOpen: false, after: [], prev: null, roll: null };
const PCN = () => esc(G.pc.name);

// Conditions d'accès (choix verrouillés mais visibles)
function reqReason(rq) {
  if (!rq) return null;
  if (rq.ok) { const r = rq.ok(); if (r) return r; }
  if (!G) return null; const pc = G.pc;
  if (rq.money && pc.money < rq.money) return `Requiert ${fmt(rq.money)} ¢ (tu as ${fmt(pc.money)} ¢)`;
  if (rq.grade != null && pc.grade < rq.grade) return `Requiert le grade « ${gradeNames(pc)[rq.grade]} » (tu es « ${gradeName()} »)`;
  if (rq.maxGrade != null && pc.grade > rq.maxGrade) return 'Réservé aux grades inférieurs';
  if (rq.attr) for (const [a, n] of Object.entries(rq.attr)) if (A(a) < n) return `Requiert ${AT[a].short} ${n} (tu as ${A(a)})`;
  if (rq.cap && !hasCap(rq.cap)) return `Requiert une capacité « ${TAGNAME[rq.cap] || rq.cap} » (pouvoir, rôle ou équipement)`;
  if (rq.power && !pcPowers().length) return 'Requiert un pouvoir';
  if (rq.noPower && pcPowers().length) return 'Impossible avec un pouvoir';
  if (rq.role && !hasRole(rq.role)) return `Requiert le rôle « ${ROLES[rq.role].name} »`;
  if (rq.item && !hasItem(rq.item)) return `Requiert : ${ITEMS[rq.item].n}`;
  if (rq.rep) for (const [f, n] of Object.entries(rq.rep)) if ((pc.rep[f] || 0) < n) return `Requiert ${n} de réputation avec ${F[f].name} (tu as ${pc.rep[f] || 0})`;
  if (rq.stones != null && stoneCount() < rq.stones) return `Requiert ${rq.stones} pierre(s) antique(s)`;
  if (rq.faction) { const l = [].concat(rq.faction); if (!l.includes(pc.faction)) return `Réservé à : ${l.map(x => F[x].name).join(', ')}`; }
  if (rq.notFaction) { const l = [].concat(rq.notFaction); if (l.includes(pc.faction)) return `Impossible pour : ${F[pc.faction].name}`; }
  if (rq.style) { const l = [].concat(rq.style); if (!l.includes(pc.style)) return `Style de combat requis : ${l.map(x => STYLES[x].name).join(' / ')}`; }
  if (rq.party && pc.party.filter(a => a.inj <= 0).length < rq.party) return `Requiert ${rq.party} allié(s) en forme`;
  if (rq.flag && !pc.flags[rq.flag]) return rq.flagWhy || 'Condition narrative non remplie';
  if (rq.notFlag && pc.flags[rq.notFlag]) return 'Déjà fait';
  if (rq.heatMin != null && pc.heat < rq.heatMin) return 'Tu n’es pas assez recherché pour ça';
  if (rq.heatMax != null && pc.heat > rq.heatMax) return `Trop risqué : ta prime est trop élevée`;
  if (rq.ptype && ![].concat(rq.ptype).includes(pc.ptype)) return `Réservé aux pouvoirs : ${[].concat(rq.ptype).map(t => TYPENAME[t]).join(', ')}`;
  if (rq.leader && !isLeader()) return 'Réservé aux chefs de faction (grade 5)';
  return null;
}
// fabrique de choix
function C(label, go, o = {}) {
  const lock = reqReason(o.req); let sub = o.sub || ''; let pct = null;
  if (o.odds && !lock) { const [a, dc, tags, ex] = o.odds; pct = Math.round(odds(a, dc, tags || [], ex || 0) * 100); sub = `${AT[a].short} contre ${dc}` + (sub ? ' · ' + sub : ''); }
  return { label, go, sub, cls: o.cls || (pct != null && pct < 40 ? 'risk' : ''), lock, pct, ic: o.ic, img: o.img };
}
const fxHTML = L => L && L.length ? h('div', { class: 'chips' }, L.map((l, i) => h('span', { class: 'chip rv ' + (l.c || ''), style: `--i:${i + 3}` }, l.t))) : null;

function show(sc) {
  if (G && G.status !== 'play' && !sc.final) return;
  const roll = UI.roll; UI.roll = null;
  if (roll && roll.r) { sc.roll = roll; sc.rolled = false; sc.text = [].concat(sc.text || []).filter(t => !(typeof t === 'string' && t.startsWith('🎲'))); }
  UI.scene = sc; render(false); window.scrollTo({ top: 0 }); if (typeof sceneSfx === 'function') sceneSfx(sc);
}
function paragraphs(t) { return [].concat(t || []).filter(x => x !== '' && x != null).map((x, i) => typeof x === 'string' ? h('p', { class: 'rv', style: `--i:${i}`, html: x }) : x); }

function avatar() { const pc = G.pc; const f = F[pc.faction]; const hue = hashStr(pc.faction) % 360; const sp = pcSprite(); if (sp && hasSpr(sp)) return h('div', { class: 'avatar sp', style: `--hue:${hue}` }, sprFit(sp, 80)); return h('div', { class: 'avatar', style: `--hue:${hue}` }, (pc.name || '?').charAt(0).toUpperCase()); }
function hudEl() {
  const pc = G.pc; const st = wantedStars(); const f = F[pc.faction]; const pv = UI.prev || { hp: pc.hp, en: pc.en, money: pc.money, stones: stoneCount(), heat: pc.heat };
  const hpP = pc.hp / pc.hpMax * 100, enP = pc.enMax ? pc.en / pc.enMax * 100 : 0;
  const hpBar = h('i', { style: `width:${pv.hp / pc.hpMax * 100}%` }), enBar = h('i', { style: `width:${pv.en / (pc.enMax || 1) * 100}%` });
  const money = h('b', { class: 'num' }, fmt(pv.money)); const hpN = h('b', {}, pv.hp);
  UI.after.push(() => { requestAnimationFrame(() => { hpBar.style.width = hpP + '%'; enBar.style.width = enP + '%'; }); countUp(money, pv.money, pc.money); countUp(hpN, pv.hp, pc.hp); });
  const cls = 'hud' + (pc.hp < pv.hp ? ' dmg' : pc.hp > pv.hp ? ' heal' : '') + (pc.money > pv.money ? ' gain' : '');
  if (pc.hp < pv.hp) UI.after.push(() => { shake(); });
  UI.prev = { hp: pc.hp, en: pc.en, money: pc.money, stones: stoneCount(), heat: pc.heat };
  return h('div', { class: cls },
    h('div', { class: 'hud-top' }, avatar(), h('div', { class: 'who' }, h('div', { class: 'nm' }, pc.name), h('div', { class: 'sub' }, `${f.name} · ${gradeName()} ${'★'.repeat(pc.grade)}`)),
      h('div', { class: 'hud-btns' }, h('button', { class: 'ibtn act', title: 'Actions', onclick: () => { sfx('click'); closeSheet(); actionsMenu(); } }, '⚡'), h('button', { class: 'ibtn', title: 'Son', onclick: () => { toggleMute(); render(true); } }, FX.mute ? '🔇' : '🔊'), h('button', { class: 'ibtn', title: 'Sauvegarder', onclick: () => { saveGame(); toast('Partie sauvegardée'); } }, '💾'), h('button', { class: 'ibtn', title: 'Menu', onclick: () => { saveGame(); titleScreen(); } }, '☰'))),
    h('div', { class: 'hud-bars' },
      h('div', { class: 'stat hp' }, h('span', { class: 'lab' }, 'SANTÉ'), h('div', { class: 'bar' }, hpBar), h('span', { class: 'val' }, hpN, '/' + pc.hpMax)),
      h('div', { class: 'stat en' }, h('span', { class: 'lab' }, 'ÉNERGIE'), h('div', { class: 'bar' }, enBar), h('span', { class: 'val' }, pc.en + '/' + pc.enMax))),
    h('div', { class: 'hud-pills' },
      h('span', { class: 'pill cash' }, '₵ ', money), h('span', { class: 'pill' + (st ? ' wanted' : ''), title: WANTED_TXT[st] }, st ? 'PRIME ' + starStr(st) : 'Aucune prime'), h('span', { class: 'pill gem' }, '💎 ' + stoneCount() + '/16'),
      h('span', { class: 'pill' }, '📍 ' + capName(G.loc)), h('span', { class: 'pill' }, '🗓 ' + dateStr())));
}
function toast(t) { const el = h('div', { class: 'toast' }, t); document.body.append(el); setTimeout(() => el.remove(), 1800); }

function choicesEl(list, tiles) {
  const items = list.filter(Boolean); const ctaIdx = items.length <= 3 ? items.findIndex(c => /^(Continuer|Commencer|Suivant|Partir|Accepter|Jouer)/.test(c.label)) : -1;
  return h('div', { class: 'choices' + (tiles ? ' tiles' : '') }, items.map((c, i) => {
    const cta = i === ctaIdx; const back = /^(←|Annuler|Renoncer|Refuser|Retour)/.test(c.label);
    return h('button', { class: 'ch rv ' + (c.cls || '') + (cta ? ' cta' : '') + (back ? ' back' : ''), style: `--i:${i + 4}`, 'data-k': i + 1, disabled: !!c.lock, onclick: () => { if (!c.lock) { sfx('click'); buzz(10); c.go(); } } },
      !cta && !back && !tiles ? (c.img && hasSpr(c.img) ? h('span', { class: 'cimg' }, sprFit(c.img, 52)) : h('span', { class: 'key' }, i + 1)) : null, tiles && c.ic ? h('span', { class: 'tic' }, c.ic) : null,
      h('span', { class: 'body' }, h('span', { class: 'l' }, c.label), c.sub ? h('span', { class: 's' }, c.sub) : null, c.lock ? h('span', { class: 'lockwhy' }, '🔒 ' + c.lock) : null),
      c.pct != null ? h('span', { class: 'pct ' + (c.pct >= 65 ? 'hi' : c.pct >= 40 ? 'mid' : 'lo') }, c.pct + '%') : null, cta ? h('span', { class: 'arrow' }, '›') : null);
  }));
}

function tickerEl() {
  const n = G.world.news[0]; if (!n || G.wk - n.wk > 5 || UI.tickerWk === n.wk + n.t) return null;
  return h('div', { class: 'ticker', onclick: () => { UI.tickerWk = n.wk + n.t; render(true); } }, h('span', { class: 'tk' }, '⚡ ACTU'), h('span', { class: 'tt' }, n.t), h('span', { class: 'x' }, '✕'));
}
function render(quiet) {
  const app = $('#app'); app.innerHTML = ''; app.className = quiet ? 'quiet' : ''; UI.after = [];
  const sc = UI.scene; if (!sc) return;
  if (sc.bare) { app.append(h('div', {}, sc.extra)); runAfter(); return; }
  const live = G && G.status === 'play';
  const rollEl = sc.roll ? diceEl(sc.roll, quiet || sc.rolled) : null; if (sc.roll) sc.rolled = true;
  const d = sc.roll && !quiet ? 1.05 : 0;
  const back = (sc.choices || []).filter(Boolean).find(c => /^←/.test(c.label)); UI.back = back ? back.go : null;
  const main = h('div', { class: 'card scene', style: `--d:${d}s` },
    back ? h('button', { class: 'backchip', onclick: () => { sfx('click'); back.go(); } }, '← ' + back.label.replace(/^←\s*/, '')) : null,
    sc.kicker ? h('div', { class: 'kicker rv', style: '--i:0' }, sc.kicker) : null, rollEl,
    sc.banner ? h('div', { class: 'rv', style: '--i:1' }, cityHead()) : h('div', { class: 'title rv', style: '--i:1' }, sc.title), paragraphs(sc.text), fxHTML(sc.fx), sc.extra || null, sc.choices ? choicesEl(sc.choices, sc.tiles) : null);
  if (live) { app.append(hudEl()); if (!sc.banner && !back) app.append(envBanner(G.loc, innerWidth < 640 ? 70 : 92)); const tk = tickerEl(); if (tk) app.append(tk); const tip = tipEl(); if (tip) app.append(tip); }
  const side = live ? sideEl() : null; if (side) side.id = 'sidecard';
  app.append(h('div', { class: 'layout' + (live ? '' : ' solo') }, main, side));
  if (live) app.append(dockEl());
  if (live && UI.sheetOpen) fillSheet();
  if (sc.after && !sc.afterRan) { sc.afterRan = true; UI.after.push(sc.after); }
  if (d && !quiet) { const ch = $('.choices', main); if (ch) { ch.style.pointerEvents = 'none'; setTimeout(() => { ch.style.pointerEvents = ''; }, d * 1000 + 200); } }
  if (!quiet) { try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { } }
  runAfter();
}
function tipEl() {
  let seen = 0; try { seen = +localStorage.getItem('ne_tip') || 0; } catch (e) { } if (seen >= 3 || UI.tipHide) return null;
  try { if (UI.tipShown !== G.wk) { UI.tipShown = G.wk; localStorage.setItem('ne_tip', seen + 1); } } catch (e) { }
  return h('div', { class: 'tip' }, h('span', {}, '💡 Touche un choix pour avancer. ⚡ = menu d’actions (voyage, ville, faction). Barre du bas = fiche, sac, carte.'), h('button', { class: 'x', onclick: () => { UI.tipHide = 1; try { localStorage.setItem('ne_tip', 9); } catch (e) { } render(true); } }, '✕'));
}
function runAfter() { const a = UI.after || []; UI.after = []; a.forEach(f => { try { f(); } catch (e) { } }); }

// ───────── Panneau latéral (bureau) / tiroir + dock (mobile) ─────────
const TABS = [['perso', '🧍', 'Perso'], ['inv', '🎒', 'Sac'], ['groupe', '👥', 'Groupe'], ['factions', '🏴', 'Factions'], ['pierres', '💎', 'Pierres'], ['carte', '🗺', 'Carte'], ['journal', '📜', 'Journal'], ['aide', '❓', 'Règles']];
const TABFN = () => ({ perso: tabPerso, inv: tabInv, groupe: tabGroupe, factions: tabFactions, pierres: tabPierres, carte: tabCarte, journal: tabJournal, aide: tabAide });
function sideEl() {
  const box = h('div', { class: 'card side' });
  box.append(h('div', { class: 'tabs' }, TABS.map(([k, ic, n]) => h('button', { class: 'tab' + (UI.tab === k ? ' on' : ''), onclick: () => { UI.tab = k; sfx('click'); render(true); } }, ic + ' ' + n))));
  box.append(TABFN()[UI.tab]()); return box;
}
function dockEl() {
  return h('nav', { class: 'dock' }, h('button', { class: 'dk agir', onclick: () => { sfx('click'); closeSheet(); actionsMenu(); } }, h('span', { class: 'i' }, '⚡'), h('span', { class: 'n' }, 'Agir')), TABS.filter(t => t[0] !== 'aide' && t[0] !== 'factions' || true).map(([k, ic, n]) => h('button', { class: 'dk' + (UI.sheetOpen && UI.tab === k ? ' on' : ''), onclick: () => { sfx('click'); if (UI.sheetOpen && UI.tab === k) closeSheet(); else openSheet(k); } }, h('span', { class: 'i' }, ic), h('span', { class: 'n' }, n))));
}
function openSheet(tab) { UI.tab = tab; UI.sheetOpen = true; fillSheet(); document.querySelectorAll('.dk').forEach((b, i) => b.classList.toggle('on', TABS[i][0] === tab)); }
function closeSheet() { UI.sheetOpen = false; const s = $('#sheet'); if (s) s.classList.remove('open'); document.querySelectorAll('.dk').forEach(b => b.classList.remove('on')); }
function fillSheet() {
  let s = $('#sheet'); if (!s) { s = h('div', { id: 'sheet' }); document.body.append(s); }
  s.innerHTML = ''; const t = TABS.find(x => x[0] === UI.tab);
  s.append(h('div', { class: 'sh-bg', onclick: closeSheet }), h('div', { class: 'sh-pan' }, h('div', { class: 'sh-head' }, h('b', {}, t[1] + ' ' + t[2]), h('button', { class: 'ibtn', onclick: closeSheet }, '✕')), h('div', { class: 'sh-body side' }, TABFN()[UI.tab]())));
  requestAnimationFrame(() => s.classList.add('open'));
}
function powerLine(p) { return h('div', {}, h('b', {}, p.name), ' ', h('span', { class: 'mut' }, `(${TYPENAME[p.type]} › ${p.cat}${p.sub && p.sub !== 'Éléments' ? ' › ' + p.sub : ''})`), h('div', {}, p.tags.map(t => h('span', { class: 'tag' }, TAGNAME[t] || t)))); }
function tabPerso() {
  const pc = G.pc; const box = h('div');
  box.append(h('div', { class: 'kv' }, h('b', {}, 'Origine'), `${stateName(pc.origin)} (${capName(pc.origin)})`, h('b', {}, 'Faction'), F[pc.faction].name, h('b', {}, 'Style'), `${STYLES[pc.style].name} — ${STYLES[pc.style].desc}`,
    h('b', {}, 'Âge'), `${pc.age} ans`, h('b', {}, 'Rôles'), pc.roles.length ? pc.roles.map(r => ROLES[r].name).join(', ') : 'aucun (à choisir au fil du temps)',
    h('b', {}, 'Identité'), pc.faction === 'fa' ? 'Officier de la F.A.' : (pc.ptype === 'zoologique' || pc.ptype === 'aucun') ? 'Identité civile possible' : 'Porteur fiché (pas d’identité civile complète)'));
  box.append(h('h3', {}, 'Pouvoir : ' + TYPENAME[pc.ptype]));
  if (!pcPowers().length) box.append(h('div', { class: 'mut' }, 'Aucun pouvoir : tu comptes sur ton équipement, tes techniques anti-geno et ta tête.'));
  pcPowers().forEach(p => { box.append(powerLine(p)); const k = perkOf(p); if (k) box.append(h('div', { class: 'perk' }, h('b', {}, '✦ ' + k.title), ' ', h('span', { class: 'mut' }, `(${k.kind}) ${k.desc}`))); });
  if (pc.ptype !== 'aucun') box.append(h('div', { class: 'small mut', style: 'margin-top:4px' }, 'Faiblesse : ' + WEAK[pc.ptype === 'hybride' ? (PW[pc.powers[0]].type) : pc.ptype]));
  box.append(h('h3', {}, 'Attributs' + (pc.pts ? ` — ${pc.pts} point(s) à répartir` : '')));
  ATTRS.forEach(a => {
    const v = A(a.id); const pips = h('div', { class: 'pips' }); for (let i = 0; i < Math.min(v, 16); i++) pips.append(h('span', { class: 'pip on' }));
    box.append(h('div', { class: 'attr', title: a.desc }, h('div', { class: 'n' }, a.short), pips, h('b', {}, v), pc.pts > 0 && pc.attrs[a.id] < 12 ? h('button', { class: 'tab', onclick: () => { pc.attrs[a.id]++; pc.pts--; recalc(); render(true); } }, '+') : null));
  });
  box.append(h('h3', {}, 'Progression'));
  const nxt = MERIT_STEPS[pc.grade + 1];
  box.append(h('div', { class: 'kv' }, h('b', {}, 'Grade'), `${gradeName()} (${pc.grade}/5)`, h('b', {}, 'Mérite'), nxt != null ? `${pc.merit} / ${nxt} pour le grade suivant` : `${pc.merit}`, h('b', {}, 'XP'), `${pc.xp}`, h('b', {}, 'Prime'), wantedStars() ? starStr(wantedStars()) + ' ' + WANTED_TXT[wantedStars()] : 'aucune', h('b', {}, 'Éveil'), pc.awakened ? `déjà éveillé ${pc.awakened} fois` : 'jamais éveillé'));
  if (pc.implant) box.append(h('div', { class: 'badc small' }, '⚠ Implant explosif actif — doit être remplacé par une prime avant le ' + dateStr(pc.implant.deadline)));
  return box;
}
function tabInv() {
  const pc = G.pc; const box = h('div');
  const eq = (slot, label) => h('div', {}, h('b', {}, label + ' : '), pc.eq[slot] ? ITEMS[pc.eq[slot]].n : h('span', { class: 'mut' }, 'aucun'));
  box.append(eq('arme', 'Arme'), eq('armure', 'Armure'));
  const ids = Object.keys(pc.inv);
  if (!ids.length) box.append(h('div', { class: 'mut', style: 'margin-top:8px' }, 'Sac vide.'));
  ids.forEach(id => {
    const it = ITEMS[id]; const row = h('div', { style: 'margin-top:8px;border-top:1px dashed var(--line);padding-top:6px' }, h('b', {}, it.n + (pc.inv[id] > 1 ? ' ×' + pc.inv[id] : '')), h('div', { class: 'small mut' }, it.desc));
    const btns = h('div', { class: 'row', style: 'margin-top:3px' });
    if (it.t === 'arme' || it.t === 'armure') { const slot = it.t === 'arme' ? 'arme' : 'armure'; btns.append(h('button', { class: 'tab', onclick: () => { pc.eq[slot] = pc.eq[slot] === id ? null : id; render(true); } }, pc.eq[slot] === id ? 'Déséquiper' : 'Équiper')); }
    if (it.t === 'conso' && ['en8', 'hp15', 'hp40'].includes(it.use)) btns.append(h('button', { class: 'tab', onclick: () => { useItem(id); render(true); } }, 'Utiliser'));
    row.append(btns); box.append(row);
  });
  return box;
}
function useItem(id) {
  const it = ITEMS[id]; const pc = G.pc; if (!takeItem(id)) return;
  if (it.use === 'en8') pc.en = Math.min(pc.enMax, pc.en + 8);
  if (it.use === 'hp15') pc.hp = Math.min(pc.hpMax, pc.hp + 15);
  if (it.use === 'hp40') { pc.hp = Math.min(pc.hpMax, pc.hp + 40); pc.party.forEach(a => { if (a.inj > 0) { a.inj = 0; a.hp = Math.ceil(a.hpMax / 2); } }); }
  if (it.use === 'stim') pc.stim = 1;
}
function tabGroupe() {
  const pc = G.pc; const box = h('div', {}, h('div', { class: 'small mut' }, `Groupe : ${pc.party.length}/${partyMax()} (le grade et le rôle de Leader augmentent la taille).`));
  if (!pc.party.length) box.append(h('div', { class: 'mut', style: 'margin-top:8px' }, 'Tu voyages seul. Recrute des gens dans le menu « Recruter ».'));
  pc.party.forEach(a => { const c = CH[a.id]; box.append(h('div', { class: 'mrow', style: 'margin-top:8px;border-top:1px dashed var(--line);padding-top:6px' }, sprFit(c.id, 70, 'mini'), h('div', {}, h('b', {}, c.name), ` — ${F[c.faction].name}`, h('div', { class: 'small' }, `${STYLES[a.style].name} · PV ${a.hp}/${a.hpMax} · loyauté ${a.loy}${a.inj > 0 ? ' · blessé (' + a.inj + ' sem.)' : ''}`),
    h('div', { class: 'small mut' }, charPowerText(c)), (c.faction === pc.faction && c.stars > pc.grade) ? h('div', { class: 'small badc' }, `Plus haut placé que toi (${c.stars}★ contre ${pc.grade}★) : tu ne peux pas le renvoyer. Dépasse-le en hiérarchie.`) : h('button', { class: 'tab', onclick: e => { const b = e.currentTarget; if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = 'Confirmer le renvoi ?'; return; } removeAlly(a.id); addRep(c.faction, -3); render(true); } }, 'Renvoyer')))); });
  return box;
}
function charPowerText(c) { const ps = (c.powers.length ? c.powers : fallbackPowers(c)).map(id => PW[id].name); return ps.length ? ps.join(' + ') : 'sans pouvoir'; }
function tabFactions() {
  const pc = G.pc; const box = h('div', {}, h('div', { class: 'small mut' }, 'Trahir une faction braque ses alliés contre toi.'));
  const ids = Object.keys(F).filter(f => f !== 'civils').sort((a, b) => (pc.rep[b] || 0) - (pc.rep[a] || 0));
  const wl = (G.world.warLog || []).slice(0, 5); if (wl.length) { box.append(h('h3', {}, '⚔ Conflits en cours')); wl.forEach(x => box.append(h('div', { class: 'small' }, x))); }
  const t = h('table', { class: 't' }); ids.forEach(fid => { const v = pc.rep[fid] || 0; t.append(h('tr', {}, h('td', {}, F[fid].name + (fid === pc.faction ? ' ★' : '')), h('td', { class: v >= 15 ? 'good' : v <= -20 ? 'badc' : 'mut' }, repLevel(v)), h('td', {}, v))); });
  box.append(t); return box;
}
function tabPierres() {
  const box = h('div'); const g = h('div', { class: 'stones' });
  DATA.stones.forEach(s => g.append(h('div', { class: 'stone' + (G.pc.stones[s.id] ? ' have' : ''), style: `background:${s.color};color:${s.color}`, title: `${s.order}. ${s.name}` }, h('span', { style: 'color:#000;mix-blend-mode:normal' }, s.order))));
  box.append(g, h('div', { class: 'small mut', style: 'margin:6px 0' }, `${stoneCount()}/16. Les 16 pierres réunies = victoire immédiate.`));
  DATA.stones.forEach(s => {
    const have = !!G.pc.stones[s.id]; const known = have || G.world.stoneClue[s.id];
    const hold = G.world.stoneHolder[s.id];
    const where = have ? 'Tu la possèdes.' : known ? `${hold === 'temple' ? 'Cachée dans un temple' : hold === 'pnj-levant' ? 'Détenue par un descendant du peuple du feu' : 'Détenue par ' + (F[hold] ? F[hold].name : hold)} — ${stateName(G.world.stoneLoc[s.id])}` : 'Localisation inconnue (enquête nécessaire).';
    box.append(h('div', { style: 'margin-top:6px' }, h('b', { style: `color:${s.color}` }, `${s.order}. Pierre de ${s.name}`), ` · Royaume ${s.ruler}`, h('div', { class: 'small mut' }, where)));
    if (have) box.append(h('div', { class: 'glyph small' }, s.glyph, h('div', { class: 'mut' }, 'Anciens détenteurs : ' + s.holders), h('div', { class: 'mut' }, 'Lecture des héros : ' + s.heroes)));
  });
  return box;
}
function tabJournal() {
  const box = h('div'); box.append(h('h3', {}, 'Quêtes et objectifs')); box.append(questList());
  box.append(h('h3', {}, 'Actualités du monde'));
  const n = h('div', { class: 'news scroll', style: 'max-height:220px' }); G.world.news.slice(0, 12).forEach(x => n.append(h('div', {}, h('span', { class: 'mut' }, dateStr(x.wk) + ' — '), x.t)));
  if (!G.world.news.length) n.append(h('div', { class: 'mut' }, 'Rien à signaler.')); box.append(n);
  box.append(h('h3', {}, 'Ton journal')); const j = h('div', { class: 'news scroll', style: 'max-height:240px' }); G.log.slice(-25).reverse().forEach(x => j.append(h('div', {}, h('span', { class: 'mut' }, dateStr(x.wk) + ' — '), x.t))); box.append(j); return box;
}
function questList() {
  const pc = G.pc; const W = G.world; const d = h('div', { class: 'small' }); const li = (t, c) => d.append(h('div', { class: c || '', style: 'padding:2px 0' }, '• ' + t));
  if (G.world.premise) li('Scénario : ' + G.world.premise.t + ' — rival : ' + F[G.world.rival].name + ' (' + DATA.stones.filter(s => G.world.stoneHolder[s.id] === G.world.rival).length + ' pierres).', 'warnc');
  li(`<principale> Réunir les 16 pierres antiques : ${stoneCount()}/16.`.replace('<principale>', 'Quête principale :'), 'acc');
  const known = DATA.stones.filter(s => !pc.stones[s.id] && W.stoneClue[s.id]); known.slice(0, 5).forEach(s => li(`   Piste — pierre de ${s.name} : ${holderName(W.stoneHolder[s.id])}, ${stateName(W.stoneLoc[s.id])}.`, 'mut'));
  if (!known.length && stoneCount() < 16) li('   Aucune piste connue : mène l’enquête ou tends l’oreille (rumeurs, fouilles).', 'mut');
  if (pc.faction !== 'civils') { const nx = MERIT_STEPS[pc.grade + 1]; if (pc.grade < 5) li(`Faction : ${F[pc.faction].name} — mérite ${pc.merit}${nx ? '/' + nx : ''} pour le grade « ${gradeNames(pc)[pc.grade + 1]} »${nx && pc.merit >= nx && pc.grade < 4 ? ' (épreuve disponible !)' : ''}${pc.grade === 4 ? ' — prétends à la tête (menu Ta faction)' : ''}.`); }
  else li('Rejoins une faction (menu Ta faction) pour progresser en grade.');
  if (pc.implant) li(`Implant explosif : livre une prime avant le ${dateStr(pc.implant.deadline)} (ou fais-le retirer).`, 'badc');
  if (pc.flags.cap) li('Tu es captif : évade-toi, négocie ou accepte ton sort.', 'badc');
  const ter = DATA.states.filter(s => W.terr[s.id] === 'pc').length; if (ter) li(`Territoires contrôlés : ${ter}.`);
  if (typeof canonOffers === 'function') canonOffers().forEach(c => li('Événement canon ici : ' + c.title, 'acc'));
  return d;
}
function tabAide() {
  return h('div', { class: 'small', html: `<h3>Règles rapides</h3>
<p><b>But :</b> obtenir le plus gros score. Victoire immédiate avec les <b>16 pierres antiques</b>. Tu peux aussi <b>prendre ta retraite</b> (bonus de score) — mourir divise ton score.</p>
<p><b>Jets :</b> d20 + attribut + bonus (pouvoir, rôle, style, équipement, alliés) contre une difficulté. Le pourcentage est affiché.</p>
<p><b>Grade :</b> 1 à 5 ★ (5 = chef de faction). Plus tu montes, plus tu es recherché (<b>prime</b> ⭐ à ⭐⭐⭐⭐), plus tu es puissant. Recrue : aucune voix dans les décisions.</p>
<p><b>Prime :</b> ⭐ pays · ⭐⭐ État · ⭐⭐⭐ continent · ⭐⭐⭐⭐ monde. Les captifs peuvent être interrogés, emprisonnés, vendus, exécutés — ou devenir Fallen.</p>
<p><b>Pouvoirs :</b> alimentés par l’énergie (batterie). Sans énergie, la surcharge fait mal. L’Éveil (bouton en combat) est puissant mais risqué.</p>
<p><b>Orbitrail :</b> 13 lignes. Chaque voyage est suivi par les autorités : faux papiers et brouilleurs aident.</p>
<p><b>Réputation :</b> aider une faction plaît à ses alliés, la trahir braque ses alliés.</p>
<p class="mut">Choix verrouillés = visibles : argent, attribut, grade, rôle, lien ou pouvoir manquant.</p>` });
}

// ───────── Carte de l'Orbitrail (SVG) ─────────
const WRAPNAME = { Tokyo: 'yamato', Toronto: 'polaris', 'Nouméa': 'avaiki', Lima: 'aymaro' };
function mapEl(o = {}) {
  const NS = 'http://www.w3.org/2000/svg'; const el = (t, a, ...k) => { const e = document.createElementNS(NS, t); for (const x in a) e.setAttribute(x, a[x]); k.flat().forEach(c => e.append(c.nodeType ? c : document.createTextNode(c))); return e; };
  const svg = el('svg', { viewBox: '0 0 2000 975', class: 'map dark' });
  const CONTS = ['60,230 130,170 300,150 420,200 520,270 540,330 500,360 470,400 420,440 420,520 470,560 520,640 450,650 380,620 300,600 220,560 150,520 90,430 60,330', '470,640 560,650 640,690 660,780 620,880 560,960 500,940 470,870 440,800 420,720', '640,60 760,40 1100,30 1500,50 1800,150 1900,240 1850,330 1700,400 1640,440 1520,470 1400,520 1300,470 1180,420 1130,360 1000,330 900,330 820,300 760,320 700,260 640,200', '700,390 840,350 1000,370 1100,420 1160,520 1110,640 1090,760 1010,860 900,960 780,960 740,880 720,760 690,620 640,520', '1400,540 1500,560 1600,620 1560,680 1450,690 1380,640', '1560,740 1700,720 1830,760 1840,850 1760,900 1640,880 1580,830', '1690,300 1760,290 1790,350 1730,380'];
  svg.append(el('rect', { x: 0, y: 0, width: 2000, height: 975, fill: '#0a0a14' }));
  for (let gx = 0; gx <= 2000; gx += 100) svg.append(el('line', { x1: gx, y1: 0, x2: gx, y2: 975, stroke: '#171726', 'stroke-width': 1 }));
  for (let gy = 0; gy <= 975; gy += 100) svg.append(el('line', { x1: 0, y1: gy, x2: 2000, y2: gy, stroke: '#171726', 'stroke-width': 1 }));
  CONTS.forEach(c => svg.append(el('polygon', { points: c, fill: '#12121f', stroke: '#2a2a44', 'stroke-width': 2, 'stroke-linejoin': 'round' })));
  const pt = x => typeof x === 'string' ? (x.startsWith('@') ? x.slice(1).split('|').slice(1).map(Number) : [OT_ST[x][0], OT_ST[x][1]]) : x;
  for (const [ln, L] of Object.entries(OT_LINES)) L.p.forEach(path => {
    const pts = path.map(pt).map(p => p.join(',')).join(' ');
    svg.append(el('polyline', { points: pts, fill: 'none', stroke: L.c === '#151515' ? '#cfd3e6' : L.c, opacity: (o.hl && o.hl !== +ln) ? 0.13 : 1, 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    path.forEach(x => { if (typeof x === 'string' && x.startsWith('@')) { const [n, px, py] = x.slice(1).split('|'); const sid = WRAPNAME[n]; const go = !!(o.pick && o.pick.has(sid)); const gg = el('g', { class: 'st' + (go ? ' go' : '') }, el('circle', { cx: px, cy: py, r: 12, class: 'stc' + (o.here === sid ? ' here' : '') + (o.reco && o.reco.has(sid) ? ' reco' : ''), fill: '#fff', stroke: '#000', 'stroke-width': 5 }), el('text', { x: +px - 14, y: +py - 18, class: o.reco && o.reco.has(sid) ? 'recotxt' : '' }, n + ' ↺')); if (go) { gg.addEventListener('click', () => o.onPick(sid)); gg.append(el('circle', { cx: px, cy: py, r: 22, fill: 'transparent' })); } svg.append(gg); } });
  });
  for (const [id, v] of Object.entries(OT_ST)) {
    const [x, y, name, state, stub, dx, dy] = v; const here = o.here === state; const go = o.pick && o.pick.has(state);
    const rc = !!(o.reco && o.reco.has(state)); const g = el('g', { class: 'st' + (go ? ' go' : '') });
    if (rc) g.append(el('circle', { cx: x, cy: y, r: 20, fill: 'none', stroke: '#fcee09', 'stroke-width': 3, class: 'recoring' }));
    if (stub) g.append(el('rect', { x: x - 4, y: y - 13, width: 8, height: 26, class: 'stc stub' + (here ? ' here' : '') + (rc ? ' reco' : ''), fill: '#fff' })); else g.append(el('circle', { cx: x, cy: y, r: 12, class: 'stc' + (here ? ' here' : '') + (rc ? ' reco' : ''), fill: '#fff', stroke: '#000', 'stroke-width': 5 }));
    if (here) g.append(el('circle', { cx: x, cy: y, r: 22, fill: 'none', stroke: '#ff2a6d', 'stroke-width': 4 }));
    g.append(el('text', { x: x + dx, y: y + dy, class: rc ? 'recotxt' : (go || here) ? 'keytxt' : '' }, name));
    if (go) { g.addEventListener('click', () => o.onPick(state)); g.append(el('circle', { cx: x, cy: y, r: 20, fill: 'transparent' })); }
    svg.append(g);
  }
  if (o.routeObj) drawRoute(svg, o.routeObj);
  if (o.tile) { const kids = [...svg.childNodes]; [-1800, 1800].forEach(off => { const g = el('g', { transform: `translate(${off} 0)`, opacity: .5 }); kids.forEach(k => g.append(k.cloneNode(true))); svg.append(g); }); svg.prepend(el('rect', { x: -4000, y: -400, width: 9800, height: 1800, fill: '#0a0a14' })); }
  return svg;
}
const svgEl = (t, a) => { const e = document.createElementNS('http://www.w3.org/2000/svg', t); for (const x in a) e.setAttribute(x, a[x]); return e; };
function drawRoute(parent, routeObj) {
  const steps = routeObj && routeObj.steps; if (!steps || !steps.length || routeObj.custom) return null;
  const grp = svgEl('g', { class: 'routegrp', 'pointer-events': 'none' }); const runs = [[]];
  steps.forEach(st => { const g = edgeGeom(st.from, st.to, st.line); const cur = runs[runs.length - 1];
    if (g.off) { g.pts.slice(0, g.na).forEach(q => cur.push(q)); runs.push(g.pts.slice(g.na).map(q => [q[0] - g.off, q[1]])); }
    else g.pts.forEach((q, k) => { if (!(cur.length && k === 0)) cur.push(q); }); });
  runs.forEach(r => { const pts = r.map(q => q.join(',')).join(' '); grp.append(svgEl('polyline', { points: pts, fill: 'none', stroke: '#0a0a14', 'stroke-width': 17, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: .55 }), svgEl('polyline', { points: pts, fill: 'none', stroke: '#fff', 'stroke-width': 6, 'stroke-dasharray': '2 13', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'routeline' })); });
  const last = steps[steps.length - 1].to; [steps[0].from, last].forEach((id, k) => grp.append(svgEl('circle', { cx: OT_ST[id][0], cy: OT_ST[id][1], r: 16, fill: 'none', stroke: k ? '#ff2a6d' : '#fcee09', 'stroke-width': 4, class: 'pulse' })));
  parent.append(grp); return grp;
}
function wrapStub(a, b) { // point de sortie au bord de la carte pour la station a vers b
  const L = OT_LINES[(OT_WRAP.find(w => (w[0] === a && w[1] === b) || (w[1] === a && w[0] === b)) || [0, 0, 1])[2]];
  for (const path of L.p) { const i = path.indexOf(a); if (i < 0) continue; for (const d of [-1, 1]) for (let j = i + d; j >= 0 && j < path.length; j += d) { const it = path[j]; if (typeof it === 'string' && it.startsWith('@')) return it.slice(1).split('|').slice(1).map(Number); if (typeof it === 'string') break; } }
  return [OT_ST[a][0], OT_ST[a][1]];
}
function mapBox(o = {}) {
  let moved = false; const o2 = Object.assign({}, o, { onPick: sid => { if (moved) return; o.onPick && o.onPick(sid); } });
  const svg = mapEl(o2); svg.style.touchAction = 'none'; svg.style.cursor = 'grab';
  const wrap = h('div', { class: 'mapscroll' }, svg); let vb = { x: 0, y: 0, w: 2000, h: 975 };
  const cw = () => wrap.clientWidth || 600, chh = () => wrap.clientHeight || 380;
  let pend = 0, lastFs = 0, lastLod = null;
  const paint = () => { pend = 0; svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`); const fs = +(11.5 * vb.w / cw()).toFixed(0); if (fs !== lastFs) { lastFs = fs; svg.style.setProperty('--fs', fs + 'px'); } const lod = vb.w > 1300; if (lod !== lastLod) { lastLod = lod; svg.classList.toggle('lod', lod); } };
  const apply = () => { if (!isFinite(vb.w) || vb.w < 50) vb.w = 1100; vb.w = clamp(vb.w, 300, 2400); vb.h = vb.w * chh() / cw(); vb.x = clamp(isFinite(vb.x) ? vb.x : 0, -350, 2350 - vb.w); vb.y = clamp(isFinite(vb.y) ? vb.y : 0, -200, 1175 - vb.h); if (!pend) { pend = 1; requestAnimationFrame(paint); } };
  const focus = (sid, w) => { const st = OT_ST[stationOf(sid)]; vb.w = w; vb.h = vb.w * chh() / cw(); vb.x = st[0] - vb.w / 2; vb.y = st[1] - vb.h / 2; apply(); };
  const fit = () => { vb.w = 2000; vb.h = vb.w * chh() / cw(); vb.x = 0; vb.y = (975 - vb.h) / 2; apply(); };
  const zoomAt = (f, px, py) => { const nw = clamp(vb.w / f, 300, 2400); const rx = px == null ? .5 : px, ry = py == null ? .5 : py; const cx = vb.x + vb.w * rx, cy = vb.y + vb.h * ry; vb.w = nw; vb.h = nw * chh() / cw(); vb.x = cx - vb.w * rx; vb.y = cy - vb.h * ry; apply(); };
  const home = () => o.here ? focus(o.here, innerWidth < 700 ? 700 : 1100) : fit();
  const ptrs = new Map(); let lastD = 0, startX = 0, startY = 0;
  svg.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = false; startX = e.clientX; startY = e.clientY; lastD = 0; svg.style.cursor = 'grabbing'; });
  svg.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 7) { moved = true; try { svg.setPointerCapture(e.pointerId); } catch (x) { } } if (!moved) return;
    if (ptrs.size === 1) { vb.x -= (e.clientX - prev[0]) * vb.w / cw(); vb.y -= (e.clientY - prev[1]) * vb.h / chh(); apply(); }
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const r = wrap.getBoundingClientRect(); if (lastD) zoomAt(d / lastD, ((a[0] + b[0]) / 2 - r.left) / r.width, ((a[1] + b[1]) / 2 - r.top) / r.height); lastD = d; }
  });
  const up = e => { ptrs.delete(e.pointerId); lastD = 0; svg.style.cursor = 'grab'; setTimeout(() => { if (!ptrs.size) moved = false; }, 60); };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', e => { e.preventDefault(); const r = wrap.getBoundingClientRect(); zoomAt(Math.pow(1.0011, -e.deltaY), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }, { passive: false });
  svg.addEventListener('dblclick', e => { const r = wrap.getBoundingClientRect(); zoomAt(1.8, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
  const btn = (t, tip, f) => h('button', { class: 'ibtn', title: tip, onclick: f }, t);
  const box = h('div', { class: 'mapbox' }, h('div', { class: 'mapbtns' }, btn('＋', 'Zoom +', () => zoomAt(1.5)), btn('－', 'Zoom −', () => zoomAt(1 / 1.5)), btn('◎', 'Ma position', home), btn('⤢', 'Tout voir', fit)), wrap,
    o.reco ? h('div', { class: 'maplegend' }, h('span', { class: 'lg y' }, '● conseillé'), h('span', { class: 'lg w' }, '● autre station'), h('span', { class: 'lg c' }, '● toi')) : null,
    h('div', { class: 'maphint' }, innerWidth < 700 ? 'Glisse · pince pour zoomer · touche une station' : 'Glisse pour déplacer · molette pour zoomer · double-clic = zoom · clique une station allumée'));
  box.setRoute = r => { const old = svg.querySelector('.routegrp'); if (old) old.remove(); if (r) drawRoute(svg, r); };
  const init = () => { home(); }; setTimeout(init, 0); setTimeout(init, 120);
  if (window.ResizeObserver) { let rw = 0, rh = 0; new ResizeObserver(() => { if (wrap.clientWidth !== rw || wrap.clientHeight !== rh) { rw = wrap.clientWidth; rh = wrap.clientHeight; apply(); } }).observe(wrap); }
  return box;
}
function tabCarte() {
  const box = h('div'); box.append(mapBox({ here: G.loc, reco: recoStates() }), h('div', { class: 'small mut' }, 'Carte de l’Orbitrail (13 lignes). Tu es à ' + capName(G.loc) + '. Les traversées du Pacifique relient Toronto↔Tokyo (ligne 1) et Lima↔Nouméa (ligne 3).'));
  const legend = h('div', { class: 'row small', style: 'margin-top:6px' }); Object.entries(OT_LINES).forEach(([n, L]) => legend.append(h('span', {}, h('span', { style: `display:inline-block;width:14px;height:8px;background:${L.c};border:1px solid #000;margin-right:3px` }), n))); box.append(legend);
  return box;
}

// ───────── Destinations conseillées (jaune sur la carte) ─────────
function recoStates() {
  const m = new Map(); const pc = G.pc, W = G.world; const add = (st, why) => { if (!st || !S[st]) return; (m.get(st) || m.set(st, []).get(st)).push(why); };
  DATA.stones.forEach(s => { if (!pc.stones[s.id] && W.stoneClue[s.id]) add(W.stoneLoc[s.id], `Pierre de ${s.name} (${holderName(W.stoneHolder[s.id])})`); });
  (W.arcs || []).forEach(a => { if (!pc.flags['arc_' + a.id]) add(a.state, `Événement : ${a.title}`); });
  if (G.settings.canon) { const mm = dateOf(G.wk); const ym = mm.y * 12 + mm.m; DATA.arcs.forEach((arc, i) => { const [y, mo] = arc.date.split('-').map(Number); const am = y * 12 + mo - 1; if (am <= ym && ym - am <= 1 && !pc.flags['canon_' + i]) add(arc.state, `Canon : ${arc.title}`); }); }
  return m;
}
