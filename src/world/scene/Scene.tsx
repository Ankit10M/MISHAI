import { ParticleField } from '../particles/ParticleField';

import { CreatorHead, type CreatorHeadProps } from '../entity/CreatorHead';

// Scene stays a composition root; each particle component owns its resources and frame work.
export function Scene({
  motionEnabled,
  ...headProps
}: { motionEnabled: boolean } & CreatorHeadProps) {
  return (
    <>
      <ParticleField motionEnabled={motionEnabled} />
      <CreatorHead {...headProps} />
    </>
  );
}
