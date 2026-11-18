// Test de fumée : lance une partie puis clique au hasard dans un vrai navigateur ; signale toute erreur JavaScript.
// usage : node game/tools/autoplay.js <chemin new-era.html> [pas=600]
const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2], steps = +(process.argv[3] || 600);
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + file);
  await page.evaluate(() => { startGame(charToSpec(DATA.chars[Math.floor(Math.random() * DATA.chars.length)])); G.fresh = false; hub(); });
  let n = 0, last = '', idle = 0;
  for (; n < steps; n++) {
    const st = await page.evaluate(() => {
      document.querySelectorAll('.splash,.coach,.vfx').forEach(e => e.remove());
      if (typeof G === 'undefined' || !G || G.status !== 'play') return 'fin';
      const bs = [...document.querySelectorAll('button.ch:not([disabled]), button.qgo, button.lvcard:not(.dim)')].filter(b => !/retraite|menu principal|Meilleurs/i.test(b.textContent));
      if (!bs.length) return 'vide'; bs[Math.floor(Math.random() * bs.length)].click(); return (UI.scene && (UI.scene.kicker || UI.scene.title)) || '';
    });
    if (st === 'fin') { last = st; break; }
    if (st === 'vide') { last = st; if (++idle > 12) break; await page.waitForTimeout(500); continue; } idle = 0; last = st;
  }
  console.log(`${n} pas joués · dernier écran : ${last}`);
  console.log(errors.length ? 'ERREURS :\n' + errors.join('\n') : 'OK : aucune erreur JS');
  await browser.close(); process.exit(errors.length ? 1 : 0);
})();
