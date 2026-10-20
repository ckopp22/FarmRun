import { makeTruck } from '../render/models.js';

// Parked at the spawn point; three circles approximate its footprint.
export function createTruck(scene, grid, x, z) {
  const truck = makeTruck();
  truck.position.set(x, 0, z);
  scene.add(truck);
  for (const dz of [-1.5, 0, 1.5]) grid.add(x, z + dz, 1.1);
  return truck;
}
