// Provisional composition, not a device capability or final art-direction preset.
export const PARTICLE_FIELD = {
  seed: 4404,
  count: 280,
  cameraDistance: 6,
  cameraFov: 50,
  depth: [-5, 0] as const,
  pockets: [
    { x: -0.78, y: 0.25, width: 0.2, height: 0.65, weight: 0.55 },
    { x: 0.78, y: -0.32, width: 0.18, height: 0.56, weight: 0.35 },
    { x: 0.52, y: 0.72, width: 0.22, height: 0.2, weight: 0.1 },
  ],
  cyan: [0.26, 0.72, 0.82] as const,
  white: [0.85, 0.9, 1] as const,
  whiteFraction: 0.25,
  brightness: [0.35, 0.85] as const,
  size: 0.045,
  opacity: 0.48,
  drift: [0.035, 0.045, 0.025] as const,
  speed: [0.19, 0.13, 0.11] as const,
  maxDelta: 0.05,
};
