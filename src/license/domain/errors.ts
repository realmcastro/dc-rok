import { ConflictError, DomainError, NotFoundError } from '../../shared/index.js';

export class LicenseNotFoundError extends NotFoundError {
  override readonly code = 'LICENSE_NOT_FOUND';
}

export class ActivationCodeNotFoundError extends NotFoundError {
  override readonly code = 'ACTIVATION_CODE_NOT_FOUND';
}

export class LicenseExpiredError extends DomainError {
  readonly code = 'LICENSE_EXPIRED';
}

export class LicenseRevokedError extends DomainError {
  readonly code = 'LICENSE_REVOKED';
}

export class LicenseExhaustedError extends DomainError {
  readonly code = 'LICENSE_EXHAUSTED';
}

export class ActivationCodeAlreadyRedeemedError extends ConflictError {
  override readonly code = 'ACTIVATION_CODE_ALREADY_REDEEMED';
}

export class InvalidLicenseStateTransitionError extends DomainError {
  readonly code = 'INVALID_LICENSE_STATE_TRANSITION';
}
