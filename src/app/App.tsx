import { WorldCanvas } from '../world/scene/WorldCanvas';

/**
 * Application composition root (UI layer).
 *
 * Phase 4.1 boundary: this component composes the top-level layers of the
 * experience. Today it mounts only the world's rendering surface. Future
 * phases add DOM UI (entry affordances, overlays) and wrap the canvas with
 * the experience-coordination layer — always *around* the render loop, never
 * inside it.
 *
 * See docs/architecture/application-boundaries.md.
 */
export function App() {
  return (
    <main className="relative h-full w-full">
      <WorldCanvas />
    </main>
  );
}
