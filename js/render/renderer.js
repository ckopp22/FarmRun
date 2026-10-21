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
  // iOS standalone portrait can report a layout height short of the home-indicator area; cover the largest height reported.
  const portrait = window.innerHeight > window.innerWidth;
  const vv = window.visualViewport ? window.visualViewport.height : 0;
  const scr = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
  if (navigator.standalone || matchMedia('(display-mode: standalone)').matches) {
    const full = Math.max(window.innerHeight, vv, scr);
    canvas.style.height = full + 'px';
    document.documentElement.style.setProperty('--full-h', full + 'px');
  }
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

const dirtMat = new THREE.MeshLambertMaterial({ color: 0x9c7a4d });

// Smooth random wobble in [-1, 1] along t.
function wobble() {
  const a = Math.random() * 6.28, b = Math.random() * 6.28, c = Math.random() * 6.28;
  return (t) => (Math.sin(t * 1.7 + a) + Math.sin(t * 3.9 + b) * 0.6 + Math.sin(t * 7.3 + c) * 0.3) / 1.9;
}

// Flat dirt patch (circle) or road (w x len strip, long axis along heading yaw) with ragged natural edges.
export function addDirt(scene, x, z, { radius, w, len, yaw = 0 }) {
  const pts = [];
  if (radius) {
    const n = wobble(), N = 48;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2, r = radius * (1 + 0.22 * n(a * 2));
      pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }
  } else {
    const n1 = wobble(), n2 = wobble(), N = Math.round(len / 1.5);
    for (let i = 0; i <= N; i++) { const t = i / N * len; pts.push(new THREE.Vector2(w / 2 * (1 + 0.3 * n1(t * 0.4)), t - len / 2)); }
    for (let i = N; i >= 0; i--) { const t = i / N * len; pts.push(new THREE.Vector2(-w / 2 * (1 + 0.3 * n2(t * 0.4)), t - len / 2)); }
  }
  const m = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2), dirtMat);
  m.position.set(x, 0.02, z);
  m.rotation.y = yaw;
  scene.add(m);
}
