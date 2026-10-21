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
  return m;
}

// Models face +z.
export function makeFarmer() {
  const g = new THREE.Group();
  box(g, 0.3, 0.7, 0.3, 0x2f4f8f, -0.18, 0.35, 0);   // legs
  box(g, 0.3, 0.7, 0.3, 0x2f4f8f, 0.18, 0.35, 0);
  box(g, 0.8, 0.8, 0.45, 0xc0392b, 0, 1.1, 0);       // body
  box(g, 0.2, 0.7, 0.25, 0xc0392b, -0.5, 1.1, 0);    // arms
  box(g, 0.2, 0.7, 0.25, 0xc0392b, 0.5, 1.1, 0);
  box(g, 0.5, 0.5, 0.5, 0xf1c9a0, 0, 1.75, 0);       // head
  box(g, 1.0, 0.07, 1.0, 0xe8c15a, 0, 2.02, 0);      // hat brim
  box(g, 0.55, 0.28, 0.55, 0xe8c15a, 0, 2.17, 0);    // hat crown
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
  box(g, 6, 3.4, 5, 0xb83a2e, 0, 1.7, 0);               // walls
  box(g, 1.8, 2.4, 0.12, 0xf4efe4, 0, 1.2, 2.53);       // door
  box(g, 0.14, 2.4, 0.14, 0x8e2b20, 0, 1.2, 2.6);       // door divider
  for (const s of [-1, 1]) {
    const r = box(g, 3.9, 0.3, 5.6, 0x6b4a2b, s * 1.56, 3.4 + 0.9, 0);
    r.rotation.z = s * Math.PI / 6;
  }
  g.add(makeBlobShadow(4.2));
  return g;
}
