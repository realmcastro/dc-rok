import type { ActivationCodeRepository } from '../ports/activation-code-repository.js';
import type { LicenseRepository } from '../ports/license-repository.js';
import type { LicenseValidationResult, LicenseValidator } from '../ports/license-validator.js';

/**
 * Default implementation of `LicenseValidator`.
 *
 * An account is "licensed" when at least one redeemed activation code points to
 * a license that is currently ACTIVE and not past `expiresAt`. The first such
 * license found wins (Phase 1 has at most one active linkage per account).
 */
export class LicenseValidationService implements LicenseValidator {
  constructor(
    private readonly licenses: LicenseRepository,
    private readonly codes: ActivationCodeRepository,
  ) {}

  async validateForAccount(accountId: string, now: Date): Promise<LicenseValidationResult> {
    const candidates = await this.codes.findRedeemedByAccount(accountId);
    if (candidates.length === 0) {
      return { ok: false, code: 'NO_LICENSE_FOR_ACCOUNT' };
    }

    let sawRevoked = false;
    let sawExpired = false;
    for (const code of candidates) {
      const license = await this.licenses.findById(code.licenseId);
      if (!license) continue;
      if (license.status === 'REVOKED') {
        sawRevoked = true;
        continue;
      }
      if (license.status === 'EXPIRED' || now.getTime() >= license.expiresAt.getTime()) {
        sawExpired = true;
        continue;
      }
      return { ok: true, licenseId: license.id, expiresAt: license.expiresAt };
    }

    if (sawExpired) return { ok: false, code: 'LICENSE_EXPIRED' };
    if (sawRevoked) return { ok: false, code: 'LICENSE_REVOKED' };
    return { ok: false, code: 'NO_LICENSE_FOR_ACCOUNT' };
  }
}
