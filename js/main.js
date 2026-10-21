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

// iOS standalone can start with a viewport short by the top inset; toggling the viewport meta makes it recompute.
if (navigator.standalone) {
  const vp = document.querySelector('meta[name="viewport"]');
  const good = vp.content;
  const kick = () => {
    vp.content = good.replace('viewport-fit=cover', 'viewport-fit=auto');
    requestAnimationFrame(() => {
      vp.content = good;
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
  };
  setTimeout(kick, 100);
  setTimeout(kick, 800);
}

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
  else if (!running && pauseEl.style.display === 'none') start();
});

for (const [id, kind] of [['sound-btn', 'sound'], ['music-btn', 'music']]) {
  const btn = document.getElementById(id);
  const paint = () => {
    const on = audioSettings()[kind];
    btn.classList.toggle('off', !on);
    if (kind === 'sound') btn.textContent = on ? '🔊 Sound' : '🔇 Sound';
  };
  btn.addEventListener('click', () => { unlockAudio(); toggle(kind); paint(); tapSound(); });
  paint();
}

const dropEl = document.getElementById('menu-drop');
const pauseBtn = document.getElementById('pause-btn');
const pauseEl = document.getElementById('pause');
const shopItem = document.getElementById('shop-menu-btn');
document.getElementById('menu-btn').addEventListener('click', () => {
  tapSound();
  const open = dropEl.style.display === 'none';
  shopItem.style.display = document.getElementById('farm-ui').style.display === 'none' ? 'none' : '';
  dropEl.style.display = open ? '' : 'none';
});
shopItem.addEventListener('click', () => {
  dropEl.style.display = 'none';
  document.getElementById('shop-btn').click();
});
const setPaused = (p) => {
  pauseEl.style.display = p ? '' : 'none';
  if (p) running = false;
  else if (!running) start();
};
pauseBtn.addEventListener('click', () => { tapSound(); dropEl.style.display = 'none'; setPaused(true); });
document.getElementById('resume-btn').addEventListener('click', () => { tapSound(); setPaused(false); });
document.getElementById('pause-menu-btn').addEventListener('click', () => {
  tapSound();
  setPaused(false);
  screens.go('menu');
});
document.addEventListener('screenchange', (e) => {
  pauseBtn.style.display = e.detail === 'menu' ? 'none' : '';
  document.documentElement.style.setProperty('--top', e.detail === 'menu' ? '#9fd4f0' : '#5fa83f');
});

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
