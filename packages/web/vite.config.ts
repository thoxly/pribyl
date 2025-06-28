
// vite.config.ts  (packages/web)
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // подтягиваем .env (.local / .development и т.д.)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,   // <- теперь это строка
          changeOrigin: true,
          secure: false,                   // если Cloudflare выдаёт self-signed SSL
        },
      },
    },
  };
});

