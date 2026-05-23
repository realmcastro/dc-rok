import type { AuditWriter } from '../../../audit/index.js';
import type { ActivationCodeRepository, LicenseRepository } from '../../../license/index.js';

import type { SessionRepository } from './session-repository.js';

/**
 * Cross-module transactional context for session state changes.
 *
 * Contains the session repo (write), license repos (read-only, for validation),
 * and the audit writer (write). All backed by a single Prisma transaction in
 * production, so /start and /stop are atomic from the bot's perspective.
 */
export interface SessionTxContext {
  readonly sessions: SessionRepository;
  readonly licenses: LicenseRepository;
  readonly codes: ActivationCodeRepository;
  readonly audit: AuditWriter;
}

export interface SessionUnitOfWork {
  run<T>(callback: (tx: SessionTxContext) => Promise<T>): Promise<T>;
}
