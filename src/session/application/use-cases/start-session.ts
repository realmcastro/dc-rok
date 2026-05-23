import type { LicenseId, LicenseValidator } from '../../../license/index.js';
import type {
  Clock,
  CorrelationId,
  IdGenerator,
  Logger,
} from '../../../shared/index.js';
import { AutomationSession } from '../../domain/automation-session.js';
import { asSessionId } from '../../domain/session-id.js';
import type { SessionStateOutcome } from '../dto/session-outcome.js';
import {
  NoLicenseForAccountError,
  SessionLicenseExpiredError,
  SessionLicenseRevokedError,
} from '../errors.js';
import type { AgentRuntimePort } from '../ports/agent-runtime-port.js';
import type { SessionUnitOfWork } from '../ports/session-unit-of-work.js';

export interface StartSessionInput {
  readonly accountId: string;
  readonly actorDiscordUserId: string;
  readonly correlationId: CorrelationId;
}

interface Deps {
  readonly uow: SessionUnitOfWork;
  readonly licenseValidator: LicenseValidator;
  readonly agentRuntime: AgentRuntimePort;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly log: Logger;
}

export class StartSession {
  constructor(private readonly deps: Deps) {}

  async run(input: StartSessionInput): Promise<SessionStateOutcome> {
    const now = this.deps.clock.now();
    const validation = await this.deps.licenseValidator.validateForAccount(input.accountId, now);
    if (!validation.ok) {
      switch (validation.code) {
        case 'NO_LICENSE_FOR_ACCOUNT':
          throw new NoLicenseForAccountError('no usable license for account');
        case 'LICENSE_EXPIRED':
          throw new SessionLicenseExpiredError('license is expired');
        case 'LICENSE_REVOKED':
          throw new SessionLicenseRevokedError('license is revoked');
      }
    }
    const licenseId: LicenseId = validation.licenseId;
    const licenseExpiresAt = validation.expiresAt;

    const session = await this.deps.uow.run(async (tx) => {
      const existing = await tx.sessions.findByAccountId(input.accountId);
      const fromState = existing?.state ?? null;
      const updated = (
        existing ??
        AutomationSession.createIdle({
          id: asSessionId(this.deps.ids.next()),
          accountId: input.accountId,
          now,
        })
      ).start(now);

      await tx.sessions.save(updated);
      await tx.audit.record({
        actor: input.actorDiscordUserId,
        action: 'session.start',
        targetType: 'session',
        targetId: updated.id,
        correlationId: input.correlationId,
        payload: {
          accountId: input.accountId,
          fromState,
          toState: updated.state,
          licenseId,
        },
      });
      return updated;
    });

    // Phase-2 seam (ADR-0012). NoopAgentRuntime only adapter in Phase 1.
    await this.deps.agentRuntime.start({
      accountId: input.accountId,
      sessionId: session.id,
      correlationId: input.correlationId,
    });

    this.deps.log.info(
      {
        op: 'session.start',
        sessionId: session.id,
        accountId: input.accountId,
        correlationId: input.correlationId,
      },
      'session started',
    );

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
