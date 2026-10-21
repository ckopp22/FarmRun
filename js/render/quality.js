// Global graphics setting (Low / Medium / High). Persisted separately from save slots.
const KEY = 'farmrun_settings';
const LEVELS = {
  low:    { pixelRatio: 1,   trees: 100 },
  medium: { pixelRatio: 1.5, trees: 200 },
  high:   { pixelRatio: 2,   trees: 200 },
};

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}

function write(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* storage unavailable */ }
}

function detect() {
  const cores = navigator.hardwareConcurrency || 4;
  return cores >= 6 ? 'high' : cores >= 4 ? 'medium' : 'low';
}

let current = (() => {
  const urlQ = new URLSearchParams(location.search).get('quality');   // ?quality=low for testing
  const saved = read();
  const q = LEVELS[urlQ] ? urlQ : LEVELS[saved.quality] ? saved.quality : detect();
  if (q !== saved.quality) write({ ...saved, quality: q });
  return q;
})();

export const getQuality = () => current;
export const quality = () => LEVELS[current];
export const pixelRatio = () => Math.min(window.devicePixelRatio || 1, quality().pixelRatio);

export function setQuality(name) {
  if (!LEVELS[name]) return;
  current = name;
  write({ ...read(), quality: name });
}
