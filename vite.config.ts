import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite configuration for the Mantis Digital Universe.
// Plugins are deliberately minimal at Phase 4.1: React (JSX + Fast Refresh)
// and Tailwind (styling layer). Rendering/asset concerns are handled inside
// the app, not here. See docs/decisions/technology-stack.md.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
