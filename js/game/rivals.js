import * as THREE from '../../lib/three.module.min.js';
import { makeFarmer } from '../render/models.js';
import { mat } from '../render/materials.js';
import { PLAYER_LIMIT } from './map.js';

const RADIUS = 0.45;
const CATCH = RADIUS + 0.45;
const SIGHT = 13;                    // detection radius
const HALF_CONE = 55 * Math.PI / 180;
const GIVE_UP_DIST = 24;
const GIVE_UP_TIME = 2;              // seconds without line of sight
const WANDER_SPEED = 1.8;
const ALERT_TIME = 0.45;
const MIN_FROM_TRUCK = 16;

const clampLimit = (v) => Math.max(-PLAYER_LIMIT, Math.min(PLAYER_LIMIT, v));
const wrap = (a) => ((a + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI;

function makeMark() {
  const g = new THREE.Group();
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), mat(0xffdd00));
  b1.position.y = 0.45;
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat(0xffdd00));
  g.add(b1, b2);
  g.position.y = 2.7;
  g.visible = false;
  return g;
}

// Farther spawns are more dangerous: faster chase speed.
export function createRivals(scene, grid, count, player) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const group = makeFarmer(0x3a3a3a, 0x222222);
    const mark = makeMark();
    group.add(mark);
    scene.add(group);
    const ang = Math.random() * 6.28;
    const dist = MIN_FROM_TRUCK + Math.sqrt(Math.random()) * (PLAYER_LIMIT - MIN_FROM_TRUCK - 2);
    const r = { group, mark, state: 'wander', x: Math.cos(ang) * dist, z: Math.sin(ang) * dist,
      heading: Math.random() * 6.28, tx: 0, tz: 0, wait: Math.random() * 2, alert: 0, lost: 0,
      chaseSpeed: 4 + dist / PLAYER_LIMIT * 1.2, radius: RADIUS };
    grid.resolve(r, RADIUS);
    r.tx = r.x; r.tz = r.z;
    list.push(r);
  }

  function sees(r) {
    const dx = player.x - r.x, dz = player.z - r.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > SIGHT * SIGHT) return false;
    if (Math.abs(wrap(Math.atan2(dx, dz) - r.heading)) > HALF_CONE) return false;
    return !grid.blocked(r.x, r.z, player.x, player.z);
  }

  function turn(r, target, dt) { r.heading += wrap(target - r.heading) * Math.min(1, 10 * dt); }

  // Returns true if any rival caught the player this frame.
  function update(dt) {
    let caught = false;
    for (const r of list) {
      let speed = 0;

      if (r.state === 'wander') {
        if (sees(r)) { r.state = 'alert'; r.alert = ALERT_TIME; r.mark.visible = true; }
        else if (r.wait > 0) r.wait -= dt;
        else {
          const dx = r.tx - r.x, dz = r.tz - r.z;
          const d = Math.hypot(dx, dz);
          if (d < 0.3) {
            r.wait = 1 + Math.random() * 2.5;
            const a = Math.random() * 6.28, len = 4 + Math.random() * 8;
            r.tx = clampLimit(r.x + Math.cos(a) * len);
            r.tz = clampLimit(r.z + Math.sin(a) * len);
          } else {
            turn(r, Math.atan2(dx, dz), dt);
            speed = WANDER_SPEED;
          }
        }
      } else if (r.state === 'alert') {
        turn(r, Math.atan2(player.x - r.x, player.z - r.z), dt);
        r.alert -= dt;
        if (r.alert <= 0) { r.state = 'chase'; r.lost = 0; r.mark.visible = false; }
      } else {
        const dx = player.x - r.x, dz = player.z - r.z;
        const d = Math.hypot(dx, dz);
        r.lost = grid.blocked(r.x, r.z, player.x, player.z) ? r.lost + dt : 0;
        if (d > GIVE_UP_DIST || r.lost > GIVE_UP_TIME) {
          r.state = 'wander'; r.wait = 1; r.tx = r.x; r.tz = r.z;
        } else {
          turn(r, Math.atan2(dx, dz), dt);
          speed = r.chaseSpeed;
          if (d < CATCH) caught = true;
        }
      }

      if (speed) {
        r.x += Math.sin(r.heading) * speed * dt;
        r.z += Math.cos(r.heading) * speed * dt;
        if (grid.resolve(r, RADIUS) && r.state === 'wander') r.wait = 0.3;
        r.x = clampLimit(r.x); r.z = clampLimit(r.z);
      }
      r.group.position.set(r.x, speed ? Math.abs(Math.sin(performance.now() * 0.012)) * 0.05 : 0, r.z);
      r.group.rotation.y = r.heading;
    }
    return caught;
  }

  return { update };
}
