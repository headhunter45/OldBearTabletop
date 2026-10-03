/**
 * Universal UUID v4 generator that works in both secure and insecure contexts (HTTP / LAN IP).
 * Automatically falls back to crypto.getRandomValues or Math.random if crypto.randomUUID is unavailable.
 */
export function generateUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      try {
        return globalThis.crypto.randomUUID();
      } catch {}
    }
    if (typeof globalThis.crypto.getRandomValues === 'function') {
      try {
        const bytes = new Uint8Array(16);
        globalThis.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      } catch {}
    }
  }

  // Math.random fallback for environments without Web Crypto
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Polyfills globalThis.crypto.randomUUID if it does not exist (e.g. Insecure HTTP LAN contexts).
 */
export function polyfillCryptoRandomUUID(): void {
  if (typeof globalThis === 'undefined') return;
  try {
    if (!globalThis.crypto) {
      (globalThis as any).crypto = {};
    }
    if (typeof globalThis.crypto.randomUUID !== 'function') {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: generateUUID,
        writable: true,
        configurable: true,
      });
    }
  } catch {
    try {
      (globalThis.crypto as any).randomUUID = generateUUID;
    } catch {}
  }
}

// Auto-run polyfill immediately on module load
polyfillCryptoRandomUUID();
