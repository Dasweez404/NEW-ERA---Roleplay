// Simulation : un bot cherche à réunir les 16 pierres. usage : node game/tools/stonebot.js <html> [parties=3] [pasMax=3000] [faction]
const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2], games = +(process.argv[3] || 3), maxSteps = +(process.argv[4] || 3000), fac = process.argv[5] || '';
  const browser = await chromium.launch(); const out = [];
  for (let g = 0; g < games; g++) {
    const page = await browser.newPage({ viewport: { width: 430, height: 900 } }); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + file);
    await page.evaluate(f => { try { localStorage.clear(); } catch (e) { } const pool = f ? DATA.chars.filter(c => c.faction === f) : DATA.chars.filter(c => c.stars <= 3); startGame(charToSpec(pool[Math.floor(Math.random() * pool.length)])); G.fresh = false; window.__fights = 0; window.__hpLoss = []; const s0 = startCombat; hub(); }, fac);
    let steps = 0, idle = 0; const marks = [];
    for (; steps < maxSteps; steps++) {
      const st = await page.evaluate(() => {
        document.querySelectorAll('.splash,.coach,.vfx').forEach(e => e.remove());
        if (!G || G.status !== 'play') return 'fin';
        const pc = G.pc, W = G.world;
        // écran de niveau : tout répartir
        const lv = document.querySelector('.lvact button'); if (lv) { lv.click(); return 'lv'; }
        // combat : contre l'intention sinon premier geste
        if (typeof CB !== 'undefined' && CB && !CB.over && !CB.preview ) {
          const mv = moves(); const ok = mv.filter(m => !m.lock && !(m.cost && pc.en < m.cost)); let m = ok.find(x => isCounter(x)) || ok.find(x => x.cat === 'pw' && pc.en >= (x.cost || 0) && Math.random() < 0.5) || ok[0] || mv[0];
          if (pc.hp < pc.hpMax * 0.35 && hasItem('kit') && !CB.noItems) { play({ kind: 'item', item: 'kit', sev: 0.4 }); return 'combat'; }
          play(m); return 'combat';
        }
        // carte : aller vers une pierre connue (indice niveau 2+), sinon destination recommandée
        if (UI.scene && UI.scene.kicker === 'Orbitrail') {
          const tgt = DATA.stones.filter(s => !pc.stones[s.id] && (W.stoneLv[s.id] || 0) >= 2 && W.stoneLoc[s.id] !== G.loc).map(s => W.stoneLoc[s.id]);
          const cand = tgt.length ? tgt : DATA.states.map(s => s.id).filter(i => i !== G.loc && !closureOf(i));
          const free = new Set(neighbors(G.loc)); const price = i => { const r = otRoute(G.loc, i); return r ? (free.has(i) ? 0 : r.cost) : 1e9; };
          const aff = cand.filter(i => price(i) <= pc.money); const pool = aff.length ? aff : DATA.states.map(s => s.id).filter(i => i !== G.loc && !closureOf(i) && price(i) <= pc.money);
          if (pool.length) { const to = pool[Math.floor(Math.random() * pool.length)]; const r = otRoute(G.loc, to); if (free.has(to)) r.cost = 0; travelGo(to, r, 1 + Math.floor((r.hops - 1) / 4)); return 'travel'; }
          const back = [...document.querySelectorAll('button.ch')].find(b => /Retour/.test(b.textContent)); if (back) { back.click(); return 'back'; }
        }
        if (UI.scene && /march|vendre|boutique|recruter|entra|moyen|diplomat/i.test((UI.scene.kicker||'') + ' ' + (UI.scene.title||''))) { const bk = [...document.querySelectorAll('button.ch')].find(b => /Retour|←/.test(b.textContent)); if (bk) { bk.click(); return 'back'; } }
        const bs = [...document.querySelectorAll('button.ch:not([disabled]), button.qgo, button.lvcard:not(.dim)')].filter(b => !/retraite|menu principal|Meilleurs|Se rendre/i.test(b.textContent));
        if (!bs.length) return 'vide';
        const score = b => { const t = b.textContent.toLowerCase(); let s = Math.random() * 2; if (/pierre|enquête|indice|récupérer|temple|glyphe|rumeur|expédition|assaut/.test(t)) s += 6; if (/contrat|mission|épreuve/.test(t)) s += 2; if (/march[ée]|recruter|entra[iî]n|diplomat|planque/.test(t)) s -= 6; if (b.classList.contains('cta') || b.classList.contains('safe')) s += 1.5; if (G.pc.hp < G.pc.hpMax * 0.6 && /repos|dormir|soigner|se reposer|kit|nanosoin/.test(t)) s += 7; if (/fuir|retour|passer ton chemin|←/.test(t)) s -= 3; if (/dernière poursuite|abandonner/.test(t)) s -= 5; return s; };
        bs.sort((a, b) => score(b) - score(a)); bs[0].click(); return 'ok';
      });
      if (st === 'fin') break;
      if (st === 'vide') { if (++idle > 15) break; await page.waitForTimeout(300); continue; } idle = 0;
      if (steps % 100 === 0) marks.push(await page.evaluate(() => ({ wk: G.wk, st: stoneCount(), P: +pcPower().toFixed(1), g: G.pc.grade, d: G.pc.flags.dest || 0, sc: ((UI.scene && (UI.scene.kicker + ' | ' + UI.scene.title)) || '') + ' || ' + [...document.querySelectorAll('button.ch,button.qgo')].slice(0, 4).map(b => b.textContent.slice(0, 24)).join(' ; ') })));
    }
    const res = await page.evaluate(() => { const E = TELE.ev; const c0 = E.filter(e => e.k === 'cb0'), c1 = E.filter(e => e.k === 'cb1'); let hl = 0; const n = Math.min(c0.length, c1.length); for (let i = 0; i < n; i++) hl += Math.max(0, (c0[i].hp || 0) - (c1[i].hp || 0)) / Math.max(1, c0[i].hpM || 1); const outs = {}; c1.forEach(e => outs[e.out] = (outs[e.out] || 0) + 1);
      return { status: G.status, wk: G.wk, mois: Math.round(G.wk / 4), stones: stoneCount(), grade: G.pc.grade, P: +pcPower().toFixed(1), dest: G.pc.flags.dest || 0, combats: c0.length, hpPerCombat: n ? Math.round(100 * hl / n) + '%' : '-', outs, scenes: E.filter(e => e.k === 'scene').length, fac: G.pc.faction, attrs: G.pc.attrs }; });
    out.push(Object.assign({ steps, errs: errs.length }, res)); console.log(JSON.stringify(Object.assign({ steps, errs: errs.slice(0, 2) }, res)), '\n  progression', JSON.stringify(marks.map(m => `${m.st}p/P${m.P}/g${m.g}/s${m.wk} ${m.sc}`)));
    await page.close();
  }
  await browser.close();
})();
