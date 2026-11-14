// ───────── Juiciness : sons, dé animé, cartons plein écran, particules, retours haptiques ─────────
const FX = { mute: (() => { try { return localStorage.getItem('newera.mute') === '1'; } catch (e) { return false; } })(), ac: null };
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function toggleMute() { FX.mute = !FX.mute; try { localStorage.setItem('newera.mute', FX.mute ? '1' : '0'); } catch (e) { } if (!FX.mute) sfx('click'); }
function audioCtx() { if (FX.ac) return FX.ac; try { FX.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } return FX.ac; }
function tone(freq, dur = 0.08, type = 'square', vol = 0.04, delay = 0, slide = 0) {
  if (FX.mute) return; const ac = audioCtx(); if (!ac) return; if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime + delay; const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.03);
}
const SFX = {
  click: () => tone(560, .045, 'square', .025), tick: () => tone(280 + Math.random() * 520, .03, 'square', .02),
  win: () => [523, 659, 784].forEach((f, i) => tone(f, .13, 'triangle', .06, i * .07)), lose: () => { tone(240, .3, 'sawtooth', .05, 0, -140); tone(160, .3, 'sawtooth', .04, .12, -80); },
  crit: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .15, 'triangle', .07, i * .06)), coin: () => { tone(988, .06, 'square', .035); tone(1319, .14, 'square', .035, .06); },
  hit: () => { tone(150, .13, 'sawtooth', .07, 0, -70); tone(90, .1, 'square', .05, .02); }, miss: () => tone(420, .09, 'triangle', .03, 0, -220), hurt: () => { tone(110, .22, 'sawtooth', .08, 0, -60); },
  heal: () => [523, 784].forEach((f, i) => tone(f, .1, 'sine', .05, i * .08)), stone: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .3, 'sine', .07, i * .1)),
  splash: () => { tone(200, .35, 'sawtooth', .04, 0, 300); tone(400, .3, 'triangle', .05, .1, 400); }, train: () => { tone(120, .5, 'sawtooth', .03, 0, 120); },
};
function sfx(n) { try { SFX[n] && SFX[n](); } catch (e) { } }
function buzz(ms) { try { if (navigator.vibrate && !FX.mute) navigator.vibrate(ms); } catch (e) { } }
function sceneSfx(sc) {
  const L = (sc.fx || []); if (L.some(l => /^\+\d[\d\s ]* ¢/.test(l.t))) setTimeout(() => sfx('coin'), sc.roll ? 1000 : 120);
  if (L.some(l => l.c === 'badc' && /PV/.test(l.t))) setTimeout(() => sfx('hurt'), sc.roll ? 1000 : 120);
  if (L.some(l => l.c === 'good' && /PV/.test(l.t))) setTimeout(() => sfx('heal'), 120);
}
function countUp(el, from, to, ms = 650) {
  if (REDUCED || from === to) { el.textContent = typeof to === 'number' && to > 999 ? fmt(to) : to; return; }
  const t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); const v = Math.round(from + (to - from) * e); el.textContent = Math.abs(to) > 999 || Math.abs(from) > 999 ? fmt(v) : v; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function shake(kind) { const a = $('#app'); if (!a || REDUCED) return; a.classList.remove('shake', 'shake-big'); void a.offsetWidth; a.classList.add(kind || 'shake'); buzz(kind ? 60 : 30); }
function flash(color) { const f = h('div', { class: 'flash', style: `--c:${color || '#ff3d7f'}` }); document.body.append(f); setTimeout(() => f.remove(), 450); }
function splash(o) {
  if (REDUCED && !o.force) return; sfx(o.cls === 'train' ? 'train' : 'splash');
  const el = h('div', { class: 'splash ' + (o.cls || ''), style: `--c:${o.color || '#ffe83a'}` }, h('div', { class: 'sp-in' }, o.icon ? h('div', { class: 'sp-ic' }, o.icon) : null, h('div', { class: 'sp-t' }, o.title), o.sub ? h('div', { class: 'sp-s' }, o.sub) : null));
  document.body.append(el); setTimeout(() => el.remove(), o.ms || 1900);
}
function burst(x, y, color, n = 22) {
  if (REDUCED) return; for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 120; const p = h('i', { class: 'particle', style: `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;--c:${color};--s:${4 + Math.random() * 6}px` });
    document.body.append(p); setTimeout(() => p.remove(), 1000);
  }
}
function burstAt(el, color, n) { if (!el) return; const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, color, n); }

// ───────── Dé ─────────
function diceEl(r, still) {
  const wrap = h('div', { class: 'dicebox ' + (still ? '' : 'rolling') });
  const num = h('span', { class: 'dnum' }, still ? r.r : '?'); const face = h('div', { class: 'dface' }, h('div', { class: 'dsq' }, num));
  const res = h('div', { class: 'dres' }, still ? '' : 'jet en cours…'); const sub = h('div', { class: 'dsub' }, `Difficulté ${r.dc} sur d20`);
  const parts = h('div', { class: 'dparts' });
  wrap.append(face, h('div', { class: 'dinfo' }, h('div', { class: 'dlab' }, `Test de ${(AT[r.attr] ? AT[r.attr].short : 'chance').toLowerCase()}`), res, sub, parts));
  const settle = (quiet) => {
    wrap.classList.remove('rolling'); wrap.classList.add(r.crit ? 'crit' : r.fumble ? 'fumble' : r.ok ? 'ok' : 'ko'); num.textContent = r.r;
    res.textContent = r.crit ? 'RÉUSSITE CRITIQUE' : r.fumble ? 'ÉCHEC CRITIQUE' : r.ok ? 'RÉUSSITE' : 'ÉCHEC';
    sub.textContent = `d20 ${r.r} ${r.mod >= 0 ? '+' : '−'} ${Math.abs(r.mod)} = ${r.total} · il fallait ${r.dc}+`;
    parts.append(...(r.parts || []).map(p => h('span', { class: 'dp ' + (p[1] < 0 ? 'neg' : '') }, `${p[1] >= 0 ? '+' : ''}${p[1]} ${p[0]}`)));
    if (!quiet) { sfx(r.crit ? 'crit' : r.ok ? 'win' : 'lose'); buzz(r.ok ? 25 : [40, 30, 60]); if (r.crit) { burstAt(face, '#ffe83a', 30); flash('#ffe83a'); } else if (r.fumble) { shake('shake-big'); flash('#ff3d7f'); } else if (!r.ok) shake(); else burstAt(face, '#35f0a0', 12); }
  };
  if (still || REDUCED) { settle(true); return wrap; }
  UI.after.push(() => {
    let n = 0; const iv = setInterval(() => { num.textContent = rint(1, 20); sfx('tick'); if (++n >= 8) { clearInterval(iv); settle(false); } }, 55);
  });
  return wrap;
}

// ───────── Entrées : clavier, ondulation tactile ─────────
document.addEventListener('keydown', e => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === 'm' || e.key === 'M') { toggleMute(); if (G && G.status === 'play') render(true); return; }
  if (e.key === 'Escape') { if (UI.sheetOpen) closeSheet(); return; }
  const bs = [...document.querySelectorAll('.choices .ch')].filter(b => !b.disabled);
  if (/^[1-9]$/.test(e.key)) { const b = document.querySelector(`.choices .ch[data-k="${e.key}"]`); if (b && !b.disabled) b.click(); }
  else if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) { const c = document.querySelector('.choices .ch.cta:not([disabled])'); if (c) { e.preventDefault(); c.click(); } }
});
document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.ch,.btn,.dk,.tab,.ibtn'); if (!b || b.disabled) return; const r = b.getBoundingClientRect(); b.style.setProperty('--rx', (e.clientX - r.left) + 'px'); b.style.setProperty('--ry', (e.clientY - r.top) + 'px'); b.classList.remove('rip'); void b.offsetWidth; b.classList.add('rip'); });

// ───────── Fond animé (pluie d'ogénite) ─────────
(function bg() {
  if (REDUCED) return; const cv = document.createElement('canvas'); cv.id = 'bg'; document.body.prepend(cv); const cx = cv.getContext('2d'); let W, Hh, drops = [];
  const resize = () => { W = cv.width = innerWidth; Hh = cv.height = innerHeight; drops = Array.from({ length: Math.min(70, Math.floor(W / 18)) }, () => ({ x: Math.random() * W, y: Math.random() * Hh, v: 1.2 + Math.random() * 2.2, l: 20 + Math.random() * 60, c: Math.random() < .3 ? '255,232,58' : Math.random() < .5 ? '39,240,255' : '170,120,255' })); };
  resize(); addEventListener('resize', resize);
  (function loop() { if (!document.hidden) { cx.clearRect(0, 0, W, Hh); drops.forEach(d => { cx.strokeStyle = `rgba(${d.c},.18)`; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(d.x, d.y); cx.lineTo(d.x - d.l * .12, d.y + d.l); cx.stroke(); d.y += d.v; d.x -= d.v * .12; if (d.y > Hh) { d.y = -d.l; d.x = Math.random() * W; } }); } requestAnimationFrame(loop); })();
})();
