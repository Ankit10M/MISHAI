import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, Group, PerspectiveCamera, Vector4 } from 'three';
import { ENTITY } from './config';
import { CREATOR_HEAD, sampleHead } from './head';
import { evaluatePositions, type EntityTransition } from './transition';

export type CreatorHeadProps = {
  head: EntityTransition;
  headSnapshot: ReturnType<EntityTransition['getSnapshot']>;
  creatorArea: RefObject<HTMLDivElement | null>;
};

export function CreatorHead({ head, headSnapshot, creatorArea }: CreatorHeadProps) {
  const data = useMemo(() => sampleHead(), []);
  const positions = useMemo(() => data.dispersed.slice(), [data]);
  const position = useRef<BufferAttribute>(null);
  const placement = useRef<Group>(null);
  const clip = useMemo(() => new Vector4(), []);
  const { camera, size, gl, invalidate } = useThree();

  useLayoutEffect(() => {
    const area = creatorArea.current;
    const group = placement.current;
    if (!area || !group || !(camera instanceof PerspectiveCamera)) return;
    const surface = gl.domElement.closest<HTMLElement>('.world-layer');
    let frame: number | null = null;
    let disposed = false;
    const measure = () => {
      frame = null;
      if (disposed) return;
      const rect = area.getBoundingClientRect();
      const pixelsToWorld =
        (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / size.height;
      const scale =
        CREATOR_HEAD.fit *
        pixelsToWorld *
        Math.min(
          rect.width / (2 * CREATOR_HEAD.halfBounds[0]),
          rect.height / (2 * CREATOR_HEAD.halfBounds[1]),
        );
      group.scale.setScalar(scale);
      group.position.set(
        (rect.left + rect.width / 2 - size.width / 2) * pixelsToWorld,
        (size.height / 2 - rect.top - rect.height / 2) * pixelsToWorld,
        0,
      );
      const left = Math.max(0, rect.left),
        right = Math.min(size.width, rect.right);
      const top = Math.max(0, rect.top),
        bottom = Math.min(size.height, rect.bottom);
      group.visible = right > left && bottom > top;
      clip.set(left, size.height - bottom, Math.max(0, right - left), Math.max(0, bottom - top));
      // The text scrim stays intact everywhere except the reserved visual area.
      if (group.visible)
        surface?.style.setProperty(
          '--creator-window',
          `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${left}px ${top}px, ${right}px ${top}px, ${right}px ${bottom}px, ${left}px ${bottom}px, ${left}px ${top}px, 0 0)`,
        );
      else surface?.style.removeProperty('--creator-window');
      invalidate();
    };
    const schedule = () => {
      if (!disposed && frame === null) frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(area);
    resize.observe(document.body);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pageshow', schedule);
    measure();
    return () => {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
      surface?.style.removeProperty('--creator-window');
    };
  }, [camera, creatorArea, size.width, size.height, gl, clip, invalidate]);

  useLayoutEffect(() => {
    evaluatePositions(data.positions, data.dispersed, head.getProgress('head'), positions);
    if (position.current) position.current.needsUpdate = true;
    invalidate();
  }, [data, head, headSnapshot, positions, invalidate]);

  useFrame((_, delta) => {
    if (!head.advance(delta)) return;
    evaluatePositions(data.positions, data.dispersed, head.getProgress('head'), positions);
    if (position.current) position.current.needsUpdate = true;
  });

  return (
    <group ref={placement} visible={false}>
      <points
        name="creator-head"
        position={[-CREATOR_HEAD.center[0], -CREATOR_HEAD.center[1], -CREATOR_HEAD.center[2]]}
        renderOrder={1}
        frustumCulled={false}
        onBeforeRender={(renderer) => {
          renderer.setScissor(clip);
          renderer.setScissorTest(true);
        }}
        onAfterRender={(renderer) => renderer.setScissorTest(false)}
      >
        <bufferGeometry>
          <bufferAttribute ref={position} attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={CREATOR_HEAD.pointSize}
          sizeAttenuation
          opacity={ENTITY.opacity}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
