// December-only holiday event.
export const isHoliday = () => new Date().getMonth() === 11;

const dayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
export const PRESENT_GOAL = 5;
// Presents earned today (the count resets each day).
export const presentsToday = (save) => (save && save.xmas && save.xmas.day === dayKey() ? save.xmas.n : 0);
export function addPresent(save) {
  if (!save) return;
  save.xmas = { ...(save.xmas || {}), day: dayKey(), n: Math.min(PRESENT_GOAL, presentsToday(save) + 1) };
}

export const claimedToday = (save) => !!(save && save.xmas && save.xmas.claimed === dayKey());
const SHIRTS = [0x2e86de, 0x27ae60, 0x8e44ad, 0xf39c12, 0xe84393, 0x16a085, 0x2c3e50];
// Pick today's prize and apply it to the save. Returns { text, kind, color }.
export function claimPrize(save, canPen) {
  const roll = Math.random();
  let prize;
  if (roll < 0.4 || (!canPen && roll < 0.7)) {
    const amt = [500, 1000, 2500][Math.floor(Math.random() * 3)];
    save.money += amt;
    prize = { kind: 'money', text: '$' + amt.toLocaleString() };
  } else if (roll < 0.7) {
    save.pens = (save.pens || 0) + 1;
    prize = { kind: 'pen', text: 'A new animal pen!' };
  } else {
    const opts = SHIRTS.filter((c) => c !== save.shirt);
    save.shirt = opts[Math.floor(Math.random() * opts.length)];
    prize = { kind: 'shirt', text: 'A new shirt color!', color: '#' + save.shirt.toString(16).padStart(6, '0') };
  }
  save.xmas = { ...(save.xmas || {}), claimed: dayKey() };
  return prize;
}
