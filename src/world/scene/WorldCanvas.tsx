import { RenderSurface } from './RenderSurface';
import { Scene } from './Scene';
import { WorldBoundary } from './WorldBoundary';
import type { CreatorHeadProps } from '../entity/CreatorHead';

export function WorldCanvas({
  motionEnabled,
  ...headProps
}: { motionEnabled: boolean } & CreatorHeadProps) {
  return (
    <WorldBoundary>
      <div className="world-layer" aria-hidden="true" inert>
        <RenderSurface motionEnabled={motionEnabled || headProps.headSnapshot.advancing}>
          <Scene motionEnabled={motionEnabled} {...headProps} />
        </RenderSurface>
      </div>
    </WorldBoundary>
  );
}
