# Development order

## Working agreement recovered from planning

The IDE implementation agent performs scoped implementation and maintains Markdown documentation. The planning/review assistant supplies instructions and reviews results. Each phase ends with a report and review before moving on.

The documentation prepared here is a reconstructed baseline to supply that workflow. It is not evidence that the IDE agent previously wrote these documents or completed the missing work.

## Completed foundation scope: Phase 4.1

Status: completed in the local working tree on 2026-10-30; see the [closure report](phase-reports/phase-4.1-report.md). The checklist below records the accepted scope. Stop for review before selecting subsequent work.

1. Read the documentation index, vision, constitution, architecture, open decisions, and current report.
2. Reproduce and fix the DPR compile error without changing rendering intent.
3. Correct the DPR explanation so the upper clamp is described accurately.
4. Format the four existing files identified by the audit.
5. Integrate/review this documentation against the code; preserve uncertainty labels.
6. Run production build, lint, and formatting checks.
7. Verify the shell in a browser, including resizing and console errors. A deliberately empty scene should be reported as an empty scene, not a working portfolio.
8. Update the phase report with exact changes, commands, results, runtime observations, remaining gaps, and the next proposed scope.

Acceptance for this closure: checks pass; browser mounting is verified or a remaining blocker is explicitly reported; architecture references resolve; no placeholder is represented as a completed system.

Do not add particles, humanoid assets, animation libraries, or a new global store merely to make the foundation look advanced.

## Proposed now: subsequent dependency order

This is a provisional implementation order, not a recovered historical Phase 4.2+ plan. Phase 4.6 was reviewed at `38793ac`; Phase 4.7 independent region assembly is complete in the development preview. See the [Phase 4.7 report](phase-reports/phase-4.7-report.md) and [vision progress](vision-progress.md). Stop for review. This is the last planned isolated mechanics step.

Next bounded task: **Creator section → head formation integration**. Define scroll, reverse-scroll, direct-link and reduced-motion rules before coding; preserve the late full-humanoid reveal. No public integration, subsequent phase, commit, push or deployment is included in Phase 4.7.

| Work area                                 | Prerequisites / evidence of success                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Semantic shell and access behavior        | Phase 4.2 implemented; keyboard and emulated viewport/fallback checks pass; real touch and screen-reader checks remain open |
| Minimal experience state and ownership    | Phase 4.3 implemented for semantic sections; observation never issues a command; cinematic chapter interfaces remain open   |
| World/environment and camera baseline     | Phase 4.4 prototype: stable camera, readable content, verified pause/preference/visibility and resource lifecycle           |
| Particle/entity proof of concept          | Phase 4.5 settled proxy accepted for development; Phase 4.7 regional preview complete, motion quality still provisional     |
| Narrative transitions and content         | Resolve intro/CREATE order; connect content and world meaningfully                                                          |
| Coordinated interaction and motion        | Verify causal order, priorities, interruption and settling                                                                  |
| Bounded adaptation and quality            | Introduce only measured signals and reversible behavior; avoid speculative complexity                                       |
| Content completion and release validation | Real copy/assets, responsive/accessibility/performance review, deployment choice                                            |

Quality and accessibility are requirements throughout, not cleanup reserved for the last row.

## Phase report requirements

Record source commit or working-tree context, scope, files changed, why, verification commands/results, browser/device conditions, unresolved decisions, known defects, and proposed next step. Distinguish planned, implemented, tested, and deferred work.

Stop after the scoped report for review. Do not silently expand the roadmap or automatically implement the next phase.
