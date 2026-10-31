# MISHAI — Mantis Digital Universe

Ankit's interactive portfolio: a gradually evolving, particle-driven digital universe connecting identity, projects, skills, and experience.

The repository now contains the Phase 4.3 minimal experience-state layer on the semantic portfolio shell: Creator, Projects, Skills & Technology, Work Experience, and Contact. A shared registry drives sections/navigation, observed location drives current-link feedback, and explicit anchor intent remains separate. Native navigation and missing-content states remain intact. The 3D scene remains intentionally empty; the planned cinematic experience is not implemented.

## Start here

This file is the documentation index. Read the following before continuing development:

- [Vision](product/vision.md), [experience constitution](product/experience-constitution.md), and [content and narrative](product/content-and-narrative.md).
- [Technology stack](decisions/technology-stack.md), [performance strategy](decisions/performance-strategy.md), and [open decisions](decisions/open-decisions.md).
- [Application boundaries](architecture/application-boundaries.md) and [rendering architecture](architecture/rendering-architecture.md).
- [Development order](implementation/development-order.md), [phase roadmap](implementation/phase-roadmap.md), [current Phase 4.3 report](implementation/phase-reports/phase-4.3-report.md), [historical Phase 4.2 report](implementation/phase-reports/phase-4.2-report.md), [historical Phase 4.1 report](implementation/phase-reports/phase-4.1-report.md), and [historical closure handoff](implementation/next-agent-handoff.md).

Documentation was reconstructed on 2026-10-30 from recovered planning and repository inspection. It is not an exact transcript of every historical decision. Open choices are recorded explicitly.

## Local development

```sh
npm ci
npm run dev
```

Available checks: `npm run build`, `npm run lint`, `npm run format:check`. The build includes TypeScript checking. A standalone `npm run typecheck` is also available.

Phase 4.1's DPR correction remains intact. Phase 4.3 checks include `node scripts/check-experience.mjs` (pure policy/state assertions; Node 24 native TypeScript stripping) and `node scripts/check-shell.mjs` (Phase 4.2 regressions plus tracking/history/lifecycle assertions). The latter requires a running local Vite dev server and a disposable Chrome profile with debugging on localhost port 9222; its test-only lifecycle fixture is not part of the production entry. See the current report for actual results, conditions, warnings, and limitations.

The reconstructed audit used Node 24.22.1 and npm 11.9.0; the Phase 4.1 closure and Phase 4.2 used Node 24.17.0 and npm 11.13.0. These are observed versions, not a support policy. Phase 4.2 removed the repository's `docs/` ignore rule; documentation is eligible for normal Git tracking. Nothing was committed or pushed by this task.

## Working process

An implementation agent makes scoped changes and writes a phase report. The planning/review assistant reviews that report against the documented vision. Work proceeds phase by phase. See [development order](implementation/development-order.md). Phase 4.2 was reviewed at `caa427e`; Phase 4.3 is ready for review. No Phase 4.4 work has started. The older closure handoff is retained as historical task evidence.
