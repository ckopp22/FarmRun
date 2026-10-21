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
import { sfx, setLoop, setMusic } from '../systems/audio.js';
import { createFollowers } from '../game/followers.js';
import { activeSave, saveActive } from '../systems/save.js';
import { capacity as capacityOf, speedMult, penCount } from '../systems/economy.js';
import { ANIMALS } from '../data/animals.js';

const ANIMAL_COUNT = 28;
const RIVAL_COUNT = 10;
const DEPOSIT_RADIUS = 2.8;   // distance from the truck that counts as walking into it
const ARM_DISTANCE = 8;       // must leave the truck area first, so spawning next to it doesn't end the run

let input, grid, player, animals, followers, rivals, particles, footsteps, indicators, camera, ctxRef;
let swipeCd = 0;
let haul, capacity, armed, busted, truck, leave, scene;
const hud = document.getElementById('chickens');
const bustedEl = document.getElementById('busted');

document.getElementById('busted-btn').addEventListener('click', () => {
  const save = activeSave();
  if (save) { save.runs++; saveActive(); }
  ctxRef.go('farm');
});

// Wobble the backpack and flash the count red for a moment (bag full).
let fullTimer = 0;
function flashFull() {
  hud.classList.remove('full');
  void hud.offsetWidth;   // restart the animation
  hud.classList.add('full');
  clearTimeout(fullTimer);
  fullTimer = setTimeout(() => hud.classList.remove('full'), 550);
}

function paintHud() {
  hud.innerHTML = `<span class="bag-icon">🎒</span>&nbsp;<span class="bag-num">${haul.length}/${capacity}</span>`;
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
  leave = { t: 0, v: 0, x0: truck.position.x, z0: truck.position.z, boarding: true };
}

const TRUCK_HALF = 1.1;     // half width plus a little margin
const MARK_STEP = 0.7;      // distance between tire mark segments
let marks, markCount, markX, markZ;

function startDriving() {
  leave.boarding = false;
  leave.heading = 0;
  sfx('drive');
  markCount = 0;
  markX = truck.position.x; markZ = truck.position.z;
  marks = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.35, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x3b2a1a, transparent: true, opacity: 0.4, depthWrite: false }),
    400
  );
  marks.frustumCulled = false;
  marks.count = 0;
  scene.add(marks);
}

// Turn away from trees, animals and rivals in the lane ahead; ease back to straight otherwise.
function steerTruck(dt) {
  const px = truck.position.x, pz = truck.position.z, h = leave.heading;
  const fx = Math.sin(h), fz = Math.cos(h), sx = fz, sz = -fx;
  const look = 5 + leave.v * 0.6;
  let steer = 0;
  const consider = (ox, oz, r) => {
    const dx = ox - px, dz = oz - pz, ahead = dx * fx + dz * fz;
    if (ahead < 0.5 || ahead > look) return;
    const reach = r + TRUCK_HALF, side = dx * sx + dz * sz;
    if (Math.abs(side) > reach) return;
    const w = (1 - ahead / look) * (0.4 + 0.6 * (1 - Math.abs(side) / reach));
    steer += (side === 0 ? (px >= ox ? 1 : -1) : -Math.sign(side)) * w;
  };
  grid.each(px + fx * look / 2, pz + fz * look / 2, look / 2 + 3, (x, z, r) => {
    if (Math.hypot(x - leave.x0, z - leave.z0) < 3.5) return;   // the parked truck's own collision circles
    consider(x, z, r);
  });
  for (const c of animals.list) consider(c.x, c.z, 0.5);
  for (const r of rivals.list) consider(r.x, r.z, 0.6);
  if (steer) leave.heading += Math.max(-1, Math.min(1, steer)) * 3 * dt;
  else leave.heading -= leave.heading * Math.min(1, 1.5 * dt);
  leave.heading = Math.max(-0.9, Math.min(0.9, leave.heading));
}

const markM = new THREE.Matrix4(), markQ = new THREE.Quaternion(), markV = new THREE.Vector3(), markS = new THREE.Vector3(1, 1, 1);
function dropMarks() {
  const h = leave.heading, dx = truck.position.x - markX, dz = truck.position.z - markZ;
  if (Math.hypot(dx, dz) < MARK_STEP || markCount + 2 > 400) return;
  markX = truck.position.x; markZ = truck.position.z;
  markQ.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, h);
  for (const side of [-0.95, 0.95]) {
    markV.set(markX + Math.cos(h) * side - Math.sin(h) * 1.4, 0.03, markZ - Math.sin(h) * side - Math.cos(h) * 1.4);
    marks.setMatrixAt(markCount++, markM.compose(markV, markQ, markS.set(1, 1, MARK_STEP * 1.4)));
  }
  marks.count = markCount;
  marks.instanceMatrix.needsUpdate = true;
}

// Farmer and animals climb into the bed (back of the truck, -z side).
function board(dt) {
  const bx = truck.position.x, bz = truck.position.z - 1.2;
  const dx = bx - player.x, dz = bz - player.z;
  const d = Math.hypot(dx, dz);
  if (player.group.visible) {
    if (d < 0.3) { player.group.visible = false; sfx('door'); }
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
  steerTruck(dt);
  truck.position.x += Math.sin(leave.heading) * leave.v * dt;
  truck.position.z += Math.cos(leave.heading) * leave.v * dt;
  truck.rotation.y = leave.heading;
  dropMarks();
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
    setLoop('walk', !leave && !busted && player.run > 0.3);
    if (leave) { driveAway(dt); return; }
    if (busted) return;
    input.update();
    updatePlayer(player, input, grid, dt, CAMERA_YAW);
    const got = animals.update(dt, haul.length >= capacity);
    swipeCd -= dt;
    if (animals.blocked && swipeCd <= 0) { sfx('deny'); swipeCd = 0.7; flashFull(); }
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
    else if (armed && d < DEPOSIT_RADIUS) { busted = true; bankHaul(); startLeave(); }
  },

  exit() {
    setLoop('walk', false);
    hud.style.display = 'none';
    bustedEl.style.display = 'none';
    truck = leave = marks = scene = null;
    input = grid = player = animals = followers = rivals = particles = footsteps = indicators = camera = null;
  },
};
