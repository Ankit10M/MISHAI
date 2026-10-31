import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, DynamicDrawUsage } from 'three';
import { PARTICLE_FIELD as field } from './config';
import { generateParticles, moveParticles } from './generateParticles';

export function ParticleField({ motionEnabled }: { motionEnabled: boolean }) {
  const data = useMemo(() => generateParticles(), []);
  const positions = useMemo(() => {
    const initial = data.positions.slice();
    moveParticles(initial, data.positions, data.phases, 0);
    return initial;
  }, [data]);
  const position = useRef<BufferAttribute>(null);
  const time = useRef(0);
  const skipFrame = useRef(true);
  const aspect = useThree((state) => state.viewport.aspect);

  useEffect(() => {
    skipFrame.current = true;
  }, [motionEnabled]);

  useFrame((_, delta) => {
    if (!motionEnabled) return;
    if (skipFrame.current) {
      skipFrame.current = false;
      return;
    }
    time.current += Math.min(delta, field.maxDelta);
    moveParticles(positions, data.positions, data.phases, time.current);
    if (position.current) position.current.needsUpdate = true;
  });

  return (
    <points name="ambient-particles" scale={[aspect, 1, 1]} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          ref={position}
          attach="attributes-position"
          args={[positions, 3]}
          usage={DynamicDrawUsage}
        />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={field.size}
        sizeAttenuation
        transparent
        opacity={field.opacity}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
