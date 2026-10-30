import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import './styles/global.css';

// Application bootstrap — the single DOM entry point.
// Responsibility stops at mounting React; all composition lives in <App />.
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root was not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
