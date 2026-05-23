import type { ActivationCodeId, LicenseId } from '../../domain/license-id.js';

/**
 * Result of issuing a new license. Plaintext codes are returned exactly once
 * and MUST be shown only to the admin issuer (ephemerally on Discord).
 */
export interface IssuedLicense {
  readonly licenseId: LicenseId;
  readonly expiresAt: Date;
  readonly maxActivations: number;
  readonly activationCodes: ReadonlyArray<{
    readonly id: ActivationCodeId;
    /** Plaintext, return-once. Never logged, never stored. */
    readonly code: string;
  }>;
}

export interface RedeemedActivationOutcome {
  readonly licenseId: LicenseId;
  readonly activationCodeId: ActivationCodeId;
  readonly licenseExpiresAt: Date;
  readonly remainingActivations: number;
}
