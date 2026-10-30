import { Canvas } from '@react-three/fiber';

import { DPR_RANGE, WORLD_BACKGROUND } from '../../config/rendering';
import { Scene } from './Scene';

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
export function WorldCanvas() {
  return (
    <Canvas
      dpr={DPR_RANGE}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 0, 6], fov: 50 }}
      onCreated={({ gl }) => {
        gl.setClearColor(WORLD_BACKGROUND);
      }}
    >
      <Scene />
    </Canvas>
  );
}
