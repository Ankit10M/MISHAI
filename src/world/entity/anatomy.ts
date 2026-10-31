import { ANATOMY, ENTITY, MISSING_PATCHES, type EntityRegion } from './config.ts';

function ellipsoidDistance(x: number, y: number, z: number, radii: readonly number[]) {
  const normalized = Math.hypot(x / radii[0], y / radii[1], z / radii[2]);
  const gradient = Math.hypot(x / radii[0] ** 2, y / radii[1] ** 2, z / radii[2] ** 2);
  return gradient === 0 ? -Math.min(...radii) : (normalized * (normalized - 1)) / gradient;
}

const parts = ANATOMY.map((part) => ({
  ...part,
  sin: Math.sin(part.angle ?? 0),
  cos: Math.cos(part.angle ?? 0),
}));

// Replace this spatial source when an approved mesh exists; the renderer consumes only sampled arrays.
export function sampleAnatomy(x: number, y: number, z: number) {
  let distance = Infinity;
  let nearest = Infinity;
  let region: EntityRegion = 'torso';
  for (const part of parts) {
    const dx = x - part.center[0];
    const dy = y - part.center[1];
    const d = ellipsoidDistance(
      dx * part.cos + dy * part.sin,
      -dx * part.sin + dy * part.cos,
      z - part.center[2],
      part.radii,
    );
    if (d < nearest) {
      nearest = d;
      region = part.region;
    }
    const overlap = Math.max(ENTITY.blend - Math.abs(distance - d), 0) / ENTITY.blend;
    distance = Math.min(distance, d) - (overlap * overlap * ENTITY.blend) / 4;
  }
  // Posterior central trunk takes precedence; other overlaps use nearest part, then config order.
  const spine = ENTITY.spine;
  if (
    region === 'torso' &&
    Math.abs(x) < spine.halfWidth &&
    y > spine.minY &&
    y < spine.maxY &&
    z < spine.maxZ
  )
    region = 'spine';
  return { distance, region };
}

export function inMissingPatch(x: number, y: number, z: number) {
  return MISSING_PATCHES.some(
    ({ center, radii }) =>
      ((x - center[0]) / radii[0]) ** 2 +
        ((y - center[1]) / radii[1]) ** 2 +
        ((z - center[2]) / radii[2]) ** 2 <
      1,
  );
}

export function entityCameraDistance(aspect: number) {
  const halfHeight = ENTITY.bounds.max[1];
  const halfWidth = Math.hypot(ENTITY.bounds.max[0], ENTITY.bounds.max[2]);
  return (
    (ENTITY.framingMargin * Math.max(halfHeight, halfWidth / aspect)) /
      Math.tan((ENTITY.fov * Math.PI) / 360) +
    halfWidth
  );
}
