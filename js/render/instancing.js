import * as THREE from '../../lib/three.module.min.js';
import { speckleTexture } from './renderer.js';

let canopyMat = null, trunkMat = null;
const speckled = (rgb, tiles, seed, repeat) =>
  new THREE.MeshLambertMaterial({ map: speckleTexture(rgb, tiles, seed, repeat), flatShading: true });

// trees: [{ x, z, s }] -> two InstancedMeshes (trunk + canopy), 2 draw calls total.
export function createTrees(scene, trees) {
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.3, 1.4, 6).translate(0, 0.7, 0);
  const canopyGeo = new THREE.ConeGeometry(1.5, 3.8, 7).translate(0, 1.4 + 1.9 - 0.3, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, (trunkMat ||= speckled([107, 74, 43], 2, 31, [1, 1])), trees.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, (canopyMat ||= speckled([47, 125, 58], 6, 57, [2, 1])), trees.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    q.setFromAxisAngle(up, t.x * 13.37);
    pos.set(t.x, 0, t.z);
    scl.set(t.s, t.s, t.s);
    m.compose(pos, q, scl);
    trunks.setMatrixAt(i, m);
    canopies.setMatrixAt(i, m);
  }
  trunks.computeBoundingSphere();
  canopies.computeBoundingSphere();
  scene.add(trunks, canopies);
}

let stemMat = null, bloomMat = null;
const FLOWER_COLORS = [0xf7f7f2, 0xffe040, 0xfa99c0, 0xff8a5c, 0xb89cf0];

// flowers: [{ x, z, s, c }] -> blocky speckled flowers, stems + tinted heads in 2 draw calls.
export function createFlowers(scene, flowers) {
  const stemGeo = new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(0, 0.15, 0);
  const headGeo = new THREE.BoxGeometry(0.2, 0.1, 0.2).translate(0, 0.34, 0);
  const stems = new THREE.InstancedMesh(stemGeo, (stemMat ||= speckled([60, 128, 48], 1, 71, [1, 1])), flowers.length);
  const heads = new THREE.InstancedMesh(headGeo, (bloomMat ||= speckled([235, 235, 235], 1, 83, [1, 1])), flowers.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  flowers.forEach((f, i) => {
    q.setFromAxisAngle(up, f.x * 7.7 + f.z * 3.1);
    m.compose(pos.set(f.x, 0, f.z), q, scl.set(f.s, f.s, f.s));
    stems.setMatrixAt(i, m);
    heads.setMatrixAt(i, m);
    heads.setColorAt(i, col.setHex(FLOWER_COLORS[f.c % FLOWER_COLORS.length]));
  });
  stems.computeBoundingSphere();
  heads.computeBoundingSphere();
  scene.add(stems, heads);
}
