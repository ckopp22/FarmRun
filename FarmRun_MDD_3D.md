# FARM RUN 3D — Master Design Document (MDD)

**Platform:** Web game / PWA (iPhone-first), hosted on GitHub Pages
**Tech:** HTML + CSS + JavaScript (ES modules) with **Three.js (WebGL)** for 3D, no build tools. Three.js is vendored (copied into the repo), not loaded from a CDN, so the game runs offline.
**Build method:** Claude Code in VS Code → commit → push → GitHub Pages
**Base:** Game design, screens, economy and save system carried over from the 2D Farm Run MDD. The Turtle Tides code is no longer the base for the woods section, because that was 2D canvas; only its menu, save and PWA plumbing can be reused. Work in a new repo (`farm-run-3d`); the 2D version stays untouched.
**Goal:** Earn $1,000,000 to beat the game
**Purpose of this version:** See how well a real-time 3D game runs on the web (especially on iPhone) when built with Claude Code. Treat v1 as a proof of concept: low-poly, fast, simple.

---

## 1. Concept

You are a farmer with a barn full of empty animal pens. Hit **RUN**, drive your truck to the woods, jump out, and chase down wild animals in a 3D forest. Carry them back to the truck before rival farmers catch you. Sell your haul, upgrade the farm, and repeat until you hit a million dollars.

**Pillars**
1. **Simple** — one-thumb controls, short runs, instantly readable screens.
2. **Tense** — the risk is in the woods; losing your haul hurts.
3. **Collectible** — every animal starts as a silhouette; filling the farm is the long-term pull.
4. **Light** — 3D must never cost smoothness. If a visual feature drops the frame rate on an iPhone, it gets cut.

---

## 2. Game Flow

```
Main Menu → Save Slot Select → Farm Screen ⇄ (RUN) → Drive Cutscene → Woods → Result Screen → Farm Screen
```

1. **Main Menu** — title over a slowly rotating 3D farm diorama + big PLAY button.
2. **Save Slots** — four slots (see §5).
3. **Farm Screen** — hub. 3D farm with barn, farmer, animals, RUN button, shop.
4. **Drive** — short 3D truck drive leaving the farm (~2–3 sec, skippable).
5. **Woods** — run, collect, avoid farmers, return to truck.
6. **Result** — success (animals kept) or caught (haul lost).
7. **Sell/Upgrade** — back on the farm.
8. **Win** — reach $1,000,000 → victory screen.

---

## 3. Screens

One persistent Three.js renderer and canvas for the whole game. Each screen swaps the active 3D scene (or none, for pure-UI screens) and shows an HTML/CSS UI layer on top. Menus, HUD, shop and popups are plain HTML overlays, not 3D.

### 3.1 Global UI
- **Sound/Music toggle** — top-left corner on every screen. Two small icon buttons (🔊/🔇 sound, 🎵 music), each toggles independently. State saved globally (not per slot).
- All UI sits inside iPhone safe areas (see §9).

### 3.2 Main Menu
- "FARM RUN" title over a slow orbiting camera around a small farm diorama (barn, truck, a few trees).
- One large **PLAY** button, centered.
- Sound/music toggle top-left.

### 3.3 Save Slot Select
- Four large stacked cards: Slot 1–4.
- Empty slot: "New Farm" label.
- Used slot: money, animals collected (e.g. 12/40), last played date.
- Tap a card to start/continue. Small delete button on used slots (with confirm dialog).
- Back button returns to main menu.

### 3.4 Farm Screen (hub)
- 3D farm scene: barn centered, farmer standing in front of it, pens and animal spots around the farm, grass ground, fence, a few trees. Fixed, gently angled camera looking down at the farm (diorama feel), with a small idle camera sway.
- **Unowned animals appear as solid black silhouettes** (the same 3D model with a flat black unlit material); **owned animals appear in full color** and idle/wander with simple animation (bobbing, turning, small walks inside their pen).
- Top bar (right of the sound toggle): current money.
- Tap an animal (raycast) → small popup: name, sell value, count owned (silhouettes show "???").
- **Shop button** (side or bottom-left) opens the upgrade list (HTML panel).
- **Big RUN button** — bottom center, thumb-reachable, inside the bottom safe area.
- If the farm grows past one screen, the player drags to pan the camera within limits (no page scroll; see §9).

### 3.5 Drive Transition
- 3D truck pulls out of the farm, drives along a short road with parallax trees, arrives at the woods edge. Quick fade. Skippable by tap.
- Cheap trick allowed: reuse the truck model and a looping road strip rather than building a full route.

### 3.6 Woods (gameplay)
- Free movement on a bounded 3D forest floor (flat ground in v1; no terrain height, to keep collision and performance simple).
- Third-person chase camera (see §4.2).
- HUD (HTML): carried animal count / capacity, money value of carried haul, optional timer, sound toggle top-left.
- Virtual joystick (bottom-left) or drag-to-move (see §4).

### 3.7 Result Screen
- **Made it back:** list of animals collected, total sell value, big SELL button → money added, return to farm.
- **Caught:** "Busted!" — carried animals are lost, small penalty optional. Return to farm.
- New animals discovered get a "NEW!" reveal as the silhouette fills in on the farm (the black material fades to the animal's color).

### 3.8 Win Screen
- Triggered the moment money ≥ $1,000,000.
- Celebration (confetti particles over the 3D farm), final stats (play time, animals collected, runs made). Options: keep playing (free play) or return to menu.

---

## 4. Controls & Camera

Simple and one-handed.

### 4.1 Controls
- **Movement:** floating virtual joystick — touch anywhere on the left half of the screen and drag. (Alternative: drag-to-move toward the touch point; pick whichever tests better.)
- **Movement is camera-relative:** pushing the stick "up" moves the farmer away from the camera, "left" moves left on screen.
- **Auto-collect:** walk into an animal to pick it up. No extra button.
- **Auto-deposit:** walk into the truck to drop off the haul and finish the run.
- No sprint button in v1; sprint may come as an upgrade.
- Farm screen: tap-only (RUN button, shop, animals via raycast).
- Keyboard support (WASD/arrows) for desktop play.
- The farmer turns smoothly to face the movement direction.

### 4.2 Camera
- **Woods:** third-person chase camera behind and above the farmer (about 45° down), smoothly following with damping. **Camera yaw is fixed** in v1 (always looks "north"), so the joystick never feels confusing and there is no second control to manage. Optional later: auto-rotate to follow the direction of travel.
- **Farm:** fixed angled diorama camera.
- **Keeping the player visible:** trees that sit between the camera and the farmer fade out or are kept out of the camera's path. In v1, keep trees from being placed directly on the camera line and make tree trunks thin; if that is not enough, fade nearby tree canopies.
- Camera field of view ~50–60°, tuned so enough forest is visible to spot animals and rivals before they are close.

---

## 5. Save System

(Unchanged from the 2D design.)

- **4 save slots**, stored in `localStorage` (keys like `farmrun_slot_1`).
- Saved per slot: money, owned animals (counts), upgrade levels, total runs, play time, last played timestamp.
- Auto-save after every sell, upgrade purchase, and run result.
- Global settings (sound, music, graphics quality) stored separately.
- Wrap all storage in try/catch; include a version number in saves for future migration.
- Note: iOS can clear storage for sites not added to the Home Screen, so prompt players to install as a PWA.

---

## 6. Core Gameplay: The Woods Run

**Setup**
- Player spawns at the parked truck.
- Woods map is a bounded flat area (starts small, can grow with upgrades/levels), surrounded by a dense tree line or invisible wall so the player can't leave.
- Animals are scattered at spawn; rarer animals spawn farther from the truck.
- Layout is randomized each run from a seeded generator (trees, bushes, rocks, animals, rivals), so the same code builds every run without hand-made levels.

**Goal**
- Collect animals and return to the truck.

**Carrying**
- Collected animals shrink and trail behind the farmer as small followers (v1 option), or ride on the farmer's back/trailer; a counter in the HUD always shows the total.
- **Carry capacity** is limited (starts at 3); upgradeable.
- Carrying more animals slightly slows the farmer (optional, tunable).

**Collision (keep it cheap)**
- No physics engine. Use simple circle-vs-circle checks on the ground plane (x/z only): farmer vs trees/rocks (push out), farmer vs animals (collect), farmer vs rivals (caught), farmer vs truck (deposit).
- Use a spatial grid so only nearby objects are checked each frame.

**Danger: Rival Farmers**
- Wander the woods; when the player enters their detection radius **and** is inside their vision cone, they chase.
- Optional visual: a faint cone or ring on the ground showing the detection area (later unlockable with Scout Binoculars).
- If a rival touches the player → **caught**: haul lost, run ends.
- Rivals lose interest if the player gets far enough away or breaks line of sight (a tree blocks the line).
- More and faster rivals appear as higher-tier animals are hunted (rarer zones = more danger).
- Rivals do not spawn near the truck.
- Simple steering (move toward target, slide around trees); no full navmesh in v1.

**Return**
- Reaching the truck banks the haul and ends the run. The player can also leave empty-handed.

**Run end states**
| State | Result |
|---|---|
| Reached truck with animals | Haul kept → sell |
| Caught by rival | Carried animals lost |

Optional later: run timer, with night falling (darker fog and light) and more rivals appearing.

---

## 7. Animals

Each animal has: name, 3D model, sell value, rarity, spawn weight, speed (flee behavior).

| Tier | Examples | Value |
|---|---|---|
| Common | Chicken, Duck, Rabbit | $10–$50 |
| Uncommon | Goat, Sheep, Pig | $100–$500 |
| Rare | Cow, Llama, Horse | $1,000–$5,000 |
| Epic | Alpaca, Peacock, Highland Cow | $10,000–$50,000 |
| Legendary | Golden Goose, Unicorn Pony | $100,000+ |

- Values are placeholders; balance later (see §8).
- Animals idle/wander; rarer ones flee when the player gets close.
- First time an animal is collected, its silhouette on the farm becomes full color.
- Duplicates are allowed; owned count is shown, and each can be sold.
- **Models are built from code:** each animal is a small group of boxes/spheres/cylinders (body, head, legs, ears, tail) with flat colors. Animation is procedural (bob, leg swing, head turn), no skeletal rigs.
- The silhouette is the same model with every material swapped for one shared black `MeshBasicMaterial` (no lighting, no extra art).

**Sell rule:** On return, the player chooses to SELL the haul. Selling gives money. Selling removes the animals from the count but the animal stays "discovered" (color unlocked) permanently. *Optional design choice:* keep one of each discovered animal on the farm as a display and only sell duplicates.

---

## 8. Economy & Progression

(Unchanged from the 2D design.)

**Win condition:** $1,000,000.

**Upgrades (Shop)**
| Upgrade | Effect |
|---|---|
| Bigger Bag/Trailer | +carry capacity |
| Running Shoes | +move speed |
| Better Truck | larger woods zones unlocked / faster drive |
| Animal Lure | animals flee less / easier to catch |
| Scout Binoculars | wider camera view or shows rival detection ranges |
| Barn Expansion | more pen space for rarer animals |
| New Woods Zones | unlock higher-tier animal areas |

- Upgrades have 3–5 levels with scaling prices.
- Target pacing: roughly 2–4 hours to reach $1M. Tune with playtests.
- Income curve should ramp: early runs earn tens of dollars, late runs earn tens of thousands.
- No in-app purchases in v1.

---

## 9. iPhone / PWA Requirements

**Viewport & safe areas**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#...">
```
- CSS: use `env(safe-area-inset-top/right/bottom/left)` as padding on all HTML UI containers. Top-left sound toggle sits below the notch/status bar. RUN button sits above the home indicator.
- Use `100dvh` (not `100vh`) for full-height layouts. The WebGL canvas fills the whole screen, including behind the safe areas; only the UI is inset.

**Disable zoom, scroll bounce, and selection**
- `touch-action: none` on the game canvas; `touch-action: manipulation` on buttons (kills double-tap zoom).
- Block pinch via `gesturestart`/`gesturechange`/`gestureend` `preventDefault()`, and `touchmove` with multiple touches.
- `html, body { overflow: hidden; overscroll-behavior: none; position: fixed; width: 100%; height: 100%; }` to stop rubber-band scrolling.
- `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;`
- Any scrollable panel (e.g. shop list) uses its own `overflow-y: auto` with `-webkit-overflow-scrolling: touch` and `overscroll-behavior: contain`, so only that panel scrolls and never the page.

**PWA**
- `manifest.json`: name "Farm Run", short_name "Farm Run", `display: standalone`, `orientation: portrait`, theme/background colors, icons (180×180 apple-touch-icon, 192, 512, maskable).
- `service-worker.js`: cache-first for app shell and assets **including the vendored Three.js file**; versioned cache name; update flow when a new version deploys.
- Relative paths everywhere (GitHub Pages serves from `/repo-name/`).
- Include `apple-touch-icon` and a splash color so the launch feels native.

**Three.js on the web**
- Vendor `three.module.js` (or `three.module.min.js`) into `/lib/` and load it with an import map or relative ES module imports. No npm, no bundler.
- Import only what is needed from Three.js; keep add-ons (loaders, post-processing) out of v1.
- `renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })`.
- Handle `webglcontextlost` / `webglcontextrestored` (iOS can drop the context when the app is backgrounded): pause the loop, rebuild GPU resources on restore.
- Resize handler on `resize` and `orientationchange`; use `visualViewport` size to avoid the iOS toolbar glitch.

**Audio on iOS**
- Audio must be unlocked by a user gesture. Start audio on the first PLAY tap.
- Use Web Audio API; handle pausing when the app goes to the background (`visibilitychange`).
- Music and sound toggles persist.

**Performance (the main risk of going 3D)**
- Target 60 fps on a recent iPhone; fall back gracefully to 30 fps on older ones.
- Cap `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`, and drop to 1.5 or 1 automatically if the measured frame rate stays low (simple adaptive quality).
- **Low-poly everything.** Aim for well under ~100k triangles on screen at once.
- **Instancing:** draw all trees, bushes and rocks with `InstancedMesh` (one draw call per type). Share geometries and materials across all copies of anything.
- **Lighting:** one directional light + one ambient/hemisphere light. No point lights.
- **Shadows:** off by default. Use a cheap fake blob shadow (a dark transparent circle under each character). Real shadow maps are an optional "High" quality setting only.
- **Fog:** use linear fog to hide the far edge of the woods and let the game draw fewer distant objects.
- **Culling:** keep the frustum culling default; only update animals and rivals near the player each frame (far ones tick at a lower rate).
- No per-frame allocations in the game loop (reuse vectors); pool entities and particles.
- Delta-time movement, with the delta clamped (e.g. max 50 ms) so a lag spike or tab switch never teleports anyone.
- Quality setting (Low / Medium / High) stored in global settings; add a simple auto-detect on first launch.
- Dispose of geometries/materials/textures of the woods scene when leaving it (no memory growth across runs).

---

## 10. Art & Audio

**Art direction: clean low-poly / blocky toy look**
- Flat or lightly shaded colors, simple shapes, chunky proportions, bright farm colors, a slightly darker moodier palette in the woods.
- **No imported 3D models in v1.** Everything (farmer, rivals, truck, barn, animals, trees, rocks, fences) is built in code from Three.js primitives (`BoxGeometry`, `SphereGeometry`, `CylinderGeometry`, `ConeGeometry`) and grouped. This keeps the project to plain files with no asset pipeline, and Claude Code can edit models directly.
- Optional later: swap in `.glb` models (needs the GLTFLoader add-on and cached assets), or use the old 64×64 pixel art as textures/billboards for a "2.5D paper-cutout" variant.
- Small hand-drawn textures only where needed (grass tint, road); otherwise vertex colors or plain materials.
- Silhouettes: same model, shared black unlit material (see §7).
- UI art (buttons, icons, coins, menus) stays 2D HTML/CSS/SVG.

**Needed models/assets**
farmer, rival farmer (different color/hat), pickup truck, barn, fence/pens, tree (2–3 variants), bush, rock, grass ground, road strip, all animals (see §7), coin/cash icon, UI icons.

**Effects (cheap only)**
- Pickup pop (scale bounce + a few sprite particles), dust puffs behind the truck and farmer, coin burst on sell, confetti on win, "!" over a rival when it spots you.

**Audio**
- Music: cheerful farm theme (farm), tense woods loop (woods).
- SFX: button tap, animal pickup, animal cry on first discovery, rival alert, caught, truck engine, cash register on sale, upgrade purchase, victory jingle.

---

## 11. Project Structure

```
farm-run-3d/
├── index.html
├── manifest.json
├── service-worker.js
├── css/style.css
├── lib/
│   └── three.module.min.js      // vendored Three.js
├── js/
│   ├── main.js                  // boot, renderer, screen manager, main loop
│   ├── screens/                 // menu.js, slots.js, farm.js, drive.js, woods.js, result.js, win.js
│   ├── game/                    // player.js, animals.js, rivals.js, truck.js, map.js, collision.js
│   ├── render/                  // renderer.js, camera.js, models.js (all code-built models),
│   │                            // materials.js, instancing.js, particles.js, quality.js
│   ├── systems/                 // save.js, audio.js, input.js, economy.js
│   └── data/                    // animals.json, upgrades.json
├── assets/
│   ├── audio/ icons/
└── README.md
```

---

## 12. Claude Code Build Plan

Build in stages, committing after each. Test on a real iPhone early and often.

0. **Tech spike (do this first):** blank page with Three.js loaded from `/lib/`, a ground plane, a box farmer moving with the joystick, ~200 instanced trees, fog, chase camera. Deploy to GitHub Pages and test on the iPhone. Confirm frame rate, touch controls, safe areas, and no zoom/scroll. Decide quality defaults from this. If it can't hold ~60 fps, simplify before building anything else.
1. **Scaffold:** new repo, PWA files (manifest, service worker incl. Three.js), viewport/safe-area/no-zoom rules, screen manager, renderer with resize and context-loss handling, quality setting.
2. **Menus:** main menu with diorama backdrop, 4 save slots, save system, sound/music toggles.
3. **Farm screen:** 3D barn, farmer, pens, silhouette animals (black material), money display, RUN button, shop shell, tap-an-animal raycast.
4. **Woods run:** truck spawn, movement, camera-relative joystick, chase camera, instanced forest, animals to collect, carry system, return to truck.
5. **Rivals:** wander/chase/catch logic with vision cone and tree line-of-sight, caught result.
6. **Economy:** sell flow, upgrades, silhouette → color unlock, save on every change.
7. **Win condition** and victory screen.
8. **Polish:** audio, 3D drive transition, particles and juice, adaptive quality, performance pass, balance pass.
9. **Deploy:** push to GitHub, enable Pages (main branch / root), test "Add to Home Screen" on iPhone.

**Deploy checklist**
- `git add . && git commit -m "..." && git push`
- Settings → Pages → Deploy from branch → `main` / root.
- Open the URL in iPhone Safari → Share → Add to Home Screen → verify standalone mode, safe areas, no pinch zoom, no page scroll, audio works after first tap, WebGL recovers after backgrounding the app.
- Bump the service worker cache version on each release.

---

## 13. Testing Checklist

- [ ] Notch/Dynamic Island and home indicator never overlap UI
- [ ] Pinch zoom and double-tap zoom do nothing
- [ ] Page never scrolls or rubber-bands; only the shop list scrolls
- [ ] Sound/music toggles work and persist
- [ ] Four slots save/load independently; delete works
- [ ] Silhouettes become full color on first catch
- [ ] Caught = haul lost; made it back = haul sellable
- [ ] Reaching $1,000,000 triggers the win screen
- [ ] Runs offline after first load (including Three.js)
- [ ] Holds ~60 fps on a real iPhone in the woods with rivals and animals active
- [ ] Phone does not get noticeably hot after 10 minutes of play
- [ ] Game recovers after backgrounding the app and returning (WebGL context restored, audio resumes)
- [ ] Rotating the phone or resizing the window never stretches or breaks the view
- [ ] Memory stays flat over 20 consecutive runs (no leaks from scene setup/teardown)
- [ ] The farmer is never hidden behind trees for more than a moment
- [ ] Joystick direction always matches on-screen direction

---

## 14. Future Ideas (out of scope for v1)

- Animal collection book/achievements
- Day/night cycle and weather in the woods (fog, rain)
- Sprint stamina, traps, decoy items
- Daily bonus animals
- Swappable `.glb` models and richer animation
- Terrain with hills, rivers and bridges
- Player-controlled camera rotation
- Wrapping with Capacitor for the App Store
- Leaderboards / cloud saves

---

## 15. Open Questions

- Does the haul follow the farmer visually as little animals, or is it a counter only?
- Keep one of each animal on the farm after selling, or sell everything?
- Final names/themes for woods zones and rival farmer types.
- Joystick vs. drag-to-move: pick after on-device testing.
- Fixed camera angle vs. a camera that rotates with the farmer: start fixed, revisit after playtesting.
- Low-poly code-built models vs. imported `.glb` models: start with code-built, decide after the tech spike.
- Does 3D hold frame rate on older iPhones, or do we need a "Low" mode that cuts trees and effects?
