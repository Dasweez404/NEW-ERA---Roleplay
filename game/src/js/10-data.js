// ───────── Données du monde (issues de DATA = PDF + CSV + XLSX) et règles de jeu ─────────
const S = {}; DATA.states.forEach(s => S[s.id] = s);
const F = {}; DATA.factions.forEach(f => F[f.id] = f);
const CH = {}; DATA.chars.forEach(c => CH[c.id] = c);
// Décalage des rangs : le plus fort d'une faction en est le chef (5★) ; si son maximum est 4★ (ou 3★…), tous les rangs montent d'autant
DATA.factions.forEach(f => {
  const ms = DATA.chars.filter(c => c.faction === f.id); if (!ms.length) return;
  const mx = Math.max(...ms.map(c => c.stars)); if (mx <= 0) return;
  const sh = 5 - mx; if (sh > 0) ms.forEach(c => { if (c.stars > 0) c.stars = Math.min(5, c.stars + sh); });
  const keep = (f.leaders || []).filter(l => CH[l] && CH[l].faction === f.id && CH[l].stars === 5);
  if (keep.length) f.leaders = keep; else { const top = ms.filter(c => c.stars === 5); if (top.length) f.leaders = [top[0].id]; }
});
const PW = {}; DATA.powers.forEach(p => PW[p.id] = p);
const STONE = {}; DATA.stones.forEach(s => STONE[s.id] = s);
const CONT = ['Europe', 'Amérique', 'Afrique', 'Asie', 'Océanie'];
const ZSHORT = z => (z || '').replace(/^Zone \d+ : /, '');

// 5 attributs (choix de l'utilisateur)
const ATTRS = [
  { id: 'corps', name: 'Force / Corps', short: 'Corps', desc: 'Frapper fort, encaisser, porter, résister.' },
  { id: 'agilite', name: 'Agilité / Vitesse', short: 'Agilité', desc: 'Esquiver, fuir, se faufiler, piloter.' },
  { id: 'intellect', name: 'Intellect / Technique', short: 'Intellect', desc: 'Enquêter, pirater, bricoler, soigner, planifier.' },
  { id: 'charisme', name: 'Charisme / Sang-froid', short: 'Charisme', desc: 'Convaincre, mentir, diriger, garder son calme.' },
  { id: 'maitrise', name: 'Maîtrise', short: 'Maîtrise', desc: 'Contrôle du pouvoir : énergie, précision, risque de surcharge.' },
];
const AT = {}; ATTRS.forEach(a => AT[a.id] = a);

// 8 styles de combat (PDF p.33)
const STYLES = {
  brawler: { name: 'Brawler', grp: 'Offensif', desc: 'Spécialisé dans la maîtrise du combat et des armes.', prim: 'corps', sec: 'agilite', tag: 'combat', tech: { name: 'Enchaînement', cost: 3, text: 'deux coups rapprochés' } },
  performer: { name: 'Performer', grp: 'Offensif', desc: 'Spécialisé dans la maîtrise des super-pouvoirs.', prim: 'maitrise', sec: 'charisme', tag: 'combat', tech: { name: 'Surcharge', cost: 4, text: 'pouvoir à pleine puissance' } },
  juggernaut: { name: 'Juggernaut', grp: 'Défensif', desc: 'Protection de soi : encaisser et durer.', prim: 'corps', sec: 'maitrise', tag: 'defense', tech: { name: 'Carapace', cost: 3, text: 'se protège et riposte' } },
  protector: { name: 'Protector', grp: 'Défensif', desc: 'Protection des autres : tenir la ligne pour son équipe.', prim: 'corps', sec: 'charisme', tag: 'defense', tech: { name: 'Rempart', cost: 3, text: 'protège tout le groupe' } },
  flanker: { name: 'Flanker', grp: 'Technique', desc: 'Habileté au déplacement : prendre à revers, disparaître.', prim: 'agilite', sec: 'corps', tag: 'mobility', tech: { name: 'Prise à revers', cost: 3, text: 'frappe en angle mort' } },
  ranger: { name: 'Ranger', grp: 'Technique', desc: 'Spécialisé dans la précision : un tir, une cible.', prim: 'agilite', sec: 'intellect', tag: 'scout', tech: { name: 'Tir précis', cost: 3, text: 'tir qui ne rate pas' } },
  assist: { name: 'Assist', grp: 'Soutien', desc: 'Soutien des alliés et déstabilisation des adversaires.', prim: 'charisme', sec: 'intellect', tag: 'social', tech: { name: 'Déstabiliser', cost: 3, text: 'affaiblit l’ennemi, galvanise les alliés' } },
  engineer: { name: 'Engineer', grp: 'Soutien', desc: 'Création d’équipement pour les autres.', prim: 'intellect', sec: 'maitrise', tag: 'tech', tech: { name: 'Gadget improvisé', cost: 3, text: 'déploie un drone de combat' } },
};

// Rôles (liste de l'utilisateur ; « costumier » était en double → une seule entrée)
const ROLE_IC = { eclaireur: '🔭', combattant: '⚔', artilleur: '🎯', leader: '📣', medecin: '🩺', ingenieur: '🔧', costumier: '🎭', hacker: '💻', gardien: '🛡', logisticien: '📦', strategiste: '♟', infiltre: '🥷', pilote: '🏎', diplomate: '🕊', dompteur: '🐺' };
const ROLES = {
  eclaireur: { name: 'Éclaireur', tag: 'scout', desc: 'Repère les dangers et ouvre la voie.', req: { attr: ['agilite', 5] }, perk: 'Repérage : bonus aux enquêtes et aux embuscades évitées.' },
  combattant: { name: 'Combattant', tag: 'combat', desc: 'En première ligne.', req: { attr: ['corps', 5] }, perk: 'Bonus de dégâts et de toucher.' },
  artilleur: { name: 'Artilleur', tag: 'ranged', desc: 'Puissance de feu à distance.', req: { attr: ['agilite', 5], style: ['ranger', 'engineer', 'performer'] }, perk: 'Bonus à distance, accès aux armes lourdes.' },
  leader: { name: 'Leader', tag: 'social', desc: 'Entraîne et inspire.', req: { attr: ['charisme', 6], grade: 1 }, perk: 'Alliés plus forts et plus loyaux.' },
  medecin: { name: 'Médecin', tag: 'heal', desc: 'Soigne les corps et les âmes.', req: { attr: ['intellect', 5] }, perk: 'Soins améliorés, missions humanitaires.' },
  ingenieur: { name: 'Ingénieur', tag: 'tech', desc: 'Construit, répare, bricole.', req: { attr: ['intellect', 6] }, perk: 'Gadgets gratuits, sabotage, mechas.' },
  costumier: { name: 'Costumier', tag: 'disguise', desc: 'Déguisements, fausses identités, tenues.', req: { attr: ['charisme', 5] }, perk: 'Infiltration sociale, faux papiers moins chers.' },
  hacker: { name: 'Hacker', tag: 'hack', desc: 'Réseaux, droïdes, caméras.', req: { attr: ['intellect', 6] }, perk: 'Piratage, désactivation de robots.' },
  gardien: { name: 'Gardien', tag: 'defense', desc: 'Protège un lieu, une personne, une position.', req: { attr: ['corps', 5], style: ['juggernaut', 'protector', 'brawler'] }, perk: 'Défense de territoire, escortes.' },
  logisticien: { name: 'Logisticien', tag: 'logi', desc: 'Ravitaillement, budgets, transports.', req: { attr: ['intellect', 5] }, perk: 'Coûts réduits, recrues moins chères.' },
  infiltre: { name: 'Infiltré', tag: 'stealth', desc: 'Passe partout sans laisser de trace.', req: { attr: ['agilite', 6] }, perk: 'Discrétion : bonus aux infiltrations et aux évasions.' },
  pilote: { name: 'Pilote', tag: 'mobility', desc: 'Roule, vole, fuit vite.', req: { attr: ['agilite', 5] }, perk: 'Courses, poursuites et trajets plus faciles.' },
  diplomate: { name: 'Diplomate', tag: 'social', desc: 'Désamorce, négocie, convainc.', req: { attr: ['charisme', 6], grade: 1 }, perk: 'Bonus de négociation et de médiation.' },
  dompteur: { name: 'Dompteur', tag: 'control', desc: 'Apaise les créatures et les foules.', req: { attr: ['maitrise', 5] }, perk: 'Bonus face aux bêtes et aux situations à contrôler.' },
  strategiste: { name: 'Stratégiste', tag: 'strat', desc: 'Plans, batailles, alliances.', req: { attr: ['intellect', 7], grade: 1 }, perk: 'Bonus en bataille et en décisions de faction.' },
};

const GRADES = ['Recrue', 'Membre', 'Cadre', 'Commandant', 'Bras droit', 'Chef'];
const GRADES_FA = ['Recrue', 'Officier', 'Capitaine', 'Colonel', 'Général', 'Maréchal'];
const GRADES_FALLEN = ['Condamné', 'Traqueur', 'Pisteur', 'Chasseur', 'Sentence', 'Chef de brigade'];
const MERIT_BASE = [0, 30, 90, 180, 320, 520]; const MERIT_STEPS = MERIT_BASE.slice();  // mérite cumulé requis pour le grade n
const WANTED_TXT = ['Aucune prime', 'Recherché dans son pays', 'Recherché dans son État', 'Recherché sur son continent', 'Recherché sur tout le globe'];
const WANTED_STEPS = [0, 10, 35, 60, 85];

// Pouvoirs : familles / étiquettes
const TAGNAME = { combat: 'combat', defense: 'défense', stealth: 'furtivité', scout: 'repérage', social: 'social', hack: 'piratage', heal: 'soins', mobility: 'mobilité', tech: 'technique', control: 'contrôle' };
const TYPENAME = { zoologique: 'Zoologique', surnaturel: 'Surnaturel', elementaire: 'Élémentaire', hybride: 'Hybride', aucun: 'Aucun pouvoir' };
const TYPEDESC = {
  zoologique: 'Anthropomorphe : humain autant qu’animal, tu gagnes les avantages des deux côtés. 99 % des géno-porteurs. Seuls les zoologiques peuvent avoir une identité civile complète. Éveil : bête féroce incontrôlable.',
  surnaturel: 'Modifie ton corps ou agit sur ce qui t’entoure. Catégorie la plus commune après les zoologiques. Éveil : capacités amplifiées au maximum.',
  elementaire: 'Maîtrise, transformation et génération d’un élément naturel. Très rare. Éveil : transformation en demi-dieu.',
  hybride: 'Deux pouvoirs à la fois, mais jamais le plein potentiel de chacun. Pas de la même famille (sauf deux surnaturels).',
};
const WEAK = {  // faiblesses (IMPROVISÉ : « chaque pouvoir a sa propre faiblesse »)
  zoologique: 'Instincts de l’animal : certains stimuli (odeurs, bruits, prédateurs) te font perdre ton sang-froid.',
  surnaturel: 'Épuisement : un usage prolongé te vide ; les forts chocs émotionnels dérèglent le pouvoir.',
  elementaire: 'Dépendance à l’élément : privé de sa source ou en milieu opposé, tu faiblis.',
};

// ───────── Orbitrail (carte du PDF p.13 / image fournie) ─────────
// Stations : id -> [x, y, nom affiché, id de l'État, stub?, dx, dy]
const OT_ST = {
  stockholm: [737, 62, 'Stockholm', 'scandor', 0, -22, -14], amsterdam: [737, 162, 'Amsterdam', 'benelux', 0, 12, -20], berlin: [812, 187, 'Berlin', 'mitropa', 0, -52, 4],
  reykjavik: [637, 162, 'Reykjavik', 'isgarde', 1, -62, 4], paris: [737, 237, 'Paris', 'gallica', 0, 14, -18], londres: [637, 237, 'Londres', 'albion', 0, -12, 26],
  madrid: [737, 312, 'Madrid', 'iberico', 1, -46, 10], rome: [862, 262, 'Rome', 'alpomare', 0, 14, -2], athenes: [912, 287, 'Athènes', 'balka', 0, 14, 26],
  kiev: [1012, 237, 'Kiev', 'carpodav', 0, -10, 26], istanbul: [1062, 287, 'Istanbul', 'caucase', 0, -6, -16], minsk: [1037, 162, 'Minsk', 'baltovi', 0, 16, 4],
  moscou: [1212, 112, 'Moscou', 'slavo', 0, 16, 4], bagdad: [1162, 312, 'Bagdad', 'levant', 0, -4, 26], teheran: [1312, 312, 'Téhéran', 'khora', 0, -6, -18],
  tachkent: [1387, 287, 'Tachkent', 'turkestan', 0, -10, -18], pekin: [1512, 287, 'Pékin', 'sinotan', 0, -10, -18], seoul: [1612, 287, 'Séoul', 'koryo', 0, -10, -18],
  tokyo: [1712, 262, 'Tokyo', 'yamato', 0, -14, -20], alger: [812, 387, 'Alger', 'maghreb', 0, -12, -18], lecaire: [912, 387, 'Le Caire', 'saha', 0, -12, 28],
  riyad: [1137, 387, 'Riyad', 'machrek', 0, 14, 26], newdehli: [1362, 387, 'New Dehli', 'bengal', 0, -4, 28], bangkok: [1487, 412, 'Bangkok', 'siamar', 0, -10, -18],
  saigon: [1612, 412, 'Saïgon', 'annam', 0, -10, -18], manille: [1787, 412, 'Manille', 'sunda', 0, 12, 4], dakar: [687, 462, 'Dakar', 'westrian', 0, 14, -4],
  abidjan: [717, 562, 'Abidjan', 'mandesia', 1, 12, -6], lagos: [812, 587, 'Lagos', 'sahel', 0, 14, -16], addis: [1087, 562, 'Addis Abeba', 'nubie', 0, 16, 0],
  kinshasa: [812, 737, 'Kinshasa', 'ekatori', 0, -58, 4], nairobi: [962, 737, 'Nairobi', 'swahilis', 0, 14, -2], luanda: [812, 837, 'Luanda', 'okavango', 0, -52, 4],
  lusaka: [912, 837, 'Lusaka', 'nyasa', 0, -6, -18], tananarive: [1062, 837, 'Tananarive', 'creocean', 0, 14, 4], lecap: [812, 937, 'Le Cap', 'ubunye', 0, 14, -2],
  jakarta: [1437, 662, 'Jakarta', 'banda', 0, -8, 26], portmoresby: [1712, 587, 'Port Moresby', 'kalimai', 0, -34, -18], noumea: [1787, 587, 'Nouméa', 'avaiki', 0, -26, 30],
  sydney: [1637, 812, 'Sydney', 'australis', 1, -42, 14], auckland: [1787, 812, 'Auckland', 'aotea', 1, 8, 16], toronto: [137, 262, 'Toronto', 'polaris', 0, -36, -14],
  newyork: [462, 337, 'New York', 'atlante', 0, 14, 0], lahavane: [237, 462, 'La Havane', 'caribana', 0, -14, -18], santodomingo: [462, 462, 'Santo Domingo', 'antille', 0, 14, 22],
  mexico: [137, 537, 'Mexico', 'meso', 0, 14, 4], tegucigalpa: [362, 587, 'Tegucigalpa', 'centro', 0, 12, 20], sanjose: [462, 657, 'San José', 'pacifica', 1, -4, -14],
  bogota: [612, 687, 'Bogota', 'tropicana', 0, 14, 4], lima: [437, 812, 'Lima', 'aymaro', 0, -34, -2], rio: [612, 862, 'Rio de Janeiro', 'amazonia', 0, 14, 4],
  buenosaires: [437, 937, 'Buenos Aires', 'andina', 0, -96, 4],
};
// Lignes : couleur ; chemins = suites de stations (id) et de points de passage [x,y]. '@Nom' = bord de carte (traversée du Pacifique).
const OT_LINES = {
  1: { c: '#27b127', p: [['@Tokyo|37|212', [87, 212], 'toronto', 'mexico', [212, 462], 'lahavane', 'santodomingo', 'dakar', [737, 462], 'alger', 'lecaire', 'riyad', 'newdehli', [1387, 412], 'bangkok', 'saigon', 'manille', [1787, 337], 'tokyo', [1762, 212], '@Toronto|1837|212'], ['lecaire', [987, 312], 'bagdad', 'teheran', [1312, 337], 'newdehli']] },
  2: { c: '#1ca0e8', p: [['toronto', [387, 262], 'newyork', [562, 237], 'londres', 'reykjavik', [637, 112], [687, 62], 'stockholm', [762, 37], [1137, 37], 'moscou', 'tachkent', 'pekin', 'seoul', [1637, 262], 'tokyo']] },
  3: { c: '#e83030', p: [['@Nouméa|187|687', [312, 687], 'lima', [487, 862], 'rio', [612, 887], [662, 937], 'lecap', 'lusaka', 'tananarive', [1237, 662], 'jakarta', [1537, 662], [1612, 587], 'portmoresby', 'noumea', '@Lima|1837|587']] },
  4: { c: '#f08c1f', p: [['toronto', [87, 312], [87, 487], 'mexico', [187, 587], 'tegucigalpa', [437, 662], 'sanjose', [587, 662], 'bogota', [487, 812], 'lima', 'buenosaires']] },
  5: { c: '#9a6df0', p: [['tokyo', [1762, 262], [1837, 337], [1837, 362], 'manille', [1787, 512], 'portmoresby'], ['tokyo', 'portmoresby'], ['portmoresby', [1712, 612], [1637, 687], 'sydney'], ['noumea', [1712, 637], [1712, 712], 'sydney'], ['noumea', 'auckland'], ['sydney', 'auckland']] },
  6: { c: '#1ec0b0', p: [['lahavane', [312, 387], [412, 387], 'newyork', 'santodomingo'], ['lahavane', 'tegucigalpa'], ['santodomingo', [362, 562], 'tegucigalpa'], ['santodomingo', [612, 612], 'bogota', 'rio', [537, 937], 'buenosaires']] },
  7: { c: '#efe14a', p: [['pekin', [1412, 387], 'newdehli', [1387, 362], 'tachkent', [1337, 287], 'teheran', [1262, 362], [1162, 362], 'riyad', [1137, 512], 'addis', [1012, 637], [912, 637], 'kinshasa', 'nairobi', [962, 787], 'lusaka', 'luanda', [762, 887], 'lecap']] },
  8: { c: '#a31fb7', p: [['stockholm', 'amsterdam', 'paris', 'madrid', 'alger', [712, 387], [687, 412], 'dakar', [687, 537], 'abidjan', [737, 587], 'lagos', 'kinshasa', 'luanda', 'lecap']] },
  9: { c: '#a5e83a', p: [['amsterdam', [712, 162], [687, 137], [687, 112], 'stockholm'], ['stockholm', [812, 137], 'berlin', [862, 237], 'rome', [887, 237], 'kiev', [1087, 237], 'moscou']] },
  10: { c: '#f063b8', p: [['seoul', [1687, 287], 'tokyo'], ['seoul', 'bangkok', [1437, 462], 'jakarta'], ['saigon', [1662, 462], [1737, 462], 'manille'], ['saigon', [1612, 487], 'jakarta']] },
  11: { c: '#151515', p: [['londres', 'paris', [787, 237], [812, 262], 'rome', [887, 287], 'athenes', 'istanbul', [1137, 287], 'bagdad', [1187, 287], [1287, 287], 'teheran', [1337, 312], [1362, 337], 'newdehli']] },
  12: { c: '#3c4fe0', p: [['rome', [862, 337], 'alger', 'lagos', [912, 587], [937, 562], 'addis'], ['athenes', 'lecaire', [937, 412], [987, 412], [1087, 512], 'addis'], ['addis', [1087, 612], 'nairobi', 'tananarive']] },
  13: { c: '#f0a09a', p: [['amsterdam', [787, 162], 'berlin', [937, 187], [962, 162], 'minsk'], ['stockholm', [887, 62], [962, 137], [962, 162], 'minsk'], ['minsk', [1012, 187], 'kiev', 'istanbul', [1137, 362], 'riyad'], ['minsk', [1087, 112], 'moscou', [1212, 212], [1162, 262], 'bagdad', [1137, 337], 'riyad']] },
};
const OT_WRAP = [['toronto', 'tokyo', 1], ['lima', 'noumea', 3]];  // traversées du Pacifique (ligne)
const OT = (() => {
  const adj = {}; const edges = [];
  const add = (a, b, line, w) => { (adj[a] = adj[a] || []).push({ to: b, line, w }); (adj[b] = adj[b] || []).push({ to: a, line, w }); edges.push([a, b, line]); };
  for (const [ln, L] of Object.entries(OT_LINES)) for (const path of L.p) {
    const sts = path.filter(x => typeof x === 'string' && !x.startsWith('@'));
    for (let i = 0; i + 1 < sts.length; i++) add(sts[i], sts[i + 1], +ln, 1);
  }
  for (const [a, b, l] of OT_WRAP) add(a, b, l, 3);
  const stOfState = {}; for (const [id, v] of Object.entries(OT_ST)) stOfState[v[3]] = id;
  return { adj, edges, stOfState };
})();
const stationOf = stateId => OT.stOfState[stateId];
const stateName = id => S[id] ? S[id].name : id;
const capName = id => S[id] ? S[id].capital : id;

// plus court chemin (en tenant compte des correspondances) -> {cost, legs:[{line,from,to,stops}]}
function otRoute(fromState, toState) {
  const a = stationOf(fromState), b = stationOf(toState);
  if (a === b) return { hops: 0, legs: [], cost: 0 };
  const key = (st, ln) => st + '|' + ln;
  const dist = {}, prev = {}; const pq = [[0, a, 0]]; dist[key(a, 0)] = 0;
  let best = null;
  while (pq.length) {
    pq.sort((x, y) => x[0] - y[0]); const [d, st, ln] = pq.shift();
    if (d > (dist[key(st, ln)] ?? 1e9)) continue;
    if (st === b) { best = [st, ln]; break; }
    for (const e of OT.adj[st] || []) {
      const nd = d + e.w + (ln && ln !== e.line ? 0.4 : 0);
      const k = key(e.to, e.line);
      if (nd < (dist[k] ?? 1e9)) { dist[k] = nd; prev[k] = [st, ln]; pq.push([nd, e.to, e.line]); }
    }
  }
  if (!best) return null;
  const seq = []; let cur = key(best[0], best[1]);
  while (true) { const [st, ln] = cur.split('|'); const p = prev[cur]; seq.push({ st, ln: +ln }); if (!p) break; cur = key(p[0], p[1]); }
  seq.reverse();
  const legs = []; let hops = 0;
  for (let i = 1; i < seq.length; i++) {
    hops += (OT.adj[seq[i - 1].st].find(e => e.to === seq[i].st && e.line === seq[i].ln) || { w: 1 }).w;
    const last = legs[legs.length - 1];
    if (last && last.line === seq[i].ln) { last.to = seq[i].st; last.stops++; }
    else legs.push({ line: seq[i].ln, from: seq[i - 1].st, to: seq[i].st, stops: 1 });
  }
  return { hops, legs, cost: hops * 18, path: seq.map(s => s.st), steps: seq.slice(1).map((s, i) => ({ from: seq[i].st, to: s.st, line: s.ln })) };
}

// ───────── Objets ─────────
const ITEMS = {
  // armes
  lame: { n: 'Lame en protéque', t: 'arme', dmg: 2, price: 120, desc: 'Légère comme du plastique, dure comme l’acier.', tags: ['combat'] },
  matraque: { n: 'Matraque électrique', t: 'arme', dmg: 3, price: 160, desc: 'Étourdit : bonus pour entraver.', tags: ['combat'] },
  tube: { n: 'Tube lumino-synthétique', t: 'arme', dmg: 2, price: 200, desc: 'Matériau flexible et rétractable : arme, grappin ou outil.', tags: ['combat', 'mobility'] },
  gantelets: { n: 'Gantelets nano-tech', t: 'arme', dmg: 4, price: 520, desc: 'Nano-technologies pour poings décuplés.', tags: ['combat'] },
  plasma: { n: 'Pistolet plasma (capsules OGEN)', t: 'arme', dmg: 5, price: 420, desc: 'Arme à distance alimentée par capsules OGEN.', tags: ['ranged'], ranged: true },
  fusil: { n: 'Fusil plasma', t: 'arme', dmg: 8, price: 1100, desc: 'Arme lourde militaire, trafic uniquement.', tags: ['ranged'], ranged: true, black: true },
  // armures
  gilet: { n: 'Gilet en protéque', t: 'armure', def: 2, price: 220, desc: 'Résistant comme l’acier, léger comme le plastique.', tags: [] },
  nano: { n: 'Combinaison nano-tech', t: 'armure', def: 4, price: 760, desc: 'Fibre de carbone élasthanne et nano-technologies.', tags: ['mobility'] },
  lourde: { n: 'Armure de protéque lourde', t: 'armure', def: 6, price: 1600, desc: 'Protection militaire.', tags: ['defense'] },
  deflect: { n: 'Champ déflecteur portatif', t: 'armure', def: 5, price: 2800, desc: 'Déflecteur protégeant contre tout, y compris la lumière.', tags: ['defense'], black: true },
  // gadgets
  capsule: { n: 'Capsule OGEN', t: 'conso', price: 60, desc: 'Recharge 8 énergie (bat­terie d’ogénite).', use: 'en8', stack: true },
  kit: { n: 'Kit de soins', t: 'conso', price: 80, desc: 'Soigne 15 PV.', use: 'hp15', stack: true },
  nanosoin: { n: 'Nano-soins', t: 'conso', price: 260, desc: 'Soigne 40 PV et remet sur pied un allié.', use: 'hp40', stack: true },
  stimulant: { n: 'Stimulant', t: 'conso', price: 140, desc: '+3 à tous les jets du prochain combat ou test.', use: 'stim', stack: true, black: true },
  faux: { n: 'Faux papiers', t: 'conso', price: 300, desc: 'Une nouvelle identité : très réduit les contrôles (3 voyages).', use: 'faux', stack: true, black: true },
  brouilleur: { n: 'Brouilleur de radar', t: 'conso', price: 380, desc: 'Brouille le radar à géno de la F.A. (3 voyages ou missions).', use: 'brouil', stack: true, black: true },
  drone: { n: 'Drone éclaireur', t: 'gadget', price: 420, desc: '+2 aux jets de repérage et d’enquête.', tags: ['scout'] },
  radar: { n: 'Radar à géno', t: 'gadget', price: 900, desc: 'Détecte les géno-porteurs environnants (volé à la F.A.). Embuscades évitées, +2 repérage.', tags: ['scout'], black: true },
  oeil: { n: 'Lecteur de glyphes', t: 'gadget', price: 700, desc: '+3 pour déchiffrer les glyphes et trouver les pierres antiques.', tags: ['relic'] },
  hover: { n: 'Scout-hover', t: 'gadget', price: 3200, desc: 'Vaisseau personnel : voyager sans l’Orbitrail (non tracé), mais exposé aux dérèglements.', tags: ['mobility'], black: true },
  outils: { n: 'Mallette d’ingénieur', t: 'gadget', price: 350, desc: '+2 aux jets techniques et sabotage.', tags: ['tech'] },
  deguise: { n: 'Malle de déguisements', t: 'gadget', price: 320, desc: '+2 aux jets d’infiltration sociale.', tags: ['disguise'] },
};
const SHOP_LEGAL = ['lame', 'matraque', 'tube', 'plasma', 'gilet', 'nano', 'capsule', 'kit', 'nanosoin', 'drone', 'outils', 'deguise', 'oeil', 'lourde', 'gantelets'];
const SHOP_BLACK = ['fusil', 'deflect', 'stimulant', 'faux', 'brouilleur', 'radar', 'hover', 'plasma', 'nano', 'capsule', 'kit', 'nanosoin'];

// Dérèglements climatiques cités dans le PDF (p.13)
const CLIMATE = [
  'une mer de sable qui avale un quartier', 'un tsunami du désert', 'un séisme magnétique qui fait flotter des îlots de roche',
  'des plantes géantes envahissant une oasis', 'une tornade à rotation changeante', 'un vortex qui change de sens', 'une pluie d’orage et de grêle qui se téléporte',
  'des nuages solides, presque moelleux', 'une vague de canicule en « trou »', 'un coup de froid en « trou »', 'une neige compacte et malléable',
  'une zone aux saisons courtes', 'un volcan gelé', 'une coulée de lave liquide', 'une inondation spontanée (elle ne durera pas une journée)', 'une nouvelle espèce animale adaptée au climat',
];

// Légende des unités du Nouveau Régime (PDF p.14) pour les ennemis
const FA_UNITS = {
  soldat: 'soldat de la Force d’Autorité', droide: 'droïde de sécurité', centaure: 'Centaure (droïde anti-émeute)', gorgone: 'Gorgone (droïde de sécurité)',
  harpie: 'Harpie (droïde aérien)', sirene: 'Sirène (droïde sous-marin)', griffon: 'Griffon (drone anti-aérien)', hydre: 'Hydre (drone IEM)', cerbere: 'Cerbère (drone sensitif)',
  chimere: 'Chimère (drone-tourelle)', cyclope: 'Cyclope (mecha de renfort)', atlas: 'Atlas (Super-Mecha)', prometh: 'Prométhée (Super-Mecha)', epimeth: 'Épiméthée (Super-Mecha)', menet: 'Ménétios (Super-Mecha)',
};

// Le rang (grade) s'affiche en chevrons ▲ ; les étoiles ★ ne désignent que la puissance.
const rankStr = g => g > 0 ? '▲'.repeat(g) : '△';

// Durée de partie : cartes d'histoire par destination, mérite requis, déblocage des pierres et des actes
const LENS = { court: { n: 'Courte', c: 2, m: 0.75, u: 30, a2: 18, a3: 50 }, normal: { n: 'Normale', c: 3, m: 0.88, u: 35, a2: 24, a3: 60 }, long: { n: 'Longue', c: 3, m: 1, u: 40, a2: 28, a3: 70 } };
const lenKey = () => (typeof G !== 'undefined' && G && G.settings && G.settings.len) || (typeof UI !== 'undefined' && UI.len) || 'normal';
const LEN = () => LENS[lenKey()] || LENS.normal;
function applyLen() { const m = LEN().m; MERIT_BASE.forEach((v, i) => { MERIT_STEPS[i] = Math.round(v * m); }); }
