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
const SHOP = { black: false, steal: false };
const shopPrice = id => { const it = ITEMS[id]; const disc = (hasRole('logisticien') ? 0.9 : 1) * (1 - PK('fix') / 100) * (SHOP.black ? 1 : (feat('rep') ? cityPerk().price : 1)); return Math.round(it.price * (SHOP.black ? 1.35 : 1) * disc * (id === 'faux' && hasRole('costumier') ? 0.7 : 1)); };
const shopIds = () => [...new Set(SHOP.black ? SHOP_BLACK : SHOP_LEGAL)].filter(id => ITEMS[id]);
function shopMenu(black) {
  if (black != null) SHOP.black = black; if (black == null && !SHOP._init) { SHOP.black = false; } SHOP._init = true; SHOP.steal = false;
  const pc = G.pc; const blackOk = (pc.rep.noir || 0) >= 10 || ['galleon', 'check', 'arena', 'slummer', 'rapinas', 'manacorp', 'gamma', 'necropunks', 'committed'].includes(pc.faction) || pc.faction === 'fallen';
  const ids = shopIds(); const L = [];
  SHOP_CATS.forEach(([t, ic, n, sub]) => { const k = ids.filter(id => ITEMS[id].t === t).length; if (k) L.push(C(`${n} (${k})`, () => shopCat(t), { ic, sub })); });
  L.push(SHOP.black ? C('← Marché légal', () => shopMenu(false), { ic: '🏪', sub: 'Revenir aux boutiques de la ville.' }) : C('Marché Noir', () => shopMenu(true), { ic: '🕶', sub: 'Armes lourdes, faux papiers, véhicules illégaux… à prix fort.', req: { ok: () => blackOk ? null : 'Il faut un contact : 10 de réputation avec le Marché Noir ou une faction liée' } }));
  L.push(C('Vendre', sellMenu, { ic: '💰', req: { ok: () => Object.keys(pc.inv).length ? null : 'Rien à vendre' } }));
  L.push(C('← Retour', cityMenu, { cls: 'back' }));
  show({ kicker: SHOP.black ? 'Marché Noir' : 'Marché', title: SHOP.black ? 'Le Marché Noir' : 'Boutiques de la ville', text: [`Tu as <b>${fmt(pc.money)} ¢</b>.${wantedStars() >= 2 && !SHOP.black ? ' ⚠ Tu es recherché : risque d’être reconnu.' : ''}`], choices: L, tiles: true });
}
function itemStat(it) { return it.t === 'arme' ? `dégâts +${it.dmg}${it.ranged ? ' · distance' : ''}` : it.t === 'armure' ? `défense +${it.def}` : it.t === 'vehicule' ? `${it.v.legal ? 'légal' : 'ILLÉGAL'}${it.v.armed ? ' · armé' : ''}` : ''; }
function shopCat(cat) {
  const pc = G.pc; const cn = SHOP_CATS.find(c => c[0] === cat); const ids = shopIds().filter(id => ITEMS[id].t === cat).sort((a, b) => ITEMS[a].price - ITEMS[b].price); const L = [];
  if (!SHOP.black) L.push(C(SHOP.steal ? '💸 Mode : VOL — touche pour acheter à la place' : '🕶 Passer en mode VOL (discret, risqué)', () => { SHOP.steal = !SHOP.steal; shopCat(cat); }, { cls: SHOP.steal ? 'danger' : 'back', sub: SHOP.steal ? 'Chaque objet touché sera volé : jet d’agilité (furtivité), alerte et combat en cas d’échec.' : '' }));
  ids.forEach(id => {
    const it = ITEMS[id]; const price = shopPrice(id); const eq = pc.eq.arme === id || pc.eq.armure === id; const own = pc.inv[id] || 0;
    const stat = [itemStat(it), own ? `possédé ×${own}${eq ? ' · équipé' : ''}` : ''].filter(Boolean).join(' · ');
    if (SHOP.steal && !SHOP.black) { const dc = stealDc(id); L.push(C(`${it.n} — voler`, () => stealItem(id, cat), { sub: `${stat ? stat + ' · ' : ''}${it.desc}`, odds: ['agilite', dc, ['stealth', 'disguise']], cls: 'risk' })); }
    else L.push(C(`${it.n} — ${price} ¢`, () => buy(id, price, cat), { sub: `${stat ? stat + ' · ' : ''}${it.desc}`, req: { money: price } }));
  });
  L.push(C('← Rayons', () => shopMenu(), { cls: 'back' }));
  show({ kicker: SHOP.black ? 'Marché Noir' : 'Marché', title: `${cn[1]} ${cn[2]}`, text: [`Tu as <b>${fmt(pc.money)} ¢</b>${SHOP.steal ? ' · <b class="badc">MODE VOL</b>' : ''}`], choices: L });
}
function equipIfFree(id) { const pc = G.pc, it = ITEMS[id]; if ((it.t === 'arme' && !pc.eq.arme) || (it.t === 'armure' && !pc.eq.armure)) { pc.eq[it.t === 'arme' ? 'arme' : 'armure'] = id; return true; } return false; }
function buy(id, price, cat) {
  const pc = G.pc; pc.money -= price; giveItem(id); const it = ITEMS[id]; equipIfFree(id); sfx('coin');
  if (it.use === 'faux') { pc.faux += 3; takeItem('faux'); } if (it.use === 'brouil') { pc.brouil += 3; takeItem('brouilleur'); }
  if (!SHOP.black && wantedStars() >= 2 && chance(0.12 * wantedStars())) return show({ kicker: 'Marché', title: 'Reconnu !', text: ['Un vendeur lève les yeux de son écran… puis vers la caméra. Il t’a reconnu.'], fx: fx({ heat: 5 }), choices: [C('Filer', hub)] });
  toast(`${it.n} acheté`); shopCat(cat);
}
function stealDc(id) { const it = ITEMS[id]; return 12 + Math.min(5, Math.floor(it.price / 450)) * 2 + wantedStars() + (it.t === 'vehicule' ? 2 : 0); }
function stealItem(id, cat) {
  const pc = G.pc, it = ITEMS[id]; const dc = stealDc(id); const r = check('agilite', dc, ['stealth', 'disguise']);
  if (r.ok) { addCityRep(-2); giveItem(id); equipIfFree(id); const L = r.crit ? [] : fx({ heat: it.price > 1000 ? 3 : 1 }); G.score.stolen = (G.score.stolen || 0) + 1; logEntry(`Tu voles : ${it.n}.`); return show({ kicker: 'Vol', title: r.crit ? 'Un vol parfait' : 'Dans la poche', text: [`${it.n} disparaît sous ton manteau. Personne n’a rien vu${r.crit ? ' — pas même une caméra' : ' (ou presque)'}.`, checkLine(r)], fx: L, choices: [C('Continuer à fouiner', () => shopCat(cat)), C('Partir', cityMenu, { cls: 'back' })] }); }
  const tier = Math.min(3, 1 + Math.floor(it.price / 900));
  if (chance(0.5)) return show({ kicker: 'Vol', title: 'Tu files les mains vides', text: ['Une alarme, un cri. Tu cours à travers la foule et tu disparais.', checkLine(r)], fx: fx({ heat: 3, rep: { civils: -2 } }), choices: [C('Continuer', cityMenu)] });
  show({ kicker: 'Vol', title: 'Pris sur le fait !', text: ['Des vigiles te barrent la route.', checkLine(r)], choices: [C('Se battre', () => startCombat({ title: 'Vigiles du marché', foes: [mkFoe('garde', tier), mkFoe('garde', tier)], intro: 'Les vigiles dégainent leurs matraques.', lethal: wantedStars() >= 2 ? 'capture' : 'robbed', canFlee: true, onWin: L => { giveItem(id); equipIfFree(id); show({ kicker: 'Vol', title: 'Tu repars avec', text: [`Les vigiles à terre, tu prends ${it.n} et tu files.`], fx: [...L, ...fx({ heat: 5, rep: { civils: -3 } })], choices: [C('Continuer', cityMenu)] }); }, onFlee: () => show({ title: 'En fuite', text: ['Tu t’échappes, mais sans rien.'], fx: fx({ heat: 3 }), choices: [C('Continuer', cityMenu)] }) }), { cls: 'danger' }), C('Rendre l’objet et s’excuser', () => { const r2 = check('charisme', 13, ['social']); if (r2.ok) show({ title: 'Ils te laissent partir', text: ['Un sourire gêné, un faux prétexte.', checkLine(r2)], choices: [C('Continuer', cityMenu)] }); else show({ title: 'Amende', text: ['On te fait payer.', checkLine(r2)], fx: fx({ money: -Math.min(pc.money, Math.round(it.price * 0.5)), heat: 2 }), choices: [C('Continuer', cityMenu)] }); }, { odds: ['charisme', 13, ['social']] })] });
}
