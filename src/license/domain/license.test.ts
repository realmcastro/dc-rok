import { describe, expect, it } from 'vitest';

import {
  InvalidLicenseStateTransitionError,
  LicenseExhaustedError,
  LicenseExpiredError,
  LicenseRevokedError,
} from './errors.js';
import { asLicenseId } from './license-id.js';
import { License, type LicenseSnapshot } from './license.js';

const NOW = new Date('2026-05-23T12:00:00Z');
const FUTURE = new Date('2026-12-31T23:59:59Z');
const PAST = new Date('2026-01-01T00:00:00Z');

function snapshot(overrides: Partial<LicenseSnapshot> = {}): LicenseSnapshot {
  return {
    id: asLicenseId('01ABC0000000000000000000AA'),
    keyHash: 'h',
    status: 'ACTIVE',
    expiresAt: FUTURE,
    maxActivations: 3,
    currentActivations: 0,
    createdBy: '111111111111111111',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('License', () => {
  it('canRedeem on a healthy license', () => {
    const l = License.fromSnapshot(snapshot());
    expect(l.canRedeem(NOW)).toBe(true);
  });

  it('rejects construction with invalid currentActivations', () => {
    expect(() =>
      License.fromSnapshot(snapshot({ currentActivations: -1 })),
    ).toThrow(InvalidLicenseStateTransitionError);
    expect(() =>
      License.fromSnapshot(snapshot({ currentActivations: 5, maxActivations: 3 })),
    ).toThrow(InvalidLicenseStateTransitionError);
  });

  it('rejects construction with maxActivations < 1', () => {
    expect(() => License.fromSnapshot(snapshot({ maxActivations: 0 }))).toThrow(
      InvalidLicenseStateTransitionError,
    );
  });

  it('consumeActivation bumps the counter and updatedAt', () => {
    const l = License.fromSnapshot(snapshot({ currentActivations: 1 }));
    const after = l.consumeActivation(NOW);
    expect(after.currentActivations).toBe(2);
    expect(after.toSnapshot().updatedAt.getTime()).toBe(NOW.getTime());
  });

  it('consumeActivation throws on exhausted license', () => {
    const l = License.fromSnapshot(snapshot({ currentActivations: 3 }));
    expect(() => l.consumeActivation(NOW)).toThrow(LicenseExhaustedError);
  });

  it('consumeActivation throws on expired license (by date)', () => {
    const l = License.fromSnapshot(snapshot({ expiresAt: PAST }));
    expect(() => l.consumeActivation(NOW)).toThrow(LicenseExpiredError);
  });

  it('consumeActivation throws on revoked license', () => {
    const l = License.fromSnapshot(snapshot({ status: 'REVOKED' }));
    expect(() => l.consumeActivation(NOW)).toThrow(LicenseRevokedError);
  });

  it('revoke is idempotent and updates timestamp on first call', () => {
    const l = License.fromSnapshot(snapshot());
    const r1 = l.revoke(NOW);
    expect(r1.status).toBe('REVOKED');
    const r2 = r1.revoke(new Date('2099-01-01T00:00:00Z'));
    expect(r2).toBe(r1);
  });

  it('markExpiredIfDue only flips when past expiry', () => {
    const l = License.fromSnapshot(snapshot({ expiresAt: PAST }));
    expect(l.markExpiredIfDue(NOW).status).toBe('EXPIRED');
    const healthy = License.fromSnapshot(snapshot());
    expect(healthy.markExpiredIfDue(NOW).status).toBe('ACTIVE');
  });

  it('returns defensive copies of expiresAt', () => {
    const l = License.fromSnapshot(snapshot());
    const e = l.expiresAt;
    e.setFullYear(2099);
    expect(l.expiresAt.getUTCFullYear()).toBe(2026);
  });
});
