import * as THREE from '../../lib/three.module.min.js';
import { createScene } from '../render/renderer.js';
import { makeTruck } from '../render/models.js';
import { createTrees } from '../render/instancing.js';
import { mat } from '../render/materials.js';
import { sfx } from '../systems/audio.js';

const DURATION = 2.6;
const fadeEl = document.getElementById('fade');

let camera, truck, t, canvas, ctxRef, active, timeout;

function finish() {
  if (!active || timeout) return;
  fadeEl.style.opacity = 1;
  timeout = setTimeout(() => {
    timeout = 0;
    if (!active) return;
    ctxRef.go('woods');
    requestAnimationFrame(() => { fadeEl.style.opacity = 0; });
  }, 260);
}

export const driveScreen = {
  enter(ctx) {
    ctxRef = ctx;
    active = true;
    timeout = 0;
    canvas = ctx.renderer.domElement;
    const scene = createScene();
    const road = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 260), mat(0x555555));
    road.position.set(0, 0.03, -110);
    scene.add(road);
    truck = makeTruck();
    truck.rotation.y = Math.PI;
    scene.add(truck);
    const trees = [];
    for (let z = 10; z > -200; z -= 4.5) {
      trees.push({ x: -(6 + Math.random() * 8), z: z + Math.random() * 2, s: 0.8 + Math.random() * 0.6 });
      trees.push({ x: 6 + Math.random() * 8, z: z + Math.random() * 2, s: 0.8 + Math.random() * 0.6 });
    }
    createTrees(scene, trees);
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 150);
    t = 0;
    sfx('engine');
    canvas.addEventListener('pointerdown', finish);
    return { scene, camera };
  },

  update(dt) {
    t += dt;
    const k = Math.min(1, t / DURATION);
    truck.position.z = -(k * k * 70 + k * 6);
    camera.position.set(7, 4, truck.position.z + 9);
    camera.lookAt(0, 1.2, truck.position.z - 2);
    if (t >= DURATION - 0.3) finish();
  },

  exit() {
    active = false;
    clearTimeout(timeout);
    timeout = 0;
    canvas.removeEventListener('pointerdown', finish);
    camera = truck = null;
  },
};
