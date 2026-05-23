import type { AuditWriter } from '../../../audit/index.js';
import type { ActivationCodeRepository, LicenseRepository } from '../../../license/index.js';
import type { AccountRepository } from './account-repository.js';

/**
 * Cross-module transactional context for `LinkAccount` (and future `UnlinkAccount`).
 *
 * Contains application-layer ports from `account-link`, `license`, and `audit`,
 * all backed by repositories scoped to a single DB transaction. This is the
 * sanctioned cross-module boundary: each module exposes its repository
 * interface, and bootstrap wires Prisma-backed implementations into one tx.
 */
export interface LinkTxContext {
  readonly accounts: AccountRepository;
  readonly licenses: LicenseRepository;
  readonly codes: ActivationCodeRepository;
  readonly audit: AuditWriter;
}

export interface LinkUnitOfWork {
  run<T>(callback: (tx: LinkTxContext) => Promise<T>): Promise<T>;
}
