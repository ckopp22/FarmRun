import * as THREE from '../../lib/three.module.min.js';

const PITCH = Math.PI / 4;   // 45 degrees down
const DIST = 15;
const YAW = 0;               // fixed: always looks north (-z)
const FOLLOW = 6;            // higher = snappier

const focus = new THREE.Vector3();

export const CAMERA_YAW = YAW;

export function createChaseCamera(aspect) {
  return new THREE.PerspectiveCamera(55, aspect, 0.5, 150);
}

function place(camera) {
  const h = Math.cos(PITCH) * DIST;
  camera.position.set(focus.x + Math.sin(YAW) * h, focus.y + Math.sin(PITCH) * DIST, focus.z + Math.cos(YAW) * h);
  camera.lookAt(focus.x, focus.y, focus.z);
}

export function snapCamera(camera, x, z) {
  focus.set(x, 1, z);
  place(camera);
}

export function updateChaseCamera(camera, x, z, dt) {
  const k = 1 - Math.exp(-FOLLOW * dt);
  focus.x += (x - focus.x) * k;
  focus.z += (z - focus.z) * k;
  place(camera);
}
