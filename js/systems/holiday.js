// Holiday event (always on).
export const isHoliday = () => true;

const dayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
export const PRESENT_GOAL = 5;
// Presents earned today (the count resets each day).
export const presentsToday = (save) => (save && save.xmas && save.xmas.day === dayKey() ? save.xmas.n : 0);
export function addPresent(save) {
  if (!save) return;
  save.xmas = { ...(save.xmas || {}), day: dayKey(), n: Math.min(PRESENT_GOAL, presentsToday(save) + 1) };
}

export const claimedToday = (save) => !!(save && save.xmas && save.xmas.claimed === dayKey());
export const DEFAULT_SHIRT = 0xc0392b;
export const HAWAII = 0x1fa8b8;
export const SHIRTS = [0x2e86de, 0x27ae60, 0x8e44ad, 0xf39c12, 0xe84393, 0x16a085, 0x2c3e50, 'hawaiian'];
export const HATS = { none: 'No Hat', cap: 'Baseball Cap', santa: 'Santa Hat', blonde: 'Long Blonde Hair', flower: 'Flower Crown',
  cowboy: 'Cowboy Hat', tophat: 'Top Hat', crown: 'Gold Crown', beanie: 'Winter Beanie', antlers: 'Reindeer Antlers', bunny: 'Bunny Ears', party: 'Party Hat', propeller: 'Propeller Cap' };
export const FACES = { shades: 'Sunglasses', glasses: 'Round Glasses', stache: 'Mustache' };
// Arguments for makeFarmer(): shirt color, (unused hat color), look { hat, hawaiian }.
export function farmerArgs(save) {
  const sh = save && save.shirt;
  return [typeof sh === 'number' ? sh : sh === 'hawaiian' ? HAWAII : undefined, undefined, { hat: save && save.hat, face: save && save.face, hawaiian: sh === 'hawaiian' }];
}
// Pick today's prize and apply (and equip) it. Returns { text, kind, color }.
export function claimPrize(save) {
  const leftShirts = SHIRTS.filter((c) => !(save.shirts || []).includes(c));
  const leftHats = Object.keys(HATS).filter((h) => !(save.hats || []).includes(h));
  const leftFaces = Object.keys(FACES).filter((f) => !(save.faces || []).includes(f));
  const opts = [['money', 0.35], leftShirts.length && ['shirt', 0.2], leftHats.length && ['hat', 0.3], leftFaces.length && ['face', 0.15]].filter(Boolean);
  let r = Math.random() * opts.reduce((a, o) => a + o[1], 0), kind = 'money';
  for (const [k, w] of opts) { r -= w; if (r <= 0) { kind = k; break; } }
  let prize;
  if (kind === 'face') {
    save.face = leftFaces[Math.floor(Math.random() * leftFaces.length)];
    save.faces = [...(save.faces || []), save.face];
    prize = { kind, text: FACES[save.face] + '!' };
  } else if (kind === 'shirt') {
    save.shirt = leftShirts[Math.floor(Math.random() * leftShirts.length)];
    save.shirts = [...(save.shirts || []), save.shirt];
    prize = save.shirt === 'hawaiian' ? { kind, text: 'A Hawaiian shirt!', color: '#1fa8b8' } : { kind, text: 'A new shirt color!', color: '#' + save.shirt.toString(16).padStart(6, '0') };
  } else if (kind === 'hat') {
    save.hat = leftHats[Math.floor(Math.random() * leftHats.length)];
    save.hats = [...(save.hats || []), save.hat];
    prize = { kind, text: HATS[save.hat] + '!' };
  } else {
    const m = Math.random(), amt = m < 0.6 ? 50000 : m < 0.9 ? 500000 : 1000000;
    save.money += amt;
    prize = { kind: 'money', text: '$' + amt.toLocaleString() };
  }
  save.xmas = { ...(save.xmas || {}), claimed: dayKey() };
  return prize;
}
