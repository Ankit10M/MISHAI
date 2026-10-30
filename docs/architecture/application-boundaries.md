# Application boundaries

## Observed implementation

| File / area                         | Current responsibility                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/main.tsx`                      | Mount React in StrictMode; load global CSS                                                |
| `src/app/App.tsx`                   | Compose independent WorldCanvas and PortfolioShell siblings                               |
| `src/app/PortfolioShell.tsx`        | Semantic content, native anchor navigation, skip link, missing-content states             |
| `src/content/portfolio.ts`          | Typed supplied content; null represents missing biography, role details, or email         |
| `src/world/scene/WorldCanvas.tsx`   | Create the single R3F Canvas; configure renderer and camera                               |
| `src/world/scene/WorldBoundary.tsx` | Isolate rendering failures and show a DOM status without removing the portfolio           |
| `src/world/scene/Scene.tsx`         | Scene composition placeholder; currently returns null                                     |
| `src/config/rendering.ts`           | Background, DPR range, default quality constant                                           |
| `src/types/world.ts`                | QualityTier type only                                                                     |
| `src/styles/global.css`             | Dark responsive layout, document scrolling, focus styles, live reduced-motion media query |

The five portfolio sections have native anchor navigation and explicit missing-content states. No narrative state coordination, cinematic chapter navigation, or adaptive runtime exists yet. The semantic shell does not finalize the planned chapter sequence.

## Recovered architecture intent

- React / semantic DOM owns readable content, navigation, controls, and accessible feedback.
- R3F / Three.js owns scene objects, spatial presentation, camera behavior, and rendering lifecycle.
- Per-frame changes belong in the rendering layer, not top-level React state updates on every frame.
- A coordination layer connects narrative intent and world responses without letting individual systems fight over state.
- Shader code owns GPU visual computation when introduced; it does not own semantic navigation or portfolio content.
- Scene remains a composition root. Features belong in their own modules rather than accumulating in one scene file.

## Proposed now: state ownership contract to finalize

| State class                                | Proposed owner                     | Update character                             |
| ------------------------------------------ | ---------------------------------- | -------------------------------------------- |
| Content / navigation / selected item       | DOM application state              | Discrete user actions                        |
| Chapter intent and world transition intent | Experience coordinator             | Discrete transitions and controlled progress |
| Frame-local transforms / particle uniforms | World runtime refs / scene systems | Frame updates                                |
| Reduced-motion and device-quality policy   | Accessibility / quality systems    | Preference or measured capability changes    |

These categories are not implemented store schemas. Zustand remains optional until actual shared-state requirements justify it. Each mutable property needs one authoritative writer; final ownership must be recorded before multiple controllers are introduced.

Keep user input and explicit commands distinguishable from inferred intent. Render state should express the chosen experience state; it should not independently decide business/content actions.

## Folder policy

Use the existing `src/world` boundary. Earlier planning suggested `src/experience` and other possible folders; these were proposals. Do not rename the current tree merely to mimic a historical sketch.

Create feature folders when a scoped implementation needs them. Future particles, entity, camera, interaction, motion, accessibility, and quality modules are responsibilities, not permission to generate empty scaffolding for every concept.

## Lifecycle and failure requirements

Listeners, observers, frame subscriptions, and GPU resources must have explicit cleanup. R3F owns canvas sizing and teardown. Renderer construction occurs in the Canvas callback ref so React's boundary can catch a synchronous initialization failure before R3F's asynchronous configure path. The renderer ref is reused during StrictMode ref reattachment. The boundary surrounds only the world; its fallback is a visible DOM status and does not hide the portfolio. Context-loss recovery remains open.

Phase 4.2 removed root overflow clipping and fixed root height. The document owns scrolling; the background alone is fixed to the viewport. The world is inert, hidden from accessibility APIs, and ignores pointer input. The header remains in normal flow, and sections have a 2rem scroll margin. A live CSS `prefers-reduced-motion` query disables native smooth anchor scrolling without a JavaScript subscription. This is a bounded shell policy, not a future cinematic-scroll decision.
