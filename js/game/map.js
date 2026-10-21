import * as THREE from '../../lib/three.module.min.js';
import { createTrees } from '../render/instancing.js';

export const WORLD_HALF = 100;    // trees are scattered within +/- this
export const PLAYER_LIMIT = 92;  // farmer/chickens stay inside +/- this
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

// Wooden fence just outside PLAYER_LIMIT so the edge of the map is visible.
export function buildFence(scene) {
  const E = PLAYER_LIMIT + 1.5, STEP = 3, wood = new THREE.MeshLambertMaterial({ color: 0x8a6a42 });
  const n = Math.round((E * 2) / STEP);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 2.2, 0.4), wood, n * 4);
  const m = new THREE.Matrix4();
  let i = 0;
  for (let k = 0; k < n; k++) {
    const t = -E + k * STEP;
    for (const [x, z] of [[t, -E], [E, t], [-t, E], [-E, -t]]) posts.setMatrixAt(i++, m.makeTranslation(x, 1.1, z));
  }
  scene.add(posts);
  for (const y of [0.8, 1.6]) {
    for (const [w, d] of [[E * 2, 0.2], [0.2, E * 2]]) {
      for (const s of [-E, E]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), wood);
        rail.position.set(w > d ? 0 : s, y, w > d ? s : 0);
        scene.add(rail);
      }
    }
  }
}
