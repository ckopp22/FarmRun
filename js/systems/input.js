// Floating joystick (anywhere on screen) + WASD/arrows. Exposes input.x / input.y in [-1, 1], y down.
const MAX = 50;   // px of knob travel for full speed

export function createInput() {
  const input = { x: 0, y: 0 };
  const base = document.getElementById('stick-base');
  const knob = document.getElementById('stick-knob');
  const keys = new Set();
  let touchId = null, ox = 0, oz = 0, sx = 0, sy = 0;

  function setStick(tx, ty) {
    let dx = tx - ox, dy = ty - oz;
    const len = Math.hypot(dx, dy);
    if (len > MAX) { dx = dx / len * MAX; dy = dy / len * MAX; }
    sx = dx / MAX; sy = dy / MAX;
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function endStick() {
    touchId = null; sx = 0; sy = 0;
    base.style.opacity = '0';
    knob.style.transform = '';
  }

  // Let taps on buttons through so they still fire click.
  const onUi = (e) => e.target.closest && e.target.closest('button, .slot-card, #shop-panel');

  document.addEventListener('touchstart', (e) => {
    if (onUi(e)) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (touchId === null) {
        touchId = t.identifier;
        ox = t.clientX; oz = t.clientY;
        base.style.left = ox + 'px';
        base.style.top = oz + 'px';
        base.style.opacity = '1';
        setStick(ox, oz);
      }
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (onUi(e)) return;
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === touchId) setStick(t.clientX, t.clientY);
  }, { passive: false });

  const end = (e) => {
    for (const t of e.changedTouches) if (t.identifier === touchId) endStick();
  };
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);

  // iOS pinch-zoom gestures
  for (const g of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(g, (e) => e.preventDefault());
  }

  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  input.update = function () {
    if (touchId !== null) {
      this.x = sx; this.y = sy;
      return;
    }
    let kx = 0, ky = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) kx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) kx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) ky -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) ky += 1;
    const len = Math.hypot(kx, ky) || 1;
    this.x = kx / len; this.y = ky / len;
  };

  return input;
}
