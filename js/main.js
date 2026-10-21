import { createRenderer, watchResize, watchContext, fitRenderer } from './render/renderer.js';
import { createInput } from './systems/input.js';
import { createScreenManager } from './screens/manager.js';
import { woodsScreen } from './screens/woods.js';
import { farmScreen } from './screens/farm.js';
import { activeSave } from './systems/save.js';
import { driveScreen } from './screens/drive.js';
import { getQuality, setQuality } from './render/quality.js';
import { menuScreen } from './screens/menu.js';
import { audioSettings, toggle, unlockAudio, tapSound } from './systems/audio.js';

const canvas = document.getElementById('game');
const fpsEl = document.getElementById('fps');

const renderer = createRenderer(canvas);
const ctx = { renderer, input: createInput() };
const screens = createScreenManager(renderer, ctx);
screens.register('menu', menuScreen);
screens.register('farm', farmScreen);
screens.register('drive', driveScreen);
screens.register('woods', woodsScreen);
watchResize(renderer, screens.camera);

let running = true;
let last = performance.now();
let raf = 0;
let frames = 0, fpsTime = 0;
let slowTime = 0;
const QUALITY_STEPS = ['high', 'medium', 'low'];

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);

  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  const sv = activeSave();
  if (sv) sv.playTime += dt;
  screens.update(dt);
  screens.render();

  frames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fpsEl.textContent = Math.round(frames / fpsTime) + ' fps';
    window.__fps = frames / fpsTime;
    // Adaptive quality: after ~4s of sustained low fps, step the setting down one level.
    slowTime = window.__fps < 40 ? slowTime + 0.5 : Math.max(0, slowTime - 0.5);
    if (slowTime >= 4) {
      slowTime = 0;
      const next = QUALITY_STEPS[QUALITY_STEPS.indexOf(getQuality()) + 1];
      if (next) { setQuality(next); fitRenderer(renderer, screens.camera()); }
    }
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

for (const [id, kind] of [['sound-btn', 'sound'], ['music-btn', 'music']]) {
  const btn = document.getElementById(id);
  const paint = () => {
    const on = audioSettings()[kind];
    btn.classList.toggle('off', !on);
    if (kind === 'sound') btn.textContent = on ? '🔊' : '🔇';
  };
  btn.addEventListener('click', () => { unlockAudio(); toggle(kind); paint(); tapSound(); });
  paint();
}

screens.go('menu');
start();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const banner = document.getElementById('update-banner');
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('service-worker.js').then((reg) => {
    const offer = (worker) => {
      banner.style.display = '';
      banner.onclick = () => { banner.textContent = 'Updating...'; worker.postMessage('skip'); };
    };
    if (reg.waiting && hadController) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
      });
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) location.reload(); });
}
