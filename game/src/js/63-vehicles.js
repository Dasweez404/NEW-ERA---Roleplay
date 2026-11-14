// ───────── Se déplacer autrement qu'en Orbitrail : véhicules à se procurer (légaux ou non, armés ou non) ─────────
const ISLANDS = new Set(['avaiki', 'aotea', 'kalimai', 'australis', 'sunda', 'banda', 'yamato', 'isgarde', 'antille', 'caribana', 'creocean']);
const COLD = new Set(['isgarde', 'scandor', 'polaris', 'slavo', 'baltovi', 'turkestan', 'aotea', 'sinotan']);
Object.assign(ITEMS, {
  trott: { n: 'Trottinette électrique', t: 'vehicule', price: 140, desc: 'Courts trajets (2 arrêts max) dans le même continent. Légale, silencieuse.', v: { ic: '🛴', spd: 1.5, max: 2, scope: 'continent', legal: 1 } },
  velo: { n: 'Vélo volant', t: 'vehicule', price: 380, desc: 'Trajets de 3 arrêts max, même continent, y compris au-dessus de l’eau. Légal.', v: { ic: '🚲', spd: 2, max: 3, scope: 'continent', legal: 1 } },
  board: { n: 'Hoverboard', t: 'vehicule', price: 650, desc: 'Rapide : 4 arrêts max dans le même continent. Toléré, mais interdit dans les zones de la F.A.', v: { ic: '🛹', spd: 3, max: 4, scope: 'continent', legal: 1 } },
  skis: { n: 'Skis cybernétiques', t: 'vehicule', price: 520, desc: 'Entre régions froides uniquement (Isgarde, Scandor, Polaris, Slavo, Baltovi, Turkestan, Aotea, Sinotan). Non traçable.', v: { ic: '⛷', spd: 2.5, max: 8, scope: 'cold', legal: 1 } },
  voiture: { n: 'Voiture électrique', t: 'vehicule', price: 1800, desc: 'Sur terre, dans le même continent (pas d’îles). Légale.', v: { ic: '🚗', spd: 4, max: 8, scope: 'land', legal: 1 } },
  voiture_b: { n: 'Voiture blindée armée', t: 'vehicule', price: 3300, black: true, desc: 'Illégale (armement lourd). Blindage et mitrailleuses : +2 en combat.', v: { ic: '🚙', spd: 4, max: 8, scope: 'land', legal: 0, armed: 1 } },
  vaisseau: { n: 'Vaisseau civil', t: 'vehicule', price: 5200, desc: 'Immatriculé et autorisé : n’importe où, vite, sans l’Orbitrail.', v: { ic: '🛸', spd: 8, max: 99, scope: 'any', legal: 1 } },
  hover: { n: 'Scout-hover sans plaque', t: 'vehicule', price: 3200, black: true, desc: 'Vaisseau léger non déclaré : n’importe où, non tracé, mais illégal.', v: { ic: '🛸', spd: 8, max: 99, scope: 'any', legal: 0 } },
  vaisseau_a: { n: 'Vaisseau armé', t: 'vehicule', price: 6800, black: true, desc: 'Canons à plasma, blindage : n’importe où, +2 en combat. Illégal.', v: { ic: '🚀', spd: 9, max: 99, scope: 'any', legal: 0, armed: 1 } },
});
SHOP_LEGAL.push('trott', 'velo', 'board', 'skis', 'voiture', 'vaisseau'); SHOP_BLACK.push('voiture_b', 'vaisseau_a', 'hover');
const SHOP_BLACK_FIX = SHOP_BLACK.filter((x, i, a) => a.indexOf(x) === i); SHOP_BLACK.length = 0; SHOP_BLACK.push(...SHOP_BLACK_FIX);
const myVehicles = () => Object.keys(G.pc.inv).filter(id => ITEMS[id] && ITEMS[id].t === 'vehicule');
function vehicleOk(vid, from, to) {
  const v = ITEMS[vid].v; if (from === to) return null; const r = otRoute(from, to); if (!r) return null; if (r.hops > v.max) return null;
  const a = S[from], b = S[to];
  if (v.scope === 'continent' && a.continent !== b.continent) return null;
  if (v.scope === 'land' && (a.continent !== b.continent || ISLANDS.has(from) || ISLANDS.has(to))) return null;
  if (v.scope === 'cold' && !(COLD.has(from) && COLD.has(to))) return null;
  return r;
}
function vehicleMenu() {
  const vs = myVehicles(); const L = vs.map(id => { const v = ITEMS[id].v; return C(`${v.ic} ${ITEMS[id].n}`, () => vehicleDest(id), { sub: `${v.legal ? 'Légal' : 'ILLÉGAL'}${v.armed ? ' · armé' : ''} · ${ITEMS[id].desc}` }); });
  if (!vs.length) L.push(Object.assign(C('Aucun véhicule', () => { }), { lock: 'Achète-en un au Marché (trottinette, vélo volant, hoverboard, skis, voiture, vaisseau… ou au Marché Noir)' }));
  L.push(C('← Retour', travelMenu)); show({ kicker: 'Véhicules', title: 'Voyager autrement', text: ['Un véhicule te libère de l’Orbitrail : pas de contrôle de gare, mais d’autres risques sur la route. Les illégaux attirent la F.A. ; les armés dissuadent les pillards.'], choices: L });
}
function vehicleDest(vid) {
  const v = ITEMS[vid].v; const L = [];
  DATA.states.forEach(s => { const r = vehicleOk(vid, G.loc, s.id); if (r) { const wk = Math.max(1, Math.ceil(r.hops / v.spd)); const fuel = 10 + r.hops * 6; L.push(C(`${s.capital} — ${s.name}`, () => vehicleGo(vid, s.id, wk, fuel, r), { sub: `${r.hops} arrêt(s) · ${wk} sem. · carburant ${fuel} ¢`, req: { money: fuel } })); } });
  if (!L.length) L.push(Object.assign(C('Aucune destination accessible', () => { }), { lock: 'Ce véhicule ne peut pas aller plus loin d’ici (portée, mer ou climat)' }));
  L.push(C('← Retour', vehicleMenu)); show({ kicker: ITEMS[vid].n, title: 'Destination', text: [`Depuis ${esc(capName(G.loc))}. ${ITEMS[vid].desc}`], extra: mapBox({ here: G.loc, pick: new Set(DATA.states.filter(s => vehicleOk(vid, G.loc, s.id)).map(s => s.id)), onPick: s => { const r = vehicleOk(vid, G.loc, s); const wk = Math.max(1, Math.ceil(r.hops / v.spd)); vehicleGo(vid, s, wk, 10 + r.hops * 6, r); } }), choices: L });
}
function vehicleGo(vid, to, wk, fuel, r) {
  const pc = G.pc; const v = ITEMS[vid].v; pc.money -= fuel; const from = G.loc;
  const a = OT_ST[stationOf(from)], b0 = OT_ST[stationOf(to)]; const dx = b0[0] - a[0]; const b = Math.abs(dx) > 900 ? [b0[0] - Math.sign(dx) * 1800, b0[1]] : b0; const mid = [(a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.08, (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.08];
  const fake = { steps: [{ from: stationOf(from), to: stationOf(to), line: 0 }], custom: [[a[0], a[1]], mid, [b[0], b[1]]], vehicle: v.ic };
  const ctl = !v.legal && chance(clamp(detectChance() + 0.12, 0.1, 0.8));
  transit(fake, from, to, () => {
    G.loc = to; advance(wk); if (G.status !== 'play') return; logEntry(`Voyage en ${ITEMS[vid].n} : ${capName(from)} → ${capName(to)}.`);
    const L = !v.legal ? fx({ heat: 2 }) : [];
    if (ctl) return controleFA(r);
    if (chance(0.32)) return (v.scope === 'any' || v.scope === 'cold' || chance(0.5)) ? (v.armed && chance(0.6) ? show({ kicker: 'Route', title: 'Pillards en vue', text: ['Des maraudeurs t’attendent… puis aperçoivent tes canons et décampent.'], fx: fx({ xp: 12 }), choices: [C('Continuer', hub)] }) : climateEvent()) : banditEvent();
    show({ extra: envBanner(to, 150), kicker: 'Arrivée', title: capName(to), text: [`${v.ic} Tu arrives à ${esc(capName(to))} sans passer par l’Orbitrail.`], fx: L, choices: [C('Continuer', hub)] });
  });
}
function vehicleCard() {
  const pool = ['velo', 'board', 'voiture', 'trott', 'skis'].filter(id => !hasItem(id)); if (!pool.length) return missionCard(); const id = pick(pool); const it = ITEMS[id];
  show({ kicker: 'OPPORTUNITÉ', title: `Un(e) ${it.n.toLowerCase()} sans surveillance`, text: ['Garé(e) dans une ruelle, verrou électronique sommaire. Personne en vue… sauf une caméra.'], choices: [C('Le/la fracturer (jet d’agilité)', () => { const r = check('agilite', dcOf(2), ['stealth', 'tech']); if (r.ok) show({ title: 'Volé', text: [`Le moteur ronronne : ${esc(it.n)} est à toi.`], fx: [...fx({ item: { [id]: 1 }, heat: 3 })], choices: [C('Continuer', hub)] }); else show({ title: 'Alarme !', text: ['La caméra t’a filmé.'], fx: fx({ heat: 5 }), choices: [C('Continuer', hub)] }); }, { odds: ['agilite', dcOf(2), ['stealth', 'tech']], cls: 'risk' }), C('Passer', hub, { cls: 'back' })] });
}
