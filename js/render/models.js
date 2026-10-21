import * as THREE from '../../lib/three.module.min.js';
import { mat } from './materials.js';

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
  box(g, 0.3, 0.7, 0.3, 0x2f4f8f, -0.18, 0.35, 0);   // legs
  box(g, 0.3, 0.7, 0.3, 0x2f4f8f, 0.18, 0.35, 0);
  box(g, 0.8, 0.8, 0.45, shirt, 0, 1.1, 0);       // body
  box(g, 0.2, 0.7, 0.25, shirt, -0.5, 1.1, 0);    // arms
  box(g, 0.2, 0.7, 0.25, shirt, 0.5, 1.1, 0);
  box(g, 0.5, 0.5, 0.5, 0xf1c9a0, 0, 1.75, 0);       // head
  box(g, 1.0, 0.07, 1.0, hat, 0, 2.02, 0);      // hat brim
  box(g, 0.55, 0.28, 0.55, hat, 0, 2.17, 0);    // hat crown
  g.add(makeBlobShadow(0.7));
  return g;
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
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(g, lw, leg, lw, hc === a.c ? a.c : 0x555555, sx * (w / 2 - lw / 2), leg / 2, sz * (l / 2 - lw / 2));
  }
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
  box(g, 0.5, 0.4, 0.65, a.c, 0, 0.45, 0);
  if (a.plume) box(g, 0.7, 0.8, 0.1, a.tc, 0, 0.85, -0.45);
  else box(g, 0.3, 0.1, 0.25, a.tc, 0, 0.7, -0.38);
  box(g, 0.26, 0.3, 0.26, a.c, 0, 0.8, 0.3);
  box(g, 0.12, 0.08, 0.15, a.b, 0, 0.78, 0.5);
  if (a.crest) box(g, 0.08, 0.1, 0.16, a.crest, 0, 0.99, 0.3);
  box(g, 0.06, 0.25, 0.06, a.b, -0.12, 0.13, 0);
  box(g, 0.06, 0.25, 0.06, a.b, 0.12, 0.13, 0);
  g.scale.setScalar(a.s || 1);
  g.add(makeBlobShadow(0.4));
  return g;
}

export function makeAnimal(a) {
  const g = a.k === 'bird' ? makeBird(a) : makeQuad(a);
  g.userData.animalId = a.id;
  return g;
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
  const floors = new THREE.InstancedMesh(boxGeo, mat(0xb08a5a), pens.length);
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
