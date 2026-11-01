import assert from 'node:assert/strict';
import { sampleEntity } from '../src/world/entity/sampleEntity.ts';
import { ENTITY, ENTITY_REGIONS } from '../src/world/entity/config.ts';
import {
  TRANSITION,
  dispersedPositions,
  evaluatePositions,
  evaluateRegionalPositions,
  transitionCameraDistance,
  createEntityTransition,
} from '../src/world/entity/transition.ts';

const data = sampleEntity();
const original = structuredClone(data);
const dispersed = dispersedPositions(data.ids.length);
const savedDispersed = dispersed.slice();
const output = data.positions.slice();
assert.deepEqual(dispersed, dispersedPositions(data.ids.length));
assert.notDeepEqual(dispersed, dispersedPositions(data.ids.length, TRANSITION.seed + 1));
assert.notDeepEqual(dispersed, data.positions);
evaluatePositions(data.positions, dispersed, 0, output);
assert.deepEqual(output, dispersed);
evaluatePositions(data.positions, dispersed, 1, output);
assert.deepEqual(output, data.positions);
const forward = [];
for (let step = 0; step <= 100; step++) {
  const p = step / 100;
  evaluatePositions(data.positions, dispersed, p, output);
  forward.push(output.slice());
  const regional = new Float32Array(output.length);
  evaluateRegionalPositions(
    data.positions,
    dispersed,
    data.regions,
    ENTITY_REGIONS.map(() => ({ progress: p })),
    regional,
  );
  assert.deepEqual(
    regional,
    output,
    'regional endpoints and equal progress match legacy evaluator exactly',
  );
  for (let i = 0; i < output.length; i++) {
    assert.ok(Number.isFinite(output[i]));
    assert.ok(Math.abs(output[i]) <= TRANSITION.halfBounds[i % 3]);
  }
  for (const aspect of [0.3, 0.65, 1, 2.5]) {
    const distance = transitionCameraDistance(aspect);
    for (const angle of [0, ENTITY.viewAngle]) {
      for (let i = 0; i < output.length; i += 3) {
        const [x, y, z] = output.subarray(i, i + 3);
        const rx = x * Math.cos(angle) + z * Math.sin(angle);
        const rz = -x * Math.sin(angle) + z * Math.cos(angle);
        const halfHeight = (distance - rz) * Math.tan((ENTITY.fov * Math.PI) / 360);
        assert.ok(Math.abs(rx) / (halfHeight * aspect) < 1 / ENTITY.framingMargin);
        assert.ok(Math.abs(y) / halfHeight < 1 / ENTITY.framingMargin);
      }
    }
  }
}
for (let step = 100; step >= 0; step--) {
  evaluatePositions(data.positions, dispersed, step / 100, output);
  assert.deepEqual(output, forward[step]);
}
assert.deepEqual(data, original, 'settled positions, IDs, regions and colors stay immutable');
assert.deepEqual(dispersed, savedDispersed);

const controller = createEntityTransition();
let notices = 0;
const unsubscribe = controller.subscribe(() => notices++);
const run = (frames = 25, delta = 0.02) => {
  for (let i = 0; i < frames; i++) controller.advance(delta);
};
assert.equal(controller.getProgress('head'), 1);
assert.equal(controller.getSnapshot().advancing, false);
controller.dissolve('all');
const command = controller.getSnapshot();
controller.dissolve('all');
assert.equal(controller.getSnapshot(), command, 'repeated active command is a no-op');
controller.advance(999);
assert.equal(controller.getProgress('head'), 1, 'first enabled frame skips old time');
controller.advance(999);
assert.equal(controller.getProgress('head'), 1 - TRANSITION.maxDelta / TRANSITION.duration);
run();
assert.equal(notices, 1, 'frames must not notify React');
const reversal = controller.getProgress('head');
controller.form('all');
assert.equal(controller.getProgress('head'), reversal, 'reversal keeps exact current pose');
controller.advance(0.02);
assert.ok(controller.getProgress('head') > reversal);
controller.pause('all');
const paused = controller.getProgress('head');
run();
assert.equal(controller.getProgress('head'), paused);
controller.setPolicy(true, true);
assert.equal(controller.getProgress('head'), paused, 'paused pose survives reduced motion');
controller.setPolicy(false, true);
assert.equal(controller.getSnapshot().regions[0].playing, false);
controller.resume('all');
controller.advance(99);
assert.equal(controller.getProgress('head'), paused);
run(1000);
assert.equal(controller.getProgress('head'), 1);
assert.equal(controller.getSnapshot().regions[0].playing, false);
controller.scrub('head', 0.47);
assert.equal(controller.getProgress('head'), 0.47);
assert.equal(controller.getSnapshot().regions[0].playing, false);
controller.dissolve('all');
run(10);
controller.setPolicy(false, false);
const hidden = controller.getProgress('head');
run(100, 100);
assert.equal(controller.getProgress('head'), hidden);
assert.equal(controller.getSnapshot().regions[0].playing, true);
controller.setPolicy(false, true);
controller.advance(99);
assert.equal(controller.getProgress('head'), hidden);
controller.advance(99);
assert.ok(Math.abs(controller.getProgress('head') - hidden) <= 0.010000001);
controller.setPolicy(true, true);
assert.equal(
  controller.getProgress('head'),
  0,
  'in-flight preference change settles requested endpoint',
);
controller.setPolicy(false, true);
run();
assert.equal(controller.getProgress('head'), 0);
controller.setPolicy(true, true);
controller.form('all');
assert.equal(controller.getProgress('head'), 1);
controller.dissolve('all');
assert.equal(controller.getProgress('head'), 0);
controller.scrub('head', 0.6);
controller.resume('all');
assert.equal(
  controller.getProgress('head'),
  0.6,
  'manual inspection never autoplays under reduced motion',
);
controller.setPolicy(false, false);
controller.setPolicy(false, true);
run();
assert.equal(controller.getProgress('head'), 0.6, 'paused pose never resumes on tab return');
controller.dissolve('all');
run(1000);
assert.equal(controller.getProgress('head'), 0);
controller.form('all');
controller.reset();
assert.deepEqual(controller.getSnapshot(), {
  regions: ENTITY_REGIONS.map(() => ({ progress: 1, target: 1, playing: false })),
  reducedMotion: false,
  visible: true,
  advancing: false,
});
controller.scrub('head', -1);
assert.equal(controller.getProgress('head'), 0);
controller.scrub('head', 2);
assert.equal(controller.getProgress('head'), 1);
controller.scrub('head', NaN);
assert.equal(controller.getProgress('head'), 1);
unsubscribe();
const afterUnsubscribe = notices;
controller.dissolve('all');
assert.equal(notices, afterUnsubscribe);

// Mixed regional states use the same paths and never move an unaffected particle.
const regional = createEntityTransition();
const states = () => structuredClone(regional.getRegions());
const positions = () => {
  evaluateRegionalPositions(data.positions, dispersed, data.regions, regional.getRegions(), output);
  return output.slice();
};
regional.scrub('head', 0);
regional.scrub('arms', 0.8);
regional.scrub('torso', 0.37);
regional.scrub('spine', 0);
const mixed = positions();
regional.form('head');
regional.dissolve('arms');
let mixedNotices = 0;
regional.subscribe(() => mixedNotices++);
const activeSnapshot = regional.getSnapshot();
regional.form('head');
assert.equal(regional.getSnapshot(), activeSnapshot);
regional.advance(99);
assert.deepEqual(positions(), mixed, 'each newly playing region skips its first frame');
regional.advance(99);
assert.equal(regional.getProgress('head'), 0.01);
assert.equal(regional.getProgress('arms'), 0.79);
assert.equal(mixedNotices, 0);
const moved = positions();
for (let i = 0; i < data.regions.length; i++) {
  if (data.regions[i] >= 2)
    assert.deepEqual(moved.slice(i * 3, i * 3 + 3), mixed.slice(i * 3, i * 3 + 3));
}
const beforeReverse = positions();
regional.dissolve('head');
assert.deepEqual(positions(), beforeReverse, 'targeted reversal has no position jump');
regional.pause('head');
const pausedHead = regional.getProgress('head');
regional.advance(0.05);
assert.equal(regional.getProgress('head'), pausedHead);
assert.equal(regional.getProgress('arms'), 0.78);
regional.resume('head');
regional.advance(99);
assert.equal(
  regional.getProgress('head'),
  pausedHead,
  'individual resume skips even while another region plays',
);
assert.equal(regional.getProgress('arms'), 0.77);
regional.scrub('head', 0.52);
assert.equal(regional.getRegions()[0].playing, false);
assert.equal(regional.getRegions()[1].playing, true);
const beforeBroadcast = positions();
regional.form('all');
assert.deepEqual(positions(), beforeBroadcast, 'broadcast keeps all current poses');
assert.equal(
  regional.getRegions()[4].playing,
  false,
  'settled region cannot advance toward settled',
);
regional.pause('torso');
regional.pause('spine');
regional.setPolicy(false, false);
const hiddenStates = states();
for (let i = 0; i < 20; i++) regional.advance(999);
assert.deepEqual(states(), hiddenStates);
regional.setPolicy(false, true);
regional.advance(999);
assert.deepEqual(states(), hiddenStates);
regional.advance(999);
assert.ok(regional.getProgress('head') <= hiddenStates[0].progress + 0.010000001);
assert.equal(regional.getProgress('torso'), 0.37);
regional.dissolve('arms');
regional.setPolicy(true, true);
assert.deepEqual(
  regional.getRegions().map((entry) => entry.progress),
  [1, 0, 0.37, 0, 1],
);
assert.ok(regional.getRegions().every((entry) => !entry.playing));
regional.form('spine');
assert.deepEqual(
  regional.getRegions().map((entry) => entry.progress),
  [1, 0, 0.37, 1, 1],
);
regional.setPolicy(false, true);
assert.equal(regional.advance(1), false);
regional.resume('all');
assert.deepEqual(
  regional.getRegions().map((entry) => entry.playing),
  [false, false, true, false, false],
);
regional.advance(1);
const beforeInvalid = states();
for (const delta of [NaN, Infinity, 0, -1]) assert.equal(regional.advance(delta), false);
assert.deepEqual(states(), beforeInvalid);
for (let i = 0; i < 150; i++) regional.advance(0.05);
assert.equal(regional.getProgress('torso'), 1);
assert.equal(regional.getSnapshot().advancing, false, 'last active region stops exactly');
regional.dissolve('all');
regional.pause('all');
assert.ok(regional.getRegions().every((entry) => !entry.playing));
regional.resume('all');
for (let i = 0; i < 150; i++) regional.advance(0.05);
assert.deepEqual(positions(), dispersed);
regional.form('head');
regional.setPolicy(false, false);
regional.setPolicy(true, false);
assert.equal(regional.getProgress('head'), 1, 'reduced motion settles hidden active intent');
regional.reset();
assert.deepEqual(positions(), data.positions);
assert.deepEqual(data, original);
assert.deepEqual(dispersed, savedDispersed);
console.log(
  'PASS deterministic reversible paths/endpoints, immutable identities, union framing, commands, pause/scrub/reset, bounded time, preference/visibility and subscription cleanup',
);
