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
        },
        // OpenStreetMap Nominatim (User-Agent required; browser cannot call directly).
        '/issuer-geocode': {
          target: 'https://nominatim.openstreetmap.org',
          changeOrigin: true,
          rewrite: (path) => {
            try {
              const u = new URL(path, 'http://local.dev');
              if (u.pathname !== '/issuer-geocode/suggest') return path;
              const q = u.searchParams.get('q') || '';
              return `/search?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=0&dedupe=1`;
            } catch {
              return path;
            }
          },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader(
                'User-Agent',
                'POS-Restaurant-License-Issuer/1.0 (internal license tool)'
              );
              proxyReq.setHeader('Accept-Language', 'en');
            });
          }
        }
      }
    }
  };
});
