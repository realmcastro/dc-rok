import type { LicenseTxContext, LicenseUnitOfWork } from '../../application/ports/unit-of-work.js';

import type { InMemoryActivationCodeRepository } from './in-memory-activation-code-repository.js';
import type { InMemoryLicenseRepository } from './in-memory-license-repository.js';

/**
 * Trivial unit-of-work for tests. There is no real isolation; callers must
 * not rely on rollback behaviour.
 */
export class InMemoryLicenseUnitOfWork implements LicenseUnitOfWork {
  constructor(
    private readonly licenses: InMemoryLicenseRepository,
    private readonly codes: InMemoryActivationCodeRepository,
  ) {}

  async run<T>(callback: (tx: LicenseTxContext) => Promise<T>): Promise<T> {
    return await callback({ licenses: this.licenses, codes: this.codes });
  }
}
