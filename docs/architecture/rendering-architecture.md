# Rendering architecture

## Current render path

`main.tsx` mounts `App`; `App` renders independent `WorldCanvas` and `PortfolioShell` siblings. The world boundary contains one fixed, inert canvas behind the DOM content. `WorldCanvas` composes `Scene` inside R3F; `Scene` returns `null`.

| Setting                           | Observed value                                         |
| --------------------------------- | ------------------------------------------------------ |
| Canvas count                      | One                                                    |
| Camera position                   | `[0, 0, 6]`                                            |
| Camera field of view              | `50`                                                   |
| Antialias                         | Enabled                                                |
| Alpha                             | Disabled                                               |
| Background                        | `#05060a`                                              |
| Requested DPR clamp               | `[1, 2]`                                               |
| Frame scheduling                  | `frameloop="demand"` for the intentionally empty scene |
| Scene geometry / lights / effects | None                                                   |

These are foundation defaults, not completed art direction. The DPR constant now uses the mutable `[number, number]` tuple type accepted by R3F, preserving `[1, 2]`. Build and headless Chrome mount/resize checks pass; see the [Phase 4.1 report](../implementation/phase-reports/phase-4.1-report.md) for evidence and limitations.

Phase 4.2 constructs the Three renderer synchronously in the Canvas callback ref, passes it through R3F's supported `gl` factory, and lets a React boundary isolate initialization errors. Installed R3F's `fallback` prop only supplies canvas fallback HTML, and its asynchronous renderer configure call does not route initialization rejection into that boundary. Deliberately unavailable WebGL and thrown initialization errors were both tested; semantic content remains usable. See the [Phase 4.2 report](../implementation/phase-reports/phase-4.2-report.md).

Canvas sizing and teardown stay with R3F. There is no continuous animation in the empty world. Demand rendering is a new bounded idle policy, not adaptive quality or a measured performance improvement. Revisit explicit invalidation when animated scene systems are approved.

## Recovered rendering direction

The universe should have persistent spatial continuity. Entity formation, particles, environment, and camera evolve with narrative state while semantic content stays independently usable.

A sampled base mesh feeding a particle field was discussed as an entity approach, with custom shader/noise displacement and partial visibility. Treat this as a candidate implementation technique: no approved mesh, sampler, shader, particle count, or asset pipeline exists in this checkout.

Particles communicate formation, connection, and consequences. Preserve gaps, depth variation, and partial visibility. Avoid turning the target into a dense glowing mannequin.

Camera movement must be purposeful and restrained. Exact camera paths, scroll mapping, layer depths, chapter transitions, and interaction fields remain open.

## Implementation boundaries

- WorldCanvas owns renderer setup; keep narrative and feature logic out of it.
- Scene composes dedicated world modules.
- Rendering configuration holds defaults; an eventual quality policy may select effective settings.
- Per-frame visual work should avoid allocating large objects or triggering DOM rerenders unnecessarily.
- CPU state changes and GPU buffers/uniforms need explicit update ownership.
- Shader and resource cleanup must be verified when those resources are introduced.

## Not implemented

Particle buffers, humanoid asset sampling, shader effects, postprocessing, camera controller, narrative-to-world mapping, quality adaptation, motion policy for future scene objects, and context-loss recovery remain pending. Initialization fallback and reduced-motion-safe DOM navigation are implemented; they are not full resilience or accessibility systems.
