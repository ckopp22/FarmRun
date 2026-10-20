import * as THREE from '../../lib/three.module.min.js';

const cache = new Map();

// One shared flat-shaded material per color.
export function mat(color) {
  let m = cache.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, flatShading: true });
    cache.set(color, m);
  }
  return m;
}
