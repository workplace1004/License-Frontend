import { useState, useCallback } from 'react';
import { downloadLicenseKeyFileFromBase64 } from './licenseFileFormat.js';

function createLicenseUrl() {
  const direct = (import.meta.env.VITE_LICENSE_API_URL || '').trim().replace(/\/$/, '');
  if (direct) return `${direct}/license/create`;
  return '/issuer-api/license/create';
}

export default function App() {
  const [email, setEmail] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [successLine, setSuccessLine] = useState(null);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setSuccessLine(null);
      const em = String(email).trim().toLowerCase();
      const fp = String(deviceFingerprint).trim();
      if (!em || !em.includes('@')) {
        setError('Enter a valid email address.');
        return;
      }
      if (!/^[a-f0-9]{64}$/i.test(fp)) {
        setError('Device ID must be a 64-character hex string (copy from the POS license screen).');
        return;
      }
      setBusy(true);
      try {
        const res = await fetch(createLicenseUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: em, deviceFingerprint: fp.toLowerCase() })
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) {
          setError(j.message || j.error || `Request failed (${res.status})`);
          return;
        }
        if (!j.licenseFileBase64 || typeof j.licenseFileBase64 !== 'string') {
          setError('Server did not return an encrypted license file. Set LICENSE_FILE_ENCRYPTION_KEY on license-server.');
          return;
        }
        downloadLicenseKeyFileFromBase64(j.licenseFileBase64);
        setSuccessLine(`Downloaded encrypted file "licenseKey" — send it to the customer for POS activation.`);
      } catch {
        setError('Could not reach the issuer proxy. Run npm run dev (with license-server on 5050) or check the network.');
      } finally {
        setBusy(false);
      }
    },
    [email, deviceFingerprint]
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-pos-border bg-pos-panel p-8 shadow-xl">
        <h1 className="text-center text-2xl font-semibold text-pos-text">Issue POS license</h1>
        <p className="mt-2 text-center text-sm text-pos-muted">
          Paste the <strong className="text-pos-text">device ID</strong> from the POS license page and the customer
          email. The license key is bound to that device. An encrypted file named <code className="text-pos-text">licenseKey</code> downloads automatically (not human-readable).
        </p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="issuer-email">
              Customer email
            </label>
            <input
              id="issuer-email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="issuer-fp">
              Device ID (from POS)
            </label>
            <textarea
              id="issuer-fp"
              rows={3}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 font-mono text-xs text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
              placeholder="64-character hex…"
              value={deviceFingerprint}
              onChange={(ev) => setDeviceFingerprint(ev.target.value.trim())}
              disabled={busy}
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {successLine ? <p className="text-sm text-pos-accent">{successLine}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-pos-accent py-3 text-base font-semibold text-pos-bg disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create license'}
          </button>
        </form>
      </div>
    </div>
  );
}
