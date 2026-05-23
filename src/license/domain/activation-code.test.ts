import { describe, expect, it } from 'vitest';

import { ActivationCode } from './activation-code.js';
import { ActivationCodeAlreadyRedeemedError } from './errors.js';
import { asActivationCodeId, asLicenseId } from './license-id.js';

const NOW = new Date('2026-05-23T12:00:00Z');

function fresh(): ActivationCode {
  return ActivationCode.fromSnapshot({
    id: asActivationCodeId('01ABC0000000000000000000CC'),
    codeHash: 'h',
    licenseId: asLicenseId('01ABC0000000000000000000LL'),
    redeemedAt: null,
    redeemedByAccountId: null,
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('ActivationCode', () => {
  it('redeem marks the code with account id + timestamp', () => {
    const c = fresh().redeem('acct-1', NOW);
    expect(c.isRedeemed).toBe(true);
    expect(c.toSnapshot().redeemedByAccountId).toBe('acct-1');
    expect(c.toSnapshot().redeemedAt?.getTime()).toBe(NOW.getTime());
  });

  it('redeeming twice throws ActivationCodeAlreadyRedeemedError', () => {
    const c = fresh().redeem('acct-1', NOW);
    expect(() => c.redeem('acct-2', NOW)).toThrow(ActivationCodeAlreadyRedeemedError);
  });

  it('toSnapshot returns defensive copies of dates', () => {
    const c = fresh();
    const snap = c.toSnapshot();
    snap.createdAt.setFullYear(2099);
    expect(c.toSnapshot().createdAt.getUTCFullYear()).toBe(2026);
  });
});
