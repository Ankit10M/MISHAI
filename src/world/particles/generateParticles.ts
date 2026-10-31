import { PARTICLE_FIELD as field } from './config.ts';

export function generateParticles(seed = field.seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const positions = new Float32Array(field.count * 3);
  const colors = new Float32Array(field.count * 3);
  const phases = new Float32Array(field.count);
  for (let index = 0; index < field.count; index++) {
    const choice = random();
    const pocket =
      choice < field.pockets[0].weight
        ? field.pockets[0]
        : choice < field.pockets[0].weight + field.pockets[1].weight
          ? field.pockets[1]
          : field.pockets[2];
    const z = field.depth[0] + random() * (field.depth[1] - field.depth[0]);
    const halfHeight = (field.cameraDistance - z) * Math.tan((field.cameraFov * Math.PI) / 360);
    // Two samples concentrate each pocket unevenly and leave the center empty.
    positions[index * 3] = (pocket.x + (random() + random() - 1) * pocket.width) * halfHeight;
    positions[index * 3 + 1] = (pocket.y + (random() + random() - 1) * pocket.height) * halfHeight;
    positions[index * 3 + 2] = z;
    const color = random() < field.whiteFraction ? field.white : field.cyan;
    const brightness = field.brightness[0] + random() * (field.brightness[1] - field.brightness[0]);
    for (let axis = 0; axis < 3; axis++) colors[index * 3 + axis] = color[axis] * brightness;
    phases[index] = random() * Math.PI * 2;
  }
  return { positions, colors, phases };
}

export function moveParticles(
  target: Float32Array,
  base: Float32Array,
  phases: Float32Array,
  time: number,
) {
  for (let index = 0; index < phases.length; index++) {
    for (let axis = 0; axis < 3; axis++) {
      target[index * 3 + axis] =
        base[index * 3 + axis] +
        Math.sin(time * field.speed[axis] + phases[index] + axis) * field.drift[axis];
    }
  }
}
