import * as THREE from '../../lib/three.module.min.js';
import { createScene } from '../render/renderer.js';
import { makeBarn, makeFarmer, makeTruck, makeAnimal, silhouette, makeFence } from '../render/models.js';
import { createTrees } from '../render/instancing.js';
import { ANIMALS, UPGRADES } from '../data/animals.js';
import { activeSave } from '../systems/save.js';
import { tapSound } from '../systems/audio.js';

const PITCH = 55 * Math.PI / 180, DIST = 24;
const PEN = 3.6, PEN_Z0 = 9, PEN_DZ = 4.2, PEN_X = 2.2;
const PAN_MIN = 6, PAN_MAX = PEN_Z0 + (Math.ceil(ANIMALS.length / 2) - 1) * PEN_DZ - 4;

const ui = document.getElementById('farm-ui');
const moneyEl = document.getElementById('money');
const popEl = document.getElementById('animal-pop');
const shopEl = document.getElementById('shop-panel');
document.getElementById('shop-list').innerHTML =
  UPGRADES.map((u) => `<div class="shop-row"><span>${u}</span><span>Soon</span></div>`).join('');

let camera, canvas, scene, ctxRef, save;
let panZ, time, entries;   // entries: { a, group, x, z, owned, ph }
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let drag = null;

function showPop(e) {
  if (!e) { popEl.style.display = 'none'; return; }
  popEl.innerHTML = e.owned
    ? `<div class="n">${e.a.name}</div><div class="t">${e.a.tier} · Sells $${e.a.value.toLocaleString()}</div><div class="t">Owned: ${save.owned[e.a.id] || 0}</div>`
    : `<div class="n">???</div><div class="t">Not discovered yet</div>`;
  popEl.style.display = '';
}

function onDown(ev) {
  if (drag) return;
  drag = { id: ev.pointerId, y: ev.clientY, moved: 0, t: performance.now() };
}
function onMove(ev) {
  if (!drag || ev.pointerId !== drag.id) return;
  const dy = ev.clientY - drag.y;
  drag.y = ev.clientY;
  drag.moved += Math.abs(dy);
  const k = (2 * DIST * Math.tan(25 * Math.PI / 180)) / window.innerHeight / Math.sin(PITCH);
  panZ = Math.min(PAN_MAX, Math.max(PAN_MIN, panZ - dy * k));
}
function onUp(ev) {
  if (!drag || ev.pointerId !== drag.id) return;
  const tap = drag.moved < 10 && performance.now() - drag.t < 500;
  drag = null;
  if (!tap) return;
  ndc.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(entries.map((e) => e.group), true);
  if (!hits.length) { showPop(null); return; }
  let o = hits[0].object;
  while (o && !o.userData.animalId) o = o.parent;
  showPop(entries.find((e) => e.a.id === o.userData.animalId));
  tapSound();
}

const closeShop = () => { shopEl.style.display = 'none'; };
const onShop = () => { tapSound(); shopEl.style.display = ''; };
const onRun = () => { tapSound(); ctxRef.go('woods'); };
document.getElementById('shop-btn').addEventListener('click', onShop);
document.getElementById('shop-close').addEventListener('click', () => { tapSound(); closeShop(); });
document.getElementById('run-btn').addEventListener('click', onRun);

export const farmScreen = {
  enter(ctx) {
    ctxRef = ctx;
    canvas = ctx.renderer.domElement;
    save = activeSave() || { money: 0, owned: {}, discovered: {} };
    scene = createScene();

    const barn = makeBarn();
    barn.position.set(0, 0, -1);
    scene.add(barn);
    const farmer = makeFarmer();
    farmer.position.set(0, 0, 4.5);
    scene.add(farmer);
    const truck = makeTruck();
    truck.position.set(-7, 0, 1);
    truck.rotation.y = 0.5;
    scene.add(truck);
    createTrees(scene, [
      { x: 8, z: 0, s: 1.2 }, { x: -9, z: 8, s: 1 }, { x: 9, z: 12, s: 1.1 },
      { x: -10, z: 20, s: 1.2 }, { x: 10, z: 24, s: 1 }, { x: -9, z: 31, s: 1.1 }, { x: 9, z: 35, s: 1.2 },
    ]);

    const pens = ANIMALS.map((_, i) => ({ x: (i % 2 ? 1 : -1) * PEN_X, z: PEN_Z0 + Math.floor(i / 2) * PEN_DZ }));
    makeFence(scene, pens, PEN);

    entries = ANIMALS.map((a, i) => {
      const owned = !!(save.discovered && save.discovered[a.id]);
      const group = makeAnimal(a);
      if (!owned) silhouette(group);
      scene.add(group);
      return { a, group, x: pens[i].x, z: pens[i].z, owned, ph: i * 1.7 };
    });

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 150);
    panZ = PAN_MIN;
    time = 0;
    moneyEl.textContent = '$' + save.money.toLocaleString();
    showPop(null);
    closeShop();
    ui.style.display = '';
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', () => { drag = null; });
    return { scene, camera };
  },

  update(dt) {
    time += dt;
    for (const e of entries) {
      if (!e.owned) { e.group.position.set(e.x, 0, e.z); continue; }
      const t = time * 0.6 + e.ph;
      e.group.position.set(e.x + Math.sin(t) * 0.7, Math.abs(Math.sin(time * 5 + e.ph)) * 0.05, e.z + Math.cos(t * 0.8) * 0.7);
      e.group.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 0.8) * 0.8);
    }
    const sway = Math.sin(time * 0.4) * 0.4;
    camera.position.set(sway, Math.sin(PITCH) * DIST, panZ + Math.cos(PITCH) * DIST);
    camera.lookAt(sway * 0.5, 0, panZ);
  },

  exit() {
    ui.style.display = 'none';
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    drag = null;
    camera = scene = entries = null;
  },
};
