import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { sampleEntity } from '../src/world/entity/sampleEntity.ts';
import { CREATOR_HEAD, sampleHead, syncCreatorHead } from '../src/world/entity/head.ts';
import { createEntityTransition, evaluatePositions } from '../src/world/entity/transition.ts';

const source = sampleEntity(),
  data = sampleHead();
assert.deepEqual(data, sampleHead());
assert.deepEqual(data.ids, source.regionIndices[0]);
assert.equal(data.ids.length, 284);
for (const [index, id] of data.ids.entries()) {
  assert.equal(source.regions[id], 0);
  for (let axis = 0; axis < 3; axis++) {
    assert.equal(data.positions[index * 3 + axis], source.positions[id * 3 + axis]);
    assert.equal(data.colors[index * 3 + axis], source.colors[id * 3 + axis]);
  }
}
const output = new Float32Array(data.positions.length),
  saved = structuredClone(data);
for (let i = 0; i <= 100; i++) {
  evaluatePositions(data.positions, data.dispersed, i / 100, output);
  for (let j = 0; j < output.length; j++)
    assert.ok(
      Math.abs(output[j] - CREATOR_HEAD.center[j % 3]) <= CREATOR_HEAD.halfBounds[j % 3] + 1e-6,
    );
  if (i === 0) assert.deepEqual(output, data.dispersed);
  if (i === 100) assert.deepEqual(output, data.positions);
}
assert.deepEqual(data, saved);
const head = createEntityTransition(false, true, 0);
let notices = 0;
head.subscribe(() => notices++);
const policy = { paused: false, reducedMotion: false, visible: true };
const sync = (formed, changes = {}) => {
  Object.assign(policy, changes);
  syncCreatorHead(head, formed, policy);
};
const run = (n = 20) => {
  for (let i = 0; i < n; i++) head.advance(0.05);
};
const progress = () => head.getProgress('head');
assert.equal(progress(), 0);
sync(false);
assert.equal(notices, 0);
sync(true);
head.advance(99);
assert.equal(progress(), 0);
run();
assert.ok(progress() > 0 && progress() < 1);
const prior = progress(),
  snapshot = head.getSnapshot(),
  beforeNotices = notices;
sync(true);
assert.equal(head.getSnapshot(), snapshot);
assert.equal(notices, beforeNotices);
sync(false);
assert.equal(progress(), prior);
head.advance(0.05);
assert.ok(progress() < prior);
sync(true, { paused: true });
const paused = progress();
sync(false);
run();
assert.equal(progress(), paused);
assert.equal(head.getRegions()[0].target, 0);
sync(true, { reducedMotion: true });
assert.equal(progress(), paused, 'explicit pause wins over preference and section changes');
sync(false);
sync(false, { paused: false });
assert.equal(progress(), 0, 'Resume under reduced motion selects latest target');
assert.equal(head.getSnapshot().advancing, false);
sync(true);
assert.equal(progress(), 1);
sync(false, { reducedMotion: false });
run();
sync(true, { visible: false });
const hidden = progress();
run(100);
assert.equal(progress(), hidden);
sync(false, { paused: true });
sync(false, { visible: true });
run();
assert.equal(progress(), hidden, 'return must not resume a user pause');
sync(false, { paused: false });
head.advance(99);
assert.equal(progress(), hidden);
head.advance(99);
assert.ok(hidden - progress() <= 0.010000001);
run(150);
assert.equal(progress(), 0);
assert.equal(head.getSnapshot().advancing, false);
sync(true);
run();
sync(false);
run(2);
sync(true);
const reversing = progress();
sync(true, { reducedMotion: true, paused: true });
assert.equal(progress(), reversing, 'simultaneous pause and reduced motion cannot settle');
sync(true, { paused: false });
assert.equal(progress(), 1);
assert.ok(
  head
    .getRegions()
    .slice(1)
    .every((r) => r.progress === 0 && !r.playing),
);
for (const file of await readdir(new URL('../dist/assets/', import.meta.url))) {
  const text = await readFile(new URL('../dist/assets/' + file, import.meta.url), 'utf8');
  for (const forbidden of [
    'entity-particles',
    'Fragmented humanoid',
    'Control region',
    'entityFixture',
    'worldFixture',
    'entityProbe',
  ])
    assert.ok(!text.includes(forbidden), `${forbidden} leaked into production`);
}
console.log(
  'PASS head-only identity/colors, exact deterministic endpoints, local envelope, initial dispersion, observation/reversal, pause/preference/visibility priority, bounds and production exclusion',
);
