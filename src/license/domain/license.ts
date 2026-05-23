import {
  InvalidLicenseStateTransitionError,
  LicenseExhaustedError,
  LicenseExpiredError,
  LicenseRevokedError,
} from './errors.js';
import type { LicenseId } from './license-id.js';

export type LicenseStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface LicenseSnapshot {
  readonly id: LicenseId;
  readonly keyHash: string;
  readonly status: LicenseStatus;
  readonly expiresAt: Date;
  readonly maxActivations: number;
  readonly currentActivations: number;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Aggregate root for a license. All mutations return a new License — the
 * entity is immutable to keep state transitions explicit.
 */
export class License {
  private constructor(private readonly snapshot: LicenseSnapshot) {}

  static fromSnapshot(snapshot: LicenseSnapshot): License {
    if (snapshot.maxActivations < 1) {
      throw new InvalidLicenseStateTransitionError('maxActivations must be >= 1');
    }
    if (snapshot.currentActivations < 0 || snapshot.currentActivations > snapshot.maxActivations) {
      throw new InvalidLicenseStateTransitionError('currentActivations out of range');
    }
    return new License(snapshot);
  }

  get id(): LicenseId {
    return this.snapshot.id;
  }
  get status(): LicenseStatus {
    return this.snapshot.status;
  }
  get expiresAt(): Date {
    return new Date(this.snapshot.expiresAt.getTime());
  }
  get maxActivations(): number {
    return this.snapshot.maxActivations;
  }
  get currentActivations(): number {
    return this.snapshot.currentActivations;
  }
  toSnapshot(): LicenseSnapshot {
    return {
      ...this.snapshot,
      expiresAt: new Date(this.snapshot.expiresAt.getTime()),
      createdAt: new Date(this.snapshot.createdAt.getTime()),
      updatedAt: new Date(this.snapshot.updatedAt.getTime()),
    };
  }

  /**
   * True when the license could redeem one more activation as of `now`.
   * Does NOT mutate; pair with `consumeActivation` to perform the change.
   */
  canRedeem(now: Date): boolean {
    return (
      this.snapshot.status === 'ACTIVE' &&
      now.getTime() < this.snapshot.expiresAt.getTime() &&
      this.snapshot.currentActivations < this.snapshot.maxActivations
    );
  }

  /**
   * Throws the most specific reason the license is not usable, or no-ops.
   */
  assertRedeemable(now: Date): void {
    if (this.snapshot.status === 'REVOKED') {
      throw new LicenseRevokedError(`license ${this.snapshot.id} is revoked`);
    }
    if (this.snapshot.status === 'EXPIRED' || now.getTime() >= this.snapshot.expiresAt.getTime()) {
      throw new LicenseExpiredError(`license ${this.snapshot.id} is expired`);
    }
    if (this.snapshot.currentActivations >= this.snapshot.maxActivations) {
      throw new LicenseExhaustedError(`license ${this.snapshot.id} has no activations left`);
    }
  }

  consumeActivation(now: Date): License {
    this.assertRedeemable(now);
    return new License({
      ...this.snapshot,
      currentActivations: this.snapshot.currentActivations + 1,
      updatedAt: now,
    });
  }

  revoke(now: Date): License {
    if (this.snapshot.status === 'REVOKED') {
      return this;
    }
    return new License({ ...this.snapshot, status: 'REVOKED', updatedAt: now });
  }

  markExpiredIfDue(now: Date): License {
    if (this.snapshot.status === 'EXPIRED') return this;
    if (now.getTime() < this.snapshot.expiresAt.getTime()) return this;
    return new License({ ...this.snapshot, status: 'EXPIRED', updatedAt: now });
  }
}
