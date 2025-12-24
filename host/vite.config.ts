import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

const normalizeBase = (path?: string) => {
  if (!path) return '';
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '';
};

const repoBase = normalizeBase(process.env.BASE_PATH);
const base = repoBase || '/';
const remoteBase = repoBase ? `${repoBase}remote/` : '/';

const remoteEntryUrl =
  process.env.REMOTE_ENTRY_URL ??
  (process.env.NODE_ENV === 'production'
    ? `${remoteBase}assets/remoteEntry.js`
    : 'http://localhost:5001/assets/remoteEntry.js');

export default defineConfig({
  base,
  server: {
    port: 5000
  },
  preview: {
    port: 5000
  },
  build: {
    target: 'es2022'
  },
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        remote: remoteEntryUrl
      },
      shared: ['react', 'react-dom']
    })
  ]
});
