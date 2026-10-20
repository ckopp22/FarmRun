import { createTrees } from '../render/instancing.js';

export const WORLD_HALF = 50;    // trees are scattered within +/- this
export const PLAYER_LIMIT = 46;  // farmer/chickens stay inside +/- this
const TRUNK_RADIUS = 0.35;

// Scatter trees, keeping a clearing around (0, 0) where the truck and farmer spawn.
export function buildForest(scene, grid, count, clearRadius) {
  const trees = [];
  while (trees.length < count) {
    const x = (Math.random() * 2 - 1) * WORLD_HALF;
    const z = (Math.random() * 2 - 1) * WORLD_HALF;
    if (x * x + z * z < clearRadius * clearRadius) continue;
    const s = 0.8 + Math.random() * 0.7;
    trees.push({ x, z, s });
    grid.add(x, z, TRUNK_RADIUS * s);
  }
  createTrees(scene, trees);
}
