# Phase 4.8 — Creator Section → Head Formation Integration

Started 2026-11-01; completed 2026-11-02. Reviewed baseline `14fcca7`, branch `main`; working tree was clean before the original work. On resumption, the unfinished Phase 4.8 changes and before captures were preserved. Status: **complete locally; ready for Phase 4.8 review**. No commit, push, deployment or later phase is included.

## Behavior contract recorded before implementation

Observed `activeSection === 'creator'` requests formed head progress 1; any other section or null requests dispersed progress 0. Forward/reverse entry use the same rule, interruptions reverse from the current pose, and repeated observations do not restart. `lastNavigation` remains historical and is not an input. Start at dispersed progress before any observation, including deep links/reloads/restoration; do not infer a formed pose from the URL. Native anchors, history, focus, scrolling and selection thresholds remain unchanged.

Priority: explicit user pause freezes progress and retains the latest observed target; reduced motion synchronizes to that target only when unpaused; document visibility gates animated advancement independently; normal visible/unpaused motion advances with the existing first-frame guard and capped delta. Resume under reduced motion selects the latest endpoint immediately while ambient motion stays off. Hidden time never catches up. Section-relative placement and clipping prevent a paused pose drifting over unrelated content.

The public motion control governs ambient and head movement and remains available under reduced motion so a user can explicitly resume endpoint synchronization. One shared Canvas and unchanged public camera render the ambient field and only the existing head/neck subset. A reserved responsive Creator visual area determines uniform placement and clipping. Other entity regions remain development-preview-only; this is a local Creator interaction, not cumulative chapter assembly or a full-body reveal.

Before captures: `evidence/phase-4.8/desktop-before.png` and `narrow-before.png`, both normal `/#creator` at 100% zoom, with baseline geometry/browser details in `before.json`. The short baseline Creator block placed Projects at the reading line; the new visual area's reserved dimensions will naturally enlarge Creator without changing observation thresholds.

## Implemented scope and ownership

**Main website visual change: the Creator section now contains the real 284-particle head/neck, alongside Ankit's supplied name and the explicit missing-biography state.** The normal application URL and production preview both render it. Other regions and the complete humanoid remain preview-only. This does not complete the portfolio or implement the late full-body reveal.

| File / area                                                           | Responsibility                                                                                                                                                             |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/App.tsx`                                                     | Own the head controller and Creator-area ref; reconcile observed activeSection with motion policy in a layout effect                                                       |
| `src/app/useBackgroundMotion.ts`, `BackgroundMotionControl.tsx`       | Expose actual visibility and retain one preference/visibility subscription; public Pause/Resume wording covers background and Creator head, including under reduced motion |
| `src/app/PortfolioShell.tsx`, `src/styles/global.css`                 | Reserve desktop side-by-side and narrow stacked visual space without changing supplied content or navigation                                                               |
| `src/world/entity/transition.ts`                                      | Reuse the regional controller with an optional initial endpoint and paused target updates; preview defaults and frame mechanics remain intact                              |
| `src/world/entity/head.ts`                                            | Head-only sampling, deterministic local dispersion parameters and policy reconciliation through the shared controller                                                      |
| `src/world/entity/CreatorHead.tsx`                                    | Stable head geometry/material, DOM-relative uniform placement, scissor clipping and one R3F advancement/evaluation callback                                                |
| `src/world/scene/WorldCanvas.tsx`, `Scene.tsx`                        | Compose ambient and head in one Canvas; combine ambient permission OR head advancement for frame scheduling                                                                |
| `vite.config.ts`                                                      | Permit shared entity runtime while rejecting preview entry/controls, full-body renderer and test modules                                                                   |
| `scripts/check-head.mjs`, `check-head-browser.mjs`, `record-head.mjs` | Pure policy/data checks, integrated development/production checks, main-page stills and composited recording                                                               |
| Existing browser scripts and lifecycle fixture                        | Update only authorized expectations; retain anatomy, regional mechanics, navigation, fallback and cleanup coverage                                                         |

App's effect depends on observed `activeSection`, explicit user pause, reduced motion and true document visibility. It never reads `lastNavigation`, hashes or navigation sequence to issue a head command. Controller progress begins at 0 before observation. The public renderer initially copies the dispersed head array; it never mounts the full-body renderer. Default preview construction still begins settled, preserving its contract.

The shared `setTarget(selection, endpoint, paused)` operation retains the latest target while freezing progress when paused. Form/Dissolve in the preview remain unpaused endpoint commands. `syncCreatorHead` pauses first if required, then applies real policy, then the observed target. This ordering prevents a simultaneous pause/preference change from snapping a paused pose. A normal target change retains current progress; repeated observations retain controller/snapshot identity and do not restart. Completion and policy/command changes publish snapshots; accepted animation frames do not notify React.

| Situation                           | Head                                                                                               | Ambient                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| Unpaused, normal motion, visible    | Advance toward current observed target                                                             | Existing bounded drift     |
| User paused, any section/preference | Freeze current pose; update retained target only                                                   | Freeze                     |
| Unpaused, reduced motion            | Select observed endpoint immediately, including explicit Resume                                    | Remain off                 |
| Hidden, normal motion               | Preserve intent but advance no time                                                                | Advance no time            |
| Visible again                       | Reconcile observation/policy, skip first advancing frame and cap deltas; never resume a user pause | Existing skip/cap behavior |

Reduced-motion endpoint synchronization is a policy change, not replayed elapsed time; it has priority over the visibility gate when unpaused. The existing five-second full-range duration, 50ms delta cap and per-region first-frame protection remain unchanged. No hidden duration is accumulated.

## Shared Canvas, local placement and clipping

The public scene has one fixed inert Canvas with the original camera at `[0,0,6]`, FOV 50 and DPR clamp `[1,2]`. The ambient field retains its data, material, aspect transform and time accumulator. The head owns a separate Points/geometry/material; its parent group alone receives uniform scale and translation. Preview camera-fitting logic is not used publicly.

PortfolioShell reserves `.creator-visual` at 24rem high on desktop and 20rem on the narrow stacked layout, before renderer initialization. Desktop text and head occupy separate columns. The narrow figure follows the existing name/biography text. These dimensions remain present under WebGL failure, so the renderer does not cause a layout shift. No biography, project copy, claim or contact detail was fabricated.

A layout effect reads the visual area's DOM rectangle and converts pixel placement to world coordinates at the existing camera's zero plane. One queued measurement coalesces scroll/resize/pageshow events; ResizeObserver covers the area and body. Measurements mutate only head transform/clipping and invalidate a static frame. They do not run in the animation callback or update React on scroll frames. Cleanup cancels queued work, removes listeners, disconnects observers and clears the local scrim exclusion.

The head's draw uses a WebGL scissor intersected with the viewport; scissor testing is disabled immediately afterward. When the reserved area is entirely offscreen, the head group is invisible without changing controller progress. Thus a user-paused head cannot float over Projects or unrelated text. While the Creator area is partially visible in the introduction viewport, only its own clipped dispersed cloud may be visible below the introduction; nothing is drawn over the introduction itself.

The existing dark text scrim initially made the enlarged head too faint. Final composition excludes only the reserved visual rectangle from the scrim using a CSS even-odd polygon. Text areas retain the original scrim; the ambient particles themselves are unchanged. `desktop-inspection.png` preserves the pre-adjustment inspection for honesty. The final before/after images use the corrected composition.

## Data preservation and public composition parameters

The complete entity config, anatomy, gaps, sampler, region precedence, IDs and colors are unchanged. `sampleHead` extracts existing head-region indices in their original order: exactly 284 head/neck particles. It copies their settled positions and colors exactly. Only these compact arrays reach the public geometry; there is no public draw of dispersed arms, torso, spine or lower body. Full-body data generation remains a one-time CPU sampling source, not additional public geometry.

| Public-only parameter | Value / purpose                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Local center          | `[0,1.73,0]`, centered on the accepted head/neck subset                                        |
| Dispersed half-bounds | `[0.55,0.55,0.28]`, mapped from each stable ID's existing seeded dispersion coordinate         |
| Uniform fit factor    | `0.82`, keeping the complete local transition inside its reserved area with perspective margin |
| Point size            | `0.035`, for legibility at the public camera distance                                          |
| Opacity / colors      | Existing `0.7` opacity and original per-particle palette                                       |
| Settled endpoint      | Exact source coordinates before a fixed-per-layout uniform placement transform                 |

This is the explicitly authorized head-only composition decision, not hidden removal of particles from the full preview. Straight smoothstep paths, exact endpoint copies and deterministic identity are preserved. The new local envelope applies only to the public head. No new anatomy, facial details, glowing surface, shader or dependency was added.

## Production boundary and scheduling

The build still uses only `index.html` as the production entry. Its graph guard now rejects `src/dev`, `scripts` and the full-body `EntityPoints` renderer, while allowing shared config/anatomy/sampling, transition and head modules. Output/network checks continue excluding development UI, fixtures and debug globals. The full-body preview remains available only through its separate development entry.

Public `RenderSurface` runs continuously only for ambient motion permission OR actual head advancement. Otherwise it uses demand rendering. Scroll-based placement, resize and target/policy changes still invalidate required static frames. There is one authoritative head controller and one head R3F advancement path; no new render loop, global orchestration system or per-frame React notification was introduced. Both renderers keep their resources through section changes and pause. R3F owns disposal.

## Checks and measurements

Environment: Windows, Node 24.17.0, headless Chrome 156.0.8078.74, ANGLE / Intel Iris Xe / Direct3D11. Main-page captures use DPR 1, 100% browser zoom and no open DevTools. Narrow viewports are emulated, not physical-device evidence. FFmpeg 8.1.1, already installed on the machine, encodes actual composited browser frames; no application dependency was added.

Pure checks cover exact head IDs/colors/settled positions, repeatable local dispersion, 101 bounded progress values, initial dispersion, target reversal/repetition, paused latest-target retention, simultaneous pause/reduced-motion priority, explicit Resume under reduced motion, hidden/visible transitions, capped/skipped time, stopping and untouched non-head regional state. Earlier experience, ambient, anatomy and regional transition checks are retained.

Build/type checking, lint, formatting, all listed pure/browser suites, recording assertions and `git diff --check` pass. Documentation links and unchanged historical reports/evidence were also checked.

The new integrated browser suite runs against both development and production preview. It checks observed targets, repeat observations without notifications, rapid reversal, paused navigation, reduced-motion changes, exact buffer/evaluator agreement, one Canvas, stable geometry/material/attributes, head-only counts, uniform placement, rectangle scissoring, static settling, native tab hiding, direct links, reload and history return. Existing shell tests retain native keyboard, scroll/focus/history, restoration and unavailable/throwing WebGL coverage. Existing settled and regional preview suites retain full-body endpoints, anatomy, independent controls and active cleanup.

Two active public StrictMode teardown/remount cycles verify head geometry/material disposal, no later advancement, zero preference/visibility listeners, zero tracked layout listeners/ResizeObservers and zero geometry/program resources after context release. The runtime has one shared media/visibility subscription; the fixture adds only test-side lifecycle instrumentation. Native tab hiding worked in the measured environment; a synthetic paused-visibility combination also tests pause priority.

| Scenario                                  | Draw calls / points              | Geometry / textures / programs | Observed head footprint                      |
| ----------------------------------------- | -------------------------------- | ------------------------------ | -------------------------------------------- |
| Desktop Creator, 1440 × 1000 CSS viewport | 2 / 564 (280 ambient + 284 head) | 2 / 0 / 1                      | About 165 × 222 CSS px formed                |
| Narrow Creator, 390 × 844 CSS viewport    | 2 / 564                          | 2 / 0 / 1                      | About 131 × 190 CSS px formed                |
| Projects, head area offscreen             | 1 / 280                          | 2 / 0 / 1                      | No head draw; retained paused pose unchanged |
| After active unmount                      | Last-frame counters retained     | 0 / 0 / 0                      | Canvas removed, context released             |

The 15px browser scrollbar accounts for drawing buffers of 1425 × 1000 and 375 × 844 at these viewports. Camera position stays `[0,0,6]`; all sampled head buffers match the deterministic evaluator exactly and original colors remain exact. Shared point shaders reuse one program. The changed Creator height lengthens native smooth scrolling; the ambient regression now waits for actual anchor/focus scroll completion before asserting idle-frame settling, rather than mistaking legitimate placement invalidations for idle animation.

| Production build    | Reviewed Phase 4.7 | Phase 4.8   | Change   |
| ------------------- | ------------------ | ----------- | -------- |
| Transformed modules | 45                 | 51          | +6       |
| JavaScript          | 1,082.23 kB        | 1,091.36 kB | +9.13 kB |
| JavaScript gzip     | 297.47 kB          | 300.68 kB   | +3.21 kB |
| CSS                 | 11.06 kB           | 11.35 kB    | +0.29 kB |

The existing large-chunk warning and R3F `THREE.Clock` deprecation remain visible. No unrelated dependency upgrade, warning suppression, FPS, power, thermal or long-session performance claim is made.

## Main-page evidence and visual assessment

See [evidence index](../evidence/phase-4.8/README.md), [development measurements](../evidence/phase-4.8/head-metrics.json), [production measurements](../evidence/phase-4.8/production-head-metrics.json) and [recording actions](../evidence/phase-4.8/recording.json).

Desktop before/after use `/#creator`, 1440 × 1000 and 100% zoom; narrow before/after use the same anchor at 390 × 844. Before images were saved before source edits on November 1. After images retain real DOM content and the native anchor focus outline. Formed and intermediate Creator views, Introduction and paused Projects views are included. The pre-adjustment scrim inspection remains labeled separately from final evidence.

The roughly 18-second `page-motion.webm` contains the composited page, not just the WebGL canvas: introduction, native Creator entry, formation, Projects exit, reverse entry, pause, navigation while paused and Resume. Browser screencast frames retain their timing and are encoded into a standalone WebM. The action log records exact progress, target/policy state and native hash/observation at input time. Its paused navigation samples have identical progress. `page-motion-strip.png` decodes time-separated full-page frames for inspection. Capture cadence is evidence capture overhead, not an application FPS measurement.

Actual stills and decoded page frames were inspected. Desktop text and head have separate areas; the name and missing-biography line remain readable. The head/neck outline is legible at 100% zoom and retains the sparse, incomplete anatomy rather than adding a face or a solid mask. The narrow layout stacks text above a visible head and stays within the viewport width. Partial viewport clipping follows the reserved area. Projects has no floating paused head, and Introduction has no head over its text. Ambient particles remain visible in and around the visual area; the head is now distinguishable without thousands of dispersed non-head entity particles.

This is a bounded visual assessment of captured desktop/emulated-narrow output, not final art approval. Direct real-time human playback/comfort review, physical touch devices, screen readers, other browsers, long-run memory and power remain **unverified**. Existing DPR-only-change and runtime context-restoration gaps remain. Biography, project details/assets and contact email are still missing and explicit.

## Reproduction and review stop

Run Vite at `127.0.0.1:5173`, production preview at `127.0.0.1:4173`, and disposable headless Chrome with localhost remote debugging on port 9222. Browser suites run sequentially because foreground visibility is part of the tests. Use the evidence overrides below to preserve historical artifacts.

```powershell
npm run build
npm run lint
npm run format:check
node scripts/check-experience.mjs
node scripts/check-particles.mjs
node scripts/check-entity.mjs
node scripts/check-transition.mjs
node scripts/check-head.mjs
node scripts/check-head-browser.mjs
node scripts/check-head-browser.mjs http://127.0.0.1:4173 --production
node scripts/check-shell.mjs
node scripts/check-shell.mjs http://127.0.0.1:4173 http://127.0.0.1:5173
$env:MISHAI_EVIDENCE_DIR = '../docs/implementation/evidence/phase-4.8/regressions/'
node scripts/check-world.mjs
node scripts/check-world.mjs http://127.0.0.1:4173 --production --checks-only
$env:MISHAI_ENTITY_EVIDENCE_DIR = '../docs/implementation/evidence/phase-4.8/settled-regression/'
node scripts/check-entity-browser.mjs
$env:MISHAI_TRANSITION_EVIDENCE_DIR = '../docs/implementation/evidence/phase-4.8/regional-regression/'
node scripts/check-transition-browser.mjs
node scripts/record-head.mjs
git diff --check
```

Recording requires the installed `ffmpeg` executable on PATH; raw temporary frames stay under the ignored `node_modules/.cache` directory. Browser probes/fixtures are test-side only and inspect installed React/R3F references without adding production debug interfaces. Close temporary browser/server processes afterward.

One proposed next bounded task: **real-device and accessibility validation of the existing Creator/head integration** on one desktop, one narrow touch device and a screen reader, including reduced-motion synchronization and real-time reversal comfort. Do not expand to arms/torso/lower body, full reveal, countdown/Big Bang, CREATE, final chapter mapping, camera choreography, shaders/postprocessing or adaptation. [Vision progress](../vision-progress.md) distinguishes this integrated head from preview-only full-body mechanics and unimplemented cinematic work. **Stop after Phase 4.8 for review.**
