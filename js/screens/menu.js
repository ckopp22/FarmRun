import * as THREE from '../../lib/three.module.min.js';
import { createScene } from '../render/renderer.js';
import { makeBarn, makeTruck, makeAnimal } from '../render/models.js';
import { ANIMALS } from '../data/animals.js';
import { createTrees } from '../render/instancing.js';
import { renderSlots } from './slots.js';
import { startSlot } from '../systems/save.js';
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

function pickTarget(r) {
  const probe = { x: 0, z: 0 };
  for (let i = 0; i < 30; i++) {
    probe.x = (Math.random() - 0.5) * 18; probe.z = (Math.random() - 0.5) * 16;
    const x = probe.x, z = probe.z;
    if (!collide(probe, null) && probe.x === x && probe.z === z) { r.tx = x; r.tz = z; return; }
  }
  r.tx = r.group.position.x; r.tz = r.group.position.z;
}

const show = (el, on) => { el.style.display = on ? '' : 'none'; };

const onPlay = () => { unlockAudio(); tapSound(); show(menuEl, false); show(slotsEl, true); renderSlots(slotsEl, pick); };
const onBack = () => { tapSound(); show(slotsEl, false); show(menuEl, true); };
function pick(n) {
  tapSound();
  startSlot(n);
  ctxRef.go('farm');
}

const playBtn = document.getElementById('play-btn');
const backBtn = document.getElementById('slots-back');
playBtn.addEventListener('click', onPlay);
backBtn.addEventListener('click', onBack);

export const menuScreen = {
  enter(ctx) {
    ctxRef = ctx;
    const scene = createScene();
    const barn = makeBarn();
    scene.add(barn);
    const truck = makeTruck();
    truck.position.set(TRUCK.x, 0, TRUCK.z);
    truck.rotation.y = TRUCK.rot;
    scene.add(truck);
    createTrees(scene, TREES);
    roamers = [];
    roamers = ['chicken', 'sheep', 'pig', 'cow', 'goat', 'duck'].map((id, i) => {
      const group = makeAnimal(ANIMALS.find((a) => a.id === id));
      const r = { group, speed: 0.5 + Math.random() * 0.4, wait: Math.random() * 2, ph: i };
      group.position.set(i % 2 ? 5 + i : -5 - i, 0, (i - 2.5) * 2.2);
      scene.add(group);
      return r;
    });
    for (const r of roamers) { collide(r.group.position, r.group.position); pickTarget(r); }
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 150);
    angle = 0.6;
    setMusic('farm');
    show(menuEl, true);
    show(slotsEl, false);
    return { scene, camera };
  },

  update(dt) {
    clock += dt;
    for (const r of roamers) {
      const p = r.group.position;
      if (r.wait > 0) { r.wait -= dt; p.y = 0; continue; }
      const dx = r.tx - p.x, dz = r.tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.2) { r.wait = 1 + Math.random() * 3; pickTarget(r); continue; }
      p.x += (dx / d) * r.speed * dt;
      p.z += (dz / d) * r.speed * dt;
      collide(p, p);
      r.group.rotation.y = Math.atan2(dx, dz);
      p.y = Math.abs(Math.sin(clock * 6 + r.ph)) * 0.08;
    }
    angle += dt * 0.12;
    camera.position.set(Math.sin(angle) * RADIUS, HEIGHT, Math.cos(angle) * RADIUS);
    camera.lookAt(0, 2, 0);
  },

  exit() {
    show(menuEl, false);
    show(slotsEl, false);
    camera = null;
  },
};
