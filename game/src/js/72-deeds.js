// ───────── Dilemmes moraux : bonnes et mauvaises actions envers la population (et leurs retombées) ─────────
const karma = () => G.pc.flags.karma || 0;
function addKarma(n) { G.pc.flags.karma = clamp(karma() + n, -30, 30); }
const karmaName = () => { const k = karma(); return k >= 12 ? 'Héros du peuple' : k >= 5 ? 'Protecteur' : k <= -12 ? 'Terreur des rues' : k <= -5 ? 'Crapule' : 'Ambigu'; };
function exposureChance(extra) {
  const pc = G.pc; const visible = pc.ptype !== 'zoologique' && pc.ptype !== 'aucun' ? 0.18 : 0.04;
  return clamp(0.1 + visible + (G.world.era === 'dark' ? 0.1 : 0) + wantedStars() * 0.05 + (extra || 0) - (karma() >= 5 ? 0.1 : 0) - (pc.faction === 'fa' ? 0.15 : 0), 0.03, 0.7);
}
// Quand on te sauve la vie, on te dénonce quand même : tu restes un géno-porteur.
function backfire(done) {
  const pc = G.pc; const t = wTier();
  show({ kicker: 'RETOUR DE BÂTON', title: 'Ils ont vu ce que tu es', text: ['Dans la foule, un murmure : « C’est un géno-porteur… » Les remerciements se changent en regards méfiants. Quelqu’un filme déjà, un autre appelle la Force d’Autorité.'], choices: [
    C('Les rassurer', () => { const r = check('charisme', 13 + t, ['social']); if (r.ok) show({ kicker: 'RETOUR DE BÂTON', title: 'Ils t’écoutent', text: ['« Je viens de vous sauver, non ? » Un vieil homme prend ta défense. La tension retombe.', checkLine(r)], fx: fx({ rep: { civils: 4 }, xp: 10 }), choices: [C('Continuer', done)] }); else fightMob('La foule se retourne contre toi.', done); }, { odds: ['charisme', 13 + t, ['social']], ic: '🗣' }),
    C('Disparaître avant l’arrivée de la F.A.', () => { const r = check('agilite', 12 + t, ['mobility', 'stealth']); if (r.ok) show({ kicker: 'RETOUR DE BÂTON', title: 'Tu t’éclipses', text: ['Tu disparais dans une ruelle. Il n’y aura qu’une rumeur.', checkLine(r)], fx: fx({ heat: 2 }), choices: [C('Continuer', done)] }); else show({ kicker: 'RETOUR DE BÂTON', title: 'Signalé', text: ['On te voit partir. Le signalement circule.', checkLine(r)], fx: fx({ heat: 7 }), choices: [C('Continuer', done)] }); }, { odds: ['agilite', 12 + t, ['mobility', 'stealth']], ic: '💨' }),
    C('Les faire taire par la force', () => fightMob('Tu leur fais peur, ils se jettent sur toi.', done, true), { cls: 'danger', ic: '⚔', sub: 'Frapper la population te marquera durablement.' })] });
}
function fightMob(intro, done, bad) {
  const t = Math.min(3, wTier()); const pc = G.pc;
  startCombat({ title: 'Foule en colère', foes: [mkFoe('voyou', t), mkFoe('voyou', t)], intro, lethal: 'robbed', canFlee: true,
    onWin: L => { addKarma(bad ? -3 : -1); show({ kicker: 'RETOUR DE BÂTON', title: 'La foule se disperse', text: ['Tu laisses des blessés derrière toi. On s’en souviendra.'], fx: [...L, ...fx({ rep: { civils: -6 }, heat: 4 })], choices: [C('Continuer', done)] }); },
    onFlee: () => show({ title: 'Tu t’enfuis', text: ['Les cris te suivent jusqu’au bout de la rue.'], fx: fx({ heat: 3, rep: { civils: -2 } }), choices: [C('Continuer', done)] }) });
}
const DEEDS = [
  { k: 'Incendie', text: p => `Un immeuble brûle à ${p}. Des habitants crient aux fenêtres, les secours sont loin.`, good: ['Entrer chercher les habitants', 'corps', ['defense', 'mobility', 'heal'], 'Tu ressors avec une famille entière dans les bras. On t’applaudit.', 'Tu n’en sauves que quelques-uns, brûlé et à bout de souffle.', 0.2, -rint(4, 9)], bad: ['Piller les logements pendant la panique', 'Les appartements sont vides, les sacs pleins. Personne ne regarde.', { money: [80, 200], rep: { civils: -8 }, heat: 2 }] },
  { k: 'Lynchage', text: p => `Dans une ruelle de ${p}, une foule pourchasse un géno-porteur désarmé. Les poings et les barres de fer sont déjà levés.`, good: ['S’interposer entre eux et lui', 'charisme', ['social', 'defense'], 'La foule recule, honteuse. Le fugitif te serre le bras.', 'La foule ne t’écoute pas.', 0.4, -rint(2, 6)], bad: ['Rejoindre la foule', 'Tu cognes avec les autres. La foule t’adopte, mais tu as trahi les tiens.', { rep: { civils: 6 }, heat: 0, anti: -6 }] },
  { k: 'Accident', text: p => `Un hovertram a déraillé près de ${p}. Des blessés partout, des sacs éventrés sur le bitume.`, good: ['Soigner et stabiliser les blessés', 'intellect', ['heal', 'tech'], 'Tu sauves trois personnes. Les secours arrivent à temps grâce à toi.', 'Tu fais ce que tu peux. Certains ne s’en sortiront pas.', 0.05, -rint(1, 4)], bad: ['Faire les poches des blessés', 'Un portefeuille ici, un bijou là. Personne n’en saura rien.', { money: [60, 150], rep: { civils: -4 }, heat: 1 }] },
  { k: 'Enfant perdu', text: p => `Dans le marché de ${p}, un enfant pleure. Sa mère le cherche en hurlant à l’autre bout de la place.`, good: ['Retrouver sa famille', 'intellect', ['scout', 'social'], 'Tu ramènes l’enfant dans les bras de sa mère. Elle pleure de gratitude.', 'Tu perds un temps précieux avant de la retrouver.', 0.1, 0], bad: ['Voler le sac de la mère paniquée', 'Elle ne voit rien, occupée à chercher son enfant.', { money: [40, 110], rep: { civils: -5 }, heat: 1 }] },
  { k: 'Braquage de supérette', text: p => `Un homme armé tient en joue une caissière à ${p}. Il tremble, c’est un amateur.`, good: ['Le désarmer sans blesser personne', 'agilite', ['stealth', 'combat', 'mobility'], 'Un pas, une clé de bras : le pistolet tombe. La caissière te remercie.', 'Le coup part. Tu prends une balle perdue.', 0.25, -rint(4, 10)], bad: ['Le laisser faire et te servir au passage', 'Tu empoches de quoi tenir une semaine pendant qu’il vide la caisse.', { money: [50, 130], rep: { civils: -3 }, heat: 2 }] },
  { k: 'Vivres', text: p => `À ${p}, une distribution de vivres tourne à la bousculade. Des centaines de familles attendent.`, good: ['Organiser la file et distribuer', 'charisme', ['social', 'logi', 'ally'], 'En une heure, tout le monde a mangé. On te regarde comme un des leurs.', 'La file se disloque. On se bat pour les derniers sacs.', 0.1, 0], bad: ['Détourner des caisses pour les revendre', 'Un camion, deux complices, la nuit. Les affamés attendront.', { money: [150, 300], rep: { civils: -10 }, heat: 2 }] },
  { k: 'Inondation', text: p => `Une crue spontanée noie le quartier bas de ${p}. L’eau monte vite, les gens grimpent sur les toits.`, good: ['Évacuer les habitants', 'corps', ['defense', 'mobility', 'control'], 'Tu fais plusieurs allers-retours. Tous sortent vivants.', 'Le courant t’emporte. Tu sauves moins de monde que tu ne voulais.', 0.2, -rint(3, 8)], bad: ['Faire payer les places sur ton embarcation', 'Ceux qui ont de l’argent montent, les autres regardent.', { money: [120, 280], rep: { civils: -9 }, heat: 1 }] },
  { k: 'Abus de la F.A.', text: p => `À ${p}, des soldats de la Force d’Autorité malmènent des civils au prétexte d’un « contrôle ». Un homme saigne déjà.`, good: ['Intervenir contre les soldats', 'combat', 0, 'Tu les écartes, les civils s’égaillent. La F.A. n’oubliera pas ton visage.', '', 0.5, 0], bad: ['Aider les soldats et dénoncer des civils', 'Tu désignes trois « suspects ». La F.A. te remercie. Les voisins te regardent.', { money: [100, 220], rep: { civils: -9, fa: 5 }, heat: 0 }] },
  { k: 'Racket', text: p => `Des racketteurs mettent une vieille commerçante à genoux à ${p}. Son étal est renversé.`, good: ['Chasser les racketteurs', 'combat', 1, 'Ils fuient, humiliés. La vieille te glisse un panier de fruits.', '', 0.15, 0], bad: ['Leur proposer ta « protection » à toi', 'Tu les remplaces. La vieille paie, le regard au sol.', { money: [90, 200], rep: { civils: -7 }, heat: 1 }] },
  { k: 'Hôpital en panne', text: p => `Le courant est coupé à l’hôpital de ${p}. Des respirateurs s’arrêtent. Les générateurs sont en panne.`, good: ['Rétablir le courant', 'intellect', ['tech', 'hack'], 'Les machines redémarrent. Les médecins pleurent de soulagement.', 'Tu rétablis trop tard pour certains patients.', 0.05, 0], bad: ['Voler le matériel médical pendant le chaos', 'Un chariot de médicaments rares, revendable une fortune.', { money: [200, 380], rep: { civils: -12 }, heat: 2 }] },
  { k: 'Chasse au porteur', text: p => `La rumeur court à ${p} : « un géno-porteur se cache dans le quartier ». La foule fouille les maisons, les yeux fous.`, good: ['Détourner la foule', 'charisme', ['social', 'disguise'], 'Tu lances une autre rumeur, ailleurs. La foule s’éloigne.', 'La foule ne te croit pas. Ton nom est cité.', 0.3, 0], bad: ['Désigner un innocent', 'Un voisin impopulaire est traîné dehors. Tu te fonds dans la foule.', { rep: { civils: 3 }, xp: 10 }] },
];
function deedCard() {
  const pc = G.pc; const okd = DEEDS.filter((x, i) => !uniqSkip('deeds', i)); const d = pick(okd.length ? okd : DEEDS); const place = capName(G.loc); const t = wTier();
  const done = () => hub();
  const goodOpt = () => {
    const [lab, attr, tags, okT, koT, expo, dmg] = d.good; const dc = 11 + 2 * t;
    if (tags === 0 || tags === 1) { // combat contre soldats ou voyous
      return C(lab, () => startCombat({ title: d.k, foes: tags === 0 ? foesFor('fa', Math.min(3, t), 2) : [mkFoe('voyou', t), mkFoe('voyou', t)], intro: 'Ils se tournent vers toi.', lethal: tags === 0 ? 'capture' : 'robbed', canFlee: true, onWin: L => { addKarma(2); const L2 = fx({ rep: tags === 0 ? { civils: 9, fa: -8 } : { civils: 8 }, xp: 20 + 6 * t, heat: tags === 0 ? 5 : 1 }); show({ kicker: d.k.toUpperCase(), title: 'Bien joué', text: [okT], fx: [...L, ...L2], choices: [C('Continuer', () => (chance(exposureChance(expo)) ? backfire(done) : done()))] }); }, onFlee: () => show({ title: 'Repli', text: ['Tu t’éloignes, la mort dans l’âme.'], fx: fx({ rep: { civils: -2 } }), choices: [C('Continuer', done)] }) }), { ic: '🤝', odds: null, sub: 'Combat · bonne action' });
    }
    return C(lab, () => {
      const r = check(attr, dc, tags); const usedPower = tags.some(x => (powerTags()[x] || 0) > 0);
      if (r.ok) { addKarma(2); addCityRep(4); const L = fx({ rep: { civils: 8 + (r.crit ? 3 : 0) }, xp: 20 + 6 * t, money: r.crit ? 60 : 0 }); show({ kicker: d.k.toUpperCase(), title: 'Tu as sauvé des gens', text: [okT, checkLine(r)], fx: L, choices: [C('Continuer', () => (chance(exposureChance(expo + (usedPower ? 0.15 : 0))) ? backfire(done) : done()))] }); }
      else { addKarma(1); show({ kicker: d.k.toUpperCase(), title: 'Pas assez', text: [koT, checkLine(r)], fx: fx({ rep: { civils: 3 }, xp: 8, hp: dmg || 0 }), choices: [C('Continuer', () => (chance(exposureChance(expo + 0.1)) ? backfire(done) : done()))] }); }
    }, { ic: '🤝', odds: [attr, dc, tags], sub: 'Bonne action' });
  };
  const [blab, bt, bfx] = d.bad;
  const badOpt = C(blab, () => {
    const o = Object.assign({}, bfx); const m = o.money ? rint(o.money[0], o.money[1]) : 0; const rep = Object.assign({}, o.rep || {}); if (o.anti && isAnti(pc.faction)) rep[pc.faction] = (rep[pc.faction] || 0) + o.anti;
    addKarma(-3); addCityRep(-6); const L = fx({ money: m, rep, heat: o.heat || 0, xp: o.xp || 0 });
    const caught = chance(0.2 + wantedStars() * 0.04);
    show({ kicker: d.k.toUpperCase(), title: 'Tu en profites', text: [bt, caught ? 'Mais quelqu’un t’a vu faire. Un cri, un doigt pointé.' : 'Personne ne t’a vu.'], fx: L, choices: [C('Continuer', () => (caught ? fightMob('La foule t’encercle.', done, true) : done()), { cls: caught ? 'danger' : '' })] });
  }, { ic: '😈', cls: 'risk', sub: 'Mauvaise action · gain immédiat, la population s’en souviendra' });
  show({ kicker: 'DILEMME · ' + place.toUpperCase(), title: d.k, text: [d.text(esc(place))], choices: [goodOpt(), badOpt, C('Passer ton chemin', done, { cls: 'back' })] });
}
