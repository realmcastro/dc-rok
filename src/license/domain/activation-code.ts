import { ActivationCodeAlreadyRedeemedError } from './errors.js';
import type { ActivationCodeId, LicenseId } from './license-id.js';

export interface ActivationCodeSnapshot {
  readonly id: ActivationCodeId;
  readonly codeHash: string;
  readonly licenseId: LicenseId;
  readonly redeemedAt: Date | null;
  /** Opaque account identifier owned by the account-link module. */
  readonly redeemedByAccountId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class ActivationCode {
  private constructor(private readonly snapshot: ActivationCodeSnapshot) {}

  static fromSnapshot(snapshot: ActivationCodeSnapshot): ActivationCode {
    return new ActivationCode(snapshot);
  }

  get id(): ActivationCodeId {
    return this.snapshot.id;
  }
  get licenseId(): LicenseId {
    return this.snapshot.licenseId;
  }
  get isRedeemed(): boolean {
    return this.snapshot.redeemedAt !== null;
  }
  toSnapshot(): ActivationCodeSnapshot {
    return {
      ...this.snapshot,
      redeemedAt:
        this.snapshot.redeemedAt === null ? null : new Date(this.snapshot.redeemedAt.getTime()),
      createdAt: new Date(this.snapshot.createdAt.getTime()),
      updatedAt: new Date(this.snapshot.updatedAt.getTime()),
    };
  }

  redeem(accountId: string, now: Date): ActivationCode {
    if (this.snapshot.redeemedAt !== null) {
      throw new ActivationCodeAlreadyRedeemedError(
        `activation code ${this.snapshot.id} is already redeemed`,
      );
    }
    return new ActivationCode({
      ...this.snapshot,
      redeemedAt: now,
      redeemedByAccountId: accountId,
      updatedAt: now,
    });
  }
}
