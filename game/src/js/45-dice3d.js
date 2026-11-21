// ───────── Dé 3D : icosaèdre (d20) dessiné en canvas, faces ombrées, la face du résultat finit face à toi ─────────
const D3 = (() => {
  const p = (1 + Math.sqrt(5)) / 2; const raw = [[0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p], [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0], [p, 0, 1], [-p, 0, 1], [p, 0, -1], [-p, 0, -1]];
  const V = raw.map(v => { const l = Math.hypot(...v); return v.map(x => x / l); });
  const F = [[0, 1, 8], [0, 8, 4], [0, 4, 5], [0, 5, 9], [0, 9, 1], [1, 6, 8], [8, 6, 10], [8, 10, 4], [4, 10, 2], [4, 2, 5], [5, 2, 11], [5, 11, 9], [9, 11, 7], [9, 7, 1], [1, 7, 6], [3, 6, 7], [3, 7, 11], [3, 11, 2], [3, 2, 10], [3, 10, 6]];
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
  const faceN = f => norm(cross(sub(V[f[1]], V[f[0]]), sub(V[f[2]], V[f[0]])));
  const cen = f => f[0] === undefined ? [0, 0, 0] : [0, 1, 2].map(i => (V[f[0]][i] + V[f[1]][i] + V[f[2]][i]) / 3);
  const mul = (A, B) => A.map((r, i) => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const app = (M, v) => M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const axisAngle = (a, t) => { const [x, y, z] = a, c = Math.cos(t), s = Math.sin(t), k = 1 - c; return [[c + x * x * k, x * y * k - z * s, x * z * k + y * s], [y * x * k + z * s, c + y * y * k, y * z * k - x * s], [z * x * k - y * s, z * y * k + x * s, c + z * z * k]]; };
  const Rz = t => axisAngle([0, 0, 1], t);
  const NUM = i => i + 1;
  function target(fi) {
    const n = faceN(F[fi]); const z = [0, 0, 1]; const ax = cross(n, z); const l = Math.hypot(...ax); const ang = Math.acos(Math.max(-1, Math.min(1, n[2])));
    let R = l < 1e-6 ? (n[2] > 0 ? [[1, 0, 0], [0, 1, 0], [0, 0, 1]] : axisAngle([1, 0, 0], Math.PI)) : axisAngle(ax.map(x => x / l), ang);
    const v0 = app(R, sub(V[F[fi][0]], cen(F[fi]))); const tw = -Math.PI / 2 - Math.atan2(v0[1], v0[0]);
    return mul(Rz(tw), R);
  }
  function draw(cv, R, rgb, S) {
    const c = cv.getContext('2d'); c.setTransform(cv.width / S, 0, 0, cv.width / S, 0, 0); c.clearRect(0, 0, S, S);
    const sc = S * 0.43, cx = S / 2, cy = S / 2; const L = norm([-0.35, -0.55, 1]);
    F.forEach((f, i) => {
      const n = app(R, faceN(f)); if (n[2] <= 0.02) return;
      const pts = f.map(k => app(R, V[k])); const br = 0.28 + 0.72 * Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      c.beginPath(); pts.forEach((q, j) => j ? c.lineTo(cx + q[0] * sc, cy + q[1] * sc) : c.moveTo(cx + q[0] * sc, cy + q[1] * sc)); c.closePath();
      c.fillStyle = `rgb(${rgb.map(x => Math.round(x * br)).join(',')})`; c.fill(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.9; c.lineJoin = 'round'; c.stroke();
      const m = app(R, cen(f)); const v0 = app(R, sub(V[f[0]], cen(f))); const rot = Math.atan2(v0[1], v0[0]) + Math.PI / 2;
      const fs = S * 0.19 * (0.5 + 0.5 * n[2]) * (NUM(i) > 9 ? 0.82 : 1);
      c.save(); c.translate(cx + m[0] * sc, cy + m[1] * sc); c.rotate(rot); c.scale(1, 0.4 + 0.6 * n[2]); c.fillStyle = `rgba(255,255,255,${0.35 + 0.65 * n[2]})`; c.font = `800 ${fs}px Orbitron, Rajdhani, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(NUM(i), 0, 0); c.restore();
    });
  }
  // lance le dé : retourne une fonction d'arrêt immédiat
  function roll(cv, value, ms, rgbFn, done) {
    const S = 88, dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.height = S * dpr; cv.style.width = cv.style.height = S + 'px';
    const T = target(value - 1); const ax = norm([Math.random() - .5, Math.random() - .5, Math.random() - .5]); const a0 = Math.PI * (5 + Math.random() * 2) * (Math.random() < .5 ? 1 : -1);
    const t0 = performance.now(); let alive = true;
    const step = now => { if (!alive) return; const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3); const R = mul(axisAngle(ax, a0 * (1 - e)), T); draw(cv, R, t < 1 ? [0, 190, 225] : rgbFn(), S); if (t < 1) requestAnimationFrame(step); else done && done(); };
    requestAnimationFrame(step); return () => { alive = false; };
  }
  function still(cv, value, rgb) { const S = 88, dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.height = S * dpr; cv.style.width = cv.style.height = S + 'px'; draw(cv, target(value - 1), rgb, S); }
  return { roll, still };
})();

// ───────── Cristal 3D : bipyramide hexagonale tournante aux couleurs de la pierre ─────────
function gem3d(color, S = 96) {
  const cv = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = cv.height = S * dpr; cv.style.width = cv.style.height = S + 'px'; cv.className = 'gem3d';
  const hex = /^#/.test(color) ? color.replace('#', '') : 'ffe83a'; const f = hex.length === 3 ? hex.split('').map(x => x + x).join('') : hex.padEnd(6, '0');
  const rgb = [0, 2, 4].map(i => parseInt(f.substr(i, 2), 16) || 200);
  const top = [0, -1.15, 0], bot = [0, 1.15, 0]; const n = 6; const gird = Array.from({ length: n }, (_, i) => [Math.cos(i / n * Math.PI * 2) * .78, 0, Math.sin(i / n * Math.PI * 2) * .78]);
  const crown = gird.map(g => [g[0] * .52, -.5, g[2] * .52]);
  const rot = (v, a, b) => { let [x, y, z] = v; let c = Math.cos(a), s = Math.sin(a); [x, z] = [x * c + z * s, -x * s + z * c]; c = Math.cos(b); s = Math.sin(b); [y, z] = [y * c - z * s, y * s + z * c]; return [x, y, z]; };
  const t0 = performance.now(); const c = cv.getContext('2d');
  const step = now => {
    if (!cv.isConnected && now - t0 > 400) return;
    const a = (now - t0) / 900, b = 0.35; c.setTransform(cv.width / S, 0, 0, cv.width / S, 0, 0); c.clearRect(0, 0, S, S);
    const P = v => { const r = rot(v, a, b); return [S / 2 + r[0] * S * .34, S / 2 + r[1] * S * .34, r[2]]; };
    const tris = []; for (let i = 0; i < n; i++) { const j = (i + 1) % n; tris.push([P(top), P(crown[i]), P(crown[j])], [P(crown[i]), P(gird[i]), P(gird[j])], [P(crown[i]), P(gird[j]), P(crown[j])], [P(gird[i]), P(bot), P(gird[j])]); }
    tris.sort((u, w) => (u[0][2] + u[1][2] + u[2][2]) - (w[0][2] + w[1][2] + w[2][2]));
    for (const tr of tris) {
      const nx = (tr[1][0] - tr[0][0]) * (tr[2][1] - tr[0][1]) - (tr[1][1] - tr[0][1]) * (tr[2][0] - tr[0][0]); const lum = 0.45 + 0.55 * Math.abs(Math.sin((tr[0][0] + tr[1][1] + tr[2][0]) * .09 + a * 1.3));
      c.beginPath(); c.moveTo(tr[0][0], tr[0][1]); c.lineTo(tr[1][0], tr[1][1]); c.lineTo(tr[2][0], tr[2][1]); c.closePath();
      c.fillStyle = `rgba(${rgb.map(x => Math.min(255, Math.round(x * lum + 40 * lum))).join(',')},${nx > 0 ? .92 : .82})`; c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = .8; c.stroke();
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step); return cv;
}
