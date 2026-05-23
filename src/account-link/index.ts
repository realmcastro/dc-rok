export {
  asAccountId,
  parseDiscordUserId,
  type AccountId,
  type DiscordUserId,
} from './domain/account-id.js';

export {
  AccountAlreadyLinkedError,
  AccountNotFoundError,
  AccountSuspendedError,
  DiscordUserAlreadyLinkedError,
  InvalidAccountStateTransitionError,
} from './domain/errors.js';

export type { LinkOutcome } from './application/dto/link-outcome.js';

export type { AccountRepository } from './application/ports/account-repository.js';
export type {
  LinkTxContext,
  LinkUnitOfWork,
} from './application/ports/link-unit-of-work.js';

export { LinkAccount, type LinkAccountInput } from './application/use-cases/link-account.js';
export { LookupAccountByDiscordUser } from './application/use-cases/lookup-account-by-discord-user.js';

export { PrismaAccountRepository } from './infrastructure/prisma-account-repository.js';
export { PrismaLinkUnitOfWork } from './infrastructure/prisma-link-unit-of-work.js';
export { InMemoryAccountRepository } from './infrastructure/in-memory-account-repository.js';
export { InMemoryLinkUnitOfWork } from './infrastructure/in-memory-link-unit-of-work.js';
