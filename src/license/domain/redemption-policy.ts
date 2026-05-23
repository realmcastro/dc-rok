import type { ActivationCode } from './activation-code.js';
import type { License } from './license.js';

/**
 * Pure rule application for redeeming an activation code.
 *
 * Loaded entities + `now` + `accountId` are inputs; updated entities are output.
 * Throws domain errors when the license is unredeemable.
 *
 * Used by:
 *   - `license.RedeemActivationCode` use-case (standalone)
 *   - `account-link.LinkAccount` use-case (composed with Account creation in one tx)
 *
 * Living here ensures both call sites enforce the same invariants without
 * the account-link module reaching into license's application layer.
 */
export interface RedemptionInput {
  readonly license: License;
  readonly code: ActivationCode;
  readonly accountId: string;
  readonly now: Date;
}

export interface RedemptionOutcome {
  readonly license: License;
  readonly code: ActivationCode;
}

export function applyRedemption(input: RedemptionInput): RedemptionOutcome {
  // `consumeActivation` performs the full `assertRedeemable` check internally.
  const updatedLicense = input.license.consumeActivation(input.now);
  const redeemedCode = input.code.redeem(input.accountId, input.now);
  return { license: updatedLicense, code: redeemedCode };
}
