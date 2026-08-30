import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built output is served straight off nginx from dist/, with an SPA fallback
// so /setup/ and /docs/ survive a hard refresh.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5180,
  },
});
