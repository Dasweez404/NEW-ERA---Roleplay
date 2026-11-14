#!/usr/bin/env python3
"""Construit game/data/data.json à partir des documents sources de New Era :
   - NEW_ERA_V.11.pdf (lore, États, factions, pierres, annuaire des pouvoirs)
   - Projet-Personnages.csv (440 personnages)
   - NEW_ERA___TIMELINE.xlsx (frise Ora, histoire des factions)

Usage : python3 build_data.py <pdf> <csv> <xlsx> [sortie.json]
Rien n'est inventé ici sauf ce qui est marqué `# IMPROVISÉ`.
"""
import csv, json, re, subprocess, sys, unicodedata, collections, os
sys.path.insert(0, os.path.dirname(__file__))
import parse_powers as PP

PDF, CSV, XLSX = sys.argv[1:4]
OUT = sys.argv[4] if len(sys.argv) > 4 else os.path.join(os.path.dirname(__file__), '..', 'data', 'data.json')

def slug(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def pdftext(a, b):
    return subprocess.run(['pdftotext', '-f', str(a), '-l', str(b), PDF, '-'], capture_output=True, text=True).stdout.replace('\x0c', '\n').replace('​', '')

# ───────────────────────── États ─────────────────────────
def parse_states():
    t = pdftext(3, 4)
    cont_pos = []
    for name in ['Europe', 'Océanie', 'Amérique', 'Afrique', 'Asie']:
        m = re.search(r'\d+ États en ' + name, t)
        cont_pos.append((m.start(), name))
    cont_pos.sort()
    pat = re.compile(r'(?m)^([A-ZÉ][\w’\' éèÉ]+?)\s*\(([^)]+)\)\s*:\s*(.*?)Population\s*[:;]\s*([\d,]+\s*[mk])', re.S)
    states = []
    for m in pat.finditer(t):
        cont = [n for p, n in cont_pos if p <= m.start()][-1]
        countries = re.sub(r'\s+', ' ', m.group(3)).strip().rstrip('.')
        states.append(dict(id=slug(m.group(1)), name=m.group(1).strip(), capital=m.group(2).strip(),
                           countries=countries, pop=m.group(4).replace(' ', ''), continent=cont))
    assert len(states) == 52, len(states)
    return states

# ───────────────────────── Factions ─────────────────────────
FACTION_META = {  # lettre PDF -> métadonnées (hq = État où se trouve le QG ; IMPROVISÉ pour bloc/relations)
 'A': dict(id='uplift', hq='atlante', leader=['021'], anti=True),
 'B': dict(id='arena', hq='machrek', leader=['030'], anti=True),
 'C': dict(id='clairobscur', hq='gallica', leader=['040'], anti=True),
 'D': dict(id='galleon', hq='sunda', leader=['051'], anti=True),
 'E': dict(id='bruteforce', hq='mitropa', leader=['062'], anti=True),
 'F': dict(id='nebula', hq='tropicana', leader=['073'], anti=True),
 'G': dict(id='check', hq='tropicana', leader=['084'], anti=True),
 'H': dict(id='hem', hq='scandor', leader=['095'], anti=True),
 'I': dict(id='artefactors', hq='saha', leader=['107'], anti=True),
 'J': dict(id='cockpits', hq='aotea', leader=['213'], anti=True),
 'K': dict(id='umami', hq='yamato', leader=['128'], anti=True),
 'L': dict(id='slummer', hq='sahel', leader=['139'], anti=True),
 'M': dict(id='ecobase', hq='amazonia', leader=['152'], anti=True),
 'N': dict(id='necropunks', hq='meso', leader=['166'], anti=True),
 'O': dict(id='optimum', hq='caucase', leader=['176'], anti=True),
 'P': dict(id='rapinas', hq='alpomare', leader=['188'], anti=True),
 'Q': dict(id='ragnaroks', hq='isgarde', leader=['200'], anti=True),
 'R': dict(id='paddocks', hq='banda', leader=['118'], anti=True),
 'S': dict(id='saibogu', hq='koryo', leader=[], anti=True),
 'T': dict(id='incognito', hq='bengal', leader=['234'], anti=True),
 'U': dict(id='oudatchi', hq='slavo', leader=['245', '246'], anti=True),
 'V': dict(id='excels', hq='swahilis', leader=['257'], anti=True),
 'W': dict(id='vigilante', hq='albion', leader=['274'], anti=True),
 'X': dict(id='siha', hq='caribana', leader=['288', '289'], anti=True),
 'Y': dict(id='natives', hq='ekatori', leader=['300'], anti=True),
 'Z': dict(id='committed', hq='andina', leader=[], anti=True),
 'Ω': dict(id='omega', hq='sunda', leader=['373'], anti=False, secret=True),
 'φ': dict(id='sanctuaire', hq='sinotan', leader=['323'], anti=False, secret=True),
 'ϵ': dict(id='ringan', hq='ubunye', leader=['360'], anti=False, secret=True),
 'σ': dict(id='manacorp', hq='australis', leader=['334'], anti=False, secret=True),
 'γ': dict(id='gamma', hq='polaris', leader=['347'], anti=False, secret=True),
}
# relations : +2 allié, +1 ami, -1 hostile, -2 ennemi   (IMPROVISÉ d'après la timeline)
ALLIES = {
 'uplift': ['vigilante', 'clairobscur', 'bruteforce', 'hem', 'siha', 'natives', 'excels', 'ecobase', 'incognito', 'sanctuaire'],
 'vigilante': ['uplift', 'clairobscur', 'hem', 'siha', 'natives', 'excels', 'ecobase', 'incognito', 'oudatchi', 'rapinas', 'umami', 'cockpits', 'paddocks', 'nebula', 'artefactors', 'bruteforce', 'sanctuaire', 'ringan'],
 'clairobscur': ['bruteforce', 'incognito'], 'bruteforce': ['nebula'],
 'nebula': ['cockpits', 'paddocks', 'natives'], 'cockpits': ['paddocks'],
 'hem': ['siha', 'ecobase', 'natives', 'umami'], 'siha': ['umami', 'rapinas', 'ecobase'],
 'ecobase': ['natives', 'artefactors', 'ringan'], 'artefactors': ['natives', 'ringan'],
 'umami': ['excels', 'rapinas'], 'natives': ['excels', 'sanctuaire'], 'oudatchi': ['rapinas', 'umami'],
 'arena': ['check', 'manacorp', 'gamma', 'galleon', 'committed'], 'check': ['manacorp', 'galleon'],
 'manacorp': ['gamma', 'committed', 'optimum'], 'gamma': ['committed'], 'committed': ['ragnaroks'],
 'galleon': ['slummer'], 'omega': [],
}
ENEMIES = {
 'uplift': ['optimum', 'arena', 'check', 'omega', 'manacorp'], 'vigilante': ['check', 'optimum', 'slummer', 'ragnaroks', 'arena', 'manacorp', 'gamma', 'necropunks', 'omega', 'committed'],
 'clairobscur': ['optimum', 'manacorp'], 'bruteforce': ['saibogu', 'optimum'], 'nebula': ['saibogu'], 'cockpits': ['saibogu', 'gamma'],
 'paddocks': ['saibogu'], 'hem': ['optimum'], 'siha': ['check', 'slummer'], 'ecobase': ['manacorp', 'ragnaroks', 'committed'],
 'artefactors': ['galleon', 'slummer'], 'umami': ['manacorp'], 'natives': ['necropunks', 'galleon'], 'excels': ['arena', 'check'],
 'rapinas': ['slummer', 'manacorp'], 'incognito': ['manacorp'], 'oudatchi': ['manacorp', 'committed'], 'ringan': ['optimum'],
 'optimum': ['necropunks'], 'necropunks': [], 'saibogu': ['nebula', 'cockpits', 'paddocks'],
 'slummer': ['hem'],
}

def parse_factions(chars_by_id):
    t = pdftext(10, 12)
    pat = re.compile(r'(?m)^(\S{1,2})\.\s+(.+?)\s?:\s+(.*?)\n+Date\s*:\s*(\d{4})\s+Location\s*:\s*(.+?)\s+Perception\s*:\s*(.+?)\n+Objectif\s*:\s*(.+?)\n(?=\n|[A-ZΩφϵσγ€]\.|\d)', re.S)
    clean = lambda s: re.sub(r'\s+', ' ', s).strip()
    facs = []
    for m in pat.finditer(t):
        letter = m.group(1)
        meta = FACTION_META[letter]
        name = clean(m.group(2)).replace('’', "'")
        facs.append(dict(id=meta['id'], letter=letter, name=name, desc=clean(m.group(3)), founded=int(m.group(4)),
                         hqText=clean(m.group(5)), perception=clean(m.group(6)), goal=clean(m.group(7)),
                         hq=meta['hq'], leaders=meta['leader'], anti=meta['anti'], secret=meta.get('secret', False)))
    assert len(facs) == 31
    # Leaders sans personnage CSV : on choisit le plus important de la faction
    return facs

# ───────────────────────── Pierres ─────────────────────────
STONES = [  # ordre de découverte 1..16 (PDF)  — clan, souverain, origine : PDF p.15 / p.19-20
 dict(order=1, id='lumiere', name='Lumière', ruler='Rí Bán', origin='Celte', spec='Droit & Gouvernance', clan='kaos', temple='albion', holder='check', color='#f5d547'),
 dict(order=2, id='plante', name='Plante', ruler="Ajaw Q'omer", origin='Mayas, Nazcas, Incas, Aztèques', spec='Horticulture & Botanique', clan='bidh', temple='aymaro', holder='temple', color='#5cc24a'),
 dict(order=3, id='magma', name='Magma', ruler='Konungr Rod', origin='Viking, Germanique', spec='Militaire & Arsenal', clan='kaos', temple='isgarde', holder='temple', color='#d6322b'),
 dict(order=4, id='eau', name='Eau', ruler='Ariki Māmā', origin='Polynésie, Samoa, Maoris, Hawaïen', spec='Pêche & Aquaculture', clan='bidh', temple='avaiki', holder='arena', color='#3c82d9'),
 dict(order=5, id='air', name='Air', ruler='Wang Aijiki', origin='Sino, Nippon, Coréen', spec='Météorologie & Astronomie', clan='kaos', temple='sinotan', holder='sanctuaire', color='#7a5cd1'),
 dict(order=6, id='feu', name='Feu', ruler='Shah Nârenji', origin='Perse, Mésopotamie, Sumérien, Byzantin, Hittite, Phénicien', spec='Art & Culture', clan='bidh', temple='levant', holder='pnj-levant', color='#ee7d1a'),
 dict(order=7, id='fumee', name='Fumée', ruler='Nantan Palöngö', origin='Anasazi, Apache, Hohokams', spec='Artisanat & Textile', clan='kaos', temple='atlante', holder='fa', color='#ee7bb3'),
 dict(order=8, id='sable', name='Sable', ruler='Pharaon Khenet', origin='Égypte, Arabie, Nubie', spec='Sciences & Médecine', clan='bidh', temple='saha', holder='temple', color='#e8b83a'),
 dict(order=9, id='acide', name='Acide', ruler='Mahārāja Halidda', origin='Indus, Gupta, Shunga, Maurya, Harappéen', spec='Gastronomie & Alimentation', clan='kaos', temple='bengal', holder='slummer', color='#a8d82a'),
 dict(order=10, id='roche', name='Roche', ruler='Mwene Igolide', origin='Afrique Australe, Bantou', spec='Ressources minérales & naturelles', clan='bidh', temple='ubunye', holder='ringan', color='#e38a2c'),
 dict(order=11, id='foudre', name='Foudre', ruler='Archon Glaukos', origin='Grec, Romain, Ibérique', spec='Navigation & Exploration', clan='bidh', temple='balka', holder='committed', color='#2cc7b8'),
 dict(order=12, id='glace', name='Glace', ruler='Iglukik Tunguyok', origin='Inuits', spec='Commerce & Transport', clan='kaos', temple='polaris', holder='gamma', color='#4aa6e0'),
 dict(order=13, id='gaz', name='Gaz', ruler='Tjilpi Pinki', origin='Papous, Aborigènes, Majapahit', spec='Loisir & Spiritualité', clan='kaos', temple='australis', holder='manacorp', color='#d452b5'),
 dict(order=14, id='metal', name='Métal', ruler='Raja Ungu', origin='Fou Nan, Khmer, Champa', spec='Ingénierie & Architecture', clan='bidh', temple='annam', holder='manacorp', color='#6a4ca8'),
 dict(order=15, id='terre', name='Terre', ruler='Askia Bero', origin='Sahel, Songhaï', spec='Agriculture & Élevage', clan='kaos', temple='sahel', holder='uplift', color='#8b4a1e'),
 dict(order=16, id='tenebres', name='Ténèbres', ruler='Khagan Siyah', origin='Huns, Scythes, Mongols, Kourganes', spec='Magie Muta', clan='bidh', temple='slavo', holder='fa', color='#2a2a35'),
]
CANON_GAIN = {  # PDF p.35-45 : où/quand l'Alliance obtient la pierre dans la timeline canon (IMPROVISÉ pour les dates intermédiaires)
 'lumiere': ('2071-06', "Dun Aengus (Albion) — butin sur des brigands"),
 'plante': ('2071-10', "Machu Picchu — trouvée et confiée par les Artefactors"),
 'magma': ('2071-12', "Mont Hekla — récupérée des Ragnaroks"),
 'terre': ('2072-02', "Lagos — trouvée par l'Uplift, récupérée par le Clan Optimum"),
 'eau': ('2072-04', "Bora-Bora — récupérée de Mr Midnight, volée par Kuini Wai"),
 'air': ('2072-05', "Sanctuaire Shūshì — confiée par le Sanctuaire"),
 'feu': ('2073-03', "Baie de Kingston — volée et confiée"),
 'fumee': ('2073-03', "Neo York — volée et confiée"),
 'sable': ('2073-05', "Pyramide de Khéops — obtenue par fouille"),
 'acide': ('2073-07', "New Delhi — récupérée des Slummer-Gang"),
 'roche': ('2073-09', "Ringan Academy — prêtée"),
 'foudre': ('2073-10', "Manoir Committed (Athènes) — volée des Committed"),
 'glace': ('2073-11', "Gamma Lab (Arctique) — volée du Gamma Lab"),
 'gaz': ('2073-12', "Aquacité de la Mana Corp (Sydney) — récupérée"),
 'metal': ('2073-12', "Aquacité de la Mana Corp (Sydney) — trouvée après fouille"),
 'tenebres': ('2074-03', "QG de la Force d'Autorité (Berlin) — récupérée de la F.A."),
}

def parse_stones():
    t = pdftext(18, 20)
    marks = [(m.start(), m.group(1)) for m in re.finditer(r'(?m)^(\d+(?:&\d+)?)\s*-\s*[^:\n]+:', t)]
    glyph = {}
    for k, (p, n) in enumerate(marks):
        end = marks[k + 1][0] if k + 1 < len(marks) else t.find('Clan de Bidh')
        if end < 0: end = len(t)
        blk = t[p:end]
        parts = re.split(r'\n>\s*', blk)[1:] if '&' in n else [blk]
        for q, part in enumerate(parts):
            part = re.sub(r'^\d+(?:&\d+)?\s*-\s*[^:\n]+:\s*', '', part).strip()
            a = re.search(r'Interprétation des premiers détenteurs\s*:\s*(.*?)(?=Interprétation des protagonistes|$)', part, re.S)
            b = re.search(r'Interprétation des protagonistes\s*:\s*(.*)', part, re.S)
            glyph_txt = re.split(r'Interprétation des', part)[0]
            order = [int(x) for x in n.split('&')][q] if '&' in n else int(n)
            glyph[order] = dict(glyph=re.sub(r'\s+', ' ', glyph_txt).strip().lstrip('> '),
                                holders=re.sub(r'\s+', ' ', a.group(1)).strip() if a else '',
                                heroes=re.sub(r'\s+', ' ', b.group(1)).strip() if b else '')
    # numérotation PDF : 11 Foudre,12 Glace, 13 Gaz, 14 Métal, 15 Terre, 16 Ténèbres  (== ordre ci-dessus)
    for s in STONES:
        g = glyph[s['order']]
        s.update(g)
        d, w = CANON_GAIN[s['id']]
        s['canonDate'] = d; s['canonWhere'] = w
    return STONES

# ───────────────────────── Personnages ─────────────────────────
FAC_MAP = {'.FORCE OF AUTHORITY': 'fa', '. Civils': 'civils', '. The Fallens': 'fallen', '. Black Market': 'noir'}

def load_chars(power_by_carrier):
    rows = list(csv.DictReader(open(CSV, encoding='utf-8-sig')))
    letter2id = {k: v['id'] for k, v in FACTION_META.items()}
    chars = []
    for r in rows:
        m = re.match(r'-\s*(\d+)\s*:\s*(.*)', r['Nom'])
        cid, nm = m.group(1), m.group(2).strip()
        f = r['Faction'].strip()
        if f in FAC_MAP: fid = FAC_MAP[f]
        else:
            fid = letter2id[f.split('.')[0].strip()]
        types = [x.strip().lower() for x in r['Pouvoir'].split(',')]
        types = [{'zoologique': 'zoologique', 'surnaturel': 'surnaturel', 'elementaire': 'elementaire', 'aucun': 'aucun'}[x] for x in types]
        prestige = r['PRESTIGE'].strip()
        stars = prestige.count('⭐') if '⭐' in prestige else 0
        age = r['Age'].strip()
        chars.append(dict(id=cid, name=nm, faction=fid, ptypes=types, powers=power_by_carrier.get(cid, []),
                          age=age, gender=r['Genre'].strip(), origin=slug(r['Origine'].strip()), zone=r['Zones'].strip(),
                          continent=r['Continent'].strip(), style=(r['Rôle'].strip().lower() or None),
                          stars=stars, outAnti=(prestige == 'OUT-ANTI'), ratio=int(r['Ratio Importance'] or 0)))
    return chars

# ───────────────────────── Pouvoirs ─────────────────────────
ZSUB = {
 'Oiseaux': {'Rapaces & charognards': 'Chouette,Corbeau,Vautour,Hibou,Pygargue à tête blanche',
             "Oiseaux d'eau & de mer": 'Pélican,Canard,Martin-pêcheur,Goéland,Cygne,Héron,Cigogne,Albatros,Frégate,Oie,Flamant rose,Macareux',
             'Coureurs, oiseaux du froid & atypiques': 'Autruche,Pingouin,Manchot royal,Kiwi,Poule,Coq,Ornithorynque',
             'Oiseaux colorés & passereaux': 'Mésange bleu,Ara rouge,Toucan,Cacatoès,Paon,Colibri,Colombe,Perruche,Pigeon,Pic-vert,Rouge-gorge'},
 'Poissons': {'Grands prédateurs': 'Barracuda,Requin blanc,Requin zèbre,Espadon,Piranha,Baudroie,Poisson vipère,Thon,Arapaima,Murène,Silure,Mérou',
              'Géants & raies': 'Raie manta,Requin baleine,Raie,Poisson-lune,Régalec,Poisson napoléon,Coelacanthe,Chimère',
              'Poissons de récif & curiosités': '*'},
 'Insectes & Arthropodes': {'Insectes volants': 'Moustique,Abeille,Guêpe,Mouche,Libellule,Papillon,Coccinelle,Sauterelle',
                            'Insectes terrestres': 'Fourmi,Scarabée,Lucane,Coléoptère,Bousier,Punaise,Phasme,Phyllie,Mante religieuse',
                            'Arachnides & myriapodes': 'Veuve noire,Scorpion,Mygale,Scolopendre',
                            'Crustacés': '*'},
 'Reptiles & Amphibiens': {'Serpents': 'Couleuvre,Crotale,Python,Boa,Cobra',
                           'Lézards & crocodiliens': 'Caméléon,Iguane,Gecko,Dragon de komodo,Varan,Crocodile du Nil,Gavial,Alligator',
                           'Tortues': 'Tortue verte,Tortue Galapagos,Tortue caouanne,Tortue luth',
                           'Amphibiens': '*'},
 'Invertébrés': {'Céphalopodes': 'Pieuvre,Calamar,Seiche', 'Cnidaires & coraux': 'Anémone,Méduse,Corail', 'Autres invertébrés': '*'},
 'Primates & Marsupiaux': {'Marsupiaux': 'Koala,Diable de Tasmanie,Wombat,Quokka,Kangourou', 'Primates': '*'},
 'Cétacés & Pinnipèdes': {'Pinnipèdes & siréniens': 'Lamantin,Otarie,Morse,Phoque', 'Cétacés': '*'},
 'Rongeurs & Insectivores': {'Chauves-souris': 'Vampire,Pipistrelle', 'Fouisseurs & insectivores': 'Tamanoir,Tatou,Pangolin,Taupe,Hérisson,Paresseux', 'Rongeurs & lagomorphes': '*'},
 'Ongulés & Artiodactyles': {'Équidés & camélidés': 'Zèbre,Cheval,L’âne,Chameau,Dromadaire,Alpaga,Lama',
                             'Bovidés': 'Bison,Buffle,Vache,Taureau,Mouton,Bélier,Chèvre,Gnou,Antilope,Gazelle',
                             'Cervidés & girafidés': 'Biche,Cerf,Elan,Girafe,Okapi',
                             'Pachydermes & suidés': '*'},
 'Carnivores': {'Félins': 'Guépard,Chat,Lynx,Léopard,Tigre,Panthère noire,Puma,Lion,Léopard des neiges,Sphinx,Fossa',
                'Canidés': 'Loup,Lycaon,Labrador,Doberman,Fennec,Shiba,Renard,Renard arctique,Coyote,Tigre de Tasmanie',
                'Ours & pandas': 'Ours polaire,Panda,Grizzli,Ours brun,Panda Roux',
                'Mustélidés & autres carnivores': '*'},
}
SSUB = {
 'Matière': {'Matières minérales & solides': 'Ciment,Marbre,Argile,Cristal,Colle,Papier,Cire,Écorce,Boue',
             'Matières liquides & chimiques': 'Essence,Slime,Poison,Sucre,Explosion,Sang', 'Énergies': '*'},
 'Corporelles': {'Membres & morphologie': 'Nageoire,Queue,Piques,Lame,Cordes,Articulations,Télescopique,Elastique,Déformation,Flexibilité,Faufilement,Dextérité,Kératine,Ecailles,Pilosité,Voile,Tournis',
                 'Mobilité': 'Ailes,Elytres,Saut,Vitesse,Roue,Boule,Funambule,Air comprimé',
                 'Résistance, souffle & régénération': 'Durcissement,Muscles,Régénération,Réincarnation,Nerf,Perméabilité,Maladie,Respiration,Avalement,Stockage,Souffle,Fragmentation,Dédoublement,Eclosion',
                 'Sens, émotions & métamorphoses': '*'},
 'Mentales': {'Perception & analyse': 'Détection,Image,Portée,Balistique,Ultrasons,Auscultation,Statistiques,Construction',
              'Esprit, mémoire & rêves': 'Tempérament,Télépathie,Mémoire,Rêves,Conscience,Esprit,Vœu',
              'Technologie & réseaux': 'IA,Réseau,Personnalité',
              'Illusion & contrôle': '*'},
 'Physiques': {'Espace-temps & gravité': 'Temps,Espace,Période – Forme puérilité,Période – Forme maturité,Gravité,Trou noir,Portail,Astéroïdes,Statique,Mouvement',
               'Matière & réalité': 'Réalité,Etat,Transmutation,Destruction,Ramollissement,Sol,Séisme,Taille – Forme mini,Taille – Forme maxi,Poids – Forme lourde,Poids – Forme légère',
               'Forces & champs': 'Psychokinésie,Télékinésie,Champ de force – Forme bulle,Champ de force – Forme barrière,Magnétisme,Tuiles,Miroir',
               'Ondes & environnement': '*'},
 'Manipulation': {'Chance & destin': 'Probabilité – Forme chance,Probabilité – Forme malchance,Rembobinage,Age,Cadenas',
                  "Transformation d'objets": 'Nourriture,Jouet,Cartoon,Fusion,Assemblage,Glisse',
                  'Contrôle & soutien': '*'},
 'Exotiques': {'Aura & anti-matière': 'Anti-matière,Aura', 'Vie & mort': 'Mort,Bactérie – Forme virus,Bactérie – Forme anticore,Éponge – Forme dégâts,Éponge – Forme soins,Epargnement,Nature – Forme flore,Nature – Forme faune,Vol',
               'Création': '*'},
}
ZTAGS = {'Oiseaux': ['scout', 'mobility'], 'Poissons': ['mobility', 'combat'], 'Insectes & Arthropodes': ['stealth', 'scout'],
         'Reptiles & Amphibiens': ['stealth', 'defense'], 'Invertébrés': ['defense', 'control'], 'Primates & Marsupiaux': ['tech', 'social', 'mobility'],
         'Cétacés & Pinnipèdes': ['combat', 'social'], 'Rongeurs & Insectivores': ['stealth', 'scout'], 'Ongulés & Artiodactyles': ['combat', 'defense'],
         'Carnivores': ['combat', 'stealth']}
STAGS_SUB = {  # sous-catégorie -> tags (IMPROVISÉ : sert au moteur de jeu)
 'Matières minérales & solides': ['defense', 'tech'], 'Matières liquides & chimiques': ['combat', 'control'], 'Énergies': ['combat', 'tech'],
 'Membres & morphologie': ['combat', 'stealth'], 'Mobilité': ['mobility', 'scout'], 'Résistance, souffle & régénération': ['defense', 'heal'],
 'Sens, émotions & métamorphoses': ['stealth', 'social'], 'Perception & analyse': ['scout', 'hack'], 'Esprit, mémoire & rêves': ['social', 'control'],
 'Technologie & réseaux': ['hack', 'tech'], 'Illusion & contrôle': ['control', 'stealth'], 'Espace-temps & gravité': ['mobility', 'control'],
 'Matière & réalité': ['combat', 'control'], 'Forces & champs': ['combat', 'defense'], 'Ondes & environnement': ['control', 'scout'],
 'Chance & destin': ['control', 'social'], "Transformation d'objets": ['tech', 'control'], 'Contrôle & soutien': ['control', 'defense'],
 'Aura & anti-matière': ['combat', 'social', 'control'], 'Vie & mort': ['heal', 'control'], 'Création': ['tech', 'control'],
}
NAME_TAGS = {  # surcharges ciblées par nom (IMPROVISÉ)
 'Régénération': ['heal', 'defense'], 'Bactérie – Forme anticore': ['heal'], 'Éponge – Forme soins': ['heal', 'defense'], 'Epargnement': ['heal', 'combat'],
 'Auscultation': ['heal', 'scout'], 'Nourriture': ['heal', 'social'], 'Hormone': ['heal', 'control'], 'Encouragement': ['social', 'defense'],
 'Réseau': ['hack'], 'IA': ['hack', 'tech'], 'Écran': ['hack', 'stealth'], 'Statistiques': ['hack', 'scout'], 'Personnalité': ['hack', 'social'],
 'Invisibilité': ['stealth'], 'Identité': ['stealth', 'social'], 'Décor': ['stealth'], 'Silence': ['stealth', 'control'], 'Effacement': ['control', 'stealth'],
 'Détection': ['scout', 'defense'], 'Vision': ['scout'], 'Télépathie': ['social', 'scout'], 'Mémoire': ['social', 'control'], 'Aura': ['social', 'combat', 'heal', 'tech'],
 'Espace': ['mobility', 'stealth', 'combat'], 'Portail': ['mobility', 'stealth'], 'Temps': ['control', 'combat', 'mobility'], 'Vitesse': ['mobility', 'combat'],
 'Construction': ['tech', 'scout'], 'Assemblage': ['tech'], 'Blueprint': ['tech'], 'Dessin': ['tech', 'stealth'], 'Dextérité': ['tech', 'stealth'],
 'Objet – Forme outil': ['tech'], 'Objet – Forme arme': ['combat'], 'Champ de force – Forme bulle': ['defense'], 'Champ de force – Forme barrière': ['defense'],
 'Anti-matière': ['combat', 'control', 'defense', 'stealth'], 'Vol': ['control', 'combat'], 'Prison': ['control', 'defense'],
 'Ailes': ['mobility', 'scout'], 'Saut': ['mobility'], 'Durcissement': ['defense'], 'Muscles': ['combat'], 'Piques': ['combat', 'defense'], 'Lame': ['combat'],
}
ELEM_TAGS = ['combat', 'control', 'defense', 'mobility']

def build_powers():
    res = PP.parse(PDF)
    byid, carriers = [], collections.defaultdict(list)
    seen = collections.Counter()
    for r in res:
        typ, cat, name = r['type'], r['cat'], r['name']
        sub = None
        if typ == 'zoologique':
            for s, lst in ZSUB[cat].items():
                if lst != '*' and name in lst.split(','): sub = s; break
            if not sub: sub = [s for s, l in ZSUB[cat].items() if l == '*'][0]
            tags = ZTAGS[cat]
        elif typ == 'surnaturel':
            for s, lst in SSUB[cat].items():
                if lst != '*' and name in lst.split(','): sub = s; break
            if not sub: sub = [s for s, l in SSUB[cat].items() if l == '*'][0]
            tags = NAME_TAGS.get(name, STAGS_SUB[sub])
        else:
            sub = 'Éléments'; tags = ELEM_TAGS
        base = slug(f'{typ}-{cat}-{name}')
        seen[base] += 1
        pid = base if seen[base] == 1 else f'{base}-{seen[base]}'
        desc = r['desc']
        if typ == 'zoologique':
            desc = f'Peut se transformer en {name.lower()} (forme hybride) et en posséder les capacités.'
        p = dict(id=pid, type=typ, cat=cat, sub=sub, name=name, desc=desc, tags=tags, carriers=r['carriers'])
        byid.append(p)
        for c in r['carriers']: carriers[c].append(pid)
    return byid, carriers

# ───────────────────────── Timeline ─────────────────────────
ARCS = [  # (colonne xlsx, saga, date, état, titre)  — dates déduites de la ligne ANNEES ; fusions de cellules => IMPROVISÉ pour 2 arcs
 (2, 'DAWN OF A NEW ERA', '2071-06', 'albion', 'Côtes irlandaises & Londres'),
 (3, 'DAWN OF A NEW ERA', '2071-07', 'atlante', "Neo York & Grand Canyon d'Arizona"),
 (4, 'DAWN OF A NEW ERA', '2071-08', 'tropicana', "Désert d'Atacama"),
 (5, 'CELESTIAL HIGH-TECH', '2071-09', 'yamato', 'Ultra-Tokyo'),
 (6, 'CELESTIAL HIGH-TECH', '2071-09', 'banda', 'Nebula Station Spatiale & Jakarta'),
 (7, 'MUTA-MYSTERY', '2071-10', 'aymaro', "Jungle d'Amazonie"),
 (8, 'MUTA-MYSTERY', '2071-12', 'slavo', 'Taïga de Sibérie & Hekla Volcan'),
 (9, 'MUTA-MYSTERY', '2072-02', 'sahel', 'Lagos'),
 (10, 'NIGHTMARE VACATION', '2072-04', 'machrek', 'Wahatan-Resort, Dubaï'),
 (11, 'NIGHTMARE VACATION', '2072-04', 'avaiki', 'Battleworld, Bora-Bora'),
 (12, 'NIGHTMARE VACATION', '2072-05', 'sinotan', 'Îles flottantes, Sanctuaire Shūshì'),
 (13, 'ARID FORCES', '2073-03', 'levant', 'Petra & Baie de Kingston'),
 (14, 'ARID FORCES', '2073-05', 'saha', 'Désert du Sahara'),
 (15, 'ARID FORCES', '2073-07', 'bengal', 'Junkercity, New Delhi'),
 (16, 'DOUBLE HEIST', '2073-09', 'ubunye', 'Ringan Academy, Cap des Aiguilles'),
 (17, 'DOUBLE HEIST', '2073-10', 'swahilis', 'Prison du Tartare, Kilimandjaro'),
 (18, 'DOUBLE HEIST', '2073-10', 'balka', 'Manoir Committed, Athènes'),
 (19, 'RISE OF POWER', '2073-11', 'polaris', "Gamma Lab, Banquise d'Arctique"),
 (20, 'RISE OF POWER', '2073-12', 'australis', 'Aquacité de la Mana Corp, Sydney'),
 (21, 'LAST BREATH', '2074-03', 'mitropa', "QG de la Force d'Autorité, Berlin"),
 (22, 'LAST BREATH', '2074-04', 'gallica', "Base de l'Alliance, Paris"),
]

def build_timeline():
    import openpyxl
    ws = openpyxl.load_workbook(XLSX).active
    rows = [[None if c is None else str(c) for c in r] for r in ws.iter_rows(values_only=True)]
    arcs = []
    for col, saga, date, state, title in ARCS:
        summ = (rows[3][col] or '').strip()
        arcs.append(dict(col=col, saga=saga, date=date, state=state, title=title, summary=re.sub(r'\s+', ' ', summ)))
    # histoire des factions (col 1 des lignes 8..41)
    lore = {}
    NAME2ID = {'Gamma Lab': 'gamma', 'Uplift': 'uplift', 'Ringan Academy': 'ringan', 'Mana Corp': 'manacorp', 'Saibogu Project': 'saibogu',
               'Omega Force': 'omega', 'Hem Industries': 'hem', 'Cockpits': 'cockpits', 'Ragnaroks': 'ragnaroks', 'Committed Sect': 'committed',
               'Sanctuaire Shūshì': 'sanctuaire', 'Arena': 'arena', 'Slummer-Gang': 'slummer', 'Galleon': 'galleon', 'Nebula Station': 'nebula',
               'Rapinas': 'rapinas', 'The Check': 'check', 'Oudatchis': 'oudatchi', 'Paddocks': 'paddocks', 'Clan Optimum': 'optimum', 'Natives': 'natives',
               'Artefactors': 'artefactors', 'Excels': 'excels', 'Eco-Base': 'ecobase', 'Siha Mujahaz': 'siha', 'Umami Restaurant': 'umami',
               'Clairobscur': 'clairobscur', 'Vigilante Squad': 'vigilante', 'Bruteforce': 'bruteforce', 'Necropunks': 'necropunks',
               'Incognito': 'incognito', 'Force of Authority': 'fa'}
    for i in range(8, 42):
        n, t = rows[i][0], rows[i][1]
        if n in NAME2ID and t and NAME2ID[n] not in lore:
            lore[NAME2ID[n]] = re.sub(r'\s+', ' ', t).strip()
    return arcs, lore

# ───────────────────────── Assemblage ─────────────────────────
def main():
    states = parse_states()
    powers, carriers = build_powers()
    chars = load_chars(carriers)
    # Cohérence : chaque personnage avec pouvoir doit avoir au moins un pouvoir extrait
    missing = [c for c in chars if c['ptypes'] != ['aucun'] and not c['powers']]
    ids = {c['id'] for c in chars}
    factions = parse_factions({c['id']: c for c in chars})
    stones = parse_stones()
    arcs, lore = build_timeline()
    # Faction : leaders manquants -> perso le plus important
    for f in factions:
        f['lore'] = lore.get(f['id'], '')
        mem = [c for c in chars if c['faction'] == f['id']]
        f['leaders'] = [l for l in f['leaders'] if l in ids]
        if not f['leaders'] and mem:
            f['leaders'] = [sorted(mem, key=lambda c: (-c['stars'], -c['ratio']))[0]['id']]
        f['allies'] = ALLIES.get(f['id'], []); f['enemies'] = ENEMIES.get(f['id'], [])
    # FA, Civils, Fallens, Marché Noir : « pseudo-factions »
    extra = [
      dict(id='fa', letter='', name="Force d'Autorité", desc="Branche armée du Nouveau Régime : fusion de la police et de l'armée, équipée de droïdes, de mechas et de systèmes de détection des géno-porteurs. Obéit aux 7 doyens (et, en secret, à Néo).", founded=2061, hqText='Berlin (base Hestia, Panthéon)', perception="Protection globale", goal="Maintenir l'ordre du Nouveau Régime et traquer les géno-porteurs.", hq='mitropa', leaders=['001'], anti=False, secret=False, lore=lore.get('fa', ''), allies=[], enemies=[f['id'] for f in factions if f['anti']]),
      dict(id='civils', letter='', name='Civils', desc='Non-porteurs et géno-porteurs sans affiliation.', founded=2048, hqText='partout', perception='', goal='Vivre.', hq='albion', leaders=[], anti=False, secret=False, lore='', allies=[], enemies=[]),
      dict(id='fallen', letter='', name='Les Fallen', desc="Brigade de chasseurs de primes possédant un implant explosif — d'anciens captifs.", founded=2071, hqText='Le Tartare (Kilimandjaro) & partout', perception='Chasseurs de primes', goal='Survivre à leur implant.', hq='swahilis', leaders=[], anti=False, secret=False, lore='', allies=[], enemies=[]),
      dict(id='noir', letter='', name='Marché Noir', desc="Organisme qui gère l'économie clandestine : informations, armes, faux papiers, mercenaires, technologies interdites.", founded=2055, hqText='partout', perception='Économie clandestine', goal="Contrôler l'économie parallèle.", hq='machrek', leaders=['030'], anti=False, secret=False, lore='', allies=[], enemies=[]),
    ]
    out = dict(states=states, factions=factions + extra, stones=stones, powers=powers, chars=chars, arcs=arcs)
    # zones FA : majorité par État d'origine
    zc = collections.defaultdict(collections.Counter)
    for c in chars: zc[c['origin']][c['zone']] += 1
    out['stateZone'] = {s['id']: (zc[s['id']].most_common(1)[0][0] if zc[s['id']] else None) for s in states}
    out['zones'] = sorted({c['zone'] for c in chars})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('états', len(states), 'factions', len(factions + extra), 'pouvoirs', len(powers), 'persos', len(chars), 'pierres', len(stones))
    print('persos avec pouvoir sans pouvoir extrait :', [(c['id'], c['name'], c['ptypes']) for c in missing][:40], len(missing))
    bad = [c for c in chars if c['origin'] not in {s['id'] for s in states}]
    print('origines inconnues :', set(c['origin'] for c in bad))
    for f in factions:
        print(f['id'], f['leaders'], [chars_name for chars_name in [next((c['name'] for c in chars if c['id'] == l), '?') for l in f['leaders']]])

main()
