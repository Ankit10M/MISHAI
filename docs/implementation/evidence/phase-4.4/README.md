# Phase 4.4 evidence

Captured from the production preview in headless Chrome 156.0.8078.74 on Windows, 2026-10-31. These are emulated desktop CSS viewports, not physical mobile-device tests.

- [Wide portfolio](wide.png): 1440 × 900, DPR 1, reduced motion enabled, deterministic initial pose. Header/control, introduction and Creator content are visible.
- [Narrow Projects](narrow-projects.png): 390 × 844, DPR 1, reduced motion enabled. Native anchor focus outline remains visible; all project names are supplied portfolio content.
- [Four-second motion recording](motion.webm): real WebGL canvas recording at a requested 20 capture frames/second. Canvas only: it excludes DOM text and the CSS scrim. This capture rate is not a measured rendering FPS.
- [Sampled motion frames](motion-strip.jpg): decoded video frames at approximately 0.1, 1.1, 2.1 and 3.1 seconds, in reading order. Used to inspect the actual animated run's bounded movement and composition, alongside per-render displacement checks. No direct real-time video playback or physical-display flicker evaluation is claimed.
- [Development measurements](development-metrics.json) and [production measurements](production-metrics.json): actual renderer, viewport, buffer/DPR, point/draw/resource counts, frame-entry timing sample and native-tab visibility result. Development also records two disposal cycles.

Visual observations: unequal side pockets leave a broad empty center; small perspective-scaled points have restrained brightness and no glow. Text and controls remain legible in the inspected wide/narrow images. Sampled motion retains the same composition with slight individual drift, no rotation or explosive movement. These captures do not establish final art-direction approval or full accessibility/performance acceptance.

Reproduce with the commands in the [phase report](../../phase-reports/phase-4.4-report.md). `node scripts/check-world.mjs http://127.0.0.1:4173 --production` overwrites these visual files and production metrics with the new run. The development command overwrites only development metrics. No browser profile, dependency cache or large trace is stored here.
