// Test de fumée : joue au hasard dans un vrai navigateur et signale toute erreur JavaScript.
// usage : node autoplay.js <chemin new-era.html> [pas=600] [mode=custom|random|leader] [seed]
const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2], steps = +(process.argv[3] || 600), mode = process.argv[4] || 'custom';
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + file);
  const click = async (re) => { const b = page.locator('button.ch:not([disabled])', { hasText: re }).first(); if (await b.count()) { await b.click(); return true; } return false; };
  await click(/Nouvelle partie/);
  if (mode === 'custom') { await click(/Personnage customisé/); await click(/Tout|Suivant|Au hasard/); }
  else if (mode === 'leader') { await click(/Choisir un personnage/); await click(/Vigilante/); await click(/^Ora/); await click(/^Jouer/); }
  else { await click(/au hasard/); await click(/^Jouer/); }
  let last = '';
  for (let i = 0; i < steps && errors.length === 0; i++) {
    const info = await page.evaluate(() => { const t = document.querySelector('.scene .title'); const bs = [...document.querySelectorAll('button.ch')]; return { title: t ? t.textContent : '', n: bs.length, en: bs.filter(b => !b.disabled).length, st: typeof G !== 'undefined' && G ? G.status : 'x' }; });
    last = info.title;
    if (info.st !== 'play' && info.title && /Retraite|LES 16|Fin de ta route/.test(info.title)) { console.log('FIN :', info.title, 'après', i, 'pas'); break; }
    if (info.en === 0) { console.log('Aucun choix actif à', info.title); await page.screenshot({ path: '/tmp/stuck.png' }); break; }
    // choix pondéré : éviter la retraite
    const idx = await page.evaluate(() => { const bs = [...document.querySelectorAll('button.ch')].map((b, i) => [b, i]).filter(([b]) => !b.disabled && !/retraite|Quitter|Renvoyer|menu/i.test(b.textContent)); if (!bs.length) return -1; return bs[Math.floor(Math.random() * bs.length)][1]; });
    if (idx < 0) { await page.locator('button.ch:not([disabled])').first().click(); continue; }
    await page.locator('button.ch').nth(idx).click();
  }
  const st = await page.evaluate(() => (typeof G !== 'undefined' && G && G.pc) ? { wk: G.wk, grade: G.pc.grade, hp: G.pc.hp, money: G.pc.money, heat: G.pc.heat, stones: Object.keys(G.pc.stones).length, party: G.pc.party.length, faction: G.pc.faction, missions: G.pc.missions, status: G.status } : null);
  console.log('Dernier écran :', last, JSON.stringify(st));
  if (errors.length) { console.log('ERREURS :\n' + errors.join('\n')); await page.screenshot({ path: '/tmp/err.png' }); process.exitCode = 1; } else console.log('OK : aucune erreur JS');
  await browser.close();
})();
