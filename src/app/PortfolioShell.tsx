import type { ReactNode } from 'react';
import { portfolio } from '../content/portfolio';
import { isSectionActivation, type ExperienceSnapshot } from './experience';
import { sections, type SectionId } from './sections';

const sectionBodies = {
  creator: (
    <div className="section-body">
      <p className="section-lead">{portfolio.creator.name}</p>
      <p className="content-note">{portfolio.creator.biography ?? 'Biography not yet supplied.'}</p>
    </div>
  ),
  projects: (
    <div className="section-body">
      <p className="content-note">Project descriptions, images, and links are not yet supplied.</p>
      <ol className="project-list">
        {portfolio.projects.map((project) => (
          <li key={project}>
            <h3>{project}</h3>
          </li>
        ))}
      </ol>
    </div>
  ),
  skills: (
    <div className="section-body">
      <ul className="skills-list">
        {portfolio.skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </div>
  ),
  experience: (
    <div className="section-body">
      <p className="eyebrow">{portfolio.experience.period}</p>
      <h3>{portfolio.experience.role}</h3>
      <p>{portfolio.experience.employer}</p>
      <p className="content-note">
        {portfolio.experience.details ??
          'Role details not yet supplied. Current role status awaits confirmation before publication.'}
      </p>
    </div>
  ),
  contact: (
    <div className="section-body">
      <p className="section-lead">Email</p>
      {portfolio.email ? (
        <a href={`mailto:${portfolio.email}`}>{portfolio.email}</a>
      ) : (
        <p className="content-note">
          Email contact is unavailable. An address has not yet been supplied.
        </p>
      )}
    </div>
  ),
} satisfies Record<SectionId, ReactNode>;

export function PortfolioShell({
  snapshot,
  onNavigate,
}: {
  snapshot: ExperienceSnapshot;
  onNavigate: (section: SectionId) => void;
}) {
  return (
    <div className="portfolio-shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="site-header page-width" id="top">
        <a className="site-name" href="#top" aria-label={`${portfolio.creator.name}, back to top`}>
          {portfolio.creator.name}
          <span aria-hidden="true"> / </span>
          <span>Portfolio</span>
        </a>
        <nav aria-label="Portfolio sections">
          <ul>
            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={snapshot.activeSection === id ? 'location' : undefined}
                  onClick={(event) => {
                    if (isSectionActivation(event)) onNavigate(id);
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="page-width" id="content" tabIndex={-1}>
        <div className="introduction">
          <p className="eyebrow">Personal portfolio</p>
          <h1>{portfolio.creator.name}</h1>
          <p className="intro-note">A portfolio in progress.</p>
        </div>

        {sections.map(({ id, label }, index) => (
          <section
            key={id}
            className="content-section"
            id={id}
            aria-labelledby={`${id}-heading`}
            tabIndex={-1}
          >
            <h2 id={`${id}-heading`}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')} / </span>
              {label}
            </h2>
            {sectionBodies[id]}
          </section>
        ))}
      </main>
      <footer className="site-footer page-width">
        <p>{portfolio.creator.name} / Portfolio in progress</p>
        <a href="#top">
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </footer>
    </div>
  );
}
