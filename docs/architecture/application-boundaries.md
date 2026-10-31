# Application boundaries

## Observed implementation

| File / area                         | Current responsibility                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/main.tsx`                      | Mount React in StrictMode; load global CSS                                                 |
| `src/app/App.tsx`                   | Own experience state; compose independent WorldCanvas and PortfolioShell siblings          |
| `src/app/PortfolioShell.tsx`        | Registry-driven sections/navigation, current feedback, explicit activation, content states |
| `src/app/sections.ts`               | Ordered semantic section IDs/labels and derived SectionId type                             |
| `src/app/experience.ts`             | Read-only snapshot, state reducer, activation filter and pure selection policy             |
| `src/app/useExperience.ts`          | App-owned React state, DOM measurements, event/observer scheduling and cleanup             |
| `src/content/portfolio.ts`          | Typed supplied content; null represents missing biography, role details, or email          |
| `src/world/scene/WorldCanvas.tsx`   | Create the single R3F Canvas; configure renderer and camera                                |
| `src/world/scene/WorldBoundary.tsx` | Isolate rendering failures and show a DOM status without removing the portfolio            |
| `src/world/scene/Scene.tsx`         | Scene composition placeholder; currently returns null                                      |
| `src/config/rendering.ts`           | Background, DPR range, default quality constant                                            |
| `src/types/world.ts`                | QualityTier type only                                                                      |
| `src/styles/global.css`             | Dark responsive layout, document scrolling, focus styles, live reduced-motion media query  |

The five portfolio sections have native anchor navigation, current-section feedback, and explicit missing-content states. Phase 4.3 adds minimal experience state; cinematic chapter navigation and adaptive runtime remain unimplemented. The semantic registry does not finalize the planned chapter sequence.

## Implemented Phase 4.3 contract

`App` owns `useExperience`; only that hook dispatches experience updates. `PortfolioShell` receives the read-only `ExperienceSnapshot` and a section activation callback. The snapshot is `{ activeSection: SectionId | null, lastNavigation: { section: SectionId, sequence: number } | null }`, with readonly fields including the nested activation record. It begins with both values null on mount.

- `observed` sets only `activeSection`; unchanged selection preserves snapshot identity. The selection uses section geometry, not the hash or a requested destination.
- `navigated` sets only `lastNavigation`, incrementing a mount-local sequence on every accepted activation (including repeats). This is historical information, never a pending command, completion, or promise of visibility. A later activation supersedes it; unmount resets it. Scrolling, interruption, hash changes, history traversal, restoration, and reload do not create navigation intent.
- Only uncancelled primary clicks on the authored same-page section anchors qualify, including browser-generated clicks from keyboard activation. Modified clicks, alternate targets, download links, skip/top links and external links are excluded. No default action is prevented.

The future world integration boundary is a typed `ExperienceSnapshot` prop from App to a real world consumer when one exists. Such a consumer must distinguish historical explicit activation from current observation and must not replay `lastNavigation` as a fresh command on every observed update. There is no world consumer or prop plumbing today, and no event bus, context/store framework, transition state, or R3F measurement loop. The world cannot write this snapshot. Its failure boundary remains independent.

The provisional policy uses a reading line at 28% of viewport height, a 12px retention margin to avoid boundary jitter, and the last actually visible section within 2px of the document bottom. Introduction, gaps and footer can select null. A passive scroll listener and resize/hash/pageshow listeners schedule at most one animation-frame measurement of five rectangles; body/section ResizeObservers cover flow layout changes. There is no idle polling. Every subscription, observer and queued frame is cleaned up, with a disposed guard for late callbacks. See the [Phase 4.3 report](../implementation/phase-reports/phase-4.3-report.md) for the complete policy, edge cases and verification.

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
