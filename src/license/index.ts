// Domain types intentionally NOT re-exported here. Other modules must use DTOs.
export {
  asActivationCodeId,
  asLicenseId,
  type ActivationCodeId,
  type LicenseId,
} from './domain/license-id.js';

export { applyRedemption, type RedemptionInput, type RedemptionOutcome } from './domain/redemption-policy.js';

export {
  ActivationCodeAlreadyRedeemedError,
  ActivationCodeNotFoundError,
  InvalidLicenseStateTransitionError,
  LicenseExhaustedError,
  LicenseExpiredError,
  LicenseNotFoundError,
  LicenseRevokedError,
} from './domain/errors.js';

export type { IssuedLicense, RedeemedActivationOutcome } from './application/dto/issued-license.js';

export { IssueLicense, type IssueLicenseInput } from './application/use-cases/issue-license.js';
export {
  RedeemActivationCode,
  type RedeemActivationCodeInput,
} from './application/use-cases/redeem-activation-code.js';
export { RevokeLicense, type RevokeLicenseInput } from './application/use-cases/revoke-license.js';
export {
  RedeemInContext,
  type RedeemInContextInput,
  type RedeemInContextOutcome,
  type RedeemRepositories,
} from './application/services/redeem-in-context.js';
export { LicenseValidationService } from './application/services/license-validation-service.js';
export type {
  LicenseValidator,
  LicenseValidationResult,
  LicenseValidationFailure,
} from './application/ports/license-validator.js';

export type { LicenseRepository } from './application/ports/license-repository.js';
export type { ActivationCodeRepository } from './application/ports/activation-code-repository.js';
export type { LicenseHasher } from './application/ports/license-hasher.js';
export type { ActivationCodeFactory } from './application/ports/activation-code-factory.js';
export type {
  LicenseTxContext,
  LicenseUnitOfWork,
} from './application/ports/unit-of-work.js';

export { HmacLicenseHasher } from './infrastructure/hmac-license-hasher.js';
export { RandomActivationCodeFactory } from './infrastructure/random-activation-code-factory.js';
export { PrismaLicenseRepository } from './infrastructure/prisma-license-repository.js';
export { PrismaActivationCodeRepository } from './infrastructure/prisma-activation-code-repository.js';
export { PrismaLicenseUnitOfWork } from './infrastructure/prisma-unit-of-work.js';

// Test-only in-memory adapters. Production code MUST NOT depend on these.
export { InMemoryLicenseRepository } from './infrastructure/in-memory/in-memory-license-repository.js';
export { InMemoryActivationCodeRepository } from './infrastructure/in-memory/in-memory-activation-code-repository.js';
export { InMemoryLicenseUnitOfWork } from './infrastructure/in-memory/in-memory-unit-of-work.js';
