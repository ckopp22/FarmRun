import * as THREE from '../../lib/three.module.min.js';
import { makeFarmer, animateFarmer } from '../render/models.js';
import { mat } from '../render/materials.js';
import { PLAYER_LIMIT } from './map.js';

const RADIUS = 0.45;
const CATCH = RADIUS + 0.45;
const SIGHT = 13;                    // detection radius
const HALF_CONE = 55 * Math.PI / 180;
const GIVE_UP_DIST = 24;
const GIVE_UP_TIME = 4;              // seconds without line of sight
const WANDER_SPEED = 1.8;
const ALERT_TIME = 0.45;
const MIN_FROM_TRUCK = 16;
const PACK_BONUS = 0.12;             // chase speed bonus per additional chaser
const PACK_MAX = 1.7;
const PROBE = 1.6;                   // how far ahead to look for trees
const STEER_ANGLES = [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5, 2.1, -2.1];

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
export function createRivals(scene, grid, count, player, onAlert) {
  const list = [];
  let tgt = player;   // what rivals chase: the player, or the truck once the run ends
  for (let i = 0; i < count; i++) {
    const group = makeFarmer(0x3a3a3a, 0x222222);
    const mark = makeMark();
    group.add(mark);
    scene.add(group);
    const ang = Math.random() * 6.28;
    const dist = MIN_FROM_TRUCK + Math.sqrt(Math.random()) * (PLAYER_LIMIT - MIN_FROM_TRUCK - 2);
    const r = { group, mark, state: 'wander', x: Math.cos(ang) * dist, z: Math.sin(ang) * dist,
      heading: Math.random() * 6.28, tx: 0, tz: 0, wait: Math.random() * 2, alert: 0, lost: 0, side: 1, run: 0, runT: 0,
      chaseSpeed: 4 + dist / PLAYER_LIMIT * 1.2, radius: RADIUS };
    grid.resolve(r, RADIUS);
    r.tx = r.x; r.tz = r.z;
    list.push(r);
  }

  function sees(r) {
    const dx = tgt.x - r.x, dz = tgt.z - r.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > SIGHT * SIGHT) return false;
    if (Math.abs(wrap(Math.atan2(dx, dz) - r.heading)) > HALF_CONE) return false;
    return !grid.blocked(r.x, r.z, tgt.x, tgt.z);
  }

  // Pick the heading closest to `want` whose path ahead is clear of trees.
  function steer(r, want) {
    const order = r.side < 0 ? STEER_ANGLES.map((a, i) => (i ? -a : a)) : STEER_ANGLES;
    for (const a of order) {
      const h = want + a;
      const sx = Math.sin(h), sz = Math.cos(h);
      if (!grid.overlaps(r.x + sx * PROBE, r.z + sz * PROBE, RADIUS) &&
          !grid.overlaps(r.x + sx * PROBE * 0.5, r.z + sz * PROBE * 0.5, RADIUS)) {
        if (a) r.side = a > 0 ? 1 : -1;
        return h;
      }
    }
    return want;
  }

  function turn(r, target, dt) { r.heading += wrap(target - r.heading) * Math.min(1, 10 * dt); }

  // Returns true if any rival caught the player this frame.
  // `follow`: the run is over and `target` is the truck; chasers keep pursuing it, nobody else reacts, no catches.
  function update(dt, target = player, follow = false) {
    tgt = target;
    let caught = false;
    let chasers = 0;
    for (const r of list) if (r.state === 'chase') chasers++;
    const pack = Math.min(PACK_MAX, 1 + PACK_BONUS * Math.max(0, chasers - 1));
    for (const r of list) {
      let speed = 0;

      if (r.state === 'wander') {
        if (follow) { /* idle */ }
        else if (sees(r)) { r.state = 'alert'; r.alert = ALERT_TIME; r.mark.visible = true; if (onAlert) onAlert(); }
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
            turn(r, steer(r, Math.atan2(dx, dz)), dt);
            speed = WANDER_SPEED;
          }
        }
      } else if (r.state === 'alert') {
        turn(r, Math.atan2(tgt.x - r.x, tgt.z - r.z), dt);
        r.alert -= dt;
        if (r.alert <= 0) { r.state = 'chase'; r.lost = 0; r.mark.visible = false; }
      } else {
        const dx = tgt.x - r.x, dz = tgt.z - r.z;
        const d = Math.hypot(dx, dz);
        r.lost = grid.blocked(r.x, r.z, tgt.x, tgt.z) ? r.lost + dt : 0;
        if (!follow && (d > GIVE_UP_DIST || r.lost > GIVE_UP_TIME)) {
          r.state = 'wander'; r.wait = 1; r.tx = r.x; r.tz = r.z;
        } else {
          turn(r, steer(r, Math.atan2(dx, dz)), dt);
          speed = r.chaseSpeed * pack;
          if (d < CATCH && !follow) caught = true;
        }
      }

      if (speed) {
        r.x += Math.sin(r.heading) * speed * dt;
        r.z += Math.cos(r.heading) * speed * dt;
        if (grid.resolve(r, RADIUS) && r.state === 'wander') r.wait = 0.3;
        for (const o of list) {
          if (o === r) continue;
          const ox = r.x - o.x, oz = r.z - o.z, min = RADIUS * 2, d2 = ox * ox + oz * oz;
          if (d2 < min * min) { const d = Math.sqrt(d2) || 0.0001, k = (min - d) / d * 0.5; r.x += ox * k; r.z += oz * k; }
        }
        r.x = clampLimit(r.x); r.z = clampLimit(r.z);
      }
      r.run += (Math.min(1, speed / 6) - r.run) * Math.min(1, 12 * dt);
      r.runT += dt * (0.5 + r.run);
      animateFarmer(r.group, r.runT, r.run);
      r.group.position.set(r.x, r.run * Math.abs(Math.sin(r.runT * 12)) * 0.08, r.z);
      r.group.rotation.y = r.heading;
      r.group.visible = Math.hypot(r.x - tgt.x, r.z - tgt.z) < 66;
    }
    return caught;
  }

  return { update, list };
}
