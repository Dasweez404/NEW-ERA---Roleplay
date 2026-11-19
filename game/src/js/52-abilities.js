// ───────── Capacités de pouvoir : chaque pouvoir a un effet de combat qui lui est propre ET une capacité utilisable en quête ─────────
// 15 familles d'effets de combat (aucune ne se résume à « gagner un round »), et une capacité de quête par sous-catégorie de super-pouvoir.
const FAMS = {
  rush: { ic: '⚡', verbs: ['Frénésie', 'Assaut', 'Charge furieuse'], txt: 'Round gagné et un second round compté en plus' },
  ambush: { ic: '🎯', verbs: ['Embuscade', 'Frappe en traître', 'Piqué'], txt: 'Round gagné · +5 au prochain jet' },
  guard: { ic: '🛡', verbs: ['Carapace', 'Rempart', 'Peau d’acier'], txt: 'Round gagné · bouclier et une esquive' },
  regen: { ic: '💚', verbs: ['Souffle de vie', 'Régénération', 'Sève vitale'], txt: 'Round gagné · tu et ton équipe récupérez des PV' },
  drain: { ic: '🩸', verbs: ['Pillage', 'Siphon', 'Morsure vitale'], txt: 'Round gagné · tu voles des PV et de l’énergie' },
  stun: { ic: '💫', verbs: ['Onde de choc', 'Sidération', 'Éclair paralysant'], txt: 'Round gagné · leur prochain coup est annulé' },
  hex: { ic: '🌀', verbs: ['Confusion', 'Mauvais œil', 'Brouillard'], txt: 'Round gagné · leurs jets sont plombés 2 rounds' },
  mirror: { ic: '🪞', verbs: ['Miroir', 'Réflexion', 'Contre-sort'], txt: 'Round gagné · ta prochaine défaite devient un nul' },
  reveal: { ic: '👁', verbs: ['Prescience', 'Œil perçant', 'Lecture'], txt: 'Round gagné · nouvelle main de cartes et +3 au jet' },
  swarm: { ic: '🐝', verbs: ['Essaim', 'Légion', 'Meute'], txt: 'Round gagné · des alliés invoqués t’aident 2 rounds' },
  gravity: { ic: '⚖', verbs: ['Pesanteur', 'Écrasement', 'Affaiblissement'], txt: 'Round gagné · leurs coups faiblissent durablement' },
  lucky: { ic: '🍀', verbs: ['Coup de chance', 'Fortune', 'Destin'], txt: 'Round gagné · les 2 prochains jets se lancent deux fois' },
  rewind: { ic: '⏪', verbs: ['Retour en arrière', 'Pas de côté', 'Faille'], txt: 'Le round est annulé sans dégâts · nouvelle main · +2 ⚡' },
  venom: { ic: '☠', verbs: ['Venin', 'Corrosion', 'Toxine'], txt: 'Round gagné · les 2 prochains rounds gagnés comptent double' },
  rage: { ic: '🔥', verbs: ['Fureur', 'Brasier', 'Rage sauvage'], txt: 'Round gagné · +4 aux jets pendant 2 rounds (mais plus risqué)' },
};
// sous-catégorie → [famille de combat, capacité de quête [nom, description, tags, texte de réussite]]
const SUBFAM = {
  "Oiseaux d'eau & de mer": ['ambush', ['Cap sur l’horizon', 'Tu survoles la côte et repères un passage sûr', ['scout', 'mobility'], 'Du haut du ciel, tu repères un chemin que personne ne voyait.']],
  'Oiseaux colorés & passereaux': ['hex', ['Chant envoûtant', 'Ton chant apaise ou charme la foule', ['social'], 'Ton chant se pose sur la foule : tout le monde t’écoute.']],
  'Rapaces & charognards': ['ambush', ['Vue d’aigle', 'Tu repères ce qui est caché de très loin', ['scout'], 'Ta vue perçante découvre ce qui était dissimulé.']],
  'Coureurs, oiseaux du froid & atypiques': ['rush', ['Course folle', 'Tu distances n’importe qui', ['mobility'], 'Tu files plus vite que le vent : personne ne te rattrape.']],
  'Géants & raies': ['guard', ['Passage sous-marin', 'Tu traverses l’eau sans être vu', ['mobility', 'stealth'], 'Tu glisses sous la surface et ressors de l’autre côté.']],
  'Poissons de récif & curiosités': ['swarm', ['Banc de diversion', 'Des centaines de poissons détournent les regards', ['stealth'], 'Le banc attire tous les regards : tu passes inaperçu.']],
  'Grands prédateurs': ['rage', ['Flair du sang', 'Tu pistes une cible à l’odeur', ['scout', 'combat'], 'Ton flair te mène droit à la proie.']],
  'Crustacés': ['guard', ['Carapace', 'Tu encaisses ce qui devrait te briser', ['defense'], 'Ta carapace encaisse tout : tu tiens bon.']],
  'Insectes volants': ['swarm', ['Essaim espion', 'Un essaim écoute et observe pour toi', ['scout', 'stealth'], 'Tes insectes se glissent partout : tu sais déjà tout.']],
  'Arachnides & myriapodes': ['venom', ['Toile piégeuse', 'Tu piégeas une zone ou une cible', ['control'], 'Ta toile immobilise ce qui s’approche.']],
  'Insectes terrestres': ['swarm', ['Colonie ouvrière', 'Une colonie fait le travail à ta place', ['tech', 'logi'], 'La colonie accomplit le travail en un rien de temps.']],
  'Tortues': ['guard', ['Patience millénaire', 'Tu tiens et tu attends, rien ne t’use', ['defense'], 'Ta patience épuise tout le monde autour de toi.']],
  'Amphibiens': ['venom', ['Saut de gué', 'Tu franchis rivières, marais et gouffres', ['mobility'], 'D’un bond, tu es de l’autre côté.']],
  'Lézards & crocodiliens': ['rage', ['Mue camouflage', 'Tu te fonds dans le décor', ['stealth', 'disguise'], 'Ta peau change : tu deviens quelqu’un d’autre.']],
  'Serpents': ['venom', ['Regard hypnotique', 'Tu fascines et tu questionnes', ['control', 'social'], 'Ton regard fixe l’autre : il répond sans résister.']],
  'Céphalopodes': ['hex', ['Camouflage chromatique', 'Ta peau imite n’importe quel décor', ['disguise', 'stealth'], 'Tu t’effaces dans le décor, nuance après nuance.']],
  'Cnidaires & coraux': ['venom', ['Récif curatif', 'Tu soignes avec ton récif vivant', ['heal'], 'Le récif cicatrise les blessures en quelques minutes.']],
  'Autres invertébrés': ['regen', ['Repousse', 'Tu régénères ce qui est brisé', ['heal', 'tech'], 'Ce qui était cassé repousse sous tes yeux.']],
  'Primates': ['lucky', ['Agilité de singe', 'Tu escalades et te faufiles partout', ['mobility'], 'Tu grimpes là où personne n’ose aller.']],
  'Marsupiaux': ['ambush', ['Poche cachée', 'Tu transportes et dissimules du matériel', ['stealth', 'logi'], 'Rien ne dépasse : ton butin est invisible.']],
  'Pinnipèdes & siréniens': ['guard', ['Nage polaire', 'Tu traverses eaux glacées et banquises', ['mobility'], 'L’eau glacée ne te retient pas.']],
  'Cétacés': ['stun', ['Sonar', 'Tu cartographies tout autour de toi', ['scout'], 'Ton sonar dessine les lieux dans ton esprit.']],
  'Fouisseurs & insectivores': ['rewind', ['Tunnel', 'Tu creuses un passage sous l’obstacle', ['stealth', 'mobility'], 'Tu surgis de terre de l’autre côté du mur.']],
  'Rongeurs & lagomorphes': ['swarm', ['Passage de souris', 'Tu te glisses par les plus petits trous', ['stealth'], 'Un trou grand comme le poing te suffit.']],
  'Chauves-souris': ['reveal', ['Écholocation', 'Tu vois dans le noir complet', ['scout'], 'Dans l’obscurité totale, tu vois tout.']],
  'Pachydermes & suidés': ['guard', ['Force de colosse', 'Tu déplaces ou retiens ce qui est trop lourd', ['defense', 'combat'], 'Ce qui était trop lourd cède sous tes mains.']],
  'Cervidés & girafidés': ['rush', ['Sens de la forêt', 'Tu devines les dangers du terrain', ['scout'], 'Le terrain n’a plus de secret pour toi.']],
  'Bovidés': ['rush', ['Charge de troupeau', 'Tu fonces à travers l’obstacle', ['combat'], 'Rien ne résiste à ta charge.']],
  'Équidés & camélidés': ['rush', ['Galop', 'Tu avales les distances', ['mobility'], 'Tu files au galop à travers tout.']],
  'Canidés': ['ambush', ['Flair de la meute', 'Tu pistes et coordonnes les tiens', ['scout', 'ally'], 'Ton flair et ta meute ne se trompent jamais.']],
  'Félins': ['ambush', ['Chasse silencieuse', 'Tu approches sans un bruit', ['stealth'], 'Un pas de velours, et tu y es.']],
  'Mustélidés & autres carnivores': ['drain', ['Glissement', 'Tu te faufiles et t’échappes', ['stealth', 'mobility'], 'Tu t’écoules comme de l’eau entre leurs mains.']],
  'Ours & pandas': ['regen', ['Hibernation', 'Tu récupères intensément en un instant', ['heal', 'defense'], 'Tu t’endors une minute : tout ton corps se répare.']],
  'Matières liquides & chimiques': ['venom', ['Flux', 'Tu fais couler, dissoudre ou noyer', ['control'], 'Le liquide obéit : il coule où tu veux.']],
  'Matières minérales & solides': ['guard', ['Peau de roche', 'Ta peau devient pierre ou métal', ['defense'], 'Ta peau devient pierre : plus rien ne te blesse.']],
  'Énergies': ['rage', ['Surcharge', 'Tu alimentes ou grilles les machines', ['tech'], 'L’énergie afflue : la machine repart (ou grille).']],
  'Mobilité': ['rewind', ['Pas de côté', 'Tu te déplaces instantanément', ['mobility'], 'Tu disparais ici, tu réapparais là.']],
  'Sens, émotions & métamorphoses': ['lucky', ['Lecture des émotions', 'Tu sens ce que ressentent les autres', ['social'], 'Tu lis les émotions comme un livre ouvert.']],
  'Résistance, souffle & régénération': ['regen', ['Second souffle', 'Tu te soignes sur place', ['heal'], 'Tu reprends ton souffle : tes blessures se referment.']],
  'Membres & morphologie': ['rush', ['Membre sur mesure', 'Ton corps s’adapte à la situation', ['combat', 'tech'], 'Ton corps se transforme, juste ce qu’il fallait.']],
  'Illusion & contrôle': ['hex', ['Illusion', 'Tu fais voir ce qui n’existe pas', ['disguise', 'social'], 'Ils voient ce que tu veux qu’ils voient.']],
  'Perception & analyse': ['reveal', ['Analyse', 'Tu comprends une situation d’un coup d’œil', ['scout'], 'En un regard, tu comprends tout le montage.']],
  'Esprit, mémoire & rêves': ['mirror', ['Lecture d’esprit', 'Tu lis ce que l’autre pense', ['social', 'scout'], 'Ses pensées te parviennent, claires.']],
  'Technologie & réseaux': ['stun', ['Piratage mental', 'Tu prends le contrôle des systèmes', ['hack'], 'Le système est à toi, sans un seul mot de passe.']],
  'Matière & réalité': ['gravity', ['Réalité malléable', 'Tu modifies la matière autour de toi', ['tech', 'control'], 'La matière se plie à ce que tu veux.']],
  'Espace-temps & gravité': ['rewind', ['Saut spatial', 'Tu te déplaces d’un point à un autre', ['mobility'], 'Tu traverses l’espace sans un pas.']],
  'Forces & champs': ['guard', ['Champ de force', 'Tu bloques ce qui vient vers toi', ['defense'], 'Un champ invisible arrête tout.']],
  'Ondes & environnement': ['stun', ['Brouillage', 'Tu perturbes signaux et systèmes', ['hack', 'control'], 'Tous les signaux se brouillent autour de toi.']],
  'Chance & destin': ['lucky', ['Coup de chance', 'Le hasard tourne en ta faveur', ['social', 'scout'], 'Le hasard fait bien les choses : tout s’aligne.']],
  "Transformation d'objets": ['swarm', ['Transmutation', 'Tu transformes un objet en autre chose', ['tech'], 'L’objet devient exactement ce dont tu avais besoin.']],
  'Contrôle & soutien': ['drain', ['Soutien', 'Tu renforces ton équipe', ['ally', 'heal'], 'Ton équipe se sent invincible.']],
  'Aura & anti-matière': ['gravity', ['Aura', 'Ta présence impose le respect', ['social'], 'Ta présence écrase toute discussion.']],
  'Vie & mort': ['regen', ['Souffle de vie', 'Tu soignes, ou tu rappelles un mourant', ['heal'], 'Tu rappelles la vie dans un corps qui s’éteignait.']],
  'Création': ['swarm', ['Création', 'Tu fabriques ce dont tu as besoin', ['tech', 'logi'], 'Ce dont tu avais besoin existe désormais.']],
  'Éléments': ['rage', ['Maîtrise élémentaire', 'Tu façonnes l’élément à ta guise', ['control', 'defense'], 'L’élément t’obéit : il fait exactement ce que tu demandes.']],
};
const ELEM_FAM = [[/feu|lave|magma|braise|plasma|soleil/i, 'rage'], [/eau|glace|neige|givre|mer/i, 'regen'], [/terre|roche|sable|m[ée]tal|bois|plante|cristal/i, 'guard'], [/air|vent|temp[êe]te|nuage|son/i, 'rewind'], [/foudre|[ée]clair|[ée]lectri|tonnerre/i, 'stun'], [/ombre|nuit|t[ée]n[èe]bre|poison|acide/i, 'venom'], [/lumi[èe]re|[ée]toile|lune/i, 'reveal']];
const abilCache = {};
const hashN = str => { let x = 7; for (const ch of String(str)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return x; };
function powerAbility(pid) {
  if (abilCache[pid]) return abilCache[pid]; const p = PW[pid]; if (!p) return null;
  let e = SUBFAM[p.sub]; if (!e) e = ['ambush', ['Talent', 'Ton pouvoir t’aide d’une façon qui lui est propre', ['scout'], 'Ton pouvoir vient à ton secours.']];
  let fam = e[0]; if (p.type === 'elementaire') { const m = ELEM_FAM.find(([re]) => re.test(p.name + ' ' + p.desc)); if (m) fam = m[1]; else fam = ['rage', 'guard', 'regen', 'stun', 'rewind'][hashN(p.id) % 5]; }
  const F = FAMS[fam]; const h = hashN(p.id); const mag = 1 + (h % 3); const verb = F.verbs[h % F.verbs.length];
  const RID = [['', ''], [' · +1 ⚡', 'en'], [' · une esquive', 'dodge'], [' · bouclier 3', 'shield'], [' · +5 % PV', 'hp']]; const rid = RID[(h >>> 3) % 5]; const q = e[1]; return abilCache[pid] = { pid, fam, ic: F.ic, name: `${verb}`, power: p.name, mag, rider: rid[1], txt: F.txt + rid[0], q: { n: q[0], d: q[1], tags: q[2], line: q[3] } };
}
const pcAbility = () => { const ps = pcPowers(); if (!ps.length) return null; CB && (CB.abil = CB.abil || {}); const p = ps.find(x => !(CB && CB.abil && CB.abil[x.id])) || ps[0]; return powerAbility(p.id); };
// ── Effets en combat ──
function abilityApply(a, who) {
  const pc = G.pc, F = FAMS[a.fam], m = a.mag; const heal = pct => { const g = Math.round(pc.hpMax * pct); pc.hp = Math.min(pc.hpMax, pc.hp + g); pop('pc', `+${g}`, 'ok'); clog(`+${g} PV.`, 'good'); };
  const nm = who || pc.name; clog(`${F.ic} ${nm} : ${a.name} (${a.power}) !`, 'acc');
  if (a.rider === 'en') pc.en = Math.min(pc.enMax, pc.en + 1); else if (a.rider === 'dodge') CB.dodge += 1; else if (a.rider === 'shield') CB.shield += 3; else if (a.rider === 'hp') { pc.hp = Math.min(pc.hpMax, pc.hp + Math.round(pc.hpMax * .05)); }
  switch (a.fam) {
    case 'rush': CB.W = Math.min(CB.N, CB.W + 1); clog('Un second round est compté !', 'good'); break;
    case 'ambush': CB.nextBonus += 4 + m; clog(`Prochain jet : +${4 + m}.`, 'good'); break;
    case 'guard': CB.shield += 6 + m * 2; CB.dodge += 1; clog(`Bouclier +${6 + m * 2} et une esquive.`, 'good'); break;
    case 'regen': heal(0.2 + m * 0.04); pc.party.forEach(x => { if (x.inj <= 0) x.hp = Math.min(x.hpMax, x.hp + Math.round(x.hpMax * 0.25)); }); break;
    case 'drain': heal(0.1 + m * 0.03); pc.en = Math.min(pc.enMax, pc.en + 2 + m); clog('Énergie volée.', 'good'); break;
    case 'stun': CB.foeStun = 1; CB.nextBonus += 1 + m; clog('Leur prochain coup est annulé.', 'good'); break;
    case 'hex': CB.hexLeft = 2; clog('Leurs jets sont plombés pendant 2 rounds.', 'good'); break;
    case 'mirror': CB.mirror = 1; CB.nextBonus += 1 + m; clog('Ta prochaine défaite deviendra un nul.', 'good'); break;
    case 'reveal': dealHand(); CB.nextBonus += 2 + m; clog('Nouvelle main de cartes !', 'good'); break;
    case 'swarm': CB.swarm = 2; clog('Des alliés invoqués te couvrent 2 rounds.', 'good'); break;
    case 'gravity': aliveFoes().forEach(x => { x.dmg = Math.max(1, x.dmg - (1 + m)); }); CB.weak = Math.max(CB.weak || 0, 3); clog('Leurs coups faiblissent.', 'good'); break;
    case 'lucky': CB.adv = 2; clog('Les 2 prochains jets se lancent deux fois.', 'good'); break;
    case 'rewind': pc.en = Math.min(pc.enMax, pc.en + 2); dealHand(); clog('Le temps se replie : nouvelle main.', 'good'); break;
    case 'venom': CB.venom = 2; clog('Les 2 prochains rounds gagnés comptent double.', 'good'); break;
    case 'rage': CB.rageLeft = 2; CB.nextBonus += 2; clog('Fureur : +4 aux jets pendant 2 rounds.', 'good'); break;
  }
}
// Effet des pouvoirs de personnages adverses (nommés) : utilisé quand ils déclenchent leur pouvoir
function foePowerOf(f) { const c = f.cid && CH[f.cid]; if (!c || !c.powers || !c.powers.length) return null; return powerAbility(c.powers[0]); }
function foeAbilityHit(a) {
  const pc = G.pc; const F = FAMS[a.fam];
  if (['drain', 'venom', 'regen'].includes(a.fam)) { const d = Math.min(3 + a.mag, pc.en); pc.en -= d; clog(`${F.ic} Ton énergie est siphonnée (−${d}).`, 'log-dmg'); }
  else if (['stun', 'hex', 'gravity', 'mirror'].includes(a.fam)) { CB.nextBonus -= 3; clog(`${F.ic} Tu es déstabilisé : −3 au prochain jet.`, 'log-dmg'); }
  else if (['rage', 'rush', 'ambush'].includes(a.fam)) clog(`${F.ic} Coup redoutable.`, 'log-dmg');
  else { CB.hitBuff -= 1; clog(`${F.ic} Tes gestes se font moins sûrs (−1).`, 'log-dmg'); }
}
// ── Capacités de quête : une fois par destination, 2 énergie, réussite automatique quand elle correspond à la situation ──
function questAbility() { const ps = pcPowers(); for (const p of ps) { const a = powerAbility(p.id); if (a) return a; } return null; }
const questReady = a => !!(a && G.pc.en >= 2 && G.pc.flags.qaDest !== (G.pc.flags.dest || 0));
const questFits = (a, tags) => !!(a && (a.q.tags || []).some(t => (tags || []).includes(t)));
function questUse() { const pc = G.pc; pc.en -= 2; pc.flags.qaDest = pc.flags.dest || 0; const a = questAbility(); pxGain(a.pid, 1); return a; }
