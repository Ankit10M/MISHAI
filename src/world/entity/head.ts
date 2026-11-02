import { sampleEntity } from './sampleEntity.ts';
import { dispersedPositions, TRANSITION, type EntityTransition } from './transition.ts';

// Public composition only; preview source data and framing remain unchanged.
export const CREATOR_HEAD = {
  center: [0, 1.73, 0],
  halfBounds: [0.55, 0.55, 0.28],
  fit: 0.82,
  pointSize: 0.035,
} as const;

export function sampleHead() {
  const source = sampleEntity();
  const ids = source.regionIndices[0];
  const positions = new Float32Array(ids.length * 3);
  const colors = new Float32Array(positions.length);
  const cloud = dispersedPositions(source.ids.length);
  const dispersed = new Float32Array(positions.length);
  ids.forEach((id, index) => {
    for (let axis = 0; axis < 3; axis++) {
      positions[index * 3 + axis] = source.positions[id * 3 + axis];
      colors[index * 3 + axis] = source.colors[id * 3 + axis];
      dispersed[index * 3 + axis] =
        CREATOR_HEAD.center[axis] +
        (cloud[id * 3 + axis] / TRANSITION.halfBounds[axis]) * CREATOR_HEAD.halfBounds[axis];
    }
  });
  return { ids, positions, colors, dispersed };
}

export function syncCreatorHead(
  transition: EntityTransition,
  formed: boolean,
  { paused, reducedMotion, visible }: { paused: boolean; reducedMotion: boolean; visible: boolean },
) {
  // Pause must win before a preference change can settle active work.
  if (paused) transition.pause('head');
  transition.setPolicy(reducedMotion, visible);
  transition.setTarget('head', formed ? 1 : 0, paused);
}
