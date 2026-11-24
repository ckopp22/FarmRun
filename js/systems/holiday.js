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
