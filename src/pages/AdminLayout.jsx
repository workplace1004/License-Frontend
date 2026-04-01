import { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin.jsx';
import { apiUrl, TOKEN_KEY } from '../lib/apiBase.js';
import { IconUserCircle, IconCog, IconSignOut, IconChevronDown } from '../components/AdminIcons.jsx';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setAdminEmail('');
    setAdminUsername('');
    setMenuOpen(false);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/admin/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok && j.admin) {
        if (j.admin.email) setAdminEmail(j.admin.email);
        if (j.admin.username != null) setAdminUsername(j.admin.username);
      }
      if (res.status === 401) logout();
    } catch {
      /* ignore */
    }
  }, [token, logout]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const onLoggedIn = useCallback((t, profile) => {
    setToken(t);
    setAdminEmail(profile?.email || '');
    setAdminUsername(profile?.username || '');
  }, []);

  if (!token) {
    return <AdminLogin onLoggedIn={onLoggedIn} />;
  }

  const headerLabel = adminUsername || adminEmail || 'Admin';

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-pos-text">License admin</h1>
          <div className="flex items-center gap-2">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-pos-border py-1.5 pl-2 pr-3 text-left text-sm text-pos-text hover:bg-pos-bg"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pos-bg text-pos-accent">
                  <IconUserCircle className="h-6 w-6" />
                </span>
                <span className="max-w-[160px] truncate sm:max-w-[220px]">{headerLabel}</span>
                <IconChevronDown className={`h-4 w-4 shrink-0 text-pos-muted transition ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen ? (
                <div
                  className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-pos-border bg-pos-panel py-1 shadow-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-pos-text hover:bg-pos-bg"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/admin/settings');
                    }}
                  >
                    <IconCog className="h-5 w-5 shrink-0 text-pos-muted" />
                    Settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-pos-bg"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    <IconSignOut className="h-5 w-5 shrink-0" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <Outlet
          context={{
            token,
            setToken,
            adminEmail,
            setAdminEmail,
            adminUsername,
            setAdminUsername,
            logout
          }}
        />
      </div>
    </div>
  );
}
