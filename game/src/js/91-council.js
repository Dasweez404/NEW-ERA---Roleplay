// ───────── Conseil de faction : sujets variés, vrais choix, jets, conséquences différentes ─────────
(function () {
  const en = fid => { const e = enemiesOf(fid); return e.length ? pick(e) : 'fa'; };
  const TOP = [
    { id: 'cible', t: 'Prochaine cible', d: f => `${f.name} doit choisir sa prochaine cible.`, o: [
      ['Frapper la Force d’Autorité', { g: 1, chk: ['corps', 13, ['combat']], ok: ['L’opération réussit : la F.A. recule.', { rep: { fa: -6 }, merit: 5, heat: 2, _pow: 2 }], ko: ['L’opération tourne court. Des blessés.', { hp: -8, merit: 1, heat: 3 }] }],
      ['Viser un rival, discrètement', { g: 2, chk: ['agilite', 14, ['stealth']], ok: ['Un coup précis : le rival est affaibli.', { merit: 7, xp: 20, _rival: -5 }], ko: ['Le rival flaire le piège et riposte.', { merit: 1, rep: { civils: -2 } }] }],
      ['Lancer une grande offensive', { g: 3, chk: ['charisme', 15, ['social', 'ally']], ok: ['Tu rallies tout le monde : l’offensive est un succès.', { merit: 10, xp: 30, _pow: 4, heat: 3 }], ko: ['La faction ne suit pas. Tu perds la face.', { merit: -2, rep: { '$me': -4 } }] }],
      ['Temporiser : rassembler des infos', { chk: ['intellect', 12, ['scout']], ok: ['Ton rapport est précieux.', { merit: 4, xp: 15, _clue: true }], ko: ['Tu perds du temps, sans rien trouver.', { xp: 5 }] }]] },
    { id: 'budget', t: 'Que faire des fonds ?', d: () => 'Il reste des fonds dans la caisse. À quoi les consacrer ?', o: [
      ['L’armement', { g: 1, ok: ['La faction s’arme mieux.', { merit: 4, _pow: 2, xp: 10 }] }],
      ['Des abris et des soins', { g: 2, ok: ['Les quartiers voisins te remercient.', { rep: { civils: 7 }, merit: 6 }] }],
      ['Une cellule de recherche sur les pierres', { g: 3, ok: ['Les chercheurs ont déjà une piste.', { merit: 8, xp: 10, _clue: true }] }],
      ['Des primes pour les membres', { pay: 150, ok: ['Le moral grimpe. Les loyautés aussi.', { merit: 5, _loy: 6 }] }]] },
    { id: 'dissension', t: 'Deux lieutenants s’affrontent', d: () => 'Deux lieutenants s’opposent sur la stratégie. Le conseil se tourne vers toi.', o: [
      ['Soutenir l’aile dure', { g: 1, ok: ['L’aile dure l’emporte, la faction se radicalise.', { merit: 3, heat: 2, _pow: 1 }] }],
      ['Les réconcilier', { g: 2, chk: ['charisme', 14, ['social']], ok: ['Un compromis solide : tout le monde te remercie.', { merit: 7, xp: 15 }], ko: ['Les deux se vexent.', { merit: 1, rep: { '$me': -3 } }] }],
      ['Trancher et exclure l’un des deux', { g: 3, ok: ['Tu exclus le plus remuant. L’autre te doit sa place.', { merit: 6, xp: 10, _karma: -1 }] }],
      ['Demander l’avis d’un allié', { party: 1, ok: ['Ton allié a un avis tranché, et juste.', { merit: 4, xp: 10, _loy: 4 }] }]] },
    { id: 'regime', t: 'Une offre du Nouveau Régime', d: () => 'Un émissaire propose l’amnistie à la faction en échange de noms.', o: [
      ['Refuser net', { g: 1, ok: ['La faction refuse, la tête haute.', { merit: 4, rep: { '$me': 3 } }] }],
      ['Lui livrer de faux noms', { g: 2, chk: ['intellect', 15, ['social', 'tech']], ok: ['Tu l’as piégé : la F.A. perd du temps.', { merit: 8, xp: 20, rep: { fa: 2 } }], ko: ['Il s’en rend compte.', { merit: -2, heat: 5 }] }],
      ['Accepter et sacrifier un rival', { g: 3, ok: ['Un rival tombe. Ta faction hésite à te faire confiance.', { merit: 9, money: 400, rep: { fa: 5, $me: -6 }, _karma: -2 }] }],
      ['Négocier plus que ce qu’il propose', { chk: ['charisme', 16, ['social']], ok: ['L’émissaire cède : amnistie ET fonds.', { merit: 6, money: 500, xp: 20 }], ko: ['Il rompt les pourparlers.', { merit: 1 }] }]] },
    { id: 'prisonniers', t: 'Des prisonniers', d: f => `Des hommes de ${F[en(fid0())].name} sont tombés entre vos mains.`, o: [
      ['Les libérer contre une faveur', { g: 1, ok: ['Ils t’en doivent une.', { merit: 3, rep: { '$me': 1 }, xp: 10 }] }],
      ['Demander une rançon', { g: 2, ok: ['La rançon tombe.', { merit: 3, money: 350 }] }],
      ['Les interroger', { chk: ['charisme', 14, ['social']], ok: ['L’un parle : tu apprends quelque chose.', { merit: 5, _clue: true, xp: 15 }], ko: ['Ils se taisent. L’ambiance est lourde.', { _karma: -1 }] }],
      ['Les laisser filer en secret', { chk: ['agilite', 13, ['stealth']], ok: ['Personne ne l’a su. Eux, si.', { rep: { civils: 3 }, xp: 10, _karma: 1 }], ko: ['On t’a surpris à les aider.', { merit: -4 }] }]] },
    { id: 'recrue', t: 'Une recrue suspecte', d: () => 'Une nouvelle recrue pose trop de questions.', o: [
      ['La tester', { chk: ['intellect', 13, ['scout']], ok: ['Elle est réglo : une bonne recrue.', { merit: 3, xp: 10, _ally: true }], ko: ['Le test ne prouve rien. Le doute reste.', { xp: 5 }] }],
      ['L’accueillir sans question', { ok: ['Elle se révèle loyale. Un peu naïve aussi.', { merit: 2, _loy: 3 }] }],
      ['La bannir', { g: 2, ok: ['Elle disparaît. La faction respire… ou pas.', { merit: 3, _karma: -1 }] }],
      ['La faire surveiller', { pay: 80, ok: ['Un rapport complet : elle était bien infiltrée.', { merit: 6, xp: 20, rep: { fa: -3 } }] }]] },
    { id: 'territoire', t: 'Un territoire contesté', d: () => 'Un quartier voisin est disputé par un rival.', o: [
      ['Envoyer des renforts', { g: 1, fight: 'rival', ok: ['Tu tiens le quartier.', { merit: 6, xp: 20, _pow: 2 }], ko: ['Vous reculez.', { merit: 1 }] }],
      ['Négocier un partage', { g: 2, chk: ['charisme', 15, ['social']], ok: ['Un partage tendu mais durable.', { merit: 7, xp: 15, _pow: 1 }], ko: ['Il refuse et tire la couverture.', { merit: 0 }] }],
      ['Saboter le rival', { chk: ['intellect', 14, ['tech', 'hack']], ok: ['Ses dépôts sont HS. Il n’a plus de souffle.', { merit: 5, xp: 15, heat: 2 }], ko: ['Ton sabotage est remonté jusqu’à vous.', { heat: 4, merit: -1 }] }],
      ['Céder le quartier', { ok: ['Tu laisses faire. Les cadres soupirent.', { merit: -1 }] }]] },
    { id: 'fuite', t: 'Une fuite', d: () => 'Des informations sensibles ont fuité. Quelqu’un parle.', o: [
      ['Mener l’enquête', { chk: ['intellect', 14, ['scout', 'hack']], ok: ['Tu démasques le coupable.', { merit: 6, xp: 20 }], ko: ['Tu accuses le mauvais.', { merit: -2, _karma: -1 }] }],
      ['Purger les suspects', { g: 3, ok: ['Les fuites s’arrêtent. L’ambiance aussi.', { merit: 4, _karma: -2, _loy: -5 }] }],
      ['Tendre un piège avec une fausse info', { chk: ['charisme', 14, ['social']], ok: ['Le piège se referme sur le traître.', { merit: 8, xp: 20 }], ko: ['Personne ne mord.', { xp: 5 }] }],
      ['Ignorer', { ok: ['Rien ne se passe… pour l’instant.', { heat: 2 }] }]] },
    { id: 'moral', t: 'Le moral est bas', d: () => 'La faction est fatiguée. Il faut remonter le moral.', o: [
      ['Organiser une fête', { pay: 120, ok: ['Une nuit mémorable. Les liens se renforcent.', { merit: 4, _loy: 6, xp: 10 }] }],
      ['Un entraînement collectif', { chk: ['corps', 13, ['combat']], ok: ['Tout le monde sort plus solide.', { merit: 5, xp: 20, _pow: 1 }], ko: ['Un blessé, des rancœurs.', { hp: -6 }] }],
      ['Un discours', { g: 1, chk: ['charisme', 13, ['social']], ok: ['La salle se lève.', { merit: 5, xp: 15 }], ko: ['Un silence gêné.', { merit: 0 }] }],
      ['Punir les déserteurs', { g: 2, ok: ['L’exemple est fait. La peur change de camp.', { merit: 3, _karma: -1, _loy: -3 }] }]] },
    { id: 'allie', t: 'Un allié demande de l’aide', d: () => 'Une faction amie réclame du soutien.', o: [
      ['Envoyer des combattants', { g: 1, ok: ['L’alliance se renforce.', { merit: 4, rep: { '$ally': 5 }, _pow: -1 }] }],
      ['Envoyer des fonds', { pay: 200, ok: ['Un chèque bien reçu.', { merit: 3, rep: { '$ally': 6 } }] }],
      ['Demander une contrepartie', { chk: ['charisme', 14, ['social']], ok: ['Ils paient d’avance.', { merit: 5, money: 300 }], ko: ['Ils se vexent.', { rep: { '$ally': -4 } }] }],
      ['Refuser poliment', { ok: ['L’allié encaisse, rancunier.', { rep: { '$ally': -2 } }] }]] },
    { id: 'artefact', t: 'Une trouvaille étrange', d: () => 'Un membre rapporte un objet ancien, couvert de glyphes.', o: [
      ['L’étudier', { chk: ['intellect', 14, ['relic', 'scout']], ok: ['Ces glyphes parlent d’une pierre antique.', { merit: 6, _clue: true, xp: 20 }], ko: ['Rien de lisible. L’objet s’abîme.', { xp: 5 }] }],
      ['Le vendre au Marché Noir', { ok: ['Un bon prix, sans questions.', { money: 450, rep: { noir: 2 } }] }],
      ['Le garder pour la faction', { g: 2, ok: ['Un trophée, et un porte-bonheur.', { merit: 4, _item: 'detecteur' }] }],
      ['Le détruire', { ok: ['On ne sait jamais ce que ça fait.', { merit: 1, _karma: 1 }] }]] },
    { id: 'civils', t: 'Un quartier en danger', d: () => 'Un quartier civil est menacé. La faction peut intervenir.', o: [
      ['Défendre le quartier', { g: 1, fight: 'fa', ok: ['Le quartier est sauvé.', { merit: 6, rep: { civils: 8 }, xp: 20 }], ko: ['Vous êtes repoussés.', { hp: -6, rep: { civils: 2 } }] }],
      ['Organiser l’évacuation', { chk: ['charisme', 13, ['social', 'logi']], ok: ['Tout le monde sort à temps.', { merit: 5, rep: { civils: 7 } }], ko: ['La panique fait des blessés.', { rep: { civils: 1 }, hp: -4 }] }],
      ['Négocier avec l’agresseur', { g: 2, chk: ['charisme', 15, ['social']], ok: ['Il se retire, bredouille.', { merit: 7, xp: 20 }], ko: ['Il rit.', { merit: 0 }] }],
      ['Ne rien faire', { ok: ['La faction regarde ailleurs.', { rep: { civils: -4 }, _karma: -1 }] }]] }
  ];
  function fid0() { return G.pc.faction; }
  function alliedOf() { const a = Object.keys(F).filter(x => !['civils', 'noir', 'fallen', 'own'].includes(x) && x !== G.pc.faction && relation(G.pc.faction, x) >= 2); return a.length ? pick(a) : 'civils'; }
  EVENT_FN.council = function () {
    const pc = G.pc; const fid = pc.faction; const f = F[fid]; const g = pc.grade; const wf = G.world.fac[fid] || { power: 15 }; const fl = pc.flags;
    if (g === 0) return show({ kicker: f.name, title: 'Réunion de ta faction', text: [`Les cadres tranchent sans toi. Recrue, tu écoutes au fond de la salle.`], choices: [C('Écouter et retenir (+XP)', () => { show({ title: 'Tu apprends', text: ['Tu retiens les noms et les rapports de force.'], fx: fx({ xp: 12 }), choices: [C('Continuer', hub)] }); }), C('Partir', hub, { cls: 'back' })] });
    fl.councilSeen = fl.councilSeen || []; const pool = TOP.filter(t => !fl.councilSeen.includes(t.id)); const tp = pick(pool.length ? pool : TOP); fl.councilSeen.push(tp.id); if (fl.councilSeen.length > 8) fl.councilSeen.shift(); fl.councilWk = G.wk;
    const done = (txt, e) => { e = Object.assign({}, e || {}); const clue = e._clue, ally = e._ally, item = e._item, pow = e._pow, loy = e._loy, kar = e._karma, riv = e._rival; ['_clue', '_ally', '_item', '_pow', '_loy', '_karma', '_rival'].forEach(k => delete e[k]);
      if (e.rep) { const r2 = {}; Object.entries(e.rep).forEach(([k, v]) => { r2[k === '$me' ? fid : k === '$ally' ? alliedOf() : k] = v; }); e.rep = r2; }
      const L = fx(e); if (clue) { const l = stoneClueGain(); if (l) L.push({ t: '💎 ' + cap(l).slice(0, 80), c: 'acc' }); } if (item) giveItem(item); if (pow) wf.power = clamp((wf.power || 0) + pow, 6, 100); if (loy) pc.party.forEach(a => { a.loy = clamp(a.loy + loy, 0, 100); }); if (kar) addKarma(kar);
      if (ally && pc.party.length < partyMax()) { const c = DATA.chars.find(x => x.faction === fid && x.stars <= 2 && G.world.npc[x.id].st === 'free'); if (c) { addAlly(c.id, 55); L.push({ t: `${c.name} te rejoint`, c: 'good' }); } }
      if (riv) { const e2 = en(fid); if (G.world.fac[e2]) G.world.fac[e2].power = clamp(G.world.fac[e2].power + riv, 6, 100); }
      advance(1); if (G.status !== 'play') return; show({ kicker: f.name, title: 'Décision prise', text: [txt], fx: L, choices: [C('Continuer', hub)] }); };
    const run = spec => { if (spec.pay) { if (pc.money < spec.pay) return toast('Pas assez de crédits'); pc.money -= spec.pay; }
      if (spec.fight) { const foeF = spec.fight === 'fa' ? 'fa' : en(fid); return startCombat({ title: tp.t, foes: foesFor(foeF, Math.max(1, Math.min(4, g)), 2), intro: 'Le conseil a tranché : à vous de jouer.', lethal: 'robbed', canFlee: true, onWin: L => done(spec.ok[0], spec.ok[1]), onFlee: () => done(spec.ko[0], spec.ko[1]) }); }
      if (spec.chk) { const r = check(spec.chk[0], spec.chk[1], spec.chk[2]); return r.ok ? done(spec.ok[0] + ' ' + checkLine(r), spec.ok[1]) : done(spec.ko[0] + ' ' + checkLine(r), spec.ko[1]); }
      done(spec.ok[0], spec.ok[1]); };
    const L = tp.o.map(([lab, spec]) => C(lab, () => run(spec), { odds: spec.chk ? [spec.chk[0], spec.chk[1], spec.chk[2]] : null, sub: spec.pay ? `${spec.pay} ¢` : spec.fight ? 'Combat' : '', req: { grade: spec.g || 0, party: spec.party || 0 } }));
    L.push(C('S’abstenir', hub, { cls: 'back' }));
    show({ kicker: `${f.name} · conseil`, title: tp.t, text: [tp.d(f)], choices: L });
  };
})();
