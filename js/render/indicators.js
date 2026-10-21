import * as THREE from '../../lib/three.module.min.js';

const TRUCK_RING = 3.6;
const RIVAL_RING = 2.6;
const TRUCK_HIDE = 7;   // no truck arrow once this close

function makeArrow(color, size) {
  const geo = new THREE.ConeGeometry(0.28 * size, 0.7 * size, 3).rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false }));
  m.renderOrder = 10;
  m.visible = false;
  return m;
}

// Ground arrows orbiting the player: green points to the truck, red to each chasing rival.
export function createIndicators(scene, count) {
  const truckArrow = makeArrow(0x66ff66, 1.5);
  const rivalArrows = Array.from({ length: count }, () => makeArrow(0xff2a2a, 1));
  scene.add(truckArrow, ...rivalArrows);
  let t = 0;

  function place(a, player, tx, tz, ring) {
    const dx = tx - player.x, dz = tz - player.z;
    const d = Math.hypot(dx, dz) || 1;
    a.position.set(player.x + dx / d * ring, 0.15, player.z + dz / d * ring);
    a.rotation.y = Math.atan2(dx, dz);
    a.visible = true;
  }

  function update(dt, player, truck, rivals) {
    t += dt;
    if (Math.hypot(truck.x - player.x, truck.z - player.z) > TRUCK_HIDE) place(truckArrow, player, truck.x, truck.z, TRUCK_RING);
    else truckArrow.visible = false;
    for (let i = 0; i < rivalArrows.length; i++) {
      const r = rivals[i], a = rivalArrows[i];
      if (r.state === 'wander') { a.visible = false; continue; }
      place(a, player, r.x, r.z, RIVAL_RING);
      a.scale.setScalar(1 + 0.25 * Math.sin(t * 12));
    }
  }

  return { update };
}
