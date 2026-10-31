import { WorldCanvas } from '../world/scene/WorldCanvas';
import { PortfolioShell } from './PortfolioShell';
import { useExperience } from './useExperience';
import { useBackgroundMotion } from './useBackgroundMotion';
import { BackgroundMotionControl } from './BackgroundMotionControl';

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
  return (
    <>
      <WorldCanvas motionEnabled={motion.motionEnabled} />
      <PortfolioShell
        snapshot={snapshot}
        onNavigate={recordNavigation}
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
