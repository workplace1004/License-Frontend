import { useState, useCallback, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { apiUrl, TOKEN_KEY } from '../lib/apiBase.js';
import { IconArrowLeft } from '../components/AdminIcons.jsx';

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

export default function AdminSettings() {
  const { token, setToken, adminEmail, setAdminEmail, logout } = useOutletContext();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setEmail(adminEmail || '');
  }, [adminEmail]);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      const em = String(email).trim().toLowerCase();
      const np = String(newPassword);
      const cpw = String(currentPassword);
      const cfm = String(confirmPassword);

      if (!em || !em.includes('@')) {
        setError('Enter a valid email (username).');
        return;
      }

      if (np || cfm || cpw) {
        if (np.length < 6) {
          setError('New password must be at least 6 characters.');
          return;
        }
        if (np !== cfm) {
          setError('New password and confirmation do not match.');
          return;
        }
        if (!cpw) {
          setError('Enter your current password to change it.');
          return;
        }
      }

      const body = { email: em };
      if (np) {
        body.currentPassword = cpw;
        body.newPassword = np;
      }

      if (em === adminEmail && !np) {
        setError('Change your email or enter a new password.');
        return;
      }

      setBusy(true);
      try {
        const res = await fetch(apiUrl('/admin/me'), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) {
          setError(j.message || j.error || `Update failed (${res.status})`);
          if (res.status === 401) logout();
          return;
        }
        if (j.token) {
          sessionStorage.setItem(TOKEN_KEY, j.token);
          setToken(j.token);
        }
        if (j.admin?.email) {
          setAdminEmail(j.admin.email);
        }
        setMessage('Saved.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch {
        setError('Could not reach the license API.');
      } finally {
        setBusy(false);
      }
    },
    [
      email,
      adminEmail,
      newPassword,
      confirmPassword,
      currentPassword,
      token,
      setToken,
      setAdminEmail,
      logout
    ]
  );

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/admin"
          title="Back to licenses"
          aria-label="Back to licenses"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-pos-border text-pos-text hover:bg-pos-bg"
        >
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-semibold text-pos-text">Settings</h2>
      </div>

      <div className="rounded-2xl border border-pos-border bg-pos-panel p-6 shadow-xl">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="settings-email">
              Username (email)
            </label>
            <input
              id="settings-email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={busy}
            />
          </div>

          <div className="border-t border-pos-border pt-5">
            <p className="mb-3 text-sm text-pos-muted">Change password (leave blank to keep current)</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="settings-current-pw">
                  Current password
                </label>
                <div className="relative">
                  <input
                    id="settings-current-pw"
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-pos-border bg-pos-bg py-2.5 pl-3 pr-11 text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
                    value={currentPassword}
                    onChange={(ev) => setCurrentPassword(ev.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-pos-muted hover:bg-pos-bg"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={!showCurrent} />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="settings-new-pw">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="settings-new-pw"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-pos-border bg-pos-bg py-2.5 pl-3 pr-11 text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
                    value={newPassword}
                    onChange={(ev) => setNewPassword(ev.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-pos-muted hover:bg-pos-bg"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={!showNew} />
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="settings-confirm-pw">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="settings-confirm-pw"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-pos-border bg-pos-bg py-2.5 pl-3 pr-11 text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
                    value={confirmPassword}
                    onChange={(ev) => setConfirmPassword(ev.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-pos-muted hover:bg-pos-bg"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={!showConfirm} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {message ? <p className="text-sm text-pos-accent">{message}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-pos-accent py-3 text-base font-semibold text-pos-bg disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
