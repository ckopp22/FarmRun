import * as THREE from '../../lib/three.module.min.js';
import { createScene } from '../render/renderer.js';
import { isHoliday } from '../systems/holiday.js';
import { addSantaDecor, twinkleLights, moveSanta, makeBarn, makeTruck, makeAnimal, animateAnimal } from '../render/models.js';
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

let menuTruck = null;
export const menuScreen = {
  enter(ctx) {
    ctxRef = ctx;
    const scene = createScene();
    if (scene.fog) { scene.fog.near = 45; scene.fog.far = 130; }   // lighter fog on the menu
    const barn = makeBarn();
    scene.add(barn);
    const truck = makeTruck();
    if (isHoliday()) { addSantaDecor(truck); menuTruck = truck; }
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
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 150);
    angle = 0.6;
    setMusic('farm');
    show(menuEl, true);
    show(slotsEl, false);
    return { scene, camera };
  },

  update(dt) {
    clock += dt;
    if (isHoliday()) { twinkleLights(clock); if (menuTruck) moveSanta(menuTruck, clock); }
    // Animals stroll between random spots, pausing now and then, steering around the obstacles.
    for (const r of roamers) {
      const p = r.group.position;
      if (r.wait > 0) {
        r.wait -= dt;
        p.y = 0;
        animateAnimal(r.group, 0, 0);
        continue;
      }
      let dx = r.tx - p.x, dz = r.tz - p.z;
      const d = Math.hypot(dx, dz);
      r.sk = (r.sk || 0) + dt;
      const stuck = r.sk > 1.5 && Math.hypot(p.x - (r.lx ?? 1e9), p.z - (r.lz ?? 1e9)) < 0.4;
      if (r.sk > 1.5) { r.lx = p.x; r.lz = p.z; r.sk = 0; }
      if (d < 0.5 || stuck || r.tx === undefined) {   // arrived (or stuck): rest, then pick a new spot
        r.wait = 1 + Math.random() * 2.5;
        r.blk = 0;
        for (let n = 0; n < 12; n++) {   // only pick spots clear of trees, truck and barn
          const a = Math.random() * 6.28, rad = 3 + Math.random() * 9;
          const tx = Math.max(-14, Math.min(14, p.x + Math.cos(a) * rad)), tz = Math.max(-14, Math.min(14, p.z + Math.sin(a) * rad));
          r.tx = tx; r.tz = tz;
          if (!CIRCLES.some((c) => Math.hypot(tx - c.x, tz - c.z) < c.r + AR + 0.8) && !(Math.abs(tx) < BARN.hx + AR + 0.8 && Math.abs(tz) < BARN.hz + AR + 0.8)) break;
        }
        continue;
      }
      [dx, dz] = steer(p, dx, dz);
      const want = Math.atan2(dx, dz);
      if (r.h === undefined) r.h = want;
      r.h += Math.atan2(Math.sin(want - r.h), Math.cos(want - r.h)) * Math.min(1, dt * 4);
      const bx = p.x, bz = p.z;
      p.x += Math.sin(r.h) * 0.9 * dt;
      p.z += Math.cos(r.h) * 0.9 * dt;
      collide(p, p);
      // Pushed back by something: give up on this target quickly instead of vibrating against it.
      r.blk = Math.hypot(p.x - bx, p.z - bz) < 0.9 * dt * 0.3 ? (r.blk || 0) + dt : Math.max(0, (r.blk || 0) - dt);
      if (r.blk > 0.35) { r.tx = p.x; r.tz = p.z; r.wait = 0.3; }
      r.group.rotation.y = r.h;
      p.y = Math.abs(Math.sin(clock * 6 + r.ph)) * 0.08;
      animateAnimal(r.group, clock * 0.5 + r.ph, 1);
    }
    angle += dt * 0.12;
    const z = window.innerHeight > window.innerWidth ? 2.1 : 1.6;
    camera.position.set(Math.sin(angle) * RADIUS * z, HEIGHT * z, Math.cos(angle) * RADIUS * z);
    camera.lookAt(0, 2, 0);
  },

  exit() {
    show(menuEl, false);
    show(slotsEl, false);
    camera = null;
  },
};
