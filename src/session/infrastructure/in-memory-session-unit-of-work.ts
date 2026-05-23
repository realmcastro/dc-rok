import type { AuditWriter } from '../../audit/index.js';
import type {
  ActivationCodeRepository,
  LicenseRepository,
} from '../../license/index.js';
import type {
  SessionTxContext,
  SessionUnitOfWork,
} from '../application/ports/session-unit-of-work.js';
import type { SessionRepository } from '../application/ports/session-repository.js';

export class InMemorySessionUnitOfWork implements SessionUnitOfWork {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly licenses: LicenseRepository,
    private readonly codes: ActivationCodeRepository,
    private readonly audit: AuditWriter,
  ) {}

  async run<T>(callback: (tx: SessionTxContext) => Promise<T>): Promise<T> {
    return await callback({
      sessions: this.sessions,
      licenses: this.licenses,
      codes: this.codes,
      audit: this.audit,
    });
  }
}
