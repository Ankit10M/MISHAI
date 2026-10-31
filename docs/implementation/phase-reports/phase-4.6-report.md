# Phase 4.6 — Reversible Entity Formation & Dissolution

Date: 2026-10-31. Branch: `main`. Base: reviewed Phase 4.5 commit `ea127e0`; the working tree was clean before implementation.

Status: **COMPLETE for bounded development-preview mechanics; ready for review**. The accepted procedural proxy, settled sampling, IDs, colors and regions are preserved. Motion values are provisional, not final motion/art approval. The public portfolio retains its behavior and never loads the entity. Historical reports and evidence are unchanged. No chapter integration, later phase, dependency, commit, push or deployment was added.

Read the vision, experience constitution, rendering architecture, entity decisions, Phase 4.5 report and existing entity checks before implementing.

## Files and ownership

| File / area                                                           | Responsibility                                                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/world/entity/transition.ts`                                      | Separate dispersion seed/bounds, pure position evaluator, fixed union framing and one transition controller.    |
| `src/world/entity/EntityPoints.tsx`                                   | Own runtime position storage; advance/evaluate through R3F, preserve all geometry/material/attribute resources. |
| `src/dev/EntityPreview.tsx`, `entity-preview.css`                     | Native playback/inspection controls, meaningful status and expanded responsive control layout.                  |
| `src/app/observeMotionPolicy.ts`, `useBackgroundMotion.ts`            | Reuse browser preference/visibility subscription and cleanup while keeping entity and ambient policy separate.  |
| `scripts/check-transition.mjs`                                        | Deterministic data/path, controller, interruption, policy, bounds and framing assertions.                       |
| `scripts/check-transition-browser.mjs`                                | Actual controls, renderer/buffer identity, playback, policy, visibility, cleanup and motion evidence.           |
| `scripts/entity-fixture.html`                                         | Count preference/visibility subscriptions across StrictMode remounts, including active teardown.                |
| `scripts/check-entity-browser.mjs`                                    | Add an evidence-directory override; retain all prior settled-form/browser assertions.                           |
| Architecture, decisions, roadmap, documentation index and this report | Record current boundaries, new provisional choices and review stop.                                             |

`config.ts`, `anatomy.ts` and `sampleEntity.ts` are unchanged from Phase 4.5. The original pure entity tests are unchanged. No source mesh, anatomy, palette, missing patch, region precedence or particle budget was adjusted to make formation easier.

## Stable data and position contract

The same 2,600 settled particles retain IDs `0…2599`, existing colors and region tags. Region counts remain head 284, arms/hands 609, torso 571, posterior spine 65 and lower body 1071.

A separate seeded 32-bit generator creates one dispersed XYZ position per existing ID, in the original index order. It does not sample or shuffle the anatomy. Both settled and dispersed arrays remain source data; the renderer has a distinct mutable Float32 position array. Tests verify that evaluation leaves the sources and identity/color/region arrays unchanged.

For normalized progress `p`, `e = p²(3 − 2p)` and each position is `dispersed + (settled − dispersed) × e`. Evaluation overwrites the existing output array and depends only on stable inputs and progress. Endpoints use an exact array copy: `p=0` is precisely the dispersed array and `p=1` is precisely the Phase 4.5 settled array. The same progress reproduces the same coordinates during formation, dissolution, inspection or reversal. There is no stateful random motion, accumulated drift, physics or region sequence.

| Provisional motion choice | Value / consequence                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| Dispersion seed           | `4606`, independent of settled seed `4505`.                                                    |
| Dispersion bounds         | X ±2, Y ±2.25, Z ±1.3 world units; uniformly sampled box, no humanoid silhouette.              |
| Path                      | Straight interpolation with global smoothstep easing; no extra path excursion.                 |
| Full-range duration       | 5 seconds of accepted simulation time; partial runs take proportional time.                    |
| Maximum accepted delta    | 0.05 seconds; maximum progress step 0.01. Slow frames prolong playback instead of catching up. |
| Resume                    | Skip the first advancing frame after a stopped/suspended interval, then cap deltas.            |
| Framing                   | Fixed union of dispersed/settled bounds, FOV 50, margin 1.12; body scale `[1, 1, 1]`.          |

The linear segment remains inside the union box, so no additional path margin is needed. Framing uses the X/Z bounding radius to cover both front and 36-degree views. Camera distance depends on viewport aspect, never on progress, region or playback direction. Conservative framing makes the settled figure smaller on screen than Phase 4.5's settled-only fit; it does not alter anatomy. Culling remains disabled for this single bounded Points object.

## Controller and interruption semantics

One preview-local controller owns progress, endpoint target, playing intent, reduced-motion policy and visibility. Its initial state is settled at progress/target 1, with playback off. No autoplay occurs.

| Input / event          | Behavior                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Form / Dissolve        | Select target 1 / 0 and advance from current progress. Opposite commands reverse immediately without changing position. Repeated active commands toward the same target are a no-op. |
| Pause                  | Preserve current progress and target; turn playing intent off.                                                                                                                       |
| Resume                 | Continue toward the retained target if different from current progress and reduced motion is off.                                                                                    |
| Range inspection       | Clamp the selected finite value to `[0,1]`, set it exactly and pause; retain the target for Resume. Form/Dissolve can select either direction afterward.                             |
| Completion             | Clamp exactly to the requested endpoint, clear playing intent, publish completion and settle into demand rendering.                                                                  |
| Reset                  | Stop at exact settled progress/target 1; restore front view and all regions. Source data/resources remain mounted.                                                                   |
| View / region / resize | Preserve progress and target. Change orientation, index draw range or viewport framing, then invalidate.                                                                             |

Reversal preserves position continuity, not velocity continuity: the direction of travel changes immediately. No inertial simulation or retiming system was introduced. This is a deliberate provisional mechanics choice for review.

React uses `useSyncExternalStore` to subscribe to commands, policy changes and completion. While frames advance, the controller's published snapshot stays identical; React receives no per-frame progress notifications. EntityPoints alone writes runtime positions, either on a static command commit or in its R3F `useFrame` callback. Each advancing frame updates the same BufferAttribute in place. Source generation is memoized and never reruns for playback/view/region changes.

RenderSurface uses `always` only while playing, visible and not reduced-motion. Paused, completed, hidden and reduced-motion states use `demand`; command commits invalidate static frames. No separate requestAnimationFrame loop, polling timer, generic animation framework or new dependency exists.

## Preferences, visibility and accessible controls

The native controls are Form, Dissolve, Pause/Resume and a labeled progress range, alongside the existing Front, Three-quarter, Region and Reset controls. The range has step 0.001 and explanatory text: it is an inspection control whose value updates on commands/policy/completion, not a live playback percentage. Adjusting it pauses playback at the selected value. No percentage is announced every frame.

A polite DOM status reports Settled, Dispersed, Forming, Dissolving, Paused or hidden suspension. Paused inspection identifies the retained Resume destination. Reduced motion adds an explicit endpoint-selection explanation and disables Resume; endpoint commands and manual inspection remain available. Native elements stay mounted so playback/status changes do not deliberately move keyboard focus. Controls remain outside the inert canvas, and WebGL failure retains controls and the established explanatory fallback.

With reduced motion enabled, Form/Dissolve select endpoints immediately. Enabling it during active playback—including suspended active intent—settles the requested target and clears playing intent. A user-paused/inspected pose stays untouched through preference changes. Disabling reduced motion never restarts completed playback.

Hiding the tab preserves active intent but prevents advancement. Returning resumes only if that intent is still active and policy permits; stale time is skipped. A paused pose stays paused. The shared `observeMotionPolicy` helper owns one media-query listener and one visibility listener per mounted preview/app. Ambient pause behavior remains in its original hook; no entity endpoint logic enters the public motion policy.

## Verification and measurements

Windows; Node `24.17.0`, npm `11.13.0`; headless Chrome `156.0.8078.74`, disposable profile. Renderer reported **ANGLE / Intel Iris Xe Graphics / Direct3D11**. The entity scenarios use DPR 1. These are emulated viewport observations, not physical mobile-device measurements.

| Scenario                                | CSS viewport / drawing buffer    | Drawn points / calls   | Geometry / textures / programs |
| --------------------------------------- | -------------------------------- | ---------------------- | ------------------------------ |
| Wide dispersed / intermediate / settled | 1440 × 1000 / 1440 × 700         | 2600 / 1               | 1 / 0 / 1                      |
| Narrow intermediate, three-quarter      | 390 × 844 / 375 × 320            | 2600 / 1               | 1 / 0 / 1                      |
| Narrow intermediate arms isolation      | 390 × 844 / 375 × 320            | 609 / 1                | 1 / 0 / 1                      |
| Playing resize and head isolation       | 800 × 900 / 800 × 579            | 284 / 1                | 1 / 0 / 1                      |
| Each active fixture teardown            | Canvas removed, context released | No further advancement | 0 / 0 / 0                      |

The narrow preview uses ordinary document scrolling to retain readable controls and a 320px minimum canvas; its 15px scrollbar explains the width difference. Full-document narrow evidence includes that overflow. Camera Z was approximately `7.78953` in the measured layouts, unchanged across poses. Scale, geometry/material UUIDs and position/color/index attribute identities stayed stable. Browser samples matched the pure evaluator exactly at current progress, and colors matched the original source.

After pause/completion, 500ms observations following 300ms settling recorded no extra renders. Actual tab switching reported hidden, so the test's synthetic visibility fallback was unnecessary. A one-second hidden interval did not advance progress, and resumed steps stayed within the 0.01 cap. Two active StrictMode teardown cycles left zero preference/visibility listeners, exactly one geometry/material disposal each, zero geometry/program resources and no further controller advancement.

Raw results are in [metrics.json](../evidence/phase-4.6/metrics.json), including command timestamps for the recording and measured maximum progress steps around reversal/resume. The inherited `maxStep` field includes deliberate scrub/endpoint jumps and is not a playback-only continuity metric. Teardown draw counters are Three's retained last-frame values. No FPS, GPU-time, thermal, power or mobile-performance claim is made.

Checks completed:

- Build/type checking, lint, formatting, `git diff --check`, existing experience/particle/entity pure checks and the new transition pure checks pass. Production build: 45 modules, approximately 1,082 kB JavaScript / 297 kB gzip; the existing large-chunk warning remains.
- Pure transition checks cover independent seeded dispersion, exact endpoints, immutable source/identity data, 101 progress values in both directions, finite bounds and both views at four aspect ratios. Controller checks cover repeated/reversed commands, pause/resume, scrub/reset, exact stopping, capped/skipped deltas, preference/visibility rules and subscriber cleanup.
- Existing settled entity browser assertions remain intact and pass with evidence redirected into this phase. Existing shell and ambient-world suites pass in development and production, including native navigation/history, experience semantics, reduced-motion priority, stored pause, visibility and renderer fallback.
- New browser checks cover actual positions, all resource/attribute identities, static settling, meaningful-only React subscription notifications, intermediate view/region/resize, keyboard controls/focus, reduced-motion changes, native tab hiding, unavailable WebGL with new controls and two active teardown cycles. Expected injected renderer errors are separated from normal operation.
- The existing production graph guard remains active. Build/output checks pass, and normal-app network assertions request neither entity nor development modules. No public link, production debug API or transition import was added.

## Visual evidence and assessment

Evidence lives in [phase-4.6](../evidence/phase-4.6/README.md): consistent-framing `dispersed.png`, `intermediate.png`, `settled.png`; `narrow-intermediate.png`; a roughly 15.4-second `motion.webm`; and a decoded, aspect-preserving `motion-strip.jpg`. The recording contains formation, mid-transition reversal, pause, resume toward dispersion, a complete formation and complete dissolution. It captures only the canvas; DOM screenshots and recorded command timestamps provide context.

The stills were inspected at readable size. Dispersion reads as a spatial cloud rather than a humanoid or single point. The midpoint retains depth, and the settled capture retains the accepted silhouette and gaps. Narrow framing contains the intermediate cloud without anatomical stretching or clipping. The conservative full-path fit and additional controls reduce on-screen figure size compared with Phase 4.5.

Time-separated decoded frames were inspected together with exact-path, bounded-step and reversal assertions. They show contraction, retracing after reversal, a held paused pose, resumed expansion and later endpoint transitions without observed reseeding or teleportation. No excessive sweep or chaotic excursion appears in those samples. **Direct real-time playback inspection, physical-display motion comfort and final motion approval remain unverified.** Sampled frames and automated continuity checks do not establish final motion quality.

## Reproduction

Start Vite on `127.0.0.1:5173` and production preview on `127.0.0.1:4173`. The local entry remains `http://localhost:5173/dev/entity.html`. For browser checks, launch disposable Chrome with `--headless=new --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1`. Run browser suites sequentially:

```powershell
npm run build
npm run lint
npm run format:check
node scripts/check-experience.mjs
node scripts/check-particles.mjs
node scripts/check-entity.mjs
node scripts/check-transition.mjs
$env:MISHAI_ENTITY_EVIDENCE_DIR = '../docs/implementation/evidence/phase-4.6/settled-regression/'
node scripts/check-entity-browser.mjs
node scripts/check-shell.mjs
node scripts/check-shell.mjs http://127.0.0.1:4173 http://127.0.0.1:5173
$env:MISHAI_EVIDENCE_DIR = '../docs/implementation/evidence/phase-4.6/regressions/'
node scripts/check-world.mjs
node scripts/check-world.mjs http://127.0.0.1:4173 --production --checks-only
node scripts/check-transition-browser.mjs
git diff --check
```

Overrides protect historical evidence. The transition script overwrites only Phase 4.6 captures/metrics. Test probes inspect the installed React/R3F renderer/controller references without adding runtime debug interfaces; review these test-side assumptions during dependency upgrades. Close disposable browser and servers after testing.

## Remaining limits and one bounded next step

Existing THREE.Clock deprecation, bundle warning, DPR-only-change limitation and context-restoration gap remain. Physical touch devices, screen readers, other browsers, long-run memory and power/thermal behavior remain unverified. Narrow inspection is deliberately scrollable, and final anatomy/motion quality remains provisional. No production reveal, chapter assembly, countdown, Big Bang, CREATE action, camera choreography, attraction, lines or adaptive system was implemented.

One proposed next step, not started: review the recorded sequence in real-time and operate this preview on one desktop and one narrow touch device, focusing on reversal comfort and reading/control access. Adjust only centralized motion bounds/duration if that evidence warrants it. Stop for Phase 4.6 review before authorizing chapter integration.
