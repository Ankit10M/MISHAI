import { ENTITY, ENTITY_REGIONS, type EntityRegion, type RegionSelection } from './config.ts';

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

export type RegionState = Readonly<{ progress: number; target: 0 | 1; playing: boolean }>;

export function evaluateRegionalPositions(
  settled: Float32Array,
  dispersed: Float32Array,
  membership: Uint8Array,
  regions: readonly RegionState[],
  output: Float32Array,
) {
  for (let particle = 0; particle < membership.length; particle++) {
    const p = regions[membership[particle]].progress;
    const eased = p * p * (3 - 2 * p);
    for (let i = particle * 3; i < particle * 3 + 3; i++) {
      output[i] =
        p === 0
          ? dispersed[i]
          : p === 1
            ? settled[i]
            : dispersed[i] + (settled[i] - dispersed[i]) * eased;
    }
  }
}

export function createEntityTransition(reducedMotion = false, visible = true) {
  const regions = ENTITY_REGIONS.map(() => ({ progress: 1, target: 1 as 0 | 1, playing: false }));
  const skipFrame = ENTITY_REGIONS.map(() => true);
  const listeners = new Set<() => void>();
  const advancing = () => visible && !reducedMotion && regions.some((region) => region.playing);
  const read = () => ({
    regions: regions.map((region) => ({ ...region })),
    reducedMotion,
    visible,
    advancing: advancing(),
  });
  let snapshot = read();
  function publish() {
    snapshot = read();
    for (const listener of listeners) listener();
  }
  function command(
    selection: RegionSelection,
    update: (region: (typeof regions)[number], index: number) => void,
  ) {
    let changed = false;
    regions.forEach((region, index) => {
      if (selection !== 'all' && ENTITY_REGIONS[index].id !== selection) return;
      const { progress, target, playing } = region;
      update(region, index);
      if (!playing && region.playing) skipFrame[index] = true;
      changed ||=
        progress !== region.progress || target !== region.target || playing !== region.playing;
    });
    if (changed) publish();
  }
  function destination(selection: RegionSelection, next: 0 | 1) {
    command(selection, (region) => {
      if (region.playing && region.target === next) return;
      region.target = next;
      if (reducedMotion) region.progress = next;
      region.playing = region.progress !== next;
    });
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getRegions: (): readonly RegionState[] => regions,
    getProgress: (region: EntityRegion) =>
      regions[ENTITY_REGIONS.findIndex((entry) => entry.id === region)].progress,
    form: (selection: RegionSelection) => destination(selection, 1),
    dissolve: (selection: RegionSelection) => destination(selection, 0),
    pause(selection: RegionSelection) {
      command(selection, (region) => {
        region.playing = false;
      });
    },
    resume(selection: RegionSelection) {
      if (reducedMotion) return;
      command(selection, (region) => {
        region.playing = region.progress !== region.target;
      });
    },
    scrub(selection: EntityRegion, value: number) {
      if (!Number.isFinite(value)) return;
      command(selection, (region) => {
        region.progress = Math.max(0, Math.min(1, value));
        region.playing = false;
      });
    },
    reset() {
      command('all', (region) => {
        region.progress = region.target = 1;
        region.playing = false;
      });
    },
    setPolicy(reduced: boolean, isVisible: boolean) {
      if (reducedMotion === reduced && visible === isVisible) return;
      reducedMotion = reduced;
      visible = isVisible;
      regions.forEach((region, index) => {
        if (reducedMotion && region.playing) {
          region.progress = region.target;
          region.playing = false;
        }
        skipFrame[index] = true;
      });
      publish();
    },
    advance(delta: number) {
      if (!advancing()) return false;
      if (!Number.isFinite(delta) || delta <= 0) return false;
      const step = Math.min(delta, TRANSITION.maxDelta) / TRANSITION.duration;
      let changed = false;
      let completed = false;
      regions.forEach((region, index) => {
        if (!region.playing) return;
        if (skipFrame[index]) {
          skipFrame[index] = false;
          return;
        }
        region.progress =
          region.target === 1
            ? Math.min(1, region.progress + step)
            : Math.max(0, region.progress - step);
        changed = true;
        if (region.progress === region.target) {
          region.playing = false;
          completed = true;
        }
      });
      if (completed) publish();
      return changed;
    },
  };
}

export type EntityTransition = ReturnType<typeof createEntityTransition>;
