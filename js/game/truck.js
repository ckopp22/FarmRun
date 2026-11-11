import { makeTruck, makeSafariTruck, makeSnowmobile } from '../render/models.js';

// Parked at the spawn point; three circles approximate its footprint.
// theme: false (farm), true/'desert' (safari jeep) or 'winter' (snowmobile + sled)
export function createTruck(scene, grid, x, z, theme = false) {
  const winter = theme === 'winter', desert = theme === true || theme === 'desert';
  const truck = winter ? makeSnowmobile() : desert ? makeSafariTruck() : makeTruck();
  const k = desert ? 1.3 : 1;
  truck.position.set(x, 0, z);
  scene.add(truck);
  if (winter) for (const dz of [-3.3, -1.65, 0, 1.65, 3.3]) grid.add(x, z + dz, 1.45);
  else for (const dz of [-1.5, 0, 1.5]) grid.add(x, z + dz * k, 1.1 * k);
  return truck;
}
