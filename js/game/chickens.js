import { makeChicken } from '../render/models.js';
import { PLAYER_LIMIT } from './map.js';

const SPEED = 1.7;
const RADIUS = 0.3;
const PICKUP = 0.45 + 0.4;   // farmer radius + chicken reach
const RANGE = 40;

function randomSpot(c, px, pz, minFromPlayer) {
  do {
    c.x = (Math.random() * 2 - 1) * RANGE;
    c.z = (Math.random() * 2 - 1) * RANGE;
  } while (Math.hypot(c.x - px, c.z - pz) < minFromPlayer || Math.hypot(c.x, c.z) < 8);
}

export function createChickens(scene, grid, count, player) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const group = makeChicken();
    scene.add(group);
    const c = { group, x: 0, z: 0, heading: Math.random() * 6.28, tx: 0, tz: 0, wait: Math.random() * 2, t: Math.random() * 10 };
    randomSpot(c, player.x, player.z, 12);
    grid.resolve(c, RADIUS);
    c.tx = c.x; c.tz = c.z;
    list.push(c);
  }

  // Returns how many chickens were picked up this frame.
  function update(dt) {
    let picked = 0;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      c.t += dt;
      let moving = false;

      if (c.wait > 0) {
        c.wait -= dt;
      } else {
        const dx = c.tx - c.x, dz = c.tz - c.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.2) {
          c.wait = 0.5 + Math.random() * 2.5;
          const a = Math.random() * 6.28, r = 2 + Math.random() * 5;
          c.tx = Math.max(-PLAYER_LIMIT, Math.min(PLAYER_LIMIT, c.x + Math.cos(a) * r));
          c.tz = Math.max(-PLAYER_LIMIT, Math.min(PLAYER_LIMIT, c.z + Math.sin(a) * r));
        } else {
          c.x += dx / d * SPEED * dt;
          c.z += dz / d * SPEED * dt;
          c.heading += (((Math.atan2(dx, dz) - c.heading + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI) * Math.min(1, 10 * dt);
          moving = true;
          if (grid.resolve(c, RADIUS)) c.wait = 0.3;
        }
      }

      const px = player.x - c.x, pz = player.z - c.z;
      if (px * px + pz * pz < PICKUP * PICKUP) {
        picked++;
        randomSpot(c, player.x, player.z, 15);
        grid.resolve(c, RADIUS);
        c.tx = c.x; c.tz = c.z; c.wait = 1;
        moving = false;
      }

      c.group.position.set(c.x, moving ? Math.abs(Math.sin(c.t * 14)) * 0.06 : 0, c.z);
      c.group.rotation.y = c.heading;
    }
    return picked;
  }

  return { update };
}
