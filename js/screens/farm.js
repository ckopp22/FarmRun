import * as THREE from '../../lib/three.module.min.js';
import { createScene } from '../render/renderer.js';
import { makeBarn, makeFarmer, makeTruck, makeAnimal, silhouette, makeFence } from '../render/models.js';
import { createTrees } from '../render/instancing.js';
import { ANIMALS, UPGRADES } from '../data/animals.js';
import { level, nextCost, buy } from '../systems/economy.js';
import { activeSave, saveActive } from '../systems/save.js';
import { createConfetti } from '../game/confetti.js';
import { tapSound } from '../systems/audio.js';

const PITCH = 55 * Math.PI / 180, DIST = 24;
const PEN = 3.6, PEN_Z0 = 9, PEN_DZ = 4.2, PEN_X = 2.2;
const PAN_MIN = 6, PAN_MAX = PEN_Z0 + (Math.ceil(ANIMALS.length / 2) - 1) * PEN_DZ - 4;

const ui = document.getElementById('farm-ui');
const moneyEl = document.getElementById('money');
const popEl = document.getElementById('animal-pop');
const shopEl = document.getElementById('shop-panel');
const winEl = document.getElementById('win');
const WIN_MONEY = 1000000;

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

document.getElementById('win-keep').addEventListener('click', () => {
  tapSound();
  winEl.style.display = 'none';
  if (confetti) confetti.show(false);
});
document.getElementById('win-menu').addEventListener('click', () => { tapSound(); ctxRef.go('menu'); });
const shopList = document.getElementById('shop-list');

function renderShop() {
  shopList.innerHTML = UPGRADES.map((u) => {
    const lv = level(save, u.id), cost = nextCost(save, u.id);
    const action = cost === undefined ? '<span>MAX</span>'
      : `<button data-id="${u.id}" ${save.money < cost ? 'disabled' : ''}>$${cost.toLocaleString()}</button>`;
    return `<div class="shop-row"><div><div class="sn">${u.name}</div><div class="sd">${u.desc} · Lv ${lv}/${u.costs.length}</div></div>${action}</div>`;
  }).join('');
}

shopList.addEventListener('click', (ev) => {
  const id = ev.target.dataset && ev.target.dataset.id;
  if (id && buy(save, id)) {
    tapSound();
    moneyEl.textContent = '$' + save.money.toLocaleString();
    renderShop();
  }
});

let camera, canvas, scene, ctxRef, save, confetti;
let panZ, time, entries;   // entries: { a, group, x, z, owned, ph, reveal } (reveal = seconds until the color unlock, -1 = none)
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let drag = null;

function showPop(e) {
  if (!e) { popEl.style.display = 'none'; return; }
  popEl.innerHTML = e.owned
    ? `<div class="n">${e.a.name}</div><div class="t">${e.a.tier} · Sells $${e.a.value.toLocaleString()}</div><div class="t">Caught: ${save.owned[e.a.id] || 0}</div>`
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
const onShop = () => { tapSound(); renderShop(); shopEl.style.display = ''; };
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

    const newly = ctx.newlyFound || [];
    ctx.newlyFound = [];
    const newOrder = ANIMALS.map((a) => a.id).filter((id) => newly.includes(id));
    entries = ANIMALS.map((a, i) => {
      const isNew = newly.includes(a.id);
      const owned = !!(save.discovered && save.discovered[a.id]) && !isNew;
      const group = makeAnimal(a);
      if (!owned) silhouette(group);
      scene.add(group);
      return { a, group, x: pens[i].x, z: pens[i].z, owned, ph: i * 1.7, reveal: isNew ? 0.8 + newOrder.indexOf(a.id) * 1.2 : -1 };
    });

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 150);
    panZ = PAN_MIN;
    if (newOrder.length) {
      const e = entries.find((x) => x.a.id === newOrder[0]);
      panZ = Math.min(PAN_MAX, Math.max(PAN_MIN, e.z - 4));
    }
    time = 0;
    moneyEl.textContent = '$' + save.money.toLocaleString();
    showPop(null);
    closeShop();
    confetti = createConfetti(scene);
    winEl.style.display = 'none';
    if (save.money >= WIN_MONEY && !save.won) {
      save.won = true;
      saveActive();
      const found = Object.keys(save.discovered).length;
      document.getElementById('win-stats').innerHTML =
        `<div class="res-row"><span>Play time</span><span>${fmtTime(save.playTime)}</span></div>` +
        `<div class="res-row"><span>Animals collected</span><span>${found}/${ANIMALS.length}</span></div>` +
        `<div class="res-row"><span>Runs made</span><span>${save.runs}</span></div>`;
      winEl.style.display = '';
      confetti.show(true);
    }
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
      if (e.reveal >= 0) {
        e.reveal -= dt;
        if (e.reveal < 0) {
          scene.remove(e.group);
          e.group = makeAnimal(e.a);
          e.group.scale.setScalar(0.1);
          e.popT = 0;
          scene.add(e.group);
          e.owned = true;
          popEl.innerHTML = `<div class="n">NEW! ${e.a.name}</div><div class="t">${e.a.tier}</div>`;
          popEl.style.display = '';
        }
      }
      if (e.popT !== undefined) {
        e.popT += dt;
        const t = Math.min(1, e.popT / 0.5);
        e.group.scale.setScalar(t < 1 ? 0.1 + 0.9 * t + Math.sin(t * Math.PI) * 0.3 : 1);
        if (t >= 1) e.popT = undefined;
      }
      if (!e.owned) { e.group.position.set(e.x, 0, e.z); continue; }
      const t = time * 0.6 + e.ph;
      e.group.position.set(e.x + Math.sin(t) * 0.7, Math.abs(Math.sin(time * 5 + e.ph)) * 0.05, e.z + Math.cos(t * 0.8) * 0.7);
      e.group.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 0.8) * 0.8);
    }
    confetti.update(dt, time, 0, panZ);
    const sway = Math.sin(time * 0.4) * 0.4;
    camera.position.set(sway, Math.sin(PITCH) * DIST, panZ + Math.cos(PITCH) * DIST);
    camera.lookAt(sway * 0.5, 0, panZ);
  },

  exit() {
    ui.style.display = 'none';
    winEl.style.display = 'none';
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    drag = null;
    camera = scene = entries = confetti = null;
  },
};
