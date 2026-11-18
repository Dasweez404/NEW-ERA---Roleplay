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
