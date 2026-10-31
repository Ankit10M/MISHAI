# Performance and resilience strategy

Status: recovered principles plus a bounded Phase 4.4 headless renderer sample. No physical-device performance budget has been established.

## Recovered policy

- One dominant motion event, one or two supporting responses, and low-cost ambient life.
- Consider active / near / dormant chapter windowing.
- Adapt detail to capability while preserving content, controls, orientation, narrative, and core identity.
- Prefer GPU-friendly particle computation where justified.
- Use mobile-specific simplification and reduced-motion behavior.
- A desktop 60-FPS target appeared in planning. It is a target, not an achieved metric or universal device guarantee.

## Observed code

`QualityTier` is `minimal | balanced | full`. `DEFAULT_QUALITY_TIER` is `balanced`. No runtime system selects or consumes these tiers to adapt quality.

The renderer requests a DPR clamp of `[1, 2]`. The upper bound limits pixel-density cost compared with an unconstrained higher DPR; the lower bound is a floor, not a mechanism for reducing work below DPR 1. The Phase 4.1 closure corrected the code comment and verified both bounds in headless Chrome. This is functional evidence, not a performance benchmark.

Phase 4.4 replaces the empty scene with 280 seeded points in one geometry/material/draw call. Count is identical at wide and narrow sizes; only aspect-scaled composition changes. This is a conservative static prototype choice, not measured adaptive quality. There are no textures, postprocessing, custom shaders or per-particle React components. Each animated frame mutates one existing position buffer; no per-frame arrays or React state updates are created.

R3F runs continuously only while the page is visible, user motion is enabled and reduced motion is not requested. Otherwise it uses demand rendering and freezes the current pose. First-frame skipping and a 50ms delta cap prevent catch-up after inactivity. Resize still renders in static mode. Native DOM smooth scrolling retains its independent live CSS reduced-motion rule. Initialization failure still shows a DOM status while navigation/tracking remain usable.

## Phase 4.4 measurement boundary

Development and production-preview checks in headless Chrome on Windows reported ANGLE / Intel Iris Xe / Direct3D11, 280 points, one draw call, one geometry, one program and zero textures. Tested CSS viewports included 1440 × 900 and 390 × 844 at DPR 1, plus a wide resize at DPR 2. A modest approximately three-second sample records render-entry intervals; it is not GPU execution time, physical-mobile evidence or an achieved 60-FPS claim. Exact conditions and saved metrics are in the [Phase 4.4 report](../implementation/phase-reports/phase-4.4-report.md).

Static settling, real tab hiding, bounded resume movement, geometry/material identity through navigation and two StrictMode disposal cycles pass. Resource counts return to zero after teardown in the fixture. Long-run memory, thermal/power behavior, context restoration and other browsers remain unverified. The existing Clock deprecation and large JavaScript bundle warning are unchanged; no thresholds or dependencies were altered to conceal them.

## Phase 4.5 static entity boundary

The development-only humanoid has a fixed prototype budget of 2,600 particles, one Points draw call, one geometry/material/program and zero textures in the tested headless renderer. It registers no frame callback and settles in demand mode. Sampling happens on mount; view, region and viewport changes retain geometry/material instances. Region filtering updates one existing index buffer and draw range. The public portfolio still renders only its 280-point field and loads no entity code.

Wide/narrow captures, actual viewport/DPR/resource data and two cleanup cycles are recorded in the [Phase 4.5 report](../implementation/phase-reports/phase-4.5-report.md). No FPS claim is made for a static scene, and particle count alone is not a device performance measurement. Mobile hardware, long-session memory and final visual budgets remain open.

## Proposed now: measurement approach

Establish baseline measurements only after the build and browser runtime work. Record the device, browser, viewport, DPR, feature set, and scenario for each measurement.

Measure representative idle, transition, interaction, and return-navigation cases. Track frame timing and noticeable long tasks; inspect draw calls, resource counts, and memory when geometry/effects arrive. Report limitations rather than claiming a frame-rate target from a development machine alone.

Set actual particle counts, effect budgets, DPR tiers, adaptation thresholds, and device acceptance targets from evidence. Do not manufacture numbers to make the architecture appear complete.

## Proposed now: degradation and failure work

Choose the exact degradation order after profiling. Candidate reductions include decorative effects, particle detail, and pixel density; keep meaningful feedback and content access intact.

Define and verify unsupported-WebGL UI, render error handling, context restoration/recovery, tab visibility behavior, cleanup, and resize handling. Some support may come from dependencies, but application behavior still needs verification.

Reduced motion is a preference to honor, not merely a slow-device optimization. Document its effect on entry, camera, particle movement, chapter transitions, and feedback.
