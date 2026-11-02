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
| D10 | Entity asset pipeline            | Phase 4.5 supplies an original smooth procedural proxy and deterministic sampling boundary for development review         | Approve final proportions/gaps and any replacement mesh with usage rights before later integration  |
| D11 | Quality budgets                  | Phase 4.4: conservative fixed 280-point field and modest headless renderer measurements                                   | Physical-device budgets, thresholds and adaptation remain open; no achieved 60-FPS claim            |
| D12 | Accessibility / failure policy   | Native navigation, world initialization fallback and live motion preference plus user pause implemented                   | Screen-reader/real-device coverage, broader motion and context-loss recovery remain open            |
| D13 | Later implementation numbering   | Phases 4.2–4.8 authorized through new tasks, separate from historical planning                                            | Review Phase 4.8 Creator/head integration; other-region integration and later phases not started    |
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

## New Phase 4.5 implementation choices — provisional

Date: 2026-10-31. With no approved external mesh, use an original smooth union of twenty anatomical ellipsoids as a replaceable sampling source. Render only 2,600 deterministically sampled particles: a thin interior surface band with some deeper points, unequal density and six explicit missing patches. No ellipsoid meshes, custom shader, texture, animation or external model is rendered/loaded. This does not approve final anatomy or recover an earlier mesh decision.

Stable accepted-sample IDs and discrete region tags support head/identity, arms/creation, torso/technology, posterior spine/optional journey and lower-body/foundation inspection. Nearest signed component distance resolves overlaps, then configuration order; the posterior strip overrides torso classification only. Source, sampling and rendering remain separate modules. View/region controls preserve geometry/material resources; framing uses camera distance, never anatomical X scaling.

The local `/dev/entity.html` review entry uses one shared rendering surface in demand mode and is excluded from the normal application's module graph and production output. The build rejects accidental entity/development imports. The public portfolio is unchanged except the requested reduced-motion label correction. See the [Phase 4.5 report](../implementation/phase-reports/phase-4.5-report.md) for visual assessment, exact parameters, evidence and limits.

## New Phase 4.6 implementation choices — provisional

Date: 2026-10-31. The user accepted Phase 4.5 at `ea127e0` as a working procedural proxy. Preserve its source/sampling/region data. Seed `4606` creates a separate dispersed box (X ±2, Y ±2.25, Z ±1.3) in existing particle order. Normalized progress uses smoothstep interpolation along straight paths, with exact array-copy endpoints, five-second full-range duration and 50ms capped simulation steps. No curved excursion, physics, region sequencing, new anatomy or external asset is needed.

One controller owns progress and destination; opposite commands reverse from the current value, repeated active commands do nothing, scrubbing pauses, and reset restores settled/front/all. Reduced motion settles active requests immediately while preserving paused inspection. Hidden tabs suspend active intent and never replay elapsed time. React receives meaningful state changes only; the slider is explicitly an inspection control, not a live progress percentage. Fixed union framing replaces settled-only preview framing. These choices validate mechanics, not final motion approval or chapter integration. See the [Phase 4.6 report](../implementation/phase-reports/phase-4.6-report.md).

## New Phase 4.7 implementation choices — provisional

Date: 2026-11-01. Phase 4.6 was reviewed at `38793ac`. Keep anatomy, missing patches, seeds, membership, paths, five-second duration, 50ms cap and union framing. Extend its one controller with five region states; broadcasts retain each current pose. There is no global progress, average, automatic sequence or orchestration framework. Separate Show region filtering from Control region commands. A single-region scrub pauses only its region and retains its endpoint; all-region inspection is disabled. Enabling reduced motion settles only playing regions to individual targets. Visibility preserves active intent without hidden elapsed time.

The existing seeded cloud remains visible around formed regions. It competes visually with the head and arms, especially at small display sizes; density, colors and visibility were not changed to improve captures. This remains an integration/art-direction limitation, not an additional speculative prototype phase. The next concrete task is Creator section → head formation integration with scroll, reverse-scroll, direct-link and reduced-motion rules defined before coding and the full humanoid reserved for the late reveal. [Phase 4.7 report](../implementation/phase-reports/phase-4.7-report.md).

## New Phase 4.8 implementation choices - provisional

Completed 2026-11-02 on reviewed `14fcca7`, resuming the interrupted 2026-11-01 work. Observed Creator activity targets head formation; any other/null observation targets dispersion. Historical lastNavigation is not a command. Start dispersed. Explicit user pause retains the latest target without movement and outranks reduced-motion endpoint selection. Resume under reduced motion synchronizes immediately, while ambient motion remains off. True visibility suspends advancement independently.

Only the existing 284 head/neck particles render publicly. Copy stable IDs/colors/settled coordinates; derive a local deterministic cloud centered at `[0,1.73,0]`, half-bounds `[0.55,0.55,0.28]`. Public fit factor 0.82 and point size 0.035 improve legibility; opacity 0.7 and palette remain unchanged. A reserved Creator rectangle controls uniform placement, scissor clipping and a local exclusion from the text scrim. The public camera and ambient particle transform remain unchanged. No second Canvas, new facial detail, shader, dependency or cumulative assembly policy is added.

The build now permits shared entity runtime while rejecting preview controls/full-body renderer and fixtures. The visible Creator change is integrated; full humanoid and other regions remain preview-only, and intro/final reveal remain unimplemented. Desktop/narrow captures and composited-page video support visual inspection; real-device, screen-reader and real-time human comfort validation remain open. [Phase 4.8 report](../implementation/phase-reports/phase-4.8-report.md).

## Change log

2026-11-01: Implemented Phase 4.7 independent regions in the isolated preview. Main website visual change: none; regional mechanics remain preview-only. Stopped for review; no later phase, commit, push or deployment.

2026-10-30: Created the documentation baseline from recovered conversation context and the code audit. No historical design gap was silently converted into a final choice. No runtime implementation was changed.

2026-10-30: Closed the bounded Phase 4.1 foundation task in the local working tree. Updated observed facts and reference links; recovered planning and D01–D14 remain unchanged.

2026-10-30: Implemented the newly authorized Phase 4.2 shell. Updated D05, D09, D12, and D13 to distinguish provisional implementation choices from remaining decisions. Missing content and historical uncertainty remain explicit.

2026-10-31: Implemented newly scoped Phase 4.3 on reviewed `caa427e`. Updated D08 and D13 for bounded semantic experience state; preserved historical reports and stopped for review.

2026-10-31: Implemented newly scoped Phase 4.4 on reviewed `69d5fcc`, including production native-fragment startup correction. Added measured/visual evidence and stopped for review without humanoid work.

2026-10-31: Implemented newly scoped Phase 4.5 on reviewed `1bb4e4b`. Resolved the provisional procedural source for local review, preserved public behavior and historical evidence, and stopped before formation animation.

2026-10-31: Implemented newly scoped Phase 4.6 on reviewed `ea127e0`. Added deterministic reversible preview transitions, interruption/policy handling and motion evidence. Preserved settled anatomy, public behavior and historical reports; stopped before chapter integration.

2026-11-02: Completed the bounded public Creator/head integration in Phase 4.8. Preserved historical evidence and complete development preview; stopped for review without a commit, push or deployment.
