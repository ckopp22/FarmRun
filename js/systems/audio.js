import { loadSettings, saveSettings } from './save.js';

// Sound/music state + Web Audio unlock. Real sounds and music arrive in the polish phase.
const settings = loadSettings();
let actx = null;

export const audioSettings = () => settings;

// Must be called from a user gesture (iOS).
export function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { /* no audio available */ }
}

export function toggle(kind) {
  settings[kind] = !settings[kind];
  saveSettings(settings);
  return settings[kind];
}

export function tapSound() {
  if (!settings.sound || !actx) return;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.frequency.value = 660;
  g.gain.setValueAtTime(0.08, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.08);
  o.connect(g).connect(actx.destination);
  o.start();
  o.stop(actx.currentTime + 0.09);
}

document.addEventListener('visibilitychange', () => {
  if (!actx) return;
  if (document.hidden) actx.suspend(); else if (settings.sound || settings.music) actx.resume();
});
