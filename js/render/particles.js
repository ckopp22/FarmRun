import * as THREE from '../../lib/three.module.min.js';

const MAX = 48;
const GRAVITY = 14;

// Pooled burst particles: one InstancedMesh, no allocation after creation.
export function createParticles(scene) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    MAX
  );
  mesh.frustumCulled = false;
  const c = new THREE.Color();
  const x = new Float32Array(MAX), y = new Float32Array(MAX), z = new Float32Array(MAX);
  const vx = new Float32Array(MAX), vy = new Float32Array(MAX), vz = new Float32Array(MAX), life = new Float32Array(MAX);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let next = 0, alive = 0;
  for (let i = 0; i < MAX; i++) { m.makeScale(0, 0, 0); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.setHex(0xffffff)); }
  scene.add(mesh);

  function burst(bx, by, bz, color, count, speed) {
    for (let n = 0; n < count; n++) {
      const i = next++ % MAX;
      const a = Math.random() * 6.28, sp = speed * (0.4 + Math.random() * 0.6);
      x[i] = bx; y[i] = by; z[i] = bz;
      vx[i] = Math.cos(a) * sp; vz[i] = Math.sin(a) * sp; vy[i] = speed * (0.6 + Math.random());
      life[i] = 0.5 + Math.random() * 0.3;
      mesh.setColorAt(i, c.setHex(color));
    }
    mesh.instanceColor.needsUpdate = true;
    alive = MAX;
  }

  function update(dt) {
    if (!alive) return;
    let any = false;
    for (let i = 0; i < MAX; i++) {
      if (life[i] > 0) {
        life[i] -= dt;
        vy[i] -= GRAVITY * dt;
        x[i] += vx[i] * dt; y[i] = Math.max(0.05, y[i] + vy[i] * dt); z[i] += vz[i] * dt;
        s.setScalar(Math.max(0, life[i] / 0.8) + 0.2);
        if (life[i] <= 0) s.setScalar(0);
        m.compose(p.set(x[i], y[i], z[i]), q, s);
        mesh.setMatrixAt(i, m);
        any = true;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (!any) alive = 0;
  }

  return { burst, update };
}
