import * as THREE from '../../lib/three.module.min.js';

const COUNT = 90;
const COLORS = [0xff4d4d, 0xffd24a, 0x4dd2ff, 0x7dff6b, 0xff7ac8, 0xffffff];
const W = 9, D = 10, H = 16;   // spawn box around the focus point

// Falling paper confetti: one InstancedMesh, positions updated in place each frame.
export function createConfetti(scene) {
  const mesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.3, 0.2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    COUNT
  );
  mesh.frustumCulled = false;
  const c = new THREE.Color();
  const px = new Float32Array(COUNT), py = new Float32Array(COUNT), pz = new Float32Array(COUNT);
  const vy = new Float32Array(COUNT), ph = new Float32Array(COUNT), sp = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    px[i] = (Math.random() * 2 - 1) * W;
    py[i] = Math.random() * H;
    pz[i] = (Math.random() * 2 - 1) * D;
    vy[i] = 2 + Math.random() * 2;
    ph[i] = Math.random() * 6.28;
    sp[i] = 2 + Math.random() * 4;
    mesh.setColorAt(i, c.setHex(COLORS[i % COLORS.length]));
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  scene.add(mesh);
  mesh.visible = false;

  return {
    show(on) { mesh.visible = on; },
    update(dt, t, cx, cz) {
      if (!mesh.visible) return;
      for (let i = 0; i < COUNT; i++) {
        py[i] -= vy[i] * dt;
        if (py[i] < 0) py[i] += H;
        e.set(t * sp[i] + ph[i], t * sp[i] * 0.7, ph[i]);
        q.setFromEuler(e);
        p.set(cx + px[i] + Math.sin(t + ph[i]) * 0.6, py[i], cz + pz[i]);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
