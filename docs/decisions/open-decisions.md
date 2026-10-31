# Open decisions and unresolved evidence

Status: explicit unknowns. Resolve items when the next scoped task depends on them; do not ask the user to answer every item up front.

| ID  | Decision / gap                   | Known evidence                                                                                                            | Resolution needed                                                                                   |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| D01 | Public name                      | Repo MISHAI; app Mantis Digital Universe                                                                                  | Confirm public branding before final copy                                                           |
| D02 | Full historical subphase records | Phase names and selected rules recovered                                                                                  | Do not invent missing 3.x.y titles or claim verbatim recovery                                       |
| D03 | CREATE / final reveal order      | Summary has Create → Final Evolution → Contact; earlier request described CREATE near final reveal                        | Set exact narrative placement before transition implementation                                      |
| D04 | Intro policy                     | Five-second countdown concept                                                                                             | Define skipping, repeat visits, loading, reduced motion                                             |
| D05 | Typography and tokens            | Recovered color roles; Phase 4.2 adds provisional system-font and high-contrast shell styling                             | Confirm final art direction; provisional values below are not recovered historical tokens           |
| D06 | Public content                   | Project names/order, skills, experience outline                                                                           | Obtain email, biography, project descriptions, URLs, assets, current experience details             |
| D07 | Optional journey                 | User allowed optional journey                                                                                             | Decide inclusion when composing content                                                             |
| D08 | State and orchestration          | Phase 4.3 uses an App-owned React reducer, observed section and historical explicit activation, with a read-only snapshot | Semantic scope resolved without Zustand; future chapter/world transitions and ownership remain open |
| D09 | Animation and scroll             | Native scrolling preserved; Phase 4.4 adds bounded particle drift with pause/reduced-motion/visibility gates              | Future cinematic mechanics and property ownership remain open; no animation libraries selected      |
| D10 | Entity asset pipeline            | Sampled-mesh particle approach discussed                                                                                  | Choose source asset, usage rights, sampling approach and visual acceptance                          |
| D11 | Quality budgets                  | Phase 4.4: conservative fixed 280-point field and modest headless renderer measurements                                   | Physical-device budgets, thresholds and adaptation remain open; no achieved 60-FPS claim            |
| D12 | Accessibility / failure policy   | Native navigation, world initialization fallback and live motion preference plus user pause implemented                   | Screen-reader/real-device coverage, broader motion and context-loss recovery remain open            |
| D13 | Later implementation numbering   | Phases 4.2–4.4 explicitly authorized by new tasks; no recovered historical later specification                            | Review Phase 4.4 before choosing another scope; humanoid work not started                           |
| D14 | Backend and publishing           | No selected infrastructure                                                                                                | Decide only when a concrete product requirement needs it                                            |

## Known defects are not open design decisions

- The reproduced DPR readonly tuple error was fixed in the Phase 4.1 closure; `[1, 2]` is unchanged.
- The four existing formatting failures were corrected; build, lint, and formatting checks now pass.
- Documentation was absent from the audited commit; this documentation pass supplies a reconstructed baseline, not a recovered original archive.
- Headless Chrome mount/resize checks pass. R3F's internal `THREE.Clock` emits a deprecation warning; dependency changes are deferred. See the [closure report](../implementation/phase-reports/phase-4.1-report.md).
- Phase 4.2 removed `.gitignore:32:docs/`; documentation is now eligible for normal tracking. No global Git settings, commits, or pushes were changed.
- Vite reports an existing JavaScript chunk above 500 kB. No speculative splitting or dependency upgrade was introduced.

## New Phase 4.2 implementation choices — provisional

Date: 2026-10-30. These choices support a readable shell while final visual design remains open.

- Use `system-ui, sans-serif`; no new font files, external requests, or claimed historical font family.
- Retain background `#05060a`; use text `#edf0f5`, muted text `#a8b0c0`, link/focus cyan `#8cdeeb`, dividers `#2a303d`, and fallback/skip-link surface `#121923` provisionally.
- Use a 72rem maximum page width, 1.5rem side gutters, and a 45rem breakpoint for stacked sections. Navigation always wraps visibly; no menu toggle, sticky header, or scroll interception is needed.
- Use browser-native smooth anchor scrolling, switching immediately to `auto` when reduced motion is requested. CSS media queries handle changes during the session; no shared state or hook is necessary.
- Keep the empty world on demand and isolate initialization failures with a React error boundary. Do not add a global error listener, capability framework, or another rendering library. Reevaluate this boundary if R3F initialization/ref ordering changes.

Affected code: `src/styles/global.css`, `src/app/PortfolioShell.tsx`, `src/world/scene/WorldCanvas.tsx`, and `src/world/scene/WorldBoundary.tsx`. Validation and limits: [Phase 4.2 report](../implementation/phase-reports/phase-4.2-report.md).

## New Phase 4.3 implementation choices — provisional

Date: 2026-10-31. The five semantic IDs, labels and order now live in `src/app/sections.ts`, separately from portfolio content and the cinematic chapter plan. React's reducer/effect capabilities meet this scope without a new dependency, store, event bus or general state machine.

The current-link policy is geometric, with a 28%-height reading line, 12px boundary retention, and a 2px document-bottom tolerance selecting the last visible section (retained through a 14px bottom band). These values are provisional implementation choices, not historical requirements. Introduction/gaps/footer can produce no active section. Hashes and explicit requests never override observation.

Explicit intent is a last-activation record with a monotonic mount-local sequence, not pending state. Interruptions require no resolution timer; later activations supersede history, and reload/unmount starts fresh. Future world consumers may receive the typed read-only snapshot; no dummy scene consumer exists. DOM navigation, focus, scrolling and history remain browser-owned. An underline supplies non-color current feedback without changing layout or replacing focus outlines.

Affected modules, exact edge cases and test limits: [Phase 4.3 report](../implementation/phase-reports/phase-4.3-report.md). Cinematic transitions, adaptation and world motion remain open.

## New Phase 4.4 implementation choices — provisional

Date: 2026-10-31. Use one seeded 280-point BufferGeometry/PointsMaterial field, three unequal side pockets, depth from -5 to 0, cyan/soft-white vertex brightness variation, 0.045 world-unit size and 0.48 opacity. Keep the camera at `[0, 0, 6]`, FOV 50. Aspect-scaled composition and a CSS center scrim preserve negative space and text readability. These are prototype values centralized in `src/world/particles/config.ts` and the existing stylesheet, not final art direction or measured adaptive quality.

Use existing R3F scheduling: `always` only while visible, unpaused and not reduced-motion; otherwise `demand`. The frozen pose is the static state. Preserve time across renders/navigation, skip the first enabled frame and clamp frame deltas to 50ms. Keep user pause through preference changes. Pass only motion policy to the world; no unused experience-state wiring, shader framework, textures, postprocessing, humanoid sampling or new dependency.

Mount the DOM synchronously at bootstrap so production initial fragments/restored positions can find their native anchor targets. This corrects a reproduced production startup timing failure without scripted scrolling or history/focus changes. Particle geometry/material ownership remains with R3F. See the [Phase 4.4 report](../implementation/phase-reports/phase-4.4-report.md) for exact values, evidence, measurements and limits.

## Change log

2026-10-30: Created the documentation baseline from recovered conversation context and the code audit. No historical design gap was silently converted into a final choice. No runtime implementation was changed.

2026-10-30: Closed the bounded Phase 4.1 foundation task in the local working tree. Updated observed facts and reference links; recovered planning and D01–D14 remain unchanged.

2026-10-30: Implemented the newly authorized Phase 4.2 shell. Updated D05, D09, D12, and D13 to distinguish provisional implementation choices from remaining decisions. Missing content and historical uncertainty remain explicit.

2026-10-31: Implemented newly scoped Phase 4.3 on reviewed `caa427e`. Updated D08 and D13 for bounded semantic experience state; preserved historical reports and stopped for review.

2026-10-31: Implemented newly scoped Phase 4.4 on reviewed `69d5fcc`, including production native-fragment startup correction. Added measured/visual evidence and stopped for review without humanoid work.
