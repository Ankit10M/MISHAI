# Phase 4.7 — Independent Region Assembly

Date: 2026-11-01. Base: reviewed Phase 4.6 commit `38793ac`, branch `main`. The working tree was clean at inspection. Read the existing vision, experience constitution, architecture, entity decisions and Phase 4.6 report before implementing. Historical reports and evidence are preserved.

Status: **complete locally for bounded preview mechanics; ready for review**. This is the last planned isolated mechanics step. No later phase, public entity integration, commit, push or deployment was started.

**Main website visual change: none; regional mechanics remain preview-only.**

## State and command contract

`transition.ts` extends the existing controller rather than introducing a second writer. Five states in `ENTITY_REGIONS` order each own `{ progress, target, playing }`: head, arms, torso, spine and lower body. Initial progress/target is 1, playing is false. There is no global progress, invented average or automatic regional sequence. The live readonly `getRegions()` view feeds rendering; `getProgress(region)` requires one region. `getSnapshot()` clones the five states only at meaningful changes and includes shared reduced-motion/visibility policy and `advancing`.

| Command                             | Contract                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `form(region)` / `dissolve(region)` | Target 1 / 0 from that region's current pose; opposite commands reverse without changing position. Repeated active commands to the same endpoint are no-ops. |
| `form('all')` / `dissolve('all')`   | Broadcast to each current regional state, preserving mixed poses; no global reset or synchronization.                                                        |
| `pause(region or 'all')`            | Clear affected playing intent, preserving progress and endpoint. Unaffected work continues.                                                                  |
| `resume(region or 'all')`           | Continue only states whose current progress differs from their retained target and policy allows motion. Repeated Resume does not restart active work.       |
| `scrub(region, value)`              | One region only; reject non-finite values, clamp to `[0,1]`, pause that region, retain its target.                                                           |
| `reset()`                           | Stop all at exact settled progress/target 1. Preview also restores front view, Show region = all and Control region = all.                                   |
| Completion                          | Stop exactly at the individual endpoint. Publish completion; other regions keep advancing. The final active region's completion settles rendering.           |

Commands notify once only if a region's progress, endpoint or playing intent actually changes. Frames publish only when a region completes; simultaneous completions publish once. There are no per-frame React progress notifications. Reversal preserves position continuity, not velocity continuity, as in Phase 4.6.

## Source preservation and whole-body compatibility

`config.ts`, `anatomy.ts`, `sampleEntity.ts`, the source palette, missing patches and sampling order are unchanged. The 2,600 IDs retain exclusive membership: head 284, arms 609, torso 571, spine 65, lower body 1071. Seed 4505 supplies settled data; dispersion seed 4606 and its X ±2, Y ±2.25, Z ±1.3 box are unchanged.

The old scalar `evaluatePositions` remains as the whole-body compatibility reference. `evaluateRegionalPositions` reads each particle's stable membership and uses that region's progress with the same `p²(3−2p)` interpolation equation and exact endpoint coordinate copies. All-zero matches dispersed positions bit-for-bit; all-one matches settled positions bit-for-bit. Tests compare the regional output against the old scalar evaluator at 101 equal-progress values, preserving earlier reverse-path, source immutability, finite-bound and camera-fit assertions. Mixed-state tests prove unaffected particles retain exact positions. Inputs are existing typed internal data, not a new external asset interface.

The five-second full-range duration, 50ms accepted delta cap (maximum progress step 0.01), front/36-degree views, uniform `[1,1,1]` scale and fixed conservative union framing remain unchanged. Partial transitions take proportional accepted simulation time. Slow frames prolong playback instead of catching up.

## Visibility, targeting and accessibility

Show region changes only the existing index buffer/draw range. Control region chooses one region or all regions for explicit Form, Dissolve, Pause and Resume. Changing either selector does not issue a command or change a pose. Hidden particles still evaluate from their own region states, so re-showing them preserves their paths.

Buttons have scoped accessible names such as `Dissolve: Head`, and visible text states the current command scope. A native range inspects only the selected control region and pauses only that region. For all regions the range is disabled, its track is hidden, and a short explanation replaces any apparent aggregate value. The label/helper documents its non-live behavior: values update on commands, policy changes and completion, not each animation frame.

A compact polite DOM status list reports all five regions, including settled/dispersed/paused/forming/dissolving/hidden suspension and a retained Resume destination where applicable. It never announces each frame. Pause/Resume use `aria-disabled` and idempotent controller semantics so activation does not remove keyboard focus. Browser testing initially caught focus dropping when native `disabled` was applied to the focused Pause button; that was corrected and the keyboard regression passes. The controls remain usable with WebGL fallback. No HUD, per-particle React components or accessibility dependency was added.

## Scheduling, policy and resource ownership

One EntityPoints R3F `useFrame` callback advances the regional controller, then evaluates the existing runtime position buffer if any progress changed. Each region has its own first-advancing-frame guard, including when another region is already running. React snapshots drive the existing `RenderSurface` `always`/`demand` switch. Animation runs only while at least one region has active intent, the document is visible and reduced motion is off. Static command commits, view/filter changes and resize invalidate through the existing layout/R3F path.

Reduced-motion endpoint commands settle only their target regions immediately. Enabling the preference settles currently playing regions to their individual destinations, including hidden active intent; paused/inspected states remain unchanged. Disabling the preference never restarts work. Tab hiding preserves intent but advances no state; return skips stale time and resumes only active intent. User-paused regions stay paused.

One `observeMotionPolicy` subscription per preview owns one media listener and one visibility listener. The public ambient hook is unchanged. One Points object, geometry, material and stable position/color/index attributes remain mounted through commands, visibility, view and resize. R3F retains disposal and frame-subscription ownership. No polling, separate animation loop, new dependency, orchestration framework or public controller import was introduced.

## Verification and measurements

Windows, Node 24.17.0, disposable headless Chrome 156.0.8078.74, ANGLE / Intel Iris Xe / Direct3D11. Entity evidence uses DPR 1 and 100% browser zoom. Emulated viewports do not establish physical mobile performance.

| Scenario                                                | CSS viewport / observed drawing buffer | Points / draws               | Geometry / textures / programs |
| ------------------------------------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Wide settled, head-only formed, head+arms formed, mixed | 1440 × 1000 / 1440 × 692               | 2600 / 1                     | 1 / 0 / 1                      |
| Wide arms visible while head controlled                 | 1440 × 1000 / 1440 × 692               | 609 / 1                      | 1 / 0 / 1                      |
| Narrow mixed and equal-progress views                   | 390 × 844 / 390 or 375 × 320           | 2600 / 1                     | 1 / 0 / 1                      |
| Playing resized head isolation                          | 800 × 900 / 800 × 495                  | 284 / 1                      | 1 / 0 / 1                      |
| Each active StrictMode teardown                         | Canvas removed, context released       | Last-frame counters retained | 0 / 0 / 0                      |

The scrollable narrow layout and full-document screenshot capture can report a 15px scrollbar width difference; raw observations are retained rather than normalized. Wide camera Z is 7.7895295, unchanged across the compared poses. All sampled buffers exactly matched the regional evaluator (maximum coordinate error 0), colors matched source, and geometry/material/attribute identity stayed stable. Following a 300ms settling interval, 500ms observations recorded no extra frames when idle. Native tab switching reported hidden; the synthetic fallback was not used. One second hidden advanced no head progress and left the inspected arms at 0.37. Measured head steps around reversal/resume were below the 0.01 cap. `metrics.json` stores live regional states separately from the intentionally non-live published snapshots; its legacy `progress` probe field is explicitly head progress, not an aggregate. `maxStep` includes deliberate scrub/endpoint jumps and is not a playback-only continuity measurement.

Checks:

- Build/type checking, lint, formatting and `git diff --check`; existing experience, particle and entity pure checks; extended transition pure checks.
- Exact endpoints/equal-progress equivalence; unchanged anatomy, IDs/colors/membership, immutable source arrays, bounds and uniform camera fit.
- Mixed settled/dispersed/paused/moving states; concurrent opposite directions; targeted reversal, repeated commands, pause/resume, single-region scrub, broadcasts and reset.
- No per-frame subscriber notifications; individual first-resume guard and delta cap; non-finite/negative input handling; mixed reduced-motion and hidden-tab rules; exact endpoint stopping.
- Existing settled-entity browser suite; current regional suite with full dispersed/equal-progress buffer checks, visibility/target independence, active view/resize, stable resources, keyboard/focus, readable statuses and fallback.
- Completion of the head while arms continue, then demand settling when arms finish; two active StrictMode teardown/remount cycles with zero policy listeners, exactly one geometry/material disposal per cycle, released context, zero geometry/program resources and no advancement in any region after unmount.
- Existing public shell and ambient-world browser checks in development and production, including native navigation/history, reduced motion, stored pause, visibility and fallback. Production graph/output guards and normal-app network exclusion remain enforced.

The production build still transforms 45 modules and produces about 1,082.23 kB JavaScript / 297.47 kB gzip. Existing large-chunk and R3F `THREE.Clock` deprecation warnings remain visible and tracked. No FPS, GPU-time, thermal, power, long-session memory or device-readiness claim is made.

## Visual evidence and assessment

See [evidence index](../evidence/phase-4.7/README.md) and [raw metrics](../evidence/phase-4.7/metrics.json). The five primary captures are `head-formed.png`, `head-arms-formed.png`, `mixed.png`, `settled.png` and `narrow-mixed.png`. Wide comparisons retain front view, 1440 × 1000 viewport, Control region = head, all particles visible, normal motion policy at capture time and consistent framing. Mixed progress is `[1,1,0.45,0,0.25]`. Endpoint commands under reduced motion prepare exact poses; the policy is returned to normal before capture.

The roughly 15.4-second `motion.webm` records independent head/arms commands, head reversal, arms paused while the head moves, arms resume and an eventual broadcast formation. Actual timestamps and regional states accompany it; this is a test sequence, not an application assembly timeline. `motion-strip.jpg` contains decoded time-separated frames. Stills and decoded frames were inspected.

The dispersed cloud visibly competes with the formed head, and the arms are less legible than in the full settled body. The mixed torso adds overlap. The head still reads as a compact outline, but this is not approval of a final Creator composition. Narrow framing contains the cloud without stretching/clipping; the smaller figure and scrollable controls limit inspection convenience. No particle density, palette, source data or visibility was changed to improve these images. The compressed motion strip is faint; the PNGs preserve shape detail better.

Direct real-time human playback inspection, physical-display comfort, real touch devices, screen readers, other browsers, final art/motion approval and long-run performance remain **unverified**. Existing DPR-only-change and runtime context-restoration gaps remain. These limits are carried into the bounded integration review rather than expanded into additional speculative mechanics phases.

## Reproduction

Start Vite on `127.0.0.1:5173`, build and start production preview on `127.0.0.1:4173`. Launch disposable Chrome with `--headless=new --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1` and a disposable user-data directory. Browser suites must run sequentially because they exercise foreground/tab policy.

```powershell
npm run build
npm run lint
npm run format:check
node scripts/check-experience.mjs
node scripts/check-particles.mjs
node scripts/check-entity.mjs
node scripts/check-transition.mjs
node scripts/check-transition-browser.mjs
$env:MISHAI_ENTITY_EVIDENCE_DIR = '../docs/implementation/evidence/phase-4.7/settled-regression/'
node scripts/check-entity-browser.mjs
node scripts/check-shell.mjs
node scripts/check-shell.mjs http://127.0.0.1:4173 http://127.0.0.1:5173
$env:MISHAI_EVIDENCE_DIR = '../docs/implementation/evidence/phase-4.7/regressions/'
node scripts/check-world.mjs
node scripts/check-world.mjs http://127.0.0.1:4173 --production --checks-only
git diff --check
```

The transition suite now writes Phase 4.7 evidence; prior suites use directory overrides to preserve historical captures. Test probes inspect installed React/R3F references without a runtime debug API. Revisit those test-side assumptions when dependencies change. Close the disposable browser and servers after checks.

## Progress and next bounded task

[Vision progress](../vision-progress.md) tracks original intent, implementation reach, evidence/limits and the next concrete step per capability. Main website visual change: none; regional mechanics remain preview-only.

Proposed next task: **Creator section → head formation integration**. Before coding, define forward scroll entry/exit, reverse-scroll reversal, direct-link/reload entry, reduced-motion endpoints and public pause behavior. Decide how observed Creator state owns head targets without treating historical explicit navigation as a fresh command. Preserve native navigation, readable content, ambient behavior and failure isolation. Keep all other regions out of early assembly so the full-humanoid reveal remains late. Review dispersed-cloud competition in that actual content composition; do not silently hide it in evidence.

No final chapter map, automatic assembly timeline, countdown, Big Bang, CREATE reveal, camera choreography, new anatomy, shaders, postprocessing, adaptive system or dependency is included. **Stop for Phase 4.7 review.**
