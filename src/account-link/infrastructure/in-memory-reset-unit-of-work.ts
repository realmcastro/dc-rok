import type { AuditWriter } from '../../audit/index.js';
import type { SessionRepository } from '../../session/index.js';
import type { AccountRepository } from '../application/ports/account-repository.js';
import type { ResetTxContext, ResetUnitOfWork } from '../application/ports/reset-unit-of-work.js';

/**
 * Test-only UoW. No isolation; callers must not rely on rollback.
 */
export class InMemoryResetUnitOfWork implements ResetUnitOfWork {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly sessions: SessionRepository,
    private readonly audit: AuditWriter,
  ) {}

  async run<T>(callback: (tx: ResetTxContext) => Promise<T>): Promise<T> {
    return await callback({
      accounts: this.accounts,
      sessions: this.sessions,
      audit: this.audit,
    });
  }
}
