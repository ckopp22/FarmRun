import * as THREE from '../../lib/three.module.min.js';
import { createScene } from '../render/renderer.js';
import { isHoliday } from '../systems/holiday.js';
import { addSantaDecor, twinkleLights, makeBarn, makeTruck, makeAnimal, animateAnimal } from '../render/models.js';
import { ANIMALS } from '../data/animals.js';
import { createTrees, createFlowers } from '../render/instancing.js';
import { startSlot, activeSave } from '../systems/save.js';
import { unlockAudio, tapSound, setMusic } from '../systems/audio.js';

const menuEl = document.getElementById('menu');
const slotsEl = document.getElementById('slots');
const RADIUS = 17, HEIGHT = 8;

let camera, angle, ctxRef, roamers = [], clock = 0;

const TRUCK = { x: 7, z: 3, rot: -0.6 };
const TREES = [
  { x: -8, z: -3, s: 1.2 }, { x: -6, z: 5, s: 1 }, { x: 9, z: -5, s: 1.1 },
  { x: -11, z: 1, s: 0.9 }, { x: 4, z: -9, s: 1.3 }, { x: -3, z: -10, s: 1 },
];
const BARN = { hx: 3.4, hz: 2.9 };
const AR = 0.5;
const CIRCLES = [
  ...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.5 * t.s + 0.4 })),
  ...[-1.3, 0, 1.3].map((o) => ({
    x: TRUCK.x + Math.sin(TRUCK.rot) * o, z: TRUCK.z + Math.cos(TRUCK.rot) * o, r: 1.5,
  })),
];

// Push p out of every obstacle (and other roamers); returns true if it moved.
function collide(p, self) {
  let hit = false;
  for (const c of CIRCLES) {
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + AR;
    if (d < m) { const k = m / (d || 1e-6); p.x = c.x + dx * k; p.z = c.z + dz * k; hit = true; }
  }
  const bx = BARN.hx + AR, bz = BARN.hz + AR;
  if (Math.abs(p.x) < bx && Math.abs(p.z) < bz) {
    if (bx - Math.abs(p.x) < bz - Math.abs(p.z)) p.x = Math.sign(p.x || 1) * bx;
    else p.z = Math.sign(p.z || 1) * bz;
    hit = true;
  }
  if (self) for (const o of roamers) {
    if (o.group.position === self) continue;
    const q = o.group.position, dx = p.x - q.x, dz = p.z - q.z, d = Math.hypot(dx, dz);
    if (d < AR * 2) { const k = (AR * 2 - d) / 2 / (d || 1e-6); p.x += dx * k; p.z += dz * k; q.x -= dx * k; q.z -= dz * k; hit = true; }
  }
  return hit;
}

// Bend the desired direction (dx, dz) around nearby obstacles: push away and slide along them.
const LOOK = 2;
function steer(p, dx, dz) {
  let m = Math.hypot(dx, dz) || 1e-6;
  let sx = dx / m, sz = dz / m;
  const avoid = (ax, az, d, range) => {
    if (d >= range) return;
    const w = (range - d) / range, nx = ax / (d || 1e-6), nz = az / (d || 1e-6);
    const side = nx * -sz + nz * sx >= 0 ? 1 : -1;   // slide whichever way is already closer to our heading
    sx += (nx + -nz * side * 0.9) * w * 2.2;
    sz += (nz + nx * side * 0.9) * w * 2.2;
  };
  for (const c of CIRCLES) avoid(p.x - c.x, p.z - c.z, Math.hypot(p.x - c.x, p.z - c.z), c.r + AR + LOOK);
  const qx = Math.max(-BARN.hx, Math.min(BARN.hx, p.x)), qz = Math.max(-BARN.hz, Math.min(BARN.hz, p.z));
  avoid(p.x - qx, p.z - qz, Math.hypot(p.x - qx, p.z - qz), AR + LOOK);
  m = Math.hypot(sx, sz) || 1e-6;
  return [sx / m, sz / m];
}

const show = (el, on) => { el.style.display = on ? '' : 'none'; };

const onPlay = () => { unlockAudio(); pick(1); };
function pick(n) {
  tapSound();
  startSlot(n);
  const sv = activeSave(), last = sv && sv.lastMap;
  ctxRef.map = (last === 'desert' && sv.desert) || (last === 'winter' && sv.winter) ? last : 'farm';
  ctxRef.go('farm');
}

const playBtn = document.getElementById('play-btn');
playBtn.addEventListener('click', onPlay);

export const menuScreen = {
  enter(ctx) {
    ctxRef = ctx;
    const scene = createScene();
    const barn = makeBarn();
    scene.add(barn);
    const truck = makeTruck();
    if (isHoliday()) addSantaDecor(truck);
    truck.position.set(TRUCK.x, 0, TRUCK.z);
    truck.rotation.y = TRUCK.rot;
    scene.add(truck);
    createTrees(scene, TREES);
    let seed = 99;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const flowers = [];
    for (let n = 0; n < 1200 && flowers.length < 320; n++) {
      const a = rnd() * 6.2832, d = 4 + Math.sqrt(rnd()) * 26, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.abs(x) < BARN.hx + 0.8 && Math.abs(z) < BARN.hz + 0.8) continue;
      if (CIRCLES.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 0.3)) continue;
      flowers.push({ x, z, s: 0.8 + rnd() * 0.7, c: Math.floor(rnd() * 5) });
    }
    createFlowers(scene, flowers);
    roamers = [];
    roamers = ['chicken', 'sheep', 'pig', 'cow', 'goat', 'duck'].map((id, i) => {
      const group = makeAnimal(ANIMALS.find((a) => a.id === id));
      const r = { group, speed: 0.5 + Math.random() * 0.4, wait: Math.random() * 2, ph: i };
      group.position.set(i % 2 ? 5 + i : -5 - i, 0, (i - 2.5) * 2.2);
      scene.add(group);
      return r;
    });
    for (const r of roamers) { collide(r.group.position, r.group.position); r.pause = 0; }
    for (let i = 0; i < roamers.length; i += 2) { roamers[i].buddy = roamers[i + 1]; roamers[i + 1].buddy = roamers[i]; roamers[i].it = true; roamers[i + 1].it = false; }
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 150);
    angle = 0.6;
    setMusic('farm');
    show(menuEl, true);
    show(slotsEl, false);
    return { scene, camera };
  },

  update(dt) {
    clock += dt;
    if (isHoliday()) twinkleLights(clock);
    // Cute tag: each pair chases; when the chaser catches up it hops, then the roles swap.
    for (const r of roamers) {
      const p = r.group.position, o = r.buddy.group.position;
      if (r.pause > 0) {
        r.pause -= dt;
        p.y = Math.abs(Math.sin(r.pause * 12)) * 0.25;   // happy hop
        animateAnimal(r.group, 0, 0);
        continue;
      }
      let dx = o.x - p.x, dz = o.z - p.z;
      const d = Math.hypot(dx, dz) || 1e-6;
      r.tag = r.it ? (r.tag || 0) + dt : 0;
      r.grace = Math.max(0, (r.grace || 0) - dt);
      if (r.it && !r.grace && (d < 1.25 || (r.tag > 5 && d < 3.5))) {
        r.tag = 0; r.it = false; r.buddy.it = true;
        r.pause = 0.6; r.buddy.pause = 1.1;   // old chaser hops, runner gets a head start
        r.grace = r.buddy.grace = 2.5;
        continue;
      }
      if (!r.it) {   // run away, curving back toward the middle near the edges
        dx = -dx / d + (-p.x * 0.05); dz = -dz / d + (-p.z * 0.05) + Math.sin(clock * 1.5 + r.ph) * 0.25;
      }
      // Stuck check: barely moved in a second -> turn sideways for a moment to break free.
      r.sk = (r.sk || 0) + dt;
      if (r.sk > 1) {
        if (Math.hypot(p.x - (r.lx ?? 1e9), p.z - (r.lz ?? 1e9)) < 0.5) { r.un = 0.8; r.us = Math.random() < 0.5 ? 1 : -1; }
        r.lx = p.x; r.lz = p.z; r.sk = 0;
      }
      if (r.un > 0) { r.un -= dt; const c = Math.cos(1.5 * r.us), sn = Math.sin(1.5 * r.us); [dx, dz] = [dx * c - dz * sn, dx * sn + dz * c]; }
      const sp = r.it ? 2.1 : (r.buddy.tag > 3.5 ? 0.4 : 1.5);
      [dx, dz] = steer(p, dx, dz);
      const want = Math.atan2(dx, dz);
      if (r.h === undefined) r.h = want;
      r.h += Math.atan2(Math.sin(want - r.h), Math.cos(want - r.h)) * Math.min(1, dt * 4);   // low-pass so squeezed animals can't flip direction each frame
      p.x += Math.sin(r.h) * sp * dt;
      p.z += Math.cos(r.h) * sp * dt;
      collide(p, p);
      r.group.rotation.y = r.h;
      p.y = Math.abs(Math.sin(clock * 9 + r.ph)) * 0.12;
      animateAnimal(r.group, clock * 0.8 + r.ph, 1);
    }
    angle += dt * 0.12;
    const z = window.innerHeight > window.innerWidth ? 1.6 : 1.25;
    camera.position.set(Math.sin(angle) * RADIUS * z, HEIGHT * z, Math.cos(angle) * RADIUS * z);
    camera.lookAt(0, 2, 0);
  },

  exit() {
    show(menuEl, false);
    show(slotsEl, false);
    camera = null;
  },
};
