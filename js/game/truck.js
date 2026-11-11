import { makeTruck, makeSafariTruck } from '../render/models.js';

// Parked at the spawn point; three circles approximate its footprint.
export function createTruck(scene, grid, x, z, desert = false) {
  const truck = desert ? makeSafariTruck() : makeTruck();
  const k = desert ? 1.3 : 1;
  truck.position.set(x, 0, z);
  scene.add(truck);
  for (const dz of [-1.5, 0, 1.5]) grid.add(x, z + dz * k, 1.1 * k);
  return truck;
}
