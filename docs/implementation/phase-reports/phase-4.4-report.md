# Phase 4.4 — World & Particle Prototype

Date: 2026-10-31. Branch: `main`. Base: reviewed Phase 4.3 commit `69d5fcc`.

Status: **COMPLETE for the bounded prototype; ready for review**. This is newly scoped implementation, not recovered final design. The working tree was clean at the reviewed commit before this phase; work resumed from its own uncommitted files. Historical reports, supplied content, experience-state policy and dependencies remain unchanged. No humanoid work, later phase, commit, push or deployment was performed.

## Files and responsibilities

Read the vision, experience constitution, application/rendering architecture, performance strategy, open decisions and Phase 4.3 report before implementing.

| File                                                                                              | Responsibility                                                                                                                                           |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/world/particles/config.ts`                                                                   | Central provisional count/seed, projection, pockets, palette, size/opacity and motion envelope.                                                          |
| `src/world/particles/generateParticles.ts`                                                        | Deterministic typed arrays and allocation-free, in-place bounded position updates.                                                                       |
| `src/world/particles/ParticleField.tsx`                                                           | One batched Points object, memoized CPU arrays, declarative geometry/material, frame-local time and position updates.                                    |
| `src/world/scene/Scene.tsx`                                                                       | Compose ParticleField; no generation or orchestration logic.                                                                                             |
| `src/world/scene/WorldCanvas.tsx`                                                                 | Preserve renderer/failure boundary, stable camera and DPR range; choose R3F frame scheduling from motion permission.                                     |
| `src/app/useBackgroundMotion.ts`                                                                  | User pause, live system preference, document visibility, listener cleanup.                                                                               |
| `src/app/BackgroundMotionControl.tsx`                                                             | Native pause/resume button, disabled reduced-motion state and explanatory text.                                                                          |
| `src/app/App.tsx`, `src/app/PortfolioShell.tsx`                                                   | Own independent motion policy and place the control after section navigation, outside the decorative canvas.                                             |
| `src/main.tsx`                                                                                    | Synchronous initial DOM commit so production native fragment navigation/restoration finds its targets.                                                   |
| `src/styles/global.css`                                                                           | Restrained control styling and center attenuation over the field.                                                                                        |
| `scripts/check-particles.mjs`                                                                     | Determinism, counts, finite values, spatial/color bounds and motion envelope checks.                                                                     |
| `scripts/browser-session.mjs`, `scripts/check-shell.mjs`                                          | Reuse the existing CDP transport; preserve all shell assertions, add a cold deep link, allow production tests with a development-only lifecycle fixture. |
| `scripts/check-world.mjs`, `scripts/world-probe.mjs`, `scripts/world-fixture.html`                | Actual renderer/resource/motion checks, StrictMode cleanup fixture, production screenshots/recording and modest metrics. No production debug API.        |
| Documentation index, architecture, performance strategy, decisions, development order and roadmap | Record current implementation, provisional choices and stop-for-review boundary.                                                                         |
| `docs/implementation/evidence/phase-4.4/`                                                         | Two portfolio screenshots, small motion recording/contact sheet, two measurement JSON files and reproduction notes.                                      |
| `docs/implementation/phase-reports/phase-4.4-report.md`                                           | This report.                                                                                                                                             |

No package/lockfile changes, shader framework, texture asset, postprocessing, camera choreography, connecting lines, cursor attraction, backend, analytics, content claim or adaptation engine was added.

## Particle generation and rendering

One `Points` / `BufferGeometry` / `PointsMaterial` draws the entire field. A seeded 32-bit linear congruential generator creates position, vertex-color and phase arrays. Two random samples per pocket coordinate concentrate particles unevenly. Projection-aware placement supplies depth while preserving broad central negative space; perspective point-size attenuation and brightness variation reinforce depth without moving the camera.

The same seed produces the same arrays through rerenders and StrictMode remounts. Each mounted field owns one memoized generated data set and one mutable position array. Frame work writes that array in place and marks its existing BufferAttribute dirty. It allocates no arrays, rebuilds no geometry and updates no React state per frame. A custom shader was unnecessary for 280 slowly drifting points; built-in Three materials meet this prototype's requirement.

| Provisional parameter             | Value / rationale                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed / count                      | `4404` / `280`; sparse fixed budget at every viewport, not hardware-adaptive quality.                                                        |
| Camera                            | `[0, 0, 6]`, FOV `50`; preserves the prior camera and remains stationary.                                                                    |
| Depth                             | Base Z in `[-5, 0]`; distance from the camera varies from 6 to 11 world units.                                                               |
| Pocket centers                    | Normalized projected coordinates `(-0.78, 0.25)`, `(0.78, -0.32)`, `(0.52, 0.72)`.                                                           |
| Pocket half extents / proportions | `(0.20, 0.65)` at 55%, `(0.18, 0.56)` at 35%, `(0.22, 0.20)` for the remaining 10%. Normalized viewport center is zero; edges are ±1.        |
| Colors                            | Linear RGB cyan `[0.26, 0.72, 0.82]`, soft white `[0.85, 0.9, 1]`; 25% white probability, seeded brightness multiplier `[0.35, 0.85]`.       |
| Point size / opacity              | `0.045` world units with perspective attenuation / `0.48`, normal transparent blending, no glow. Depth writes disabled.                      |
| Drift envelope                    | Independent per-axis offsets bounded by `[0.035, 0.045, 0.025]` world units around each base point. X is subsequently aspect-scaled.         |
| Angular rates                     | `[0.19, 0.13, 0.11]` radians/second with seeded phases; roughly 33–57 second cycles, not world rotation.                                     |
| Maximum simulation step           | `0.05` seconds; long frames slow the simulation rather than catching up abruptly.                                                            |
| Readability treatment             | CSS gradient over the canvas: transparent at edges, dark at 60% opacity at 20%/80% width, 80% at center. Existing text/layout remain intact. |

The geometry is generated for aspect 1 using the configured camera projection. The Points X scale follows the actual viewport aspect, so wide/narrow layouts retain the side pockets without regenerating geometry. There is no count reduction or capability inference from viewport width. The field remains visible at the sides of reading areas; the empty center and scrim reduce interference with text. These values are provisional, not final artistic approval.

## Motion, control and state boundaries

App derives `motionEnabled = visible && !reducedMotion && !paused`. Only this boolean goes to WorldCanvas, Scene and ParticleField. The Phase 4.3 snapshot and its observed-section/historical-navigation meanings remain unchanged and are not passed to the world.

- R3F uses `frameloop="always"` only when motion is enabled; otherwise `demand`. There is no second requestAnimationFrame loop or demand-mode animation that depends on missing invalidations.
- Time belongs to a local ref, advances only on enabled frames and survives ordinary renders, navigation and resizing. The first frame after a policy change is skipped; subsequent deltas are capped. No hidden-tab elapsed time is replayed.
- Pause and reduced motion freeze the current pose. A reduced-motion initial mount renders the deterministic time-zero pose. Resize/property changes still render in demand mode, then settle.
- The button's action label is “Pause background motion” or “Resume background motion.” Its described status is “Enabled,” “Paused,” or “Off: reduced motion.” It describes permission rather than claiming successful WebGL rendering. It uses a native button, visible focus styling and a 44px minimum height.
- Reduced motion disables the button and takes precedence. Preference changes never reset a user's pause choice. Pause is mount-local: no storage or settings framework exists.
- The control follows existing navigation in the header, outside the aria-hidden/inert canvas. Skip, brand and section-link keyboard order remains intact. World failures leave DOM controls, content, scrolling and tracking available.

## Ownership and cleanup

Installed R3F source was inspected before adding resources: `removeChild` recursively handles declarative children and schedules geometry/material disposal via `disposeOnIdle`; primitive resources would bypass that ownership. Root teardown disconnects events, clears render lists, forces context loss and releases the scene through its existing delayed cleanup. This implementation uses declarative geometry/material nodes, with no manual double-disposal and no `primitive` objects. Geometry owns GPU attribute-buffer cleanup; ordinary CPU typed arrays become collectible after unmount.

The motion hook removes its media-query and visibility listeners on cleanup. The field's useFrame subscription follows R3F's hook lifetime. The existing canvas renderer ref/failure boundary behavior is preserved. Two StrictMode fixture mount/unmount cycles observed exactly one preference listener and one visibility listener while mounted, zero after unmount, one geometry/material disposal per cycle, and zero geometry/program resources after teardown. This is not a long-duration memory-leak profile.

## Production-navigation correction

Production preview exposed a real initial-load/reload failure: `#projects` remained in the URL while scrolling stayed at zero because React's initial asynchronous commit had not supplied anchor targets when native fragment processing ran. A fresh document reproduced it independently of the test suite.

The bootstrap now wraps only the initial `createRoot(...).render(...)` in React DOM's existing `flushSync`. Native fragment navigation and restored positions can find the DOM before module evaluation completes. No scripted scrolling, hash rewriting, history entries, focus movement or navigation interception was added. Cold deep links, reload and history assertions then passed in production.

The existing lifecycle fixture also now waits for top-section observation after focusing a header link before pressing Enter. This removes a timing race with the unchanged 12px selection hysteresis; no section policy threshold or assertion was weakened.

## Verification and measurements

Windows, Node `24.17.0`, npm `11.13.0`; installed headless Chrome `156.0.8078.74`, disposable profile. Development runs React StrictMode; production preview runs the built application, with explicit lifecycle remount tests in the separate development fixture. The renderer reported **ANGLE / Intel Iris Xe Graphics / Direct3D11**. These are headless browser observations using the reported adapter, not physical mobile-device GPU results or software-renderer extrapolations.

| Scenario                          | CSS viewport / DPR  | Drawing buffer   | Points / draw calls                | Geometries / textures / programs |
| --------------------------------- | ------------------- | ---------------- | ---------------------------------- | -------------------------------- |
| Wide animated, dev and production | 1440 × 900 / 1      | 1425 × 900       | 280 / 1                            | 1 / 0 / 1                        |
| Narrow paused after resize        | 390 × 844 / 1       | 375 × 844        | 280 / 1 on the last rendered frame | 1 / 0 / 1                        |
| Wide animated resize              | 1440 × 900 / 2      | 2850 × 1800      | 280 / 1                            | 1 / 0 / 1                        |
| Each development fixture teardown | No remaining canvas | Context released | Rendering stopped                  | 0 / 0 / 0                        |

Native scrollbars account for the 15 CSS-pixel width difference. Geometry/material UUIDs stayed identical through animated navigation, paused navigation, preference changes and resizing. The camera remained `[0, 0, 6]`. Static mode produced no additional draws during the final 450ms observation after 350ms settling. Native tab switching actually reported hidden in both runs; the synthetic visibility fallback in the test script was not needed. A one-second hidden interval caused no large resume step.

Modest frame-entry timing sample, wide animated DPR 1, gathered before screenshot/recording work:

| Build              | Sample duration | Render entries | Median interval | 95th percentile | Maximum |
| ------------------ | --------------- | -------------- | --------------- | --------------- | ------- |
| Development        | 2983.2ms        | 180            | 16.7ms          | 16.9ms          | 17.1ms  |
| Production preview | 2999.5ms        | 181            | 16.7ms          | 17.2ms          | 21.1ms  |

These instrumented render-entry intervals are not GPU execution time, an achieved 60-FPS claim, a thermal/power budget or mobile performance evidence. Full values and actual scenarios are saved in [development metrics](../evidence/phase-4.4/development-metrics.json) and [production metrics](../evidence/phase-4.4/production-metrics.json).

Checks completed:

- `npm run build`, `npm run lint`, `npm run format:check`, `node scripts/check-experience.mjs`, `node scripts/check-particles.mjs`, and `git diff --check` pass. Production build: 43 modules, approximately 1,082 kB JavaScript / 297 kB gzip; existing large-chunk warning remains.
- Shell suite passes in development and production at 1440 × 900, 390 × 844 and 320 × 740, preserving native pointer/keyboard navigation, skip/top, manual wheel scrolling, active-link/focus styling, no observation-driven focus/hash/history writes, cold deep links, reload, back/forward, restored scroll, unknown hashes, resizing, layout changes, intent semantics and StrictMode tracking cleanup.
- Deliberately unavailable WebGL and thrown renderer initialization both retain usable content, all section anchors and observed tracking in both builds. Expected injected failure diagnostics are distinguished from normal-operation errors.
- World checks pass for deterministic geometry, resource counts/identity, continuous versus demand scheduling, native keyboard pause, live preferences with preserved user pause, native tab visibility, bounded resume movement, animated/static resize and two cleanup cycles. No normal runtime errors or failed network loads were observed. Clock deprecation remains.

## Visual evidence and inspection

Evidence is under [phase-4.4](../evidence/phase-4.4/README.md): `wide.png`, `narrow-projects.png`, `motion.webm`, `motion-strip.jpg` and the two metrics JSON files. No profiles, dependency caches or large traces are included.

The wide and narrow production screenshots were visually inspected with actual portfolio text present. Unequal side pockets and the broad empty center read as a restrained spatial field; brightness/point-size variation supplies depth. Text, dividers, navigation/control and native anchor focus remain legible. No dense uniform wallpaper, globe, humanoid silhouette or glow effect was introduced.

A real four-second animated run was recorded; four decoded time-separated frames were inspected, alongside per-render displacement and timing checks. The composition stays stable with small individual drift; no excessive sweep, rotation or discontinuity was observed in those samples. The WebM is canvas-only and excludes DOM/scrim; the portfolio screenshots verify the composited reading views. Direct real-time video playback, physical-display flicker assessment and full motion-quality acceptance remain unverified. A screenshot alone is not treated as proof of animation quality.

## Reproduction

Start Vite on `127.0.0.1:5173`, build, and start preview on `127.0.0.1:4173`. Launch installed Chrome with a disposable profile, `--headless=new --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1`. Then run browser scripts sequentially so tab focus and timing samples do not interfere:

```sh
node scripts/check-experience.mjs
node scripts/check-particles.mjs
node scripts/check-shell.mjs
node scripts/check-shell.mjs http://127.0.0.1:4173 http://127.0.0.1:5173
node scripts/check-world.mjs
node scripts/check-world.mjs http://127.0.0.1:4173 --production
```

The shell's second URL supplies only its test-only lifecycle fixture; all ordinary DOM/navigation/fallback assertions use the first URL. World resource-remount checks use the development fixture; production checks inspect the actual built app. The test probe locates the installed React renderer ref without adding a production debug interface; revisit this test-side inspection during React/R3F upgrades. The production world command overwrites reproducible visual evidence. Close the disposable browser and both servers after testing.

## Remaining limits and one bounded next step

- Existing `THREE.Clock` deprecation and Vite bundle warning remain separately tracked. No dependency upgrade or warning-threshold change was made.
- During emulation, changing only DPR at identical CSS dimensions retained the previous buffer until a CSS resize. DPR 1/2 checks therefore include actual layout resizing; independent live DPR-only monitoring was not added. This is an observed integration limitation, not a particle quality adaptation feature.
- Runtime context-loss recovery, physical touch devices, screen readers, other browsers, long-run memory, power/thermal behavior and final art-direction approval remain unverified. Content gaps and current-role confirmation remain unchanged.
- No humanoid, mesh sampling, countdown, Big Bang, chapter transitions, camera choreography or orchestration system was started.

One proposed next step, not started: review this field on a real narrow touch device and one desktop display, focusing on reading comfort and motion intensity, then adjust only the centralized prototype values if that evidence justifies it. Review this phase before authorizing further work.
