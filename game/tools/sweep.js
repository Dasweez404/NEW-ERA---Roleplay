// Balayage : appelle directement les scènes difficiles d'accès et joue des parties au hasard très vite (dans la page).
const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2]; const browser = await chromium.launch(); const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n'))); page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + file);
  const res = await page.evaluate(() => {
    const out = []; const errs = []; window.addEventListener('error', e => errs.push(e.message));
    function bot(steps, prefer) {
      let n = 0; for (; n < steps; n++) {
        const bs = [...document.querySelectorAll('button.ch')].filter(b => !b.disabled && !/retraite|Quitter vers|Renvoyer|menu principal|Meilleurs/i.test(b.textContent));
        if (!bs.length) break; let pool = bs;
        if (prefer && Math.random() < 0.75) { const p = bs.filter(b => prefer.test(b.textContent)); if (p.length) pool = p; }
        try { pool[Math.floor(Math.random() * pool.length)].click(); } catch (e) { errs.push('CLICK ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join('|')); break; }
        if (typeof G === 'undefined' || !G || G.status !== 'play') break;
      } return n;
    }
    const mk = (o = {}) => { startGame({ pc: Object.assign({ name: 'Test', gender: 'F', age: 25, origin: 'albion', faction: 'vigilante', powers: ['surnaturel-exotiques-aura'], style: 'performer', attrs: { corps: 5, agilite: 5, intellect: 6, charisme: 6, maitrise: 7 }, grade: 0, money: 5000 }, o) }); };
    // 1. connectivité Orbitrail
    let bad = 0; DATA.states.forEach(a => DATA.states.forEach(b => { if (a.id !== b.id && !otRoute(a.id, b.id)) { bad++; } })); out.push('orbitrail routes manquantes: ' + bad);
    const stOk = DATA.states.every(s => stationOf(s.id)); out.push('52 stations: ' + stOk + ' (' + Object.keys(OT_ST).length + ')');
    // 2. tous les personnages jouables
    let nchar = 0; DATA.chars.forEach(c => { try { startGame(charToSpec(c)); hub(); nchar++; } catch (e) { errs.push('CHAR ' + c.id + ' ' + c.name + ' ' + e.message + (e.stack || '').split('\n')[1]); } }); out.push('persos démarrés: ' + nchar + '/' + DATA.chars.length);
    // 3. pouvoirs : tous valides
    let np = 0; DATA.powers.forEach(p => { if (p.tags && p.tags.length && p.sub && p.cat) np++; }); out.push('pouvoirs complets: ' + np + '/' + DATA.powers.length);
    // 4. parties au hasard rapides, divers profils
    const profiles = [{}, { faction: 'fa', powers: [], style: 'brawler' }, { faction: 'civils', powers: ['zoologique-carnivores-loup'], style: 'flanker' }, { faction: 'check', powers: ['elementaire-elements-feu'], style: 'brawler' }, { faction: 'uplift', powers: ['zoologique-oiseaux-corbeau', 'surnaturel-mentales-reseau'], style: 'engineer' }];
    profiles.forEach((p, i) => { mk(p); hub(); const n = bot(1500, /Missions|Accepter|Continuer|Partir|Frapper|Pouvoir|Voyager|Se battre|Marché|Recruter/); out.push(`profil ${i}: ${n} pas, sem ${G ? G.wk : '?'} statut ${G && G.status}`); });
    // 5. scènes ciblées
    mk({ grade: 4, faction: 'uplift', money: 90000 }); G.pc.merit = 999; hub(); G.pc.rep.uplift = 90;
    const tests = [['successionMenu', () => successionMenu()], ['leaderMenu', () => { G.pc.grade = 5; G.world.leader.uplift = 'pc'; leaderMenu(); }], ['attackMenu', () => attackMenu()], ['diplomacy', () => diplomacy()], ['assaultFA', () => { G.world.fac.uplift.power = 80; assaultFA(); }], ['council', () => EVENT_FN.council()], ['foundFaction', () => { G.pc.faction = 'check'; G.pc.grade = 3; G.pc.party.length || addAlly('062'); addAlly('073'); foundFaction(); }], ['captured', () => capturedScene('test')], ['capturedMenu', () => capturedMenu()], ['escape', () => escapeMenu()], ['fallen', () => { G.pc.flags.cap = null; becomeFallen(); hub(); fallenContract(); }], ['removeImplant', () => removeImplantMenu()], ['arena', () => arenaTournament(3)], ['stoneRaid', () => { fx({ stone: 'lumiere' }); fx({ stone: 'plante' }); EVENT_FN.stoneRaid(); }], ['neo', () => EVENT_FN.neo()], ['terrAttack', () => { G.world.terr.albion = 'pc'; EVENT_FN.terrAttack(); }], ['glyphLib', () => glyphLib()], ['stoneMenu', () => stoneMenu()], ['climate', () => climateEvent()], ['controle', () => controleFA(null)], ['trainMenu', () => trainMenu()], ['roleMenu', () => roleMenu()], ['shop', () => shopMenu()], ['recruit', () => recruitMenu()], ['travel', () => travelMenu()], ['relationGraph', () => relationGraph()], ['join', () => { G.pc.faction = 'civils'; joinMenu(); }], ['canon', () => { G.wk = 0; monthTick(); canonOffers(); }]];
    tests.forEach(([name, fn]) => { try { if (!G || G.status !== 'play') mk({ grade: 4, faction: 'uplift', money: 90000 }); fn(); const n = bot(40, null); out.push('test ' + name + ' ok (' + n + ')'); } catch (e) { errs.push('TEST ' + name + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join('|')); } });
    // 6. toutes les pierres
    mk({ money: 99999 }); DATA.stones.forEach(s => { if (G.status === 'play') { G.world.stoneClue[s.id] = true; G.loc = G.world.stoneLoc[s.id]; stoneAttempt(s.id); bot(25, /Voler|Convaincre|force|Expédition|Décipher|Déchiffrer|Continuer/i); } }); out.push('pierres après tentatives: ' + (G.pc ? Object.keys(G.pc.stones).length : 'n/a') + ' statut ' + (G && G.status));
    mk({}); DATA.stones.forEach(s => { if (G.status === 'play') fx({ stone: s.id }); }); out.push('16 pierres → statut: ' + (G.status) + ' stones ' + Object.keys(G.pc.stones).length); if (stoneCount() >= 16) endGame('win', '');
    return { out, errs };
  });
  console.log(res.out.join('\n')); if (res.errs.length || errors.length) { console.log('ERREURS:\n' + [...res.errs.slice(0, 15), ...errors.slice(0, 8)].join('\n')); process.exitCode = 1; } else console.log('SWEEP OK');
  await browser.close();
})();
