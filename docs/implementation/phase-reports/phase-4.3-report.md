# Phase 4.3 — Minimal Experience State & Coordination

Date: 2026-10-31. Branch: `main`. Base: reviewed Phase 4.2 commit `caa427e`.

Status: **COMPLETE for the bounded local scope; ready for review**. This is a newly scoped implementation, not a recovered historical specification. The working tree was clean at the reviewed commit before editing. Historical reports, portfolio content, dependency versions, and world configuration were preserved. No Phase 4.4, commit, push, or deployment was performed.

## Scope and files

Read the vision, constitution, content/narrative, architecture, open decisions, development order, roadmap, and Phase 4.2 report before implementation.

| File                                                                                         | Responsibility                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/sections.ts`                                                                        | Single ordered ID/label registry and derived `SectionId` union.                                                                                                                                |
| `src/app/experience.ts`                                                                      | Typed read-only snapshot, pure selection policy and reducer, relevant activation filter.                                                                                                       |
| `src/app/useExperience.ts`                                                                   | React state ownership, DOM measurement, scheduling and lifecycle cleanup.                                                                                                                      |
| `src/app/App.tsx`                                                                            | Own the hook above the independent world and shell siblings.                                                                                                                                   |
| `src/app/PortfolioShell.tsx`                                                                 | Render sections, IDs, headings, numbering and navigation from the registry; report explicit activations and apply current-link semantics. Existing content bodies remain keyed by `SectionId`. |
| `src/styles/global.css`                                                                      | Add a 3px current-link underline, without changing geometry or the focus outline.                                                                                                              |
| `scripts/check-experience.mjs`                                                               | Dependency-free assertions against the actual TypeScript registry, policy, reducer and activation filter.                                                                                      |
| `scripts/check-shell.mjs`                                                                    | Preserve Phase 4.2 browser assertions and add section, history, resize, style, intent and lifecycle checks.                                                                                    |
| `scripts/experience-fixture.html`                                                            | Test-only StrictMode mount of the real shell/hook, exposing snapshots and subscription counts to CDP. Not a production entry or user-facing debug HUD.                                         |
| `docs/README.md`                                                                             | Current status, report index and test entry points.                                                                                                                                            |
| `docs/architecture/application-boundaries.md`, `docs/architecture/rendering-architecture.md` | State/event ownership and bounded future world integration.                                                                                                                                    |
| `docs/decisions/open-decisions.md`                                                           | Provisional policy and the scoped D08/D13 resolutions.                                                                                                                                         |
| `docs/implementation/development-order.md`, `docs/implementation/phase-roadmap.md`           | Current phase status and stop-for-review boundary.                                                                                                                                             |
| `docs/implementation/phase-reports/phase-4.3-report.md`                                      | This report.                                                                                                                                                                                   |

No package or lockfile changes, new dependencies, content claims, world props, scene objects, rendering subscriptions, shaders, animation libraries, or backend were introduced.

## Registry and state contract

The ordered readonly registry is `creator`, `projects`, `skills`, `experience`, `contact`, with the existing labels. `SectionId` is derived from that registry, not a separately maintained union. Navigation, section markup and tracking all use it. Supplied content stays in `src/content/portfolio.ts`. These are semantic portfolio sections, not the eventual cinematic chapters.

`App` owns one `useExperience` instance using React's `useReducer`. The public type is:

```ts
type ExperienceSnapshot = Readonly<{
  activeSection: SectionId | null;
  lastNavigation: Readonly<{ section: SectionId; sequence: number }> | null;
}>;
```

Both fields start null on mount. Readonly is a TypeScript consumer contract, not runtime freezing. The shell receives this snapshot and a separate navigation callback; it cannot mutate state through the snapshot.

- **Observed event:** only measurements issue `{ type: 'observed', section }`. It changes only `activeSection`. Identical selections preserve the same snapshot object, and the hook avoids dispatching them in the first place.
- **Explicit event:** an accepted section-link click issues `{ type: 'navigated', section }`. It changes only `lastNavigation`, incrementing a mount-local sequence from 1, even for repeated activation of the same target. Keyboard-generated clicks use the same path.
- Accept only uncancelled primary clicks without Alt/Ctrl/Meta/Shift on the shell's authored `#section` anchors, with no alternate target or download attribute. Top/skip/external links have no handler. No handler prevents the default action.
- `lastNavigation` means **the most recent explicit activation**, not a pending destination. Intermediate observations, reaching the destination, scrolling away, and interruption leave that historical record alone. A new activation supersedes it; unmount/reload resets it. History traversal and initial hashes are browser location changes, not new explicit section-link commands.

No timeout, interruption detector, event log, transition completion, progress, or pending-intent state is needed. A request for Contact can coexist with observed Projects during smooth scrolling; neither field misrepresents the other.

The future world boundary is a typed `ExperienceSnapshot` prop from App to an actual consumer when one exists. A world consumer must not replay an unchanged `lastNavigation` whenever observation changes. The empty scene has no consumer, so no dummy prop wiring, context provider, render-loop code or event bus was added. DOM behavior remains independent of WebGL and its error boundary.

## Deterministic selection policy

All geometry is in CSS viewport pixels. Registry order breaks any overlap tie. The policy receives five section rectangles, viewport height, distance from document bottom and previous selection; it does not read the DOM itself.

1. A section is visible only when `top < viewportHeight` and `bottom > 0`. Sections touching an edge with no visible area are excluded.
2. Within **2px of the document bottom**, choose the last visible section in registry order. Once that last visible section is active, retain it through a **14px bottom band** (2px plus 12px tolerance). This avoids toggling Contact on tiny bottom-edge movements. No visible section still means null.
3. Otherwise place a reading line at **28% of viewport height**. If the previous section is still visible and spans that line with a **12px retention margin**, retain it. This hysteresis prevents small forward/reverse boundary movements from alternating links.
4. Otherwise choose the first visible section containing the line (`top <= line < bottom`), or null if none does.

These thresholds are provisional implementation decisions. Browser verification tuned the line so the short Creator section after native anchor navigation and Experience before the bottom clamp are selectable in the current wide/narrow layouts. They are not recovered requirements or final narrative timing.

| Situation                                    | Result                                                                                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Several visible sections                     | The reading line and retention policy choose at most one; overlap ties use registry order. Visibility alone does not issue an intent.                                                       |
| Tall Projects                                | Remains selected while the line lies inside it, regardless of the small fraction of the entire section visible.                                                                             |
| Short bottom sections                        | The reading line can select Experience; bottom priority selects visible Contact even when native scrolling cannot align it with the line.                                                   |
| Introduction above Creator                   | Null until Creator reaches the line (with 12px exit retention when returning upward); no fabricated Creator selection at initial top in the tested layouts.                                 |
| Footer                                       | Contact remains selected at document bottom while any of it is visible. A footer-only viewport produces null.                                                                               |
| Very tall viewport / all content fits        | Bottom priority still applies; several short sections can be visible without each becoming active. An anchor target is not guaranteed to win merely because its hash is current.            |
| Initial deep link / reload / restored scroll | Measure actual geometry after mount and subsequent scroll/pageshow/layout events. The initial null snapshot makes no premature visibility claim. Native browser positioning is left intact. |
| Unknown hash                                 | Ignored by selection and intent; the actual viewport governs. No URL repair or forced scroll occurs.                                                                                        |
| Resize / flow layout changes                 | Resize events and body/section ResizeObservers request another measurement using current geometry.                                                                                          |

No URL rewriting, new history entries, scripted scrolling, observation-driven focus movement, scroll interception, or live announcements were added. One matching link gets `aria-current="location"`; null removes it from all links. A thicker underline provides a non-color cue without layout shift. Focus outlines stay independently visible. The header remains in normal document flow as in Phase 4.2; no sticky navigation was added.

## Scheduling and cleanup

A passive window scroll listener plus resize, pageshow and hashchange listeners schedule one pending `requestAnimationFrame` at most. A ResizeObserver watches the body and each section for flow size changes. The initial setup also schedules a measurement. Each measurement reads five rectangles and document/viewport dimensions; it never runs inside R3F. There is no idle polling, animation loop, or continuous React progress update.

Cleanup removes all four listeners, disconnects the observer and cancels a queued frame. A disposed flag prevents late callbacks from scheduling or dispatching after cleanup. The browser fixture verifies one live observer and one listener of each kind after StrictMode effect replay, zero after unmount, and one each after remount. It also checks that unchanged measurements do not render and that a queued frame followed by unmount cannot update the fixture.

The registry and section DOM are static for this phase. Dynamic insertion/reordering of sections or transform-driven layout would require revisiting element discovery and measurement triggers; no unused dynamic-registration system was built.

## Verification and actual conditions

Windows; Node `24.17.0`, npm `11.13.0`; existing installed dependencies. PowerShell commands use `npm.cmd`. Browser: installed headless Chrome `156.0.8078.74`, disposable profile, localhost Vite development server, React StrictMode enabled. The sandboxed browser launch did not expose the debug port; the approved outside-sandbox launch supplied the test browser.

| Check                               | Result                                                                                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`                     | Passed TypeScript and Vite; 38 modules. Existing JavaScript chunk warning above 500 kB remains (approximately 1.08 MB, 296 kB gzip).                                                                  |
| `npm run lint`                      | Passed.                                                                                                                                                                                               |
| `npm run format:check`              | Passed.                                                                                                                                                                                               |
| `node scripts/check-experience.mjs` | Passed registry/order, tall/multiple/empty visibility, both boundary directions, bottom retention, resizing, state identity, repeated/superseded intent, no inferred intent and activation filtering. |
| `node scripts/check-shell.mjs`      | Passed existing Phase 4.2 assertions plus the Phase 4.3 checks below.                                                                                                                                 |
| `git diff --check`                  | Passed.                                                                                                                                                                                               |

Automated browser coverage:

- **1440 × 900, 390 × 844, 320 × 740**, desktop CSS viewport emulation at DPR 1: native pointer anchor clicks, wheel scrolling, section observation, no overflow, one canvas, return to top, no current link in the introduction, exactly one current link for each deliberately observed section. Direct instant scroll positioning supplements native wheel input to target policy boundaries; these are not manual device tests.
- Native keyboard skip-link focus transfer and section navigation remain usable. The fixture also verifies keyboard intent increments once, independently of observation. Current-link underline geometry and simultaneous keyboard focus outline are checked through DOM/computed styles.
- Scrolling through sections preserves the starting hash, focused element and history length. Initial Projects deep link, reload, browser back/forward, unknown hash, and restoration of a deliberately scrolled position pass. History checks preserve the browser's saved position; scrolling to the header before clicking would legitimately change that saved position.
- A **1440 × 900 → 1440 × 1200** resize changes the selected section. An injected introduction height change triggers measurement without a resize (scroll anchoring disabled only for that test). An artificially tall footer verifies a genuinely footer-only viewport clears current selection. Test styles are removed afterward.
- Live `no-preference → reduce → no-preference` changes still produce native `smooth → auto → smooth` scrolling without reload.
- Deliberately unavailable WebGL and a thrown initialization exception both leave all content, native navigation and observed-section tracking usable. Expected Three/React diagnostics from these injections are not normal-operation failures.
- The test-only fixture verifies the intent snapshot before the next animation frame, then interrupts native smooth scrolling using an instant scroll. No destination becomes pending or overrides observed location. Modified and cancelled synthetic clicks issue no intent; pure tests cover modifier/alternate-target/download exclusions. Actual browser modified-click new-tab behavior is preserved by leaving default handling untouched, but opening those tabs was not automated.
- StrictMode lifecycle counts, queued-frame cleanup, remount, and unchanged-selection render bailout pass. The normal application run reports no uncaught exceptions, console errors or failed network loads; the pre-existing `THREE.Clock` deprecation remains.

To repeat: run `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`, launch a disposable Chrome profile with `--headless=new --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir=<temporary profile>`, then run the two Node scripts. `check-shell.mjs` accepts an optional local app origin and opens/closes its own test tab. Its fixture requires the Vite development server; it is not a production-preview test. Close the disposable browser and server afterward.

Manually inspected: implementation, content-preservation diff, ownership/cleanup paths and documentation consistency. No manual visual browser session, new screenshot inspection, screen-reader testing, physical touch-device testing, other-browser run, production-preview run, or performance/resource-leak profiling is claimed. Emulated viewports are not physical-device coverage.

## Remaining issues and one bounded next step

Missing biography, project details/assets/URLs, experience details/status confirmation, and email remain explicit. The existing Clock deprecation and large-bundle warning remain separate work. Runtime WebGL context-loss recovery and broader accessibility/device validation remain open. No cinematic, particle, humanoid, camera, adaptive or orchestration system is implemented by this phase.

Proposed next step, not started: supply and integrate the approved Creator biography and contact email in the existing content module, then verify the resulting email action and recheck selection after the content-height change. Review this phase before authorizing further implementation.
