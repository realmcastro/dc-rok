import { DomainError, NotFoundError } from '../../shared/index.js';

export class SessionNotFoundError extends NotFoundError {
  override readonly code = 'SESSION_NOT_FOUND';
}

export class InvalidSessionStateTransitionError extends DomainError {
  readonly code = 'INVALID_SESSION_STATE_TRANSITION';
}
