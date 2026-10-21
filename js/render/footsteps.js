import * as THREE from '../../lib/three.module.min.js';

const MAX = 160;
const LIFE = 2.2;
const STRIDE = 0.8;
const SPREAD = 0.14;

// Pooled footprint decals: one InstancedMesh, shrinking as they fade.
export function createFootsteps(scene) {
  const geo = new THREE.PlaneGeometry(0.16, 0.26).rotateX(-Math.PI / 2);
  const mesh = new THREE.InstancedMesh(
    geo,
    new THREE.MeshBasicMaterial({ color: 0x2a1c0e, transparent: true, opacity: 0.4, depthWrite: false }),
    MAX
  );
  mesh.frustumCulled = false;
  const x = new Float32Array(MAX), z = new Float32Array(MAX), rot = new Float32Array(MAX), life = new Float32Array(MAX);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  m.makeScale(0, 0, 0);
  for (let i = 0; i < MAX; i++) mesh.setMatrixAt(i, m);
  scene.add(mesh);
  let next = 0;

  // Call each frame per walker ({ x, z, heading }); drops a print every STRIDE units moved.
  function track(e) {
    if (e.fx === undefined) { e.fx = e.x; e.fz = e.z; e.fside = 1; return; }
    if (Math.hypot(e.x - e.fx, e.z - e.fz) < STRIDE) return;
    const i = next++ % MAX;
    const side = e.fside = -e.fside;
    x[i] = e.x + Math.cos(e.heading) * SPREAD * side;
    z[i] = e.z - Math.sin(e.heading) * SPREAD * side;
    rot[i] = e.heading;
    life[i] = LIFE;
    e.fx = e.x; e.fz = e.z;
  }

  function update(dt) {
    for (let i = 0; i < MAX; i++) {
      if (life[i] <= 0) continue;
      life[i] -= dt;
      s.setScalar(life[i] > 0 ? Math.min(1, life[i] / LIFE * 2) : 0);
      m.compose(p.set(x[i], 0.03, z[i]), q.setFromAxisAngle(up, rot[i]), s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { track, update };
}
