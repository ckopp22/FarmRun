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

  // True if a circle at (x, z) with radius r touches any static circle.
  function overlaps(x, z, r) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        const list = cells.get(key(cx + ox, cz + oz));
        if (!list) continue;
        for (let j = 0; j < list.length; j++) {
          const i = list[j];
          const dx = x - xs[i], dz = z - zs[i], min = r + rs[i];
          if (dx * dx + dz * dz < min * min) return true;
        }
      }
    }
    return false;
  }

  // True if a static circle sits on the segment (x0, z0) -> (x1, z1).
  function blocked(x0, z0, x1, z1) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.ceil(len / 0.8);
    for (let s = 1; s < n; s++) {
      const t = s / n;
      if (overlaps(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 0.1)) return true;
    }
    return false;
  }

  // Call fn(x, z, r) for every static circle in cells within `range` of (x, z).
  function each(x, z, range, fn) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL), n = Math.ceil(range / CELL);
    for (let ox = -n; ox <= n; ox++) {
      for (let oz = -n; oz <= n; oz++) {
        const list = cells.get(key(cx + ox, cz + oz));
        if (!list) continue;
        for (let j = 0; j < list.length; j++) fn(xs[list[j]], zs[list[j]], rs[list[j]]);
      }
    }
  }

  return { add, resolve, overlaps, blocked, each };
}
