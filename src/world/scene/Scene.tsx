import { ParticleField } from '../particles/ParticleField';

// Scene stays a composition root; particle lifetime and frame work belong to the field.
export function Scene({ motionEnabled }: { motionEnabled: boolean }) {
  return <ParticleField motionEnabled={motionEnabled} />;
}
