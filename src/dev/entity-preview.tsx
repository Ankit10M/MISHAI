import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EntityPreview } from './EntityPreview';

const container = document.getElementById('entity-root');
if (!container) throw new Error('Missing entity preview root');
if (import.meta.env.DEV) {
  createRoot(container).render(
    <StrictMode>
      <EntityPreview />
    </StrictMode>,
  );
}
