# Application boundaries

## Observed implementation

| File / area                           | Current responsibility                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`                        | Synchronously mount React in StrictMode so native initial hashes/restoration find DOM targets; load CSS     |
| `src/app/App.tsx`                     | Own experience/motion state and Creator head target reconciliation; compose world, shell and motion control |
| `src/app/PortfolioShell.tsx`          | Registry-driven sections/navigation, current feedback, explicit activation, content states                  |
| `src/app/sections.ts`                 | Ordered semantic section IDs/labels and derived SectionId type                                              |
| `src/app/experience.ts`               | Read-only snapshot, state reducer, activation filter and pure selection policy                              |
| `src/app/useExperience.ts`            | App-owned React state, DOM measurements, event/observer scheduling and cleanup                              |
| `src/content/portfolio.ts`            | Typed supplied content; null represents missing biography, role details, or email                           |
| `src/world/scene/WorldCanvas.tsx`     | Compose ambient + head through the shared rendering surface and combined scheduling                         |
| `src/world/scene/RenderSurface.tsx`   | Own the single R3F Canvas, renderer initialization and frame scheduling for each entry                      |
| `src/world/scene/WorldBoundary.tsx`   | Isolate rendering failures and show a DOM status without removing the portfolio                             |
| `src/app/useBackgroundMotion.ts`      | User pause choice, live reduced-motion and document visibility; clean up both subscriptions                 |
| `src/app/BackgroundMotionControl.tsx` | Accessible native pause/resume button and reduced-motion explanation, outside Canvas                        |
| `src/world/scene/Scene.tsx`           | Compose independent ParticleField and CreatorHead renderers                                                 |
| `src/world/particles/`                | Central prototype parameters, deterministic typed arrays, batched rendering and bounded frame-local drift   |
| `src/config/rendering.ts`             | Background, DPR range, default quality constant                                                             |
| `src/types/world.ts`                  | QualityTier type only                                                                                       |
| `src/styles/global.css`               | Dark responsive layout, document scrolling, focus styles, live reduced-motion media query                   |

The five portfolio sections have native anchor navigation, current-section feedback, and explicit missing-content states. Phase 4.3 adds minimal experience state; cinematic chapter navigation and adaptive runtime remain unimplemented. The semantic registry does not finalize the planned chapter sequence.

## Implemented Phase 4.3 contract

`App` owns `useExperience`; only that hook dispatches experience updates. `PortfolioShell` receives the read-only `ExperienceSnapshot` and a section activation callback. The snapshot is `{ activeSection: SectionId | null, lastNavigation: { section: SectionId, sequence: number } | null }`, with readonly fields including the nested activation record. It begins with both values null on mount.

- `observed` sets only `activeSection`; unchanged selection preserves snapshot identity. The selection uses section geometry, not the hash or a requested destination.
- `navigated` sets only `lastNavigation`, incrementing a mount-local sequence on every accepted activation (including repeats). This is historical information, never a pending command, completion, or promise of visibility. A later activation supersedes it; unmount resets it. Scrolling, interruption, hash changes, history traversal, restoration, and reload do not create navigation intent.
- Only uncancelled primary clicks on the authored same-page section anchors qualify, including browser-generated clicks from keyboard activation. Modified clicks, alternate targets, download links, skip/top links and external links are excluded. No default action is prevented.

Phase 4.3 established the read-only experience boundary. Phase 4.8 now consumes observed `activeSection` in App to set a Creator head target. Such a consumer must distinguish historical explicit activation from current observation and must not replay `lastNavigation` as a fresh command on every observed update. App now owns a preview-tested regional controller for this head interaction; there is no event bus, global orchestration framework or R3F DOM-measurement loop. The world cannot write this snapshot. Its failure boundary remains independent.

Phase 4.4's actual world input is only `motionEnabled`, derived independently as `visible && !reducedMotion && !paused`. The ambient field has no section/color mapping; Phase 4.8 passes only the separate head runtime and visual-area ref alongside ambient motion permission. User pause lasts until toggled or the app unmounts; reduced-motion changes never erase that choice. Phase 4.8 keeps the native button enabled under reduced motion so explicit Resume can synchronize the head endpoint without enabling ambient animation. It sits in the normal header after section navigation, separate from the inert, aria-hidden canvas; the skip/brand/section keyboard order is preserved. Its status describes the user's motion permission, not successful WebGL rendering. No persistence or settings store exists.

The provisional policy uses a reading line at 28% of viewport height, a 12px retention margin to avoid boundary jitter, and the last actually visible section within 2px of the document bottom. Introduction, gaps and footer can select null. A passive scroll listener and resize/hash/pageshow listeners schedule at most one animation-frame measurement of five rectangles; body/section ResizeObservers cover flow layout changes. There is no idle polling. Every subscription, observer and queued frame is cleaned up, with a disposed guard for late callbacks. See the [Phase 4.3 report](../implementation/phase-reports/phase-4.3-report.md) for the complete policy, edge cases and verification.

## Phase 4.5 preview boundary

The public WorldCanvas now delegates its existing Canvas/renderer implementation to `src/world/scene/RenderSurface.tsx`. The development-only `src/dev/EntityPreview.tsx` also uses that surface and the existing world-only error boundary. Entity data/rendering live under `src/world/entity`. Phase 4.5 excluded those modules from the normal App; Phase 4.8 now permits shared runtime and CreatorHead while excluding the full-body preview. Preview DOM controls own only the chosen view and region, with no experience-state coupling, navigation events or per-frame state.

`/dev/entity.html` is a local Vite entry, omitted from production output. A build-graph guard and output/network checks enforce that isolation. Region labels map to conceptual body meaning but do not create chapter behavior. At Phase 4.5, public motion control said “Background motion off” while reduced motion disables it; the stored pause choice is unchanged.

## Phase 4.6 transition ownership

Phase 4.6 adds one development-only controller for normalized entity progress, destination and playback intent. `useSyncExternalStore` supplies stable snapshots on commands, policy changes and completion; frames mutate controller progress without notifying React. EntityPoints is the sole writer of runtime positions and uses R3F's frame loop. The preview owns view/region controls and reset; neither world nor controls consume/write the Phase 4.3 experience snapshot. `observeMotionPolicy` centralizes only media/visibility listeners; ambient pause and entity endpoint/inspection semantics remain separate. See the [Phase 4.6 report](../implementation/phase-reports/phase-4.6-report.md).

## Phase 4.7 independent regional ownership

The same preview-local controller now owns five independent progress/target/playing states in existing region order. Form, Dissolve, Pause and Resume require an explicit region or `all`; `all` broadcasts without shared progress. Scrub takes one region, preserves its target and pauses only it. A readonly live regional view feeds the single position writer; React receives cloned snapshots only for changed commands, policies and completion. No per-frame React publication or second controller exists.

Show region is draw-index filtering; Control region selects command scope. Neither selector issues a command. The all-region scrubber is disabled and its track hidden with an explanation, avoiding a fabricated combined value. Per-region DOM statuses are polite and non-live during frame advancement. Pause/Resume use `aria-disabled` with idempotent controller commands so keyboard focus survives activation and completion. One preview policy subscription cleans up on unmount. At Phase 4.7 completion, regional mechanics remained preview-only.

Phase 4.7 stopped before Creator/head integration. Phase 4.8 now implements that bounded public interaction below while preserving the late full-humanoid reveal. See the historical [Phase 4.7 report](../implementation/phase-reports/phase-4.7-report.md).

## Phase 4.8 public integration boundary

App owns the latest observed Creator target and explicit pause choice. `syncCreatorHead` reconciles those inputs with reduced motion and true document visibility through the shared controller, including a paused target update. Historical `lastNavigation` is never consumed. Initial progress is zero regardless of URL. The existing observation thresholds, anchors, focus and history behavior are unchanged.

PortfolioShell reserves a responsive visual rectangle using a ref passed to the head renderer. CreatorHead measures that rectangle outside its single R3F advancement callback, positions/scales only its own group uniformly and scissors its draw. It never controls the public camera or ambient transform. The same reserved rectangle excludes the text scrim locally. R3F owns GPU disposal. Public motion wording covers both consumers, and the scheduler runs if ambient permission OR head advancement requires frames. Full-body preview controls and test fixtures remain forbidden in production.

This is a reversible local Creator interaction, not cumulative chapter assembly. Only head/neck particles are integrated; all other anatomical regions and the complete humanoid remain preview-only. See [Phase 4.8](../implementation/phase-reports/phase-4.8-report.md).

## Recovered architecture intent

- React / semantic DOM owns readable content, navigation, controls, and accessible feedback.
- R3F / Three.js owns scene objects, spatial presentation, camera behavior, and rendering lifecycle.
- Per-frame changes belong in the rendering layer, not top-level React state updates on every frame.
- A coordination layer connects narrative intent and world responses without letting individual systems fight over state.
- Shader code owns GPU visual computation when introduced; it does not own semantic navigation or portfolio content.
- Scene remains a composition root. Features belong in their own modules rather than accumulating in one scene file.

## Future state ownership to finalize

| State class                                | Proposed owner                     | Update character                             |
| ------------------------------------------ | ---------------------------------- | -------------------------------------------- |
| Content / navigation / selected item       | DOM application state              | Discrete user actions                        |
| Chapter intent and world transition intent | Experience coordinator             | Discrete transitions and controlled progress |
| Frame-local transforms / particle uniforms | World runtime refs / scene systems | Frame updates                                |
| Reduced-motion and device-quality policy   | Accessibility / quality systems    | Preference or measured capability changes    |

These broader categories are not implemented store schemas. Phase 4.3 uses React's reducer and effects for the small contract above; Zustand is unnecessary for this scope. Each mutable property needs one authoritative writer; further ownership must be recorded before multiple controllers are introduced.

Keep user input and explicit commands distinguishable from inferred intent. Render state should express the chosen experience state; it should not independently decide business/content actions.

## Folder policy

Use the existing `src/world` boundary. Earlier planning suggested `src/experience` and other possible folders; these were proposals. Do not rename the current tree merely to mimic a historical sketch.

Create feature folders when a scoped implementation needs them. Future particles, entity, camera, interaction, motion, accessibility, and quality modules are responsibilities, not permission to generate empty scaffolding for every concept.

## Lifecycle and failure requirements

Listeners, observers, frame subscriptions, and GPU resources must have explicit cleanup. R3F owns canvas sizing and teardown. Renderer construction occurs in the Canvas callback ref so React's boundary can catch a synchronous initialization failure before R3F's asynchronous configure path. The renderer ref is reused during StrictMode ref reattachment. The boundary surrounds only the world; its fallback is a visible DOM status and does not hide the portfolio. Context-loss recovery remains open.

Phase 4.2 removed root overflow clipping and fixed root height. The document owns scrolling; the background alone is fixed to the viewport. The world is inert, hidden from accessibility APIs, and ignores pointer input. The header remains in normal flow, and sections have a 2rem scroll margin. A live CSS `prefers-reduced-motion` query disables native smooth anchor scrolling without a JavaScript subscription. This is a bounded shell policy, not a future cinematic-scroll decision.
