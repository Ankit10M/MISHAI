import { Canvas } from '@react-three/fiber';
import { useCallback, useRef } from 'react';
import { WebGLRenderer } from 'three';

import { DPR_RANGE, WORLD_BACKGROUND } from '../../config/rendering';
import { Scene } from './Scene';
import { WorldBoundary } from './WorldBoundary';

/**
 * WorldCanvas — the single boundary between the React/DOM world and the WebGL
 * world.
 *
 * This is the *only* place React is permitted to own a Three.js render
 * surface. Everything below <Canvas> is R3F scene composition; everything
 * above it is DOM/UI. Per-frame logic belongs inside the scene (via R3F
 * hooks such as useFrame), never in React state that lives above this line.
 *
 * See docs/architecture/rendering-architecture.md.
 */
function RenderSurface() {
  const renderer = useRef<WebGLRenderer | null>(null);
  const attachCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    // Construct in React's commit so the boundary catches failures before R3F's async setup.
    if (canvas && !renderer.current) {
      renderer.current = new WebGLRenderer({
        canvas,
        powerPreference: 'high-performance',
        antialias: true,
        alpha: false,
      });
    }
  }, []);

  return (
    <Canvas
      ref={attachCanvas}
      dpr={DPR_RANGE}
      gl={() => {
        if (!renderer.current) throw new Error('The world renderer could not initialize.');
        return renderer.current;
      }}
      frameloop="demand"
      style={{ pointerEvents: 'none' }}
      camera={{ position: [0, 0, 6], fov: 50 }}
      onCreated={({ gl }) => {
        gl.setClearColor(WORLD_BACKGROUND);
      }}
    >
      <Scene />
    </Canvas>
  );
}

export function WorldCanvas() {
  return (
    <WorldBoundary>
      <div className="world-layer" aria-hidden="true" inert>
        <RenderSurface />
      </div>
    </WorldBoundary>
  );
}
