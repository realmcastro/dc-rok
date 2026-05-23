import type { Clock, IdGenerator, Logger } from '../../../shared/index.js';
import { InvalidInputError } from '../../../shared/index.js';
import { ActivationCode } from '../../domain/activation-code.js';
import { asActivationCodeId, asLicenseId } from '../../domain/license-id.js';
import { License } from '../../domain/license.js';
import type { IssuedLicense } from '../dto/issued-license.js';
import type { ActivationCodeFactory } from '../ports/activation-code-factory.js';
import type { ActivationCodeRepository } from '../ports/activation-code-repository.js';
import type { LicenseHasher } from '../ports/license-hasher.js';
import type { LicenseRepository } from '../ports/license-repository.js';

export interface IssueLicenseInput {
  readonly issuerDiscordUserId: string;
  readonly expiresAt: Date;
  readonly maxActivations: number;
  /** How many activation codes to mint and return in plaintext. */
  readonly codesToGenerate: number;
}

interface Deps {
  readonly licenses: LicenseRepository;
  readonly codes: ActivationCodeRepository;
  readonly hasher: LicenseHasher;
  readonly codeFactory: ActivationCodeFactory;
  readonly ids: IdGenerator;
  readonly clock: Clock;
  readonly log: Logger;
}

export class IssueLicense {
  constructor(private readonly deps: Deps) {}

  async run(input: IssueLicenseInput): Promise<IssuedLicense> {
    if (input.maxActivations < 1) {
      throw new InvalidInputError('maxActivations must be >= 1');
    }
    if (input.codesToGenerate < 1 || input.codesToGenerate > input.maxActivations) {
      throw new InvalidInputError('codesToGenerate must be between 1 and maxActivations');
    }
    const now = this.deps.clock.now();
    if (input.expiresAt.getTime() <= now.getTime()) {
      throw new InvalidInputError('expiresAt must be in the future');
    }

    // The license itself doesn't have a plaintext "key" surfaced anywhere
    // in Phase 1; the keyHash is derived from a random server-side secret so
    // future flows that need a license-level token can hash and compare.
    const licenseSecret = this.deps.codeFactory.generate();
    const license = License.fromSnapshot({
      id: asLicenseId(this.deps.ids.next()),
      keyHash: this.deps.hasher.hash(licenseSecret),
      status: 'ACTIVE',
      expiresAt: input.expiresAt,
      maxActivations: input.maxActivations,
      currentActivations: 0,
      createdBy: input.issuerDiscordUserId,
      createdAt: now,
      updatedAt: now,
    });

    const plaintextCodes: { id: ReturnType<typeof asActivationCodeId>; code: string }[] = [];
    const codeEntities: ActivationCode[] = [];
    for (let i = 0; i < input.codesToGenerate; i += 1) {
      const plaintext = this.deps.codeFactory.generate();
      const id = asActivationCodeId(this.deps.ids.next());
      codeEntities.push(
        ActivationCode.fromSnapshot({
          id,
          codeHash: this.deps.hasher.hash(plaintext),
          licenseId: license.id,
          redeemedAt: null,
          redeemedByAccountId: null,
          createdAt: now,
          updatedAt: now,
        }),
      );
      plaintextCodes.push({ id, code: plaintext });
    }

    await this.deps.licenses.save(license);
    for (const code of codeEntities) {
      await this.deps.codes.save(code);
    }

    this.deps.log.info(
      {
        op: 'license.issue',
        licenseId: license.id,
        issuer: input.issuerDiscordUserId,
        maxActivations: input.maxActivations,
        codesGenerated: codeEntities.length,
        expiresAt: input.expiresAt.toISOString(),
      },
      'license issued',
    );

    return {
      licenseId: license.id,
      expiresAt: license.expiresAt,
      maxActivations: license.maxActivations,
      activationCodes: plaintextCodes,
    };
  }
}
