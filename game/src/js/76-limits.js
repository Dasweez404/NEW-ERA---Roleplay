// ───────── Limites par destination : pierres et faction ne se jouent pas à l'infini ─────────
const ACT_MAX = { stone: 2, faction: 2, train: 1, dipl: 2 };
const actsUsed = k => ((G.pc.flags.acts || {})[k]) || 0;
function capActs(L, k, freeRe) {
  const used = actsUsed(k); const left = ACT_MAX[k] - used;
  L.forEach(c => {
    if (!c || c.lock || /^←/.test(c.label || '') || (freeRe && freeRe.test(c.label || ''))) return;
    const g = c.go;
    if (left <= 0) c.lock = `Assez pour cette ville (${ACT_MAX[k]} par destination) : change de destination`;
    else c.go = () => { const a = G.pc.flags.acts = G.pc.flags.acts || {}; a[k] = (a[k] || 0) + 1; g(); };
  });
  return Math.max(0, left);
}
