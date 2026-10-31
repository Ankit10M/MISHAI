# MISHAI — Mantis Digital Universe

Ankit's interactive portfolio: a gradually evolving, particle-driven digital universe connecting identity, projects, skills, and experience.

The public portfolio retains the Phase 4.4 ambient field and semantic shell, including native navigation, section tracking and motion controls. Phase 4.5 adds a separate development-only fragmented humanoid preview: 2,600 deterministic particles, explicit region metadata, front/three-quarter views and region isolation. It is excluded from the production build. This is a provisional anatomical proxy, not final art direction or a narrative reveal.

## Start here

This file is the documentation index. Read the following before continuing development:

- [Vision](product/vision.md), [experience constitution](product/experience-constitution.md), and [content and narrative](product/content-and-narrative.md).
- [Technology stack](decisions/technology-stack.md), [performance strategy](decisions/performance-strategy.md), and [open decisions](decisions/open-decisions.md).
- [Application boundaries](architecture/application-boundaries.md) and [rendering architecture](architecture/rendering-architecture.md).
- [Development order](implementation/development-order.md), [phase roadmap](implementation/phase-roadmap.md), [current Phase 4.5 report](implementation/phase-reports/phase-4.5-report.md), [entity visual evidence](implementation/evidence/phase-4.5/README.md), [historical Phase 4.4 report](implementation/phase-reports/phase-4.4-report.md), [historical Phase 4.3 report](implementation/phase-reports/phase-4.3-report.md), [historical Phase 4.2 report](implementation/phase-reports/phase-4.2-report.md), [historical Phase 4.1 report](implementation/phase-reports/phase-4.1-report.md), and [historical closure handoff](implementation/next-agent-handoff.md).

Documentation was reconstructed on 2026-10-30 from recovered planning and repository inspection. It is not an exact transcript of every historical decision. Open choices are recorded explicitly.

## Local development

```sh
npm ci
npm run dev
```

Available checks: `npm run build`, `npm run lint`, `npm run format:check`. The build includes TypeScript checking. A standalone `npm run typecheck` is also available.

After starting Vite, open `http://localhost:5173/dev/entity.html` to review the static entity. Front/three-quarter buttons, region selection and reset are native DOM controls. The normal portfolio never imports the preview. After building, run `node scripts/check-entity.mjs`; `node scripts/check-entity-browser.mjs` additionally needs the development server and disposable Chrome debugging session described in the report.

Phase 4.1's DPR correction remains intact. Pure checks are `node scripts/check-experience.mjs` and `node scripts/check-particles.mjs` (Node 24 native TypeScript stripping). Browser checks are `node scripts/check-shell.mjs` and `node scripts/check-world.mjs`; they require a local server and disposable Chrome profile with localhost debugging on port 9222. The world check also runs against production preview and saves small evidence artifacts. Test-only lifecycle fixtures are not production entries. See the current report for reproduction commands, actual results, conditions and limitations.

The reconstructed audit used Node 24.22.1 and npm 11.9.0; the Phase 4.1 closure and Phase 4.2 used Node 24.17.0 and npm 11.13.0. These are observed versions, not a support policy. Phase 4.2 removed the repository's `docs/` ignore rule; documentation is eligible for normal Git tracking. Nothing was committed or pushed by this task.

## Working process

An implementation agent makes scoped changes and writes a phase report. The planning/review assistant reviews that report against the documented vision. Work proceeds phase by phase. See [development order](implementation/development-order.md). Phase 4.4 was reviewed at `1bb4e4b`; Phase 4.5 is ready for review. Formation animation and later phases have not started. The older closure handoff is retained as historical task evidence.
