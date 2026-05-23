import type { Clock } from '../../../shared/index.js';
import { ActivationCodeNotFoundError, LicenseNotFoundError } from '../../domain/errors.js';
import type { ActivationCodeId, LicenseId } from '../../domain/license-id.js';
import { applyRedemption } from '../../domain/redemption-policy.js';
import type { ActivationCodeRepository } from '../ports/activation-code-repository.js';
import type { LicenseHasher } from '../ports/license-hasher.js';
import type { LicenseRepository } from '../ports/license-repository.js';

export interface RedeemRepositories {
  readonly licenses: LicenseRepository;
  readonly codes: ActivationCodeRepository;
}

export interface RedeemInContextInput {
  readonly code: string;
  readonly accountId: string;
}

export interface RedeemInContextOutcome {
  readonly licenseId: LicenseId;
  readonly activationCodeId: ActivationCodeId;
  readonly licenseExpiresAt: Date;
  readonly remainingActivations: number;
}

/**
 * Reusable redemption service that runs INSIDE a caller-owned transaction.
 *
 * Use this when the caller (e.g. account-link's `LinkAccount`) needs the
 * redemption to be atomic with its own writes. Standalone callers should use
 * the `RedeemActivationCode` use-case, which owns its own transaction.
 *
 * This service is the only license-module surface that account-link depends on
 * to perform a redemption — domain entities are NOT re-exported across modules.
 */
export class RedeemInContext {
  constructor(
    private readonly deps: {
      readonly hasher: LicenseHasher;
      readonly clock: Clock;
    },
  ) {}

  async run(repos: RedeemRepositories, input: RedeemInContextInput): Promise<RedeemInContextOutcome> {
    const codeHash = this.deps.hasher.hash(input.code.trim());
    const code = await repos.codes.findByCodeHash(codeHash);
    if (!code) {
      throw new ActivationCodeNotFoundError('activation code not found');
    }
    const license = await repos.licenses.findById(code.licenseId);
    if (!license) {
      throw new LicenseNotFoundError('license attached to code not found');
    }
    const now = this.deps.clock.now();
    const { license: updatedLicense, code: redeemedCode } = applyRedemption({
      license,
      code,
      accountId: input.accountId,
      now,
    });
    await repos.codes.save(redeemedCode);
    await repos.licenses.save(updatedLicense);
    return {
      licenseId: updatedLicense.id,
      activationCodeId: redeemedCode.id,
      licenseExpiresAt: updatedLicense.expiresAt,
      remainingActivations: updatedLicense.maxActivations - updatedLicense.currentActivations,
    };
  }
}
