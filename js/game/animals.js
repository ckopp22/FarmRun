import { makeAnimal, animateAnimal } from '../render/models.js';
import { ANIMALS } from '../data/animals.js';
import { PLAYER_LIMIT } from './map.js';

const RADIUS = 0.35;
const PICKUP = 0.45 + 0.5;   // farmer radius + animal reach
// Rarer tiers spawn farther from the truck; Rare and up flee the player.
const TIERS = {
  Common:    { weight: 5,   min: 8,  max: 50, speed: 1.7, flee: 0 },
  Uncommon:  { weight: 3,   min: 36, max: 70, speed: 1.8, flee: 0 },
  Rare:      { weight: 2,   min: 56, max: 84, speed: 2.0, flee: 3.5 },
  Epic:      { weight: 1,   min: 72, max: 92, speed: 2.2, flee: 4.2 },
  Legendary: { weight: 0.5, min: 80, max: 92, speed: 2.4, flee: 4.8 },
};
const FLEE_RANGE = 6;
const FOG_CULL = 66;   // past the fog's far plane (62) they are invisible, so skip drawing them

function pickAnimal(pool, total) {
  let r = Math.random() * total;
  for (const a of pool) {
    r -= TIERS[a.tier].weight;
    if (r <= 0) return a;
  }
  return pool[0];
}

const clampLimit = (v) => Math.max(-PLAYER_LIMIT, Math.min(PLAYER_LIMIT, v));

export function createAnimals(scene, grid, count, player, pool = ANIMALS) {
  const list = [];
  const total = pool.reduce((s, a) => s + TIERS[a.tier].weight, 0);
  const fleeRange = FLEE_RANGE;
  for (let i = 0; i < count; i++) {
    const a = pickAnimal(pool, total);
    const t = TIERS[a.tier];
    const group = makeAnimal(a);
    scene.add(group);
    const ang = Math.random() * 6.28, dist = t.min + Math.random() * (t.max - t.min);
    const c = { a, t, group, x: clampLimit(Math.cos(ang) * dist), z: clampLimit(Math.sin(ang) * dist),
      heading: Math.random() * 6.28, tx: 0, tz: 0, wait: Math.random() * 2, tm: Math.random() * 10 };
    grid.resolve(c, RADIUS);
    c.tx = c.x; c.tz = c.z;
    list.push(c);
  }

  // Returns the animal data picked up this frame (or null). Nothing is picked up when `full`.
  function update(dt, full) {
    let picked = null;
    for (let i = list.length - 1; i >= 0; i--) {
      const c = list[i];
      c.tm += dt;
      let moving = false;
      const px = player.x - c.x, pz = player.z - c.z;
      const pd2 = px * px + pz * pz;

      if (c.t.flee && pd2 < fleeRange * fleeRange) {
        const d = Math.sqrt(pd2) || 0.001;
        c.x = clampLimit(c.x - px / d * c.t.flee * dt);
        c.z = clampLimit(c.z - pz / d * c.t.flee * dt);
        c.heading = Math.atan2(-px, -pz);
        c.tx = c.x; c.tz = c.z; c.wait = 0.4;
        moving = true;
        grid.resolve(c, RADIUS);
      } else if (c.wait > 0) {
        c.wait -= dt;
      } else {
        const dx = c.tx - c.x, dz = c.tz - c.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.2) {
          c.wait = 0.5 + Math.random() * 2.5;
          const ang = Math.random() * 6.28, r = 2 + Math.random() * 5;
          c.tx = clampLimit(c.x + Math.cos(ang) * r);
          c.tz = clampLimit(c.z + Math.sin(ang) * r);
        } else {
          c.x += dx / d * c.t.speed * dt;
          c.z += dz / d * c.t.speed * dt;
          c.heading += (((Math.atan2(dx, dz) - c.heading + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI) * Math.min(1, 10 * dt);
          moving = true;
          if (grid.resolve(c, RADIUS)) c.wait = 0.3;
        }
      }

      if (!full && !picked && pd2 < PICKUP * PICKUP) {
        picked = c.a;
        scene.remove(c.group);
        list.splice(i, 1);
        continue;
      }

      c.group.position.set(c.x, moving ? Math.abs(Math.sin(c.tm * 14)) * 0.06 : 0, c.z);
      c.group.rotation.y = c.heading;
      animateAnimal(c.group, c.tm, moving ? 1 : 0);
      c.group.visible = pd2 < FOG_CULL * FOG_CULL;
    }
    return picked;
  }

  return { update };
}
