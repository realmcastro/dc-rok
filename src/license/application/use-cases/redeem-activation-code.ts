import type { Clock, Logger } from '../../../shared/index.js';
import { InvalidInputError } from '../../../shared/index.js';
import { ActivationCodeNotFoundError, LicenseNotFoundError } from '../../domain/errors.js';
import { applyRedemption } from '../../domain/redemption-policy.js';
import type { RedeemedActivationOutcome } from '../dto/issued-license.js';
import type { LicenseHasher } from '../ports/license-hasher.js';
import type { LicenseUnitOfWork } from '../ports/unit-of-work.js';

export interface RedeemActivationCodeInput {
  /** Plaintext code typed by the user. Hashed in this use-case. */
  readonly code: string;
  /** Opaque account identifier owned by the account-link module. */
  readonly accountId: string;
}

interface Deps {
  readonly uow: LicenseUnitOfWork;
  readonly hasher: LicenseHasher;
  readonly clock: Clock;
  readonly log: Logger;
}

export class RedeemActivationCode {
  constructor(private readonly deps: Deps) {}

  async run(input: RedeemActivationCodeInput): Promise<RedeemedActivationOutcome> {
    const trimmed = input.code.trim();
    if (trimmed.length === 0) {
      throw new InvalidInputError('activation code is required');
    }
    if (input.accountId.trim().length === 0) {
      throw new InvalidInputError('accountId is required');
    }

    const codeHash = this.deps.hasher.hash(trimmed);
    const now = this.deps.clock.now();

    return await this.deps.uow.run(async (tx) => {
      const code = await tx.codes.findByCodeHash(codeHash);
      if (!code) {
        throw new ActivationCodeNotFoundError('activation code not found');
      }

      const license = await tx.licenses.findById(code.licenseId);
      if (!license) {
        throw new LicenseNotFoundError('license attached to code not found');
      }

      const { license: updatedLicense, code: redeemedCode } = applyRedemption({
        license,
        code,
        accountId: input.accountId,
        now,
      });

      await tx.codes.save(redeemedCode);
      await tx.licenses.save(updatedLicense);

      this.deps.log.info(
        {
          op: 'license.redeem',
          licenseId: updatedLicense.id,
          activationCodeId: redeemedCode.id,
          remainingActivations:
            updatedLicense.maxActivations - updatedLicense.currentActivations,
        },
        'activation code redeemed',
      );

      return {
        licenseId: updatedLicense.id,
        activationCodeId: redeemedCode.id,
        licenseExpiresAt: updatedLicense.expiresAt,
        remainingActivations:
          updatedLicense.maxActivations - updatedLicense.currentActivations,
      };
    });
  }
}
