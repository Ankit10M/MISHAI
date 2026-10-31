import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { ENTITY, ENTITY_REGIONS, ANATOMY, MISSING_PATCHES } from '../src/world/entity/config.ts';
import { sampleEntity } from '../src/world/entity/sampleEntity.ts';
import {
  sampleAnatomy,
  inMissingPatch,
  entityCameraDistance,
} from '../src/world/entity/anatomy.ts';

const started = performance.now();
const data = sampleEntity();
assert.deepEqual(data, sampleEntity());
assert.notDeepEqual(data.positions, sampleEntity(ENTITY.seed + 1).positions);
assert.ok(ENTITY.count > 0 && ENTITY.count <= 4000 && ENTITY.count < 65536);
assert.equal(data.positions.length, ENTITY.count * 3);
assert.equal(data.colors.length, data.positions.length);
assert.equal(new Set(data.ids).size, ENTITY.count);
assert.ok(data.colors.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
const seen = new Set();
for (let index = 0; index < ENTITY.count; index++) {
  assert.equal(data.ids[index], index);
  const [x, y, z] = data.positions.slice(index * 3, index * 3 + 3);
  for (const [axis, value] of [x, y, z].entries()) {
    assert.ok(Number.isFinite(value));
    assert.ok(value >= ENTITY.bounds.min[axis] && value <= ENTITY.bounds.max[axis]);
  }
  assert.ok(sampleAnatomy(x, y, z).distance <= 1e-6);
  assert.equal(sampleAnatomy(x, y, z).region, ENTITY_REGIONS[data.regions[index]].id);
  assert.equal(inMissingPatch(x, y, z), false);
}
for (const [region, indices] of data.regionIndices.entries()) {
  assert.ok(indices.length > 20, `${ENTITY_REGIONS[region].id} must be inspectable`);
  for (const id of indices) {
    assert.equal(data.regions[id], region);
    assert.ok(!seen.has(id));
    seen.add(id);
  }
}
assert.equal(seen.size, ENTITY.count);
assert.equal(sampleAnatomy(0, 1.77, 0).region, 'head');
assert.equal(sampleAnatomy(1.03, -0.25, 0.035).region, 'arms');
assert.equal(sampleAnatomy(0, 0.7, 0.2).region, 'torso');
assert.equal(sampleAnatomy(0, 0.7, -0.2).region, 'spine');
assert.equal(sampleAnatomy(0.3, -1, 0).region, 'lower');
for (const patch of MISSING_PATCHES) assert.equal(inMissingPatch(...patch.center), true);
for (const part of ANATOMY) assert.ok(sampleAnatomy(...part.center).distance < 0);
for (const aspect of [0.3, 0.65, 1, 2.5]) {
  const distance = entityCameraDistance(aspect);
  assert.ok(Number.isFinite(distance));
  for (const angle of [0, ENTITY.viewAngle]) {
    for (let i = 0; i < ENTITY.count; i++) {
      const [x, y, z] = data.positions.slice(i * 3, i * 3 + 3);
      const rx = x * Math.cos(angle) + z * Math.sin(angle);
      const rz = -x * Math.sin(angle) + z * Math.cos(angle);
      const halfHeight = (distance - rz) * Math.tan((ENTITY.fov * Math.PI) / 360);
      assert.ok(Math.abs(y) / halfHeight < 1 / ENTITY.framingMargin);
      assert.ok(Math.abs(rx) / (halfHeight * aspect) < 1 / ENTITY.framingMargin);
    }
  }
}
for (const file of await readdir(new URL('../dist/assets/', import.meta.url))) {
  const text = await readFile(new URL('../dist/assets/' + file, import.meta.url), 'utf8');
  assert.ok(!text.includes('entity-particles') && !text.includes('Fragmented humanoid'));
}
assert.ok(!(await readdir(new URL('../dist/', import.meta.url))).includes('dev'));
console.log(
  'PASS deterministic entity, identity/regions, holes, finite bounds, count, camera fit and output isolation',
  JSON.stringify({
    count: ENTITY.count,
    regions: Object.fromEntries(ENTITY_REGIONS.map((r, i) => [r.id, data.regionIndices[i].length])),
    checkMs: Math.round(performance.now() - started),
  }),
);
