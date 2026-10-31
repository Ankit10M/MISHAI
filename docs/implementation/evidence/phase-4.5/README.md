# Phase 4.5 visual and renderer evidence

Captured on 2026-10-31 from the development-only `/dev/entity.html` entry in headless Chrome 156.0.8078.74 on Windows. The reported adapter was ANGLE / Intel Iris Xe / Direct3D11. Both viewports use DPR 1; narrow emulation is not a physical mobile-device result.

| Capture                                          | View / viewport                 | Review purpose                                     |
| ------------------------------------------------ | ------------------------------- | -------------------------------------------------- |
| [wide-front.png](wide-front.png)                 | Front, 1440 × 1000              | Full silhouette, proportions and deliberate gaps.  |
| [wide-three-quarter.png](wide-three-quarter.png) | 36-degree rotation, 1440 × 1000 | Volume and limb overlap without cropping.          |
| [narrow-full.png](narrow-full.png)               | Three-quarter, 390 × 844        | Full-body framing with unchanged proportions.      |
| [arms-isolation.png](arms-isolation.png)         | Arms/hands, front, 1440 × 1000  | Region membership and shoulder-to-hand continuity. |

All four were visually inspected at readable size. The figure reads as humanoid with distinguishable head, torso, arms/hands and lower body. Patch gaps are visible, the three-quarter view retains volume, and no clipped extremities or accidental detached blobs were observed. Simple hands/feet and broad shoulders remain provisional. Narrow points are smaller on screen; these captures do not approve final art direction.

[metrics.json](metrics.json) records the actual renderer, viewport, buffer, camera, scale, region draw counts, geometry/material identities and two teardown cycles. Full-body rendering used 2,600 points in one draw with one geometry/program and no textures. View/region/resize changes preserved resources and scale `[1, 1, 1]`; a 600ms settled check observed no additional renders. Teardown released contexts and geometry/program resources. The `aspect` field inherited from the ambient probe is the Points X scale, not the camera aspect; `scale`, `canvasRect` and projected `bounds` provide the entity framing evidence. Region samples retain projected bounds of the full position buffer, including hidden points.

[Development ambient metrics](regressions/development-metrics.json) and [production ambient metrics](regressions/production-metrics.json) record regression checks without replacing historical Phase 4.4 evidence. Teardown `calls`/`points` fields retain Three's last-frame counters and do not mean rendering continued.

To regenerate the entity captures, start Vite at `127.0.0.1:5173` and disposable Chrome with debugging on `127.0.0.1:9222`, then run `node scripts/check-entity-browser.mjs`. The script overwrites these four PNG files and entity metrics. Full commands, checks, conditions and limitations are in the [Phase 4.5 report](../../phase-reports/phase-4.5-report.md).

This is static prototype evidence, not an FPS, GPU-time, mobile-device, long-session memory or final visual-approval claim. No recording is needed for a deliberately static entity.
