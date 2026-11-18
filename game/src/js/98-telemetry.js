// ───────── Journal de partie (local) : enregistre ce qui se passe pour étudier et équilibrer ─────────
// Tout reste dans ton navigateur (localStorage). Rien n'est envoyé : tu peux exporter le fichier et me le donner.
const TELE_KEY = 'newera.tele.v1', TELE_ON = 'newera.tele.on';
const TELE = { on: true, sid: Math.random().toString(36).slice(2, 8), t0: Date.now(), ev: [], dirty: false };
(function () {
  try { const o = localStorage.getItem(TELE_ON); if (o === '0') TELE.on = false; const s = JSON.parse(localStorage.getItem(TELE_KEY) || 'null'); if (s && Array.isArray(s.ev)) TELE.ev = s.ev; } catch (e) { }
})();
function teleSave() { if (!TELE.dirty) return; TELE.dirty = false; try { if (TELE.ev.length > 4000) TELE.ev = TELE.ev.slice(-4000); localStorage.setItem(TELE_KEY, JSON.stringify({ ev: TELE.ev })); } catch (e) { } }
setInterval(teleSave, 4000); window.addEventListener('pagehide', teleSave);
function tele(k, d) {
  if (!TELE.on) return; try {
    const e = Object.assign({ k, s: TELE.sid, t: Math.round((Date.now() - TELE.t0) / 1000) }, d || {});
    if (typeof G !== 'undefined' && G && G.pc) { e.wk = G.wk; e.loc = G.loc; }
    TELE.ev.push(e); TELE.dirty = true;
  } catch (x) { }
}
// ── Accroches (ne changent aucun comportement) ──
(function () {
  const _show = show; show = function (sc) { try { tele('scene', { kick: String(sc.kicker || '').slice(0, 40), title: String(sc.title || '').slice(0, 50) }); } catch (e) { } return _show.apply(this, arguments); };
  const _check = check; check = function (attrId, dc, tags, extra) {
    let p = null; try { p = Math.round(odds(attrId, dc, tags || [], extra || 0) * 100); } catch (e) { }
    const r = _check.apply(this, arguments); tele('chk', { a: attrId, p, r: r.r, m: r.mod, dc: r.dc, ok: r.ok ? 1 : 0, tg: (tags || []).slice(0, 2).join('+') }); return r;
  };
  const _start = startCombat; startCombat = function (cfg) {
    const r = _start.apply(this, arguments); try { if (CB) tele('cb0', { N: CB.N, foes: CB.foes.map(f => f.tier || 0), lv: pcLevel(), P: +pcPower().toFixed(1), hp: G.pc.hp, hpM: G.pc.hpMax, en: G.pc.en, team: G.pc.party.length, gap: CB.thr && CB.thr.gap, ti: String(cfg.title || '').slice(0, 30) }); } catch (e) { } return r;
  };
  const _play = play; play = function (m) { try { if (CB) tele('mv', { rd: CB.round, id: String(m.label || m.id || m.kind).slice(0, 26), p: (m.attr && m.kind !== 'sig' && m.kind !== 'heal') ? Math.round(odds(...oddsOf(m)) * 100) : null, en: G.pc.en, hp: G.pc.hp }); } catch (e) { } return _play.apply(this, arguments); };
  const _fin = finishCombat; finishCombat = function (kind) {
    try { if (CB) tele('cb1', { out: kind === 'flee' ? 'flee' : CB.partial ? 'partial' : 'total', W: CB.W, L: CB.Lz, N: CB.N, hp: G.pc.hp, hpM: G.pc.hpMax }); } catch (e) { } return _fin.apply(this, arguments);
  };
  const _lose = loseCombat; loseCombat = function (s) { try { if (CB) tele('cb1', { out: 'lose', W: CB.W, L: CB.Lz, N: CB.N, hp: G.pc.hp, hpM: G.pc.hpMax }); } catch (e) { } return _lose.apply(this, arguments); };
  const _go = travelGo; travelGo = function (to, r, w) { tele('travel', { to, cost: r && r.cost, wks: w }); return _go.apply(this, arguments); };
  const _end = endGame; endGame = function (kind, cause) { try { tele('end', { kind, cause: String(cause || '').slice(0, 60), grade: G.pc.grade, stones: stoneCount(), wk: G.wk }); teleSave(); } catch (e) { } return _end.apply(this, arguments); };
})();
function teleDest() { try { const pc = G.pc; tele('dest', { n: pc.flags.dest, hp: pc.hp, hpM: pc.hpMax, en: pc.en, money: pc.money, P: +pcPower().toFixed(1), grade: pc.grade, st: stoneCount(), team: pc.party.length, heat: pc.heat, merit: pc.merit }); } catch (e) { } }

// ── Rapport ──
function teleReport() {
  const E = TELE.ev; const by = k => E.filter(e => e.k === k); const pct = (a, b) => b ? Math.round(a / b * 100) + ' %' : '—';
  const chk = by('chk'); const ok = chk.filter(e => e.ok).length; const exp = chk.reduce((t, e) => t + (e.p || 0), 0) / Math.max(1, chk.filter(e => e.p != null).length);
  const L = [];
  L.push(`Événements enregistrés : ${E.length} · parties : ${new Set(E.map(e => e.s)).size}`);
  L.push(`Jets : ${chk.length} · réussis ${pct(ok, chk.length)} (attendu ~${Math.round(exp)} %)`);
  const byA = {}; chk.forEach(e => { const x = byA[e.a] = byA[e.a] || { n: 0, ok: 0, p: 0 }; x.n++; x.ok += e.ok; x.p += e.p || 0; }); Object.keys(byA).forEach(a => L.push(`   · ${a} : ${byA[a].n} jets, ${pct(byA[a].ok, byA[a].n)} (attendu ${Math.round(byA[a].p / byA[a].n)} %)`));
  const c0 = by('cb0'), c1 = by('cb1'); const outs = { total: 0, partial: 0, flee: 0, lose: 0 }; c1.forEach(e => { outs[e.out] = (outs[e.out] || 0) + 1; });
  const lost = c1.length ? Math.round(c1.reduce((t, e) => t + (e.hpM ? 0 : 0), 0)) : 0;
  L.push(`Combats : ${c0.length} → totale ${outs.total}, repli ennemi ${outs.partial}, fuite/repli ${outs.flee}, défaite ${outs.lose}`);
  if (c0.length && c1.length) { const n = Math.min(c0.length, c1.length); let hl = 0; for (let i = 0; i < n; i++) hl += Math.max(0, (c0[i].hp || 0) - (c1[i].hp || 0)) / Math.max(1, c0[i].hpM || 1); L.push(`   · PV perdus par combat (moyenne) : ${Math.round(hl / n * 100)} %`); }
  const mv = {}; by('mv').forEach(e => { mv[e.id] = (mv[e.id] || 0) + 1; }); const tm = Object.entries(mv).sort((a, b) => b[1] - a[1]).slice(0, 6); if (tm.length) L.push('Gestes choisis : ' + tm.map(([k, v]) => `${k} ${v}`).join(' · '));
  const dest = by('dest'); if (dest.length) { const last = dest[dest.length - 1]; L.push(`Destinations : ${dest.length} · dernier état : PV ${last.hp}/${last.hpM}, ₵ ${last.money}, Puissance ${last.P}, grade ${last.grade}, pierres ${last.st}`); }
  const ends = by('end'); ends.forEach(e => L.push(`Fin de partie : ${e.kind} (${e.cause || '—'}) à la semaine ${e.wk}, grade ${e.grade}, ${e.stones} pierres`));
  const pk = {}; E.filter(e => e.k === 'pick').forEach(e => { pk[e.l] = (pk[e.l] || 0) + 1; }); const tp = Object.entries(pk).sort((a, b) => b[1] - a[1]).slice(0, 5); if (tp.length) L.push('Choix les plus pris : ' + tp.map(([k, v]) => `« ${k} » ×${v}`).join(' · '));
  return L;
}
function teleCopy() { const txt = teleReport().join('\n') + '\n\n' + JSON.stringify(TELE.ev.slice(-1500)); try { navigator.clipboard.writeText(txt).then(() => toast('Rapport copié'), () => toast('Copie impossible : utilise Exporter')); } catch (e) { toast('Copie impossible : utilise Exporter'); } }
function teleScreen() {
  teleSave(); const rep = teleReport();
  const L = [C(TELE.on ? '⏸  Pause de l’enregistrement' : '⏺  Reprendre l’enregistrement', () => { TELE.on = !TELE.on; try { localStorage.setItem(TELE_ON, TELE.on ? '1' : '0'); } catch (e) { } teleScreen(); }),
    C('📋  Copier le rapport', teleCopy), 
    C('🗑  Effacer le journal', () => { TELE.ev = []; TELE.dirty = true; teleSave(); teleScreen(); }, { cls: 'danger' }), C('← Retour', () => resumeScene())];
  const ta = h('textarea', { readonly: 'readonly', rows: 6, style: 'width:100%;background:#05050c;color:#9aa0c8;border:1px solid #2a2a44;font:11px monospace;margin-top:8px', onclick: e => e.target.select() }); ta.value = rep.join('\n') + '\n\n' + JSON.stringify(TELE.ev.slice(-1500));
  show({ kicker: 'Journal de partie', title: TELE.on ? '⏺ Enregistrement actif' : '⏸ En pause', extra: h('div', {}, h('div', { class: 'small mut' }, 'Si « Copier » ne marche pas : touche la zone ci-dessous, sélectionne tout et copie.'), ta), text: ['<span class="mut">Tout reste sur cet appareil. Exporte ou copie le rapport pour l’étudier ou me le transmettre.</span>', ...rep.map(x => esc(x))], choices: L });
}

// ───────── Journaux de bord : archive des parties terminées + partie en cours + traces techniques ─────────
const RUNS_KEY = 'newera.runs.v1';
function runText(meta) {
  const pc = G.pc; const L = [`JOURNAL DE BORD — ${pc.name} (${F[pc.faction] ? F[pc.faction].name : pc.faction})`, meta || '', `Grade ${pc.grade} · Puissance ${typeof pcPower === 'function' ? pcPower().toFixed(1) : '?'} · ${stoneCount()} pierre(s) · ${Math.floor(G.wk / 4)} mois · ₵ ${pc.money}`, ''];
  (G.log || []).forEach(e => L.push(`${dateStr(e.wk)} — ${e.t}`));
  if (G.world && G.world.news && G.world.news.length) { L.push('', 'DERNIÈRES NOUVELLES DU MONDE'); G.world.news.slice(0, 15).reverse().forEach(e => L.push(`${dateStr(e.wk)} — ${e.t}`)); }
  return L.filter(x => x != null).join('\n').replace(/<[^>]+>/g, '');
}
function archiveRun(kind, cause) {
  try {
    const arr = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]'); const pc = G.pc;
    arr.unshift({ at: Date.now(), name: pc.name, fac: F[pc.faction] ? F[pc.faction].name : pc.faction, kind, st: stoneCount(), mo: Math.floor(G.wk / 4), txt: runText(`Fin de partie : ${kind}${cause ? ' — ' + String(cause).replace(/<[^>]+>/g, '') : ''}`) });
    localStorage.setItem(RUNS_KEY, JSON.stringify(arr.slice(0, 8)));
  } catch (e) { }
}
(function () { const _e2 = endGame; endGame = function (kind, cause) { try { archiveRun(kind, cause); } catch (e) { } return _e2.apply(this, arguments); }; })();
function traceOf(sid) {
  const E = TELE.ev.filter(e => e.s === sid); const L = [`TRACE TECHNIQUE — session ${sid} (${E.length} événements)`, ''];
  E.forEach(e => { if (e.k === 'scene') L.push(`sem. ${e.wk == null ? '—' : e.wk}${e.loc ? ' · ' + e.loc : ''} · ${e.kick ? e.kick + ' — ' : ''}${e.title || ''}`); else if (e.k === 'travel') L.push(`sem. ${e.wk} · voyage → ${e.to}`); else if (e.k === 'cb0') L.push(`sem. ${e.wk} · combat (${e.foes.length} ennemis)`); else if (e.k === 'cb1') L.push(`   issue : ${e.out}`); else if (e.k === 'end') L.push(`FIN : ${e.kind} ${e.cause || ''} (sem. ${e.wk}, ${e.stones} pierres)`); });
  return L.join('\n');
}
function runView(title, txt, back) {
  const ta = h('textarea', { readonly: 'readonly', rows: 14, style: 'width:100%;background:#05050c;color:#c8ccf0;border:1px solid #2a2a44;font:12px monospace;margin-top:8px', onclick: e => e.target.select() }); ta.value = txt;
  show({ kicker: 'Journal de bord', title, extra: h('div', {}, h('div', { class: 'small mut' }, 'Touche la zone, sélectionne tout et copie (le téléchargement de fichier est bloqué ici).'), ta), choices: [C('📋 Copier', () => { try { navigator.clipboard.writeText(txt).then(() => toast('Journal copié'), () => { ta.select(); toast('Sélectionné : copie-le'); }); } catch (e) { ta.select(); toast('Sélectionné : copie-le'); } }, { cls: 'cta' }), C('← Retour', back || runsScreen)] });
}
function runsScreen() {
  const L = []; let arr = []; try { arr = JSON.parse(localStorage.getItem(RUNS_KEY) || '[]'); } catch (e) { }
  if (G && G.pc && G.status === 'play') L.push(C('📖 Partie en cours', () => runView('Partie en cours', runText('Partie en cours'), runsScreen), { ic: '▶' }));
  arr.forEach((r, i) => L.push(C(`${r.name} · ${r.fac}`, () => runView(r.name, r.txt, runsScreen), { ic: r.kind === 'win' || /vic/i.test(r.kind) ? '🏆' : '💀', sub: `${new Date(r.at).toLocaleDateString('fr-FR')} · ${r.kind} · ${r.st} pierre(s) · ${r.mo} mois` })));
  const sids = [...new Set(TELE.ev.map(e => e.s))].reverse().slice(0, 8);
  sids.forEach(sid => { const n = TELE.ev.filter(e => e.s === sid && e.k === 'scene').length; if (n) L.push(C(`🧾 Trace technique · ${sid}`, () => runView('Trace technique', traceOf(sid), runsScreen), { sub: `${n} écrans · retrouvée dans le journal d’équilibrage (parties jouées avant cette version)` })); });
  if (!L.length) L.push(Object.assign(C('Aucun journal pour l’instant', () => { }), { lock: 'Les journaux des parties terminées sont désormais conservés ici.' }));
  L.push(C('← Retour', () => (G && G.pc ? resumeScene() : titleScreen()), { cls: 'back' }));
  show({ kicker: 'Journaux', title: 'Journaux de bord', text: ['Chaque partie terminée est archivée. Les parties jouées avant cette mise à jour n’ont gardé qu’une trace technique (si leur journal d’équilibrage existe encore dans ce navigateur).'], choices: L });
}
