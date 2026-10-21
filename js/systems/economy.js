import { UPGRADES } from '../data/animals.js';
import { saveActive } from './save.js';

const BASE_CAPACITY = 3;

export const level = (save, id) => (save.upgrades && save.upgrades[id]) || 0;

export const capacity = (save) => BASE_CAPACITY + level(save, 'bag');
export const speedMult = (save) => 1 + 0.1 * level(save, 'shoes');
export const lureMult = (save) => 1 - 0.2 * level(save, 'lure');       // scales flee range and speed
export const zoomMult = (save) => 1 + 0.15 * level(save, 'binoculars');
export const tierCount = (save) => 2 + level(save, 'zones');           // Common, Uncommon, then one more per zone level

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
