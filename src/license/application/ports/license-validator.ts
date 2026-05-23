import type { LicenseId } from '../../domain/license-id.js';

export type LicenseValidationResult =
  | { readonly ok: true; readonly licenseId: LicenseId; readonly expiresAt: Date }
  | { readonly ok: false; readonly code: LicenseValidationFailure };

export type LicenseValidationFailure =
  | 'NO_LICENSE_FOR_ACCOUNT'
  | 'LICENSE_EXPIRED'
  | 'LICENSE_REVOKED';

/**
 * Cross-module port consumed by `session` (and future modules) that need to
 * know whether an account currently has a usable license. Read-only.
 */
export interface LicenseValidator {
  validateForAccount(accountId: string, now: Date): Promise<LicenseValidationResult>;
}
