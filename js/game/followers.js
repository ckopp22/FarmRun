import * as THREE from '../../lib/three.module.min.js';
import { makeAnimal, animateAnimal } from '../render/models.js';

const GAP_MIN = 1.4, GAP_MAX = 3.6;   // each animal's own leash length to the player
const SEPARATION = 0.8;               // followers push apart so they don't bunch up
const FOLLOW = 8;      // higher = snappier
const LEASH_COLOR = 0x6b4a2b;

// Picked-up animals each have their own leash to the player and spread out behind them.
export function createFollowers(scene, player) {
  const list = [];
  let boardT = 0;

  function add(animal) {
    const group = makeAnimal(animal);
    group.position.set(player.x, 0, player.z);
    scene.add(group);
    const leash = new THREE.Line(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)),
      new THREE.LineBasicMaterial({ color: LEASH_COLOR })
    );
    leash.frustumCulled = false;
    scene.add(leash);
    list.push({ a: animal, group, leash, x: player.x, z: player.z, heading: player.heading, gap: GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN), t: Math.random() * 10 });
  }

  function update(dt) {
    const k = 1 - Math.exp(-FOLLOW * dt);
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const dx = f.x - player.x, dz = f.z - player.z;
      const d = Math.hypot(dx, dz) || 0.0001;
      const px = f.x, pz = f.z;
      if (d > f.gap) {
        f.x += (player.x + dx / d * f.gap - f.x) * k;
        f.z += (player.z + dz / d * f.gap - f.z) * k;
      }
      for (let j = 0; j < list.length; j++) {
        if (j === i) continue;
        const o = list[j], ox = f.x - o.x, oz = f.z - o.z, od = Math.hypot(ox, oz);
        if (od < SEPARATION) {
          const push = (SEPARATION - od) / (od || 0.0001) * 0.5 * k;
          f.x += (od ? ox : 1) * push;
          f.z += oz * push;
        }
      }
      const moved = Math.hypot(f.x - px, f.z - pz);
      if (moved > 0.002) {
        let diff = Math.atan2(f.x - px, f.z - pz) - f.heading;
        diff = ((diff + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI;
        f.heading += diff * Math.min(1, 12 * dt);
        f.t += dt;
      }
      f.group.position.set(f.x, moved > dt * 0.4 ? Math.abs(Math.sin(f.t * 14)) * 0.06 : 0, f.z);
      f.group.rotation.y = f.heading;
      animateAnimal(f.group, f.t, moved > dt * 0.4 ? 1 : 0);

      const p = f.leash.geometry.attributes.position;
      p.setXYZ(0, player.x, 0.9, player.z);
      p.setXYZ(1, f.x, 0.35, f.z);
      p.needsUpdate = true;
    }
  }

  // A rival grabbed follower i: remove it from the leash line and hand back its entry.
  function remove(i) {
    const f = list.splice(i, 1)[0];
    scene.remove(f.group);
    scene.remove(f.leash);
    f.leash.geometry.dispose();
    return f;
  }

  // Each animal walks to (x, z) in turn and hops into the truck bed. Returns true once all are aboard.
  function board(x, z, dt, truck) {
    const k = 1 - Math.exp(-FOLLOW * dt);
    boardT += dt;
    let done = true;
    list.forEach((f, i) => {
      if (f.aboard) return;
      done = false;
      if (boardT < i * 0.2) return;
      const px = f.x, pz = f.z;
      f.x += (x - f.x) * k * 0.8;
      f.z += (z - f.z) * k * 0.8;
      f.heading = Math.atan2(f.x - px, f.z - pz);
      f.t += dt;
      f.group.position.set(f.x, Math.abs(Math.sin(f.t * 14)) * 0.06, f.z);
      f.group.rotation.y = f.heading;
      animateAnimal(f.group, f.t, 1);
      f.leash.visible = false;
      if (Math.hypot(x - f.x, z - f.z) < 0.4) {
        f.aboard = true;
        truck.add(f.group);
        f.group.position.set(i % 2 ? 0.4 : -0.4, 1.2 + Math.floor(i / 6) * 0.3, -0.5 - (Math.floor(i / 2) % 3) * 0.6);
        f.group.rotation.y = Math.random() * 6.28;
      }
    });
    return done;
  }

  return { add, update, board, remove, list };
}
