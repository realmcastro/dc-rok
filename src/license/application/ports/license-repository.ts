import type { License } from '../../domain/license.js';
import type { LicenseId } from '../../domain/license-id.js';

export interface LicenseRepository {
  findById(id: LicenseId): Promise<License | null>;
  findByKeyHash(keyHash: string): Promise<License | null>;
  save(license: License): Promise<void>;
}
