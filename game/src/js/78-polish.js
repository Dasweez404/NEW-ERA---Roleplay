// ───────── Prise en main guidée (une seule fois) et ambiance de couleur par ville ─────────
const TUTO = {
  contrats: ['Chaque ville commence par des contrats.', 'Choisis-en un, ou touche « Se faire petit ».'],
  trame: ['Voici un événement de la trame.', 'Choisis une option : un dé décide. Le pourcentage indique tes chances.'],
  combat: ['Pas de combat : des décisions.', 'À chaque étape, tu choisis comment réagir. Tes attributs jugent (le % montre tes chances) ; ton pouvoir, ta classe de pouvoir et ton rôle ouvrent des options en plus.'],
  ville: ['Tu es en ville.', 'Tu as une seule action ici (repos, marché, recruter, s’entraîner), puis tu repars. La station voisine est toujours gratuite.'],
  voyage: ['Choisis ta destination.', 'Touche une ville sur la carte, puis touche-la encore pour partir. Le 💎 marque un indice sur une pierre.']
};
function tutoSeen(id) { try { return !!JSON.parse(localStorage.getItem('ne_tuto') || '{}')[id]; } catch (e) { return false; } }
function tutoMark(id) { try { const o = JSON.parse(localStorage.getItem('ne_tuto') || '{}'); o[id] = 1; localStorage.setItem('ne_tuto', JSON.stringify(o)); } catch (e) { } }
function coach(id) { if (TUTO[id] && !tutoSeen(id)) UI.nextCoach = id; }
function coachEl(id) { const [t, d] = TUTO[id]; return h('div', { class: 'coach' }, h('span', { class: 'ci' }, '💡'), h('div', { class: 'ct' }, h('b', {}, t), h('span', {}, d)), h('button', { onclick: e => { tutoMark(id); e.currentTarget.closest('.coach').remove(); } }, 'OK')); }
// couleur d'ambiance : une teinte par zone, légèrement décalée par ville
function ambiance() {
  if (!G || !G.loc || !DATA.zones) return;
  const z = DATA.stateZone[G.loc]; const zi = Math.max(0, DATA.zones.indexOf(z)); const hue = Math.round((zi * 360 / DATA.zones.length + 200 + (hashStr(G.loc) % 17)) % 360);
  const r = document.documentElement.style; r.setProperty('--amb', `hsl(${hue} 88% 60%)`); r.setProperty('--ambbg', `hsl(${hue} 55% 7%)`);
}
