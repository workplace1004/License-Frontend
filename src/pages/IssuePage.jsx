import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { downloadLicenseKeyFileFromBase64 } from '../licenseFileFormat.js';
import { apiUrl, getStoredAdminToken } from '../lib/apiBase.js';
import BirthdayPicker from '../components/BirthdayPicker.jsx';
import AddressSuggestInput from '../components/AddressSuggestInput.jsx';

/**
 * Allow common formatting; require digit count in the E.164-friendly range (7–15).
 * @param {string} raw
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function validatePhoneField(raw) {
  const t = String(raw).trim();
  if (!t) return { ok: false, message: 'Enter a phone number.' };
  if (!/^[\d\s\-+().]+$/.test(t)) {
    return {
      ok: false,
      message: 'Phone number can only include digits, spaces, +, -, parentheses, and periods.'
    };
  }
  const digits = t.replace(/\D/g, '');
  if (digits.length < 7) {
    return { ok: false, message: 'Phone number must include at least 7 digits.' };
  }
  if (digits.length > 15) {
    return { ok: false, message: 'Phone number cannot exceed 15 digits.' };
  }
  return { ok: true };
}

export default function IssuePage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [successLine, setSuccessLine] = useState(null);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessLine(null);
    const em = String(email).trim().toLowerCase();
    const fn = String(fullName).trim();
    const ph = String(phone).trim();
    const addr = String(address).trim();
    const bday = String(birthday).trim();
    const fp = String(deviceFingerprint).trim();
    if (!em || !em.includes('@')) {
      const msg = 'Enter a valid email address.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!fn) {
      const msg = 'Enter the customer full name.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!bday || !/^\d{4}-\d{2}-\d{2}$/.test(bday)) {
      const msg = 'Select a valid birthday.';
      setError(msg);
      toast.error(msg);
      return;
    }
    const phoneCheck = validatePhoneField(ph);
    if (!phoneCheck.ok) {
      setError(phoneCheck.message);
      toast.error(phoneCheck.message);
      return;
    }
    if (!addr) {
      const msg = 'Enter an address.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!/^[a-f0-9]{64}$/i.test(fp)) {
      const msg =
        'Device ID must be a 64-character hex string (copy from the POS license screen).';
      setError(msg);
      toast.error(msg);
      return;
    }
    setBusy(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = getStoredAdminToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(apiUrl('/license/create'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: em,
          fullName: fn,
          birthday: bday,
          phone: ph,
          address: addr,
          deviceFingerprint: fp.toLowerCase()
        })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        const msg = j.message || j.error || `Request failed (${res.status})`;
        setError(msg);
        toast.error(msg);
        return;
      }
      if (!j.licenseFileBase64 || typeof j.licenseFileBase64 !== 'string') {
        const msg =
          'Server did not return an encrypted license file. Set LICENSE_FILE_ENCRYPTION_KEY on license-server.';
        setError(msg);
        toast.error(msg);
        return;
      }
      downloadLicenseKeyFileFromBase64(j.licenseFileBase64);
      setSuccessLine(`Downloaded encrypted file "licenseKey" — send it to the customer for POS activation.`);
      toast.success('License created — licenseKey file downloaded. Send it to the customer for POS activation.');
    } catch {
      const msg =
        'Could not reach the issuer proxy. Run npm run dev (with license-server on 5050) or check the network.';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [email, fullName, birthday, phone, address, deviceFingerprint]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-pos-border bg-pos-panel p-8 shadow-xl">
        <h1 className="text-center text-2xl font-semibold text-pos-text">Issue POS license</h1>
        <p className="mt-2 text-center text-sm text-pos-muted">
          Enter customer details and the <strong className="text-pos-text">device ID</strong> from the POS license page.
          The license key is bound to that device. An encrypted file named{' '}
          <code className="text-pos-text">licenseKey</code> downloads automatically (not human-readable).
        </p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="issuer-fullname">
                Full name
              </label>
              <input
                id="issuer-fullname"
                type="text"
                autoComplete="name"
                placeholder="e.g. Jane Doe"
                className="w-full rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-pos-text placeholder:text-pos-muted/60 outline-none focus:ring-2 focus:ring-pos-accent"
                value={fullName}
                onChange={(ev) => setFullName(ev.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="issuer-email">
                Customer email
              </label>
              <input
                id="issuer-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-pos-text placeholder:text-pos-muted/60 outline-none focus:ring-2 focus:ring-pos-accent"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={busy}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="issuer-birthday">
                Birthday
              </label>
              <BirthdayPicker id="issuer-birthday" value={birthday} onChange={setBirthday} disabled={busy} />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="issuer-phone">
                Phone number
              </label>
              <input
                id="issuer-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. +1 555 123 4567"
                maxLength={15}
                className="w-full rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 text-pos-text placeholder:text-pos-muted/60 outline-none focus:ring-2 focus:ring-pos-accent"
                value={phone}
                onChange={(ev) => setPhone(ev.target.value)}
                disabled={busy}
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium text-pos-text" htmlFor="issuer-address">
              Address
            </label>
            <AddressSuggestInput
              id="issuer-address"
              placeholder="Start typing street, city, or postal code…"
              value={address}
              onChange={setAddress}
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
              className="w-full resize-y rounded-lg border border-pos-border bg-pos-bg px-3 py-2.5 font-mono text-lg text-pos-text outline-none focus:ring-2 focus:ring-pos-accent"
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
