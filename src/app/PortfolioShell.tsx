import { portfolio } from '../content/portfolio';

const sections = [
  { id: 'creator', label: 'Creator' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills & Technology' },
  { id: 'experience', label: 'Work Experience' },
  { id: 'contact', label: 'Contact' },
];

export function PortfolioShell() {
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
                <a href={`#${id}`}>{label}</a>
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

        <section
          className="content-section"
          id="creator"
          aria-labelledby="creator-heading"
          tabIndex={-1}
        >
          <h2 id="creator-heading">
            <span aria-hidden="true">01 / </span>Creator
          </h2>
          <div className="section-body">
            <p className="section-lead">{portfolio.creator.name}</p>
            <p className="content-note">
              {portfolio.creator.biography ?? 'Biography not yet supplied.'}
            </p>
          </div>
        </section>

        <section
          className="content-section"
          id="projects"
          aria-labelledby="projects-heading"
          tabIndex={-1}
        >
          <h2 id="projects-heading">
            <span aria-hidden="true">02 / </span>Projects
          </h2>
          <div className="section-body">
            <p className="content-note">
              Project descriptions, images, and links are not yet supplied.
            </p>
            <ol className="project-list">
              {portfolio.projects.map((project) => (
                <li key={project}>
                  <h3>{project}</h3>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="content-section"
          id="skills"
          aria-labelledby="skills-heading"
          tabIndex={-1}
        >
          <h2 id="skills-heading">
            <span aria-hidden="true">03 / </span>Skills &amp; Technology
          </h2>
          <div className="section-body">
            <ul className="skills-list">
              {portfolio.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="content-section"
          id="experience"
          aria-labelledby="experience-heading"
          tabIndex={-1}
        >
          <h2 id="experience-heading">
            <span aria-hidden="true">04 / </span>Work Experience
          </h2>
          <div className="section-body">
            <p className="eyebrow">{portfolio.experience.period}</p>
            <h3>{portfolio.experience.role}</h3>
            <p>{portfolio.experience.employer}</p>
            <p className="content-note">
              {portfolio.experience.details ??
                'Role details not yet supplied. Current role status awaits confirmation before publication.'}
            </p>
          </div>
        </section>

        <section
          className="content-section"
          id="contact"
          aria-labelledby="contact-heading"
          tabIndex={-1}
        >
          <h2 id="contact-heading">
            <span aria-hidden="true">05 / </span>Contact
          </h2>
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
        </section>
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
