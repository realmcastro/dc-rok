import type { AccountId } from '../../domain/account-id.js';

export interface ResetOutcome {
  readonly accountId: AccountId;
  readonly externalAccountName: string;
  readonly sessionWasStopped: boolean;
}
