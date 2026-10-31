import { useState } from 'react';
import { RenderSurface } from '../world/scene/RenderSurface';
import { WorldBoundary } from '../world/scene/WorldBoundary';
import { EntityPoints } from '../world/entity/EntityPoints';
import { ENTITY_REGIONS, type EntityView, type RegionSelection } from '../world/entity/config';
import '../styles/global.css';
import './entity-preview.css';

export function EntityPreview() {
  const [view, setView] = useState<EntityView>('front');
  const [region, setRegion] = useState<RegionSelection>('all');
  return (
    <main className="entity-preview">
      <header className="entity-controls">
        <p className="eyebrow">Development review only</p>
        <h1>Fragmented humanoid</h1>
        <p>
          Original procedural proxy. Anatomy and fragmentation are provisional; no formation
          animation.
        </p>
        <div className="entity-toolbar">
          <div role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'front'} onClick={() => setView('front')}>
              Front
            </button>
            <button
              type="button"
              aria-pressed={view === 'three-quarter'}
              onClick={() => setView('three-quarter')}
            >
              Three-quarter
            </button>
          </div>
          <label>
            Region
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value as RegionSelection)}
            >
              <option value="all">Full settled entity</option>
              {ENTITY_REGIONS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setView('front');
              setRegion('all');
            }}
          >
            Reset full entity
          </button>
        </div>
      </header>
      <section
        className="entity-stage"
        aria-label="Static entity preview"
        aria-describedby="entity-description"
      >
        <WorldBoundary message="The 3D entity preview is unavailable. View and region controls remain available; WebGL is required to inspect the shape.">
          <div className="entity-surface" aria-hidden="true" inert>
            <RenderSurface motionEnabled={false}>
              <EntityPoints view={view} region={region} />
            </RenderSurface>
          </div>
        </WorldBoundary>
      </section>
      <p id="entity-description" className="entity-description">
        A static, incomplete particle figure with distinct head, arms, torso and lower body. Region
        isolation is inspection metadata, not chapter behavior.
      </p>
    </main>
  );
}
