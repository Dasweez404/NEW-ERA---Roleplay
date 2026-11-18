# NEW ERA — le jeu à choix

Jeu à choix (type *Destiny Eleven* / *Reigns*) dans l'univers de **New Era** : Cratès, 2071, les géno-porteurs, le Nouveau Régime, l'Orbitrail et les 16 pierres antiques. 100 % français.

**Jouer :** ouvre `index.html` dans un navigateur : un seul fichier, hors-ligne, mobile et PC, sauvegarde automatique.
**En ligne :** sur GitHub, *Settings → Pages → Deploy from a branch*, choisis la branche et `/ (root)` : `index.html` est servi tel quel.

## Le jeu en bref
- **Boucle d'une destination** : Contrats → Histoire (3 cartes) → Ville (une action) → Départ. Un rail en haut indique l'étape.
- **Personnage** : personnage **customisé** ou un des **441** du tableur. Les **étoiles ★ = Puissance** (1 à 10) ; le **rang ▲** (Recrue → Chef) est séparé : tout le monde commence Recrue, sauf le chef de faction (le plus puissant de la sienne).
- **Combat** : 3 à 5 rounds, un geste par round parmi 3, façon selon la catégorie de style (Offensif, Défensif, Technique, Soutien) ; pourcentage affiché ; pouvoir limité (1 round sur 3, 2 sur 5) ; conséquences selon les rounds gagnés et perdus (victoire, repli, fuite, défaite, capture ou mort).
- **Jets** : d20 + attribut + bonus (plafonnés) contre une difficulté recalée sur une courbe douce ; options verrouillées par seuil d'attribut 🔑.
- **Quêtes** : 5 actes de trame principale, ~16 campagnes en chapitres, 80+ types de contrats, ~30 scènes à choix. Les **pierres** n'arrivent qu'après l'Acte I.
- **Monde** : Orbitrail (13 lignes, stations fermées, villes confinées), 31 factions + Force d'Autorité, 52 États, capture / prison / évasion, retraite, mort, score.
- **Journal de partie** (☰ → 📊) : enregistre localement jets, combats et choix pour étudier l'équilibrage (rien n'est envoyé).

## Développement
```bash
# 1. données (PDF + CSV + XLSX -> game/data/data.json)      [seulement si les sources changent]
python3 game/tools/build_data.py <NEW_ERA.pdf> <Projet-Personnages.csv> <NEW_ERA___TIMELINE.xlsx>
# 2. assemblage : game/new-era.html, game/new-era.artifact.html (non suivis par git) et index.html
python3 game/build.py
# 3. tests (Playwright)
node game/tools/sweep.js $PWD/game/new-era.html        # balayage des scènes + parties aléatoires
node game/tools/autoplay.js $PWD/game/new-era.html 500 # test de fumée : 500 clics au hasard
```

### Structure (`game/src/js/*.js`, concaténés dans l'ordre alphabétique)
| Fichiers | Rôle |
|---|---|
| `00-util` `10-data` `20-state` `30-core` | utilitaires, données de jeu (styles, rôles, objets), état et sauvegarde, jets (`check`, `odds`, `dcEff`), récompenses (`fx`) |
| `40-ui` `45-fx` `46-sprites` `47-transit` `48-city` `49-env` | moteur de scènes (`show`, `C`), HUD, carte de l'Orbitrail, effets, sprites, décors pixel art |
| `50-combat` `51-sigfoe` `53-duel` | ennemis et issues de combat ; **combat V3** (`startCombat`, `play`, gestes par catégorie) ; Puissance (`pcPower`) |
| `60-hub` `61-feed` | boucle de jeu (`hub`, `contractCard`, `dealCard`), ville, voyage, repos, entraînement, rôles |
| `62-libre` `63-vehicles` `65-perks` `66-conflict` `67-shop` | mode libre, véhicules, particularités de pouvoirs, conflits de factions, marché |
| `70-missions` `71-missions2` `94-missions3` | contrats : archétypes, approches, résolution |
| `72-deeds` `73-lot1` `74-lot2` `79-roguelite` `96-stories` | dilemmes, némésis, campagnes (moteur), vies uniques, scènes de trame |
| `95-camps2` `97-acts` | campagnes secondaires et **trame principale en 5 actes** (déblocage des pierres) |
| `75-relgraph` `76-limits` `77-stonebadge` `78-polish` | graphe des relations, limites d'actions, pastilles de pierres, tutoriel et ambiance |
| `80-world` `85-stones` `87-capture` `90-faction` `91-council` `92-leads` `93-closures` | monde vivant, pierres, capture, direction de faction, conseil, opportunités, fermetures |
| `98-telemetry` `99-main` | journal de partie ; écran d'accueil et fin de partie |

`game/src/style.css` (styles), `game/src/index.template.html`, `game/data/*.json` (données extraites, sprites, décors), `game/assets/` (logos), `game/tools/` (extraction de données et tests), `LORE.md` (réponses de lore validées).

## Fidélité et libertés
Tout ce qui vient du PDF, du tableur et de la timeline est repris tel quel (voir l'écran « À propos » du jeu). **Improvisé** : les règles de jeu, les 5 attributs, la Puissance, les relations entre factions, les faiblesses de pouvoirs, les détenteurs et temples des pierres, les prix, les ennemis types, les quêtes et campagnes, et la transcription de l'Orbitrail depuis l'image fournie.

## Visuels de villes
Dépose tes images dans `game/assets/envs/` (voir `LISEZMOI.txt`), puis `python3 game/tools/build_envs.py game/assets/envs` et `python3 game/build.py`. Sans image, un décor vectoriel est rendu en pixel art vert.
