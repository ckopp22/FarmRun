import * as THREE from '../../lib/three.module.min.js';
import { makeAnimal } from '../render/models.js';

const GAP = 1.2;       // leash length between neighbours
const FOLLOW = 8;      // higher = snappier
const SCALE = 0.55;
const LEASH_COLOR = 0x6b4a2b;

// Picked-up animals trail behind the player in a chain, each tied to the one ahead.
export function createFollowers(scene, player) {
  const list = [];

  function add(animal) {
    const group = makeAnimal(animal);
    group.scale.setScalar(SCALE);
    group.position.set(player.x, 0, player.z);
    scene.add(group);
    const leash = new THREE.Line(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)),
      new THREE.LineBasicMaterial({ color: LEASH_COLOR })
    );
    leash.frustumCulled = false;
    scene.add(leash);
    list.push({ group, leash, x: player.x, z: player.z, heading: player.heading, t: Math.random() * 10 });
  }

  function update(dt) {
    const k = 1 - Math.exp(-FOLLOW * dt);
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const lead = i === 0 ? player : list[i - 1];
      const dx = f.x - lead.x, dz = f.z - lead.z;
      const d = Math.hypot(dx, dz) || 0.0001;
      const px = f.x, pz = f.z;
      f.x += (lead.x + dx / d * GAP - f.x) * k;
      f.z += (lead.z + dz / d * GAP - f.z) * k;
      const moved = Math.hypot(f.x - px, f.z - pz);
      if (moved > 0.002) {
        let diff = Math.atan2(f.x - px, f.z - pz) - f.heading;
        diff = ((diff + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI;
        f.heading += diff * Math.min(1, 12 * dt);
        f.t += dt;
      }
      f.group.position.set(f.x, moved > dt * 0.4 ? Math.abs(Math.sin(f.t * 14)) * 0.06 : 0, f.z);
      f.group.rotation.y = f.heading;

      const p = f.leash.geometry.attributes.position;
      p.setXYZ(0, lead.x, i === 0 ? 0.9 : 0.35, lead.z);
      p.setXYZ(1, f.x, 0.35, f.z);
      p.needsUpdate = true;
    }
  }

  return { add, update };
}
