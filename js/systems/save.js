// localStorage wrapper: 4 save slots + global settings. All access is try/catch'd.
const VERSION = 1;
const SLOTS = 4;
const SETTINGS_KEY = 'farmrun_settings';

const slotKey = (n) => 'farmrun_slot_' + n;

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
  return { v: VERSION, money: 0, owned: {}, discovered: {}, upgrades: {}, runs: 0, playTime: 0, lastPlayed: Date.now() };
}

export function loadSlot(n) {
  const d = read(slotKey(n));
  if (!d || typeof d.v !== 'number') return null;
  return Object.assign(newSave(), d);
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

export function deleteSlot(n) {
  try { localStorage.removeItem(slotKey(n)); } catch (e) { /* ignore */ }
  if (active && active.n === n) active = null;
}

export function loadSettings() {
  return Object.assign({ sound: true, music: true }, read(SETTINGS_KEY));
}

export function saveSettings(s) { write(SETTINGS_KEY, Object.assign(read(SETTINGS_KEY) || {}, s)); }
