import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

const normalizeBase = (path?: string) => {
  if (!path) return '';
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '';
};

const repoBase = normalizeBase(process.env.BASE_PATH);
const base = repoBase ? `${repoBase}remote/` : '/';

export default defineConfig({
  base,
  server: {
    port: 5001
  },
  preview: {
    port: 5001
  },
  plugins: [
    react(),
    federation({
      name: 'remote',
      filename: 'remoteEntry.js',
      exposes: {
        './Greeting': './src/Greeting.tsx'
      },
      shared: ['react', 'react-dom']
    })
  ]
});
