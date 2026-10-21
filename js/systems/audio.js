import { loadSettings, saveSettings } from './save.js';

// Synthesized SFX and mp3 music tracks. Unlocked on the first user gesture.
const settings = loadSettings();
let actx = null;
let musicName = null;

export const audioSettings = () => settings;

const N = { C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, G5: 784, A2: 110, C3: 131, E3: 165, F3: 175, G3: 196 };
const TRACKS = {
  farm:  { files: ['audio/acoustic1.mp3', 'audio/acoustic2.mp3'], vol: 0.12 },
  woods: { files: ['audio/chase.mp3'], vol: 0.25 },
};
// Sampled sound effects, decoded on first unlock. Names without a sample fall back to the synth SFX below.
const SAMPLES = {
  cash:  { file: 'audio/cash.mp3', vol: 0.5 },
  door:  { file: 'audio/car-door.mp3', vol: 0.55 },
  deny:  { file: 'audio/deny.mp3', vol: 0.8 },
  drive: { file: 'audio/drive.mp3', vol: 0.55 },
  walk:  { file: 'audio/walking.mp3', vol: 0.5 },
};
const buffers = {};
const loops = {};
const player = new Audio();
let fadeTimer = 0;
let trackIdx = 0;
player.addEventListener('ended', () => {
  const track = TRACKS[musicName];
  if (!track) return;
  trackIdx = (trackIdx + 1) % track.files.length;
  player.src = track.files[trackIdx];
  player.play().catch(() => {});
});

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

function loadSamples() {
  for (const [name, s] of Object.entries(SAMPLES)) {
    if (buffers[name]) continue;
    fetch(s.file).then((r) => r.arrayBuffer()).then((b) => actx.decodeAudioData(b)).then((buf) => { buffers[name] = buf; }).catch(() => {});
  }
}

function playSample(name, loop) {
  const src = actx.createBufferSource(), g = actx.createGain();
  src.buffer = buffers[name];
  src.loop = !!loop;
  g.gain.value = SAMPLES[name].vol;
  src.connect(g).connect(actx.destination);
  src.start();
  return { src, g };
}

export function sfx(name) {
  if (!settings.sound || !actx) return;
  if (buffers[name]) playSample(name);
  else if (SFX[name]) SFX[name]();
}

// Looping sample (e.g. footsteps) switched on and off by state; stops with a short fade.
export function setLoop(name, on) {
  if (!actx) return;
  const l = loops[name];
  if (on && settings.sound && buffers[name]) {
    if (!l) loops[name] = playSample(name, true);
  } else if (l) {
    l.g.gain.setTargetAtTime(0, actx.currentTime, 0.04);
    l.src.stop(actx.currentTime + 0.25);
    delete loops[name];
  }
}
export const tapSound = () => sfx('tap');

function fadeTo(vol, ms, done) {
  clearInterval(fadeTimer);
  const from = player.volume, t0 = performance.now();
  fadeTimer = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    player.volume = from + (vol - from) * k;
    if (k === 1) { clearInterval(fadeTimer); if (done) done(); }
  }, 30);
}

function startTrack() {
  const track = TRACKS[musicName];
  player.pause();
  if (!settings.music || !track || !actx) return;
  trackIdx = 0;
  player.src = track.files[0];
  player.volume = 0;
  player.play().catch(() => {});
  fadeTo(track.vol, 2500);
}

function applyMusic(fade) {
  clearInterval(fadeTimer);
  if (fade && !player.paused) fadeTo(0, 1500, startTrack);
  else startTrack();
}

export function setMusic(name) {
  if (name === musicName) return;
  musicName = name;
  applyMusic(true);
}

// Must be called from a user gesture (iOS).
export function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    loadSamples();
    if (player.paused) applyMusic();
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
  if (document.hidden) { actx.suspend(); player.pause(); } else { actx.resume(); if (settings.music && TRACKS[musicName]) player.play().catch(() => {}); }
});
