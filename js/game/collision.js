// Circle-vs-circle collision on the ground plane (x/z) with a uniform spatial grid.
const CELL = 4;
const key = (cx, cz) => (cx + 512) * 1024 + (cz + 512);

export function createGrid() {
  const cells = new Map();
  const xs = [], zs = [], rs = [];

  function add(x, z, r) {
    const i = xs.length;
    xs.push(x); zs.push(z); rs.push(r);
    const k = key(Math.floor(x / CELL), Math.floor(z / CELL));
    const list = cells.get(k);
    if (list) list.push(i); else cells.set(k, [i]);
  }

  // Push body {x, z} (radius r) out of any overlapping static circle. Returns true if pushed.
  function resolve(body, r) {
    let hit = false;
    const cx = Math.floor(body.x / CELL), cz = Math.floor(body.z / CELL);
    for (let pass = 0; pass < 2; pass++) {
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = -1; oz <= 1; oz++) {
          const list = cells.get(key(cx + ox, cz + oz));
          if (!list) continue;
          for (let j = 0; j < list.length; j++) {
            const i = list[j];
            const dx = body.x - xs[i], dz = body.z - zs[i];
            const min = r + rs[i];
            const d2 = dx * dx + dz * dz;
            if (d2 < min * min) {
              const d = Math.sqrt(d2) || 0.0001;
              const push = (min - d) / d;
              body.x += dx * push;
              body.z += dz * push;
              hit = true;
            }
          }
        }
      }
    }
    return hit;
  }

  return { add, resolve };
}
