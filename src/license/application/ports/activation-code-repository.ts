import type { ActivationCode } from '../../domain/activation-code.js';
import type { ActivationCodeId, LicenseId } from '../../domain/license-id.js';

export interface ActivationCodeRepository {
  findById(id: ActivationCodeId): Promise<ActivationCode | null>;
  findByCodeHash(codeHash: string): Promise<ActivationCode | null>;
  findByLicense(licenseId: LicenseId): Promise<ActivationCode[]>;
  /**
   * All codes redeemed by a given account (most recent first when supported).
   * Used for license validation lookups; not for general traversal.
   */
  findRedeemedByAccount(accountId: string): Promise<ActivationCode[]>;
  save(code: ActivationCode): Promise<void>;
}
