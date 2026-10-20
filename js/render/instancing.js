import * as THREE from '../../lib/three.module.min.js';
import { mat } from './materials.js';

// trees: [{ x, z, s }] -> two InstancedMeshes (trunk + canopy), 2 draw calls total.
export function createTrees(scene, trees) {
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.3, 1.4, 6).translate(0, 0.7, 0);
  const canopyGeo = new THREE.ConeGeometry(1.5, 3.8, 7).translate(0, 1.4 + 1.9 - 0.3, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, mat(0x6b4a2b), trees.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, mat(0x2f7d3a), trees.length);
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
