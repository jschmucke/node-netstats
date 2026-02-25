import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  const apiOrigin =
    env.VITE_API_ORIGIN ?? `http://localhost:${env.PORT ?? '3003'}`;

  return {
    plugins: [react()],
    envDir: rootDir,
    server: {
      proxy: {
        '/api': apiOrigin,
        '/socket.io': {
          target: apiOrigin,
          ws: true,
        },
      },
    },
  };
});
