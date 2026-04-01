import { useState, useCallback, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiUrl } from '../lib/apiBase.js';
import { IconSearch, IconRefresh } from '../components/AdminIcons.jsx';

const PAGE_SIZE = 10;

function NoDataIllustration({ className = 'h-24 w-24 text-pos-muted/50' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="24" y="28" width="72" height="88" rx="8" stroke="currentColor" strokeWidth="2" />
      <path d="M40 48h40M40 62h32M40 76h40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="78" cy="38" r="18" fill="currentColor" opacity="0.12" />
      <path
        d="M72 38l4 4 8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
    </svg>
  );
}

export default function AdminDashboard() {
  const { token, logout } = useOutletContext();
  const [licenses, setLicenses] = useState([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licensesError, setLicensesError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return licenses;
    return licenses.filter((row) => {
      const email = String(row.email || '').toLowerCase();
      const key = String(row.licenseKey || '').toLowerCase().replace(/\s/g, '');
      const created = row.createdAt ? new Date(row.createdAt).toLocaleString().toLowerCase() : '';
      const name = String(row.fullName || '').toLowerCase();
      const phone = String(row.phone || '').toLowerCase();
      const addr = String(row.address || '').toLowerCase();
      const bday = String(row.birthday || '').toLowerCase();
      return (
        email.includes(q) ||
        key.includes(q.replace(/\s/g, '')) ||
        created.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        addr.includes(q) ||
        bday.includes(q)
      );
    });
  }, [licenses, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [filtered.length, totalPages]);

  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const showInitialLoading = licensesLoading && licenses.length === 0;
  const emptyFromApi = !licensesLoading && licenses.length === 0 && !licensesError;
  const emptyFromSearch = !licensesLoading && licenses.length > 0 && filtered.length === 0;

  return (
    <section className="rounded-2xl border border-pos-border bg-pos-panel p-6 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="shrink-0 text-lg font-semibold text-pos-text">Registered Users</h2>
        <div className="relative min-w-[12rem] flex-1 max-w-sm ml-10">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted">
            <IconSearch className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, key…"
            disabled={licensesLoading && licenses.length === 0}
            className="w-full rounded-lg border border-pos-border bg-pos-bg py-2 pl-9 pr-3 text-sm text-pos-text placeholder:text-pos-muted/60 outline-none focus:ring-2 focus:ring-pos-accent disabled:opacity-50"
            aria-label="Search licenses"
          />
        </div>
        <button
          type="button"
          onClick={() => loadLicenses()}
          disabled={licensesLoading}
          title="Refresh"
          aria-label="Refresh license list"
          className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-pos-border text-pos-text hover:bg-pos-bg disabled:opacity-50"
        >
          <IconRefresh className={`h-5 w-5 ${licensesLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {licensesError ? <p className="mb-3 text-sm text-red-400">{licensesError}</p> : null}

      {showInitialLoading ? (
        <p className="py-12 text-center text-sm text-pos-muted">Loading licenses…</p>
      ) : emptyFromApi ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <NoDataIllustration />
          <p className="text-sm font-medium text-pos-muted">No licenses yet</p>
          <p className="max-w-xs text-xs text-pos-muted/80">Issued licenses will appear in this table.</p>
        </div>
      ) : emptyFromSearch ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <NoDataIllustration />
          <p className="text-sm font-medium text-pos-muted">No matching licenses</p>
          <p className="max-w-xs text-xs text-pos-muted/80">Try a different search term.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm text-pos-text">
              <thead>
                <tr className="border-b border-pos-border text-pos-muted">
                  <th className="py-2 pr-3 font-medium">Full name</th>
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Phone</th>
                  <th className="py-2 pr-3 font-medium">Birthday</th>
                  <th className="py-2 pr-3 font-medium">Address</th>
                  <th className="py-2 pr-3 font-medium">License key</th>
                  <th className="py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((row) => (
                  <tr key={row.id} className="border-b border-pos-border/60">
                    <td className="max-w-[140px] py-2 pr-3 align-top">{row.fullName || '—'}</td>
                    <td className="py-2 pr-3 align-top">{row.email}</td>
                    <td className="py-2 pr-3 align-top whitespace-nowrap">{row.phone || '—'}</td>
                    <td className="py-2 pr-3 align-top text-pos-muted whitespace-nowrap">
                      {row.birthday || '—'}
                    </td>
                    <td className="max-w-[180px] py-2 pr-3 align-top text-pos-muted">
                      <span className="line-clamp-2" title={row.address || ''}>
                        {row.address || '—'}
                      </span>
                    </td>
                    <td className="py-2 pr-3 align-top font-mono text-xs whitespace-nowrap">
                      {row.licenseKey}
                    </td>
                    <td className="py-2 align-top text-pos-muted whitespace-nowrap">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-pos-border pt-4 text-sm text-pos-muted">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-pos-border px-3 py-1.5 text-pos-text hover:bg-pos-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="tabular-nums text-pos-text">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-pos-border px-3 py-1.5 text-pos-text hover:bg-pos-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
