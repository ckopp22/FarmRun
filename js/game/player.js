import { makeFarmer, animateFarmer } from '../render/models.js';
import { PLAYER_LIMIT } from './map.js';

const SPEED = 6;
const TURN = 14;
const RADIUS = 0.45;

export function createPlayer(scene, x, z) {
  const group = makeFarmer();
  group.position.set(x, 0, z);
  scene.add(group);
  return { group, x, z, heading: Math.PI, radius: RADIUS, run: 0, runT: 0 };
}

// input: { x, y } in screen space (y down). Movement is relative to the camera yaw.
export function updatePlayer(p, input, grid, dt, yaw) {
  const mag = Math.min(1, Math.hypot(input.x, input.y));
  if (mag > 0.01) {
    const s = Math.sin(yaw), c = Math.cos(yaw);
    const wx = input.x * c + input.y * s;
    const wz = -input.x * s + input.y * c;
    const step = SPEED * (p.speedMult || 1) * mag * dt / Math.hypot(wx, wz);
    p.x += wx * step;
    p.z += wz * step;

    const target = Math.atan2(wx, wz);
    let d = target - p.heading;
    d = ((d + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    p.heading += d * (1 - Math.exp(-TURN * dt));
  }
  p.run += (mag - p.run) * Math.min(1, 12 * dt);
  p.runT += dt * (0.5 + p.run);
  animateFarmer(p.group, p.runT, p.run);
  grid.resolve(p, p.radius);
  p.x = Math.max(-PLAYER_LIMIT, Math.min(PLAYER_LIMIT, p.x));
  p.z = Math.max(-PLAYER_LIMIT, Math.min(PLAYER_LIMIT, p.z));
  p.group.position.x = p.x;
  p.group.position.z = p.z;
  p.group.rotation.y = p.heading;
}
