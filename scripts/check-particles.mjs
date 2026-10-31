import assert from 'node:assert/strict';
import { PARTICLE_FIELD as field } from '../src/world/particles/config.ts';
import { generateParticles, moveParticles } from '../src/world/particles/generateParticles.ts';

const data = generateParticles();
assert.deepEqual(data, generateParticles(), 'the seed survives rerenders and remounts');
assert.notDeepEqual(data.positions, generateParticles(field.seed + 1).positions);
assert.equal(data.positions.length, field.count * 3);
assert.equal(data.colors.length, field.count * 3);
assert.equal(data.phases.length, field.count);
assert.ok(Number.isInteger(field.count) && field.count > 0 && field.count <= 500);
for (const array of Object.values(data)) assert.ok(array.every(Number.isFinite));
assert.ok(data.colors.every((value) => value >= 0 && value <= 1));
let left = 0;
let right = 0;
for (let index = 0; index < field.count; index++) {
  const [x, y, z] = data.positions.slice(index * 3, index * 3 + 3);
  assert.ok(z >= field.depth[0] && z <= field.depth[1]);
  const halfHeight = (field.cameraDistance - z) * Math.tan((field.cameraFov * Math.PI) / 360);
  const nx = x / halfHeight;
  const ny = y / halfHeight;
  assert.ok(
    field.pockets.some((p) => Math.abs(nx - p.x) <= p.width && Math.abs(ny - p.y) <= p.height),
  );
  assert.ok(Math.abs(nx) >= 0.29, 'negative space across the center');
  if (nx < 0) left++;
  else right++;
}
assert.ok(left > right && right > field.count * 0.25, 'uneven but populated side pockets');
const target = new Float32Array(data.positions.length);
const original = data.positions.slice();
for (const time of [0, 0.05, 10, 100, 10000]) {
  assert.equal(moveParticles(target, data.positions, data.phases, time), undefined);
  for (let index = 0; index < target.length; index++) {
    assert.ok(Number.isFinite(target[index]));
    assert.ok(Math.abs(target[index] - original[index]) <= field.drift[index % 3] + 1e-6);
  }
}
assert.deepEqual(data.positions, original, 'frame updates do not change the base geometry');
console.log(
  'PASS seeded particle counts, finite colors/coordinates, pocket/depth bounds, negative space and bounded in-place motion',
);
