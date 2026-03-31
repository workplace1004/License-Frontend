import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev: `/issuer-api/*` is proxied to the license API.
 * - Default: http://127.0.0.1:5050 (run license-server). No need for server.mjs on 5180.
 * - If ISSUER_DEV_PROXY_TARGET=http://127.0.0.1:5180, use the local Node proxy (adds LICENSE_ADMIN_SECRET). Run: npm run dev:with-proxy
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = (
    env.ISSUER_DEV_PROXY_TARGET ||
    env.LICENSE_API_URL ||
    'http://127.0.0.1:5050'
  )
    .trim()
    .replace(/\/$/, '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5176,
      proxy: {
        '/issuer-api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/issuer-api/, '')
        }
      }
    }
  };
});
