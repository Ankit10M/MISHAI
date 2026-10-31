import { WorldCanvas } from '../world/scene/WorldCanvas';
import { PortfolioShell } from './PortfolioShell';
import { useExperience } from './useExperience';

/**
 * Application composition root (UI layer).
 *
 * Semantic content stays independent of the decorative world and its failures.
 *
 * See docs/architecture/application-boundaries.md.
 */
export function App() {
  const { snapshot, recordNavigation } = useExperience();
  return (
    <>
      <WorldCanvas />
      <PortfolioShell snapshot={snapshot} onNavigate={recordNavigation} />
    </>
  );
}
