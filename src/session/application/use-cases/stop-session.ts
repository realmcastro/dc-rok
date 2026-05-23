import type { LicenseValidator } from '../../../license/index.js';
import type { Clock, CorrelationId, Logger } from '../../../shared/index.js';
import { SessionNotFoundError } from '../../domain/errors.js';
import type { SessionStateOutcome } from '../dto/session-outcome.js';
import type { AgentRuntimePort } from '../ports/agent-runtime-port.js';
import type { SessionUnitOfWork } from '../ports/session-unit-of-work.js';

export interface StopSessionInput {
  readonly accountId: string;
  readonly actorDiscordUserId: string;
  readonly correlationId: CorrelationId;
}

interface Deps {
  readonly uow: SessionUnitOfWork;
  readonly licenseValidator: LicenseValidator;
  readonly agentRuntime: AgentRuntimePort;
  readonly clock: Clock;
  readonly log: Logger;
}

/**
 * Stop a running session. /stop is intentionally lenient — it only requires
 * the account to have ever held a license (for audit attribution). It does
 * NOT require the license to currently be valid; a user with an expired
 * license should still be able to issue a stop.
 */
export class StopSession {
  constructor(private readonly deps: Deps) {}

  async run(input: StopSessionInput): Promise<SessionStateOutcome> {
    const now = this.deps.clock.now();

    const session = await this.deps.uow.run(async (tx) => {
      const existing = await tx.sessions.findByAccountId(input.accountId);
      if (!existing) {
        throw new SessionNotFoundError('no session exists for this account');
      }
      const fromState = existing.state;
      const stopped = existing.stop(now);
      await tx.sessions.save(stopped);
      await tx.audit.record({
        actor: input.actorDiscordUserId,
        action: 'session.stop',
        targetType: 'session',
        targetId: stopped.id,
        correlationId: input.correlationId,
        payload: {
          accountId: input.accountId,
          fromState,
          toState: stopped.state,
        },
      });
      return stopped;
    });

    await this.deps.agentRuntime.stop({
      accountId: input.accountId,
      sessionId: session.id,
      correlationId: input.correlationId,
    });

    this.deps.log.info(
      {
        op: 'session.stop',
        sessionId: session.id,
        accountId: input.accountId,
        correlationId: input.correlationId,
      },
      'session stopped',
    );

    // Re-resolve license context for the response. Non-fatal — /stop must
    // succeed even when the license has since expired or been revoked.
    const validation = await this.deps.licenseValidator.validateForAccount(input.accountId, now);
    const licenseId = validation.ok ? validation.licenseId : null;
    const licenseExpiresAt = validation.ok ? validation.expiresAt : null;

    return {
      sessionId: session.id,
      accountId: input.accountId,
      state: session.state,
      startedAt: session.startedAt,
      stoppedAt: session.stoppedAt,
      licenseId,
      licenseExpiresAt,
    };
  }
}
