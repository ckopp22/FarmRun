import { createScene } from '../render/renderer.js';
import { createChaseCamera, updateChaseCamera, snapCamera, CAMERA_YAW } from '../render/camera.js';
import { quality } from '../render/quality.js';
import { createGrid } from '../game/collision.js';
import { buildForest } from '../game/map.js';
import { createTruck } from '../game/truck.js';
import { createPlayer, updatePlayer } from '../game/player.js';
import { createAnimals } from '../game/animals.js';
import { createRivals } from '../game/rivals.js';
import { createFollowers } from '../game/followers.js';
import { activeSave, saveActive } from '../systems/save.js';

const BASE_CAPACITY = 3;
const ANIMAL_COUNT = 14;
const RIVAL_COUNT = 6;
const DEPOSIT_RADIUS = 2.8;   // distance from the truck that counts as walking into it
const ARM_DISTANCE = 8;       // must leave the truck area first, so spawning next to it doesn't end the run

let input, grid, player, animals, followers, rivals, camera, ctxRef;
let haul, capacity, armed, busted;
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

// Bank the haul: owned counts go up and the animals become discovered (color unlocked).
function finishRun() {
  const save = activeSave();
  if (save) {
    for (const a of haul) {
      save.owned[a.id] = (save.owned[a.id] || 0) + 1;
      save.discovered[a.id] = true;
    }
    save.runs++;
    saveActive();
  }
  ctxRef.go('farm');
}

export const woodsScreen = {
  enter(ctx) {
    ctxRef = ctx;
    input = ctx.input;
    const save = activeSave();
    capacity = BASE_CAPACITY + ((save && save.upgrades.bag) || 0);
    haul = [];
    armed = false;
    const scene = createScene();
    camera = createChaseCamera(window.innerWidth / window.innerHeight);
    grid = createGrid();
    createTruck(scene, grid, 0, 0);
    buildForest(scene, grid, quality().trees, 10);
    player = createPlayer(scene, 3.5, 3);
    animals = createAnimals(scene, grid, ANIMAL_COUNT, player);
    followers = createFollowers(scene, player);
    rivals = createRivals(scene, grid, RIVAL_COUNT, player);
    busted = false;
    bustedEl.style.display = 'none';
    snapCamera(camera, player.x, player.z);

    paintHud();
    hud.style.display = '';
    return { scene, camera };
  },

  update(dt) {
    if (busted) return;
    input.update();
    updatePlayer(player, input, grid, dt, CAMERA_YAW);
    const got = animals.update(dt, haul.length >= capacity);
    if (got) { haul.push(got); followers.add(got); paintHud(); }
    followers.update(dt);
    updateChaseCamera(camera, player.x, player.z, dt);
    if (rivals.update(dt)) { busted = true; bustedEl.style.display = ''; return; }

    const d = Math.hypot(player.x, player.z);
    if (d > ARM_DISTANCE) armed = true;
    else if (armed && d < DEPOSIT_RADIUS) finishRun();
  },

  exit() {
    hud.style.display = 'none';
    bustedEl.style.display = 'none';
    input = grid = player = animals = followers = rivals = camera = null;
  },
};
