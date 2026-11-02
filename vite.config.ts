import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The normal index.html is the sole production entry; reject accidental preview imports.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'exclude-entity-preview-from-production',
      apply: 'build',
      generateBundle() {
        for (const id of this.getModuleIds()) {
          if (
            /\/(src\/dev\/|scripts\/|src\/world\/entity\/EntityPoints\.)/.test(
              id.replaceAll('\\', '/'),
            )
          ) {
            this.error('Development preview or test modules entered the production bundle');
          }
        }
      },
    },
  ],
});
