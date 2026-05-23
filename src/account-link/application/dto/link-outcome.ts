import type { LicenseId } from '../../../license/index.js';
import type { AccountId } from '../../domain/account-id.js';

export interface LinkOutcome {
  readonly accountId: AccountId;
  readonly licenseId: LicenseId;
  readonly licenseExpiresAt: Date;
  readonly remainingActivations: number;
  readonly externalAccountName: string;
}
