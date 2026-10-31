import { ENTITY, ENTITY_REGIONS } from './config.ts';
import { inMissingPatch, sampleAnatomy } from './anatomy.ts';

export function sampleEntity(seed: number = ENTITY.seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const positions = new Float32Array(ENTITY.count * 3);
  const colors = new Float32Array(ENTITY.count * 3);
  const ids = new Uint16Array(ENTITY.count);
  const regions = new Uint8Array(ENTITY.count);
  const regionIndices: number[][] = ENTITY_REGIONS.map(() => []);
  let count = 0;
  for (let attempt = 0; attempt < ENTITY.maxAttempts && count < ENTITY.count; attempt++) {
    const x = ENTITY.bounds.min[0] + random() * (ENTITY.bounds.max[0] - ENTITY.bounds.min[0]);
    const y = ENTITY.bounds.min[1] + random() * (ENTITY.bounds.max[1] - ENTITY.bounds.min[1]);
    const z = ENTITY.bounds.min[2] + random() * (ENTITY.bounds.max[2] - ENTITY.bounds.min[2]);
    const { distance, region } = sampleAnatomy(x, y, z);
    if (distance > 0 || (distance < -ENTITY.shellDepth && random() > ENTITY.interiorFraction))
      continue;
    if (inMissingPatch(x, y, z)) continue;
    const frequency = ENTITY.densityFrequency;
    const density =
      ENTITY.densityFloor +
      ENTITY.densityVariation *
        (0.5 +
          0.5 *
            Math.sin(x * frequency[0] + y * frequency[1]) *
            Math.cos(y * frequency[2] - z * frequency[3]));
    if (random() > density) continue;
    const color = random() < ENTITY.whiteFraction ? ENTITY.white : ENTITY.cyan;
    const brightness =
      ENTITY.brightness[0] + random() * (ENTITY.brightness[1] - ENTITY.brightness[0]);
    positions.set([x, y, z], count * 3);
    for (let axis = 0; axis < 3; axis++) colors[count * 3 + axis] = color[axis] * brightness;
    const regionIndex = ENTITY_REGIONS.findIndex((entry) => entry.id === region);
    ids[count] = count;
    regions[count] = regionIndex;
    regionIndices[regionIndex].push(count);
    count++;
  }
  if (count !== ENTITY.count)
    throw new Error('Entity sampling exhausted its bounded attempt budget');
  return {
    positions,
    colors,
    ids,
    regions,
    regionIndices: regionIndices.map((indices) => new Uint16Array(indices)),
  };
}
