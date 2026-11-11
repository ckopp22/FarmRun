// localStorage wrapper: 3 save slots + global settings. All access is try/catch'd.
import { ANIMALS, START_PENS } from '../data/animals.js';

const VERSION = 1;
const SLOTS = 3;
const SETTINGS_KEY = 'farmrun_settings';

const slotKey = (n) => 'farmrun_slot_' + n;
const nameKey = (n) => 'farmrun_slotname_' + n;

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked or full */ }
}

export function newSave() {
  return { v: VERSION, money: 0, owned: {}, discovered: {}, upgrades: {}, pens: 0, desert: false, pens2: 0, winter: false, pens3: 0, runs: 0, playTime: 0, lastPlayed: Date.now() };
}

export function loadSlot(n) {
  const d = read(slotKey(n));
  if (!d || typeof d.v !== 'number') return null;
  const save = Object.assign(newSave(), d);
  if (d.pens === undefined) {   // older saves: keep every pen that held a discovered animal
    const top = ANIMALS.reduce((m, a, i) => (save.discovered[a.id] ? i : m), -1);
    save.pens = Math.max(0, top + 1 - START_PENS);
  }
  return save;
}

export function listSlots() {
  const out = [];
  for (let n = 1; n <= SLOTS; n++) out.push(loadSlot(n));
  return out;
}

let active = null;   // { n, data }

export function startSlot(n) {
  const data = loadSlot(n) || newSave();
  active = { n, data };
  saveActive();
  return data;
}

export function activeSave() { return active && active.data; }

export function saveActive() {
  if (!active) return;
  active.data.lastPlayed = Date.now();
  write(slotKey(active.n), active.data);
}

export function slotName(n) { return read(nameKey(n)) || 'Slot ' + n; }

export function setSlotName(n, name) {
  const t = String(name || '').trim().slice(0, 20);
  if (t) write(nameKey(n), t);
  else try { localStorage.removeItem(nameKey(n)); } catch (e) { /* ignore */ }
}

export function deleteSlot(n) {
  try { localStorage.removeItem(slotKey(n)); localStorage.removeItem(nameKey(n)); } catch (e) { /* ignore */ }
  if (active && active.n === n) active = null;
}

export function loadSettings() {
  return Object.assign({ sound: true, music: true, fps: false }, read(SETTINGS_KEY));
}

export function saveSettings(s) { write(SETTINGS_KEY, Object.assign(read(SETTINGS_KEY) || {}, s)); }
