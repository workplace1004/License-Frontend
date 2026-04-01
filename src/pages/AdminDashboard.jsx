import { useState, useCallback, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiUrl } from '../lib/apiBase.js';
import { IconRefresh } from '../components/AdminIcons.jsx';

export default function AdminDashboard() {
  const { token, logout } = useOutletContext();
  const [licenses, setLicenses] = useState([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licensesError, setLicensesError] = useState(null);

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
    loadLicenses();
  }, [loadLicenses]);

  return (
    <section className="rounded-2xl border border-pos-border bg-pos-panel p-6 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-pos-text">Registered licenses</h2>
        <button
          type="button"
          onClick={() => loadLicenses()}
          disabled={licensesLoading}
          title="Refresh"
          aria-label="Refresh license list"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-pos-border text-pos-text hover:bg-pos-bg disabled:opacity-50"
        >
          <IconRefresh className={`h-5 w-5 ${licensesLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {licensesError ? <p className="mb-3 text-sm text-red-400">{licensesError}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm text-pos-text">
          <thead>
            <tr className="border-b border-pos-border text-pos-muted">
              <th className="py-2 pr-3 font-medium">Email</th>
              <th className="py-2 pr-3 font-medium">License key</th>
              <th className="py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 && !licensesLoading ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-pos-muted">
                  No licenses yet.
                </td>
              </tr>
            ) : (
              licenses.map((row) => (
                <tr key={row.id} className="border-b border-pos-border/60">
                  <td className="py-2 pr-3 align-top">{row.email}</td>
                  <td className="py-2 pr-3 align-top font-mono text-xs">{row.licenseKey}</td>
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
  );
}
