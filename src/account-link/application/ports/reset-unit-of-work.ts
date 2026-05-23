import type { AuditWriter } from '../../../audit/index.js';
import type { SessionRepository } from '../../../session/index.js';

import type { AccountRepository } from './account-repository.js';

/**
 * Cross-module transactional context for `ResetAccount`.
 *
 * Contains accounts (write), sessions (write), and audit (write),
 * all backed by a single DB transaction in production.
 */
export interface ResetTxContext {
  readonly accounts: AccountRepository;
  readonly sessions: SessionRepository;
  readonly audit: AuditWriter;
}

export interface ResetUnitOfWork {
  run<T>(callback: (tx: ResetTxContext) => Promise<T>): Promise<T>;
}
