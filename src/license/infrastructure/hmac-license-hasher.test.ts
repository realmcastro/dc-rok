import { describe, expect, it } from 'vitest';

import { HmacLicenseHasher } from './hmac-license-hasher.js';

describe('HmacLicenseHasher', () => {
  it('is deterministic for the same pepper + input', () => {
    const h = new HmacLicenseHasher('a'.repeat(32));
    expect(h.hash('code-1')).toBe(h.hash('code-1'));
  });

  it('changes output when the pepper changes', () => {
    const a = new HmacLicenseHasher('a'.repeat(32));
    const b = new HmacLicenseHasher('b'.repeat(32));
    expect(a.hash('x')).not.toBe(b.hash('x'));
  });

  it('rejects short peppers', () => {
    expect(() => new HmacLicenseHasher('short')).toThrow(/pepper/);
  });

  it('produces 64 hex chars (sha256)', () => {
    const h = new HmacLicenseHasher('a'.repeat(32));
    expect(h.hash('x')).toMatch(/^[0-9a-f]{64}$/);
  });
});
