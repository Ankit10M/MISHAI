# IDE-agent handoff — close the technical foundation

Use this task after the documentation files have been integrated into the project.

## Task

Review the reconstructed documentation, then close the bounded Phase 4.1 foundation scope. Preserve the portfolio vision and the distinction between recovered planning, observed implementation, new proposals, and open decisions.

Read `docs/README.md` and its linked vision, constitution, stack, architecture, open decisions, development order, and Phase 4.1 report before making changes.

## Implement

1. Reproduce the readonly DPR tuple error. Make a minimal type-safe correction preserving the `[1, 2]` range.
2. Correct the DPR comment: the upper cap controls excessive high-density rendering cost; the lower bound is a floor.
3. Apply the project's formatter to the four existing reported files. Avoid unrelated refactors.
4. Check documentation references and accurately update any facts changed by this task.
5. Run `npm run build`, `npm run lint`, and `npm run format:check`. Investigate failures and report actual results.
6. Start the app and verify browser mount, resize behavior, and console output. The current scene intentionally renders no objects. If browser verification is unavailable, state that limitation and leave runtime verification open.
7. Update `docs/implementation/phase-reports/phase-4.1-report.md` with changed files, validation, runtime evidence, remaining gaps, and one bounded proposed next step.

## Boundaries

- No particles, humanoid, Big Bang, new state framework, or animation libraries in this task.
- Do not replace Vite with a historical Next.js proposal.
- Do not invent missing fonts, content, email, project links, benchmarks, or historical phase specifications.
- Preserve semantic DOM / WebGL separation and frame-local ownership principles.
- Stop after the report for review; do not automatically start another phase.

## Return

Provide a concise summary of changes, check results, browser observations, unresolved issues, and the report path. Mark Phase 4.1 complete only when its stated acceptance criteria are met.
