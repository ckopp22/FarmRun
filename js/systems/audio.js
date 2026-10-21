import { loadSettings, saveSettings } from './save.js';

// Synthesized SFX and a tiny step-sequencer for music (no audio files). Unlocked on the first user gesture.
const settings = loadSettings();
let actx = null;
let musicName = null;
let timer = 0;
let step = 0;

export const audioSettings = () => settings;

const N = { C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, E5: 659, G5: 784, A2: 110, C3: 131, E3: 165, F3: 175, G3: 196 };
const SONGS = {
  farm:  { ms: 240, type: 'triangle', vol: 0.05, notes: [N.C4, N.E4, N.G4, N.E4, N.F4, N.A4, N.C5, N.A4, N.G4, N.B4, N.G4, N.D4, N.E4, N.G4, N.C5, 0] },
  woods: { ms: 330, type: 'sawtooth', vol: 0.025, notes: [N.A2, 0, N.A2, N.C3, N.E3, 0, N.C3, 0, N.A2, 0, N.F3, N.E3, N.G3, 0, N.E3, 0] },
};

function tone(freq, dur, type, vol, slideTo, delay) {
  if (!actx) return;
  const t = actx.currentTime + (delay || 0);
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(actx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const SFX = {
  tap:     () => tone(660, 0.08, 'square', 0.06),
  pickup:  () => tone(500, 0.14, 'square', 0.07, 1000),
  cash:    () => { tone(880, 0.1, 'square', 0.06); tone(1320, 0.18, 'square', 0.06, 0, 0.09); },
  upgrade: () => [N.C4, N.E4, N.G4, N.C5].forEach((f, i) => tone(f, 0.14, 'square', 0.06, 0, i * 0.08)),
  reveal:  () => [N.G4, N.C5, N.E5, N.G5].forEach((f, i) => tone(f, 0.16, 'triangle', 0.09, 0, i * 0.09)),
  alert:   () => { tone(900, 0.1, 'square', 0.07); tone(900, 0.1, 'square', 0.07, 0, 0.14); },
  caught:  () => tone(400, 0.5, 'sawtooth', 0.09, 70),
  win:     () => [N.C4, N.E4, N.G4, N.C5, N.G4, N.C5, N.E5, N.G5].forEach((f, i) => tone(f, 0.2, 'triangle', 0.09, 0, i * 0.11)),
  engine:  () => tone(70, 0.9, 'sawtooth', 0.05, 110),
};

export function sfx(name) {
  if (settings.sound && actx && SFX[name]) SFX[name]();
}
export const tapSound = () => sfx('tap');

function applyMusic() {
  clearInterval(timer);
  timer = 0;
  const song = SONGS[musicName];
  if (!settings.music || !song || !actx) return;
  step = 0;
  timer = setInterval(() => {
    const f = song.notes[step++ % song.notes.length];
    if (f) tone(f, song.ms / 1000 * 1.6, song.type, song.vol);
  }, song.ms);
}

export function setMusic(name) {
  if (name === musicName) return;
  musicName = name;
  applyMusic();
}

// Must be called from a user gesture (iOS).
export function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    if (!timer) applyMusic();
  } catch (e) { /* no audio available */ }
}

export function toggle(kind) {
  settings[kind] = !settings[kind];
  saveSettings(settings);
  if (kind === 'music') applyMusic();
  return settings[kind];
}

document.addEventListener('visibilitychange', () => {
  if (!actx) return;
  if (document.hidden) actx.suspend(); else actx.resume();
});
