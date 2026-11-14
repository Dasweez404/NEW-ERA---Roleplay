// ───────── Capture, évasion, gladiateurs, Fallen ─────────
function prisonFor(stars) { return stars >= 4 ? 'swahilis' : G.loc; }
function capturedScene(text) {
  const pc = G.pc; const st = wantedStars(); const by = pc.faction === 'fa' ? 'fa' : 'fa';
  pc.hp = Math.max(1, Math.round(pc.hpMax * 0.4));
  pc.flags.cap = { wk: G.wk, stars: st, deadline: G.wk + (st >= 4 ? 12 : st >= 3 ? 16 : 20), tartare: st >= 4 };
  pc.stash = { inv: pc.inv, eq: pc.eq }; pc.inv = { kit: 0 }; delete pc.inv.kit; pc.eq = { arme: null, armure: null };
  splash({ title: 'CAPTURÉ', sub: pc.flags.cap.tartare ? 'Direction le Tartare' : 'Derrière les barreaux', icon: '⛓', color: '#ff3d7f' }); shake('shake-big'); G.loc = prisonFor(st); logEntry(`Capturé${pc.gender === 'F' ? 'e' : ''} par la Force d’Autorité.`); newsPush(`${pc.name} a été capturé${pc.gender === 'F' ? 'e' : ''} (prime ${st ? starStr(st) : 'aucune'}).`);
  show({ kicker: 'CAPTURÉ', title: pc.flags.cap.tartare ? 'Le Tartare' : 'Cellule', text: [text || 'On te passe les menottes.', st >= 4 ? 'Tu es un multirécidiviste, « représentant » de ta faction, recherché sur tout le globe : direction le <b>Tartare</b>, la plus grande prison du monde, sous la garde de Gaia, Erebe, Nyx et Eros.' : st >= 3 ? 'Prison continentale. Ils ne comptent pas te relâcher de sitôt.' : st >= 2 ? 'Prison d’État. Quelques mois derrière les barreaux t’attendent.' : 'Garde à vue. Pour des infractions mineures, tu n’en as pas pour longtemps.', 'Ton équipement est confisqué. Les captifs vivants peuvent être interrogés, emprisonnés, torturés, exécutés ou vendus selon leur mise à prix.'], choices: [C('Continuer', hub)] });
}
function capturedMenu() {
  const pc = G.pc; const cap = pc.flags.cap; if (!cap) return hub(); const st = cap.stars; const left = Math.max(0, cap.deadline - G.wk); const L = [];
  const freeAllies = pc.party.filter(a => a.inj <= 0).length;
  L.push(C('Tenter de t’évader', escapeMenu, { sub: 'Plusieurs approches. En cas d’échec : blessures et surveillance accrue.' }));
  if (st <= 1) L.push(C(`Payer l’amende (${200 + st * 300} ¢)`, () => { pc.money -= 200 + st * 300; release('Tu paies l’amende et on te rend tes affaires.'); }, { req: { money: 200 + st * 300 } }));
  L.push(C('Acheter ta liberté au Marché Noir', () => { const price = 900 * (st + 1); pc.money -= price; release('Un gardien « perd » ton dossier. Le Marché Noir encaisse.', { noir: 6 }); }, { req: { money: 900 * (st + 1), rep: { noir: 10 } }, sub: `${900 * (st + 1)} ¢ — il faut un contact (10 de réputation)` }));
  L.push(C('Combattre dans l’ARENA', () => arenaTournament(3, true), { sub: 'Trois combats à mort. Victoire : liberté et fortune. Défaite : tu es mort ou presque.', cls: 'danger', req: { ok: () => cap.tartare ? null : null } }));
  L.push(C('Rejoindre les Fallen (implant explosif)', becomeFallenScene, { cls: 'danger', sub: 'Chasseur de primes sous peine d’explosion. Ton ancienne faction ne te le pardonnera pas.', req: { ok: () => st < 1 ? 'Les Fallen ne recrutent que des recherchés (prime ⭐ ou plus)' : null } }));
  L.push(C('Coopérer à l’interrogatoire', () => { const L2 = fx({ rep: { [pc.faction]: -25 }, spill: true }); cap.deadline += 8; release('Tu parles. Ils te relâchent, mais ta faction apprendra ce que tu as dit.', null, L2, true); }, { cls: 'danger', sub: 'Trahison : ta faction et ses alliés s’en souviendront.', req: { ok: () => st >= 3 ? 'Trop recherché : ils ne te relâcheront pas' : null } }));
  L.push(C('Attendre un sauvetage de tes alliés (1 mois)', () => { advance(4); if (G.status !== 'play') return; if (!pc.flags.cap) return; const rescuers = pc.party.filter(a => a.inj <= 0); const base = 0.15 + (pc.rep[pc.faction] || 0) / 250 + (rescuers.length * 0.12) + (pc.grade >= 3 ? 0.1 : 0); if (chance(base)) { const name = rescuers.length ? CH[rescuers[0].id].name : leaderName(pc.faction); release(`${esc(name)} et ses amis font sauter la porte de ta cellule en pleine nuit.`, { [pc.faction]: 4 }); } else show({ kicker: 'Captivité', title: 'Personne n’est venu', text: ['Les jours passent dans le silence.', `Il te reste ${Math.max(0, cap.deadline - G.wk)} semaine(s) avant le verdict.`], choices: [C('Continuer', hub)] }); }, { sub: `Chances : ~${Math.round((0.15 + (pc.rep[pc.faction] || 0) / 250 + freeAllies * 0.12 + (pc.grade >= 3 ? 0.1 : 0)) * 100)} %` }));
  show({ kicker: 'CAPTIF', title: cap.tartare ? 'Le Tartare' : 'En cellule', text: [`Prime à l’arrestation : ${st ? starStr(st) : 'aucune'}. Verdict dans <b>${left} semaine(s)</b>${st >= 4 ? ' — <span class="badc">exécution</span>' : st >= 3 ? ' — vente au Marché Noir ou aux Fallen' : ' — libération'}.`, 'Que fais-tu ?'], choices: L });
}
function captiveMonth() {
  const pc = G.pc; const cap = pc.flags.cap; if (!cap) return;
  if (G.wk >= cap.deadline) {
    if (cap.stars >= 4) { if (chance(0.45) && (pc.party.length || pc.rep[pc.faction] > 30)) { return release('La veille de ton exécution, un commando de ta faction prend d’assaut le Tartare.', { [pc.faction]: 10 }); } return endGame('dead', 'Exécuté au Tartare.'); }
    if (cap.stars >= 3) { pc.flags.cap = null; return queueFallenForced(); }
    return release('Tu as purgé ta peine.', null);
  }
}
function release(text, repFx, extra, interrogated) {
  const pc = G.pc; const L = extra || []; pc.flags.cap = null; if (pc.stash) { pc.inv = pc.stash.inv; pc.eq = pc.stash.eq; pc.stash = null; }
  pc.hp = Math.max(pc.hp, Math.round(pc.hpMax * 0.5)); pc.en = pc.enMax; if (!interrogated) addHeat(-10, L);
  if (repFx) L.push(...fx({ rep: repFx }));
  G.loc = G.loc === 'swahilis' && wantedStars() >= 4 ? 'swahilis' : G.loc; recalc(); logEntry('Libéré.'); G.board = null;
  splash({ title: 'LIBRE', icon: '🗝', color: '#35f0a0' }); show({ kicker: 'LIBÉRÉ', title: 'Tu es libre', text: [text], fx: L, choices: [C('Continuer', hub)] });
}
function escapeMenu() {
  const pc = G.pc; const cap = pc.flags.cap; if (!cap) return hub(); const tier = clamp(cap.stars + 1, 1, 5); const dc = dcOf(tier); const L = [];
  const tryEsc = (k, a, tags, okT, koT) => () => { const r = check(a, dc + (cap.tartare ? 2 : 0), tags); advance(1); if (G.status !== 'play') return; if (!pc.flags.cap) return; if (r.ok) { addHeat(6); const L2 = fx({ xp: 40 + tier * 10 }); release(okT, null, L2); } else { const L2 = fx({ hp: -rint(4, 10), heat: 2 }); cap.deadline -= 2; show({ kicker: 'Évasion ratée', title: 'Rattrapé', text: [koT, checkLine(r), 'Ton verdict approche plus vite : −2 semaines.'], fx: L2, choices: [C('Continuer', hub)] }); } };
  L.push(C('Briser les barreaux et te battre', tryEsc('force', 'corps', ['combat'], 'Tu enfonces la porte et fonces à travers les couloirs. Dehors !', 'Les gardes te maîtrisent.'), { odds: ['corps', dc, ['combat']], cls: 'danger' }));
  L.push(C('Te faufiler par les conduits', tryEsc('furtif', 'agilite', ['stealth', 'mobility'], 'Les conduits t’emportent loin du bloc.', 'Un conduit t’a trahi : cul-de-sac.'), { odds: ['agilite', dc, ['stealth', 'mobility']] }));
  L.push(C('Pirater les serrures et les caméras', tryEsc('hack', 'intellect', ['hack'], 'Les portes s’ouvrent en cascade. Tu es dehors avant que les caméras redémarrent.', 'La prison se verrouille.'), { odds: ['intellect', dc, ['hack']], req: { cap: 'hack' } }));
  L.push(C('Utiliser ton pouvoir', tryEsc('pouvoir', 'maitrise', ['stealth', 'mobility', 'control', 'combat'], 'Ton pouvoir te libère.', 'L’ogénite de la prison étouffe ton pouvoir.'), { odds: ['maitrise', dc, ['stealth', 'mobility', 'control', 'combat']], req: { power: true } }));
  L.push(C('Se faire passer pour un transfert officiel', tryEsc('ruse', 'charisme', ['social', 'disguise'], 'Un bon baratin et de faux papiers : on t’escorte jusqu’à la sortie.', 'Le directeur rit : « Joli, mais non. »'), { odds: ['charisme', dc, ['social', 'disguise']] }));
  L.push(C('← Retour', actionsMenu)); show({ kicker: 'ÉVASION', title: 'Comment t’évader ?', text: [`La prison est plus ou moins solide : difficulté ${stars(tier)}${cap.tartare ? ' (+2 pour le Tartare)' : ''}.`], choices: L });
}
function becomeFallenScene() {
  show({ kicker: 'Les Fallen', title: 'Un marché cruel', text: ['Un homme en gris te propose un deal : « Une brigade de chasseurs de primes. On te pose un implant explosif dans la nuque : tu livres des primes, tu vis. Tu t’arrêtes, ça saute. »', 'Tu seras libéré, mais ta faction et tes alliés ne te le pardonneront pas. Tu pourras plus tard faire retirer l’implant (chirurgie, Siha Mujahaz, ingénieur…).'], choices: [C('Accepter l’implant', () => becomeFallen(), { cls: 'danger' }), C('Refuser', capturedMenu)] });
}
function becomeFallen(forced) {
  const pc = G.pc; const old = pc.faction; const L = []; pc.flags.cap = null; if (pc.stash) { pc.inv = pc.stash.inv; pc.eq = pc.stash.eq; pc.stash = null; }
  L.push(...fx({ rep: { [old]: -30 }, spill: true })); pc.faction = 'fallen'; pc.merit = 0; pc.grade = Math.max(0, Math.min(pc.grade, 2)); pc.heat = 0; pc.implant = { deadline: G.wk + 12 }; pc.rep.fallen = 30; pc.rep.fa = 5;
  splash({ title: 'FALLEN', sub: 'Implant explosif posé', icon: '💥', color: '#ff3d7f' }); recalc(); pc.hp = pc.hpMax; logEntry('Tu es devenu Fallen : implant explosif posé.'); G.board = null;
  show({ kicker: 'FALLEN', title: 'L’implant', text: ['L’aiguille s’enfonce dans ta nuque. Une petite lumière clignote : douze semaines pour livrer une prime.', 'Dans le menu « Missions », ton contrat de chasseur apparaît en rouge. Tu peux aussi chercher à faire retirer l’implant (menu « Ta faction »).'], fx: L, choices: [C('Continuer', hub)] });
}
function queueFallenForced() { show({ kicker: 'VENTE', title: 'Vendu', text: ['On ne te garde pas : on te vend. Le Marché Noir te propose l’implant plutôt que la mine.'], choices: [C('Accepter l’implant', () => becomeFallen(true)), C('Refuser', () => endGame('dead', 'Mort dans les mines du Marché Noir.'), { cls: 'danger' })] }); }
EVENT_FN.implant = function () {
  const pc = G.pc; if (!pc.implant) return hub(); const left = pc.implant.deadline - G.wk;
  show({ kicker: 'IMPLANT', title: 'Le compte à rebours', text: [`La petite lumière dans ta nuque passe au rouge. Il te reste <b>${Math.max(0, left)} semaine(s)</b>.`, 'Livre une prime, ou fais retirer l’implant.'], choices: [C('Chercher un contrat de chasseur', () => { fallenContract(); }), C('Faire retirer l’implant', removeImplantMenu), C('Continuer', hub)] });
};
function fallenContract() {
  const pc = G.pc; const o = genOffer('fallen', clamp(pc.grade + 1, 1, 4), { arch: 'prime', tgt: pick(Object.keys(F).filter(f => isAnti(f) && f !== 'fa')) }); o.fallen = true; o.empName = 'les Fallen'; o.pay = Math.round(o.pay * 1.2); missionBrief(o);
}
function removeImplantMenu() {
  const pc = G.pc; const L = [];
  L.push(C('Les Siha Mujahaz : opération clandestine (800 ¢)', () => { pc.money -= 800; advance(2); if (G.status !== 'play') return; const r = check('intellect', 16, ['heal']); implantRes(r, 'Le chirurgien désamorce la charge et retire l’implant, les mains parfaitement stables.'); }, { req: { money: 800, rep: { siha: 15 } } }));
  L.push(C('Le faire retirer par un ingénieur de ton groupe', () => { const eng = pc.party.find(a => ['engineer', 'assist'].includes(a.style)); const r = check('intellect', 18, ['tech']); advance(1); implantRes(r, `${eng ? esc(CH[eng.id].name) : 'Ton talent d’ingénieur'} gagne la partie, le tournevis tremblant.`); }, { odds: ['intellect', 18, ['tech']], req: { ok: () => (hasRole('ingenieur') || pc.party.some(a => a.style === 'engineer')) ? null : 'Requiert le rôle Ingénieur ou un allié Engineer' } }));
  L.push(C('Demander au Gamma Lab (en échange d’un « test »)', () => { advance(3); if (G.status !== 'play') return; const L2 = fx({ rep: { gamma: 10 }, hp: -10 }); pc.implant = null; show({ kicker: 'Gamma Lab', title: 'Implant retiré', text: ['Les scientifiques l’ont retiré… et en ont profité pour tester deux ou trois choses sur toi.'], fx: L2, choices: [C('Continuer', hub)] }); }, { req: { rep: { gamma: 5 } } }));
  L.push(C('← Retour', actionsMenu)); show({ kicker: 'IMPLANT', title: 'Se faire retirer l’implant', text: ['Une erreur et la charge saute. Il faut quelqu’un de très bon.'], choices: L });
}
function implantRes(r, okT) {
  const pc = G.pc;
  if (r.ok) { pc.implant = null; logEntry('Implant retiré.'); return show({ kicker: 'IMPLANT', title: 'Libre', text: [okT, checkLine(r), 'Tu n’es plus Fallen que de nom : tu peux quitter la brigade (menu Ta faction).'], fx: fx({ xp: 60 }), choices: [C('Continuer', hub)] }); }
  if (r.fumble) return endGame('dead', 'L’implant a explosé pendant l’opération.');
  show({ kicker: 'IMPLANT', title: 'Raté', text: ['L’opération échoue de justesse. L’implant est toujours là.', checkLine(r)], fx: fx({ hp: -8 }), choices: [C('Continuer', hub)] });
}
function implantBlast() {
  const pc = G.pc; pc.implant = null; if (chance(0.3)) { const L = fx({ hp: -pc.hpMax + 1 }); pc.attrs.corps = Math.max(1, pc.attrs.corps - 2); newsPush(`Un Fallen a explosé.`); return queue('maimed'); }
  endGame('dead', 'L’implant a explosé : tu n’as pas livré ta prime à temps.');
}
EVENT_FN.maimed = function () { show({ kicker: 'IMPLANT', title: 'L’explosion', text: ['La charge ne tue pas : un défaut de fabrication te sauve la vie. Tu y laisses la moitié de ta nuque et deux points de Force.'], choices: [C('Continuer', hub)] }); };

// ───────── ARENA : tournoi de gladiateurs ─────────
function arenaTournament(rounds, forced) {
  const pc = G.pc; const tier = clamp(pc.grade + 1, 1, 5); let won = 0;
  const next = (i) => {
    if (i > rounds) { const prize = rounds * 300 * tier + 500; const L = fx({ money: prize, xp: 60 * rounds, rep: { arena: 6 }, heat: forced ? -10 : 2 }); if (forced) { return release(`Tu as survécu aux trois combats. L’ARENA te rend ta liberté et la foule t’acclame (prise ${prize} ¢).`, null, L); } return show({ kicker: 'ARENA', title: 'Champion !', text: [`Tu as battu ${rounds} adversaire(s). La foule scande ton nom.`], fx: L, choices: [C('Continuer', hub)] }); }
    const foes = [mkFoe('gladiateur', tier + (i === rounds && rounds > 1 ? 1 : 0), 'Gladiateur ' + pick(['Mastodonte', 'Spectre', 'Faucheuse', 'Typhon', 'Écume', 'Dynamo', 'Basalte']))];
    startCombat({ title: `ARENA — combat ${i}/${rounds}`, foes, lethal: 'death', canFlee: false, intro: 'Les portes de l’arène s’ouvrent. Des milliards de spectateurs retiennent leur souffle.', onWin: L => { won++; if (i < rounds) show({ kicker: 'ARENA', title: 'Un de moins', text: ['Tu reprends ton souffle. Le prochain gladiateur entre.'], fx: L, choices: [C('Continuer', () => next(i + 1))] }); else next(i + 1); }, onLose: () => { if (chance(0.4)) { pc.hp = 1; const lost = Math.round(pc.money * 0.5); pc.money -= lost; advance(3); return show({ kicker: 'ARENA', title: 'Épargné par la foule', text: ['Le pouce de la foule se lève. Tu es épargné, brisé, et on te prend la moitié de ta bourse.'], choices: [C('Continuer', () => { if (forced && pc.flags.cap) capturedMenu(); else hub(); })] }); } const d = pcDie('Tué dans l’ARENA.'); if (d) show({ title: 'Sauvé', text: [`${esc(d.rescued)} saute dans l’arène et t’arrache à la mort.`], choices: [C('Continuer', hub)] }); } });
  };
  if (!forced) return show({ kicker: 'ARENA', title: `Tournoi : ${rounds} combat(s)`, text: ['L’ARENA paie bien, mais on y meurt. Les adversaires sont des gladiateurs, souvent des Fallen ou des soldats d’élite.', `<b>Adversaires de niveau ${'★'.repeat(tier)}</b> (ton grade : ${pc.grade}). Une défaite est <b>mortelle</b> la plupart du temps ; sans allié pour te sauver, la foule ne pardonne guère. Gains estimés : ${rounds * 300 * tier + 500} ¢.`], choices: [C('Entrer dans l’arène', () => next(1), { cls: 'danger' }), C('Renoncer', hub)] });
  next(1);
}
