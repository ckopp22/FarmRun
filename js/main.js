import { createRenderer, createScene, watchResize, watchContext } from './render/renderer.js';
import { createChaseCamera, updateChaseCamera, snapCamera, CAMERA_YAW } from './render/camera.js';
import { createGrid } from './game/collision.js';
import { buildForest } from './game/map.js';
import { createTruck } from './game/truck.js';
import { createPlayer, updatePlayer } from './game/player.js';
import { createChickens } from './game/chickens.js';
import { createInput } from './systems/input.js';

const canvas = document.getElementById('game');
const fpsEl = document.getElementById('fps');
const countEl = document.getElementById('chicken-count');

const renderer = createRenderer(canvas);
const scene = createScene();
const camera = createChaseCamera(window.innerWidth / window.innerHeight);
const grid = createGrid();
const input = createInput();

createTruck(scene, grid, 0, 0);
buildForest(scene, grid, 200, 10);
const player = createPlayer(scene, 3.5, 3);
const chickens = createChickens(scene, grid, 6, player);
snapCamera(camera, player.x, player.z);
watchResize(renderer, camera);

let collected = 0;
let running = true;
let last = performance.now();
let raf = 0;
let frames = 0, fpsTime = 0;

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);

  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  input.update();
  updatePlayer(player, input, grid, dt, CAMERA_YAW);
  const got = chickens.update(dt);
  if (got) { collected += got; countEl.textContent = collected; }
  updateChaseCamera(camera, player.x, player.z, dt);
  renderer.render(scene, camera);

  frames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fpsEl.textContent = Math.round(frames / fpsTime) + ' fps';
    window.__fps = frames / fpsTime;
    frames = 0; fpsTime = 0;
  }
}

function start() {
  running = true;
  last = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

watchContext(canvas, () => { running = false; }, () => start());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) running = false;
  else if (!running) start();
});

start();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
