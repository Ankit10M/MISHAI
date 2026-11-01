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
  const [controlRegion, setControlRegion] = useState<RegionSelection>('all');
  const [transition] = useState(() =>
    createEntityTransition(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      document.visibilityState === 'visible',
    ),
  );
  const snapshot = useSyncExternalStore(transition.subscribe, transition.getSnapshot);
  useEffect(() => observeMotionPolicy(transition.setPolicy), [transition]);
  const selectedIndex = ENTITY_REGIONS.findIndex((entry) => entry.id === controlRegion);
  const selected = snapshot.regions[selectedIndex];
  const affected = selected ? [selected] : snapshot.regions;
  const scope =
    controlRegion === 'all' ? 'All regions' : ENTITY_REGIONS[selectedIndex].label.split(' / ')[0];
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
            Show region
            <select
              id="show-region"
              value={region}
              onChange={(event) => setRegion(event.target.value as RegionSelection)}
            >
              <option value="all">All regions</option>
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
              setControlRegion('all');
              transition.reset();
            }}
          >
            Reset full entity
          </button>
        </div>
        <div className="entity-toolbar" role="group" aria-label="Formation controls">
          <label>
            Control region
            <select
              id="control-region"
              value={controlRegion}
              onChange={(event) => setControlRegion(event.target.value as RegionSelection)}
            >
              <option value="all">All regions</option>
              {ENTITY_REGIONS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-label={`Form: ${scope}`}
            onClick={() => transition.form(controlRegion)}
          >
            Form
          </button>
          <button
            type="button"
            aria-label={`Dissolve: ${scope}`}
            onClick={() => transition.dissolve(controlRegion)}
          >
            Dissolve
          </button>
          <button
            type="button"
            aria-label={`Pause: ${scope}`}
            onClick={() => transition.pause(controlRegion)}
            aria-disabled={!affected.some((entry) => entry.playing)}
          >
            Pause
          </button>
          <button
            type="button"
            aria-label={`Resume: ${scope}`}
            onClick={() => transition.resume(controlRegion)}
            aria-disabled={
              snapshot.reducedMotion ||
              !affected.some((entry) => !entry.playing && entry.progress !== entry.target)
            }
          >
            Resume
          </button>
          <label>
            Inspect progress
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              disabled={!selected}
              value={selected?.progress ?? ''}
              aria-valuetext={
                selected
                  ? `${selected.progress}: ${scope}, inspection value`
                  : 'Select one control region to inspect'
              }
              aria-describedby="progress-help"
              onChange={(event) => {
                if (controlRegion !== 'all')
                  transition.scrub(controlRegion, Number(event.target.value));
              }}
            />
          </label>
        </div>
        <p id="progress-help">
          Commands affect: {scope}.{' '}
          {selected
            ? '0: dispersed. 1: settled. Adjust to pause only this region.'
            : 'Select one Control region to inspect progress; All regions has no combined value.'}{' '}
          The slider updates on commands, policy changes and completion, not during playback.
        </p>
        <div role="status" aria-live="polite" aria-label="Region status">
          <ul className="entity-statuses">
            {snapshot.regions.map((entry, index) => (
              <li key={ENTITY_REGIONS[index].id}>
                {ENTITY_REGIONS[index].label.split(' / ')[0]}:{' '}
                {entry.playing
                  ? !snapshot.visible
                    ? 'Suspended while tab is hidden'
                    : entry.target === 1
                      ? 'Forming'
                      : 'Dissolving'
                  : entry.progress === 1
                    ? 'Settled'
                    : entry.progress === 0
                      ? 'Dispersed'
                      : 'Paused'}
                {!entry.playing && entry.progress !== entry.target
                  ? ` (resume toward ${entry.target === 1 ? 'settled' : 'dispersed'})`
                  : ''}
              </li>
            ))}
          </ul>
          {snapshot.reducedMotion && (
            <p>Reduced motion: Form and Dissolve select targeted endpoints immediately.</p>
          )}
        </div>
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
