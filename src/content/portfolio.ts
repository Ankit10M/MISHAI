type PortfolioContent = {
  creator: { name: string; biography: string | null };
  projects: readonly string[];
  skills: readonly string[];
  experience: { employer: string; role: string; period: string; details: string | null };
  email: string | null;
};

// Supplied content: docs/product/content-and-narrative.md. Null means not supplied.
export const portfolio: PortfolioContent = {
  creator: { name: 'Ankit', biography: null },
  projects: [
    'NeuroSearch AI',
    'AI Video Assistant',
    'ShoutPay – Transaction Alert App',
    'Multi Agent System',
    'Loan Prediction',
    'Solar ERP System',
    'Aplus Samvaad webApp',
    'Movie Recommendation System',
  ],
  skills: [
    'RAG',
    'LangChain',
    'LangGraph',
    'Agentic AI',
    'Generative AI',
    'ML',
    'MongoDB',
    'React',
    'Python',
    'JavaScript',
    'Docker',
    'Git/GitHub',
    'Node.js',
    'Express.js',
    'FastAPI',
  ],
  experience: {
    employer: 'Kvantalabs Pvt Ltd',
    role: 'AI/ML Engineer',
    period: 'June 2026–present',
    details: null,
  },
  email: null,
};
