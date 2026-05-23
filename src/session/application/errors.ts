import { DomainError } from '../../shared/index.js';

export class NoLicenseForAccountError extends DomainError {
  readonly code = 'NO_LICENSE_FOR_ACCOUNT';
}

export class SessionLicenseExpiredError extends DomainError {
  readonly code = 'LICENSE_EXPIRED';
}

export class SessionLicenseRevokedError extends DomainError {
  readonly code = 'LICENSE_REVOKED';
}
