// ───────── Missions : générateur d'archétypes + résolution par approches ─────────
const APPROACH = {
  force: { l: 'Passer en force', a: 'corps', t: ['combat'], fail: 'fight', cls: 'danger' },
  furtif: { l: 'Se faufiler', a: 'agilite', t: ['stealth', 'mobility'], fail: 'fight' },
  ruse: { l: 'Ruser et baratiner', a: 'charisme', t: ['social', 'disguise'], fail: 'chase' },
  hack: { l: 'Pirater les systèmes', a: 'intellect', t: ['hack'], fail: 'fight', req: { cap: 'hack' } },
  tech: { l: 'Bricoler, saboter, construire', a: 'intellect', t: ['tech'], fail: 'loss' },
  pouvoir: { l: 'Utiliser ton pouvoir', a: 'maitrise', t: null, fail: 'fight', req: { power: true } },
  soin: { l: 'Soigner et stabiliser', a: 'intellect', t: ['heal'], fail: 'loss', req: { cap: 'heal' } },
  repere: { l: 'Repérer, enquêter, pister', a: 'intellect', t: ['scout'], fail: 'chase' },
  garde: { l: 'Tenir la position', a: 'corps', t: ['defense'], fail: 'fight' },
  strat: { l: 'Élaborer un plan', a: 'intellect', t: ['strat'], fail: 'loss', req: { ok: () => (hasRole('strategiste') || A('intellect') >= 7) ? null : 'Requiert le rôle Stratégiste ou Intellect 7' } },
  leader: { l: 'Galvaniser ton équipe', a: 'charisme', t: ['social', 'ally'], fail: 'loss', req: { party: 1 } },
  logi: { l: 'Organiser la logistique', a: 'intellect', t: ['logi'], fail: 'loss', req: { role: 'logisticien' } },
  argent: { l: 'Payer et graisser les pattes', a: 'charisme', t: ['social'], fail: 'chase', money: true },
};
const ARCH = {
  infiltration: { n: 'Infiltration', heat: 3, ptags: ['stealth', 'mobility', 'control'], intro: '{emp} t’envoie t’introduire dans un site de {tgt} à {place} pour en rapporter un dossier. Caméras, droïdes de ronde, radar à géno : la routine.',
    ap: { furtif: ['Te glisser entre les rondes', 'Tu longes les angles morts : le dossier est à toi.', 'Un droïde tourne la tête vers toi. L’alarme retentit.'], hack: ['Pirater caméras et serrures', 'Tu retournes le réseau contre lui-même ; les portes s’ouvrent une à une.', 'Un pare-feu t’éjecte en rétorsion et déclenche l’alerte.'], ruse: ['Te faire passer pour un employé', 'Un faux badge, un sourire, et tu traverses les couloirs.', 'Un garde te demande ton matricule. Tu n’en as pas.'], pouvoir: ['Faire parler ton pouvoir', 'Ton pouvoir fait le travail en silence.', 'Ton pouvoir s’emballe et déclenche les capteurs d’ogénite.'], force: ['Défoncer la porte', 'Tu écrases toute résistance et repars avec le dossier.', 'La riposte est plus lourde que prévu.'] } },
  escorte: { n: 'Escorte', heat: 1, ptags: ['defense', 'mobility', 'control'], intro: '{emp} a besoin que tu escortes un convoi sensible à travers la région de {place}. {tgt} rôde sur la route.',
    ap: { garde: ['Tenir la ligne devant le convoi', 'Rien ne passe : le convoi arrive intact.', 'La ligne cède, des caisses sont perdues.'], repere: ['Éclairer la route', 'Tu évites deux barrages et une embuscade.', 'Tu rates un barrage : tout le monde est repéré.'], furtif: ['Prendre les chemins de traverse', 'Le convoi file sans un bruit.', 'Un chemin se révèle impraticable : demi-tour sous les tirs.'], ruse: ['Négocier le passage aux barrages', 'Quelques mots, quelques sourires : les barrières se lèvent.', 'Le chef de poste n’est pas dupe.'], force: ['Briser l’embuscade', 'Tu balaies l’embuscade avant qu’elle ne se referme.', 'L’embuscade est mieux préparée que toi.'], logi: ['Optimiser l’itinéraire et les relais', 'Chaque relais tombe pile : arrivée en avance.', 'Un maillon manque : retard et pertes.'] } },
  sabotage: { n: 'Sabotage', heat: 4, ptags: ['combat', 'control', 'tech'], intro: '{emp} veut que tu mettes hors service une installation de {tgt} à {place}. Le plus discrètement possible — ou le plus bruyamment, selon le message à faire passer.',
    ap: { tech: ['Piéger les circuits d’alimentation', 'Une étincelle, un grondement : l’installation est HS.', 'Ta charge ne prend pas et les alarmes s’affolent.'], hack: ['Corrompre le logiciel de contrôle', 'Tu déclenches une panne en cascade.', 'Le système te repère et se verrouille.'], furtif: ['Poser les charges sans te faire voir', 'Tu quittes les lieux avant que ça saute.', 'Une patrouille tombe sur toi en pleine pose.'], pouvoir: ['Détruire avec ton pouvoir', 'Ton pouvoir fait voler la salle des machines en éclats.', 'Tu ne contrôles plus la puissance : des gardes accourent.'], force: ['Tout casser, ouvertement', 'Tu rases tout sur ton passage.', 'La défense est trop dense : tu dois battre en retraite.'] } },
  liberation: { n: 'Libération', heat: 4, ptags: ['control', 'mobility', 'combat'], intro: '{emp} a appris que des géno-porteurs sont retenus par {tgt} à {place}. Il faut les sortir de là avant le transfert.',
    ap: { force: ['Assaut frontal', 'Les portes cèdent. Les captifs courent derrière toi.', 'L’assaut se brise sur une défense en profondeur.'], furtif: ['Entrer par les conduits', 'Tu ouvres les cellules sans réveiller personne.', 'Une cellule grince. Les gardes accourent.'], ruse: ['Te faire passer pour un transfert officiel', 'Les papiers passent : « Transfert validé. »', 'Le faux est détecté au dernier moment.'], hack: ['Ouvrir les cellules à distance', 'Toutes les serrures tombent d’un coup.', 'Le système réagit en verrouillant tout le bloc.'], pouvoir: ['Faire sauter les murs avec ton pouvoir', 'Ton pouvoir ouvre une brèche dans le mur.', 'Ton pouvoir blesse des captifs : tout dérape.'], leader: ['Coordonner une évasion avec les captifs', 'Les captifs suivent tes ordres comme une armée.', 'La panique éclate dans les rangs.'] } },
  fouille: { n: 'Fouille archéologique', heat: 1, ptags: ['scout', 'control', 'mobility'], intro: '{emp} a repéré des ruines anciennes près de {place}. On parle de « pierres muta », de glyphes, peut-être d’un temple. {tgt} fouille la région aussi.',
    ap: { repere: ['Cartographier les indices', 'Tu lis les glyphes comme un livre ouvert : la salle est là.', 'Fausse piste : tu perds des jours dans les galeries.'], tech: ['Désamorcer les mécanismes', 'Les mécanismes anciens cèdent sous tes outils.', 'Un piège se déclenche.'], pouvoir: ['Sentir ou forcer le passage avec ton pouvoir', 'Ton pouvoir t’ouvre un passage.', 'Le pouvoir réveille les gardiens de pierre.'], garde: ['Tenir bon face à l’environnement', 'Tu résistes aux éboulements et aux dérèglements climatiques.', 'Le sol cède : tu es blessé.'], soin: ['Prendre soin de l’équipe de fouille', 'Personne ne tombe malade : la fouille avance.', 'Une intoxication ralentit tout le monde.'] } },
  prime: { n: 'Chasse à la prime', heat: 1, ptags: ['combat', 'control', 'scout'], intro: '{emp} met à prix un membre de {tgt}, recherché dans la région de {place}. Capturé vivant, de préférence.', hasTarget: true,
    ap: { repere: ['Pister ta cible', 'Tu connais sa routine : tu l’attends au bon endroit.', 'Ta cible a flairé le piège.'], tech: ['Lui tendre un piège technique', 'Le piège se referme. Il est à toi.', 'Il brise le piège et s’échappe.'], force: ['L’affronter directement', 'Un bon vieux duel : il tombe.', 'Il est plus fort que sa fiche ne le disait.'], ruse: ['Utiliser un appât', 'Il mord à l’hameçon et se retrouve piégé.', 'L’appât est démasqué.'], pouvoir: ['Le neutraliser avec ton pouvoir', 'Ton pouvoir l’immobilise sans casse.', 'Ton pouvoir se retourne contre toi.'], argent: ['Acheter l’indic qui connaît sa planque', 'L’indic parle, la cible est cueillie au lit.', 'L’indic te vend à sa cible.'] } },
  humanitaire: { n: 'Mission humanitaire', heat: 0, ptags: ['heal', 'control', 'defense'], intro: 'À {place}, des quartiers entiers manquent de tout. {emp} t’y envoie apporter soins, nourriture et abris — sans te soucier de l’origine de personne. {tgt} ne verrait pas ça d’un bon œil.', money: 0.4,
    ap: { soin: ['Soigner les blessés et les malades', 'Des dizaines de patients te remercient. Certains pleurent.', 'Le stock s’épuise avant la fin. Il faudra faire des choix terribles.'], logi: ['Organiser la distribution', 'Les rations arrivent à temps, sans émeute.', 'La distribution tourne à l’émeute.'], tech: ['Construire des abris', 'Des toits, des murs, des lits : un quartier renaît.', 'La structure s’effondre à moitié.'], garde: ['Protéger le camp contre les pillards', 'Le camp tient et dort tranquille.', 'Des pillards s’engouffrent dans une faille.'], leader: ['Mobiliser les habitants', 'Les habitants se prennent en main : l’aide devient autonome.', 'Les discours ne mordent pas.'], pouvoir: ['Mettre ton pouvoir au service du camp', 'Ton pouvoir fait des miracles pour des gens qui n’y croyaient plus.', 'Ton pouvoir effraie les habitants.'] } },
  enquete: { n: 'Enquête', heat: 1, ptags: ['scout', 'control', 'stealth'], intro: '{emp} soupçonne {tgt} d’un projet lié à {place}. Il faut des preuves, des noms, des dates.',
    ap: { repere: ['Filer et recouper', 'Les pièces s’emboîtent : tu tiens quelque chose de gros.', 'Tu te fais repérer à ton tour.'], ruse: ['Interroger sous couverture', 'Quelques verres et quelques mensonges, et on te raconte tout.', 'Ton interlocuteur te soupçonne : il se tait.'], hack: ['Fouiller les serveurs', 'Tu pilles un serveur de données à ciel ouvert.', 'Une trace de ton intrusion remonte jusqu’à toi.'], argent: ['Acheter des informateurs', 'Les informateurs coûtent cher, mais parlent.', 'On te vend de fausses informations.'], furtif: ['Fouiller un bureau de nuit', 'Les tiroirs livrent leurs secrets.', 'Un gardien en insomnie t’attend.'], pouvoir: ['Faire parler ton pouvoir', 'Ton pouvoir ouvre des portes que personne n’avait vues.', 'Ton pouvoir te trahit en public.'] } },
  course: { n: 'Course & pilotage', heat: 2, ptags: ['mobility', 'tech', 'control'], intro: 'À {place}, {emp} organise une course clandestine (ou un convoyage urgent) à travers les rues et les toits. {tgt} veut la gagner par tous les moyens.',
    ap: { furtif: ['Prendre tous les risques en virage', 'Tu coupes à travers tout. Premier sur la ligne.', 'Un virage de trop : tu finis dans un mur.'], tech: ['Tuner ton engin à la dernière minute', 'Ta bécane vole. Personne ne te rattrape.', 'Le moteur lâche en pleine ligne droite.'], pouvoir: ['Utiliser ton pouvoir en piste', 'Ton pouvoir te donne l’avantage décisif.', 'Disqualification : trucage détecté.'], ruse: ['Jouer les rivaux les uns contre les autres', 'Ils s’éliminent entre eux : la voie est libre.', 'Ils s’allient contre toi.'], force: ['Pousser les rivaux hors piste', 'Tu fais le ménage. La course est à toi.', 'Ils te renvoient la politesse, en pire.'] } },
  propagande: { n: 'Contre-spectacle', heat: 2, ptags: ['social', 'control', 'stealth'], intro: '{emp} veut reprendre la parole à {place} : détourner un écran géant, saboter une campagne de {tgt}, ou monter un spectacle qui dérange.',
    ap: { ruse: ['Monter sur scène et parler au public', 'La foule est à toi. Ta parole se diffuse.', 'La foule te hue. Les caméras de surveillance font le reste.'], hack: ['Détourner la diffusion', 'Les écrans géants passent ton message dans toute la ville.', 'On coupe ton flux et on remonte ta trace.'], pouvoir: ['Faire un spectacle de ton pouvoir', 'Ton pouvoir éblouit : on ne parle que de ça.', 'Ton pouvoir blesse un spectateur : fiasco médiatique.'], tech: ['Installer un relais pirate', 'Le relais pirate arrose tout le quartier.', 'Le relais grille en direct.'], leader: ['Mobiliser les artistes', 'Les artistes envahissent la place.', 'Personne ne suit.'] } },
  defense: { n: 'Défense de territoire', heat: 2, ptags: ['defense', 'combat', 'control'], intro: '{tgt} lance une offensive sur {place}. {emp} t’a placé en première ligne pour tenir le quartier.',
    ap: { garde: ['Tenir les barricades', 'Les assaillants s’épuisent sur ta ligne.', 'Ta ligne plie sous le choc.'], strat: ['Organiser le terrain et les relèves', 'Un plan limpide : ils tombent dans tous tes pièges.', 'Le plan se grippe au premier contact.'], tech: ['Fortifier avec ce que tu trouves', 'Barricades, pièges, générateurs : le quartier est un fort.', 'Le bricolage cède.'], leader: ['Rallier les habitants', 'Les habitants prennent les armes avec toi.', 'Ils s’enfuient.'], force: ['Contre-attaquer', 'Ta contre-attaque brise leur élan.', 'La contre-attaque tourne au désastre.'], pouvoir: ['Dresser un mur de pouvoir', 'Ton pouvoir verrouille la rue.', 'Ton pouvoir s’épuise au pire moment.'] } },
  contrebande: { n: 'Livraison clandestine', heat: 2, ptags: ['stealth', 'mobility', 'control'], intro: 'Le Marché Noir (via {emp}) veut qu’un colis passe à {place} sans que {tgt} ni la F.A. n’y mettent le nez.',
    ap: { furtif: ['Passer par les failles du réseau', 'Le colis arrive sans un contrôle.', 'Un contrôle surprise t’arrête.'], ruse: ['Falsifier les papiers du colis', 'Les papiers sont parfaits.', 'Le faux ne trompe pas un douanier consciencieux.'], argent: ['Payer les bonnes personnes', 'Un billet par-ci, un regard détourné par-là.', 'Le douanier prend l’argent… et appelle la F.A.'], hack: ['Truquer les manifestes', 'Le manifeste ne mentionne rien.', 'Tu laisses une trace dans le registre.'], force: ['Forcer le passage', 'Tu passes en trombe.', 'Le barrage ne se laisse pas forcer.'] } },
  climat: { n: 'Crise climatique', heat: 0, ptags: ['control', 'defense', 'heal', 'mobility'], intro: 'L’ogénite sur-stimulée dérègle encore la planète : à {place}, c’est {clim}. {emp} t’envoie sauver ce qui peut l’être.', money: 0.6,
    ap: { soin: ['Évacuer et soigner les blessés', 'Tu sauves tous ceux que tu peux atteindre.', 'Tu arrives trop tard pour certains.'], tech: ['Dresser des digues et des abris', 'Ton installation tient bon.', 'Tout cède d’un coup.'], pouvoir: ['Contrer le phénomène avec ton pouvoir', 'Ton pouvoir contient le phénomène.', 'Le phénomène dévore ton pouvoir.'], garde: ['Former un cordon de sécurité', 'Personne ne panique grâce à toi.', 'La foule déborde ton cordon.'], repere: ['Anticiper le prochain « trou »', 'Tu prédis le prochain « trou » à la minute près.', 'Tu te trompes de zone.'] } },
  ordre: { n: 'Maintien de l’ordre', heat: 0, ptags: ['combat', 'control', 'scout'], intro: 'À {place}, un porteur de {tgt} a été signalé par le radar à géno. Ordre de {emp} : l’appréhender sans bavure — ou presque.', hasTarget: true,
    ap: { repere: ['Localiser la cible au radar', 'Le radar la trouve en trois minutes.', 'Le radar sature : la cible disparaît.'], force: ['Donner l’assaut', 'Un assaut classique : la cible est à terre.', 'La cible se bat comme un diable.'], ruse: ['Négocier la reddition', 'Elle baisse les armes.', 'Elle ne croit pas aux promesses de la F.A.'], hack: ['Désactiver ses défenses', 'Tu désarmes tout à distance.', 'Les défenses se retournent contre toi.'], pouvoir: ['Neutraliser avec ton pouvoir', 'Ton pouvoir règle l’affaire proprement.', 'Ton pouvoir blesse un passant : la presse l’apprendra.'] } },
};
const CLIM = () => pick(CLIMATE);
function ctxText(s, o) { return s.replace('{emp}', esc(o.empName)).replace('{tgt}', esc(o.tgtName)).replace('{place}', esc(capName(o.place))).replace('{clim}', esc(o.clim || CLIM())); }
const FACTION_POOL = {
  uplift: ['sabotage', 'liberation', 'defense', 'propagande', 'infiltration'], arena: ['prime', 'contrebande', 'escorte'], clairobscur: ['propagande', 'infiltration', 'sabotage'], galleon: ['contrebande', 'fouille', 'course', 'sabotage'],
  bruteforce: ['infiltration', 'enquete', 'propagande', 'sabotage'], nebula: ['fouille', 'course', 'enquete', 'climat'], check: ['prime', 'escorte', 'infiltration', 'contrebande'], hem: ['humanitaire', 'defense', 'climat', 'escorte'],
  artefactors: ['fouille', 'enquete', 'escorte', 'infiltration'], cockpits: ['course', 'escorte', 'sabotage', 'liberation'], umami: ['humanitaire', 'climat', 'escorte'], slummer: ['contrebande', 'defense', 'sabotage', 'prime'],
  ecobase: ['climat', 'humanitaire', 'defense', 'fouille'], necropunks: ['sabotage', 'liberation', 'defense', 'propagande'], optimum: ['prime', 'infiltration', 'sabotage', 'escorte'], rapinas: ['infiltration', 'contrebande', 'course', 'enquete'],
  ragnaroks: ['fouille', 'prime', 'defense'], paddocks: ['course', 'escorte', 'contrebande', 'sabotage'], saibogu: ['sabotage', 'infiltration', 'enquete', 'prime'], incognito: ['propagande', 'infiltration', 'enquete', 'humanitaire'],
  oudatchi: ['infiltration', 'enquete', 'sabotage', 'escorte'], excels: ['escorte', 'humanitaire', 'course', 'defense'], vigilante: ['liberation', 'escorte', 'defense', 'humanitaire', 'enquete'], siha: ['humanitaire', 'climat', 'escorte', 'liberation'],
  natives: ['escorte', 'climat', 'defense', 'fouille'], committed: ['propagande', 'contrebande', 'fouille', 'prime'], omega: ['ordre', 'prime', 'infiltration', 'defense'], sanctuaire: ['defense', 'escorte', 'fouille', 'humanitaire'],
  ringan: ['escorte', 'enquete', 'defense', 'humanitaire'], manacorp: ['propagande', 'contrebande', 'infiltration', 'prime'], gamma: ['enquete', 'sabotage', 'fouille', 'infiltration'], fa: ['ordre', 'prime', 'escorte', 'defense', 'enquete'],
  fallen: ['prime', 'ordre', 'prime'], civils: ['humanitaire', 'escorte', 'contrebande', 'enquete', 'course'], noir: ['contrebande', 'prime', 'escorte', 'infiltration'],
};
function leaderName(fid) { const l = G.world.leader[fid]; if (l === 'pc') return G.pc.name; return l && CH[l] ? CH[l].name : F[fid].name; }
function pickTarget(emp, arch) {
  if (emp === 'fa') { const pool = Object.keys(F).filter(f => isAnti(f) && f !== G.pc.faction && relation(G.pc.faction, f) <= 0); return pick(pool); }
  const en = (F[emp] && F[emp].enemies.length) ? F[emp].enemies.filter(f => F[f]) : [];
  if (arch === 'humanitaire' || arch === 'climat') return pick(['fa', 'manacorp', 'slummer', 'optimum'].filter(x => x !== emp));
  return en.length ? pick(en) : 'fa';
}
function genOffer(emp, tier, opts = {}) {
  const pool = FACTION_POOL[emp] || FACTION_POOL.civils; const id = opts.arch || pick(pool); const a = ARCH[id];
  const tgt = opts.tgt || pickTarget(emp, id); const place = opts.place || G.loc;
  const o = { arch: id, tier, emp, tgt, place, weeks: tier >= 3 ? 2 : 1, empName: emp === 'noir' ? 'le Marché Noir' : emp === 'civils' ? 'un notable local' : F[emp].name, tgtName: tgt === 'fa' ? 'la Force d’Autorité' : F[tgt].name, clim: CLIM(), diff: rint(-1, 1), promo: !!opts.promo };
  if (a.hasTarget) { const cands = DATA.chars.filter(c => c.faction === tgt && G.world.npc[c.id].alive && G.world.npc[c.id].st === 'free' && c.stars <= Math.max(1, tier)); const c = cands.length ? pick(cands) : null; o.tchar = c ? c.id : null; }
  o.pay = Math.round((70 * tier + rint(0, 60 * tier)) * (a.money ?? 1) * (emp === G.pc.faction ? 0.8 : 1)); o.xp = 14 + tier * 12; o.merit = emp === G.pc.faction ? tier * 9 : 0;
  return o;
}
const ROLE_ARCH = { eclaireur: ['fouille', 'enquete'], combattant: ['prime', 'defense'], artilleur: ['prime', 'defense'], leader: ['liberation', 'defense'], medecin: ['humanitaire', 'climat'], ingenieur: ['sabotage', 'course'], costumier: ['infiltration', 'propagande'], hacker: ['infiltration', 'enquete', 'propagande'], gardien: ['escorte', 'defense'], logisticien: ['contrebande', 'escorte', 'humanitaire'], strategiste: ['defense', 'liberation'] };
function tiersForGrade() { const t0 = clamp(Math.round(pcPower() - 1.8), 1, 5); return [t0, Math.min(5, t0 + 1)]; }
function getBoard() {
  const pc = G.pc;
  if (G.board && G.board.wk === G.wk && G.board.loc === G.loc && G.board.fac === pc.faction) return G.board.offers;
  const [t0, t1] = tiersForGrade(); const L = [];
  const home = pc.faction;
  const addF = (emp, n) => { for (let i = 0; i < n; i++) L.push(genOffer(emp, rint(Math.max(1, t0 - 1), t1))); };
  if (home !== 'civils') addF(home, 2);
  addF('civils', 1); if ((pc.rep.noir || 0) >= 5 || ['galleon', 'check', 'slummer', 'rapinas', 'manacorp', 'arena'].includes(home)) addF('noir', 1);
  if (home === 'fallen') { /* contrats imposés */ }
  pc.roles.forEach(r => { const emp = home !== 'civils' && chance(0.5) ? home : 'civils'; const o = genOffer(emp, rint(Math.max(1, t0), t1), { arch: pick(ROLE_ARCH[r]) }); o.roleOffer = r; L.push(o); });
  const promo = promoOffer(); if (promo) L.unshift(promo);
  G.board = { wk: G.wk, loc: G.loc, fac: pc.faction, offers: L }; return L;
}
function promoOffer() {
  const pc = G.pc; if (pc.faction === 'civils' || pc.grade >= 4) return null; const need = MERIT_STEPS[pc.grade + 1];
  if (pc.merit < need) return null;
  return genOffer(pc.faction, Math.min(5, pc.grade + 1), { promo: true });
}
function stars(n) { n = clamp(n | 0, 0, 5); return '★'.repeat(n) + '☆'.repeat(5 - n); }
function missionBoard() {
  const pc = G.pc; const offers = getBoard(); const L = [];
  const co = typeof canonOffers === 'function' ? canonOffers() : []; co.forEach(c => L.push(C(`⭐ ${c.title}`, c.go, { sub: c.sub, cls: 'risk' })));
  L.push(C('Combattre à l’ARENA (1 à 3 combats)', () => arenaTournament(rint(1, 3)), { cls: 'risk', sub: 'Gros gains, mort possible.', req: { ok: () => pc.faction === 'fa' ? 'Un officier de la F.A. n’y combat pas' : null } }));
  offers.forEach(o => { const a = ARCH[o.arch]; L.push(C(`${o.promo ? '🎖 ÉPREUVE DE GRADE — ' : ''}${o.roleOffer ? '🎭 ' + ROLES[o.roleOffer].name + ' — ' : ''}${a.n} (${o.empName}) — difficulté ${stars(o.tier)}`, () => missionBrief(o), { sub: `${o.tgtName} · ${o.pay} ¢ · ${o.weeks} sem.${o.merit ? ' · +' + o.merit + ' mérite' : ''}`, req: { ok: () => pc.faction === 'fa' && o.emp === 'noir' ? 'Impossible pour un officier de la F.A.' : null } })); });
  if (pc.implant) L.unshift(C('🔥 Contrat de chasseur Fallen (sauve ton implant)', fallenContract, { cls: 'danger', sub: `Avant le ${dateStr(pc.implant.deadline)} ou ça explose.` }));
  L.push(C('Chercher d’autres contrats (1 semaine)', () => { advance(1); if (G.status !== 'play') return; G.board = null; missionBoard(); }));
  L.push(C('← Retour', () => contractCard()));
  show({ kicker: 'Missions', title: 'Tableau de missions', text: ['Contrats de ta faction, du Marché Noir ou de notables locaux. La difficulté suit ton grade ; plus haut tu vises, plus ça paie — et plus ça mord.'], choices: L });
}
function missionBrief(o) { missionApproach(o); }
function approachChoices(o) {
  const a = ARCH[o.arch]; const L = []; const pc = G.pc; const dc = dcOf(o.tier, o.diff);
  const keys = Object.keys(a.ap); const gates = gateSet(keys.map(k => ({ lab: a.ap[k][0], attr: APPROACH[k].a })), o.tier);
  keys.forEach((k, gi) => {
    const d = APPROACH[k]; let tags = d.t; let sub = '';
    if (k === 'pouvoir') { tags = a.ptags; const match = a.ptags.some(t => (powerTags()[t] || 0) > 0); sub = match ? 'pouvoir adapté ✔' : 'pouvoir peu adapté'; }
    const rq = Object.assign({}, d.req || {}); if (d.money) rq.money = 40 * o.tier; if (gates.has(gi)) { rq.attr = Object.assign({}, rq.attr, { [d.a]: gates.get(gi) }); sub = (sub ? sub + ' · ' : '') + `🔑 ${AT[d.a].short} ${gates.get(gi)}`; }
    const price = d.money ? ` (${40 * o.tier} ¢)` : '';
    L.push(C(`${a.ap[k][0]}${price}`, () => resolveApproach(o, k, dc), { odds: [d.a, dc + (k === 'pouvoir' && sub !== 'pouvoir adapté ✔' ? 2 : 0), tags, d.money ? 4 : 0], req: rq, cls: d.cls, sub }));
  });
  return L;
}
function missionApproach(o) {
  const a = ARCH[o.arch];
  show({ extra: o.tchar ? portrait(o.tchar, 96) : null, kicker: `${o.promo ? 'ÉPREUVE DE GRADE' : 'MISSION'} · ${o.empName} · ${stars(o.tier)}`, title: a.n, text: [ctxText(a.intro, o), o.tchar && CH[o.tchar] ? `Cible désignée : <b>${esc(CH[o.tchar].name)}</b> (${esc(F[CH[o.tchar].faction].name)}, ${charPowerText(CH[o.tchar])}).` : '', ['assassinat', 'kidnapping', 'incendie', 'emeute'].includes(o.arch) ? '<span class="badc">Sans retour : des gens en subiront les conséquences.</span>' : '', `<span class="mut">${o.pay} ¢ · ${o.xp} XP${o.merit ? ' · +' + o.merit + ' mérite' : ''} · ${o.weeks} sem.${o.promo ? ' · <b>grade à la clé</b>' : ''}</span>`].filter(Boolean), choices: [...approachChoices(o), C('Renoncer', o.back || (o.feed ? hub : missionBoard), { cls: 'back' })] });
}
function resolveApproach(o, k, dc) {
  const a = ARCH[o.arch]; const d = APPROACH[k]; const pc = G.pc;
  if (k === 'furtif' && typeof feat === 'function' && feat('infil') && INFIL.has(o.arch)) return infiltration(o);
  if (d.money) pc.money -= 40 * o.tier;
  const tags = k === 'pouvoir' ? a.ptags : d.t; const penal = k === 'pouvoir' && !a.ptags.some(t => (powerTags()[t] || 0) > 0) ? -2 : 0;
  const r = check(d.a, dc, tags, (d.money ? 4 : 0) + penal);
  advance(o.weeks); if (G.status !== 'play') return;
  const txt = a.ap[k];
  if (r.ok && k === 'pouvoir' && pcPowers()[0]) pxGain(pcPowers()[0].id, 1);
  if (r.ok) {
    const crit = r.crit; const go = () => finishMission(o, crit ? 'crit' : 'ok', [txt[1], checkLine(r)]);
    if (chance(0.3) && !o.promo) return complication(o, k, txt[1], r, go);
    return finishMission(o, crit ? 'crit' : 'ok', [txt[1], checkLine(r)]);
  }
  // échec
  const L = [txt[2], checkLine(r)];
  if (d.fail === 'loss') return missionFail(o, L, { lost: true });
  const tiers = o.tier; const nFoes = 1 + (tiers >= 3 ? 1 : 0) + (chance(0.4) ? 1 : 0);
  if (d.fail === 'chase' && r.total >= r.dc - 3) return missionFail(o, [...L, 'Tu t’en sors de justesse en lâchant la mission.'], { partial: true });
  const foes = o.tgt === 'fa' ? foesFor('fa', Math.min(5, tiers), nFoes) : foesFor(o.tgt, Math.min(5, tiers), nFoes);
  show({ kicker: 'Complication', title: 'Ça tourne mal', text: [...L, 'On te tombe dessus !'], choices: [C('Se battre', () => startCombat({ title: 'Contre-attaque', foes, intro: 'L’alerte est donnée : ils foncent sur toi.', lethal: lethalOf(o.tgt), canFlee: true,
    onWin: (L2) => finishMission(o, 'partial', ['Tu t’en sors en les battant. La mission est à moitié réussie.'], L2), onFlee: () => missionFail(o, ['Tu prends la fuite : mission ratée.'], { fled: true }) })), C('Tenter de fuir', () => { const rf = check('agilite', 11 + tiers * 2, ['mobility']); if (rf.ok) { G.pc.flags.escW = G.wk; missionFail(o, ['Tu t’échappes de justesse. Mission ratée.'], { fled: true }); } else startCombat({ title: 'Pris en chasse', foes, intro: 'Tu n’as pas pu les semer.', lethal: lethalOf(o.tgt), canFlee: false, onWin: (L2) => finishMission(o, 'partial', ['Tu les as finalement battus.'], L2) }); })] });
}
function lethalOf(fid) { return { fa: 'capture', fallen: 'capture', arena: 'capture', check: 'robbed', noir: 'robbed', slummer: 'robbed', galleon: 'robbed', manacorp: 'capture', gamma: 'capture', saibogu: 'capture', omega: 'capture', necropunks: 'death', ragnaroks: 'death', optimum: 'death', committed: 'robbed' }[fid] || 'robbed'; }
function missionFail(o, lines, f = {}) {
  const pc = G.pc; const L = [];
  const L2 = fx({ rep: { [o.emp === 'civils' || o.emp === 'noir' ? (o.emp === 'noir' ? 'noir' : 'civils') : o.emp]: -3 }, xp: Math.round(o.xp * 0.25), heat: ARCH[o.arch].heat >= 3 ? 3 : 1, hp: -rint(2, 4 + Math.round(o.tier * 1.5)) });
  if (pc.hp <= 0) { pc.hp = 1; }
  pc.missions++; G.score.fails = (G.score.fails || 0) + 1;
  // loyauté des alliés
  pc.party.forEach(a => a.loy = clamp(a.loy - 4, 0, 100));
  show({ kicker: 'Échec', title: 'Mission ratée', text: lines.map(x => typeof x === 'string' ? x : ''), fx: L2, choices: [C('Continuer', hub)] });
}
function finishMission(o, quality, lines, extraFx) {
  const pc = G.pc; const a = ARCH[o.arch]; const mult = quality === 'crit' ? 1.4 : quality === 'partial' ? 0.55 : 1;
  const emp = o.emp === 'civils' ? 'civils' : o.emp === 'noir' ? 'noir' : o.emp;
  const illegal = (o.tgt === 'fa' || isAnti(pc.faction)) ? 1 : 0.4; const heat = Math.round(a.heat * illegal * (quality === 'crit' ? 0.5 : 1) * (pc.faction === 'fa' ? 0 : 1) * (o.emp === 'fa' ? 0 : 1) * (chance(0.7) ? 1 : 0));
  const rewards = { money: Math.round(o.pay * mult * (1 + PK('cash') / 100)), xp: Math.round(o.xp * mult * (1 + PK('xp') / 100)), merit: Math.round(o.merit * mult), heat: Math.round(heat * (1 - Math.min(60, PK('quiet')) / 100)), rep: {} };
  if (emp !== 'civils' && emp !== 'noir') rewards.rep[emp] = 3 + (quality === 'crit' ? 2 : 0); else rewards.rep[emp] = 4;
  if (o.tgt && o.tgt !== emp && quality !== 'partial') rewards.rep[o.tgt] = (rewards.rep[o.tgt] || 0) - (o.arch === 'humanitaire' || o.arch === 'climat' ? 0 : 3);
  if (o.arch === 'humanitaire' || o.arch === 'climat') { rewards.rep.civils = 5; delete rewards.rep[o.tgt]; G.score.saved = (G.score.saved || 0) + rint(3, 12); }
  if (rewards.rep[emp] === 0) delete rewards.rep[emp];
  const L = fx(rewards); if (extraFx) L.unshift(...extraFx);
  pc.missions++; G.score.missions = (G.score.missions || 0) + 1;
  addCityRep(['humanitaire', 'climat', 'temoin', 'mediation', 'pelerinage', 'recrutement'].includes(o.arch) ? 4 : ['assassinat', 'incendie', 'emeute', 'racket', 'braquage', 'kidnapping', 'trouble', 'blanchiment'].includes(o.arch) ? -3 : 2, o.arch);
  if (o.favor && quality !== 'partial') { pc.flags['favor_' + o.favor] = true; L.push(...fx({ rep: { [emp]: 14 } })); L.push({ t: 'Ils te doivent une faveur : tu peux maintenant négocier la pierre.', c: 'acc' }); }
  if (o.fallen && pc.implant && quality !== 'partial') { pc.implant.deadline = G.wk + 12; L.push({ t: 'Prime livrée : le compte à rebours de ton implant est remis à zéro (12 semaines).', c: 'good' }); }
  pc.party.forEach(al => { al.loy = clamp(al.loy + 3, 0, 100); });
  // butins
  if (chance(0.16 + PK('loot') / 100)) { const id = pick(['capsule', 'kit', 'capsule', 'nanosoin', 'stimulant']); L.push(...fx({ item: { [id]: 1 } })); }
  if (G.wk >= 6 && chance((['fouille', 'enquete', 'ecoute', 'ruines', 'prototype', 'taupe'].includes(o.arch) ? 0.3 : 0.07) * (quality === 'crit' ? 1.8 : 1))) { const l = stoneClueGain(); if (l) L.push({ t: '💎 Indice : ' + cap(l), c: 'acc' }); }
  logEntry(`Mission « ${a.n} » (${o.empName}) : ${quality === 'crit' ? 'triomphe' : quality === 'partial' ? 'demi-succès' : 'réussie'}.`);
  const after = () => {
    if (o.promo && quality !== 'partial') return promote(L);
    show({ kicker: 'Succès', title: quality === 'crit' ? 'Un triomphe !' : quality === 'partial' ? 'Demi-succès' : 'Mission accomplie', text: lines.filter(x => typeof x === 'string'), fx: L, choices: [C('Continuer', () => (quality === 'partial' ? hub() : lootPick(o, quality)))] });
  };
  // choix moral pour les chasses à la prime
  if (o.tchar && (o.arch === 'prime' || o.arch === 'ordre') && quality !== 'partial') {
    const t = CH[o.tchar];
    return show({ kicker: 'Dilemme', title: `${t.name} est à ta merci`, text: [...lines.filter(x => typeof x === 'string'), `${esc(t.name)} (${esc(F[t.faction].name)}) te regarde, vaincu. Livrer un géno-porteur, c’est le condamner à la prison, à l’ARENA ou pire.`], fx: L, choices: [
      C('Le livrer et toucher la prime', () => { const bonus = 120 * (t.stars || 1) + 80; G.world.npc[o.tchar].st = 'captured'; const L2 = fx({ money: bonus, rep: { [t.faction]: -12, [emp === 'civils' ? 'civils' : emp]: 2 }, heat: 0 }); newsPush(`${t.name} (${F[t.faction].name}) a été livré par un chasseur de primes.`); show({ kicker: 'Livré', title: 'Prime encaissée', text: ['Tu empoches la prime. Sa faction retiendra ton nom.'], fx: L2, choices: [C('Continuer', hub)] }); }, { cls: 'danger' }),
      C('Le laisser filer (il te devra une faveur)', () => { const L2 = fx({ rep: { [t.faction]: 12, [emp === 'civils' ? 'civils' : emp]: -4 }, xp: 10 }); pc.flags['debt_' + o.tchar] = true; show({ kicker: 'Clémence', title: 'Tu le laisses partir', text: [`« Je n’oublierai pas, » murmure ${esc(t.name)}.`], fx: L2, choices: [C('Continuer', hub)] }); }),
      C('Lui proposer de te rejoindre', () => recruit(o.tchar, 0, true), { odds: ['charisme', 12 + t.stars * 2, ['social']], req: { ok: () => pc.party.length >= partyMax() ? 'Groupe complet' : null } })] });
  }
  after();
}
function promote(L0) {
  const pc = G.pc; pc.grade++; const f = F[pc.faction]; const s0 = wantedStars(); addHeat(0); pc.heat = Math.max(pc.heat, minHeat()); const s1 = wantedStars();
  recalc(); pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * 0.25)); splash({ title: 'PROMOTION', sub: `${gradeName()} ${'★'.repeat(pc.grade)}`, icon: '🎖', color: '#ffe83a' }); logEntry(`Promotion : ${gradeName()} (${f.name}).`);
  const L = [...(L0 || [])]; if (s1 > s0) L.push({ t: `Plus tu es gradé, plus on te cherche : prime ${starStr(s1)} — ${WANTED_TXT[s1]}.`, c: 'badc' });
  const dec = ['aucune décision', 'tu votes dans les décisions de ta faction', 'tu peux proposer des opérations', 'tu décides des opérations locales', 'tu pèses sur les grandes décisions', 'tu décides de tout'][pc.grade];
  show({ kicker: 'PROMOTION', title: `${gradeName()} ${'★'.repeat(pc.grade)}`, text: [`${esc(leaderName(pc.faction))} te serre la main devant tout le monde : tu es promu(e) <b>${esc(gradeName())}</b> de ${esc(f.name)}.`, `Désormais, ${dec}. Ta puissance augmente (PV max +4).`], fx: L, choices: [C('Continuer', hub)] });
}

// ───────── Complications après un succès ─────────
function complication(o, k, okText, r, done) {
  const types = ['embuscade', 'dilemme', 'rival', 'revelation', 'traque']; const t = pick(types); const pc = G.pc;
  const head = [okText, checkLine(r)];
  if (t === 'embuscade') {
    const foes = foesFor(o.tgt === 'fa' ? 'fa' : o.tgt, Math.min(5, o.tier), 1 + (o.tier >= 3 ? 1 : 0));
    return show({ kicker: 'Complication', title: 'Embuscade à la sortie', text: [...head, 'Sur le chemin du retour, des silhouettes surgissent. Ils t’attendaient.'], choices: [C('Les affronter', () => startCombat({ title: 'Embuscade', foes, lethal: lethalOf(o.tgt), intro: 'Ils ont attendu qu’on lâche la garde.', onWin: L => finishMission(o, 'crit', ['Tu les écrases : c’est un triomphe.'], L), onFlee: () => finishMission(o, 'partial', ['Tu leur échappes, mais en laissant du butin.']) })), C('Les semer', () => { const rf = check('agilite', dcOf(o.tier), ['mobility']); if (rf.ok) finishMission(o, 'ok', ['Tu les sèmes dans les ruelles.', checkLine(rf)]); else finishMission(o, 'partial', ['Tu les sèmes… mais tu y laisses un morceau de butin.', checkLine(rf)]); })] });
  }
  if (t === 'dilemme') {
    return show({ kicker: 'Dilemme', title: 'Une famille aux abois', text: [...head, 'Une famille de non-porteurs se cache dans l’entrepôt, terrifiée. Un détachement approche : si tu les aides, tu perds du temps et du butin.'], choices: [C('Les aider à fuir (−30 % de gain)', () => { o.pay = Math.round(o.pay * 0.7); const L = fx({ rep: { civils: 8 }, xp: 15 }); G.score.saved = (G.score.saved || 0) + 4; finishMission(o, 'ok', ['Tu leur ouvres une sortie. Ils pleurent de gratitude.'], L); }, { cls: 'safe' }), C('Les ignorer et filer', () => { finishMission(o, 'ok', ['Tu files sans te retourner.'], fx({ rep: { civils: -4 } })); }), C('Les dénoncer à la Force d’Autorité (prime)', () => { const L = fx({ money: 150, rep: { civils: -8, fa: 4 }, heat: -3 }); finishMission(o, 'ok', ['Tu les vends. La conscience pèsera plus tard.'], L); }, { cls: 'danger' })] });
  }
  if (t === 'rival') {
    const rf = pick(Object.keys(F).filter(f => isAnti(f) && f !== pc.faction && f !== o.emp));
    return show({ kicker: 'Rival', title: `${F[rf].name} veut aussi le butin`, text: [...head, `Une équipe de ${esc(F[rf].name)} te rejoint à la sortie. Ils visent la même chose.`], choices: [C('Négocier un partage', () => { const rr = check('charisme', dcOf(o.tier), ['social']); if (rr.ok) { o.pay = Math.round(o.pay * 0.7); finishMission(o, 'ok', ['Vous partagez. Chacun repart content.', checkLine(rr)], fx({ rep: { [rf]: 4 } })); } else startCombat({ title: 'Rivaux', foes: foesFor(rf, Math.min(5, o.tier), 2), lethal: lethalOf(rf), onWin: L => finishMission(o, 'ok', ['Tu as eu le dernier mot.'], L) }); }, { odds: ['charisme', dcOf(o.tier), ['social']] }), C('Les affronter', () => startCombat({ title: 'Rivaux', foes: foesFor(rf, Math.min(5, o.tier), 2), lethal: lethalOf(rf), onWin: L => finishMission(o, 'crit', ['Ils reculent, battus.'], [...L, ...fx({ rep: { [rf]: -5 } })]) }), { cls: 'danger' })] });
  }
  if (t === 'revelation') {
    const l = stoneClueGain();
    return show({ kicker: 'Révélation', title: 'Un détail qui change tout', text: [...head, l ? `Dans les papiers, tu trouves une piste : ${esc(l)}` : 'Dans les papiers, tu trouves un secret sur ton employeur.'], choices: [C('Garder l’information pour toi', () => finishMission(o, 'ok', ['Tu gardes le secret.']), { cls: 'safe' }), C('La vendre au Marché Noir (+200 ¢)', () => finishMission(o, 'ok', ['Le Marché Noir paie bien.'], fx({ money: 200, rep: { noir: 6 } })))] });
  }
  return show({ kicker: 'Traque', title: 'Un drone te colle aux basques', text: [...head, 'Un Cerbère (drone sensitif) a flairé ton ogénite et te file à travers les rues.'], choices: [C('Le semer par les toits', () => { const rr = check('agilite', dcOf(o.tier), ['mobility']); finishMission(o, rr.ok ? 'ok' : 'partial', [rr.ok ? 'Tu le sèmes.' : 'Tu le sèmes, mais on a ta description.', checkLine(rr)], rr.ok ? [] : fx({ heat: 3 })); }, { odds: ['agilite', dcOf(o.tier), ['mobility']] }), C('Le détruire', () => startCombat({ title: 'Cerbère', foes: [mkFoe('cerbere', Math.min(5, o.tier))], lethal: 'capture', onWin: L => finishMission(o, 'ok', ['Le drone n’est plus que ferraille.'], L) }))] });
}
