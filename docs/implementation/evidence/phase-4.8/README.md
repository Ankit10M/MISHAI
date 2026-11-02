# Phase 4.8 main-portfolio evidence

These are actual **normal application** captures, not generated concepts or development-preview screenshots. Before captures were saved on 2026-11-01 at reviewed commit `14fcca7`; completion captures are from 2026-11-02. Chrome 156 on Windows, ANGLE / Intel Iris Xe / Direct3D11, DPR 1, 100% browser zoom, no open DevTools. Emulated narrow viewports are not physical mobile validation.

| Evidence                                                                         | Viewport and state                                                                                                                           |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [desktop-before.png](desktop-before.png), [desktop-after.png](desktop-after.png) | Same normal `/#creator` anchor, 1440 × 1000; before versus formed head alongside real content                                                |
| [narrow-before.png](narrow-before.png), [narrow-after.png](narrow-after.png)     | Same normal `/#creator` anchor, 390 × 844; before versus stacked Creator/head composition                                                    |
| [creator-intermediate.png](creator-intermediate.png)                             | Paused intermediate head with name and missing-biography text visible                                                                        |
| [introduction.png](introduction.png)                                             | No head over introduction text; any visible dispersed head particles remain in the lower Creator visual area                                 |
| [projects.png](projects.png)                                                     | Navigate away while paused: head area is offscreen, so no head floats over Projects                                                          |
| [desktop-inspection.png](desktop-inspection.png)                                 | Earlier, too-dim scrim inspection; **not final visual evidence**. Final composition excludes only the reserved head area from the text scrim |
| [page-motion.webm](page-motion.webm)                                             | Approximately 18 seconds of composited page: enter, form, leave, reverse, pause, navigate while paused, return and resume                    |
| [page-motion-strip.png](page-motion-strip.png)                                   | Decoded full-page frames from the recording, read left-to-right then top-to-bottom                                                           |

Before geometry/browser metadata: [before.json](before.json). Live development and production renderer/controller observations: [head-metrics.json](head-metrics.json), [production-head-metrics.json](production-head-metrics.json). Recording timestamps, actions and controller states: [recording.json](recording.json). The recorded paused pose stays numerically identical during navigation. Capture cadence is not an application FPS benchmark.

The before Creator section was too short for the reading line to remain in Creator at its anchor. The new reserved visual area enlarges that section naturally; no tracking threshold, scroll pin or navigation behavior was changed. Native focus outlines are retained in captures. Desktop text/head columns and narrow stacked spacing are visible. All supplied content and explicit missing data remain intact.

Only the original 284 head/neck particles render publicly. The local dispersion envelope, fit and point size are documented public-composition choices; full-body preview anatomy/density/colors remain unchanged. The surrounding ambient field is retained. After removing the scrim from the reserved visual rectangle, the formed head is distinguishable and text remains readable. Fragmentation is preserved, with no new facial details or solid surface.

`settled-regression/` and `regional-regression/` are clearly separate **development-preview** regression captures. `regressions/` holds ambient/public regression measurements. No historical evidence directory was overwritten.

Stills and decoded composited frames were inspected. Real-time human motion comfort, physical touch devices, screen readers, other browsers, long-run performance and final art approval remain **unverified**. See the [phase report](../../phase-reports/phase-4.8-report.md) for the behavior contract, measurements, checks and one bounded proposed validation step.
