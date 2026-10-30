import { WorldCanvas } from '../world/scene/WorldCanvas';
import { PortfolioShell } from './PortfolioShell';

/**
 * Application composition root (UI layer).
 *
 * Semantic content stays independent of the decorative world and its failures.
 *
 * See docs/architecture/application-boundaries.md.
 */
export function App() {
  return (
    <>
      <WorldCanvas />
      <PortfolioShell />
    </>
  );
}
