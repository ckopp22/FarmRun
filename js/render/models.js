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
export function makeFarmer(shirt = 0xc0392b, hat = 0xe8c15a) {
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
  box(g, 1.0, 0.07, 1.0, hat, 0, 2.02, 0);      // hat brim
  box(g, 0.55, 0.28, 0.55, hat, 0, 2.17, 0);    // hat crown
  g.add(makeBlobShadow(0.7));
  return g;
}

// Farmer sitting on the snowmobile seat (add to the makeSnowmobile group), legs and arms forward.
export function makeSeatedFarmer() {
  const g = makeFarmer();
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
  g.add(makeBlobShadow(3));
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
  g.add(makeBlobShadow(Math.max(w, l) * 0.8));
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
