import type { AuditWriter } from '../../audit/index.js';
import type {
  ActivationCodeRepository,
  LicenseRepository,
} from '../../license/index.js';
import type { LinkTxContext, LinkUnitOfWork } from '../application/ports/link-unit-of-work.js';
import type { AccountRepository } from '../application/ports/account-repository.js';

/**
 * Test-only UoW. No isolation; callers must not rely on rollback.
 */
export class InMemoryLinkUnitOfWork implements LinkUnitOfWork {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly licenses: LicenseRepository,
    private readonly codes: ActivationCodeRepository,
    private readonly audit: AuditWriter,
  ) {}

  async run<T>(callback: (tx: LinkTxContext) => Promise<T>): Promise<T> {
    return await callback({
      accounts: this.accounts,
      licenses: this.licenses,
      codes: this.codes,
      audit: this.audit,
    });
  }
}
