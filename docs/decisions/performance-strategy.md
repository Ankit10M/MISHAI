# Performance and resilience strategy

Status: recovered principles plus proposed validation approach. No runtime performance measurements exist in this audit.

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

Phase 4.2 sets `frameloop="demand"` for the empty scene and uses a live CSS reduced-motion query to disable smooth anchor scrolling. No animation/transitions are otherwise introduced. Canvas initialization failure shows a DOM status while content and navigation remain usable. Chapter windowing, context-loss recovery, and measured adaptive quality remain unimplemented. No performance benchmark is claimed.

## Proposed now: measurement approach

Establish baseline measurements only after the build and browser runtime work. Record the device, browser, viewport, DPR, feature set, and scenario for each measurement.

Measure representative idle, transition, interaction, and return-navigation cases. Track frame timing and noticeable long tasks; inspect draw calls, resource counts, and memory when geometry/effects arrive. Report limitations rather than claiming a frame-rate target from a development machine alone.

Set actual particle counts, effect budgets, DPR tiers, adaptation thresholds, and device acceptance targets from evidence. Do not manufacture numbers to make the architecture appear complete.

## Proposed now: degradation and failure work

Choose the exact degradation order after profiling. Candidate reductions include decorative effects, particle detail, and pixel density; keep meaningful feedback and content access intact.

Define and verify unsupported-WebGL UI, render error handling, context restoration/recovery, tab visibility behavior, cleanup, and resize handling. Some support may come from dependencies, but application behavior still needs verification.

Reduced motion is a preference to honor, not merely a slow-device optimization. Document its effect on entry, camera, particle movement, chapter transitions, and feedback.
