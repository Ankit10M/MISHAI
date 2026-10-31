import assert from 'node:assert/strict';
import { sampleEntity } from '../src/world/entity/sampleEntity.ts';
import { ENTITY } from '../src/world/entity/config.ts';
import {
  TRANSITION,
  dispersedPositions,
  evaluatePositions,
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
assert.equal(controller.getProgress(), 1);
assert.equal(controller.getSnapshot().advancing, false);
controller.dissolve();
const command = controller.getSnapshot();
controller.dissolve();
assert.equal(controller.getSnapshot(), command, 'repeated active command is a no-op');
controller.advance(999);
assert.equal(controller.getProgress(), 1, 'first enabled frame skips old time');
controller.advance(999);
assert.equal(controller.getProgress(), 1 - TRANSITION.maxDelta / TRANSITION.duration);
run();
assert.equal(notices, 1, 'frames must not notify React');
const reversal = controller.getProgress();
controller.form();
assert.equal(controller.getProgress(), reversal, 'reversal keeps exact current pose');
controller.advance(0.02);
assert.ok(controller.getProgress() > reversal);
controller.togglePause();
const paused = controller.getProgress();
run();
assert.equal(controller.getProgress(), paused);
controller.setPolicy(true, true);
assert.equal(controller.getProgress(), paused, 'paused pose survives reduced motion');
controller.setPolicy(false, true);
assert.equal(controller.getSnapshot().playing, false);
controller.togglePause();
controller.advance(99);
assert.equal(controller.getProgress(), paused);
run(1000);
assert.equal(controller.getProgress(), 1);
assert.equal(controller.getSnapshot().playing, false);
controller.scrub(0.47);
assert.equal(controller.getProgress(), 0.47);
assert.equal(controller.getSnapshot().playing, false);
controller.dissolve();
run(10);
controller.setPolicy(false, false);
const hidden = controller.getProgress();
run(100, 100);
assert.equal(controller.getProgress(), hidden);
assert.equal(controller.getSnapshot().playing, true);
controller.setPolicy(false, true);
controller.advance(99);
assert.equal(controller.getProgress(), hidden);
controller.advance(99);
assert.ok(Math.abs(controller.getProgress() - hidden) <= 0.010000001);
controller.setPolicy(true, true);
assert.equal(controller.getProgress(), 0, 'in-flight preference change settles requested endpoint');
controller.setPolicy(false, true);
run();
assert.equal(controller.getProgress(), 0);
controller.setPolicy(true, true);
controller.form();
assert.equal(controller.getProgress(), 1);
controller.dissolve();
assert.equal(controller.getProgress(), 0);
controller.scrub(0.6);
controller.togglePause();
assert.equal(
  controller.getProgress(),
  0.6,
  'manual inspection never autoplays under reduced motion',
);
controller.setPolicy(false, false);
controller.setPolicy(false, true);
run();
assert.equal(controller.getProgress(), 0.6, 'paused pose never resumes on tab return');
controller.dissolve();
run(1000);
assert.equal(controller.getProgress(), 0);
controller.form();
controller.reset();
assert.deepEqual(controller.getSnapshot(), {
  progress: 1,
  target: 1,
  playing: false,
  reducedMotion: false,
  visible: true,
  advancing: false,
});
controller.scrub(-1);
assert.equal(controller.getProgress(), 0);
controller.scrub(2);
assert.equal(controller.getProgress(), 1);
controller.scrub(NaN);
assert.equal(controller.getProgress(), 1);
unsubscribe();
const afterUnsubscribe = notices;
controller.dissolve();
assert.equal(notices, afterUnsubscribe);
console.log(
  'PASS deterministic reversible paths/endpoints, immutable identities, union framing, commands, pause/scrub/reset, bounded time, preference/visibility and subscription cleanup',
);
