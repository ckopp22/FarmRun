import * as THREE from '../../lib/three.module.min.js';
import { createScene } from '../render/renderer.js';
import { makeBarn, makeTruck } from '../render/models.js';
import { createTrees } from '../render/instancing.js';
import { renderSlots } from './slots.js';
import { startSlot } from '../systems/save.js';
import { unlockAudio, tapSound } from '../systems/audio.js';

const menuEl = document.getElementById('menu');
const slotsEl = document.getElementById('slots');
const RADIUS = 17, HEIGHT = 8;

let camera, angle, ctxRef;

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
    truck.position.set(7, 0, 3);
    truck.rotation.y = -0.6;
    scene.add(truck);
    createTrees(scene, [
      { x: -8, z: -3, s: 1.2 }, { x: -6, z: 5, s: 1 }, { x: 9, z: -5, s: 1.1 },
      { x: -11, z: 1, s: 0.9 }, { x: 4, z: -9, s: 1.3 }, { x: -3, z: -10, s: 1 },
    ]);
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 150);
    angle = 0.6;
    show(menuEl, true);
    show(slotsEl, false);
    return { scene, camera };
  },

  update(dt) {
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
