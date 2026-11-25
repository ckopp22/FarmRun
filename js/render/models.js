import * as THREE from '../../lib/three.module.min.js';
import { mat } from './materials.js';
import { penFloorTexture } from './renderer.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 10).rotateZ(Math.PI / 2);
const shadowGeo = new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({
  color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
});

function box(parent, w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(boxGeo, mat(color));
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

export const setShadowOpacity = (o) => { shadowMat.opacity = o; };   // shared by every blob shadow

export function makeBlobShadow(radius) {
  const m = new THREE.Mesh(shadowGeo, shadowMat);
  m.scale.set(radius, 1, radius);
  m.position.y = 0.03;
  m.renderOrder = 1;
  m.userData.shadow = true;
  return m;
}

// Models face +z.
export function makeFarmer(shirt = 0xc0392b, hat = 0xe8c15a, look = null) {
  const g = new THREE.Group();
  // Limbs hang from pivot groups at hip/shoulder so animateFarmer can swing them.
  const limb = (w, h, d, color, x, y) => {
    const p = new THREE.Group();
    p.position.set(x, y, 0);
    box(p, w, h, d, color, 0, -h / 2, 0);
    g.add(p);
    return p;
  };
  g.userData.limbs = [
    limb(0.3, 0.7, 0.3, 0x2f4f8f, -0.18, 0.7), limb(0.3, 0.7, 0.3, 0x2f4f8f, 0.18, 0.7),   // legs
    limb(0.2, 0.7, 0.25, shirt, -0.5, 1.45), limb(0.2, 0.7, 0.25, shirt, 0.5, 1.45),       // arms
  ];
  box(g, 0.8, 0.8, 0.45, shirt, 0, 1.1, 0);       // body
  box(g, 0.5, 0.5, 0.5, 0xf1c9a0, 0, 1.75, 0);       // head
  if (look && look.hawaiian) {   // flower print on the front and back
    const dots = [0xff6fa5, 0xffe066, 0xffffff, 0xff9a3c];
    [[-0.25, 1.4], [0.05, 1.45], [0.28, 1.3], [-0.1, 1.15], [0.22, 1.02], [-0.28, 0.98], [0.0, 0.85]].forEach(([x, y], i) => {
      box(g, 0.13, 0.13, 0.03, dots[i % 4], x, y, 0.235);
      box(g, 0.13, 0.13, 0.03, dots[(i + 2) % 4], -x, y, -0.235);
    });
  }
  const style = (look && look.hat) || 'straw';
  const cap = typeof shirt === 'number' ? shirt : 0xc0392b;
  if (style === 'straw') {
    box(g, 1.0, 0.07, 1.0, hat, 0, 2.02, 0);      // hat brim
    box(g, 0.55, 0.28, 0.55, hat, 0, 2.17, 0);    // hat crown
  } else if (style === 'cap') {                   // baseball cap in the shirt's color
    box(g, 0.56, 0.2, 0.56, cap, 0, 2.08, 0);
    box(g, 0.5, 0.05, 0.32, cap, 0, 2.0, 0.4);
    box(g, 0.08, 0.06, 0.08, 0xffffff, 0, 2.2, 0);
  } else if (style === 'santa') {
    box(g, 0.6, 0.12, 0.6, 0xffffff, 0, 2.03, 0);
    box(g, 0.54, 0.22, 0.54, 0xd62d20, 0, 2.18, 0);
    box(g, 0.4, 0.2, 0.4, 0xd62d20, 0, 2.38, -0.08);
    box(g, 0.24, 0.18, 0.24, 0xd62d20, 0, 2.52, -0.2);
    box(g, 0.14, 0.14, 0.14, 0xffffff, 0, 2.6, -0.3);
  } else if (style === 'blonde') {                // long blonde hair
    const blond = 0xf5d76e;
    box(g, 0.56, 0.14, 0.56, blond, 0, 2.05, 0);
    box(g, 0.56, 0.95, 0.12, blond, 0, 1.58, -0.29);
    box(g, 0.08, 0.6, 0.44, blond, -0.29, 1.72, -0.04);
    box(g, 0.08, 0.6, 0.44, blond, 0.29, 1.72, -0.04);
    box(g, 0.5, 0.1, 0.06, blond, 0, 1.97, 0.27);
  } else if (style === 'cowboy') {
    box(g, 1.1, 0.06, 0.9, 0x8b5a2b, 0, 2.03, 0);
    box(g, 0.5, 0.3, 0.5, 0x8b5a2b, 0, 2.2, 0);
    box(g, 0.52, 0.07, 0.52, 0x4a2e12, 0, 2.08, 0);
  } else if (style === 'tophat') {
    box(g, 0.8, 0.06, 0.8, 0x1a1a1a, 0, 2.03, 0);
    box(g, 0.5, 0.55, 0.5, 0x1a1a1a, 0, 2.32, 0);
    box(g, 0.52, 0.1, 0.52, 0xc0392b, 0, 2.12, 0);
  } else if (style === 'crown') {
    box(g, 0.58, 0.14, 0.58, 0xf1c40f, 0, 2.07, 0);
    for (const [x, z] of [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24], [0, 0.26]]) box(g, 0.1, 0.2, 0.1, 0xf1c40f, x, 2.24, z);
    box(g, 0.1, 0.1, 0.04, 0xd62d20, 0, 2.08, 0.3);
  } else if (style === 'beanie') {
    box(g, 0.6, 0.12, 0.6, 0xffffff, 0, 2.03, 0);
    box(g, 0.56, 0.22, 0.56, 0x3498db, 0, 2.2, 0);
    box(g, 0.16, 0.16, 0.16, 0xffffff, 0, 2.38, 0);
  } else if (style === 'antlers') {
    box(g, 0.56, 0.06, 0.56, 0x5e3b20, 0, 2.03, 0);
    for (const sx of [-1, 1]) {
      box(g, 0.07, 0.45, 0.07, 0x8a5a33, sx * 0.2, 2.28, 0).rotation.z = -sx * 0.3;
      box(g, 0.2, 0.07, 0.07, 0x8a5a33, sx * 0.3, 2.3, 0);
      box(g, 0.2, 0.07, 0.07, 0x8a5a33, sx * 0.34, 2.45, 0);
    }
  } else if (style === 'bunny') {
    box(g, 0.56, 0.06, 0.56, 0xffffff, 0, 2.03, 0);
    for (const sx of [-1, 1]) {
      box(g, 0.14, 0.62, 0.1, 0xffffff, sx * 0.15, 2.4, 0).rotation.z = -sx * 0.12;
      box(g, 0.07, 0.42, 0.02, 0xffb6c1, sx * 0.15, 2.4, 0.06).rotation.z = -sx * 0.12;
    }
  } else if (style === 'party') {
    box(g, 0.42, 0.14, 0.42, 0xff6fa5, 0, 2.07, 0);
    box(g, 0.32, 0.14, 0.32, 0x3498db, 0, 2.21, 0);
    box(g, 0.22, 0.14, 0.22, 0xff6fa5, 0, 2.35, 0);
    box(g, 0.12, 0.12, 0.12, 0xffe066, 0, 2.48, 0);
  } else if (style === 'propeller') {
    box(g, 0.58, 0.2, 0.58, 0xe74c3c, 0, 2.08, 0);
    box(g, 0.28, 0.2, 0.58, 0xf1c40f, 0, 2.09, 0);
    box(g, 0.04, 0.12, 0.04, 0x333333, 0, 2.24, 0);
    box(g, 0.55, 0.03, 0.1, 0x3498db, 0, 2.31, 0);
    box(g, 0.1, 0.03, 0.55, 0x3498db, 0, 2.31, 0);
  } else if (style === 'flower') {                // flower crown
    box(g, 0.56, 0.06, 0.56, 0x3c9d4a, 0, 2.03, 0);
    const cols = [0xff6fa5, 0xffffff, 0xffe066, 0xff9a3c];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.2832;
      box(g, 0.13, 0.13, 0.13, cols[i % 4], Math.sin(a) * 0.3, 2.08, Math.cos(a) * 0.3);
    }
  }
  const face = look && look.face;
  if (face === 'shades') {
    for (const sx of [-1, 1]) box(g, 0.2, 0.12, 0.04, 0x111111, sx * 0.13, 1.8, 0.26);
    box(g, 0.08, 0.04, 0.04, 0x111111, 0, 1.82, 0.26);
    for (const sx of [-1, 1]) box(g, 0.03, 0.04, 0.5, 0x111111, sx * 0.265, 1.82, 0);
  } else if (face === 'glasses') {
    for (const sx of [-1, 1]) { box(g, 0.22, 0.22, 0.03, 0xf1c40f, sx * 0.13, 1.8, 0.255); box(g, 0.15, 0.15, 0.03, 0xbfe9ff, sx * 0.13, 1.8, 0.275); }
    box(g, 0.06, 0.03, 0.03, 0xf1c40f, 0, 1.83, 0.26);
  } else if (face === 'stache') {
    box(g, 0.3, 0.07, 0.04, 0x3a2412, 0, 1.66, 0.26);
    for (const sx of [-1, 1]) box(g, 0.07, 0.07, 0.04, 0x3a2412, sx * 0.17, 1.69, 0.26);
  }
  g.add(makeBlobShadow(0.7));
  return g;
}

// Farmer sitting on the snowmobile seat (add to the makeSnowmobile group), legs and arms forward.
export function makeSeatedFarmer(...args) {
  const g = makeFarmer(...args);
  g.children.forEach((o) => { if (o.userData.shadow) o.visible = false; });
  const [lL, lR, aL, aR] = g.userData.limbs;
  lL.rotation.x = lR.rotation.x = -1.3;
  aL.rotation.x = aR.rotation.x = -1.1;
  g.scale.setScalar(0.6);
  g.position.set(0, 0.8, 1.4);
  return g;
}

// Run cycle: opposite legs/arms swing, body bobs. amount 0..1 eases back to idle.
export function animateFarmer(g, time, amount) {
  const [lL, lR, aL, aR] = g.userData.limbs;
  const s = Math.sin(time * 12) * 0.9 * amount;
  lL.rotation.x = s; lR.rotation.x = -s;
  aL.rotation.x = -s * 0.9; aR.rotation.x = s * 0.9;
  if (g.userData.carry) { aL.rotation.x = aR.rotation.x = -1.4; aL.rotation.z = 0.12; aR.rotation.z = -0.12; }   // arms out front holding a present
}

export function makeChicken() {
  const g = new THREE.Group();
  box(g, 0.5, 0.4, 0.65, 0xffffff, 0, 0.45, 0);        // body
  box(g, 0.3, 0.1, 0.25, 0xeeeeee, 0, 0.7, -0.38);     // tail
  box(g, 0.26, 0.3, 0.26, 0xffffff, 0, 0.8, 0.3);      // head
  box(g, 0.12, 0.08, 0.15, 0xf39c12, 0, 0.78, 0.5);    // beak
  box(g, 0.08, 0.1, 0.16, 0xd62d20, 0, 0.99, 0.3);     // comb
  box(g, 0.06, 0.25, 0.06, 0xf39c12, -0.12, 0.13, 0);  // legs
  box(g, 0.06, 0.25, 0.06, 0xf39c12, 0.12, 0.13, 0);
  g.add(makeBlobShadow(0.4));
  return g;
}

export function makeTruck() {
  const g = new THREE.Group();
  box(g, 1.9, 0.7, 4.4, 0xc0392b, 0, 0.85, 0);          // chassis
  box(g, 1.8, 0.8, 1.5, 0xc0392b, 0, 1.6, 0.9);         // cab
  box(g, 1.82, 0.4, 1.0, 0x9fd4f0, 0, 1.75, 0.95);      // windows
  box(g, 1.7, 0.5, 2.0, 0x8e2b20, 0, 1.35, -1.2);       // bed walls
  box(g, 1.9, 0.2, 0.2, 0x333333, 0, 0.6, 2.25);        // bumper
  for (const [x, z] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const w = new THREE.Mesh(wheelGeo, mat(0x222222));
    w.position.set(x, 0.4, z);
    g.add(w);
  }
  g.add(makeBlobShadow(2.4));
  return g;
}

// Holiday dressing for the red truck: Santa on the cab roof and twinkling lights.
const bulbMats = [0xff3030, 0x30e050, 0xffd830, 0x40a0ff].map((c) => ({ c, m: new THREE.MeshBasicMaterial({ color: c }) }));
export function twinkleLights(t) {
  bulbMats.forEach((b, i) => b.m.color.setHex(b.c).multiplyScalar(0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 4 + i * 1.6))));
}
export function makeSanta() {
  const santa = new THREE.Group();
  const limb = (x, y, w, h, d, color, handColor) => {
    const pv = new THREE.Group();
    pv.position.set(x, y, 0);
    box(pv, w, h, d, color, 0, -h / 2, 0);
    if (handColor) box(pv, w, 0.18, d, handColor, 0, -h - 0.05, 0);   // glove
    santa.add(pv);
    return pv;
  };
  santa.userData.limbs = [
    limb(-0.2, 0.5, 0.24, 0.5, 0.26, 0x222222), limb(0.2, 0.5, 0.24, 0.5, 0.26, 0x222222),                    // legs
    limb(-0.5, 1.05, 0.18, 0.45, 0.2, 0xd62d20, 0xffffff), limb(0.5, 1.05, 0.18, 0.45, 0.2, 0xd62d20, 0xffffff),   // arms
  ];
  box(santa, 0.8, 0.62, 0.58, 0xd62d20, 0, 0.78, 0);             // round coat
  box(santa, 0.84, 0.09, 0.62, 0x111111, 0, 0.7, 0);             // belt
  box(santa, 0.12, 0.12, 0.02, 0xf1c40f, 0, 0.7, 0.32);          // buckle
  box(santa, 0.84, 0.06, 0.62, 0xffffff, 0, 0.47, 0);            // coat trim
  box(santa, 0.4, 0.3, 0.36, 0xf2c9a0, 0, 1.25, 0);              // head
  box(santa, 0.46, 0.26, 0.14, 0xffffff, 0, 1.15, 0.17);         // beard
  box(santa, 0.42, 0.2, 0.4, 0xd62d20, 0, 1.47, 0);              // hat
  box(santa, 0.44, 0.07, 0.42, 0xffffff, 0, 1.38, 0);            // hat trim
  box(santa, 0.1, 0.1, 0.1, 0xffffff, 0, 1.63, -0.05);           // pom
  return santa;
}

// Swing Santa's legs and arms against each other; amount 0 = standing still.
export function animateSanta(santa, t, amount) {
  const [ll, lr, al, ar] = santa.userData.limbs, sw = Math.sin(t * 9) * 0.8 * amount;
  ll.rotation.x = sw; lr.rotation.x = -sw;
  al.rotation.x = -sw * 1.1; ar.rotation.x = sw * 1.1;
  al.rotation.z = 0.15; ar.rotation.z = -0.15;
}

// Gallop: front and back legs swing in opposite pairs.
export function animateReindeer(g, t) {
  const s = Math.sin(t * 14) * 0.9;
  g.userData.legs.forEach((l, i) => { l.rotation.x = (i < 2 ? s : -s) * (i % 2 ? -1 : 1) * -1; });
}

export function makePresent(size = 0.4) {
  const g = new THREE.Group();
  box(g, size, size, size, 0xd62d20, 0, size / 2, 0);
  box(g, size * 1.04, size * 1.04, size * 0.18, 0xf1c40f, 0, size / 2, 0);
  box(g, size * 0.18, size * 1.04, size * 1.04, 0xf1c40f, 0, size / 2, 0);
  const by = size + size * 0.1, loopGeo = new THREE.TorusGeometry(size * 0.1, size * 0.035, 5, 10);   // green bow: two loops and a knot
  for (const sx of [-1, 1]) {
    const loop = new THREE.Mesh(loopGeo, mat(0x2ecc40));
    loop.position.set(sx * size * 0.12, by, 0);
    loop.rotation.z = -sx * 0.45;
    g.add(loop);
  }
  box(g, size * 0.1, size * 0.1, size * 0.1, 0x1e8e2e, 0, by - size * 0.03, 0);
  return g;
}

export function makeReindeer() {
  const g = new THREE.Group();
  const brown = 0x8a5a33;
  box(g, 0.6, 0.6, 1.3, brown, 0, 1.0, 0);
  box(g, 0.4, 0.6, 0.4, brown, 0, 1.55, 0.7);          // neck
  box(g, 0.4, 0.38, 0.5, brown, 0, 1.85, 0.95);        // head
  box(g, 0.14, 0.14, 0.14, 0xff2020, 0, 1.8, 1.24);    // red nose
  box(g, 0.05, 0.5, 0.05, 0xd8c8a0, -0.15, 2.2, 0.9).rotation.z = 0.4;   // antlers
  box(g, 0.05, 0.5, 0.05, 0xd8c8a0, 0.15, 2.2, 0.9).rotation.z = -0.4;
  g.userData.legs = [[-0.2, 0.5], [0.2, 0.5], [-0.2, -0.5], [0.2, -0.5]].map(([x, z]) => {   // hip pivots so the legs can gallop
    const pv = new THREE.Group();
    pv.position.set(x, 0.7, z);
    box(pv, 0.14, 0.7, 0.14, 0x5e3b20, 0, -0.35, 0);
    g.add(pv);
    return pv;
  });
  box(g, 0.2, 0.2, 0.2, 0xffffff, 0, 1.15, -0.72);     // tail
  return g;
}

// An opened present (lid and bow knocked off to the side) riding in the vehicle's bed: today's prize is already claimed.
export function addOpenPresent(truck, kind = 'truck') {
  const g = new THREE.Group(), s = 1.1, h = s * 0.62, t = 0.09;   // size, wall height, wall thickness
  box(g, s, t, s, 0x7a1d14, 0, t / 2, 0);                          // dark floor, visible through the opening
  box(g, s, h, t, 0xd62d20, 0, h / 2, s / 2 - t / 2);              // four walls leave the top open
  box(g, s, h, t, 0xd62d20, 0, h / 2, -s / 2 + t / 2);
  box(g, t, h, s - 2 * t, 0xd62d20, s / 2 - t / 2, h / 2, 0);
  box(g, t, h, s - 2 * t, 0xd62d20, -s / 2 + t / 2, h / 2, 0);
  box(g, s * 0.2, h + 0.01, t + 0.03, 0xf1c40f, 0, h / 2, s / 2 - t / 2);   // ribbon, slightly proud of the walls
  box(g, t + 0.03, h + 0.01, s * 0.2, 0xf1c40f, s / 2 - t / 2, h / 2, 0);
  box(g, s * 1.06, 0.05, t + 0.03, 0xf1c40f, 0, h, s / 2 - t / 2);          // rim trim
  const lid = new THREE.Group();   // lid with the bow, leaning against the back
  box(lid, s * 1.08, 0.14, s * 1.08, 0xd62d20, 0, 0, 0);
  box(lid, s * 0.2, 0.16, s * 1.1, 0xf1c40f, 0, 0, 0);
  const loopGeo = new THREE.TorusGeometry(s * 0.1, s * 0.035, 5, 10);
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(loopGeo, mat(0x2ecc40)); l.position.set(sx * s * 0.12, 0.2, 0); l.rotation.z = -sx * 0.45; lid.add(l); }
  lid.position.set(0, h * 0.55, -s / 2 - 0.12);
  lid.rotation.x = -1.15;
  g.add(lid);
  const at = kind === 'safari' ? [0, 1.5, -0.6] : kind === 'snow' ? [0, 0.46, -1.7] : [0, 1.6, -1.1];
  g.position.set(...at);
  truck.add(g);
}

// "Daily Challenge" tag floating above Santa so players know to tap the vehicle.
export function addDailyLabel(truck) {
  const s = truck.userData.santa;
  if (!s) return;
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const x = cv.getContext('2d');
  x.font = 'bold 52px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineJoin = 'round'; x.lineWidth = 9; x.strokeStyle = 'rgba(40,20,0,0.85)'; x.fillStyle = '#ffe066';   // dark outline keeps the text readable without a pill
  [['Daily', 36], ['Challenge', 92]].forEach(([t, y]) => { x.strokeText(t, 128, y); x.fillText(t, 128, y); });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
  const k = 1 / truck.scale.x, p = s.userData.path;
  sp.scale.set(3.4 * k, 1.7 * k, 1);
  sp.userData.base = p.y + 2.8;
  sp.position.set(0.7 * k, sp.userData.base, p.z);
  truck.userData.label = sp;
  truck.add(sp);
}

function addFlakes(truck) {
  const n = 16, geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, transparent: true, opacity: 0, depthWrite: false }));
  pts.frustumCulled = false;
  truck.add(pts);
  truck.userData.flakes = { pts, n, ph: [], ang: [], r: [] };
  for (let i = 0; i < n; i++) { const f = truck.userData.flakes; f.ph.push(Math.random()); f.ang.push(Math.random() * 6.28); f.r.push(0.5 + Math.random() * 0.9); }
}

// Santa strolls back and forth (and side to side) across the vehicle's roof or sled, bobbing as he walks.
export function moveSanta(truck, t) {
  const s = truck.userData.santa;
  if (!s) return;
  const lb = truck.userData.label;
  if (lb) lb.position.y = lb.userData.base + Math.sin(t * 2.2) * 0.25;   // floats up and down over the vehicle
  const f = truck.userData.flakes;
  if (f) {   // snowflakes swirl down around him in waves
    const a = f.pts.geometry.attributes.position, sc = 1 / truck.scale.x;
    for (let i = 0; i < f.n; i++) {
      const fall = (t * 0.35 + f.ph[i]) % 1, ang = f.ang[i] + t * 0.6;
      a.setXYZ(i, s.position.x + Math.cos(ang) * f.r[i] * sc, s.position.y + (2.4 - fall * 2.6) * sc, s.position.z + Math.sin(ang) * f.r[i] * sc);
    }
    a.needsUpdate = true;
    f.pts.material.opacity = Math.min(1, Math.max(0, Math.sin(t * 0.5) * 1.6));
  }
  const p = s.userData.path, a = t * 0.7;
  const x = Math.sin(a * 0.6) * p.x, z = p.z + Math.sin(a) * p.amp, u = s.userData;
  const dist = u.lx === undefined ? 0 : Math.hypot(x - u.lx, z - u.lz);   // steps follow the distance he actually covers
  u.lx = x; u.lz = z; u.stride = (u.stride || 0) + dist;
  const walking = dist > 0.004;
  s.position.set(x, p.y + (walking ? Math.abs(Math.sin(u.stride * 6)) * 0.04 : 0), z);
  animateSanta(s, u.stride * 0.7, walking ? Math.min(1, dist * 40) * 0.7 : 0);
  s.rotation.y = Math.atan2(Math.cos(a * 0.6) * 0.6 * p.x, Math.cos(a) * p.amp) * 1;
}

export function addSantaDecor(truck, kind = 'truck') {
  const bulbGeo = new THREE.SphereGeometry(0.09, 6, 5);
  let n = 0;
  const bulb = (x, y, z) => {
    const m = new THREE.Mesh(bulbGeo, bulbMats[n++ % 4].m);
    m.position.set(x, y, z);
    truck.add(m);
  };
  let santa;
  const fit = (x, y, z) => { santa.position.set(x, y, z); santa.scale.setScalar(1.2 / truck.scale.x); };
  if (kind !== 'truck') {
    santa = makeSanta();
    if (kind === 'safari') {
      for (let i = 0; i <= 8; i++) { const z = -2.2 + i * 0.55; bulb(-1.02, 1.22, z); bulb(1.02, 1.22, z); }
      for (let i = 0; i <= 4; i++) { const z = 0.5 - i * 0.55; bulb(-1.12, 2.85, z); bulb(1.12, 2.85, z); }
      fit(0, 2.85, -0.5);
    } else {
      for (let i = 0; i <= 6; i++) { const z = 0.1 - i * 0.58; bulb(-1.15, 0.98, z); bulb(1.15, 0.98, z); }
      for (let i = 0; i <= 4; i++) bulb(-1.1 + i * 0.55, 0.98, -3.5);
      for (let i = 0; i <= 2; i++) bulb(-0.4 + i * 0.4, 1.3, 2.7);
      fit(0, 0.46, -1.7);
    }
    santa.userData.path = kind === 'safari' ? { z: -0.55, amp: 1.0, x: 0.5, y: 2.85 } : { z: -1.9, amp: 1.3, x: 0.6, y: 0.46 };
    truck.userData.santa = santa;
    addFlakes(truck);
    truck.add(santa);
    return;
  }
  for (let i = 0; i <= 8; i++) { const z = -2.1 + i * 0.525; bulb(-0.96, 1.22, z); bulb(0.96, 1.22, z); }   // chassis edge
  for (let i = 0; i <= 4; i++) { const x = -0.9 + i * 0.45; bulb(x, 2.03, 1.6); bulb(x, 2.03, 0.2); }                         // cab roof
  for (let i = 1; i < 3; i++) { bulb(-0.9, 2.03, 1.6 - i * 0.47); bulb(0.9, 2.03, 1.6 - i * 0.47); }
  for (let i = 0; i <= 4; i++) bulb(-0.85 + i * 0.425, 1.62, -2.2);                                                           // bed rim
  santa = makeSanta();
  santa.position.set(0, 2.0, 0.9);
  santa.scale.setScalar(1.2);
  santa.userData.path = { z: 0.9, amp: 0.6, x: 0.3, y: 2.0 };
  truck.userData.santa = santa;
  addFlakes(truck);
  truck.add(santa);
}

// Larger open-sided safari jeep with a striped canopy.
export function makeSafariTruck() {
  const g = new THREE.Group();
  const tan = 0xd8b878, dark = 0x9a7a40;
  box(g, 2.0, 0.7, 4.6, tan, 0, 0.85, 0);               // chassis
  box(g, 1.8, 0.6, 1.3, tan, 0, 1.45, 1.5);             // hood/cab
  box(g, 1.8, 0.5, 0.1, 0x9fd4f0, 0, 1.95, 0.85);       // windshield
  box(g, 1.7, 0.4, 2.2, dark, 0, 1.3, -1.0);            // bed walls
  box(g, 2.0, 0.2, 0.2, 0x333333, 0, 0.6, 2.4);         // bumper
  for (const [x, z] of [[-0.9, 0.8], [0.9, 0.8], [-0.9, -2.0], [0.9, -2.0]]) box(g, 0.12, 1.5, 0.12, 0x5a4a30, x, 1.95, z);   // roll cage
  for (let i = 0; i < 4; i++) box(g, 2.2, 0.12, 0.7, i % 2 ? 0xf4efe4 : 0x2e7d4a, 0, 2.75, 0.5 - i * 0.7 - 0.35 + 0.35);   // striped canopy
  const spare = new THREE.Mesh(wheelGeo, mat(0x222222));
  spare.rotation.set(Math.PI / 2, 0, 0);
  spare.position.set(0, 1.4, -2.45);
  g.add(spare);
  for (const [x, z] of [[-1.0, 1.4], [1.0, 1.4], [-1.0, -1.4], [1.0, -1.4]]) {
    const w = new THREE.Mesh(wheelGeo, mat(0x222222));
    w.position.set(x, 0.4, z);
    w.scale.set(1, 1.2, 1.2);
    g.add(w);
  }
  g.add(makeBlobShadow(2));
  g.scale.setScalar(1.3);
  return g;
}

// Snowmobile pulling a large open sled (the sled is the loading bed, at -z).
export function makeSnowmobile() {
  const g = new THREE.Group();
  const body = new THREE.Group();   // shifted so the whole rig is centred on the origin
  body.position.z = 0.575;
  g.add(body);
  const red = 0xc0392b, dark = 0x2a2a30, wood = 0x8a5a2b;
  box(body, 1.2, 0.5, 2.2, red, 0, 0.75, 1.35);            // body
  box(body, 1.0, 0.4, 0.9, red, 0, 1.05, 2.15);            // hood
  box(body, 0.9, 0.35, 0.1, 0x9fd4f0, 0, 1.45, 1.75);      // windshield
  box(body, 0.8, 0.2, 0.8, dark, 0, 1.1, 0.9);             // seat
  box(body, 1.1, 0.1, 0.1, dark, 0, 1.4, 1.55);            // handlebars
  box(body, 1.3, 0.3, 1.6, dark, 0, 0.35, 0.8);            // track
  for (const x of [-0.5, 0.5]) {
    box(body, 0.15, 0.1, 1.6, 0xdddddd, x, 0.25, 2.2);     // skis
    box(body, 0.08, 0.4, 0.08, dark, x, 0.5, 2.0);
  }
  box(body, 0.1, 0.1, 1.2, dark, 0, 0.6, -0.55);           // hitch
  for (const x of [-1.1, 1.1]) box(body, 0.2, 0.15, 3.8, 0xdddddd, x, 0.2, -2.3);   // sled runners
  box(body, 2.5, 0.12, 3.6, wood, 0, 0.4, -2.3);           // sled floor
  for (const x of [-1.15, 1.15]) box(body, 0.1, 0.5, 3.6, 0x6b4a2b, x, 0.7, -2.3);  // sled sides
  box(body, 2.5, 0.5, 0.1, 0x6b4a2b, 0, 0.7, -4.1);        // sled back
  box(body, 2.5, 0.4, 0.1, 0x6b4a2b, 0, 0.65, -0.55);      // sled front
  g.scale.setScalar(1.15);
  return g;
}

export function makeIgloo() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xeef5fa));
  dome.scale.y = 0.85;
  g.add(dome);
  box(g, 2, 1.7, 2.2, 0xe4eef5, 0, 0.85, 2.7);          // entrance tunnel
  box(g, 1.1, 1.3, 0.1, 0x2a3a4a, 0, 0.7, 3.82);        // doorway
  box(g, 1.2, 0.2, 0.1, 0x9fd4f0, 0, 2.0, 2.9);
  return g;
}

export function makeAdobe() {
  const g = new THREE.Group();
  const wall = 0xd9b57a, trim = 0xc79a5c;
  box(g, 6, 3.2, 5, wall, 0, 1.6, 0);
  box(g, 6.4, 0.3, 5.4, trim, 0, 3.35, 0);
  box(g, 2.2, 1.6, 2.2, wall, 2.2, 4.1, -1);            // tower
  box(g, 2.5, 0.25, 2.5, trim, 2.2, 5.0, -1);
  box(g, 1.7, 2.3, 0.14, 0x4a3220, 0, 1.15, 2.55);      // door
  for (const x of [-2, 2]) box(g, 0.9, 0.9, 0.14, 0x4a3220, x, 2.0, 2.55);
  box(g, 6.1, 0.14, 5.1, trim, 0, 0.07, 0);
  g.add(makeBlobShadow(4.5));
  return g;
}

export function makeBarn() {
  const g = new THREE.Group();
  const red = 0xb83a2e, white = 0xf4efe4, roof = 0x5a5a62;
  box(g, 6, 3, 5, red, 0, 1.5, 0);                      // walls
  box(g, 4.4, 1.4, 5, red, 0, 3.6, 0);                  // gambrel lower
  box(g, 3.4, 0.5, 5, red, 0, 4.5, 0);                  // gambrel mid
  box(g, 2, 0.5, 5, red, 0, 4.95, 0);                   // gambrel top
  box(g, 2.6, 2.5, 0.1, white, 0, 1.25, 2.52);          // door frame
  box(g, 2.3, 2.3, 0.14, red, 0, 1.25, 2.55);           // door
  box(g, 0.12, 2.3, 0.16, white, 0, 1.25, 2.6);         // door divider
  for (const s of [-1, 1]) {
    const x = box(g, 1.2, 0.12, 0.16, white, s * 0.57, 1.25, 2.62);
    x.scale.x = 3.1;
    x.rotation.z = s * 0.82;                            // X braces
  }
  box(g, 1.1, 1.1, 0.1, white, 0, 3.7, 2.52);           // loft trim
  box(g, 0.9, 0.9, 0.14, 0x3a2a20, 0, 3.7, 2.55);       // loft door
  for (const [w, h, y] of [[6, 0.14, 3.0], [6, 0.14, 0.07]]) box(g, w + 0.1, h, 5.1, white, 0, y, 0);
  for (const s of [-1, 1]) {
    const lo = box(g, 1.9, 0.25, 5.6, roof, s * 2.6, 3.6, 0);
    lo.rotation.z = -s * 0.862;
    const up = box(g, 2.3, 0.25, 5.6, roof, s * 1.0, 4.85, 0);
    up.rotation.z = -s * 0.464;
  }
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#f4efe4';
  x.font = 'bold 52px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('God Loves You', 256, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  sign.position.set(0, 2.2, -2.52);
  sign.rotation.y = Math.PI;                             // back wall faces -z
  g.add(sign);
  g.add(makeBlobShadow(4.2));
  return g;
}

function makeQuad(a) {
  const g = new THREE.Group();
  const { w, h, l, leg } = a;
  const hc = a.hc || a.c;
  const lw = Math.max(0.1, w * 0.2);
  const legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pivot = new THREE.Group();   // hip joint; swings the leg
    pivot.position.set(sx * (w / 2 - lw / 2), leg, sz * (l / 2 - lw / 2));
    box(pivot, lw, leg, lw, hc === a.c ? a.c : 0x555555, 0, -leg / 2, 0);
    g.add(pivot);
    legs.push([pivot, sx * sz]);
  }
  g.userData.legs = legs;
  box(g, w, h, l, a.c, 0, leg + h / 2, 0);
  const hs = h * 0.8;
  const neck = a.neck || 0;
  const hy = leg + h * 0.95 + neck;
  const hz = l / 2 + hs * 0.4 - (neck ? hs * 0.2 : 0);
  if (neck) box(g, hs * 0.5, neck + 0.1, hs * 0.5, a.c, 0, leg + h + neck / 2, l / 2 - 0.1);
  box(g, hs, hs, hs, hc, 0, hy, hz);
  if (a.sn) box(g, hs * 0.6, hs * 0.45, hs * 0.4, a.sn, 0, hy - hs * 0.15, hz + hs * 0.6);
  if (a.ear) for (const sx of [-1, 1]) box(g, hs * 0.2, a.ear, hs * 0.2, hc, sx * hs * 0.35, hy + hs * 0.5 + a.ear / 2, hz);
  box(g, 0.1, 0.1, 0.25, a.tc || a.c, 0, leg + h * 0.8, -l / 2 - 0.1);
  if (a.x) for (const e of a.x) box(g, e[0], e[1], e[2], e[3], e[4], e[5], e[6]);
  g.add(makeBlobShadow(Math.max(w, l) * (a.id === 'croc' ? 0.45 : 0.8)));
  return g;
}

function makeBird(a) {
  const g = new THREE.Group();
  const L = a.leg || 0, N = a.neck || 0;   // extra leg and neck length (flamingo, ostrich)
  box(g, 0.5, 0.4, 0.65, a.c, 0, 0.45 + L, 0);
  if (a.plume) box(g, 0.7, 0.8, 0.1, a.tc, 0, 0.85 + L, -0.45);
  else box(g, 0.3, 0.1, 0.25, a.tc, 0, 0.7 + L, -0.38);
  if (N) box(g, 0.1, N + 0.15, 0.1, a.c, 0, 0.65 + L + N / 2, 0.3);
  box(g, 0.26, 0.3, 0.26, a.c, 0, 0.8 + L + N, 0.3);
  box(g, 0.12, 0.08, 0.15, a.b, 0, 0.78 + L + N, 0.5);
  if (a.crest) box(g, 0.08, 0.1, 0.16, a.crest, 0, 0.99 + L + N, 0.3);
  g.userData.legs = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.12, 0.26 + L, 0);
    box(pivot, L ? 0.04 : 0.06, 0.25 + L, L ? 0.04 : 0.06, a.legc || a.b, 0, -(0.25 + L) / 2 - 0.005, 0);
    g.add(pivot);
    return [pivot, side];
  });
  g.scale.setScalar(a.s || 1);
  g.add(makeBlobShadow(0.4));
  return g;
}

export function makeAnimal(a, shadowScale = 1) {
  const g = a.k === 'bird' ? makeBird(a) : makeQuad(a);
  if (shadowScale !== 1) g.children.forEach((o) => { if (o.userData.shadow) o.scale.multiplyScalar(shadowScale); });
  g.userData.animalId = a.id;
  return g;
}

// Swing the legs of a makeAnimal() model; amount 0 = standing still, 1 = full run.
export function animateAnimal(g, time, amount) {
  const swing = Math.sin(time * 14) * 0.8 * amount;
  for (const [pivot, side] of g.userData.legs) pivot.rotation.x = swing * side;
}

const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

// Same model, one shared unlit black material.
export function silhouette(group) {
  group.traverse((o) => { if (o.isMesh && !o.userData.shadow) o.material = blackMat; });
  return group;
}

export function makeFence(scene, pens, size) {
  const rails = new THREE.InstancedMesh(boxGeo, mat(0x8a5a2b), pens.length * 8);
  const posts = new THREE.InstancedMesh(boxGeo, mat(0x6b4a2b), pens.length * 4);
  const floors = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ map: penFloorTexture(size) }), pens.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  let ri = 0, pi = 0, fi = 0;
  const put = (mesh, i, x, y, z, w, h, d) => { m.compose(p.set(x, y, z), q, sc.set(w, h, d)); mesh.setMatrixAt(i, m); };
  const hs = size / 2;
  for (const pen of pens) {
    put(floors, fi++, pen.x, 0.01, pen.z, size, 0.02, size);
    for (const y of [0.35, 0.7]) {
      put(rails, ri++, pen.x, y, pen.z - hs, size, 0.08, 0.08);
      put(rails, ri++, pen.x, y, pen.z + hs, size, 0.08, 0.08);
      put(rails, ri++, pen.x - hs, y, pen.z, 0.08, 0.08, size);
      put(rails, ri++, pen.x + hs, y, pen.z, 0.08, 0.08, size);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(posts, pi++, pen.x + sx * hs, 0.45, pen.z + sz * hs, 0.16, 0.9, 0.16);
  }
  for (const im of [rails, posts, floors]) { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); scene.add(im); }
}
