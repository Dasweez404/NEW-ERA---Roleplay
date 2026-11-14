"""Extrait l'Annuaire des Pouvoirs du PDF (texte brut pdftotext) -> structure Python."""
import re, subprocess, sys

HEADS = [
 ('zoologique','Oiseaux','Oiseaux (35)'),
 ('zoologique','Poissons','Poissons (34)'),
 ('zoologique','Insectes & Arthropodes','Insectes & Arthropodes (27)'),
 ('zoologique','Reptiles & Amphibiens','Reptiles & Amphibiens (25)'),
 ('zoologique','Invertébrés','Invertébrés (10)'),
 ('zoologique','Primates & Marsupiaux','Mammifères - Primates & Marsupiaux (17)'),
 ('zoologique','Cétacés & Pinnipèdes','Mammifères - Cétacés & Pinnipèdes (10)'),
 ('zoologique','Rongeurs & Insectivores','Mammifères - Rongeurs & Insectivores (20)'),
 ('zoologique','Ongulés & Artiodactyles','Mammifères - Ongulés et Artiodactyles (29)'),
 ('zoologique','Carnivores','Mammifères - Carnivores (37)'),
 ('surnaturel','Matière','Capacités de matière'),
 ('surnaturel','Corporelles','Capacités corporelles'),
 ('surnaturel','Mentales','Capacités mentales'),
 ('surnaturel','Physiques','Capacités physiques'),
 ('surnaturel','Manipulation','Capacités de manipulation'),
 ('surnaturel','Exotiques','Capacités exotiques'),
 ('elementaire','Éléments','Élémentaires :'),
]

def parse(pdf):
    raw = subprocess.run(['pdftotext','-f','21','-l','34',pdf,'-'],capture_output=True,text=True).stdout
    raw = raw[raw.index('Oiseaux (35)'):]
    raw = re.sub(r'\n\d{2}\n','\n',raw)
    raw = raw.replace('\x0c','\n')
    pos=[]
    for typ,cat,h in HEADS:
        i=raw.find(h)
        if i<0: raise SystemExit('missing head '+h)
        pos.append((i,typ,cat,h))
    pos.sort()
    out=[]
    for k,(i,typ,cat,h) in enumerate(pos):
        end=pos[k+1][0] if k+1<len(pos) else len(raw)
        sec=raw[i+len(h):end]
        parts=re.split(r'Porteur\s*:\s*((?:\d+\s*&\s*)*\d+)',sec)
        parent=None
        for j in range(0,len(parts)-1,2):
            pre,ids=parts[j],parts[j+1]
            blocks=[b.strip() for b in re.split(r'(?m)^(?=[A-ZÉÈÀÂ][^\n:]{1,38}\s?:\s)',pre) if b.strip()]
            ents=[]
            for b in blocks:
                m=re.match(r'([^\n:]{1,40}?)\s?:\s(.*)',b,re.S)
                if m: ents.append((m.group(1).strip(),re.sub(r'\s+',' ',m.group(2)).strip()))
            if not ents: continue
            *pars,(name,desc)=ents
            for pn,pd in pars:
                if not pn.startswith('Forme'): parent=(pn,pd)
            full=name
            if name.startswith('Forme') and parent: full=parent[0]+' – '+name
            elif not name.startswith('Forme'): parent=None
            carriers=[c.zfill(3) for c in re.findall(r'\d+',ids)]
            out.append(dict(type=typ,cat=cat,name=full,desc=desc,carriers=carriers))
    # corrections manuelles : entrées coupées par les colonnes du PDF
    for r in out:
        if r['name']=='Forme flore': r['name']='Nature – Forme flore'
    out.append(dict(type='surnaturel',cat='Exotiques',name='Nature – Forme faune',desc='avec tous les animaux autour de soi.',carriers=['163']))
    return out

if __name__=='__main__':
    res=parse(sys.argv[1])
    import collections
    c=collections.Counter((r['type'],r['cat']) for r in res)
    for k,v in c.items(): print(k,v)
    print(len(res))
    if len(sys.argv)>2:
        for r in res:
            if r['cat']==sys.argv[2] or sys.argv[2]=='*': print(r['name'],r['carriers'])
