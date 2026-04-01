export const TOKEN_KEY = 'license_admin_token';

export function apiBasePath() {
  const direct = (import.meta.env.VITE_LICENSE_API_URL || '').trim().replace(/\/$/, '');
  if (direct) return direct;
  return '/issuer-api';
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${apiBasePath()}${p}`;
}

export function getStoredAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}
