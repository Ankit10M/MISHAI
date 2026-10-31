export const ENTITY_REGIONS = [
  { id: 'head', label: 'Head / creator and identity' },
  { id: 'arms', label: 'Arms and hands / projects and creation' },
  { id: 'torso', label: 'Torso / skills and technology' },
  { id: 'spine', label: 'Spine / optional journey' },
  { id: 'lower', label: 'Lower body / experience and foundation' },
] as const;
export type EntityRegion = (typeof ENTITY_REGIONS)[number]['id'];
export type RegionSelection = EntityRegion | 'all';
export type EntityView = 'front' | 'three-quarter';

type Ellipsoid = {
  center: readonly [number, number, number];
  radii: readonly [number, number, number];
  angle?: number;
};
export type AnatomicalPart = Ellipsoid & { region: EntityRegion };

const pairedParts = [-1, 1].flatMap<AnatomicalPart>((side) => [
  { center: [side * 0.51, 1.12, 0], radii: [0.25, 0.24, 0.24], region: 'arms' },
  { center: [side * 0.69, 0.76, 0], radii: [0.16, 0.44, 0.17], angle: side * 0.32, region: 'arms' },
  {
    center: [side * 0.91, 0.16, 0.015],
    radii: [0.12, 0.38, 0.13],
    angle: side * 0.26,
    region: 'arms',
  },
  {
    center: [side * 1.03, -0.25, 0.035],
    radii: [0.115, 0.19, 0.08],
    angle: side * 0.12,
    region: 'arms',
  },
  {
    center: [side * 0.28, -0.73, 0],
    radii: [0.215, 0.65, 0.22],
    angle: side * 0.06,
    region: 'lower',
  },
  {
    center: [side * 0.34, -1.5, 0.015],
    radii: [0.14, 0.51, 0.16],
    angle: side * 0.035,
    region: 'lower',
  },
  { center: [side * 0.36, -2.02, 0.12], radii: [0.16, 0.13, 0.28], region: 'lower' },
]);

// Original, replaceable anatomical proxy; none of these ellipsoids is rendered as a mesh.
export const ANATOMY: readonly AnatomicalPart[] = [
  { center: [0, 1.77, 0], radii: [0.29, 0.37, 0.255], region: 'head' },
  { center: [0, 1.37, 0], radii: [0.155, 0.25, 0.16], region: 'head' },
  { center: [0, 1.08, 0], radii: [0.57, 0.3, 0.25], region: 'torso' },
  { center: [0, 0.83, 0], radii: [0.48, 0.48, 0.27], region: 'torso' },
  { center: [0, 0.32, 0], radii: [0.355, 0.45, 0.215], region: 'torso' },
  { center: [0, -0.16, 0], radii: [0.43, 0.32, 0.25], region: 'lower' },
  ...pairedParts,
];

export const MISSING_PATCHES: readonly Ellipsoid[] = [
  { center: [0.2, 1.87, 0.19], radii: [0.145, 0.14, 0.23] },
  { center: [-0.23, 0.91, 0.12], radii: [0.22, 0.145, 0.38] },
  { center: [0.3, 0.29, 0.03], radii: [0.18, 0.18, 0.34] },
  { center: [-1.01, 0.12, 0.1], radii: [0.09, 0.13, 0.14] },
  { center: [0.34, -0.7, 0.2], radii: [0.15, 0.16, 0.23] },
  { center: [-0.4, -1.5, 0.15], radii: [0.11, 0.18, 0.16] },
];

export const ENTITY = {
  seed: 4505,
  count: 2600,
  maxAttempts: 500000,
  bounds: { min: [-1.3, -2.25, -0.5], max: [1.3, 2.25, 0.5] },
  blend: 0.09,
  shellDepth: 0.065,
  interiorFraction: 0.12,
  densityFloor: 0.3,
  densityVariation: 0.55,
  densityFrequency: [9, 5, 7, 8],
  spine: { halfWidth: 0.095, minY: -0.1, maxY: 1.25, maxZ: -0.12 },
  cyan: [0.3, 0.73, 0.82],
  white: [0.8, 0.9, 1],
  whiteFraction: 0.3,
  brightness: [0.45, 0.95],
  size: 0.025,
  opacity: 0.7,
  viewAngle: Math.PI / 5,
  framingMargin: 1.12,
  fov: 50,
} as const;
