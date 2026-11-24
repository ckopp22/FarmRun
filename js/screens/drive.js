import * as THREE from '../../lib/three.module.min.js';
import { createScene, speckleTexture } from '../render/renderer.js';
import { addSantaDecor, twinkleLights, moveSanta, makeTruck, makeSafariTruck, makeSnowmobile, makeSeatedFarmer } from '../render/models.js';
import { createTrees, createDesertProps, createWinterProps } from '../render/instancing.js';
import { sfx, setMusic } from '../systems/audio.js';

const DURATION = 2.6;
const fadeEl = document.getElementById('fade');

let mapZoom = 1, camera, truck, t, canvas, ctxRef, active, timeout;

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

let santaTruck = false;
export const driveScreen = {
  enter(ctx) {
    ctxRef = ctx;
    active = true;
    timeout = 0;
    canvas = ctx.renderer.domElement;
    const winter = ctx.map === 'winter', desert = ctx.map === 'desert';
    const scene = createScene(winter ? 'winter' : desert);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 260).rotateX(-Math.PI / 2),
      new THREE.MeshLambertMaterial({ map: speckleTexture([85, 85, 85], 16, 909, [6 / 16, 260 / 16]) })
    );
    road.position.set(0, 0.055, -110);
    scene.add(road);
    mapZoom = winter || desert ? 1.3 : 1;
    truck = winter ? makeSnowmobile() : desert ? makeSafariTruck() : makeTruck();
    if (winter) truck.add(makeSeatedFarmer());
    santaTruck = !!ctx.santaRun;
    if (santaTruck) addSantaDecor(truck, winter ? 'snow' : desert ? 'safari' : 'truck');
    truck.rotation.y = Math.PI;
    scene.add(truck);
    const trees = [];
    for (let z = 10; z > -200; z -= 4.5) {
      trees.push({ x: -(6 + Math.random() * 8), z: z + Math.random() * 2, s: 0.8 + Math.random() * 0.6, t: 'cactus' });
      trees.push({ x: 6 + Math.random() * 8, z: z + Math.random() * 2, s: 0.8 + Math.random() * 0.6, t: Math.random() < 0.3 ? 'rock' : 'cactus' });
    }
    if (winter) createWinterProps(scene, trees.map((t) => ({ ...t, t: t.t === 'rock' ? 'rock' : 'pine' })));
    else if (desert) createDesertProps(scene, trees);
    else createTrees(scene, trees);
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 150);
    t = 0;
    sfx('engine');
    setMusic('woods');   // start the big chase track during the cutscene, not once play begins
    canvas.addEventListener('pointerdown', finish);
    return { scene, camera };
  },

  update(dt) {
    t += dt;
    if (santaTruck) { twinkleLights(t); moveSanta(truck, t); }
    const k = Math.min(1, t / DURATION);
    truck.position.z = -(k * k * 70 + k * 6);
    const zm = mapZoom;
    camera.position.set(9 * zm, 5.5 * zm, truck.position.z + 12 * zm);
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
