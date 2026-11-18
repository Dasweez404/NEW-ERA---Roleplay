// ───────── Nouveaux objets terre-à-terre + boutique rangée par rayons (acheter ou voler) ─────────
Object.assign(ITEMS, {
  poing: { n: 'Poing américain', t: 'arme', dmg: 1, price: 30, desc: 'Un classique de ruelle.', tags: ['combat'] },
  couteau: { n: 'Couteau de cuisine', t: 'arme', dmg: 1, price: 45, desc: 'Discret, silencieux, bon marché.', tags: ['combat', 'stealth'] },
  batte: { n: 'Batte de baseball', t: 'arme', dmg: 2, price: 65, desc: 'Du bois, du poids, aucun mode d’emploi.', tags: ['combat'] },
  pied: { n: 'Pied-de-biche', t: 'arme', dmg: 2, price: 75, desc: 'Arme et outil : ouvre les portes comme les têtes.', tags: ['combat', 'tech'] },
  hache: { n: 'Hache de pompier', t: 'arme', dmg: 3, price: 140, desc: 'Lourde, efficace contre les portes et les armures.', tags: ['combat'] },
  arbalete: { n: 'Arbalète de chasse', t: 'arme', dmg: 3, price: 210, desc: 'Silencieuse, à distance, sans capsule.', tags: ['ranged', 'stealth'], ranged: true },
  cloueur: { n: 'Pistolet à clous industriel', t: 'arme', dmg: 4, price: 290, desc: 'Fait pour les chantiers, détourné pour la rue.', tags: ['ranged'], ranged: true },
  chasse: { n: 'Fusil de chasse', t: 'arme', dmg: 6, price: 640, desc: 'Brutal à courte portée. Pas d’ogénite nécessaire.', tags: ['ranged'], ranged: true, black: true },
  blouson: { n: 'Blouson de cuir renforcé', t: 'armure', def: 1, price: 70, desc: 'Résiste aux griffures, pas aux balles.', tags: [] },
  casque: { n: 'Casque de chantier & genouillères', t: 'armure', def: 2, price: 150, desc: 'Moche, solide, bon marché.', tags: [] },
  pareballes: { n: 'Gilet pare-balles', t: 'armure', def: 3, price: 340, desc: 'Une plaque de céramique et du bon sens.', tags: [] },
  motard: { n: 'Tenue de motard blindée', t: 'armure', def: 3, price: 410, desc: 'Coques aux articulations : protège sans entraver.', tags: ['mobility'] },
  bouclier: { n: 'Bouclier anti-émeute', t: 'armure', def: 4, price: 620, desc: 'Transparent, lourd, dissuasif.', tags: ['defense'] },
  cafe: { n: 'Café serré', t: 'conso', price: 35, desc: 'Recharge 8 énergie. Ça ne coûte presque rien.', use: 'en8', stack: true },
  bandage: { n: 'Bandages & désinfectant', t: 'conso', price: 50, desc: 'Soigne 15 PV.', use: 'hp15', stack: true },
  boisson: { n: 'Boisson énergisante', t: 'conso', price: 90, desc: '+3 à tous les jets du prochain combat ou test.', use: 'stim', stack: true },
  jumelles: { n: 'Jumelles', t: 'gadget', price: 90, desc: '+2 aux jets de repérage.', tags: ['scout'] },
  crochets: { n: 'Set de crochetage', t: 'gadget', price: 130, desc: '+2 aux jets de furtivité.', tags: ['stealth'] },
  grappin: { n: 'Corde & grappin', t: 'gadget', price: 110, desc: '+2 aux jets de mobilité.', tags: ['mobility'] },
  radio: { n: 'Radio chiffrée', t: 'gadget', price: 170, desc: '+2 aux jets sociaux (coordination, négociation).', tags: ['social'] },
  laptop: { n: 'Ordinateur portable durci', t: 'gadget', price: 480, desc: 'Permet de pirater et donne +2 aux jets de piratage.', tags: ['hack'] },
  trousse: { n: 'Trousse de médecin', t: 'gadget', price: 220, desc: 'Permet de soigner et donne +2 aux jets de soins.', tags: ['heal'] },
  masque: { n: 'Masque à gaz', t: 'gadget', price: 150, desc: '+2 aux jets de défense (gaz, fumées, poussière).', tags: ['defense'] },
  detecteur: { n: 'Détecteur de métaux', t: 'gadget', price: 260, desc: '+3 pour trouver des vestiges et des pierres antiques.', tags: ['relic'] },
  lunettes: { n: 'Lunettes de vision nocturne', t: 'gadget', price: 300, desc: '+2 aux jets de repérage.', tags: ['scout'] },
  scooter: { n: 'Scooter', t: 'vehicule', price: 300, desc: 'Trajets de 3 arrêts max, même continent. Légal, économique.', v: { ic: '🛵', spd: 2, max: 3, scope: 'continent', legal: 1 } },
  quad: { n: 'Quad tout-terrain', t: 'vehicule', price: 720, desc: 'Sur terre, 4 arrêts max, même continent (pas d’îles). Légal.', v: { ic: '🏍', spd: 3, max: 4, scope: 'land', legal: 1 } },
  moto: { n: 'Moto', t: 'vehicule', price: 950, desc: 'Sur terre, 5 arrêts max, même continent (pas d’îles). Légale.', v: { ic: '🏍', spd: 3.5, max: 5, scope: 'land', legal: 1 } },
  pickup: { n: 'Pick-up', t: 'vehicule', price: 1300, desc: 'Sur terre, 8 arrêts max, même continent. Robuste et légal.', v: { ic: '🛻', spd: 3.5, max: 8, scope: 'land', legal: 1 } },
  voilier: { n: 'Voilier', t: 'vehicule', price: 2400, desc: 'Va partout par la mer, lentement. Légal, non tracé.', v: { ic: '⛵', spd: 1.2, max: 99, scope: 'any', legal: 1 } },
  moto_v: { n: 'Moto sans papiers', t: 'vehicule', price: 520, black: true, desc: 'Volée et repeinte : sur terre, 5 arrêts max. Illégale.', v: { ic: '🏍', spd: 3.5, max: 5, scope: 'land', legal: 0 } },
  bateau_p: { n: 'Vedette armée de pirates', t: 'vehicule', price: 4200, black: true, desc: 'Canons légers et moteurs gonflés : va partout par la mer, +2 en combat. Illégale.', v: { ic: '🚤', spd: 4, max: 99, scope: 'any', legal: 0, armed: 1 } },
});
SHOP_LEGAL.push('poing', 'couteau', 'batte', 'pied', 'hache', 'arbalete', 'cloueur', 'blouson', 'casque', 'pareballes', 'motard', 'bouclier', 'cafe', 'bandage', 'boisson', 'jumelles', 'crochets', 'grappin', 'radio', 'laptop', 'trousse', 'masque', 'detecteur', 'lunettes', 'scooter', 'quad', 'moto', 'pickup', 'voilier');
SHOP_BLACK.push('chasse', 'moto_v', 'bateau_p');
const SHOP_CATS = [['arme', '⚔', 'Armes', 'Mains nues, lames, armes à distance'], ['armure', '🛡', 'Armures', 'Protections, du blouson au déflecteur'], ['vehicule', '🚗', 'Véhicules', 'Scooters, motos, voitures, vaisseaux'], ['conso', '💊', 'Soins & vivres', 'Soins, énergie, stimulants'], ['gadget', '🧰', 'Outils & gadgets', 'Pour pirater, grimper, espionner']];
const SHOP = { cat: 'arme', steal: false };
const isBlackItem = id => !SHOP_LEGAL.includes(id) && SHOP_BLACK.includes(id);
const shopPrice = id => { const it = ITEMS[id]; const disc = (hasRole('logisticien') ? 0.9 : 1) * (1 - PK('fix') / 100) * (isBlackItem(id) ? 1 : (feat('rep') ? cityPerk().price : 1)); return Math.round(it.price * (isBlackItem(id) ? 1.35 : 1) * disc * (id === 'faux' && hasRole('costumier') ? 0.7 : 1)); };
// ───────── Nouveaux articles ─────────
Object.assign(ITEMS, {
  sabre: { n: 'Sabre de dojo', t: 'arme', dmg: 2, price: 110, desc: 'Léger et précis, entretenu avec soin.', tags: ['combat'] },
  fouet: { n: 'Fouet électrique', t: 'arme', dmg: 3, price: 230, desc: 'Allonge et décharge : idéal pour entraver.', tags: ['combat'] },
  lancepierre: { n: 'Lance-pierre renforcé', t: 'arme', dmg: 1, price: 40, desc: 'Discret, à distance, pas cher.', tags: ['ranged', 'stealth'], ranged: true },
  arc: { n: 'Arc composite', t: 'arme', dmg: 3, price: 190, desc: 'Silencieux, précis, aucune capsule requise.', tags: ['ranged', 'stealth'], ranged: true },
  harpon: { n: 'Fusil harpon', t: 'arme', dmg: 4, price: 330, desc: 'Fait pour la pêche, mortel sur terre.', tags: ['ranged'], ranged: true },
  marteau: { n: 'Masse de forgeron', t: 'arme', dmg: 4, price: 250, desc: 'Lourde. Très lourde. Terriblement efficace.', tags: ['combat'] },
  katana: { n: 'Katana de collection', t: 'arme', dmg: 4, price: 380, desc: 'Un objet de musée, tranchant comme au premier jour.', tags: ['combat'] },
  pompe: { n: 'Fusil à pompe', t: 'arme', dmg: 5, price: 520, desc: 'Un tir, un impact. Rechargement long.', tags: ['ranged'], ranged: true, black: true },
  tronco: { n: 'Tronçonneuse de bûcheron', t: 'arme', dmg: 5, price: 450, desc: 'Bruyante, effrayante, efficace.', tags: ['combat'], black: true },
  veste: { n: 'Veste en kevlar urbaine', t: 'armure', def: 2, price: 220, desc: 'Discrète sous un manteau.', tags: [] },
  cape: { n: 'Cape camouflage', t: 'armure', def: 1, price: 140, desc: 'Se fond dans la foule et la nuit.', tags: ['stealth'] },
  plastron: { n: 'Plastron de motocross', t: 'armure', def: 2, price: 190, desc: 'Absorbe les chocs sans entraver.', tags: ['mobility'] },
  plaques: { n: 'Armure de plaques d’ARENA', t: 'armure', def: 4, price: 560, desc: 'Lourde et voyante, très efficace.', tags: ['defense'] },
  exo: { n: 'Exosquelette léger', t: 'armure', def: 4, price: 760, desc: 'Des servos aux jambes et aux bras.', tags: ['mobility', 'defense'] },
  sandwich: { n: 'Repas chaud', t: 'conso', price: 30, desc: 'Soigne 15 PV.', use: 'hp15', stack: true },
  thermos: { n: 'Thermos de soupe', t: 'conso', price: 45, desc: 'Soigne 15 PV.', use: 'hp15', stack: true },
  pastille: { n: 'Pastilles énergétiques', t: 'conso', price: 40, desc: 'Recharge 8 énergie.', use: 'en8', stack: true },
  sirop: { n: 'Sirop d’ogénite', t: 'conso', price: 70, desc: 'Recharge 8 énergie.', use: 'en8', stack: true },
  compresse: { n: 'Compresse cicatrisante', t: 'conso', price: 60, desc: 'Soigne 15 PV.', use: 'hp15', stack: true },
  perfusion: { n: 'Perfusion d’urgence', t: 'conso', price: 260, desc: 'Soigne 40 PV et relève les alliés à terre.', use: 'hp40', stack: true },
  gouttes: { n: 'Gouttes de concentration', t: 'conso', price: 110, desc: '+3 à tous les jets du prochain combat ou test.', use: 'stim', stack: true },
  micro: { n: 'Micro directionnel', t: 'gadget', price: 140, desc: '+2 aux jets de repérage.', tags: ['scout'] },
  gants: { n: 'Gants silencieux', t: 'gadget', price: 160, desc: '+2 aux jets de furtivité.', tags: ['stealth'] },
  cartes: { n: 'Cartes anciennes', t: 'gadget', price: 200, desc: '+2 pour trouver des vestiges et des pierres antiques.', tags: ['relic'] },
  maquillage: { n: 'Kit de maquillage', t: 'gadget', price: 120, desc: '+2 aux jets de déguisement.', tags: ['disguise'] },
  multi: { n: 'Multi-outil', t: 'gadget', price: 170, desc: '+2 aux jets de technique.', tags: ['tech'] },
  pitons: { n: 'Pitons d’escalade', t: 'gadget', price: 100, desc: '+2 aux jets de mobilité.', tags: ['mobility'] },
  poudre: { n: 'Poudre de soins', t: 'gadget', price: 140, desc: '+2 aux jets de soins.', tags: ['heal'] },
  talisman: { n: 'Talisman d’ogénite', t: 'gadget', price: 240, desc: '+2 aux jets de contrôle de ton pouvoir.', tags: ['control'] },
  megaphone: { n: 'Mégaphone', t: 'gadget', price: 110, desc: '+2 aux jets d’équipe.', tags: ['ally'] },
  porte: { n: 'Gourmette porte-bonheur', t: 'gadget', price: 150, desc: '+2 aux jets sociaux.', tags: ['social'] },
  pocket: { n: 'Brouilleur de poche', t: 'gadget', price: 210, desc: '+2 aux jets de piratage.', tags: ['hack'], black: true },
  boucl: { n: 'Bouclier pliant', t: 'gadget', price: 180, desc: '+2 aux jets de défense.', tags: ['defense'] },
});
SHOP_LEGAL.push('sabre', 'fouet', 'lancepierre', 'arc', 'harpon', 'marteau', 'katana', 'veste', 'cape', 'plastron', 'plaques', 'exo', 'sandwich', 'thermos', 'pastille', 'sirop', 'compresse', 'perfusion', 'gouttes', 'micro', 'gants', 'cartes', 'maquillage', 'multi', 'pitons', 'poudre', 'talisman', 'megaphone', 'porte', 'boucl');
SHOP_BLACK.push('pompe', 'tronco', 'pocket');
// Chaque marché a son stock (aléatoire), renouvelé quand on y revient après un mois
const ESSENTIAL = ['cafe', 'bandage', 'kit', 'capsule'];
function cityStock() {
  const W = G.world; W.shops = W.shops || {}; const loc = G.loc; let st = W.shops[loc];
  if (!st || G.wk - st.wk >= 4) {
    const all = [...new Set([...SHOP_LEGAL, ...SHOP_BLACK])].filter(id => ITEMS[id]); const ids = [];
    all.forEach(id => { const t = ITEMS[id].t; if (ESSENTIAL.includes(id) || Math.random() < (t === 'vehicule' ? 0.4 : 0.5)) ids.push(id); });
    SHOP_CATS.forEach(([c]) => { const have = ids.filter(id => ITEMS[id].t === c); const rest = shuffle(all.filter(id => ITEMS[id].t === c && !ids.includes(id))); for (let i = have.length; i < 3 && rest.length; i++) ids.push(rest.pop()); });
    const fresh = !!st; st = W.shops[loc] = { wk: G.wk, ids, fresh }; if (fresh) setTimeout(() => toast('🛒 Nouveaux articles sur le marché'), 200);
  }
  return st.ids;
}
const shopIds = () => cityStock().filter(id => ITEMS[id]);
const blackOkNow = () => { const pc = G.pc; return (pc.rep.noir || 0) >= 10 || ['galleon', 'check', 'arena', 'slummer', 'rapinas', 'manacorp', 'gamma', 'necropunks', 'committed'].includes(pc.faction) || pc.faction === 'fallen'; };
function itemStat(it) { return it.t === 'arme' ? `+${it.dmg} dég.${it.ranged ? ' · dist.' : ''}` : it.t === 'armure' ? `+${it.def} déf.` : it.t === 'vehicule' ? `${it.v.legal ? '' : 'illégal'}${it.v.armed ? ' armé' : ''}`.trim() : ''; }
function shopMenu() {
  const pc = G.pc; const cat = SHOP.cat; const steal = SHOP.steal; const bok = blackOkNow();
  const bar = h('div', { class: 'shopbar' }, h('div', { class: 'shopcats' }, SHOP_CATS.map(([t, ic, n]) => h('button', { class: 'tab' + (cat === t ? ' on' : ''), onclick: () => { SHOP.cat = t; SHOP.page = 0; sfx('click'); shopMenu(); }, title: n }, ic + ' ' + n.split(' ')[0]))),
    h('div', { class: 'shopqty' }, [1, 3, 5].map(n => h('button', { class: 'tab' + ((SHOP.qty || 1) === n ? ' on' : ''), title: 'Quantité (consommables)', onclick: () => { SHOP.qty = n; sfx('click'); shopMenu(); } }, '×' + n))),
    h('button', { class: 'swt' + (steal ? ' on' : ''), onclick: () => { SHOP.steal = !steal; sfx('click'); shopMenu(); }, 'aria-pressed': steal }, h('span', { class: 'swl' }, 'Acheter'), h('span', { class: 'swk' }), h('span', { class: 'swl' }, 'Voler')));
  const ids = shopIds().filter(id => ITEMS[id].t === cat).sort((a, b) => ITEMS[a].price - ITEMS[b].price); const L = [];
  ids.forEach(id => {
    const it = ITEMS[id]; const blk = isBlackItem(id); const price = shopPrice(id); const own = pc.inv[id] || 0; const eq = pc.eq.arme === id || pc.eq.armure === id; const st = itemStat(it);
    const q = it.stack && !steal ? (SHOP.qty || 1) : 1; const label = `${blk ? '🕶 ' : ''}${it.n}${own ? ' ×' + own : ''}${q > 1 ? ' (+' + q + ')' : ''}`; const sub = `${steal ? 'voler' : price * q + ' ¢'}${st ? ' · ' + st : ''}${eq ? ' · équipé' : ''} — ${it.desc}`;
    if (steal) L.push(C(label, () => stealItem(id), { sub, odds: ['agilite', stealDc(id), ['stealth', 'disguise']], cls: 'risk', req: { ok: () => blk ? 'Pas de vol au Marché Noir' : (it.t !== 'vehicule' && invFree() < 1) ? 'Sac plein' : null } }));
    else L.push(C(label, () => buy(id, price, q), { sub, req: { money: price * q, ok: () => (blk && !bok) ? 'Marché Noir : 10 de réputation requise' : (ITEMS[id].t !== 'vehicule' && invFree() < q) ? 'Sac plein (' + invCount() + '/' + invCap() + ')' : null } }));
  });
  const per = innerWidth < 700 ? 6 : 99, pages = Math.max(1, Math.ceil(L.length / per)); SHOP.page = Math.min(SHOP.page || 0, pages - 1); const view = L.splice(0, L.length).slice(SHOP.page * per, (SHOP.page + 1) * per); L.push(...view);
  if (pages > 1) L.push(C(`Suite ${SHOP.page + 1}/${pages}`, () => { SHOP.page = (SHOP.page + 1) % pages; shopMenu(); }, { ic: '▸', cls: 'back' }));
  L.push(C('Vendre', sellMenu, { ic: '💰', req: { ok: () => Object.keys(pc.inv).length ? null : 'Rien à vendre' } }));
  L.push(C('← Retour', cityBack, { cls: 'back' }));
  show({ kicker: 'MARCHÉ', title: steal ? 'Mode vol' : 'Marché', text: [`<b>${fmt(pc.money)} ¢</b> · 🎒 ${invCount()}/${invCap()}${bok ? '' : ' · 🕶 articles du Marché Noir verrouillés (10 de réputation)'}${steal ? ' · <b class="badc">discret et risqué</b>' : ''}`], extra: bar, choices: L, tiles: true, tileCls: 'shop' });
}
function equipIfFree(id) { const pc = G.pc, it = ITEMS[id]; if ((it.t === 'arme' && !pc.eq.arme) || (it.t === 'armure' && !pc.eq.armure)) { pc.eq[it.t === 'arme' ? 'arme' : 'armure'] = id; return true; } return false; }
function buy(id, price, q = 1) {
  const pc = G.pc; pc.money -= price * q; giveItem(id, q); const it = ITEMS[id]; equipIfFree(id); sfx('coin');
  
  if (!isBlackItem(id) && wantedStars() >= 2 && chance(0.12 * wantedStars())) return show({ kicker: 'Marché', title: 'Reconnu !', text: ['Un vendeur lève les yeux de son écran… puis vers la caméra. Il t’a reconnu.'], fx: fx({ heat: 5 }), choices: [C('Filer', hub)] });
  toast(`${it.n}${q > 1 ? ' ×' + q : ''} acheté`); shopMenu();
}
function stealDc(id) { const it = ITEMS[id]; return 12 + Math.min(5, Math.floor(it.price / 450)) * 2 + wantedStars() + (it.t === 'vehicule' ? 2 : 0); }
function stealItem(id) {
  const pc = G.pc, it = ITEMS[id]; const dc = stealDc(id); const r = check('agilite', dc, ['stealth', 'disguise']);
  if (r.ok) { addCityRep(-2); addKarma(-0.6); giveItem(id); equipIfFree(id); const L = r.crit ? [] : fx({ heat: it.price > 1000 ? 3 : 1 }); G.score.stolen = (G.score.stolen || 0) + 1; logEntry(`Tu voles : ${it.n}.`); return show({ kicker: 'Vol', title: r.crit ? 'Un vol parfait' : 'Dans la poche', text: [`${it.n} disparaît sous ton manteau. Personne n’a rien vu${r.crit ? ' — pas même une caméra' : ' (ou presque)'}.`, checkLine(r)], fx: L, choices: [C('Continuer à fouiner', () => shopMenu()), C('← Retour', cityMenu, { cls: 'back' })] }); }
  const tier = Math.min(3, 1 + Math.floor(it.price / 900));
  if (chance(0.5)) return show({ kicker: 'Vol', title: 'Tu files les mains vides', text: ['Une alarme, un cri. Tu cours à travers la foule et tu disparais.', checkLine(r)], fx: fx({ heat: 3, rep: { civils: -2 } }), choices: [C('Continuer', cityMenu)] });
  show({ kicker: 'Vol', title: 'Pris sur le fait !', text: ['Des vigiles te barrent la route.', checkLine(r)], choices: [C('Se battre', () => startCombat({ title: 'Vigiles du marché', foes: [mkFoe('garde', tier), mkFoe('garde', tier)], intro: 'Les vigiles dégainent leurs matraques.', lethal: wantedStars() >= 2 ? 'capture' : 'robbed', canFlee: true, onWin: L => { giveItem(id); equipIfFree(id); show({ kicker: 'Vol', title: 'Tu repars avec', text: [`Les vigiles à terre, tu prends ${it.n} et tu files.`], fx: [...L, ...fx({ heat: 5, rep: { civils: -3 } })], choices: [C('Continuer', cityMenu)] }); }, onFlee: () => show({ title: 'En fuite', text: ['Tu t’échappes, mais sans rien.'], fx: fx({ heat: 3 }), choices: [C('Continuer', cityMenu)] }) }), { cls: 'danger' }), C('Rendre l’objet et s’excuser', () => { const r2 = check('charisme', 13, ['social']); if (r2.ok) show({ title: 'Ils te laissent partir', text: ['Un sourire gêné, un faux prétexte.', checkLine(r2)], choices: [C('Continuer', cityMenu)] }); else show({ title: 'Amende', text: ['On te fait payer.', checkLine(r2)], fx: fx({ money: -Math.min(pc.money, Math.round(it.price * 0.5)), heat: 2 }), choices: [C('Continuer', cityMenu)] }); }, { odds: ['charisme', 13, ['social']] })] });
}
