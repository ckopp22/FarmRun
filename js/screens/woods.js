import { createScene } from '../render/renderer.js';
import { createChaseCamera, updateChaseCamera, snapCamera, CAMERA_YAW } from '../render/camera.js';
import { quality } from '../render/quality.js';
import { createGrid } from '../game/collision.js';
import { buildForest } from '../game/map.js';
import { createTruck } from '../game/truck.js';
import { createPlayer, updatePlayer } from '../game/player.js';
import { createChickens } from '../game/chickens.js';

let input, grid, player, chickens, camera;
let collected = 0;
const countEl = document.getElementById('chicken-count');
const chickenHud = document.getElementById('chickens');

export const woodsScreen = {
  enter(ctx) {
    input = ctx.input;
    const scene = createScene();
    camera = createChaseCamera(window.innerWidth / window.innerHeight);
    grid = createGrid();
    createTruck(scene, grid, 0, 0);
    buildForest(scene, grid, quality().trees, 10);
    player = createPlayer(scene, 3.5, 3);
    chickens = createChickens(scene, grid, 6, player);
    snapCamera(camera, player.x, player.z);

    collected = 0;
    countEl.textContent = '0';
    chickenHud.style.display = '';
    return { scene, camera };
  },

  update(dt) {
    input.update();
    updatePlayer(player, input, grid, dt, CAMERA_YAW);
    const got = chickens.update(dt);
    if (got) { collected += got; countEl.textContent = collected; }
    updateChaseCamera(camera, player.x, player.z, dt);
  },

  exit() {
    chickenHud.style.display = 'none';
    input = grid = player = chickens = camera = null;
  },
};
