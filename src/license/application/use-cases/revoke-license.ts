import type { Clock, Logger } from '../../../shared/index.js';
import { LicenseNotFoundError } from '../../domain/errors.js';
import type { LicenseId } from '../../domain/license-id.js';
import type { LicenseRepository } from '../ports/license-repository.js';

export interface RevokeLicenseInput {
  readonly licenseId: LicenseId;
  readonly revokedByDiscordUserId: string;
}

interface Deps {
  readonly licenses: LicenseRepository;
  readonly clock: Clock;
  readonly log: Logger;
}

export class RevokeLicense {
  constructor(private readonly deps: Deps) {}

  async run(input: RevokeLicenseInput): Promise<void> {
    const license = await this.deps.licenses.findById(input.licenseId);
    if (!license) {
      throw new LicenseNotFoundError(`license ${input.licenseId} not found`);
    }

    const now = this.deps.clock.now();
    const revoked = license.revoke(now);
    await this.deps.licenses.save(revoked);

    this.deps.log.info(
      {
        op: 'license.revoke',
        licenseId: input.licenseId,
        actor: input.revokedByDiscordUserId,
      },
      'license revoked',
    );
  }
}
