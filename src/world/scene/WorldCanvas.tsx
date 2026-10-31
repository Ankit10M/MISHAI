import { RenderSurface } from './RenderSurface';
import { Scene } from './Scene';
import { WorldBoundary } from './WorldBoundary';

export function WorldCanvas({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <WorldBoundary>
      <div className="world-layer" aria-hidden="true" inert>
        <RenderSurface motionEnabled={motionEnabled}>
          <Scene motionEnabled={motionEnabled} />
        </RenderSurface>
      </div>
    </WorldBoundary>
  );
}
