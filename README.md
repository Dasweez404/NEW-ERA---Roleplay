# NEW ERA — le jeu à choix

Jeu à choix (type *Destiny Eleven*) dans l'univers de **New Era** : Cratès, 2071, les géno-porteurs, le Nouveau Régime, l'Orbitrail et les 16 pierres antiques.

**Jouer :** ouvre `index.html` (ou `game/new-era.html`) dans un navigateur : un seul fichier, hors-ligne, mobile et PC, sauvegarde automatique.
**En ligne :** sur GitHub, *Settings → Pages → Deploy from a branch*, choisis la branche et `/ (root)` : `index.html` est servi tel quel. Variante prête pour claude.ai : `game/new-era.artifact.html`.

## Ce que contient le jeu
- **Deux façons de jouer** : personnage **customisé** (nom → faction parmi 31 + Force d'Autorité → origine parmi les 52 États → pouvoir → style de combat → 5 attributs, avec 🎲 au hasard à chaque étape) ou **personnage existant** parmi les 441 du tableur (au hasard ou choisi) avec son grade, son pouvoir réel et ses responsabilités (un chef de faction commence chef).
- **Pouvoirs** : les 434 pouvoirs de l'annuaire (244 zoologiques, 174 surnaturels, 16 élémentaires) rangés en catégorie › sous-catégorie › pouvoir ; hybrides (deux pouvoirs, pas de la même famille sauf deux surnaturels).
- **Attributs** : Force/Corps, Agilité/Vitesse, Intellect/Technique, Charisme/Sang-froid, Maîtrise.
- **Styles de combat** : Brawler, Performer, Juggernaut, Protector, Flanker, Ranger, Assist, Engineer (chacun une technique propre).
- **Rôles** (apparaissent après quelques missions) : éclaireur, combattant, artilleur, leader, médecin, ingénieur, costumier, hacker, gardien, logisticien, stratégiste — ils débloquent des options de mission.
- **Grades 1 à 5 ★** (5 = chef) : plus on monte, plus on est puissant et recherché (**prime ⭐ à ⭐⭐⭐⭐**). Une recrue n'a aucune voix dans les décisions ; voter → proposer → décider → trancher selon le grade.
- **Devenir chef** : être la relève, tuer le chef, attendre sa mort, ou fonder sa propre faction.
- **Direction de faction** : territoires, batailles, alliances et guerres (les alliés de tes ennemis sont plus durs avec toi), assaut sur la Force d'Autorité.
- **Orbitrail** : les 13 lignes de la carte, avec correspondances, traversées du Pacifique, contrôles de la F.A.
- **Capture** : interrogatoire, prison (jusqu'au Tartare), évasion, ARENA, vente, **Fallen** (implant explosif, faction accessible seulement après capture).
- **16 pierres antiques** : pistes, temples cachés, détenteurs réels déduits du lore, glyphes ; les avoir toutes met fin à la partie par une **victoire**.
- **Retraite**, **mort**, **score** (tableau des meilleurs scores).
- **Timeline d'Ora** : les événements canon (juin 2071 → 2074) se produisent dans le monde, avec ou sans le joueur (option désactivable).
- Choix **verrouillés mais visibles** (argent, attribut, grade, rôle, lien, pouvoir manquant).

## Fidélité et libertés
Tout ce qui vient du PDF / du tableur / de la timeline est repris tel quel (voir l'écran « À propos » dans le jeu). Ce qui est **improvisé** : les règles de jeu (jets, énergie, éveil, primes), les 5 attributs (choix de l'utilisateur), les relations entre factions, les faiblesses de pouvoirs, les détenteurs et temples initiaux des pierres, les prix, les ennemis types, et la transcription de l'Orbitrail depuis l'image fournie.

## Développement
```bash
# 1. données (PDF + CSV + XLSX -> game/data/data.json)
python3 game/tools/build_data.py <NEW_ERA.pdf> <Projet-Personnages.csv> <NEW_ERA___TIMELINE.xlsx>
# 2. assemblage du fichier jouable
python3 game/build.py
# 3. tests (Playwright)
node game/tools/sweep.js $PWD/game/new-era.html      # balayage des scènes + 5 parties aléatoires
node game/tools/autoplay.js $PWD/game/new-era.html 600 custom
```
Structure : `game/src/js/*.js` (moteur, concaténés dans l'ordre alphabétique), `game/src/style.css`, `game/data/data.json`, `game/tools/` (extraction de données et tests).

## Sprites et animation
`game/tools/build_sprites.py` réduit les sprites HD (×10) en miniatures pixel-art et les embarque (`game/data/sprites.json`). Le trajet en Orbitrail rejoue les lignes vectorielles (`OT_LINES`) avec une caméra zoomée qui suit un point blanc de station en station (`game/src/js/47-transit.js`).
