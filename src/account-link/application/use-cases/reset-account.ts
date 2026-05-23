import type { AgentRuntimePort } from '../../../session/index.js';
import type { Clock, CorrelationId, Logger } from '../../../shared/index.js';
import { parseDiscordUserId } from '../../domain/account-id.js';
import { AccountNotFoundError } from '../../domain/errors.js';
import type { ResetOutcome } from '../dto/reset-outcome.js';
import type { ResetUnitOfWork } from '../ports/reset-unit-of-work.js';

export interface ResetAccountInput {
  readonly discordUserId: string;
  readonly correlationId: CorrelationId;
}

interface Deps {
  readonly uow: ResetUnitOfWork;
  readonly agentRuntime: AgentRuntimePort;
  readonly clock: Clock;
  readonly log: Logger;
}

/**
 * Unlinks a Discord user from their account and stops any active session.
 * Destructive action — callers should confirm before invoking.
 */
export class ResetAccount {
  constructor(private readonly deps: Deps) {}

  async run(input: ResetAccountInput): Promise<ResetOutcome> {
    const discordUserId = parseDiscordUserId(input.discordUserId);
    const now = this.deps.clock.now();

    const result = await this.deps.uow.run(async (tx) => {
      const account = await tx.accounts.findByDiscordUserId(discordUserId);
      if (!account) {
        throw new AccountNotFoundError('no account linked to this Discord user');
      }

      // Stop active session if one exists
      let sessionWasStopped = false;
      const session = await tx.sessions.findByAccountId(account.id);
      if (session?.state === 'ACTIVE') {
        const stopped = session.stop(now);
        await tx.sessions.save(stopped);
        await tx.audit.record({
          actor: discordUserId,
          action: 'session.stop',
          targetType: 'session',
          targetId: stopped.id,
          correlationId: input.correlationId,
          payload: {
            accountId: account.id,
            fromState: 'ACTIVE',
            toState: stopped.state,
            reason: 'account_reset',
          },
        });
        sessionWasStopped = true;
      }

      // Unlink account
      const unlinked = account.unlink(now);
      await tx.accounts.save(unlinked);
      await tx.audit.record({
        actor: discordUserId,
        action: 'account.unlink',
        targetType: 'account',
        targetId: account.id,
        correlationId: input.correlationId,
        payload: {
          externalAccountName: account.externalAccountName,
          sessionWasStopped,
        },
      });

      return {
        accountId: account.id,
        externalAccountName: account.externalAccountName,
        sessionWasStopped,
        sessionId: session?.id ?? null,
      };
    });

    // Phase-2 seam: signal agent runtime outside transaction
    if (result.sessionWasStopped && result.sessionId) {
      await this.deps.agentRuntime.stop({
        accountId: result.accountId,
        sessionId: result.sessionId,
        correlationId: input.correlationId,
      });
    }

    this.deps.log.info(
      {
        op: 'account.reset',
        accountId: result.accountId,
        sessionWasStopped: result.sessionWasStopped,
        correlationId: input.correlationId,
      },
      'account reset',
    );

    return {
      accountId: result.accountId,
      externalAccountName: result.externalAccountName,
      sessionWasStopped: result.sessionWasStopped,
    };
  }
}
