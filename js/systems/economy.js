import { UPGRADES, ANIMALS, START_PENS, PEN_COSTS, DESERT_COST, SAFARI_ANIMALS, SAFARI_PEN_COSTS, WINTER_COST, WINTER_ANIMALS, WINTER_PEN_COSTS } from '../data/animals.js';
import { saveActive } from './save.js';

const BASE_CAPACITY = 3;

export const level = (save, id) => (save.upgrades && save.upgrades[id]) || 0;

export const capacity = (save) => BASE_CAPACITY + level(save, 'bag');
export const speedMult = (save) => 1 + 0.1 * Math.min(3, level(save, 'shoes')) + 0.05 * Math.max(0, level(save, 'shoes') - 3);

export function nextCost(save, id) {
  const u = UPGRADES.find((x) => x.id === id);
  return u.costs[level(save, id)];   // undefined when maxed
}

export function buy(save, id) {
  const cost = nextCost(save, id);
  if (cost === undefined || save.money < cost) return false;
  save.money -= cost;
  save.upgrades[id] = level(save, id) + 1;
  saveActive();
  return true;
}

export const penCount = (save) => Math.min(ANIMALS.length, START_PENS + (save.pens || 0));
export const nextPenCost = (save) => PEN_COSTS[save.pens || 0];   // undefined when all pens are owned

export function buyPen(save) {
  const cost = nextPenCost(save);
  if (cost === undefined || save.money < cost) return false;
  save.money -= cost;
  save.pens = (save.pens || 0) + 1;
  saveActive();
  return true;
}

// Desert map: offered once every farm animal is discovered.
export const desertAvailable = (save) => !save.desert && ANIMALS.every((a) => save.discovered[a.id]);

export function buyDesert(save) {
  if (!desertAvailable(save) || save.money < DESERT_COST) return false;
  save.money -= DESERT_COST;
  save.desert = true;
  saveActive();
  return true;
}

export const safariPenCount = (save) => Math.min(SAFARI_ANIMALS.length, START_PENS + (save.pens2 || 0));
export const nextSafariPenCost = (save) => SAFARI_PEN_COSTS[save.pens2 || 0];

export function buySafariPen(save) {
  const cost = nextSafariPenCost(save);
  if (!save.desert || cost === undefined || save.money < cost) return false;
  save.money -= cost;
  save.pens2 = (save.pens2 || 0) + 1;
  saveActive();
  return true;
}

// Winter map: offered once the desert is owned and every safari animal is discovered.
export const winterAvailable = (save) => save.desert && !save.winter && SAFARI_ANIMALS.every((a) => save.discovered[a.id]);

export function buyWinter(save) {
  if (!winterAvailable(save) || save.money < WINTER_COST) return false;
  save.money -= WINTER_COST;
  save.winter = true;
  saveActive();
  return true;
}

export const winterPenCount = (save) => Math.min(WINTER_ANIMALS.length, START_PENS + (save.pens3 || 0));
export const nextWinterPenCost = (save) => WINTER_PEN_COSTS[save.pens3 || 0];

export function buyWinterPen(save) {
  const cost = nextWinterPenCost(save);
  if (!save.winter || cost === undefined || save.money < cost) return false;
  save.money -= cost;
  save.pens3 = (save.pens3 || 0) + 1;
  saveActive();
  return true;
}
