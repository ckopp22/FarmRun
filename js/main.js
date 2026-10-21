import { createRenderer, watchResize, watchContext } from './render/renderer.js';
import { createInput } from './systems/input.js';
import { createScreenManager } from './screens/manager.js';
import { woodsScreen } from './screens/woods.js';

const canvas = document.getElementById('game');
const fpsEl = document.getElementById('fps');

const renderer = createRenderer(canvas);
const ctx = { renderer, input: createInput() };
const screens = createScreenManager(renderer, ctx);
screens.register('woods', woodsScreen);
watchResize(renderer, screens.camera);

let running = true;
let last = performance.now();
let raf = 0;
let frames = 0, fpsTime = 0;

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);

  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  screens.update(dt);
  screens.render();

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

screens.go('woods');
start();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
