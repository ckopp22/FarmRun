import * as THREE from '../../lib/three.module.min.js';
import { pixelRatio } from './quality.js';
import { setShadowOpacity } from './models.js';

const SKY = 0x9fd4f0, DESERT_SKY = 0xf3dcab, WINTER_SKY = 0xc8d8ea;

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio());
  return renderer;
}

// Pixel-speckled ground (same look as Step on the Farm): 8 pixels per tile, per-tile and per-pixel shade jitter.
const PX = 8;
export function speckleTexture([r, gr, b], tiles, seed, repeat) {
  const N = tiles * PX;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const shades = [-0.07, -0.03, 0, 0.03, 0.07];
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const tile = 1 + (rnd() - 0.5) * 0.08;
      for (let y = 0; y < PX; y++) {
        for (let x = 0; x < PX; x++) {
          const k = tile + shades[Math.floor(rnd() * shades.length)];
          g.fillStyle = `rgb(${Math.min(255, r * k) | 0},${Math.min(255, gr * k) | 0},${Math.min(255, b * k) | 0})`;
          g.fillRect(tx * PX + x, ty * PX + y, 1, 1);
        }
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.anisotropy = 4;
  if (repeat) {
    const [rx, ry] = Array.isArray(repeat) ? repeat : [repeat, repeat];
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
  }
  return t;
}

let grassTex = null;
const grassTexture = () => grassTex || (grassTex = speckleTexture([102, 184, 77], 16, 12345, 400 / 16));

// One pen-sized floor texture (not tiled: box UVs span the whole face).
let penTex = null;
export const penFloorTexture = (size) => penTex || (penTex = speckleTexture([176, 138, 90], Math.round(size), 777));

let sandTex = null;
const sandTexture = () => sandTex || (sandTex = speckleTexture([226, 190, 120], 16, 2468, 400 / 16));

let snowTex = null;
const snowTexture = () => snowTex || (snowTex = speckleTexture([198, 213, 231], 16, 1357, 400 / 16));

// theme: false/'farm', true/'desert' or 'winter'
export function createScene(theme = false) {
  const winter = theme === 'winter', desert = theme === true || theme === 'desert';
  setShadowOpacity(0.28);
  const scene = new THREE.Scene();
  const sky = winter ? WINTER_SKY : desert ? DESERT_SKY : SKY;
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.Fog(sky, 18, 62);

  scene.add(new THREE.HemisphereLight(0xffffff, winter ? 0x9fb4cc : desert ? 0xb89a5a : 0x5a7a3a, 1.0));
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.6);
  sun.position.set(-20, 40, 15);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2),
    new THREE.MeshLambertMaterial({ map: winter ? snowTexture() : desert ? sandTexture() : grassTexture() })
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

const dirtMat = new THREE.MeshLambertMaterial({ map: speckleTexture([156, 122, 77], 16, 4242, 1 / 16) });

// Smooth random wobble in [-1, 1] along t.
function wobble() {
  const a = Math.random() * 6.28, b = Math.random() * 6.28, c = Math.random() * 6.28;
  return (t) => (Math.sin(t * 1.7 + a) + Math.sin(t * 3.9 + b) * 0.6 + Math.sin(t * 7.3 + c) * 0.3) / 1.9;
}

// Flat dirt patch (circle) or road (w x len strip, long axis along heading yaw) with ragged natural edges.
export function addDirt(scene, x, z, { radius, w, len, yaw = 0, y = 0.02 }) {
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
  m.position.set(x, y, z);
  m.rotation.y = yaw;
  scene.add(m);
}

// Ragged dirt path looping around a rectangle (x0..x1, z0..z1): `gap` clear of it, `width` wide. Grass stays inside.
export function addDirtRing(scene, { x0, x1, z0, z1, gap = 0.8, width = 2.2, y = 0.015 }) {
  const rim = (grow) => {
    const a = x0 - grow, b = x1 + grow, c = z0 - grow, d = z1 + grow, pts = [], w = wobble(), step = 1.5;
    const edge = (sx, sz, ex, ez, nx, nz) => {
      const len = Math.hypot(ex - sx, ez - sz), n = Math.max(1, Math.round(len / step));
      for (let i = 0; i < n; i++) {
        const t = i / n, push = 0.45 * w((pts.length) * 0.9);
        pts.push(new THREE.Vector2(sx + (ex - sx) * t + nx * push, -(sz + (ez - sz) * t + nz * push)));
      }
    };
    edge(a, c, b, c, 0, -1);
    edge(b, c, b, d, 1, 0);
    edge(b, d, a, d, 0, 1);
    edge(a, d, a, c, -1, 0);
    return pts;
  };
  const shape = new THREE.Shape(rim(gap + width));
  shape.holes.push(new THREE.Path(rim(gap)));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), dirtMat);
  m.position.y = y;
  scene.add(m);
}
