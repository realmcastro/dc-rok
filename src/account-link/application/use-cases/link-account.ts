import { RedeemInContext } from '../../../license/index.js';
import {
  asCorrelationId,
  InvalidInputError,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type Logger,
} from '../../../shared/index.js';
import { asAccountId, parseDiscordUserId } from '../../domain/account-id.js';
import { Account } from '../../domain/account.js';
import { DiscordUserAlreadyLinkedError } from '../../domain/errors.js';
import type { LinkOutcome } from '../dto/link-outcome.js';
import type { LinkUnitOfWork } from '../ports/link-unit-of-work.js';

export interface LinkAccountInput {
  readonly code: string;
  readonly discordUserId: string;
  readonly externalAccountName: string;
  readonly correlationId: CorrelationId;
}

interface Deps {
  readonly uow: LinkUnitOfWork;
  readonly redeemInContext: RedeemInContext;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly log: Logger;
}

export class LinkAccount {
  constructor(private readonly deps: Deps) {}

  async run(input: LinkAccountInput): Promise<LinkOutcome> {
    const code = input.code.trim();
    const name = input.externalAccountName.trim();
    if (code.length === 0) {
      throw new InvalidInputError('activation code is required');
    }
    if (name.length === 0) {
      throw new InvalidInputError('externalAccountName is required');
    }
    const discordUserId = parseDiscordUserId(input.discordUserId);

    return await this.deps.uow.run(async (tx) => {
      // 1. Reject if this Discord user is already linked to ANY account.
      const existing = await tx.accounts.findByDiscordUserId(discordUserId);
      if (existing !== null) {
        throw new DiscordUserAlreadyLinkedError(
          `Discord user ${discordUserId} is already linked to an account`,
        );
      }

      // 2. Build the Account (id is required by the license redemption call below).
      const account = Account.createLinked({
        id: asAccountId(this.deps.ids.next()),
        externalAccountName: name,
        discordUserId,
        now: this.deps.clock.now(),
      });

      // 3. Redeem the activation code in the same transaction.
      const redemption = await this.deps.redeemInContext.run(
        { licenses: tx.licenses, codes: tx.codes },
        { code, accountId: account.id },
      );

      // 4. Persist the account.
      await tx.accounts.save(account);

      // 5. Audit. Payload deliberately omits the plaintext code.
      await tx.audit.record({
        actor: discordUserId,
        action: 'account.link',
        targetType: 'account',
        targetId: account.id,
        correlationId: input.correlationId,
        payload: {
          licenseId: redemption.licenseId,
          activationCodeId: redemption.activationCodeId,
          externalAccountName: account.externalAccountName,
        },
      });

      this.deps.log.info(
        {
          op: 'account.link',
          accountId: account.id,
          licenseId: redemption.licenseId,
          correlationId: input.correlationId,
          remainingActivations: redemption.remainingActivations,
        },
        'account linked',
      );

      return {
        accountId: account.id,
        licenseId: redemption.licenseId,
        licenseExpiresAt: redemption.licenseExpiresAt,
        remainingActivations: redemption.remainingActivations,
        externalAccountName: account.externalAccountName,
      };
    });
  }
}

/** Helper to assist test fixtures that need to mint correlation ids. */
export function correlationIdFromString(s: string): CorrelationId {
  return asCorrelationId(s);
}
