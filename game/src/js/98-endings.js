// ───────── Autres fins que les 16 pierres ─────────
// Chaque fin a ses conditions, visibles dans l'onglet Perso ; quand elles sont réunies, une tuile « Conclure » apparaît en ville.
const ENDINGS = [
  { id: 'conquete', ic: '👑', n: 'Hégémonie', d: 'Diriger ta faction et tenir 7 territoires.',
    prog: () => { const pc = G.pc; return [['Chef de ta faction', G.world.leader[pc.faction] === 'pc' ? 1 : 0, 1], ['Territoires', ownedStates().length, 7]]; },
    title: '👑 HÉGÉMONIE', text: ['Sept territoires, une seule bannière. Les anciennes frontières ne signifient plus rien : c’est ta faction qui fixe les règles, les routes et les prix. On dira que tu as unifié le monde. D’autres diront que tu l’as conquis. Les deux ont raison.'] },
  { id: 'alliance', ic: '🕊', n: 'Grande Alliance', d: 'Allié avec 8 factions, au plus 2 ennemis déclarés, rang ▲4.',
    prog: () => { const pf = G.pc.faction; const ids = WAR_FAC().filter(f => f !== pf); return [['Factions alliées', ids.filter(f => relation(pf, f) >= 2).length, 8], ['Rang', Math.min(G.pc.grade, 4), 4], ['Ennemis déclarés (max 2)', Math.min(3, enemiesOf(pf).length), 2, true]]; },
    title: '🕊 LA GRANDE ALLIANCE', text: ['Huit bannières autour d’une même table : rivaux d’hier, alliés de demain. Les pierres restent où elles sont, endormies. La guerre des porteurs n’aura pas lieu, parce que quelqu’un a eu la patience de la désamorcer. Ce quelqu’un, c’est toi.'] },
  { id: 'liberation', ic: '☀', n: 'Chute de la Force d’Autorité', d: 'Faire tomber 3 bases de la F.A., rang ▲4.',
    prog: () => [['Bases de la F.A. tombées', G.pc.flags.faFall || 0, 3], ['Rang', Math.min(G.pc.grade, 4), 4]],
    title: '☀ LA CHUTE DU NOUVEAU RÉGIME', text: ['La troisième base tombe. Les mechas s’éteignent un à un, les doyens négocient leur reddition. Sans la Force d’Autorité, les porteurs marchent à visage découvert pour la première fois depuis des années. Le protocole ANTI se termine ici.'] },
  { id: 'sceau', ic: '🔒', n: 'Le Sceau', d: 'Réunir 8 pierres et sceller leur pouvoir (moralité de Protecteur).',
    prog: () => [['Pierres antiques', stoneCount(), 8], ['Moralité de Protecteur (6+)', Math.max(0, Math.min(karma(), 6)), 6]],
    title: '🔒 LE SCEAU', text: ['Huit pierres posées en cercle. Tu ne les prends pas : tu les scelles. L’ogénite se tait, les royaumes éteints peuvent enfin dormir. Aucun détenteur ne pourra plus remodeler le monde, ni pour le meilleur ni pour le pire. Une fin sans gloire, et sans regrets.'] },
];
const endingDone = e => e.prog().every(([, v, t, inv]) => inv ? v <= t : v >= t);
const availableEndings = () => (G && G.pc && G.status === 'play') ? ENDINGS.filter(endingDone) : [];
function endingsBox() {
  const box = h('div', { class: 'endbox' }, h('b', {}, '🏁 Autres fins possibles'));
  ENDINGS.forEach(e => { const p = e.prog(); const ok = endingDone(e); box.append(h('div', { class: 'endrow' + (ok ? ' ok' : '') }, h('div', {}, h('b', {}, `${e.ic} ${e.n}`), h('div', { class: 'small mut' }, e.d)), h('div', { class: 'small' }, p.map(([k, v, t, inv]) => `${k} ${v}/${t}`).join(' · '))));});
  box.append(h('div', { class: 'small mut' }, 'Les 16 pierres restent la victoire ultime.'));
  return box;
}
function endingTile(L) {
  availableEndings().forEach(e => L.push(C(`Conclure : ${e.n}`, () => show({ kicker: 'FIN POSSIBLE', title: `${e.ic} ${e.n}`, text: [...e.text.slice(0, 1), 'Tu peux conclure ta partie ici. Le score compte comme une victoire.'], choices: [C('Conclure la partie', () => endGame('win', e.id), { cls: 'cta', ic: '🏁', heavy: 'La partie se termine pour de bon.' }), C('Pas maintenant', () => cityMenu(), { cls: 'back' })] }), { ic: e.ic, sub: 'Terminer la partie par cette fin.', cls: 'cta' })));
}
