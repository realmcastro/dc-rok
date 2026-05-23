import type { AccountId, DiscordUserId } from './account-id.js';
import {
  AccountAlreadyLinkedError,
  AccountSuspendedError,
  InvalidAccountStateTransitionError,
} from './errors.js';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'UNLINKED';

export interface AccountSnapshot {
  readonly id: AccountId;
  readonly externalAccountName: string;
  readonly discordUserId: DiscordUserId | null;
  readonly status: AccountStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Internal account aggregate.
 *
 * Invariants:
 *   - status === ACTIVE  ⇔ discordUserId is non-null.
 *   - status === UNLINKED ⇔ discordUserId is null.
 *   - status === SUSPENDED keeps the existing discordUserId (admin action).
 */
export class Account {
  private constructor(private readonly snapshot: AccountSnapshot) {}

  static fromSnapshot(snapshot: AccountSnapshot): Account {
    if (snapshot.status === 'ACTIVE' && snapshot.discordUserId === null) {
      throw new InvalidAccountStateTransitionError(
        'ACTIVE account must have discordUserId',
      );
    }
    if (snapshot.status === 'UNLINKED' && snapshot.discordUserId !== null) {
      throw new InvalidAccountStateTransitionError(
        'UNLINKED account must not have discordUserId',
      );
    }
    if (snapshot.externalAccountName.trim().length === 0) {
      throw new InvalidAccountStateTransitionError('externalAccountName cannot be empty');
    }
    return new Account(snapshot);
  }

  static createLinked(input: {
    id: AccountId;
    externalAccountName: string;
    discordUserId: DiscordUserId;
    now: Date;
  }): Account {
    return Account.fromSnapshot({
      id: input.id,
      externalAccountName: input.externalAccountName.trim(),
      discordUserId: input.discordUserId,
      status: 'ACTIVE',
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  get id(): AccountId {
    return this.snapshot.id;
  }
  get status(): AccountStatus {
    return this.snapshot.status;
  }
  get discordUserId(): DiscordUserId | null {
    return this.snapshot.discordUserId;
  }
  get externalAccountName(): string {
    return this.snapshot.externalAccountName;
  }

  toSnapshot(): AccountSnapshot {
    return {
      ...this.snapshot,
      createdAt: new Date(this.snapshot.createdAt.getTime()),
      updatedAt: new Date(this.snapshot.updatedAt.getTime()),
    };
  }

  unlink(now: Date): Account {
    if (this.snapshot.status === 'SUSPENDED') {
      throw new AccountSuspendedError('suspended accounts cannot be unlinked by the user');
    }
    if (this.snapshot.status === 'UNLINKED') {
      return this;
    }
    return new Account({
      ...this.snapshot,
      discordUserId: null,
      status: 'UNLINKED',
      updatedAt: now,
    });
  }

  relinkTo(discordUserId: DiscordUserId, now: Date): Account {
    if (this.snapshot.status === 'SUSPENDED') {
      throw new AccountSuspendedError('cannot relink a suspended account');
    }
    if (this.snapshot.status === 'ACTIVE') {
      throw new AccountAlreadyLinkedError('account is already linked');
    }
    return new Account({
      ...this.snapshot,
      discordUserId,
      status: 'ACTIVE',
      updatedAt: now,
    });
  }
}
