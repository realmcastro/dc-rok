import { createHmac } from 'node:crypto';

import type { LicenseHasher } from '../application/ports/license-hasher.js';

/**
 * HMAC-SHA256 over a server-side pepper. Deterministic, so lookups by hash work.
 *
 * Security trade-off: HMAC is not memory-hard like argon2/bcrypt, but those are
 * not deterministic and so are unsuitable for lookup. Compromise: the pepper
 * must live outside the database and rotate on incident.
 */
export class HmacLicenseHasher implements LicenseHasher {
  constructor(private readonly pepper: string) {
    if (pepper.length < 32) {
      throw new Error('HmacLicenseHasher pepper must be at least 32 chars');
    }
  }

  hash(plaintext: string): string {
    return createHmac('sha256', this.pepper).update(plaintext, 'utf8').digest('hex');
  }
}
