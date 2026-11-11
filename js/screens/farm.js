import * as THREE from '../../lib/three.module.min.js';
import { createScene, addDirt, addDirtRing } from '../render/renderer.js';
import { animateFarmer, makeBarn, makeAdobe, makeFarmer, makeTruck, makeSafariTruck, makeAnimal, silhouette, makeFence } from '../render/models.js';
import { createTrees, createFlowers, createDesertProps } from '../render/instancing.js';
import { ANIMALS, SAFARI_ANIMALS, UPGRADES, DESERT_COST } from '../data/animals.js';
import { level, nextCost, buy, penCount, nextPenCost, buyPen, desertAvailable, buyDesert, safariPenCount, nextSafariPenCost, buySafariPen } from '../systems/economy.js';
import { activeSave, saveActive } from '../systems/save.js';
import { createConfetti } from '../game/confetti.js';
import { createParticles } from '../render/particles.js';
import { tapSound, sfx, setMusic } from '../systems/audio.js';

const PITCH = 42 * Math.PI / 180, DIST = 24;
const dist = () => window.innerHeight > window.innerWidth ? DIST * 1.65 : DIST * 0.65;   // zoom out in portrait, in on landscape
const PEN = 3.6, PEN_Z0 = 9, PEN_DZ = 4.2, PEN_X = 2.2;
const PAN_MIN = 6;
let PAN_MAX = PAN_MIN;

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

const soundEl = document.getElementById('sound');
function updateShopHint() {
  const pen = desert ? nextSafariPenCost(save) : nextPenCost(save);
  const can = (pen !== undefined && save.money >= pen) || UPGRADES.some((u) => { const c = nextCost(save, u.id); return c !== undefined && save.money >= c; });
  soundEl.classList.toggle('can-buy', can);
}

function renderShop() {
  const penCost = desert ? nextSafariPenCost(save) : nextPenCost(save), list = mapAnimals(), pc = desert ? safariPenCount(save) : penCount(save);
  const penRow = `<div class="shop-row"><div><div class="sn">+1 Animal Pen</div><div class="sd">Unlocks ${penCost === undefined ? 'nothing more' : list[pc].name} · ${pc}/${list.length} pens</div></div>${penCost === undefined ? '<span>MAX</span>' : `<button data-id="pen" ${save.money < penCost ? 'disabled' : ''}>$${penCost.toLocaleString()}</button>`}</div>`;
  const desertRow = desertAvailable(save) ? `<div class="shop-row"><div><div class="sn">Desert Map</div><div class="sd">A new safari farm with 24 new animals</div></div><button data-id="desert" ${save.money < DESERT_COST ? 'disabled' : ''}>$${DESERT_COST.toLocaleString()}</button></div>` : '';
  shopList.innerHTML = desertRow + penRow + UPGRADES.map((u) => {
    const lv = level(save, u.id), cost = nextCost(save, u.id);
    const action = cost === undefined ? '<span>MAX</span>'
      : `<button data-id="${u.id}" ${save.money < cost ? 'disabled' : ''}>$${cost.toLocaleString()}</button>`;
    return `<div class="shop-row"><div><div class="sn">${u.name}</div><div class="sd">${u.desc} · Lv ${lv}/${u.costs.length}</div></div>${action}</div>`;
  }).join('');
}

shopList.addEventListener('click', (ev) => {
  const id = ev.target.dataset && ev.target.dataset.id;
  if (id === 'pen') {
    if (!(desert ? buySafariPen(save) : buyPen(save))) return;
    sfx('cash');
    closeShop();
    ctxRef.go('farm');
    return;
  }
  if (id === 'desert') {
    if (!buyDesert(save)) return;
    sfx('cash');
    moneyEl.textContent = '$' + save.money.toLocaleString();
    updateShopHint();
    renderShop();
    return;
  }
  if (id && buy(save, id)) {
    sfx('cash');
    moneyEl.textContent = '$' + save.money.toLocaleString();
    updateShopHint();
    renderShop();
  }
});

let camera, canvas, scene, ctxRef, save, confetti, particles;
let desert = false;   // which map is showing
let farmer, swipe = null, arrive = null;   // swipe: farmer running off to the other map; arrive: farmer running in
const SWIPE_PX = 70, RUN_SPEED = 9;
const fadeEl = document.createElement('div');
fadeEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:5';
document.body.appendChild(fadeEl);
const mapBtn = document.createElement('button');
mapBtn.style.cssText = 'position:fixed;top:50%;width:44px;height:64px;margin-top:-32px;border:0;border-radius:12px;background:rgba(0,0,0,.35);color:#fff;font:bold 34px sans-serif;display:none;z-index:4';
document.body.appendChild(mapBtn);
function startSwipe(dir) {
  if (swipe || arrive || !save.desert || (dir > 0) === desert) return;   // right goes to the desert, left comes back
  swipe = { dir, t: 0 };
  showPop(null); selected = null; paintSell();
  tapSound();
}
mapBtn.addEventListener('click', () => startSwipe(desert ? -1 : 1));
const mapAnimals = () => desert ? SAFARI_ANIMALS : ANIMALS;
let panZ, time, entries;   // entries: { a, group, x, z, owned, ph, reveal } (reveal = seconds until the color unlock, -1 = none)
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let drag = null;
let selected = null;   // pen entry picked for selling
const sellMin = (e) => e.a.tier === 'Common' ? 5 : 2;   // Common sells from 5 (all of them), others from 2
const sellQty = (e) => e.a.tier === 'Common' ? held(e) : held(e) - 1;   // others always keep one in the pen
const PEN_SPOTS = [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]];   // offsets for animals 2-5 (max 5 shown per pen)
const held = (e) => save.owned[e.a.id] || 0;
const cashTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#2e9e4f'; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
  x.lineWidth = 8; x.strokeStyle = '#fff'; x.stroke();
  x.fillStyle = '#fff'; x.font = 'bold 84px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('$', 64, 70);
  return new THREE.CanvasTexture(c);
})();

const PEN_SHADOW = 0.5;   // pen animals get a smaller blob shadow
const plural = (n) => /^(Sheep|Bison|Deer)$/.test(n) ? n : /x$/.test(n) ? n + 'es' : /Goose$/.test(n) ? n.replace(/Goose$/, 'Geese') : /y$/.test(n) ? n.slice(0, -1) + 'ies' : n + 's';
function showPop(e) {
  if (!e) { popEl.style.display = 'none'; return; }
  popEl.innerHTML = e.owned
    ? `<div class="n">${plural(e.a.name)} - ${save.owned[e.a.id] || 0}</div><div class="t">${e.a.tier} · $${e.a.value.toLocaleString()}</div>`
    : `<div class="n">???</div><div class="t">Not discovered yet</div>`;
  popEl.style.display = '';
}

function onDown(ev) {
  if (drag) return;
  drag = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, y: ev.clientY, moved: 0, t: performance.now() };
}
function onMove(ev) {
  if (!drag || ev.pointerId !== drag.id) return;
  const dy = ev.clientY - drag.y;
  drag.y = ev.clientY;
  drag.moved += Math.abs(dy);
  const dx = ev.clientX - drag.x0;
  if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > 1.5 * Math.abs(ev.clientY - drag.y0)) { drag.moved = 99; startSwipe(dx > 0 ? 1 : -1); }
  if (swipe) return;
  const k = (2 * dist() * Math.tan(25 * Math.PI / 180)) / window.innerHeight / Math.sin(PITCH);
  panZ = Math.min(PAN_MAX, Math.max(PAN_MIN, panZ - dy * k));
}
function onUp(ev) {
  if (!drag || ev.pointerId !== drag.id) return;
  const tap = drag.moved < 10 && performance.now() - drag.t < 500;
  drag = null;
  if (!tap) return;
  ndc.set((ev.clientX / window.innerWidth) * 2 - 1, -(ev.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(entries.flatMap((e) => [e.group, e.cash, e.sign, ...e.extras].filter((g) => g.visible)), true);
  let e;
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.animalId) o = o.parent;
    e = entries.find((en) => en.a.id === o.userData.animalId);
  } else {
    const pt = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    e = pt && entries.find((en) => Math.abs(pt.x - en.x) <= PEN / 2 && Math.abs(pt.z - en.z) <= PEN / 2);
  }
  if (!e) { showPop(null); selected = null; paintSell(); return; }
  showPop(e);
  if (e.owned) { e.pet = 1.5; particles.burst(e.x, 1, e.z, 0xff7fa8, 8, 3); }
  selected = e.owned && held(e) >= sellMin(e) ? e : null;
  paintSell();
  tapSound();
}

const closeShop = () => { shopEl.style.display = 'none'; };
const onShop = () => { tapSound(); renderShop(); shopEl.style.display = ''; };
const onRun = () => { tapSound(); ctxRef.go('drive'); };
document.getElementById('shop-btn').addEventListener('click', onShop);
document.getElementById('shop-close').addEventListener('click', () => { tapSound(); closeShop(); });
document.getElementById('run-btn').addEventListener('click', onRun);

// Empty-pen marker: a dotted border with a faint picture of the animal that belongs there.
let iconTargets = [];
const borderTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.strokeStyle = '#fff'; x.lineWidth = 8; x.lineCap = 'round'; x.setLineDash([2, 18]);
  x.strokeRect(14, 14, 228, 228);
  return new THREE.CanvasTexture(c);
})();

function makeGhost(renderer, a) {
  const rt = new THREE.WebGLRenderTarget(256, 256);
  iconTargets.push(rt);
  const mini = new THREE.Scene();
  mini.add(new THREE.HemisphereLight(0xffffff, 0x888888, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-3, 6, 4);
  mini.add(sun);
  const animal = makeAnimal(a);
  animal.traverse((o) => { if (o.material && o.material.transparent) o.visible = false; });   // skip the blob shadow
  mini.add(animal);
  const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 50);
  cam.position.set(2.5, 2.2, 4.5);
  cam.lookAt(0, 0.5, 0);
  const color = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 0);
  renderer.setRenderTarget(rt);
  renderer.clear();
  renderer.render(mini, cam);
  renderer.setRenderTarget(null);
  renderer.setClearColor(color, alpha);

  const g = new THREE.Group();
  const img = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, opacity: 0.55, depthWrite: false }));
  const border = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), new THREE.MeshBasicMaterial({ map: borderTex, transparent: true, opacity: 0.8, depthWrite: false }));
  img.position.z = 0.01;
  g.add(border, img);
  g.rotation.x = -Math.PI / 2;
  g.userData.animalId = a.id;
  return g;
}

function checkWin() {
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
    sfx('win');
  }
}

const sellBtn = document.getElementById('sell-btn');
function paintSell() {
  if (entries) for (const e of entries) e.cash.visible = held(e) >= sellMin(e);
  sellBtn.style.display = selected ? '' : 'none';
  if (selected) sellBtn.textContent = `SELL ${sellQty(selected)} = $${(sellQty(selected) * selected.a.value).toLocaleString()}`;
}
function splashCash() {
  const r = sellBtn.getBoundingClientRect();
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div');
    el.className = 'cash-splash';
    el.textContent = '$';
    el.style.left = r.left + r.width * (0.1 + Math.random() * 0.8) + 'px';
    el.style.top = r.top + r.height / 2 + 'px';
    document.body.appendChild(el);
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 30;
    const s = 0.7 + Math.random() * 0.9;
    el.animate(
      [{ transform: 'translate(0, 0) scale(0.4)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 1, offset: 0.35 }, { transform: `translate(${dx * 1.2}px, ${dy * 1.2 + 25}px) scale(${s})`, opacity: 0 }],
      { duration: 1600 + Math.random() * 600, easing: 'ease-out' }
    ).onfinish = () => el.remove();
  }
}
sellBtn.addEventListener('click', () => {
  if (!selected || held(selected) < sellMin(selected)) return;
  splashCash();
  const qty = sellQty(selected);
  save.money += qty * selected.a.value;
  save.owned[selected.a.id] -= qty;
  saveActive();
  sfx('cash');
  moneyEl.textContent = '$' + save.money.toLocaleString();
  updateShopHint();
  selected = null;
  showPop(null);
  paintSell();
  checkWin();
});

// Flowers scattered over the grass (always); the dirt path around the pens appears once every pen is unlocked.
function addFarmDecor(scene, complete, trees, total = ANIMALS.length) {
  const zMax = PEN_Z0 + (Math.ceil(total / 2) - 1) * PEN_DZ + PEN / 2 + 1.5;
  const hx = PEN_X + PEN / 2;
  if (complete) addDirtRing(scene, { x0: -hx, x1: hx, z0: PEN_Z0 - PEN / 2, z1: zMax - 1.5 });
  let seed = 4711;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const flowers = [];
  for (let n = 0; n < 3000 && flowers.length < 560; n++) {
    const x = (rnd() - 0.5) * 70, z = -26 + rnd() * (zMax + 52);
    if (Math.abs(x) < 8 && z > 3.4 && z < zMax + 1.5) continue;           // pens and dirt path
    if (Math.abs(x) < 7 && z <= 6) continue;                              // barn and farmer
    if (Math.hypot(x + 7, z - 1) < 5.8) continue;                         // truck patch
    const rx = x + 7, rz = z - 1, along = rx * 0.949 + rz * 0.315, perp = Math.abs(rx * 0.315 - rz * 0.949);
    if (perp < 4.5 && along < 5) continue;                                // road
    if (trees.some((t) => Math.hypot(x - t.x, z - t.z) < 1.6)) continue;
    flowers.push({ x, z, s: 0.8 + rnd() * 0.7, c: Math.floor(rnd() * 5) });
  }
  if (!desert) createFlowers(scene, flowers);
}

export const farmScreen = {
  enter(ctx) {
    ctxRef = ctx;
    canvas = ctx.renderer.domElement;
    save = activeSave() || { money: 0, owned: {}, discovered: {} };
    desert = ctx.map === 'desert';
    scene = createScene(desert);
    scene.fog = null;

    const barn = desert ? makeAdobe() : makeBarn();
    barn.position.set(0, 0, -1);
    scene.add(barn);
    farmer = makeFarmer();
    farmer.position.set(0, 0, 4.5);
    scene.add(farmer);
    addDirt(scene, -7 - 0.949 * 22, 1 - 0.315 * 22, { w: 4.5, len: 50, yaw: 1.25 });
    addDirt(scene, -7, 1, { radius: 3.5, y: 0.04 });   // above the road so the overlap doesn't z-fight
    const truck = desert ? makeSafariTruck() : makeTruck();
    truck.position.set(-7, 0, 1);
    truck.rotation.y = 1.25;
    const trackMat = new THREE.MeshBasicMaterial({ color: 0x3b2a1a, transparent: true, opacity: 0.4, depthWrite: false });
    for (const x of [-0.95, 0.95]) {
      const track = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 16), trackMat);
      track.rotation.x = -Math.PI / 2;
      track.position.set(x, 0.03, -1.4 - 8);
      truck.add(track);
    }
    scene.add(truck);
    const farmTrees = [
      { x: 8, z: 0, s: 1.2 }, { x: -9, z: 8, s: 1 }, { x: 9, z: 12, s: 1.1 },
      { x: -10, z: 20, s: 1.2 }, { x: 10, z: 24, s: 1 }, { x: -9, z: 31, s: 1.1 }, { x: 9, z: 35, s: 1.2 },
      { x: -10, z: 42, s: 1 }, { x: 10, z: 46, s: 1.1 }, { x: -9, z: 52, s: 1.2 }, { x: 9, z: 57, s: 1 },
      { x: -10, z: 63, s: 1.1 }, { x: 10, z: 68, s: 1.2 }, { x: -9, z: 73, s: 1 },
    ];
    if (desert) createDesertProps(scene, farmTrees.map((t, i) => ({ x: t.x, z: t.z, s: t.s, t: i % 3 === 2 ? 'rock' : 'cactus' })));
    else createTrees(scene, farmTrees);

    const list = mapAnimals();
    const shown = list.slice(0, desert ? safariPenCount(save) : penCount(save));
    addFarmDecor(scene, shown.length >= list.length, desert ? [] : farmTrees, list.length);
    PAN_MAX = Math.max(PAN_MIN, PEN_Z0 + (Math.ceil(shown.length / 2) - 1) * PEN_DZ - 4);
    const pens = shown.map((_, i) => ({ x: (i % 2 ? 1 : -1) * PEN_X, z: PEN_Z0 + Math.floor(i / 2) * PEN_DZ }));
    makeFence(scene, pens, PEN);

    const newly = ctx.newlyFound || [];
    ctx.newlyFound = [];
    const newOrder = shown.map((a) => a.id).filter((id) => newly.includes(id));
    entries = shown.map((a, i) => {
      const isNew = newly.includes(a.id);
      const owned = !!(save.discovered && save.discovered[a.id]) && !isNew;
      const group = makeAnimal(a, PEN_SHADOW);
      if (!owned) silhouette(group);
      scene.add(group);
      const sign = makeGhost(ctx.renderer, a);
      sign.visible = false;
      scene.add(sign);
      const extras = PEN_SPOTS.map(() => {
        const g = makeAnimal(a, PEN_SHADOW);
        g.visible = false;
        scene.add(g);
        return g;
      });
      const cash = new THREE.Sprite(new THREE.SpriteMaterial({ map: cashTex, depthTest: false, transparent: true, opacity: 0.75 }));
      cash.scale.setScalar(0.9);
      cash.renderOrder = 10;
      cash.userData.animalId = a.id;
      cash.visible = false;
      scene.add(cash);
      return { a, group, sign, extras, cash, x: pens[i].x, z: pens[i].z, owned, ph: i * 1.7, reveal: isNew ? 0.8 + newOrder.indexOf(a.id) * 1.2 : -1 };
    });

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 150);
    panZ = PAN_MIN;
    if (newOrder.length) {
      const e = entries.find((x) => x.a.id === newOrder[0]);
      panZ = Math.min(PAN_MAX, Math.max(PAN_MIN, e.z - 4));
    }
    swipe = null;
    arrive = ctx.arrive ? { dir: ctx.arrive, t: 0 } : null;
    ctx.arrive = 0;
    if (arrive) { farmer.position.x = -arrive.dir * 16; farmer.rotation.y = arrive.dir * Math.PI / 2; fadeEl.style.background = desert ? '#f3dcab' : '#9fd4f0'; fadeEl.style.opacity = 1; }
    else fadeEl.style.opacity = 0;
    mapBtn.style.display = save.desert ? '' : 'none';
    mapBtn.textContent = desert ? '‹' : '›';
    mapBtn.style[desert ? 'left' : 'right'] = '6px';
    mapBtn.style[desert ? 'right' : 'left'] = 'auto';
    time = 0;
    moneyEl.textContent = '$' + save.money.toLocaleString();
    updateShopHint();
    showPop(null);
    closeShop();
    confetti = createConfetti(scene);
    particles = createParticles(scene);
    setMusic('farm');
    winEl.style.display = 'none';
    selected = null;
    paintSell();
    checkWin();
    ui.style.display = '';
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', () => { drag = null; });
    return { scene, camera };
  },

  update(dt) {
    time += dt;
    if (swipe) {
      swipe.t += dt;
      farmer.position.x += swipe.dir * RUN_SPEED * dt;
      farmer.rotation.y = swipe.dir * Math.PI / 2;
      animateFarmer(farmer, time, 1);
      fadeEl.style.background = desert ? '#9fd4f0' : '#f3dcab';
      fadeEl.style.opacity = Math.max(0, Math.min(1, (swipe.t - 0.5) / 0.6));
      if (swipe.t > 1.2) { ctxRef.map = desert ? 'farm' : 'desert'; ctxRef.arrive = swipe.dir; ctxRef.go('farm'); return; }
    } else if (arrive) {
      arrive.t += dt;
      const fx = farmer.position.x, step = RUN_SPEED * dt;
      farmer.position.x = Math.abs(fx) <= step ? 0 : fx - Math.sign(fx) * step;
      farmer.rotation.y = arrive.dir * Math.PI / 2;
      animateFarmer(farmer, time, 1);
      fadeEl.style.opacity = Math.max(0, 1 - arrive.t / 0.5);
      if (farmer.position.x === 0) { farmer.rotation.y = 0; animateFarmer(farmer, 0, 0); arrive = null; fadeEl.style.opacity = 0; }
    }
    for (const e of entries) {
      if (e.reveal >= 0) {
        e.reveal -= dt;
        if (e.reveal < 0) {
          scene.remove(e.group);
          e.group = makeAnimal(e.a, PEN_SHADOW);
          e.group.scale.setScalar(0.1);
          e.popT = 0;
          scene.add(e.group);
          e.owned = true;
          sfx('reveal');
          particles.burst(e.x, 1, e.z, 0xffe066, 16, 4);
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
      e.sign.position.set(e.x, 0.06, e.z);
      e.cash.position.set(e.x, 3 + Math.sin(time * 3 + e.ph) * 0.2, e.z);
      if (!e.owned) { e.group.position.set(e.x, 0, e.z); continue; }
      const n = held(e);
      e.sign.visible = n === 0;
      const k = e.pet > 0 ? Math.min(1, e.pet) : 0;   // petting excitement, fades out
      if (e.pet > 0) e.pet -= dt;
      [e.group, ...e.extras].forEach((g, i) => {
        g.visible = Math.min(n, 5) > i;
        const [ox, oz] = i ? PEN_SPOTS[i - 1] : [0, 0];
        const t = time * 0.6 + e.ph + i * 1.3;
        g.position.set(e.x + ox + Math.sin(t) * 0.4 + Math.sin(time * 9 + i * 2) * 0.25 * k, Math.abs(Math.sin(time * 5 + e.ph + i)) * 0.05 + Math.abs(Math.sin(time * 12 + i * 1.7)) * 0.3 * k, e.z + oz + Math.cos(t * 0.8) * 0.4 + Math.cos(time * 8 + i * 2) * 0.25 * k);
        g.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * 0.8) * 0.8) + Math.sin(time * 14 + i) * 0.5 * k;
      });
    }
    confetti.update(dt, time, 0, panZ);
    particles.update(dt);
    const sway = Math.sin(time * 0.4) * 0.4;
    camera.position.set(sway + (swipe || arrive ? farmer.position.x : 0), Math.sin(PITCH) * dist(), panZ + Math.cos(PITCH) * dist());
    camera.lookAt(sway * 0.5 + (swipe || arrive ? farmer.position.x : 0), 0, panZ);
  },

  exit() {
    soundEl.classList.remove('can-buy');
    ui.style.display = 'none';
    mapBtn.style.display = 'none';
    fadeEl.style.opacity = 0;
    winEl.style.display = 'none';
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    drag = null;
    iconTargets.forEach((t) => t.dispose());
    iconTargets = [];
    camera = scene = entries = confetti = particles = selected = null;
  },
};
