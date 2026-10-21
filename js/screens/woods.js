import * as THREE from '../../lib/three.module.min.js';
import { createScene, addDirt } from '../render/renderer.js';
import { createChaseCamera, updateChaseCamera, snapCamera, CAMERA_YAW } from '../render/camera.js';
import { animateFarmer } from '../render/models.js';
import { quality } from '../render/quality.js';
import { createGrid } from '../game/collision.js';
import { buildForest, buildFence } from '../game/map.js';
import { createTruck } from '../game/truck.js';
import { createPlayer, updatePlayer } from '../game/player.js';
import { createAnimals } from '../game/animals.js';
import { createFootsteps } from '../render/footsteps.js';
import { createIndicators } from '../render/indicators.js';
import { createRivals } from '../game/rivals.js';
import { createParticles } from '../render/particles.js';
import { sfx, setMusic } from '../systems/audio.js';
import { createFollowers } from '../game/followers.js';
import { activeSave, saveActive } from '../systems/save.js';
import { capacity as capacityOf, speedMult, penCount } from '../systems/economy.js';
import { ANIMALS } from '../data/animals.js';

const ANIMAL_COUNT = 28;
const RIVAL_COUNT = 10;
const DEPOSIT_RADIUS = 2.8;   // distance from the truck that counts as walking into it
const ARM_DISTANCE = 8;       // must leave the truck area first, so spawning next to it doesn't end the run

let input, grid, player, animals, followers, rivals, particles, footsteps, indicators, camera, ctxRef;
let haul, capacity, armed, busted, truck, leave, trackL, trackR, scene;
const hud = document.getElementById('chickens');
const bustedEl = document.getElementById('busted');

document.getElementById('busted-btn').addEventListener('click', () => {
  const save = activeSave();
  if (save) { save.runs++; saveActive(); }
  ctxRef.go('farm');
});

function paintHud() {
  const value = haul.reduce((s, a) => s + a.value, 0);
  hud.textContent = `🎒 ${haul.length}/${capacity} · $${value.toLocaleString()}`;
}

// Bank the haul into the inventory and unlock colors. Selling happens on the farm.
function bankHaul() {
  const save = activeSave();
  const found = [];
  if (save) {
    for (const a of haul) {
      save.owned[a.id] = (save.owned[a.id] || 0) + 1;
      if (!save.discovered[a.id]) { save.discovered[a.id] = true; found.push(a.id); }
    }
    save.runs++;
    saveActive();
  }
  ctxRef.newlyFound = found;
}

// Truck pulls out toward the camera (screen down), leaving tire marks, then we go to the farm.
function startLeave() {
  leave = { t: 0, v: 0, z0: truck.position.z, boarding: true };
}

function startDriving() {
  leave.boarding = false;
  const mat = new THREE.MeshBasicMaterial({ color: 0x3b2a1a, transparent: true, opacity: 0.4, depthWrite: false });
  [trackL, trackR] = [-0.95, 0.95].map((dx) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(truck.position.x + dx, 0.03, truck.position.z);
    scene.add(m);
    return m;
  });
}

// Farmer and animals climb into the bed (back of the truck, -z side).
function board(dt) {
  const bx = truck.position.x, bz = truck.position.z - 1.2;
  const dx = bx - player.x, dz = bz - player.z;
  const d = Math.hypot(dx, dz);
  if (player.group.visible) {
    if (d < 0.3) player.group.visible = false;
    else {
      const step = Math.min(d, 6 * dt);
      player.x += dx / d * step;
      player.z += dz / d * step;
      player.heading = Math.atan2(dx, dz);
      player.group.position.set(player.x, 0, player.z);
      player.group.rotation.y = player.heading;
      player.runT += dt * 1.5;
      animateFarmer(player.group, player.runT, 1);
    }
  }
  const allIn = followers.board(bx, bz, dt, truck);
  particles.update(dt);
  updateChaseCamera(camera, truck.position.x, truck.position.z, dt);
  if (!player.group.visible && allIn) startDriving();
}

function driveAway(dt) {
  if (leave.boarding) { board(dt); return; }
  leave.t += dt;
  leave.v += 14 * dt;
  truck.position.z += leave.v * dt;
  const len = Math.max(0.01, truck.position.z - 1.4 - leave.z0);
  for (const m of [trackL, trackR]) { m.scale.y = len; m.position.z = leave.z0 + len / 2; }
  updateChaseCamera(camera, truck.position.x, leave.z0 + Math.min(4, leave.t * 3), dt);
  if (leave.t > 2.8) ctxRef.go('farm');
}

export const woodsScreen = {
  enter(ctx) {
    ctxRef = ctx;
    input = ctx.input;
    const save = activeSave();
    const fx = save || { upgrades: {}, pens: 0 };
    capacity = capacityOf(fx);
    haul = [];
    armed = false;
    scene = createScene();
    scene.fog = null;
    camera = createChaseCamera(window.innerWidth / window.innerHeight);
    grid = createGrid();
    addDirt(scene, 0, 0, { radius: 7 });
    truck = createTruck(scene, grid, 0, 0);
    leave = null;
    buildForest(scene, grid, quality().trees * 3, 10);
    buildFence(scene);
    player = createPlayer(scene, 3.5, 3);
    player.speedMult = speedMult(fx);
    animals = createAnimals(scene, grid, ANIMAL_COUNT, player, ANIMALS.slice(0, penCount(fx)));
    followers = createFollowers(scene, player);
    rivals = createRivals(scene, grid, RIVAL_COUNT, player, () => sfx('alert'));
    particles = createParticles(scene);
    footsteps = createFootsteps(scene);
    indicators = createIndicators(scene, RIVAL_COUNT);
    setMusic('woods');
    busted = false;
    bustedEl.style.display = 'none';
    snapCamera(camera, player.x, player.z);

    paintHud();
    hud.style.display = '';
    return { scene, camera };
  },

  update(dt) {
    if (leave) { driveAway(dt); return; }
    if (busted) return;
    input.update();
    updatePlayer(player, input, grid, dt, CAMERA_YAW);
    const got = animals.update(dt, haul.length >= capacity);
    if (got) { haul.push(got); followers.add(got); paintHud(); sfx('pickup'); particles.burst(player.x, 0.8, player.z, 0xffe066, 8, 3); }
    particles.update(dt);
    followers.update(dt);
    updateChaseCamera(camera, player.x, player.z, dt);
    footsteps.track(player);
    for (const r of rivals.list) if (r.group.visible) footsteps.track(r);
    footsteps.update(dt);
    indicators.update(dt, player, truck.position, rivals.list);
    if (rivals.update(dt)) { busted = true; bustedEl.style.display = ''; sfx('caught'); return; }

    const d = Math.hypot(player.x, player.z);
    if (d > ARM_DISTANCE) armed = true;
    else if (armed && d < DEPOSIT_RADIUS) { busted = true; bankHaul(); startLeave(); sfx('cash'); }
  },

  exit() {
    hud.style.display = 'none';
    bustedEl.style.display = 'none';
    truck = leave = trackL = trackR = scene = null;
    input = grid = player = animals = followers = rivals = particles = footsteps = indicators = camera = null;
  },
};
