# Technology stack decision record

Status: installed foundation observed; optional tools and technical policies remain open.

The later planning direction preferred React + TypeScript + Vite. The repository now implements that foundation. Earlier Next.js proposals are historical alternatives, not the current application architecture.

## Declared package ranges at commit 1900e5c

| Tool                       | Declared range | Role                          |
| -------------------------- | -------------- | ----------------------------- |
| React / React DOM          | `^19.2.8`      | Application and DOM UI        |
| TypeScript                 | `^6.0.3`       | Static checking               |
| Vite                       | `^8.2.2`       | Development and build tooling |
| Tailwind CSS / Vite plugin | `^4.3.3`       | Styling                       |
| Three.js                   | `^0.185.1`     | 3D rendering foundation       |
| React Three Fiber          | `^9.7.0`       | React scene composition       |
| ESLint                     | `^10.9.1`      | Linting                       |
| Prettier                   | `^3.9.6`       | Formatting                    |

These are package.json ranges, not claims about newest available releases. The lockfile records exact dependency resolution. Do not replace versions merely to match an earlier planning list.

## Discussed but not installed

| Tool / technique       | Earlier intended use                     | Status                                        |
| ---------------------- | ---------------------------------------- | --------------------------------------------- |
| Drei                   | R3F helpers                              | Candidate; add only helpers actually needed   |
| Custom GLSL            | Particle/entity rendering                | Planned visual technique; no shaders yet      |
| Framer Motion          | DOM transitions                          | Candidate                                     |
| GSAP / ScrollTrigger   | Complex sequences and scroll transitions | Conditional candidate                         |
| Zustand                | Shared world/application state           | Considered, not selected in code              |
| Lenis                  | Smooth scroll                            | Earlier proposal; no settled scroll policy    |
| Postprocessing         | Selected visual effects                  | Earlier proposal; effect budget unestablished |
| Blender                | Asset authoring                          | Earlier proposal; no approved assets/workflow |
| Theatre.js / SplitText | Timeline / typography tools              | Historical optional proposals                 |

Do not install every discussed tool. Establish the feature need, property ownership, accessibility behavior, maintenance cost, and performance impact first.

## Boundaries

If GSAP is selected, its proposed role is major sequences/timelines. Framer Motion or CSS would own DOM transitions. Three.js/R3F owns spatial rendering. Avoid multiple animation libraries simultaneously controlling the same transform or camera property.

Backend, database, LLM service, analytics, CMS, hosting provider, and deployment process have not been established. The initial repository is a frontend scaffold.

## Decision updates

For each material selection, record: date, need, choice, alternatives, reason, affected modules, and validation. If a choice changes historical direction, explicitly say it is a new decision.
