# Rendering architecture

## Current render path

`main.tsx` mounts `App`; `App` renders independent `WorldCanvas` and `PortfolioShell` siblings. The world boundary contains one fixed, inert canvas behind the DOM content. `WorldCanvas` uses the shared `RenderSurface` to compose `Scene` inside R3F; `Scene` still composes only the ambient `ParticleField`. The development-only humanoid preview is a separate entry, not part of this public render path.

| Setting                           | Observed value                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| Canvas count                      | One                                                                                   |
| Camera position                   | `[0, 0, 6]`                                                                           |
| Camera field of view              | `50`                                                                                  |
| Antialias                         | Enabled                                                                               |
| Alpha                             | Disabled                                                                              |
| Background                        | `#05060a`                                                                             |
| Requested DPR clamp               | `[1, 2]`                                                                              |
| Frame scheduling                  | `always` only when visible, unpaused and motion permitted; otherwise `demand`         |
| Scene geometry / lights / effects | One Points / BufferGeometry / PointsMaterial; 280 points, no lights or postprocessing |

These are foundation defaults, not completed art direction. The DPR constant now uses the mutable `[number, number]` tuple type accepted by R3F, preserving `[1, 2]`. Build and headless Chrome mount/resize checks pass; see the [Phase 4.1 report](../implementation/phase-reports/phase-4.1-report.md) for evidence and limitations.

Phase 4.2 constructs the Three renderer synchronously in the Canvas callback ref, passes it through R3F's supported `gl` factory, and lets a React boundary isolate initialization errors. Installed R3F's `fallback` prop only supplies canvas fallback HTML, and its asynchronous renderer configure call does not route initialization rejection into that boundary. Deliberately unavailable WebGL and thrown initialization errors were both tested; semantic content remains usable. See the [Phase 4.2 report](../implementation/phase-reports/phase-4.2-report.md).

Canvas sizing and teardown stay with R3F. Phase 4.4 switches its existing loop between `always` and `demand`; no second animation loop is created. A paused or reduced-motion field freezes at its current bounded pose (the deterministic time-zero pose on initial load). R3F still renders resize and changed scene properties on demand. Hidden tabs also disable motion. A local time ref advances only during enabled frames, skips the first frame after a policy change, and caps each delta at 50ms. It does not use the clock's elapsed time, which R3F resets when changing frame modes.

Phase 4.3 keeps DOM measurements and native navigation in the application layer. App still owns its read-only `ExperienceSnapshot`; the particle prototype does not consume it. WorldCanvas, Scene and ParticleField receive only `motionEnabled`. Observed location and historical explicit navigation retain their existing semantics. See [application boundaries](application-boundaries.md).

## Particle prototype ownership

`src/world/particles/config.ts` centralizes the seed, count, camera projection used for composition, three uneven side pockets, depth, linear RGB colors, brightness, size, opacity, drift and speed. `generateParticles.ts` creates deterministic typed position/color/phase arrays and supplies an in-place bounded motion function. `ParticleField.tsx` owns memoized CPU arrays and the declarative Three resources. Scene remains a composition root.

The position generator uses depth-dependent projection to preserve intentional screen-space negative space. A single Points object's X scale follows the viewport aspect; count and geometry stay fixed across wide/narrow layouts. This is responsive composition, not capability detection or adaptive quality. Perspective point-size attenuation and varying brightness convey depth. A CSS dark center scrim further protects text. No custom shader or texture is needed at this count.

Installed R3F's `removeChild` recursively disposes declarative geometry/materials through `disposeOnIdle`; geometry disposal releases its GPU attribute buffers. The root teardown disconnects events, clears render lists, forces context loss and releases the scene after its existing delay. No manual disposal or `primitive` ownership bypass was added. Two StrictMode fixture cycles verified geometry/material disposal, zero remaining geometry/program counts and motion-listener cleanup. This is a bounded lifecycle check, not a long-session memory-leak audit. See the [Phase 4.4 report](../implementation/phase-reports/phase-4.4-report.md).

## Development-only entity prototype

`dev/entity.html` loads `src/dev/entity-preview.tsx` and its DOM `EntityPreview`. It uses the same `RenderSurface` and `WorldBoundary`, with an entity-specific fallback message and one Canvas. Shared renderer setup was extracted from WorldCanvas without changing its initialization/failure behavior, DPR defaults or ownership. Production still imports only the ambient Scene; the entity does not receive experience state.

`src/world/entity/config.ts` defines provisional anatomy, missing patches, count and colors. `anatomy.ts` smoothly unions twenty overlapping ellipsoids and classifies regions; the ellipsoids are never rendered. `sampleEntity.ts` supplies deterministic position/color/identity/region arrays and region index lists. `EntityPoints.tsx` is independent of the shape calculation and renders that sampled data as one Points object. An approved mesh can later replace the sampling source while retaining the sampled-array boundary; no external asset is approved by this implementation.

Phase 4.6 added `transition.ts`: separate seeded dispersed positions and an in-place pure smoothstep position evaluator. Phase 4.7 extends its single controller to five independent region states (progress, endpoint target, playing intent). There is no competing whole-body controller; all-region commands broadcast over current regional states. Settled source arrays, IDs, colors and regions are unchanged. The renderer owns a distinct mutable position buffer; its R3F frame subscription advances progress and evaluates positions only during permitted playback. React subscribes to commands, policy changes and completion, not per-frame progress. The native inspection slider updates at those meaningful changes rather than continuously, targets one region and pauses only that region. It is disabled for all-region targeting; no average progress exists.

`Show region` rewrites the existing index buffer and draw range independently of `Control region`; all attributes, geometry and material remain stable. Views immediately rotate Y between 0 and 36 degrees. Camera distance fits the full transition box (X ±2, Y ±2.25, Z ±1.3) using both viewport dimensions and a conservative rotated radius; it never follows progress. Scale stays `[1, 1, 1]`. The single R3F frame callback advances the five regions and evaluates each particle from its exclusive stable membership. The scene uses `always` while any region can advance, otherwise `demand`, with static invalidation for commands, views/regions and resize. Reset stops playback at full settled/front/all regions.

Reduced-motion commands select only targeted endpoints immediately; enabling the preference settles each playing region at its own target but preserves paused regions. Each region skips its first advancing frame after resume, even while other regions are already moving. Visibility suspends active intent, skips stale time on return and never resumes a user-paused pose. `observeMotionPolicy` shares only browser preference/visibility subscription and cleanup with the ambient hook; the two motion policies remain independent. The five-second duration and 50ms delta cap are unchanged. Current contract and evidence: [Phase 4.7 report](../implementation/phase-reports/phase-4.7-report.md); original paths/framing: [Phase 4.6 report](../implementation/phase-reports/phase-4.6-report.md).

R3F owns all declarative geometry/material disposal as for the ambient field. Two entity remount cycles verified disposal, context release and zero remaining geometry/program resources. The production build guard rejects `src/dev` and `src/world/entity` modules in the build graph; output and normal-app network assertions additionally verify exclusion. See the [Phase 4.5 report](../implementation/phase-reports/phase-4.5-report.md) for region precedence, measurements and visual assessment.

## Recovered rendering direction

The universe should have persistent spatial continuity. Entity formation, particles, environment, and camera evolve with narrative state while semantic content stays independently usable.

A sampled base mesh feeding a particle field was discussed as an entity approach, with custom shader/noise displacement and partial visibility. Phase 4.5 supplies only a provisional procedural sampling source and static 2,600-point review budget. No external mesh, final anatomy, custom shader or production entity asset pipeline is approved.

Particles communicate formation, connection, and consequences. Preserve gaps, depth variation, and partial visibility. Avoid turning the target into a dense glowing mannequin.

Camera movement must be purposeful and restrained. Exact camera paths, scroll mapping, layer depths, chapter transitions, and interaction fields remain open.

## Implementation boundaries

- RenderSurface owns shared renderer setup; WorldCanvas owns the public world wrapper. Keep narrative and feature logic out of both.
- Scene composes dedicated world modules.
- Rendering configuration holds defaults; an eventual quality policy may select effective settings.
- Per-frame visual work should avoid allocating large objects or triggering DOM rerenders unnecessarily.
- CPU state changes and GPU buffers/uniforms need explicit update ownership.
- Shader and resource cleanup must be verified when those resources are introduced.

## Not implemented

Approved-mesh sampling, chapter-linked assembly, production humanoid reveal, custom shader effects, postprocessing, camera choreography, narrative mapping, adaptive quality and runtime context-loss recovery remain pending. The reversible procedural preview is not final art direction or approved motion quality. Initialization fallback, native DOM navigation, background pause and live reduced-motion handling remain intact.
