// ───────── Lot 2 : campagnes, compagnons, infiltration, événements de ville, planque, atelier, escouades ─────────
Object.assign(FEAT_WK, { camp: 14, comp: 18, infil: 22, ville: 26, planque: 30, atelier: 34, escouade: 38 });
Object.assign(FEAT_NEWS, {
  camp: ['Campagnes', 'Certaines affaires se déroulent en plusieurs chapitres : tes choix de départ changent la suite.'],
  comp: ['Histoires de compagnons', 'Un allié loyal peut te confier une affaire personnelle.'],
  infil: ['Infiltration', 'Se faufiler remplit une jauge d’alerte : trois erreurs et l’alarme sonne.'],
  ville: ['Événements de ville', 'Couvre-feu, raids, tournois, marchés de nuit : chaque ville a son agenda.'],
  planque: ['Planque', 'Tu peux avoir un refuge à toi : repos gratuit, coffre, cache. Si tu diriges une faction, ton QG en tient lieu.'],
  atelier: ['Atelier de faction', 'Dans la capitale qui loge ta faction, un atelier fabrique soins, gadgets et faux papiers.'],
  escouade: ['Escouades', 'Gradé, tu peux envoyer une équipe de ta faction en opération pendant que tu joues ailleurs.']
});
const FEAT_ORDER = ['rep', 'monde', 'nem', 'camp', 'comp', 'infil', 'ville', 'planque', 'atelier', 'escouade'];
announceFeats = function () {
  const seen = G.pc.flags.feats = G.pc.flags.feats || {};
  for (const k of FEAT_ORDER) { if (!seen[k] && feat(k)) { seen[k] = 1; newsPush(`Nouveau — ${FEAT_NEWS[k][0]} : ${FEAT_NEWS[k][1]}`); toast('Nouveau : ' + FEAT_NEWS[k][0]); return; } }
};
const spOk = (gap = 2) => G.wk - (G.pc.flags.spWk || -9) >= gap;
const spMark = f => () => { G.pc.flags.spWk = G.wk; f(); };
// ── Campagnes en chapitres ──
const CAMPS = {
  convoi: { n: 'Le convoi fantôme', ch: [
    { t: 'Un convoi disparu', x: p => `À ${p}, un convoi est parti sans arriver. Les familles attendent, les autorités se taisent. On t’en parle à voix basse.`, o: [['Interroger les témoins', 'charisme', ['social'], 'Un chauffeur, ivre de peur, parle de lumières sur la route.', 'Personne ne veut te parler.'], ['Suivre les traces', 'intellect', ['scout'], 'Des traces de pneus quittent la route vers un entrepôt.', 'Les traces se perdent dans la poussière.'], ['Fouiller le dernier relais', 'agilite', ['stealth'], 'Tu trouves un carnet de bord arraché.', 'Un garde te surprend et te chasse.']] },
    { t: 'Les survivants', x: (p, c) => c.s >= 1 ? 'La piste mène à une cave où des survivants se cachent, terrifiés. Ils parlent d’hommes en uniforme sans insigne.' : 'Tu tâtonnes, puis tu tombes sur une cave : quelqu’un te guettait depuis le début.', o: [['Les convaincre de parler', 'charisme', ['social'], 'Ils parlent : le convoi transportait des captifs.', 'Ils se taisent, la peur est trop grande.'], ['Les soigner et les protéger', 'intellect', ['heal'], 'Ils te font confiance, et te donnent un nom.', 'Les soins échouent, un d’eux disparaît.'], ['Surveiller la cave', 'agilite', ['stealth'], 'Tu repères les ravisseurs qui reviennent.', 'Tu es repéré à ton tour.']] },
    { t: 'Les captifs', x: () => 'Les ravisseurs gardent des géno-porteurs prisonniers dans un hangar. Le moment est venu.', o: [['Donner l’assaut', 'corps', ['combat'], 'Le hangar tombe. Les captifs sont libres.', 'L’assaut est repoussé, il y a des pertes.'], ['Les libérer en silence', 'agilite', ['stealth'], 'Les cellules s’ouvrent une à une, sans alarme.', 'L’alarme retentit.'], ['Négocier leur départ', 'charisme', ['social'], 'Un accord tendu : ils partent, vous aussi.', 'On te prend pour un naïf.']] }
  ], end: [['Les captifs, vivants, t’ont suivi et te doivent la vie.', { money: 250, xp: 60, rep: { civils: 8 } }], ['Le hangar est vide quand tu arrives. Seuls restent des traces et une dette.', { xp: 25, rep: { civils: 2 } }]] },
  taupe: { n: 'La taupe', ch: [
    { t: 'Quelqu’un parle', x: () => 'Trois fois d’affilée, on t’attendait là où tu allais. Quelqu’un de proche vend tes déplacements.', o: [['Surveiller ton entourage', 'intellect', ['scout'], 'Un comportement bizarre te met la puce à l’oreille.', 'Tu soupçonnes trop de monde.'], ['Tendre un faux rendez-vous', 'charisme', ['social'], 'Le piège prend : un message est intercepté.', 'Le piège est trop gros.'], ['Fouiller les messageries', 'intellect', ['hack'], 'Un échange chiffré apparaît.', 'Tu ne trouves rien et tu laisses une trace.']] },
    { t: 'Le piège', x: (p, c) => c.s >= 1 ? 'Tu as un nom. Un deuxième rendez-vous truqué doit confirmer.' : 'Tu n’as presque rien, alors tu improvises un piège.', o: [['Lui tendre un appât', 'charisme', ['social'], 'La taupe mord, et se trahit.', 'Il flaire le piège.'], ['L’isoler discrètement', 'agilite', ['stealth'], 'Tu le coinces sans bruit.', 'Il file avant que tu n’arrives.'], ['Piéger ses outils', 'intellect', ['tech'], 'Ses outils te racontent tout.', 'Il découvre le piège et change de méthode.']] },
    { t: 'Face à face', x: () => 'La taupe est devant toi, les mains vides. Elle te regarde avec un mélange de honte et de défi.', o: [['Lui faire avouer', 'charisme', ['social'], 'Elle raconte tout, en larmes : on tient sa famille.', 'Elle se mure dans le silence.'], ['La neutraliser', 'corps', ['combat'], 'Elle tombe. L’affaire est close.', 'Elle se défend avec rage.'], ['La retourner', 'intellect', ['social'], 'Elle accepte de travailler pour toi.', 'Elle te trompe encore.']] }
  ], end: [['La taupe est à toi : plus personne ne te trahit, et tu sais qui tire les ficelles.', { xp: 60, merit: 4, rep: { noir: 3 } }], ['Elle disparaît avec ses secrets. Tu continues à marcher sur des œufs.', { xp: 25, heat: 3 }]] },
  fievre: { n: 'Fièvre d’ogénite', ch: [
    { t: 'Les malades', x: p => `À ${p}, des gens tombent malades : fièvre, peau luisante, pouvoirs qui s’emballent. On ne sait pas pourquoi.`, o: [['Soigner et observer', 'intellect', ['heal'], 'Tu comprends que ça vient de l’eau.', 'Tu ne soulages personne.'], ['Interroger les familles', 'charisme', ['social'], 'Une usine revient dans tous les récits.', 'On te prend pour un agent.'], ['Prélever des échantillons', 'intellect', ['tech'], 'Tes mesures confirment l’ogénite.', 'Les échantillons sont inutilisables.']] },
    { t: 'La source', x: (p, c) => c.s >= 1 ? 'Tu remontes jusqu’à une usine de traitement clandestine.' : 'Tu remontes jusqu’à une usine, mais sans certitude.', o: [['Infiltrer l’usine', 'agilite', ['stealth'], 'Tu trouves des cuves marquées « Gamma ».', 'Tu es repéré par les gardes.'], ['Pirater leurs registres', 'intellect', ['hack'], 'Tout y est : un test à ciel ouvert.', 'Le système te verrouille.'], ['Intimider le contremaître', 'charisme', ['social'], 'Il avoue : on teste quelque chose.', 'Il appelle ses patrons.']] },
    { t: 'Le choix', x: () => 'Tu tiens la preuve : un laboratoire teste de l’ogénite concentrée sur des civils. Tu peux tout détruire, voler la formule, ou la livrer à ceux qui soignent.', o: [['Tout détruire', 'corps', ['combat'], 'Les cuves s’effondrent. La contamination s’arrête.', 'Les gardes t’en empêchent.'], ['Voler la formule', 'agilite', ['stealth'], 'La formule est à toi. Un jour elle servira.', 'On te prend la formule des mains.'], ['La livrer à des soignants', 'charisme', ['social'], 'Des soignants récupèrent le dossier. Des gens vont guérir.', 'On te ferme la porte au nez.']] }
  ], end: [['La fièvre recule, la ville te doit beaucoup.', { xp: 70, money: 150, rep: { civils: 10, gamma: -6 } }], ['La fièvre persiste, tu as fait ce que tu as pu.', { xp: 25, rep: { civils: 2 } }]] }
};
function campCard() {
  const pc = G.pc, f = pc.flags; let c = f.camp; const done = f.campDone = f.campDone || [];
  if (!c) { const left = Object.keys(CAMPS).filter(k => !done.includes(k) && !uniqSkip('camps', k)); if (!left.length) return missionCard(); c = f.camp = { id: pick(left), ch: 0, s: 0 }; }
  const def = CAMPS[c.id]; const ch = def.ch[c.ch]; f.campWk = G.wk; const place = esc(capName(G.loc));
  const L = ch.o.map(([lab, attr, tags, okT, koT]) => { const dc = 12 + 2 * wTier(); return C(lab, () => {
    const r = check(attr, dc, tags); if (r.ok) c.s++; c.ch++;
    const last = c.ch >= def.ch.length; const gain = fx({ xp: 12 + 4 * wTier(), hp: r.ok ? 0 : -rint(2, 7), heat: r.ok ? 0 : 2 });
    if (!last) return show({ kicker: `CAMPAGNE · ${def.n.toUpperCase()}`, title: r.ok ? 'Ça avance' : 'Un contretemps', text: [r.ok ? okT : koT, checkLine(r), `<span class="mut">Chapitre ${c.ch}/${def.ch.length} terminé. La suite viendra bientôt.</span>`], fx: gain, choices: [C('Continuer', hub)] });
    const good = c.s >= 2; const [txt, rw] = def.end[good ? 0 : 1]; f.camp = null; done.push(c.id); G.score.camps = (G.score.camps || 0) + (good ? 1 : 0); logEntry(`Campagne « ${def.n} » : ${good ? 'réussie' : 'inachevée'}.`);
    show({ kicker: `CAMPAGNE · ${def.n.toUpperCase()}`, title: good ? 'Dénouement' : 'Dénouement amer', text: [r.ok ? okT : koT, checkLine(r), txt], fx: [...gain, ...fx(rw)], choices: [C('Continuer', hub)] });
  }, { odds: [attr, dc, tags], ic: '📖' }); });
  show({ kicker: `CAMPAGNE · ${def.n.toUpperCase()} · ${c.ch + 1}/${def.ch.length}`, title: ch.t, text: [ch.x(place, c)], choices: L });
}
// ── Compagnons à histoire ──
const COMP_Q = [
  ['Une dette ancienne', n => `${n} t’avoue qu’il doit de l’argent à des gens dangereux. « Je ne voulais pas t’embêter avec ça. »`, ['Payer sa dette (150 ¢)', 'money', 'Il est bouleversé. Tu viens de gagner un frère.'], ['L’aider à négocier', 'charisme', 'Tu règles l’affaire avec des mots. Il t’en est reconnaissant.'], ['Lui dire de se débrouiller', null, 'Il hoche la tête. Quelque chose s’éteint.']],
  ['Un proche disparu', n => `${n} cherche quelqu’un de sa famille depuis des années. Une piste vient de tomber.`, ['L’accompagner sur la piste', 'intellect', 'Vous trouvez la trace d’un proche. Il pleure de joie.'], ['Envoyer quelqu’un à ta place', 'money', 'Un coursier s’en occupe. Il te remercie, un peu froid.'], ['Dire que ce n’est pas le moment', null, 'Il baisse les yeux.']],
  ['La peur de son pouvoir', n => `${n} t’avoue avoir peur de ce qu’il est. Hier, il a fait peur à des enfants.`, ['L’entraîner à le maîtriser', 'maitrise', 'Quelque chose se déverrouille chez lui. Il rayonne.'], ['Lui parler longuement', 'charisme', 'Il te raconte son enfance. Un poids tombe.'], ['Lui dire de se contrôler', null, 'Il serre les poings, sans un mot.']],
  ['Un vieux compte', n => `Quelqu’un de son passé a retrouvé ${n}. Il veut s’y confronter, seul, ce soir.`, ['L’accompagner', 'corps', 'Vous réglez ça ensemble. Une amitié se scelle.'], ['Le laisser faire, de loin', 'agilite', 'Tu veilles de loin. Il s’en sort, et le sait.'], ['Le dissuader', 'charisme', 'Il t’écoute, à contrecœur.']],
  ['Un doute sur la faction', n => `${n} doute de sa faction d’origine. « Et si on nous manipulait depuis le début ? »`, ['Fouiller avec lui', 'intellect', 'Vous trouvez des preuves troublantes. Il te fait confiance comme à personne.'], ['Le rassurer', 'charisme', 'Il se calme, pour l’instant.'], ['Lui dire d’obéir', null, 'Il te regarde longtemps.']]
];
function companionCard() {
  const pc = G.pc; const cand = pc.party.filter(a => !a.story && a.loy >= 60 && a.inj <= 0 && CH[a.id]); if (!cand.length) return missionCard();
  const a = pick(cand); const c = CH[a.id]; const q = pick(COMP_Q); const nm = esc(c.name); const dc = 12 + wTier();
  const done = (txt, dl, extra) => { a.story = 1; a.loy = clamp(a.loy + dl, 0, 100); if (dl >= 8) { a.hpMax += 4; a.hp = a.hpMax; a.atk += 1; } logEntry(`${c.name} t’a confié une histoire.`); show({ kicker: 'COMPAGNON · ' + nm.toUpperCase(), title: dl >= 8 ? 'Un lien plus fort' : dl > 0 ? 'Un moment partagé' : 'Un silence', text: [txt, dl >= 8 ? `<span class="good">${nm} devient plus loyal et plus solide (+4 PV, +1 attaque).</span>` : ''], fx: extra || [], choices: [C('Continuer', hub)] }); };
  const [l1, k1, t1] = q[2], [l2, k2, t2] = q[3], [l3, , t3] = q[4];
  const opt = (l, k, t, dlOk) => C(l, () => {
    if (k === 'money') { pc.money -= 150; return done(t, 12); }
    const r = check(k, dc, k === 'charisme' ? ['social'] : k === 'maitrise' ? ['control'] : k === 'intellect' ? ['scout'] : ['combat']); if (r.ok) return done(t, dlOk, fx({ xp: 25 })); a.loy = clamp(a.loy - 3, 0, 100); show({ kicker: 'COMPAGNON · ' + nm.toUpperCase(), title: 'Ça ne prend pas', text: [`Tu n’as pas trouvé les mots.`, checkLine(r)], choices: [C('Continuer', hub)] }); },
    { ic: '💬', odds: k === 'money' ? null : [k, dc, k === 'charisme' ? ['social'] : []], req: k === 'money' ? { money: 150 } : undefined });
  show({ extra: portrait(c.id, 110), kicker: 'COMPAGNON · ' + nm.toUpperCase(), title: q[0], text: [q[1](nm)], choices: [opt(l1, k1, t1, 10), opt(l2, k2, t2, 8), C(l3, () => done(t3, -6), { cls: 'back' }), C('Plus tard', hub, { cls: 'back' })] });
}
// ── Infiltration à jauge d'alerte ──
const INFIL = new Set(['infiltration', 'prototype', 'ecoute', 'vehicule', 'braquage', 'kidnapping', 'incendie', 'assassinat', 'fauxpapiers']);
const INFIL_STEPS = [['L’approche', 'Le site est en vue : rondes, caméras, un seul accès sûr.'], ['Au cœur du site', 'Tu es à l’intérieur. Il reste à atteindre l’objectif sans réveiller personne.'], ['La sortie', 'L’objectif est à toi. Il faut encore ressortir.']];
function infiltration(o) {
  let alert = 0, step = 0; const dc = dcOf(o.tier, o.diff); const a = ARCH[o.arch];
  const gauge = () => '●'.repeat(Math.min(3, alert)) + '○'.repeat(Math.max(0, 3 - alert));
  const next = () => {
    if (alert >= 3) return alarm(); if (step >= INFIL_STEPS.length) { advance(o.weeks); if (G.status !== 'play') return; return finishMission(o, alert === 0 ? 'crit' : alert === 1 ? 'ok' : 'partial', [alert === 0 ? 'Personne ne saura jamais que tu es venu.' : alert === 1 ? 'Un incident, vite étouffé. Tu t’en sors.' : 'Ça a failli tourner mal, mais tu as ce qu’il fallait.'], []); }
    const [t, x] = INFIL_STEPS[step]; const L = [['furtif', 'agilite', ['stealth', 'mobility'], 'Te glisser dans l’ombre', 'Une ombre trop visible.'], ['ruse', 'charisme', ['social', 'disguise'], 'Jouer l’assurance', 'Un regard de travers.'], ['hack', 'intellect', ['hack'], 'Couper les capteurs', 'Un capteur t’a vu.'], ['tech', 'intellect', ['tech'], 'Forcer et bricoler', 'Le mécanisme grince.']].filter(x => !APPROACH[x[0]].req || !APPROACH[x[0]].req.cap || hasCap(APPROACH[x[0]].req.cap));
    show({ kicker: `INFILTRATION · ${a.n.toUpperCase()}`, title: t, text: [x, `Alerte : <b class="${alert ? 'badc' : 'acc'}">${gauge()}</b>`], choices: L.map(([k, attr, tags, lab, ko]) => C(lab, () => { const r = check(attr, dc + (step === 2 ? 1 : 0), tags); step++; if (!r.ok) { alert += r.fumble ? 2 : 1; } show({ kicker: 'INFILTRATION', title: r.ok ? 'Passé' : 'Un bruit', text: [r.ok ? 'Personne ne te remarque.' : ko, `Alerte : <b class="${alert ? 'badc' : 'acc'}">${gauge()}</b>`, checkLine(r)], choices: [C('Continuer', next)] }); }, { odds: [attr, dc, tags], ic: '🕶' })) });
  };
  const alarm = () => { const foes = foesFor(o.tgt === 'fa' ? 'fa' : o.tgt, Math.min(5, o.tier), 2); show({ kicker: 'ALARME', title: 'Les sirènes hurlent', text: ['Tout le site est en alerte. Il faut passer en force.'], choices: [C('Se battre', () => startCombat({ title: 'Alarme', foes, intro: 'Les gardes déboulent.', lethal: lethalOf(o.tgt), canFlee: true, onWin: L => finishMission(o, 'partial', ['Tu sors en force. L’objectif est à toi, le site beaucoup moins.'], L), onFlee: () => missionFail(o, ['Tu t’enfuis sans rien.'], { fled: true }) })), C('Abandonner', () => missionFail(o, ['Tu renonces.'], { fled: true }), { cls: 'back' })] }); };
  next();
}
// ── Événements de ville ──
const CITY_EV = [
  { k: 'Couvre-feu', x: 'Les haut-parleurs ordonnent de rentrer. Les rues se vident, les patrouilles passent en boucle.', o: [['Respecter le couvre-feu', null, 'Tu patientes. La nuit passe, sans histoire.', { rep: 1 }], ['Sortir quand même', ['agilite', ['stealth']], 'Tu profites des rues vides : un entrepôt sans gardien.', { money: 120, xp: 12 }, 'Une patrouille te surprend.', { heat: 4 }]] },
  { k: 'Raid de la F.A.', x: 'La Force d’Autorité boucle le quartier, des détecteurs à la main. Les gens se terrent.', o: [['Te cacher', ['agilite', ['stealth']], 'Tu disparais dans une cave.', { xp: 10 }, 'On te repère.', { heat: 6 }], ['Aider les voisins à fuir', ['charisme', ['social', 'defense']], 'Tu ouvres des passages. On te remercie.', { rep: 6, xp: 20, heat: 2 }, 'Tu te fais repérer en les aidant.', { heat: 5 }], ['Quitter le quartier', null, 'Tu t’éloignes à temps.', {}]] },
  { k: 'Tournoi de l’ARENA', x: 'Des affiches colorées annoncent un tournoi de gladiateurs. La rue est en liesse, les paris fusent.', o: [['Parier 100 ¢', 'bet', 'Le sort décide…', {}], ['Passer ton chemin', null, 'Tu laisses la foule à sa fête.', {}]] },
  { k: 'Marché de nuit', x: 'Des étals de lumière colorée dressés dans la nuit : tissus, ferrailles, gadgets d’occasion.', o: [['Chiner (80 ¢)', 'shop', 'Tu fouilles les étals.', {}], ['Juste se promener', null, 'Tu t’imprègnes de l’ambiance.', { xp: 8 }]] },
  { k: 'Fête de quartier', x: 'Un quartier entier danse : musique, odeurs de cuisine, rires. Personne ne te pose de questions.', o: [['Te joindre à la fête', null, 'Tu te laisses porter. Tu te sens mieux.', { rep: 3, heal: 1 }], ['Écouter les conversations', ['intellect', ['scout']], 'Tu glanes une rumeur utile.', { xp: 15 }, 'Rien d’intéressant.', {}]] },
  { k: 'Grève générale', x: 'Les ouvriers ont posé les outils. La ville est à l’arrêt, les esprits chauffent.', o: [['Les soutenir', ['charisme', ['social']], 'Tu portes leur voix. On t’adopte.', { rep: 6, heat: 1 }, 'On te prend pour un provocateur.', { rep: -2 }], ['En profiter', null, 'Tu glisses dans les bureaux vides.', { money: 100, rep: -4, heat: 1 }]] }
];
function cityEventNow() { let i = (hashStr(G.loc) + Math.floor(G.wk / 6)) % CITY_EV.length; for (let n = 0; n < CITY_EV.length && uniqSkip('cityEv', i); n++) i = (i + 1) % CITY_EV.length; return { i, ev: CITY_EV[i], key: G.loc + ':' + Math.floor(G.wk / 6) }; }
function cityEventCard() {
  const pc = G.pc; const { ev, key } = cityEventNow(); pc.flags.cityEv = pc.flags.cityEv || {}; if (pc.flags.cityEv[key]) return missionCard(); pc.flags.cityEv[key] = 1;
  const dc = 11 + wTier(); const rep = n => { addCityRep(n); };
  const res = (title, txt, e, L) => { if (e.rep) rep(e.rep); if (e.heal) { pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.4)); pc.en = pc.enMax; } show({ kicker: ev.k.toUpperCase(), title, text: [txt].concat(L || []), fx: fx({ money: e.money || 0, xp: e.xp || 0, heat: e.heat || 0 }), choices: [C('Continuer', hub)] }); };
  show({ kicker: capName(G.loc).toUpperCase() + ' · CE SOIR', title: ev.k, text: [ev.x], choices: ev.o.map(([lab, chk, okT, okE, koT, koE]) => C(lab, () => {
    if (chk === 'bet') { if (pc.money < 100) return toast('Il te faut 100 ¢'); pc.money -= 100; const win = chance(0.45); return show({ kicker: ev.k.toUpperCase(), title: win ? 'Gagné !' : 'Perdu', text: [win ? 'Ton champion l’emporte. Tu encaisses le double.' : 'Ton champion s’écroule au deuxième round.'], fx: fx({ money: win ? 200 : 0 }), choices: [C('Continuer', hub)] }); }
    if (chk === 'shop') { if (pc.money < 80) return toast('Il te faut 80 ¢'); pc.money -= 80; const id = pick(['capsule', 'kit', 'jumelles', 'grappin', 'radio', 'stimulant', 'bandage', 'crochets']); giveItem(id); return res('Une trouvaille', `Tu repars avec : ${ITEMS[id].n}.`, {}); }
    if (!chk) return res('Soirée', okT, okE);
    const r = check(chk[0], dc, chk[1]); r.ok ? res('Bien joué', okT, okE, [checkLine(r)]) : res('Mauvais calcul', koT, koE, [checkLine(r)]);
  }, { odds: Array.isArray(chk) ? [chk[0], dc, chk[1]] : null, ic: '🌃' })) });
}
// ── Planque personnelle / QG ──
const hqOf = () => { const pc = G.pc; return (G.world.leader[pc.faction] === 'pc' && F[pc.faction] && F[pc.faction].hq) ? F[pc.faction].hq : null; };
const baseCity = () => hqOf() || (G.pc.base && G.pc.base.city);
const isBaseHere = () => baseCity() === G.loc;
function baseTile(L) { // tuile ajoutée à « En ville »
  if (!feat('planque')) return; const pc = G.pc; const hq = hqOf();
  if (isBaseHere()) L.unshift(C(hq ? 'QG de ta faction' : 'Ta planque', baseMenu, { ic: '🏠', sub: 'Repos gratuit, coffre, cache.' }));
  else if (!baseCity()) L.unshift(C('Établir une planque ici (600 ¢)', () => { pc.money -= 600; pc.base = { city: G.loc, lvl: 1 }; logEntry(`Tu établis une planque à ${capName(G.loc)}.`); baseMenu(); }, { ic: '🏠', req: { money: 600, ok: () => cityRep() <= -10 ? 'La ville te rejette' : null }, sub: 'Un refuge à toi. Si tu diriges une faction, ton QG en tient lieu.' }));
}
function baseMenu() {
  const pc = G.pc; const hq = hqOf(); const b = pc.base = pc.base || { city: hq, lvl: 1 }; if (hq) b.city = hq; const L = [];
  L.push(C('Se reposer (gratuit)', () => { advance(1); if (G.status !== 'play') return; pc.hp = pc.hpMax; pc.en = pc.enMax; pc.party.forEach(a => { a.inj = 0; a.hp = a.hpMax; }); if (b.lvl >= 3) addHeat(-10); show({ kicker: 'PLANQUE', title: 'Une vraie nuit', text: ['Tu dors en sécurité. Ton équipe aussi.' + (b.lvl >= 3 ? ' Ta cache te fait oublier : prime −10.' : '')], choices: [C('Continuer', hub)] }); }, { ic: '🛏', cls: 'safe' }));
  if (b.lvl < 3) { const cost = b.lvl === 1 ? 500 : 900; L.push(C(`Améliorer (${cost} ¢)`, () => { pc.money -= cost; b.lvl++; toast('Planque niveau ' + b.lvl); baseMenu(); }, { ic: '🔧', req: { money: cost }, sub: b.lvl === 1 ? 'Niveau 2 : coffre sûr (pas de pillage en défaite).' : 'Niveau 3 : cache, la prime baisse à chaque repos.' })); }
  L.push(C('← Retour', cityMenu, { cls: 'back' }));
  show({ kicker: hq ? 'QG' : 'PLANQUE', title: `${hq ? F[pc.faction].name : 'Ta planque'} · ${capName(b.city)}`, text: [`Niveau ${b.lvl}/3. ${b.lvl >= 2 ? 'Coffre sûr. ' : ''}${b.lvl >= 3 ? 'Cache active. ' : ''}${hq ? 'Tu diriges la faction : le QG est ta planque.' : ''}`], choices: L, tiles: true });
}
// ── Atelier de faction (dans la capitale de ta faction) ──
const RECIPES = [['bandage', 3, 60, 'Bandages ×3'], ['capsule', 3, 90, 'Capsules OGEN ×3'], ['kit', 2, 100, 'Kits de soins ×2'], ['stimulant', 1, 110, 'Stimulant'], ['faux', 1, 180, 'Faux papiers'], ['brouilleur', 1, 250, 'Brouilleur de radar'], ['drone', 1, 300, 'Drone éclaireur'], ['crochets', 1, 90, 'Set de crochetage'], ['grappin', 1, 80, 'Corde & grappin']];
const atelierHere = () => G.pc.faction !== 'civils' && F[G.pc.faction] && F[G.pc.faction].hq === G.loc;
function atelierTile(L) { if (feat('atelier') && atelierHere()) L.unshift(C('Atelier de faction', atelierMenu, { ic: '🔩', sub: 'Fabriquer soins, gadgets, faux papiers.' })); }
function atelierMenu() {
  const pc = G.pc; const disc = hasRole('ingenieur') ? 0.7 : 1; const L = [];
  RECIPES.forEach(([id, n, cost, lab]) => { const p = Math.round(cost * disc * (id === 'faux' && hasRole('costumier') ? 0.7 : 1)); const q = n * (id === 'kit' && hasRole('medecin') ? 2 : 1); L.push(C(`${lab}${id === 'kit' && hasRole('medecin') ? ' (×2 médecin)' : ''} — ${p} ¢`, () => { pc.money -= p; giveItem(id, q); toast(`Fabriqué : ${ITEMS[id].n} ×${q}`); atelierMenu(); }, { req: { money: p }, sub: ITEMS[id].desc })); });
  L.push(C('← Retour', cityMenu, { cls: 'back' })); show({ kicker: 'ATELIER', title: `Atelier de ${F[pc.faction].name}`, text: [`Tu as <b>${fmt(pc.money)} ¢</b>. ${hasRole('ingenieur') ? 'Ingénieur : −30 %.' : ''}`], choices: L });
}
// ── Escouades de faction (sans ressources) ──
const SQUADS = [['reco', 'Reconnaissance', 'Elle cherche des pistes sur les pierres antiques.'], ['secu', 'Sécuriser un territoire', 'Elle tente de faire basculer une région neutre ou ennemie.'], ['prop', 'Propagande', 'Elle apaise les civils : réputation et contrats.'], ['neut', 'Frapper un ennemi', 'Elle affaiblit une faction ennemie.']];
function squadMenu() {
  const pc = G.pc, W = G.world; const sq = pc.flags.squad; const L = [];
  if (sq) { L.push(Object.assign(C(`Escouade en mission (${SQUADS.find(x => x[0] === sq.k)[1]})`, () => { }), { lock: `Retour dans ${Math.max(0, sq.back - G.wk)} semaine(s)` })); }
  else SQUADS.forEach(([k, n, d]) => L.push(C(n, () => { pc.flags.squad = { k, back: G.wk + 3 }; toast('Escouade envoyée : retour dans 3 semaines'); factionMenu(); }, { sub: d, ic: '🛡' })));
  L.push(C('← Retour', factionMenu, { cls: 'back' })); show({ kicker: F[pc.faction].name, title: 'Envoyer une escouade', text: ['Un groupe de ta faction part en opération pendant que tu joues ailleurs. Aucun budget à gérer : il revient avec un rapport.'], choices: L });
}
function squadTile(L) { const pc = G.pc; if (feat('escouade') && pc.faction !== 'civils' && pc.grade >= 3) L.push(C('Envoyer une escouade', squadMenu, { ic: '🛡', sub: pc.flags.squad ? 'En mission.' : 'Opérations de faction sans gestion de budget.' })); }
function squadReturn() {
  const pc = G.pc, W = G.world; const sq = pc.flags.squad; if (!sq || G.wk < sq.back) return missionCard(); pc.flags.squad = null; const wf = W.fac[pc.faction] || { power: 20 }; const ok = chance(clamp(0.5 + wf.power / 200, 0.4, 0.85)); const k = sq.k; const t = [`Ton escouade rentre.`]; let L = [];
  if (!ok) { wf.power = Math.max(6, wf.power - 2); return show({ kicker: 'ESCOUADE', title: 'Une opération difficile', text: ['Ton escouade rentre amoindrie : la mission a échoué.'], choices: [C('Continuer', hub)] }); }
  if (k === 'reco') { const l = stoneClueGain(); t.push(l ? 'Elle ramène une piste : ' + esc(cap(l)) : 'Elle n’a rien trouvé de neuf.'); L = fx({ xp: 20 }); }
  else if (k === 'secu') { const st = pick(DATA.states.filter(s => W.terr[s.id] !== pc.faction && W.terr[s.id] !== 'pc')); if (st) { W.terr[st.id] = pc.faction; t.push(`Elle prend le contrôle de ${esc(st.name)}.`); warLog(`${F[pc.faction].name} prend ${st.name}.`); } wf.power = Math.min(100, wf.power + 2); L = fx({ merit: 3 }); }
  else if (k === 'prop') { addCityRep(6); L = fx({ rep: { civils: 8 }, xp: 15 }); t.push('Les civils parlent de toi en bien.'); }
  else { const en = enemiesOf(pc.faction); if (en.length) { const e = pick(en); W.fac[e].power = Math.max(6, W.fac[e].power - 6); t.push(`${F[e].name} est durement touchée.`); L = fx({ rep: { [e]: -6 }, merit: 3 }); } }
  show({ kicker: 'ESCOUADE', title: 'Mission accomplie', text: t, fx: L, choices: [C('Continuer', hub)] });
}
// ── Injection dans le fil, un spécial à la fois ──
function lot2Pool(pool) {
  const pc = G.pc; const ok = spOk(2);
  const sp = (w, f) => pool.push({ w, f: spMark(f) });
  if (pc.flags.squad && G.wk >= pc.flags.squad.back) pool.push({ w: 60, f: squadReturn });
  if (!ok) return;
  if (feat('camp') && (pc.flags.camp || Object.keys(CAMPS).some(k => !(pc.flags.campDone || []).includes(k) && !uniqSkip('camps', k))) && G.wk - (pc.flags.campWk || -9) >= 3) sp(pc.flags.camp ? 22 : 12, campCard);
  if (feat('comp') && pc.party.some(a => !a.story && a.loy >= 60 && a.inj <= 0)) sp(14, companionCard);
  if (feat('ville') && !(pc.flags.cityEv || {})[cityEventNow().key]) sp(14, cityEventCard);
}
