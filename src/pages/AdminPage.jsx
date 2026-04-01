import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl, TOKEN_KEY } from '../lib/apiBase.js';

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const [licenses, setLicenses] = useState([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licensesError, setLicensesError] = useState(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setLicenses([]);
  }, []);

  const loadLicenses = useCallback(async () => {
    if (!token) return;
    setLicensesLoading(true);
    setLicensesError(null);
    try {
      const res = await fetch(apiUrl('/admin/licenses'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setLicensesError(j.message || j.error || `Failed to load (${res.status})`);
        if (res.status === 401) logout();
        return;
      }
      setLicenses(Array.isArray(j.licenses) ? j.licenses : []);
    } catch {
      setLicensesError('Could not reach the license API.');
    } finally {
      setLicensesLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) loadLicenses();
  }, [token, loadLicenses]);

  const onLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setLoginError(null);
      const em = String(loginEmail).trim().toLowerCase();
      const pw = String(loginPassword);
      if (!em || !pw) {
        setLoginError('Enter email and password.');
        return;
      }
      setLoginBusy(true);
      try {
        const res = await fetch(apiUrl('/admin/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: em, password: pw })
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok || !j.token) {
          setLoginError(j.message || j.error || `Login failed (${res.status})`);
          return;
        }
        sessionStorage.setItem(TOKEN_KEY, j.token);
        setToken(j.token);
        setLoginPassword('');
      } catch {
        setLoginError('Could not reach the license API.');
      } finally {
        setLoginBusy(false);
      }
    },
    [loginEmail, loginPassword]
  );

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-pos-border bg-pos-panel p-8 shadow-xl">
          <h1 className="text-center text-2xl font-semibold text-pos-text">Admin sign in</h1>
          <p className="mt-2 text-center text-sm text-pos-muted">Sign in to view registered licenses.</p>
          <form className="mt-8 space-y-5" onSubmit={onLogin}>
            <div>
              <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                className="w-full rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
                value={loginEmail}
                onChange={(ev) => setLoginEmail(ev.target.value)}
                disabled={loginBusy}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
                value={loginPassword}
                onChange={(ev) => setLoginPassword(ev.target.value)}
                disabled={loginBusy}
              />
            </div>
            {loginError ? <p className="text-sm text-red-400">{loginError}</p> : null}
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full rounded-lg bg-pos-accent py-3 text-base font-semibold text-pos-bg disabled:opacity-50"
            >
              {loginBusy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-pos-muted">
            <Link to="/" className="text-pos-accent underline-offset-2 hover:underline">
              ← Back to issue license
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-pos-text">License admin</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="rounded-lg border border-pos-border px-4 py-2 text-sm font-medium text-pos-text hover:bg-pos-bg"
            >
              Issue license
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-pos-border px-4 py-2 text-sm font-medium text-pos-text hover:bg-pos-bg"
            >
              Sign out
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-pos-border bg-pos-panel p-6 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-pos-text">Registered licenses</h2>
            <button
              type="button"
              onClick={() => loadLicenses()}
              disabled={licensesLoading}
              className="rounded-lg border border-pos-border px-3 py-1.5 text-sm text-pos-text hover:bg-pos-bg disabled:opacity-50"
            >
              {licensesLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {licensesError ? <p className="mb-3 text-sm text-red-400">{licensesError}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm text-pos-text">
              <thead>
                <tr className="border-b border-pos-border text-pos-muted">
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">License key</th>
                  <th className="py-2 pr-3 font-medium">Activated</th>
                  <th className="py-2 pr-3 font-medium">Expires</th>
                  <th className="py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 && !licensesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-pos-muted">
                      No licenses yet.
                    </td>
                  </tr>
                ) : (
                  licenses.map((row) => (
                    <tr key={row.id} className="border-b border-pos-border/60">
                      <td className="py-2 pr-3 align-top">{row.email}</td>
                      <td className="py-2 pr-3 align-top font-mono text-xs">{row.licenseKey}</td>
                      <td className="py-2 pr-3 align-top">{row.isActivated ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-3 align-top text-pos-muted">
                        {row.expiresAt ? new Date(row.expiresAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-2 align-top text-pos-muted">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
