# Phase 4.5 — Fragmented Humanoid Prototype

Date: 2026-10-31. Branch: `main`. Base: reviewed Phase 4.4 commit `1bb4e4b`.

Status: **COMPLETE for the bounded prototype; ready for review**. The settled figure is a new provisional procedural source, not an approved mesh or final art direction. Implementation began from the reviewed clean tree and resumed from this phase's uncommitted files. Historical reports/evidence, supplied content, dependencies and experience-state policy are preserved. No formation animation, later phase, commit, push or deployment was performed.

The vision, content/entity mapping, experience constitution, architecture, performance strategy, open decisions and Phase 4.4 report informed this work. The normal portfolio keeps its ambient field; the entity is available only through the development review entry.

## Files and responsibilities

| File / area                                                                 | Responsibility                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/world/entity/config.ts`                                                | Central provisional anatomy, missing patches, sampling budget, palette, region labels and framing values.                       |
| `src/world/entity/anatomy.ts`                                               | Smooth implicit anatomical source, region precedence, patch exclusion and conservative camera fitting.                          |
| `src/world/entity/sampleEntity.ts`                                          | Seeded bounded sampling into stable position/color/identity/region arrays.                                                      |
| `src/world/entity/EntityPoints.tsx`                                         | One static batched Points object, memoized arrays, existing index-buffer filtering and uniform framing.                         |
| `src/world/scene/RenderSurface.tsx`, `WorldCanvas.tsx`, `WorldBoundary.tsx` | Share the existing renderer setup and failure boundary; keep the public Scene unchanged.                                        |
| `dev/entity.html`, `src/dev/`                                               | Separate development entry, accessible view/region/reset controls and responsive preview layout.                                |
| `src/app/BackgroundMotionControl.tsx`                                       | Correct the disabled reduced-motion label without changing motion policy.                                                       |
| `vite.config.ts`                                                            | Reject development/entity modules if they enter the production build graph.                                                     |
| `scripts/check-entity.mjs`                                                  | Determinism, identity, classification, finite bounds, holes, count, camera fit and output exclusion checks.                     |
| `scripts/check-entity-browser.mjs`, `scripts/entity-fixture.html`           | Real renderer, controls, fallback, resource lifetime, screenshots and normal-app network checks.                                |
| `scripts/world-probe.mjs`, `scripts/check-world.mjs`                        | Reuse test-side renderer inspection; assert the corrected label and redirect regression evidence without overwriting Phase 4.4. |
| Documentation and `docs/implementation/evidence/phase-4.5/`                 | Record decisions, boundaries, verification and review evidence.                                                                 |

No external model, texture, dependency, custom shader, postprocessing, rig, facial detail, fingers or clothing was added.

## Geometry source and settled appearance

Twenty overlapping ellipsoids describe a head, neck, shoulder bar, chest, abdomen, pelvis and paired shoulders, upper arms, forearms, mitten-like hands, thighs, calves and feet. A smooth minimum of approximate signed distances blends their joins. These source shapes are never rendered as meshes. The neutral pose slightly separates the arms from the torso; feet and hands remain simple anatomical suggestions.

Sampling and rendering are separate. `anatomy.ts` supplies spatial distance/classification, `sampleEntity.ts` creates typed arrays, and `EntityPoints` consumes those arrays. An approved source can replace the spatial sampler later without making the renderer own anatomy. There is no speculative mesh-loading framework.

Rejection sampling favors a thin band inside the blended surface, accepts some deeper points for volume, varies acceptance spatially, and excludes six explicit missing patches. The patches interrupt the temple, chest, waist, forearm, thigh and calf. Unequal density, transparent points and empty patches keep the settled form incomplete without relying on glow or motion.

| Provisional parameter | Value / meaning                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed / count          | `4505` / `2600`; fixed review budget, with a test ceiling of 4000.                                                                              |
| Attempt budget        | `500000`; failure to fill the configured count throws rather than silently returning partial data.                                              |
| Sampling bounds       | X ±1.3, Y ±2.25, Z ±0.5 world units.                                                                                                            |
| Blend / surface band  | `0.09` / `0.065` world units.                                                                                                                   |
| Deeper acceptance     | `0.12` probability for candidates deeper than the band, before density/patch rejection; this is not a promised final interior-point percentage. |
| Density               | Sinusoidal spatial modulation with acceptance from `0.3` to `0.85`, frequencies `[9, 5, 7, 8]`.                                                 |
| Color                 | Cyan `[0.3, 0.73, 0.82]`, soft white `[0.8, 0.9, 1]`; 30% white probability, brightness multiplier `[0.45, 0.95]`.                              |
| Point size / opacity  | `0.025` world units with perspective attenuation / `0.7`; normal transparent blending, depth writes disabled.                                   |
| Views                 | Front and immediate 36-degree Y rotation; no animated orbit.                                                                                    |
| Framing               | FOV 50 degrees, conservative bounds with `1.12` margin; camera distance changes when needed, body scale stays `[1, 1, 1]`.                      |

All shape and sampling choices are centralized in configuration. The broad shoulders, simple hands/feet and approximate blended anatomy remain reviewable proxy choices, not final character styling.

## Identity and conceptual regions

Accepted-sample order supplies stable Uint16 IDs `0…2599`. Positions/colors are Float32 arrays, region tags are Uint8, and each region has a Uint16 list of particle IDs. The same seed/configuration reproduces all arrays through rerenders and remounts. Changing source parameters can change these identities; they are not persistent IDs across different anatomical revisions.

| Region                       | Conceptual meaning      | Current points |
| ---------------------------- | ----------------------- | -------------: |
| Head, including neck         | Creator / identity      |            284 |
| Arms, shoulders and hands    | Projects / creation     |            609 |
| Torso                        | Skills / technology     |            571 |
| Posterior spine strip        | Optional journey        |             65 |
| Lower body, including pelvis | Experience / foundation |           1071 |

Overlaps use the lowest raw component signed distance; exact ties keep configuration order. A posterior strip overrides only points otherwise classified as torso: `abs(x) < 0.095`, `-0.1 < y < 1.25`, `z < -0.12`. Every point belongs to exactly one region. This is metadata for inspection; selecting a region does not send navigation intent, select a chapter or assemble the body.

## Rendering, ownership and preview isolation

One Points object contains one declarative BufferGeometry and PointsMaterial. Each mount memoizes generated data and one mutable index array. Region selection copies the selected IDs into that existing index buffer and changes the draw range; view selection changes only rotation. Neither action recreates geometry/material or resamples positions/colors. There is no entity frame callback, idle motion, per-frame allocation or React state update.

R3F owns declarative geometry/material disposal, including geometry attribute buffers. No manual double-disposal or `primitive` ownership bypass was introduced. Two StrictMode fixture mount/unmount cycles observed one geometry/material disposal each, zero remaining geometry/program resources and released contexts. CPU arrays become collectible after unmount. This is a bounded cleanup check, not a long-run leak profile.

Run `npm run dev`, then open **`http://localhost:5173/dev/entity.html`**. Native buttons select front/three-quarter views, a labeled select isolates regions, and reset restores full/front state. Controls remain outside the single inert, aria-hidden canvas, with visible keyboard focus and a textual description. A renderer failure displays an entity-specific explanation while controls remain usable.

The shared RenderSurface is the existing renderer initialization moved out of WorldCanvas. Public Scene still imports only the ambient ParticleField. The preview requests demand rendering and settles after changes. Camera fitting uses both viewport dimensions and rotated depth bounds; it never applies ambient X-only scaling to anatomy.

Production isolation has three checks: the Vite build rejects any `src/dev` or `src/world/entity` module in its graph; the output check finds no preview directory/entity markers; and a normal-app browser navigation requests neither module tree. A deliberate build using the development HTML as input, with output writing disabled, also triggered the expected guard error. There is no production navigation link or debug interface.

The requested public correction displays **“Background motion off”** while reduced motion disables the button. The existing hook and stored mount-local pause choice are unchanged; preference changes still preserve that choice.

## Verification and measurements

Windows, Node `24.17.0`, npm `11.13.0`, headless Chrome `156.0.8078.74`, disposable profile. Renderer: **ANGLE / Intel Iris Xe Graphics / Direct3D11**. Viewports are browser emulation at DPR 1, not physical mobile-device measurements.

| Scenario                   | CSS viewport   | Drawing buffer   | Drawn points / calls   | Geometries / textures / programs |
| -------------------------- | -------------- | ---------------- | ---------------------- | -------------------------------- |
| Wide front / three-quarter | 1440 × 1000    | 1440 × 798       | 2600 / 1               | 1 / 0 / 1                        |
| Narrow three-quarter       | 390 × 844      | 390 × 467        | 2600 / 1               | 1 / 0 / 1                        |
| Each isolated region       | 1440 × 1000    | 1440 × 798       | Region count above / 1 | 1 / 0 / 1                        |
| Each fixture teardown      | Canvas removed | Context released | No ongoing rendering   | 0 / 0 / 0                        |

The preview header/description occupy the remainder of the viewport; canvas CSS dimensions can be fractional. Camera Z was approximately `6.797` in the captured layouts. Geometry/material UUIDs remained identical through view, region and viewport changes, and object scale stayed `[1, 1, 1]`. Projected full-body bounds stayed inside the configured margin. After settling, a 600ms observation recorded no extra render calls. Teardown metrics retain last-frame draw counts in Three's info object; they do not indicate continued rendering.

These measurements establish actual batching, static scheduling and bounded resource lifetime. They do not establish GPU time, mobile performance, power consumption or an FPS claim. Raw results are in [entity metrics](../evidence/phase-4.5/metrics.json); ambient regression measurements are saved separately under this phase's evidence directory.

Completed checks:

- `npm run build`, `npm run lint`, `npm run format:check`, `git diff --check`, and pure experience, ambient-particle and entity checks pass.
- Production build: 44 modules, approximately 1,082 kB JavaScript / 297 kB gzip. The existing large-chunk warning remains visible; no threshold/dependency change conceals it.
- Existing shell suites pass in development and production: native pointer/keyboard navigation, cold deep links, history/restoration, observed/explicit intent semantics, layout changes, tracking cleanup and isolated WebGL failures.
- Existing world suites pass in development and production: continuous/demand behavior, pause/reduced-motion priority and preserved pause choice, hidden-tab suspension, bounded resume, resize/resource identity and lifecycle cleanup.
- Entity checks pass for seeded arrays/IDs, partitioned regions, missing patches, finite bounds/colors, count ceiling and camera fit across four aspect ratios and both views.
- Entity browser checks pass for one canvas/draw, unchanged geometry/material, all regions, static settling, keyboard view/select/reset, focus styling, unavailable/thrown WebGL fallback, two cleanup cycles and normal-app isolation. No normal-operation runtime errors or failed loads were observed; injected failure diagnostics are expected.

## Visual inspection

All four captures were inspected at readable size: [wide front](../evidence/phase-4.5/wide-front.png), [wide three-quarter](../evidence/phase-4.5/wide-three-quarter.png), [narrow full entity](../evidence/phase-4.5/narrow-full.png), and [arms isolation](../evidence/phase-4.5/arms-isolation.png).

The front silhouette reads as humanoid: head/neck, shoulders, arms/hands, chest/waist, pelvis, legs and feet are distinguishable. Limb separation makes the waist legible; chest/waist and limb gaps are visibly intentional. The three-quarter capture retains depth and plausible limb overlap without forming a solid surface. No visibly stacked source meshes, skeleton-only structure, unintended detached blobs or clipped extremities were observed. Isolated arms are intentionally disconnected from the hidden torso.

The narrow view retains full-body proportions and head/foot margins. Its points are smaller on screen, so desktop inspection remains useful for judging local anatomy. The source is adequate for bounded settled-form review; final anatomy, fragmentation density and art direction remain unapproved. Code checks alone are not the basis of this visual assessment.

## Reproduction

Start Vite on `127.0.0.1:5173`, build, and start preview on `127.0.0.1:4173`. Launch installed Chrome with a disposable profile and `--headless=new --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1`. Run browser suites sequentially to avoid focus/timing interference:

```powershell
npm run build
npm run lint
npm run format:check
node scripts/check-experience.mjs
node scripts/check-particles.mjs
node scripts/check-entity.mjs
node scripts/check-shell.mjs
node scripts/check-shell.mjs http://127.0.0.1:4173 http://127.0.0.1:5173
$env:MISHAI_EVIDENCE_DIR = '../docs/implementation/evidence/phase-4.5/regressions/'
node scripts/check-world.mjs
node scripts/check-world.mjs http://127.0.0.1:4173 --production --checks-only
node scripts/check-entity-browser.mjs
git diff --check
```

The shell's second URL supplies only its development lifecycle fixture. The evidence override preserves historical Phase 4.4 captures/metrics; `--checks-only` skips new ambient recording. Entity browser checks overwrite this phase's four screenshots and metrics. Test-side inspection uses the installed React renderer ref, with no production debug API; revisit it during React/R3F upgrades. Close disposable Chrome and the servers after testing.

## Remaining limits and one bounded next step

The existing THREE.Clock deprecation and production bundle warning remain. The previously observed DPR-only change limitation, runtime context recovery, physical touch devices, screen readers, other browsers, long-run memory and thermal/power behavior remain unverified. The procedural source has approximate anatomy and no final mesh approval; region tags are discrete sampling metadata, not a rig. Supplied content gaps remain unchanged.

One proposed next step, not started: review these settled front/three-quarter/narrow captures and the local preview, then approve the proxy or request bounded adjustments to its centralized anatomy/fragmentation values. Formation/dissolution begins only after that settled-form review. No chapter assembly, countdown, Big Bang, reveal, camera choreography or new orchestration system was started.
