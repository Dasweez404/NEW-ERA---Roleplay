// ───────── Villes cyberpunk : skylines néon générées (SVG, graine = nom de l'État) ─────────
function skylineURL(seed, hue, layer) {
  let s = (hashStr(seed + ':' + layer) || 7) >>> 0; const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 10000) / 10000; };
  const W = 1200, H = 200, base = layer ? '#07061a' : '#120d33'; let x = 0, o = '';
  while (x < W) {
    const bw = 22 + r() * (layer ? 62 : 46), bh = (layer ? 38 : 70) + r() * (layer ? 120 : 100);
    o += `<rect x="${x}" y="${H - bh}" width="${bw}" height="${bh}" fill="${base}" stroke="hsl(${hue},85%,50%)" stroke-opacity="${layer ? .55 : .3}"/>`;
    if (r() < .22) o += `<rect x="${x + bw / 2 - 1}" y="${H - bh - 20}" width="2" height="20" fill="hsl(${hue},90%,60%)"/><circle cx="${x + bw / 2}" cy="${H - bh - 20}" r="2.6" fill="#ff2a6d"/>`;
    if (layer && r() < .16) o += `<rect x="${x + 3}" y="${H - bh + 10}" width="${bw - 6}" height="9" fill="hsl(${r() < .5 ? hue : (hue + 160) % 360},100%,60%)" opacity=".85"/>`;
    const cols = Math.floor((bw - 6) / 9), rows = Math.floor((bh - 20) / 12);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (r() < (layer ? .26 : .13)) { const k = r(); const c = k < .5 ? '#fcee09' : k < .78 ? '#00f0ff' : '#ff2a6d'; o += `<rect x="${x + 4 + i * 9}" y="${H - bh + 20 + j * 12}" width="4" height="5" fill="${c}" opacity="${(.35 + r() * .65).toFixed(2)}"/>`; }
    x += bw + (r() < .3 ? 5 + r() * 12 : 1);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${o}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}
const CONT_HUE = { Europe: 200, 'Amérique': 300, Afrique: 38, Asie: 335, 'Océanie': 165 };
function fixDrift(root) { (root || document).querySelectorAll('.drift').forEach(e => { const hh = e.getBoundingClientRect().height || 118; e.style.setProperty('--tw', Math.round(1200 * hh / 200) + 'px'); e.style.backgroundSize = 'auto 100%'; }); }
const atomSVG = () => { const d = document.createElement('div'); d.innerHTML = '<svg class="atom" viewBox="0 0 100 100" fill="none" stroke="#fff" stroke-width="5"><g class="o"><ellipse cx="50" cy="50" rx="44" ry="15" stroke="#00f0ff"/></g><g class="o o2"><ellipse cx="50" cy="50" rx="44" ry="15" transform="rotate(60 50 50)" stroke="#00f0ff"/></g><g class="o"><ellipse cx="50" cy="50" rx="44" ry="15" transform="rotate(120 50 50)" stroke="#fcee09"/></g><circle cx="50" cy="50" r="7" fill="#fff" stroke="none"/></svg>'; return d.firstChild; };
function cityHead() { return envBanner(G.loc, innerWidth < 640 ? 140 : 190); }
