import { ENTITY } from './config.ts';

// Provisional motion values; the reviewed anatomy and sampler remain unchanged.
export const TRANSITION = {
  seed: 4606,
  duration: 5,
  maxDelta: 0.05,
  halfBounds: [2, 2.25, 1.3],
} as const;

export function dispersedPositions(count: number, seed: number = TRANSITION.seed) {
  let state = seed >>> 0;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < positions.length; i++) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    positions[i] = ((state / 4294967296) * 2 - 1) * TRANSITION.halfBounds[i % 3];
  }
  return positions;
}

export function evaluatePositions(
  settled: Float32Array,
  dispersed: Float32Array,
  progress: number,
  output: Float32Array,
) {
  const p = Math.max(0, Math.min(1, progress));
  if (p === 0 || p === 1) {
    output.set(p === 0 ? dispersed : settled);
    return;
  }
  const eased = p * p * (3 - 2 * p);
  for (let i = 0; i < output.length; i++)
    output[i] = dispersed[i] + (settled[i] - dispersed[i]) * eased;
}

export function transitionCameraDistance(aspect: number) {
  // Straight interpolation stays within the union box; its X/Z radius covers both views.
  const halfHeight = Math.max(ENTITY.bounds.max[1], TRANSITION.halfBounds[1]);
  const radius = Math.hypot(
    Math.max(ENTITY.bounds.max[0], TRANSITION.halfBounds[0]),
    Math.max(ENTITY.bounds.max[2], TRANSITION.halfBounds[2]),
  );
  return (
    (ENTITY.framingMargin * Math.max(halfHeight, radius / aspect)) /
      Math.tan((ENTITY.fov * Math.PI) / 360) +
    radius
  );
}

export function createEntityTransition(reducedMotion = false, visible = true) {
  let progress = 1;
  let target: 0 | 1 = 1;
  let playing = false;
  let skipFrame = true;
  const listeners = new Set<() => void>();
  const advancing = () => playing && visible && !reducedMotion;
  const read = () => ({
    progress,
    target,
    playing,
    reducedMotion,
    visible,
    advancing: advancing(),
  });
  let snapshot = read();
  function publish() {
    snapshot = read();
    for (const listener of listeners) listener();
  }
  function destination(next: 0 | 1) {
    if (playing && target === next) return;
    const wasAdvancing = advancing();
    target = next;
    if (reducedMotion) progress = target;
    playing = progress !== target;
    if (!wasAdvancing && advancing()) skipFrame = true;
    publish();
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getProgress: () => progress,
    form: () => destination(1),
    dissolve: () => destination(0),
    togglePause() {
      if (reducedMotion || progress === target) return;
      playing = !playing;
      skipFrame = true;
      publish();
    },
    scrub(value: number) {
      if (!Number.isFinite(value)) return;
      progress = Math.max(0, Math.min(1, value));
      playing = false;
      skipFrame = true;
      publish();
    },
    reset() {
      progress = target = 1;
      playing = false;
      skipFrame = true;
      publish();
    },
    setPolicy(reduced: boolean, isVisible: boolean) {
      if (reducedMotion === reduced && visible === isVisible) return;
      const wasAdvancing = advancing();
      reducedMotion = reduced;
      visible = isVisible;
      if (reducedMotion && playing) {
        progress = target;
        playing = false;
      }
      if (!wasAdvancing && advancing()) skipFrame = true;
      publish();
    },
    advance(delta: number) {
      if (!advancing()) return progress;
      if (skipFrame) {
        skipFrame = false;
        return progress;
      }
      if (!Number.isFinite(delta) || delta <= 0) return progress;
      const step = Math.min(delta, TRANSITION.maxDelta) / TRANSITION.duration;
      progress = target === 1 ? Math.min(1, progress + step) : Math.max(0, progress - step);
      if (progress === target) {
        playing = false;
        publish();
      }
      return progress;
    },
  };
}

export type EntityTransition = ReturnType<typeof createEntityTransition>;
