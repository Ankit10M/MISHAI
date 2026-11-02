import { WorldCanvas } from '../world/scene/WorldCanvas';
import { PortfolioShell } from './PortfolioShell';
import { useExperience } from './useExperience';
import { useBackgroundMotion } from './useBackgroundMotion';
import { BackgroundMotionControl } from './BackgroundMotionControl';
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createEntityTransition } from '../world/entity/transition';
import { syncCreatorHead } from '../world/entity/head';

/**
 * Application composition root (UI layer).
 *
 * Semantic content stays independent of the decorative world and its failures.
 *
 * See docs/architecture/application-boundaries.md.
 */
export function App() {
  const { snapshot, recordNavigation } = useExperience();
  const motion = useBackgroundMotion();
  const creatorArea = useRef<HTMLDivElement>(null);
  const [head] = useState(() => createEntityTransition(false, true, 0));
  const headSnapshot = useSyncExternalStore(head.subscribe, head.getSnapshot);
  const { paused, reducedMotion, visible } = motion;
  useLayoutEffect(() => {
    syncCreatorHead(head, snapshot.activeSection === 'creator', { paused, reducedMotion, visible });
  }, [head, snapshot.activeSection, paused, reducedMotion, visible]);
  return (
    <>
      <WorldCanvas
        motionEnabled={motion.motionEnabled}
        head={head}
        headSnapshot={headSnapshot}
        creatorArea={creatorArea}
      />
      <PortfolioShell
        snapshot={snapshot}
        onNavigate={recordNavigation}
        creatorArea={creatorArea}
        backgroundControl={
          <BackgroundMotionControl
            paused={motion.paused}
            reducedMotion={motion.reducedMotion}
            onToggle={motion.togglePaused}
          />
        }
      />
    </>
  );
}
