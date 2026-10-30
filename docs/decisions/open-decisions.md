# Open decisions and unresolved evidence

Status: explicit unknowns. Resolve items when the next scoped task depends on them; do not ask the user to answer every item up front.

| ID  | Decision / gap                   | Known evidence                                                                                                     | Resolution needed                                                                              |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| D01 | Public name                      | Repo MISHAI; app Mantis Digital Universe                                                                           | Confirm public branding before final copy                                                      |
| D02 | Full historical subphase records | Phase names and selected rules recovered                                                                           | Do not invent missing 3.x.y titles or claim verbatim recovery                                  |
| D03 | CREATE / final reveal order      | Summary has Create → Final Evolution → Contact; earlier request described CREATE near final reveal                 | Set exact narrative placement before transition implementation                                 |
| D04 | Intro policy                     | Five-second countdown concept                                                                                      | Define skipping, repeat visits, loading, reduced motion                                        |
| D05 | Typography and tokens            | Recovered color roles; Phase 4.2 adds provisional system-font and high-contrast shell styling                      | Confirm final art direction; provisional values below are not recovered historical tokens      |
| D06 | Public content                   | Project names/order, skills, experience outline                                                                    | Obtain email, biography, project descriptions, URLs, assets, current experience details        |
| D07 | Optional journey                 | User allowed optional journey                                                                                      | Decide inclusion when composing content                                                        |
| D08 | State and orchestration          | Ownership principles discussed                                                                                     | Define minimal actual schemas and transitions; decide whether Zustand is needed                |
| D09 | Animation and scroll             | Native document/anchor scrolling selected for the Phase 4.2 shell; reduced motion disables smoothing               | Future cinematic mechanics and property ownership remain open; no animation libraries selected |
| D10 | Entity asset pipeline            | Sampled-mesh particle approach discussed                                                                           | Choose source asset, usage rights, sampling approach and visual acceptance                     |
| D11 | Quality budgets                  | Quality tiers and 60-FPS desktop aspiration                                                                        | Establish measured budgets, devices, thresholds and degradation                                |
| D12 | Accessibility / failure policy   | Phase 4.2 implements keyboard/skip navigation, live reduced-motion CSS, and isolated WebGL initialization fallback | Screen-reader/real-device coverage, future motion, and context-loss recovery remain open       |
| D13 | Later implementation numbering   | Phase 4.2 explicitly authorized by a new task; no recovered historical 4.2+ specification                          | Review this report before choosing any next phase                                              |
| D14 | Backend and publishing           | No selected infrastructure                                                                                         | Decide only when a concrete product requirement needs it                                       |

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

## Change log

2026-10-30: Created the documentation baseline from recovered conversation context and the code audit. No historical design gap was silently converted into a final choice. No runtime implementation was changed.

2026-10-30: Closed the bounded Phase 4.1 foundation task in the local working tree. Updated observed facts and reference links; recovered planning and D01–D14 remain unchanged.

2026-10-30: Implemented the newly authorized Phase 4.2 shell. Updated D05, D09, D12, and D13 to distinguish provisional implementation choices from remaining decisions. Missing content and historical uncertainty remain explicit.
