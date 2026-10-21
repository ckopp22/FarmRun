// Bump CACHE on each release so clients pick up new files.
const CACHE = 'farmrun3d-v49';
const SHELL = [
  './',
  'index.html',
  'audio/acoustic1.mp3',
  'audio/acoustic2.mp3',
  'audio/chase.mp3',
  'audio/cash.mp3',
  'audio/car-door.mp3',
  'audio/walking.mp3',
  'audio/deny.mp3',
  'audio/drive.mp3',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'css/style.css',
  'lib/three.module.min.js',
  'js/main.js',
  'js/render/renderer.js',
  'js/render/quality.js',
  'js/screens/manager.js',
  'js/screens/woods.js',
  'js/render/camera.js',
  'js/render/materials.js',
  'js/render/models.js',
  'js/render/instancing.js',
  'js/game/collision.js',
  'js/game/map.js',
  'js/game/player.js',
  'js/game/truck.js',
  'js/game/animals.js',
  'js/game/followers.js',
  'js/game/rivals.js',
  'js/game/confetti.js',
  'js/render/particles.js',
  'js/render/footsteps.js',
  'js/render/indicators.js',
  'js/screens/drive.js',
  'js/systems/input.js',
  'js/systems/save.js',
  'js/systems/audio.js',
  'js/systems/economy.js',
  'js/screens/menu.js',
  'js/screens/farm.js',
  'js/data/animals.js',
  'js/screens/slots.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

// The page asks us to take over once the player taps the update banner.
self.addEventListener('message', (e) => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
