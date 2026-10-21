import { fitRenderer, disposeScene } from '../render/renderer.js';

// A screen is { enter(ctx) -> { scene, camera }, update(dt), exit() }.
// The manager owns the one renderer; each screen builds its own scene and tears it down on exit.
export function createScreenManager(renderer, ctx) {
  const screens = new Map();
  let current = null;
  let active = null;

  const manager = {
    register(name, screen) { screens.set(name, screen); },

    go(name) {
      if (current) {
        current.exit();
        disposeScene(active.scene);
      }
      current = screens.get(name);
      active = current.enter(ctx);
      fitRenderer(renderer, active.camera);
    },

    update(dt) { if (current) current.update(dt); },
    render() { if (active) renderer.render(active.scene, active.camera); },
    camera() { return active && active.camera; },
  };

  ctx.go = manager.go;
  return manager;
}
