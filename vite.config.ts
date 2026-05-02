import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Le dépôt peut être ouvert via une jonction vers un dossier dont le nom contient « & » ;
  // sans cela, Vite résout le chemin réel et casse le chargement des URLs de modules.
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  /** Même proxy en `vite preview` (sinon POST /api → 404). */
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
