import { useLayoutEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry } from 'three';
import { ENTITY, ENTITY_REGIONS, type EntityView, type RegionSelection } from './config';
import { sampleEntity } from './sampleEntity';
import { entityCameraDistance } from './anatomy';

export function EntityPoints({ view, region }: { view: EntityView; region: RegionSelection }) {
  const data = useMemo(() => sampleEntity(), []);
  const indices = useMemo(() => data.ids.slice(), [data]);
  const geometry = useRef<BufferGeometry>(null);
  const index = useRef<BufferAttribute>(null);
  const { camera, size, invalidate } = useThree();

  useLayoutEffect(() => {
    if ('fov' in camera) camera.fov = ENTITY.fov;
    camera.position.set(0, 0, entityCameraDistance(size.width / size.height));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  useLayoutEffect(() => {
    const selected =
      region === 'all'
        ? data.ids
        : data.regionIndices[ENTITY_REGIONS.findIndex((entry) => entry.id === region)];
    indices.set(selected);
    geometry.current?.setDrawRange(0, selected.length);
    if (index.current) index.current.needsUpdate = true;
    invalidate();
  }, [data, indices, region, invalidate]);

  return (
    <points
      name="entity-particles"
      rotation={[0, view === 'front' ? 0 : ENTITY.viewAngle, 0]}
      frustumCulled={false}
    >
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        <bufferAttribute ref={index} attach="index" args={[indices, 1]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={ENTITY.size}
        sizeAttenuation
        opacity={ENTITY.opacity}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
