import * as THREE from '../../lib/three.module.min.js';
import { pixelRatio } from './quality.js';

const SKY = 0x9fd4f0;

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio());
  return renderer;
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 18, 62);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x5a7a3a, 1.0));
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.6);
  sun.position.set(-20, 40, 15);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x5fa83f })
  );
  scene.add(ground);
  return scene;
}

// Size the drawing buffer to the canvas' CSS size (full screen, 100dvh).
export function fitRenderer(renderer, camera) {
  if (!camera) return;
  const canvas = renderer.domElement;
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

export function watchResize(renderer, getCamera) {
  const fit = () => fitRenderer(renderer, getCamera());
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => {
    fit();
    // iOS reports the new size a moment after the event.
    setTimeout(fit, 150);
    setTimeout(fit, 500);
  });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
  fit();
}

// Free GPU resources of a scene that is being left.
export function disposeScene(scene) {
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    if (o.dispose && o.isInstancedMesh) o.dispose();
  });
}

export function watchContext(canvas, onLost, onRestored) {
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    onLost();
  });
  canvas.addEventListener('webglcontextrestored', onRestored);
}
