import type { LicenseValidator } from '../../../license/index.js';
import type { Clock } from '../../../shared/index.js';
import { AutomationSession } from '../../domain/automation-session.js';
import { asSessionId } from '../../domain/session-id.js';
import type { SessionStateOutcome } from '../dto/session-outcome.js';
import type { SessionRepository } from '../ports/session-repository.js';

interface Deps {
  readonly sessions: SessionRepository;
  readonly licenseValidator: LicenseValidator;
  readonly clock: Clock;
}

/**
 * Read-only status snapshot. Used by /status. Synthesizes an IDLE session
 * when none exists yet, so the response is always well-formed.
 */
export class GetSessionStatus {
  constructor(private readonly deps: Deps) {}

  async run(accountId: string): Promise<SessionStateOutcome & { uptimeMs: number }> {
    const now = this.deps.clock.now();
    const existing = await this.deps.sessions.findByAccountId(accountId);
    const session =
      existing ??
      AutomationSession.createIdle({
        id: asSessionId('SYNTHETIC0000000000000000A'),
        accountId,
        now,
      });

    const validation = await this.deps.licenseValidator.validateForAccount(accountId, now);
    const licenseId = validation.ok ? validation.licenseId : null;
    const licenseExpiresAt = validation.ok ? validation.expiresAt : null;

    return {
      sessionId: session.id,
      accountId,
      state: session.state,
      startedAt: session.startedAt,
      stoppedAt: session.stoppedAt,
      licenseId,
      licenseExpiresAt,
      uptimeMs: session.uptimeMs(now),
    };
  }
}
