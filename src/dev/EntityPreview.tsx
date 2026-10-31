import { useEffect, useState, useSyncExternalStore } from 'react';
import { observeMotionPolicy } from '../app/observeMotionPolicy';
import { createEntityTransition } from '../world/entity/transition';
import { RenderSurface } from '../world/scene/RenderSurface';
import { WorldBoundary } from '../world/scene/WorldBoundary';
import { EntityPoints } from '../world/entity/EntityPoints';
import { ENTITY_REGIONS, type EntityView, type RegionSelection } from '../world/entity/config';
import '../styles/global.css';
import './entity-preview.css';

export function EntityPreview() {
  const [view, setView] = useState<EntityView>('front');
  const [region, setRegion] = useState<RegionSelection>('all');
  const [transition] = useState(() =>
    createEntityTransition(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      document.visibilityState === 'visible',
    ),
  );
  const snapshot = useSyncExternalStore(transition.subscribe, transition.getSnapshot);
  useEffect(() => observeMotionPolicy(transition.setPolicy), [transition]);
  const status = snapshot.playing
    ? !snapshot.visible
      ? 'Suspended while tab is hidden'
      : snapshot.target === 1
        ? 'Forming'
        : 'Dissolving'
    : snapshot.progress === 1
      ? 'Settled'
      : snapshot.progress === 0
        ? 'Dispersed'
        : 'Paused';
  return (
    <main className="entity-preview">
      <header className="entity-controls">
        <p className="eyebrow">Development review only</p>
        <h1>Fragmented humanoid</h1>
        <p>Original procedural proxy. Anatomy and reversible motion are provisional.</p>
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
              transition.reset();
            }}
          >
            Reset full entity
          </button>
        </div>
        <div className="entity-toolbar" role="group" aria-label="Formation controls">
          <button type="button" onClick={transition.form}>
            Form
          </button>
          <button type="button" onClick={transition.dissolve}>
            Dissolve
          </button>
          <button
            type="button"
            onClick={transition.togglePause}
            disabled={
              snapshot.reducedMotion || (snapshot.progress === snapshot.target && !snapshot.playing)
            }
          >
            {snapshot.playing ? 'Pause' : 'Resume'}
          </button>
          <label>
            Inspect progress
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={snapshot.progress}
              aria-describedby="progress-help"
              onChange={(event) => transition.scrub(Number(event.target.value))}
            />
          </label>
        </div>
        <p id="progress-help">
          0: dispersed. 1: settled. Adjust to pause; the slider updates on commands and completion,
          not during playback.
        </p>
        <p role="status" aria-live="polite">
          {status}
          {snapshot.reducedMotion
            ? ' — Reduced motion: Form and Dissolve select endpoints immediately.'
            : !snapshot.playing && snapshot.progress !== snapshot.target
              ? ` — Resume toward ${snapshot.target === 1 ? 'settled' : 'dispersed'}.`
              : ''}
        </p>
      </header>
      <section
        className="entity-stage"
        aria-label="Entity transition preview"
        aria-describedby="entity-description"
      >
        <WorldBoundary message="The 3D entity preview is unavailable. View and region controls remain available; WebGL is required to inspect the shape.">
          <div className="entity-surface" aria-hidden="true" inert>
            <RenderSurface motionEnabled={snapshot.advancing}>
              <EntityPoints
                view={view}
                region={region}
                transition={transition}
                snapshot={snapshot}
              />
            </RenderSurface>
          </div>
        </WorldBoundary>
      </section>
      <p id="entity-description" className="entity-description">
        An incomplete particle figure with distinct head, arms, torso and lower body. Region
        isolation is inspection metadata, not chapter behavior.
      </p>
    </main>
  );
}
