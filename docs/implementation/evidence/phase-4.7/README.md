# Phase 4.7 preview evidence

These are **development entity preview captures**, not main-website screenshots. Main website visual change: none; regional mechanics remain preview-only.

Captured on 2026-11-01 in disposable headless Chrome 156 on Windows, ANGLE / Intel Iris Xe / Direct3D11. Browser zoom 100%, device scale factor 1, front view and all regions visible for the five primary captures. Wide comparisons use a 1440 × 1000 CSS viewport, the same conservative camera framing and uniform body scale. The narrow capture uses 390 × 844 with full-document scrolling; its canvas retains a 320px minimum height. These are emulated viewports, not physical-device tests.

Region vectors below use head, arms, torso, spine, lower-body order.

| Capture                                      | Progress            | Purpose                                                       |
| -------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| [head-formed.png](head-formed.png)           | `[1,0,0,0,0]`       | Head formed; every other region remains dispersed and visible |
| [head-arms-formed.png](head-arms-formed.png) | `[1,1,0,0,0]`       | Head and arms formed; remaining regions dispersed and visible |
| [mixed.png](mixed.png)                       | `[1,1,0.45,0,0.25]` | Mixed inspected pose, all regions visible                     |
| [settled.png](settled.png)                   | `[1,1,1,1,1]`       | Full settled entity for comparison                            |
| [narrow-mixed.png](narrow-mixed.png)         | `[1,1,0.45,0,0.25]` | Same mixed pose on a narrow scrollable layout                 |

Additional `dispersed.png`, `intermediate.png` and `narrow-intermediate.png` preserve whole-body endpoint/equal-progress inspection coverage. `settled-regression/` contains the existing settled-entity suite's captures and metrics. `regressions/` contains the ambient-world regression results and any captures produced by that suite. Historical evidence directories were not overwritten.

[motion.webm](motion.webm) is a roughly 15.4-second canvas-only sequence, not an automatic application timeline. Test inputs form the head, form arms separately, reverse the head, pause arms, reverse the head again while arms remain paused, resume arms, then broadcast Form. Nominal command times: 0, 0.8, 2.2, 2.8, 3.6, 6 and 9.5 seconds. Actual command timestamps and all regional states are stored in [metrics.json](metrics.json). [motion-strip.jpg](motion-strip.jpg) contains decoded, aspect-preserving frames with timestamps. The DOM stills supply control/status context absent from the canvas recording.

Inspection: the head outline remains visible, but the surrounding dispersed cloud competes with it; arms are less immediately legible than in the settled figure. The mixed torso adds visual overlap. Narrow framing contains the particle cloud without stretching, but the figure is small and the controls require scrolling. No unformed region was hidden, density reduced, color brightened or camera moved to improve the primary evidence. The compressed motion strip is faint; use the PNGs for shape inspection and the WebM for a playback review.

Automated buffer/path/continuity checks and decoded-frame inspection passed. Direct real-time human playback review, physical-device comfort, screen readers, other browsers and final art/motion approval remain **unverified**. See the [phase report](../../phase-reports/phase-4.7-report.md) for commands, resource measurements and limits.
