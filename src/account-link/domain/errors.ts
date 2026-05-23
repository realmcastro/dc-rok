import { ConflictError, DomainError, NotFoundError } from '../../shared/index.js';

export class AccountNotFoundError extends NotFoundError {
  override readonly code = 'ACCOUNT_NOT_FOUND';
}

export class DiscordUserAlreadyLinkedError extends ConflictError {
  override readonly code = 'DISCORD_USER_ALREADY_LINKED';
}

export class AccountAlreadyLinkedError extends ConflictError {
  override readonly code = 'ACCOUNT_ALREADY_LINKED';
}

export class AccountSuspendedError extends DomainError {
  readonly code = 'ACCOUNT_SUSPENDED';
}

export class InvalidAccountStateTransitionError extends DomainError {
  readonly code = 'INVALID_ACCOUNT_STATE_TRANSITION';
}
