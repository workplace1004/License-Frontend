/**
 * Must match frontend/src/lib/posWebLicense.js (POS_LICENSE_FILE_FORMAT).
 * Issuer downloads JSON the POS can import.
 */
export const POS_LICENSE_FILE_FORMAT = 'pos-restaurant-license';
export const POS_LICENSE_FILE_VERSION = 1;

export function buildLicenseFilePayload({ licenseKey, email, expiresAt, deviceFingerprint }) {
  return {
    format: POS_LICENSE_FILE_FORMAT,
    version: POS_LICENSE_FILE_VERSION,
    licenseKey,
    email: email || undefined,
    expiresAt: expiresAt || undefined,
    deviceFingerprint: deviceFingerprint ? String(deviceFingerprint).toLowerCase() : undefined,
    issuedAt: new Date().toISOString()
  };
}

/** Binary encrypted blob from license-server (`licenseFileBase64`). Filename: `licenseKey` (no extension). */
export function downloadLicenseKeyFileFromBase64(licenseFileBase64) {
  const b64 = String(licenseFileBase64 || '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'licenseKey';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
